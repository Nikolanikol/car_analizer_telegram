import * as fs from 'fs';
import * as path from 'path';

const DATA_DIR = process.env.DATA_DIR || './data';
const DB_PATH = path.join(DATA_DIR, 'db.json');

export const FREE_REQUESTS = parseInt(process.env.FREE_REQUESTS || '10');

interface UserData {
  requestBalance: number;
  activatedKeys: string[];
  firstName: string;
  lastName: string | null;
  username: string | null;
  joinedAt: string;
  language: 'ru' | 'en';
}

export interface KeyData {
  used: boolean;
  usedBy: number | null;
  requestLimit: number | null;  // null = unlimited access; number = requests to credit
  expiresAt: string | null;     // unlimited: access expires; limited: activation deadline
  createdAt: string;
}

interface DB {
  users: Record<string, UserData>;
  keys: Record<string, KeyData>;
}

function migrateDB(raw: any): DB {
  const db: DB = { users: {}, keys: {} };

  for (const [k, v] of Object.entries(raw.keys || {})) {
    const old = v as any;
    db.keys[k] = {
      used: old.used ?? false,
      usedBy: old.usedBy ?? null,
      requestLimit: old.requestLimit ?? null,
      expiresAt: old.expiresAt ?? null,
      createdAt: old.createdAt ?? new Date().toISOString(),
    };
  }

  for (const [uid, v] of Object.entries(raw.users || {})) {
    const old = v as any;

    // Already migrated to new format
    if (Array.isArray(old.activatedKeys)) {
      db.users[uid] = {
        requestBalance: old.requestBalance ?? FREE_REQUESTS,
        activatedKeys: old.activatedKeys,
        firstName: old.firstName ?? '—',
        lastName: old.lastName ?? null,
        username: old.username ?? null,
        joinedAt: old.joinedAt ?? new Date().toISOString(),
        language: old.language ?? 'ru',
      };
      continue;
    }

    // Old format: activated boolean + requestCount
    let activatedKeys: string[] = [];
    let requestBalance: number;

    if (old.activated || old.activatedKey) {
      const keyId = old.activatedKey ?? (() => {
        const userId = parseInt(uid);
        for (const [k, kd] of Object.entries(db.keys)) {
          if ((kd as KeyData).usedBy === userId) return k;
        }
        return null;
      })();
      if (keyId) activatedKeys = [keyId];
      // Give free quota as fallback for when unlimited key expires
      requestBalance = FREE_REQUESTS;
    } else {
      requestBalance = Math.max(0, FREE_REQUESTS - (old.requestCount ?? 0));
    }

    db.users[uid] = { requestBalance, activatedKeys, firstName: '—', lastName: null, username: null, joinedAt: new Date().toISOString(), language: 'ru' };
  }

  return db;
}

function loadDB(): DB {
  try {
    if (!fs.existsSync(DATA_DIR)) fs.mkdirSync(DATA_DIR, { recursive: true });
    if (!fs.existsSync(DB_PATH)) return { users: {}, keys: {} };
    return migrateDB(JSON.parse(fs.readFileSync(DB_PATH, 'utf-8')));
  } catch (e: any) {
    console.error(`[storage] Ошибка загрузки базы данных: ${e.message}`);
    return { users: {}, keys: {} };
  }
}

function saveDB(db: DB): void {
  try {
    if (!fs.existsSync(DATA_DIR)) fs.mkdirSync(DATA_DIR, { recursive: true });
    fs.writeFileSync(DB_PATH, JSON.stringify(db, null, 2));
  } catch (e: any) {
    console.error(`[storage] Ошибка сохранения базы данных: ${e.message}`);
  }
}

let db: DB = loadDB();
console.log(`[storage] База данных загружена: ${Object.keys(db.users).length} пользователей, ${Object.keys(db.keys).length} ключей`);

function ensureUser(userId: number): UserData {
  if (!db.users[String(userId)]) {
    db.users[String(userId)] = {
      requestBalance: FREE_REQUESTS,
      activatedKeys: [],
      firstName: '—',
      lastName: null,
      username: null,
      joinedAt: new Date().toISOString(),
      language: 'ru',
    };
  }
  return db.users[String(userId)];
}

export interface UserProfile {
  firstName: string;
  lastName?: string | null;
  username?: string | null;
}

export function getUserLanguage(userId: number): 'ru' | 'en' {
  return db.users[String(userId)]?.language ?? 'ru';
}

export function setUserLanguage(userId: number, lang: 'ru' | 'en'): void {
  const user = ensureUser(userId);
  user.language = lang;
  saveDB(db);
}

export function saveUserProfile(userId: number, profile: UserProfile): void {
  const user = ensureUser(userId);
  user.firstName = profile.firstName;
  user.lastName = profile.lastName ?? null;
  user.username = profile.username ?? null;
  saveDB(db);
}

// Returns the active unlimited key for this user, if any
function getUnlimitedKey(userId: number): KeyData | null {
  const user = db.users[String(userId)];
  if (!user) return null;
  for (const k of user.activatedKeys) {
    const key = db.keys[k];
    if (key && key.requestLimit === null) {
      if (!key.expiresAt || new Date() <= new Date(key.expiresAt)) return key;
    }
  }
  return null;
}

export function getUser(userId: number): UserData {
  return db.users[String(userId)] ?? { requestBalance: FREE_REQUESTS, activatedKeys: [] };
}

export function getUnlimitedAccess(userId: number): { active: boolean; expiresAt: string | null } {
  const key = getUnlimitedKey(userId);
  if (key) return { active: true, expiresAt: key.expiresAt };
  return { active: false, expiresAt: null };
}

