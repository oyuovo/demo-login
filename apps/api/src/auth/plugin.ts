import { FastifyPluginAsync } from "fastify";
import { v4 as uuid } from "uuid";
import { eq } from "drizzle-orm";
import {
  RegisterRequest,
  LoginRequest,
  RegisterResponse,
  LoginResponse,
  MeResponse,
} from "@community-gate/contracts";
import { getDb } from "../db/connection.js";
import { users } from "../db/schema.js";
import { hashPassword, verifyPassword } from "./password.js";
import { createSession, revokeSession, validateSession } from "./session.js";
import { moderateUsername } from "../moderation/moderate.js";

const SESSION_COOKIE = "cg_session";
const COOKIE_OPTIONS = {
  httpOnly: true,
  secure: process.env.NODE_ENV === "production",
  sameSite: "lax" as const,
  path: "/",
  maxAge: 24 * 60 * 60, // 24 hours in seconds
};

export const authPlugin: FastifyPluginAsync = async (app) => {
  // GET /api/auth/me — current user
  app.get("/api/auth/me", async (req, reply) => {
    const token = req.cookies[SESSION_COOKIE];
    if (!token) {
      return reply.status(401).send({
        error: "UNAUTHORIZED",
        message: "请先登录",
      });
    }

    const session = await validateSession(token);
    if (!session) {
      reply.header("Set-Cookie", `${SESSION_COOKIE}=; Path=/; Max-Age=0; HttpOnly; SameSite=Lax${COOKIE_OPTIONS.secure ? "; Secure" : ""}`);
      return reply.status(401).send({
        error: "UNAUTHORIZED",
        message: "会话已过期，请重新登录",
      });
    }

    const db = getDb();
    const rows = await db
      .select()
      .from(users)
      .where(eq(users.id, session.userId));

    if (rows.length === 0) {
      return reply.status(401).send({
        error: "UNAUTHORIZED",
        message: "用户不存在",
      });
    }

    const user = rows[0];
    const body: MeResponse = {
      id: user.id,
      username: user.username,
      role: user.role as MeResponse["role"],
    };
    return reply.send(body);
  });

  // POST /api/auth/register
  app.post("/api/auth/register", async (req, reply) => {
    const parse = RegisterRequest.safeParse(req.body);
    if (!parse.success) {
      return reply.status(400).send({
        error: "VALIDATION",
        message: "用户名 1-32 字符，密码 8-128 字符",
      });
    }

    const { username, password } = parse.data;

    // Normalize and validate
    const normalized = username.normalize("NFKC").trim();

    // Local validation
    if (normalized.length < 1 || normalized.length > 32) {
      return reply.status(400).send({
        error: "VALIDATION",
        message: "用户名 1-32 字符",
      });
    }

    // Allow letters, digits, underscores, Chinese chars, hyphens
    if (!/^[\w一-鿿-]+$/.test(normalized)) {
      return reply.status(400).send({
        error: "VALIDATION",
        message: "用户名包含不允许的字符",
      });
    }

    // Check uniqueness
    const db = getDb();
    const existing = await db
      .select()
      .from(users)
      .where(eq(users.normalizedUsername, normalized.toLowerCase()));

    if (existing.length > 0) {
      return reply.status(409).send({
        error: "CONFLICT",
        message: "该用户名已被注册",
      });
    }

    // LLM moderation
    const modResult = await moderateUsername(normalized);

    if (modResult.decision === "ERROR") {
      return reply.status(503).send({
        error: "MODERATION_UNAVAILABLE",
        message: "审核服务暂不可用，请稍后重试",
      });
    }

    if (modResult.decision === "BLOCK") {
      return reply.status(422).send({
        error: "MODERATION_BLOCKED",
        message: modResult.reason ?? "该用户名不符合社区规则",
      });
    }

    // Create user
    const passwordHash = await hashPassword(password);
    const userId = uuid();
    const now = new Date();

    await db.insert(users).values({
      id: userId,
      username: normalized,
      normalizedUsername: normalized.toLowerCase(),
      passwordHash,
      role: "MEMBER",
      createdAt: now,
      updatedAt: now,
    });

    // Create session
    const session = await createSession(userId);

    const body: RegisterResponse = {
      id: userId,
      username: normalized,
      role: "MEMBER",
      createdAt: now.toISOString(),
    };

    reply.setCookie(SESSION_COOKIE, session.token, COOKIE_OPTIONS);
    return reply.status(201).send(body);
  });

  // POST /api/auth/login
  app.post("/api/auth/login", async (req, reply) => {
    const parse = LoginRequest.safeParse(req.body);
    if (!parse.success) {
      return reply.status(400).send({
        error: "VALIDATION",
        message: "请提供用户名和密码",
      });
    }

    const { username, password } = parse.data;
    const normalized = username.normalize("NFKC").trim().toLowerCase();

    const db = getDb();
    const rows = await db
      .select()
      .from(users)
      .where(eq(users.normalizedUsername, normalized));

    if (rows.length === 0) {
      return reply.status(401).send({
        error: "INVALID_CREDENTIALS",
        message: "用户名或密码错误",
      });
    }

    const user = rows[0];
    const valid = await verifyPassword(user.passwordHash, password);

    if (!valid) {
      return reply.status(401).send({
        error: "INVALID_CREDENTIALS",
        message: "用户名或密码错误",
      });
    }

    const session = await createSession(user.id);

    const body: LoginResponse = {
      id: user.id,
      username: user.username,
      role: user.role as LoginResponse["role"],
    };

    reply.setCookie(SESSION_COOKIE, session.token, COOKIE_OPTIONS);
    return reply.send(body);
  });

  // POST /api/auth/logout
  app.post("/api/auth/logout", async (req, reply) => {
    const token = req.cookies[SESSION_COOKIE];
    if (token) {
      await revokeSession(token);
    }
    // Force-clear: set empty value with maxAge=0 and past expiry
    reply.header("Set-Cookie", `${SESSION_COOKIE}=; Path=/; Max-Age=0; HttpOnly; SameSite=Lax${COOKIE_OPTIONS.secure ? "; Secure" : ""}`);
    return reply.status(204).send();
  });
};
