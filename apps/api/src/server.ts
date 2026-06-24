import "./env.js";
import Fastify from "fastify";
import cookie from "@fastify/cookie";
import rateLimit from "@fastify/rate-limit";
import { authPlugin } from "./auth/plugin.js";
import { resourcesPlugin } from "./resources/plugin.js";
import { testConnection } from "./db/connection.js";
import { PROMPT_VERSION } from "./moderation/prompt.js";
import { cleanupExpiredSessions } from "./auth/session.js";
import { readFileSync } from "node:fs";
import { join } from "node:path";

const PORT = Number(process.env.PORT ?? 3000);
const HOST = process.env.HOST ?? "0.0.0.0";
const COOKIE_SECRET = process.env.COOKIE_SECRET ?? "dev-secret-change-in-production";

const app = Fastify({
  logger: {
    level: process.env.LOG_LEVEL ?? "info",
    ...(process.env.NODE_ENV === "development" && {
      transport: {
        target: "pino-pretty",
        options: { colorize: true },
      },
    }),
  },
});

// Plugins
await app.register(cookie, {
  secret: COOKIE_SECRET,
});

await app.register(rateLimit, {
  max: 100,
  timeWindow: "1 minute",
  keyGenerator: (req) => {
    // Rate limit by IP for general routes
    return req.ip;
  },
});

// Stricter rate limits for auth endpoints
app.register(async (authScope) => {
  await authScope.register(rateLimit, {
    max: 10,
    timeWindow: "1 minute",
    keyGenerator: (req) => {
      // Rate limit by IP + route
      return `${req.ip}:${req.routeOptions.url}`;
    },
  });

  await authScope.register(authPlugin);
});

// Resource routes (with default rate limit)
await app.register(resourcesPlugin);

// Health endpoints
app.get("/health/live", async () => {
  return { status: "ok", uptime: process.uptime() };
});

app.get("/health/ready", async (_req, reply) => {
  const dbOk = await testConnection();
  if (!dbOk) {
    return reply.status(503).send({
      status: "not_ready",
      database: "unreachable",
    });
  }
  return {
    status: "ready",
    database: "connected",
    moderationPromptVersion: PROMPT_VERSION,
  };
});

// Serve static frontend in production
if (process.env.NODE_ENV === "production") {
  const webDist = join(import.meta.dirname, "..", "..", "web", "dist");

  app.register(import("@fastify/static"), {
    root: webDist,
    prefix: "/",
  });

  // SPA fallback — serve index.html for non-API routes
  app.setNotFoundHandler(async (req, reply) => {
    if (req.url.startsWith("/api/") || req.url.startsWith("/health/")) {
      return reply.status(404).send({ error: "NOT_FOUND", message: "接口不存在" });
    }
    try {
      const html = readFileSync(join(webDist, "index.html"), "utf-8");
      reply.type("text/html").send(html);
    } catch {
      return reply.status(404).send({ error: "NOT_FOUND", message: "页面未找到" });
    }
  });
}

// Start
try {
  await app.listen({ port: PORT, host: HOST });
  app.log.info({ port: PORT, host: HOST }, "Server started");

  // Clean up expired sessions on startup, then every hour
  cleanupExpiredSessions().catch(() => {});
  setInterval(() => cleanupExpiredSessions().catch(() => {}), 60 * 60 * 1000);
} catch (err) {
  app.log.error(err);
  process.exit(1);
}

export { app };
