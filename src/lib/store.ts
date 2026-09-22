import fs from "fs";
import path from "path";
import { randomUUID } from "crypto";
import type { Db, StatusReport, StatusType, Voucher } from "./types";
import { DEFAULT_TTL_MINUTES } from "./types";
import { buildSeed } from "./seed";

const DATA_DIR = path.join(process.cwd(), "data");
const DB_PATH = path.join(DATA_DIR, "db.json");
const UPSTASH_KEY = "freshspot:db";

export type StoreMode = "upstash" | "file" | "memory";

type GlobalStore = {
  __freshspotDb?: Db;
  __freshspotStoreMode?: StoreMode;
  __freshspotFsChecked?: boolean;
  __freshspotRedis?: { get: (k: string) => Promise<unknown>; set: (k: string, v: string) => Promise<unknown> } | null;
  __freshspotRedisInit?: Promise<void> | null;
};

function g(): GlobalStore {
  return globalThis as unknown as GlobalStore;
}

/** Prefer REST pair from @upstash/redis docs. */
function upstashEnv(): { url: string; token: string } | null {
  const url =
    process.env.UPSTASH_REDIS_REST_URL?.trim() ||
    process.env.UPSTASH_REDIS_URL?.trim() ||
    "";
  const token =
    process.env.UPSTASH_REDIS_REST_TOKEN?.trim() ||
    process.env.UPSTASH_REDIS_TOKEN?.trim() ||
    "";
  if (url && token) return { url, token };
  return null;
}

export function hasUpstashEnv(): boolean {
  return upstashEnv() !== null;
}

function preferMemory(): boolean {
  return (
    process.env.VERCEL === "1" ||
    process.env.FRESHSPOT_MEMORY_STORE === "1"
  );
}

function cloneDb(db: Db): Db {
  return JSON.parse(JSON.stringify(db)) as Db;
}

function seedDb(): Db {
  return buildSeed();
}

function tryWriteFile(db: Db): boolean {
  try {
    if (!fs.existsSync(DATA_DIR)) {
      fs.mkdirSync(DATA_DIR, { recursive: true });
    }
    fs.writeFileSync(DB_PATH, JSON.stringify(db, null, 2), "utf-8");
    return true;
  } catch {
    return false;
  }
}

async function getRedis() {
  const existing = g();
  if (existing.__freshspotRedis !== undefined) {
    return existing.__freshspotRedis;
  }
  const env = upstashEnv();
  if (!env) {
    existing.__freshspotRedis = null;
    return null;
  }
  try {
    // Dynamic import so the app builds/runs without Upstash env vars present.
    const { Redis } = await import("@upstash/redis");
    const redis = new Redis({ url: env.url, token: env.token });
    existing.__freshspotRedis = redis;
    return redis;
  } catch {
    existing.__freshspotRedis = null;
    return null;
  }
}

async function loadFromUpstash(): Promise<Db | null> {
  const redis = await getRedis();
  if (!redis) return null;
  try {
    const raw = await redis.get(UPSTASH_KEY);
    if (raw == null) return null;
    if (typeof raw === "string") {
      return JSON.parse(raw) as Db;
    }
    // @upstash/redis may auto-deserialize JSON objects
    if (typeof raw === "object") {
      return raw as Db;
    }
    return null;
  } catch {
    return null;
  }
}

async function saveToUpstash(db: Db): Promise<boolean> {
  const redis = await getRedis();
  if (!redis) return false;
  try {
    await redis.set(UPSTASH_KEY, JSON.stringify(db));
    return true;
  } catch {
    return false;
  }
}

function initLocalStore(): { db: Db; mode: StoreMode } {
  const existing = g();
  if (existing.__freshspotDb && existing.__freshspotStoreMode && existing.__freshspotStoreMode !== "upstash") {
    return { db: existing.__freshspotDb, mode: existing.__freshspotStoreMode };
  }

  if (preferMemory()) {
    const db = cloneDb(seedDb());
    existing.__freshspotDb = db;
    existing.__freshspotStoreMode = "memory";
    existing.__freshspotFsChecked = true;
    return { db, mode: "memory" };
  }

  let db: Db;
  try {
    if (!fs.existsSync(DATA_DIR)) {
      fs.mkdirSync(DATA_DIR, { recursive: true });
    }
    if (!fs.existsSync(DB_PATH)) {
      db = seedDb();
      if (!tryWriteFile(db)) {
        existing.__freshspotDb = db;
        existing.__freshspotStoreMode = "memory";
        existing.__freshspotFsChecked = true;
        return { db, mode: "memory" };
      }
    } else {
      const raw = fs.readFileSync(DB_PATH, "utf-8");
      db = JSON.parse(raw) as Db;
    }
  } catch {
    db = seedDb();
    existing.__freshspotDb = db;
    existing.__freshspotStoreMode = "memory";
    existing.__freshspotFsChecked = true;
    return { db, mode: "memory" };
  }

  if (!existing.__freshspotFsChecked) {
    existing.__freshspotFsChecked = true;
    if (!tryWriteFile(db)) {
      existing.__freshspotDb = db;
      existing.__freshspotStoreMode = "memory";
      return { db, mode: "memory" };
    }
  }

  existing.__freshspotDb = db;
  existing.__freshspotStoreMode = "file";
  return { db, mode: "file" };
}

