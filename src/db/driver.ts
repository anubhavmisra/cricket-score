export type DbDriver = "sqlite" | "postgres";

export function getDriver(): DbDriver {
  const explicit = process.env.DB_DRIVER;
  if (explicit === "postgres" || explicit === "sqlite") {
    return explicit;
  }

  const url = process.env.DATABASE_URL;
  if (url?.startsWith("postgresql://") || url?.startsWith("postgres://")) {
    return "postgres";
  }

  return "sqlite";
}

export function getSqlitePath(): string {
  return process.env.SQLITE_PATH ?? "./data/cricket-score.db";
}

export function isSqlite(): boolean {
  return getDriver() === "sqlite";
}
