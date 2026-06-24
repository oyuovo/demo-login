import { describe, it, expect, beforeAll, afterAll } from "vitest";
import { buildTestApp, TestApp } from "../test/app.js";

let app: TestApp;

beforeAll(async () => {
  app = await buildTestApp();
});

afterAll(async () => {
  await app.close();
});

async function registerAndGetCookie(
  app: TestApp,
  username: string
): Promise<string> {
  const res = await app.inject({
    method: "POST",
    url: "/api/auth/register",
    payload: { username, password: "password123" },
  });
  const cookies = res.headers["set-cookie"];
  if (!cookies) throw new Error("No cookie returned");
  for (const c of Array.isArray(cookies) ? cookies : [cookies]) {
    if (c.startsWith("cg_session=")) {
      return c.split(";")[0].slice("cg_session=".length);
    }
  }
  throw new Error("No session cookie found");
}

describe("Resources API integration", () => {
  it("returns 401 for resource A without auth", async () => {
    const res = await app.inject({ method: "GET", url: "/api/resources/a" });
    expect(res.statusCode).toBe(401);
  });

  it("returns 401 for resource B without auth", async () => {
    const res = await app.inject({ method: "GET", url: "/api/resources/b" });
    expect(res.statusCode).toBe(401);
  });

  it("MEMBER can access resource A", async () => {
    const cookie = await registerAndGetCookie(app, `member_a_${Date.now()}`);

    const res = await app.inject({
      method: "GET",
      url: "/api/resources/a",
      headers: { cookie: `cg_session=${cookie}` },
    });

    expect(res.statusCode).toBe(200);
    const body = JSON.parse(res.payload);
    expect(body.resource).toBe("A");
  });

  it("MEMBER cannot access resource B (403)", async () => {
    const cookie = await registerAndGetCookie(app, `member_b_${Date.now()}`);

    const res = await app.inject({
      method: "GET",
      url: "/api/resources/b",
      headers: { cookie: `cg_session=${cookie}` },
    });

    expect(res.statusCode).toBe(403);
  });
});
