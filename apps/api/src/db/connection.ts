import { drizzle } from "drizzle-orm/mysql2";
import mysql from "mysql2/promise";
import * as schema from "./schema.js";

let db: ReturnType<typeof drizzle> | null = null;
let pool: mysql.Pool | null = null;

export function getDb(): ReturnType<typeof drizzle> {
  if (!db) {
    const config = {
      host: process.env.DB_HOST ?? "127.0.0.1",
      port: Number(process.env.DB_PORT ?? 3306),
      user: process.env.DB_USER ?? "community_gate",
      password: process.env.DB_PASSWORD ?? "community_gate_dev",
      database: process.env.DB_NAME ?? "community_gate",
    };

    pool = mysql.createPool({
      ...config,
      waitForConnections: true,
      connectionLimit: 10,
      queueLimit: 0,
    });

    db = drizzle(pool, { schema, mode: "default" });
  }
  return db;
}

export async function closeDb(): Promise<void> {
  if (pool) {
    await pool.end();
    pool = null;
    db = null;
  }
}

export async function testConnection(): Promise<boolean> {
  try {
    const conn = await mysql.createConnection({
      host: process.env.DB_HOST ?? "127.0.0.1",
      port: Number(process.env.DB_PORT ?? 3306),
      user: process.env.DB_USER ?? "community_gate",
      password: process.env.DB_PASSWORD ?? "community_gate_dev",
      database: process.env.DB_NAME ?? "community_gate",
    });
    await conn.ping();
    await conn.end();
    return true;
  } catch {
    return false;
  }
}
