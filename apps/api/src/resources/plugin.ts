import { FastifyPluginAsync } from "fastify";
import { eq } from "drizzle-orm";
import { UserRole } from "@community-gate/contracts";
import { getDb } from "../db/connection.js";
import { users } from "../db/schema.js";
import { validateSession } from "../auth/session.js";
import { canAccess } from "../authz/matrix.js";
import { getResourceA, getResourceB } from "./data.js";

const SESSION_COOKIE = "cg_session";

async function getCurrentUserRole(
  token: string
): Promise<UserRole | null> {
  const session = await validateSession(token);
  if (!session) return null;

  const db = getDb();
  const rows = await db
    .select({ role: users.role })
    .from(users)
    .where(eq(users.id, session.userId));

  if (rows.length === 0) return null;
  return rows[0].role as UserRole;
}

export const resourcesPlugin: FastifyPluginAsync = async (app) => {
  // GET /api/resources/a
  app.get("/api/resources/a", async (req, reply) => {
    const token = req.cookies[SESSION_COOKIE];
    if (!token) {
      return reply.status(401).send({
        error: "UNAUTHORIZED",
        message: "请先登录",
      });
    }

    const role = await getCurrentUserRole(token);
    if (!role) {
      return reply.status(401).send({
        error: "UNAUTHORIZED",
        message: "会话无效或已过期",
      });
    }

    if (!canAccess(role, "A")) {
      return reply.status(403).send({
        error: "FORBIDDEN",
        message: "您没有权限访问该资源",
      });
    }

    return reply.send(getResourceA());
  });

  // GET /api/resources/b
  app.get("/api/resources/b", async (req, reply) => {
    const token = req.cookies[SESSION_COOKIE];
    if (!token) {
      return reply.status(401).send({
        error: "UNAUTHORIZED",
        message: "请先登录",
      });
    }

    const role = await getCurrentUserRole(token);
    if (!role) {
      return reply.status(401).send({
        error: "UNAUTHORIZED",
        message: "会话无效或已过期",
      });
    }

    if (!canAccess(role, "B")) {
      return reply.status(403).send({
        error: "FORBIDDEN",
        message: "您没有权限访问内部运营数据",
      });
    }

    return reply.send(getResourceB());
  });
};
