import * as fs from 'fs';
import * as path from 'path';

const DATA_DIR = process.env.DATA_DIR || './data';
const DB_PATH = path.join(DATA_DIR, 'db.json');

export const FREE_REQUESTS = parseInt(process.env.FREE_REQUESTS || '10');

interface UserData {
  requestCount: number;
  activated: boolean;
}

interface KeyData {
  used: boolean;
  usedBy: number | null;
}

interface DB {
  users: Record<string, UserData>;
  keys: Record<string, KeyData>;
}

function loadDB(): DB {
  try {
    if (!fs.existsSync(DATA_DIR)) {
      fs.mkdirSync(DATA_DIR, { recursive: true });
    }
    if (!fs.existsSync(DB_PATH)) {
      return { users: {}, keys: {} };
    }
    return JSON.parse(fs.readFileSync(DB_PATH, 'utf-8'));
  } catch (e: any) {
    console.error(`[storage] Ошибка загрузки базы данных: ${e.message}`);
    return { users: {}, keys: {} };
  }
}

function saveDB(db: DB): void {
  try {
    if (!fs.existsSync(DATA_DIR)) {
      fs.mkdirSync(DATA_DIR, { recursive: true });
    }
    fs.writeFileSync(DB_PATH, JSON.stringify(db, null, 2));
  } catch (e: any) {
    console.error(`[storage] Ошибка сохранения базы данных: ${e.message}`);
  }
}

// Единственный экземпляр БД в памяти — загружается один раз при старте
let db: DB = loadDB();
console.log(`[storage] База данных загружена: ${Object.keys(db.users).length} пользователей, ${Object.keys(db.keys).length} ключей`);

export function getUser(userId: number): UserData {
  return db.users[String(userId)] || { requestCount: 0, activated: false };
}

export function incrementRequest(userId: number): number {
  if (!db.users[String(userId)]) {
    db.users[String(userId)] = { requestCount: 0, activated: false };
  }
  db.users[String(userId)].requestCount++;
  saveDB(db);
  return db.users[String(userId)].requestCount;
}

export function activateUser(userId: number, key: string): boolean {
  const upperKey = key.toUpperCase();
  if (!db.keys[upperKey] || db.keys[upperKey].used) return false;
  db.keys[upperKey].used = true;
  db.keys[upperKey].usedBy = userId;
  if (!db.users[String(userId)]) {
    db.users[String(userId)] = { requestCount: 0, activated: false };
  }
  db.users[String(userId)].activated = true;
  saveDB(db);
  return true;
}

export function generateKey(): string {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  const segment = () =>
    Array.from({ length: 4 }, () => chars[Math.floor(Math.random() * chars.length)]).join('');
  const key = `${segment()}-${segment()}-${segment()}`;
  db.keys[key] = { used: false, usedBy: null };
  saveDB(db);
  return key;
}

export function getStats(): string {
  const users = Object.values(db.users);
  const keys = Object.values(db.keys);

  const totalUsers     = users.length;
  const activatedUsers = users.filter(u => u.activated).length;
  const freeUsers      = totalUsers - activatedUsers;
  const totalRequests  = users.reduce((sum, u) => sum + u.requestCount, 0);
  const totalKeys      = keys.length;
  const usedKeys       = keys.filter(k => k.used).length;
  const freeKeys       = totalKeys - usedKeys;

  return (
    `📊 <b>Статистика бота</b>\n\n` +
    `👥 <b>Пользователи</b>\n` +
    `Всего: <b>${totalUsers}</b>\n` +
    `С ключом: <b>${activatedUsers}</b>\n` +
    `Бесплатных: <b>${freeUsers}</b>\n\n` +
    `🔢 <b>Запросы</b>\n` +
    `Всего сделано: <b>${totalRequests}</b>\n\n` +
    `🔑 <b>Ключи</b>\n` +
    `Всего создано: <b>${totalKeys}</b>\n` +
    `Использовано: <b>${usedKeys}</b>\n` +
    `Свободных: <b>${freeKeys}</b>`
  );
}