export function canMakeRequest(userId: number): boolean {
  if (getUnlimitedKey(userId)) return true;
  return getUser(userId).requestBalance > 0;
}

export function incrementRequest(userId: number): void {
  const user = ensureUser(userId);
  if (!getUnlimitedKey(userId)) {
    user.requestBalance = Math.max(0, user.requestBalance - 1);
  }
  saveDB(db);
}

export type ActivateResult =
  | { status: 'ok'; credited: number | null; newBalance: number | null; expiresAt: string | null }
  | { status: 'not_found' }
  | { status: 'already_bound' }
  | { status: 'expired' }
  | { status: 'already_activated' };

export function activateUser(userId: number, key: string): ActivateResult {
  const upperKey = key.toUpperCase();
  const keyData = db.keys[upperKey];
  if (!keyData) return { status: 'not_found' };

  // Bound to a different user
  if (keyData.used && keyData.usedBy !== null && keyData.usedBy !== userId) {
    return { status: 'already_bound' };
  }

  // Check activation deadline for request-limited keys
  if (keyData.requestLimit !== null && keyData.expiresAt && new Date() > new Date(keyData.expiresAt)) {
    return { status: 'expired' };
  }

  const user = ensureUser(userId);

  // User already activated this key
  if (user.activatedKeys.includes(upperKey)) return { status: 'already_activated' };

  keyData.used = true;
  keyData.usedBy = userId;
  user.activatedKeys.push(upperKey);

  if (keyData.requestLimit !== null) {
    // Credit requests to balance
    user.requestBalance += keyData.requestLimit;
    saveDB(db);
    return { status: 'ok', credited: keyData.requestLimit, newBalance: user.requestBalance, expiresAt: null };
  } else {
    // Unlimited access key
    saveDB(db);
    return { status: 'ok', credited: null, newBalance: null, expiresAt: keyData.expiresAt };
  }
}

export interface GenerateKeyOptions {
  requestLimit?: number | null;
  expiresAt?: string | null;
}

export function generateKey(options: GenerateKeyOptions = {}): string {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  const segment = () =>
    Array.from({ length: 4 }, () => chars[Math.floor(Math.random() * chars.length)]).join('');
  const key = `${segment()}-${segment()}-${segment()}`;
  db.keys[key] = {
    used: false,
    usedBy: null,
    requestLimit: options.requestLimit ?? null,
    expiresAt: options.expiresAt ?? null,
    createdAt: new Date().toISOString(),
  };
  saveDB(db);
  return key;
}

export function getKeyInfo(key: string): (KeyData & { id: string }) | null {
  const upperKey = key.toUpperCase();
  const keyData = db.keys[upperKey];
  if (!keyData) return null;
  return { id: upperKey, ...keyData };
}

export interface AdminUserInfo {
  userId: number;
  firstName: string;
  lastName: string | null;
  username: string | null;
  joinedAt: string;
  requestBalance: number;
  activatedKeys: string[];
  unlimitedAccess: { active: boolean; expiresAt: string | null };
}

export function getAdminUserInfo(userId: number): AdminUserInfo | null {
  const user = db.users[String(userId)];
  if (!user) return null;
  return {
    userId,
    firstName: user.firstName,
    lastName: user.lastName,
    username: user.username,
    joinedAt: user.joinedAt,
    requestBalance: user.requestBalance,
    activatedKeys: user.activatedKeys,
    unlimitedAccess: getUnlimitedAccess(userId),
  };
}

export function revokeKey(key: string): boolean {
  const upperKey = key.toUpperCase();
  const keyData = db.keys[upperKey];
  if (!keyData) return false;

  const prevUsedBy = keyData.usedBy;
  keyData.used = false;
  keyData.usedBy = null;

  if (prevUsedBy !== null && db.users[String(prevUsedBy)]) {
    db.users[String(prevUsedBy)].activatedKeys =
      db.users[String(prevUsedBy)].activatedKeys.filter(k => k !== upperKey);
  }

  saveDB(db);
  return true;
}

export function addBalance(userId: number, amount: number): number {
  const user = ensureUser(userId);
  user.requestBalance += amount;
  saveDB(db);
  return user.requestBalance;
}

export function getStats(): string {
  const users = Object.values(db.users);
  const keys = Object.values(db.keys);

  const totalUsers      = users.length;
  const totalBalance    = users.reduce((s, u) => s + u.requestBalance, 0);
  const withUnlimited   = Object.keys(db.users).filter(uid => !!getUnlimitedKey(parseInt(uid))).length;
  const totalKeys       = keys.length;
  const usedKeys        = keys.filter(k => k.used).length;
  const freeKeys        = totalKeys - usedKeys;
  const unlimitedKeys   = keys.filter(k => k.requestLimit === null).length;
  const limitedKeys     = keys.filter(k => k.requestLimit !== null).length;
  const expiredKeys     = keys.filter(k => k.expiresAt && new Date() > new Date(k.expiresAt)).length;

  return (
    `📊 <b>Статистика бота</b>\n\n` +
    `👥 <b>Пользователи</b>\n` +
    `Всего: <b>${totalUsers}</b>\n` +
    `С безлимитным доступом: <b>${withUnlimited}</b>\n` +
    `Баланс запросов (всего): <b>${totalBalance}</b>\n\n` +
    `🔑 <b>Ключи</b>\n` +
    `Всего создано: <b>${totalKeys}</b>\n` +
    `Активированы: <b>${usedKeys}</b>\n` +
    `Свободных: <b>${freeKeys}</b>\n` +
    `Безлимитных: <b>${unlimitedKeys}</b>\n` +
    `С лимитом запросов: <b>${limitedKeys}</b>\n` +
    `Истёкших: <b>${expiredKeys}</b>`
  );
}
