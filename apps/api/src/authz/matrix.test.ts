import { describe, it, expect } from "vitest";
import { canAccess } from "./matrix.js";

describe("Permission matrix", () => {
  it("MEMBER can access resource A", () => {
    expect(canAccess("MEMBER", "A")).toBe(true);
  });

  it("MEMBER cannot access resource B", () => {
    expect(canAccess("MEMBER", "B")).toBe(false);
  });

  it("PRIVILEGED can access resource A", () => {
    expect(canAccess("PRIVILEGED", "A")).toBe(true);
  });

  it("PRIVILEGED can access resource B", () => {
    expect(canAccess("PRIVILEGED", "B")).toBe(true);
  });
});
