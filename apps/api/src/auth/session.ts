import { v4 as uuid } from "uuid";
import { createHash, randomBytes } from "node:crypto";
import { getDb } from "../db/connection.js";
import { sessions } from "../db/schema.js";
import { eq, lt } from "drizzle-orm";

const SESSION_TTL_MS = 24 * 60 * 60 * 1000; // 24 hours

function hashToken(token: string): string {
  return createHash("sha256").update(token).digest("hex");
}

export function generateSessionToken(): string {
  return randomBytes(32).toString("hex");
}

export async function createSession(userId: string): Promise<{
  token: string;
  expiresAt: Date;
}> {
  const db = getDb();
  const token = generateSessionToken();
  const tokenHash = hashToken(token);
  const id = uuid();
  const expiresAt = new Date(Date.now() + SESSION_TTL_MS);

  await db.insert(sessions).values({
    id,
    tokenHash,
    userId,
    expiresAt,
    createdAt: new Date(),
  });

  return { token, expiresAt };
}

export async function validateSession(
  token: string
): Promise<{ userId: string } | null> {
  const db = getDb();
  const tokenHash = hashToken(token);

  const rows = await db
    .select()
    .from(sessions)
    .where(eq(sessions.tokenHash, tokenHash));

  if (rows.length === 0) return null;

  const session = rows[0];
  if (new Date() > session.expiresAt) {
    await db.delete(sessions).where(eq(sessions.id, session.id));
    return null;
  }

  return { userId: session.userId };
}

export async function revokeSession(token: string): Promise<void> {
  const db = getDb();
  const tokenHash = hashToken(token);
  await db.delete(sessions).where(eq(sessions.tokenHash, tokenHash));
}

export async function cleanupExpiredSessions(): Promise<void> {
  const db = getDb();
  await db.delete(sessions).where(lt(sessions.expiresAt, new Date()));
}
