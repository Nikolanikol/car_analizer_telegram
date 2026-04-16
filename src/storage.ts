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
  if (!fs.existsSync(DATA_DIR)) {
    fs.mkdirSync(DATA_DIR, { recursive: true });
  }
  if (!fs.existsSync(DB_PATH)) {
    return { users: {}, keys: {} };
  }
  return JSON.parse(fs.readFileSync(DB_PATH, 'utf-8'));
}

function saveDB(db: DB): void {
  if (!fs.existsSync(DATA_DIR)) {
    fs.mkdirSync(DATA_DIR, { recursive: true });
  }
  fs.writeFileSync(DB_PATH, JSON.stringify(db, null, 2));
}

export function getUser(userId: number): UserData {
  const db = loadDB();
  return db.users[String(userId)] || { requestCount: 0, activated: false };
}

export function incrementRequest(userId: number): number {
  const db = loadDB();
  if (!db.users[String(userId)]) {
    db.users[String(userId)] = { requestCount: 0, activated: false };
  }
  db.users[String(userId)].requestCount++;
  saveDB(db);
  return db.users[String(userId)].requestCount;
}

export function activateUser(userId: number, key: string): boolean {
  const db = loadDB();
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
  const db = loadDB();
  db.keys[key] = { used: false, usedBy: null };
  saveDB(db);
  return key;
}
