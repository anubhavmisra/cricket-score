import path from "path";
import fs from "fs";
import { drizzle as drizzlePostgres } from "drizzle-orm/neon-http";
import { drizzle as drizzleSqlite } from "drizzle-orm/better-sqlite3";
import { migrate as migrateSqlite } from "drizzle-orm/better-sqlite3/migrator";
import type { BetterSQLite3Database } from "drizzle-orm/better-sqlite3";
import { neon } from "@neondatabase/serverless";
import Database from "better-sqlite3";
import { getDriver, getSqlitePath } from "./driver";
import * as postgresSchema from "./schema/postgres";
import * as sqliteSchema from "./schema/sqlite";

/** Canonical app DB type (SQLite schema shape — mirrors Postgres). */
export type Db = BetterSQLite3Database<typeof sqliteSchema>;

let dbInstance: Db | null = null;
let sqliteMigrated = false;

function migrateLocalSqlite(sqliteDb: Db) {
  if (sqliteMigrated) return;
  const migrationsFolder = path.join(process.cwd(), "drizzle/sqlite");
  if (fs.existsSync(migrationsFolder)) {
    migrateSqlite(sqliteDb, { migrationsFolder });
  }
  sqliteMigrated = true;
}

function createSqliteDb(): Db {
  const dbPath = path.resolve(process.cwd(), getSqlitePath());
  fs.mkdirSync(path.dirname(dbPath), { recursive: true });
  const sqlite = new Database(dbPath);
  sqlite.pragma("journal_mode = WAL");
  sqlite.pragma("foreign_keys = ON");
  const db = drizzleSqlite(sqlite, { schema: sqliteSchema });
  migrateLocalSqlite(db);
  return db;
}

function createPostgresDb(): Db {
  if (!process.env.DATABASE_URL) {
    throw new Error("DATABASE_URL is required when DB_DRIVER=postgres");
  }
  const sql = neon(process.env.DATABASE_URL);
  return drizzlePostgres(sql, { schema: postgresSchema }) as unknown as Db;
}

export function getDb(): Db {
  if (!dbInstance) {
    dbInstance = getDriver() === "sqlite" ? createSqliteDb() : createPostgresDb();
  }
  return dbInstance;
}

/** Reset singleton — for tests only. */
export function resetDbForTests() {
  dbInstance = null;
  sqliteMigrated = false;
}