/**
 * Ensure store is ready. When Upstash env is set, loads/persists JSON blob at freshspot:db.
 * Otherwise keeps memory (Vercel) or file (local) behavior.
 */
async function ensureStore(): Promise<{ db: Db; mode: StoreMode }> {
  const existing = g();

  if (hasUpstashEnv()) {
    if (existing.__freshspotStoreMode === "upstash" && existing.__freshspotDb) {
      return { db: existing.__freshspotDb, mode: "upstash" };
    }
    const fromRedis = await loadFromUpstash();
    const db = fromRedis ?? cloneDb(seedDb());
    if (!fromRedis) {
      await saveToUpstash(db);
    }
    existing.__freshspotDb = db;
    existing.__freshspotStoreMode = "upstash";
    return { db, mode: "upstash" };
  }

  return initLocalStore();
}

async function persist(db: Db): Promise<void> {
  const existing = g();
  existing.__freshspotDb = db;

  if (existing.__freshspotStoreMode === "upstash" || hasUpstashEnv()) {
    existing.__freshspotStoreMode = "upstash";
    await saveToUpstash(db);
    return;
  }

  const mode = existing.__freshspotStoreMode ?? "memory";
  if (mode === "memory" || preferMemory()) {
    existing.__freshspotStoreMode = "memory";
    return;
  }

  if (!tryWriteFile(db)) {
    existing.__freshspotStoreMode = "memory";
  }
}

export async function getStoreMode(): Promise<StoreMode> {
  return (await ensureStore()).mode;
}

export async function getDb(): Promise<Db> {
  return (await ensureStore()).db;
}

async function getDbMutable(): Promise<Db> {
  return (await ensureStore()).db;
}

export async function listPlaces() {
  return (await getDb()).places;
}

export async function listActiveStatuses() {
  const db = await getDb();
  const now = Date.now();
  return db.statuses
    .filter((s) => new Date(s.expiresAt).getTime() > now)
    .sort(
      (a, b) =>
        new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    );
}

export async function listAllStatusesForFeed() {
  const db = await getDb();
  const now = Date.now();
  const withMeta = db.statuses.map((s) => ({
    ...s,
    expired: new Date(s.expiresAt).getTime() <= now,
  }));
  const active = withMeta
    .filter((s) => !s.expired)
    .sort(
      (a, b) =>
        new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    );
  const expired = withMeta
    .filter((s) => s.expired)
    .sort(
      (a, b) =>
        new Date(b.expiresAt).getTime() - new Date(a.expiresAt).getTime()
    )
    .slice(0, 5);
  return [...active, ...expired];
}

export async function createStatus(input: {
  placeId: string;
  statusType: StatusType;
  note: string;
  ttlMinutes?: number;
}): Promise<StatusReport> {
  const db = await getDbMutable();
  const place = db.places.find((p) => p.id === input.placeId);
  if (!place) throw new Error("Place not found");
  const ttl = input.ttlMinutes ?? DEFAULT_TTL_MINUTES;
  const now = new Date();
  const report: StatusReport = {
    id: randomUUID(),
    placeId: input.placeId,
    statusType: input.statusType,
    note: input.note.trim(),
    createdAt: now.toISOString(),
    expiresAt: new Date(now.getTime() + ttl * 60_000).toISOString(),
  };
  db.statuses.unshift(report);
  await persist(db);
  return report;
}

export async function listOpenVouchers() {
  const db = await getDb();
  return db.vouchers
    .filter((v) => v.status === "open")
    .sort(
      (a, b) =>
        new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    );
}

export async function listVouchers() {
  const db = await getDb();
  return db.vouchers.sort(
    (a, b) =>
      new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
  );
}

export async function createVoucher(input: {
  merchant: string;
  code: string;
  note?: string;
  expiry?: string | null;
}): Promise<Voucher> {
  const db = await getDbMutable();
  const voucher: Voucher = {
    id: randomUUID(),
    merchant: input.merchant.trim(),
    code: input.code.trim(),
    note: (input.note ?? "").trim(),
    expiry: input.expiry || null,
    status: "open",
    createdAt: new Date().toISOString(),
    claimedAt: null,
  };
  db.vouchers.unshift(voucher);
  await persist(db);
  return voucher;
}

export async function claimVoucher(id: string): Promise<Voucher> {
  const db = await getDbMutable();
  const voucher = db.vouchers.find((v) => v.id === id);
  if (!voucher) throw new Error("Voucher not found");
  if (voucher.status !== "open") throw new Error("Already claimed");
  voucher.status = "claimed";
  voucher.claimedAt = new Date().toISOString();
  await persist(db);
  return voucher;
}
