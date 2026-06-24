import { beforeAll, afterAll } from "vitest";

// Set test environment variables
process.env.NODE_ENV = "test";
process.env.DB_HOST = process.env.DB_HOST ?? "127.0.0.1";
process.env.DB_PORT = process.env.DB_PORT ?? "3306";
process.env.DB_USER = process.env.DB_USER ?? "community_gate";
process.env.DB_PASSWORD = process.env.DB_PASSWORD ?? "community_gate_dev";
process.env.DB_NAME = process.env.DB_NAME ?? "community_gate_test";
process.env.COOKIE_SECRET = "test-cookie-secret";
process.env.LLM_PROVIDER = "fake"; // Will be overridden in tests
