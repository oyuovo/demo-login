import { describe, it, expect, beforeEach } from "vitest";
import { FakeProvider } from "./fake-provider.js";
import { setProvider, resetProvider } from "./factory.js";

// Unit tests for moderation orchestration — we import moderateUsername
// which depends on DB recording. For pure unit tests we focus on:
// - FakeProvider returning correct shapes
// - Factory can swap providers

describe("FakeProvider", () => {
  it("returns ALLOW result in allow mode", async () => {
    const p = new FakeProvider("allow");
    const result = await p.checkUsername("test", "v1");
    expect(result.allowed).toBe(true);
  });

  it("returns BLOCK result in block mode", async () => {
    const p = new FakeProvider("block");
    const result = await p.checkUsername("bad_user", "v1");
    expect(result.allowed).toBe(false);
    expect(result.category).toBeDefined();
    expect(result.reason).toBeDefined();
  });

  it("throws in throw mode", async () => {
    const p = new FakeProvider("throw");
    await expect(p.checkUsername("test", "v1")).rejects.toThrow();
  });

  it("returns custom result in custom mode", async () => {
    const p = new FakeProvider("custom", {
      allowed: false,
      category: "色情",
      reason: "test reason",
    });
    const result = await p.checkUsername("test", "v1");
    expect(result.allowed).toBe(false);
    expect(result.category).toBe("色情");
    expect(result.reason).toBe("test reason");
  });
});

describe("Provider factory", () => {
  beforeEach(() => {
    resetProvider();
  });

  it("can swap provider via setProvider", async () => {
    const fake = new FakeProvider("allow");
    setProvider(fake);
    const { getProvider } = await import("./factory.js");
    const p = getProvider();
    expect(p.name).toBe("fake");
  });
});
