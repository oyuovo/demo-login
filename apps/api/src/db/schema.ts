import { mysqlTable, mysqlEnum, varchar, text, int, timestamp } from "drizzle-orm/mysql-core";
import { sql } from "drizzle-orm";

export const users = mysqlTable("users", {
  id: varchar("id", { length: 36 }).primaryKey(),
  username: varchar("username", { length: 32 }).notNull(),
  normalizedUsername: varchar("normalized_username", { length: 128 }).notNull().unique(),
  passwordHash: varchar("password_hash", { length: 256 }).notNull(),
  role: mysqlEnum("role", ["MEMBER", "PRIVILEGED"]).notNull().default("MEMBER"),
  createdAt: timestamp("created_at").notNull().default(sql`CURRENT_TIMESTAMP`),
  updatedAt: timestamp("updated_at").notNull().default(sql`CURRENT_TIMESTAMP`).onUpdateNow(),
});

export const sessions = mysqlTable("sessions", {
  id: varchar("id", { length: 36 }).primaryKey(),
  tokenHash: varchar("token_hash", { length: 128 }).notNull().unique(),
  userId: varchar("user_id", { length: 36 })
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  expiresAt: timestamp("expires_at").notNull(),
  createdAt: timestamp("created_at").notNull().default(sql`CURRENT_TIMESTAMP`),
});

export const moderationAttempts = mysqlTable("moderation_attempts", {
  id: varchar("id", { length: 36 }).primaryKey(),
  candidateHash: varchar("candidate_hash", { length: 128 }).notNull(),
  provider: varchar("provider", { length: 32 }).notNull(),
  model: varchar("model", { length: 64 }).notNull(),
  promptVersion: varchar("prompt_version", { length: 16 }).notNull(),
  decision: mysqlEnum("decision", ["ALLOW", "BLOCK", "ERROR"]).notNull(),
  category: varchar("category", { length: 32 }),
  reason: text("reason"),
  latencyMs: int("latency_ms"),
  errorCode: varchar("error_code", { length: 64 }),
  createdAt: timestamp("created_at").notNull().default(sql`CURRENT_TIMESTAMP`),
});
