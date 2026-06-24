import { describe, it, expect } from "vitest";
import { hashPassword, verifyPassword } from "./password.js";

describe("Password hashing", () => {
  it("should hash and verify a password", async () => {
    const plain = "test_password_123";
    const hashed = await hashPassword(plain);
    expect(hashed).not.toBe(plain);
    expect(hashed.startsWith("$argon2id$")).toBe(true);

    const valid = await verifyPassword(hashed, plain);
    expect(valid).toBe(true);
  });

  it("should reject wrong password", async () => {
    const hashed = await hashPassword("correct_password");
    const valid = await verifyPassword(hashed, "wrong_password");
    expect(valid).toBe(false);
  });

  it("should not return true for empty or invalid hashes", async () => {
    const valid = await verifyPassword("not_a_hash", "anything");
    expect(valid).toBe(false);
  });
});
