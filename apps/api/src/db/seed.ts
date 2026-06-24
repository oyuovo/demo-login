import "../env.js";
import { v4 as uuid } from "uuid";
import { hash } from "argon2";
import { getDb, closeDb } from "./connection.js";
import { users } from "./schema.js";
import { eq } from "drizzle-orm";

async function seed() {
  const username = process.env.PRIVILEGED_USERNAME ?? "admin";
  const password = process.env.PRIVILEGED_PASSWORD;

  if (!password) {
    console.error("PRIVILEGED_PASSWORD is not set");
    process.exit(1);
  }

  const db = getDb();

  // Check if privileged user already exists
  const existing = await db
    .select()
    .from(users)
    .where(eq(users.normalizedUsername, username.toLowerCase()));

  if (existing.length > 0) {
    console.log(`Privileged user "${username}" already exists, skipping seed.`);
    await closeDb();
    process.exit(0);
  }

  const passwordHash = await hash(password);
  const now = new Date();

  await db.insert(users).values({
    id: uuid(),
    username,
    normalizedUsername: username.toLowerCase(),
    passwordHash,
    role: "PRIVILEGED",
    createdAt: now,
    updatedAt: now,
  });

  console.log(`Privileged user "${username}" created successfully.`);
  await closeDb();
  process.exit(0);
}

seed().catch((err) => {
  console.error("Seed failed:", err);
  process.exit(1);
});
