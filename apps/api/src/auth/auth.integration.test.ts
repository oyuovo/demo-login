import { describe, it, expect, beforeAll, afterAll } from "vitest";
import { buildTestApp, TestApp } from "../test/app.js";

let app: TestApp;

beforeAll(async () => {
  app = await buildTestApp();
});

afterAll(async () => {
  await app.close();
});

async function extractCookie(res: any): Promise<string | null> {
  const cookies = res.headers["set-cookie"];
  if (!cookies) return null;
  for (const c of Array.isArray(cookies) ? cookies : [cookies]) {
    if (c.startsWith("cg_session=")) {
      return c.split(";")[0].slice("cg_session=".length);
    }
  }
  return null;
}

describe("Auth API integration", () => {
  const testUser = `testuser_${Date.now()}`;
  const testPassword = "password123";

  it("POST /api/auth/register creates a new MEMBER user", async () => {
    const res = await app.inject({
      method: "POST",
      url: "/api/auth/register",
      payload: { username: testUser, password: testPassword },
    });

    expect(res.statusCode).toBe(201);
    const body = JSON.parse(res.payload);
    expect(body.username).toBe(testUser);
    expect(body.role).toBe("MEMBER");
    expect(body.id).toBeDefined();

    const cookie = await extractCookie(res);
    expect(cookie).toBeTruthy();
  });

  it("POST /api/auth/register returns 409 for duplicate normalized username", async () => {
    const res = await app.inject({
      method: "POST",
      url: "/api/auth/register",
      payload: { username: testUser.toUpperCase(), password: testPassword },
    });

    expect(res.statusCode).toBe(409);
    const body = JSON.parse(res.payload);
    expect(body.error).toBe("CONFLICT");
  });

  it("POST /api/auth/register returns 400 for short password", async () => {
    const res = await app.inject({
      method: "POST",
      url: "/api/auth/register",
      payload: { username: "newuser", password: "123" },
    });

    expect(res.statusCode).toBe(400);
  });

  it("POST /api/auth/register returns 422 for blocked username", async () => {
    const blockedApp = await buildTestApp({ moderationMode: "block" });
    const res = await blockedApp.inject({
      method: "POST",
      url: "/api/auth/register",
      payload: { username: "bad_user", password: "password123" },
    });
    expect(res.statusCode).toBe(422);
    await blockedApp.close();
  });

  it("POST /api/auth/register returns 503 when moderation unavailable", async () => {
    const errorApp = await buildTestApp({ moderationMode: "throw" });
    const res = await errorApp.inject({
      method: "POST",
      url: "/api/auth/register",
      payload: { username: "error_user", password: "password123" },
    });
    expect(res.statusCode).toBe(503);
    await errorApp.close();
  });

  it("POST /api/auth/login fails with wrong password", async () => {
    const res = await app.inject({
      method: "POST",
      url: "/api/auth/login",
      payload: { username: testUser, password: "wrongpassword" },
    });

    expect(res.statusCode).toBe(401);
  });

  it("POST /api/auth/login succeeds with correct credentials", async () => {
    const res = await app.inject({
      method: "POST",
      url: "/api/auth/login",
      payload: { username: testUser, password: testPassword },
    });

    expect(res.statusCode).toBe(200);
    const body = JSON.parse(res.payload);
    expect(body.username).toBe(testUser);
  });

  it("GET /api/auth/me returns user when authenticated", async () => {
    // First login
    const loginRes = await app.inject({
      method: "POST",
      url: "/api/auth/login",
      payload: { username: testUser, password: testPassword },
    });
    const cookie = await extractCookie(loginRes);

    const res = await app.inject({
      method: "GET",
      url: "/api/auth/me",
      headers: cookie ? { cookie: `cg_session=${cookie}` } : {},
    });

    expect(res.statusCode).toBe(200);
    const body = JSON.parse(res.payload);
    expect(body.username).toBe(testUser);
  });

  it("GET /api/auth/me returns 401 without cookie", async () => {
    const res = await app.inject({
      method: "GET",
      url: "/api/auth/me",
    });

    expect(res.statusCode).toBe(401);
  });

  it("POST /api/auth/logout clears session", async () => {
    // Login
    const loginRes = await app.inject({
      method: "POST",
      url: "/api/auth/login",
      payload: { username: testUser, password: testPassword },
    });
    const cookie = await extractCookie(loginRes);

    // Logout
    const logoutRes = await app.inject({
      method: "POST",
      url: "/api/auth/logout",
      headers: cookie ? { cookie: `cg_session=${cookie}` } : {},
    });
    expect(logoutRes.statusCode).toBe(204);

    // Verify session is dead — old cookie should be rejected
    const meRes = await app.inject({
      method: "GET",
      url: "/api/auth/me",
      headers: cookie ? { cookie: `cg_session=${cookie}` } : {},
    });
    expect(meRes.statusCode).toBe(401);
  });
});
