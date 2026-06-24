import Fastify from "fastify";
import cookie from "@fastify/cookie";
import { authPlugin } from "../auth/plugin.js";
import { resourcesPlugin } from "../resources/plugin.js";
import { FakeProvider } from "../moderation/fake-provider.js";
import { setProvider, resetProvider } from "../moderation/factory.js";

export type TestApp = ReturnType<typeof buildTestApp> extends Promise<infer T> ? T : never;

export async function buildTestApp(options?: {
  moderationMode?: "allow" | "block" | "throw";
}) {
  resetProvider();
  const fake = new FakeProvider(options?.moderationMode ?? "allow");
  setProvider(fake);

  const app = Fastify({ logger: false });

  await app.register(cookie, { secret: "test-secret" });

  // Register auth with rate limit disabled for tests
  await app.register(authPlugin);
  await app.register(resourcesPlugin);

  // Health endpoints
  app.get("/health/live", async () => ({ status: "ok" }));
  app.get("/health/ready", async () => ({ status: "ready", database: "connected" }));

  await app.ready();
  return app;
}
