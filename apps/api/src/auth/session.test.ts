import { describe, it, expect } from "vitest";
import { generateSessionToken } from "./session.js";

describe("Session tokens", () => {
  it("generates a 64-char hex token", () => {
    const token = generateSessionToken();
    expect(token).toHaveLength(64);
    expect(/^[0-9a-f]+$/.test(token)).toBe(true);
  });

  it("generates unique tokens", () => {
    const t1 = generateSessionToken();
    const t2 = generateSessionToken();
    expect(t1).not.toBe(t2);
  });
});
