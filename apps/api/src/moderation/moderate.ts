import { v4 as uuid } from "uuid";
import { createHash } from "node:crypto";
import { ModerationDecision } from "@community-gate/contracts";
import { getDb } from "../db/connection.js";
import { moderationAttempts } from "../db/schema.js";
import { getProvider } from "./factory.js";
import { PROMPT_VERSION } from "./prompt.js";

export interface ModerationOutcome {
  decision: ModerationDecision;
  category?: string;
  reason?: string;
}

function hashCandidate(username: string): string {
  return createHash("sha256").update(username).digest("hex");
}

export async function moderateUsername(
  username: string
): Promise<ModerationOutcome> {
  const provider = getProvider();
  const promptVersion = PROMPT_VERSION;
  const startTime = Date.now();

  // Try primary attempt
  let result = await tryModerate(username, provider, promptVersion);
  if (result) {
    const latency = Date.now() - startTime;
    await recordAttempt(username, provider.name, provider.model, promptVersion, result, latency);
    return result;
  }

  // Retry once
  await sleep(500);
  result = await tryModerate(username, provider, promptVersion);
  if (result) {
    const latency = Date.now() - startTime;
    await recordAttempt(username, provider.name, provider.model, promptVersion, result, latency);
    return result;
  }

  // Both attempts failed
  const latency = Date.now() - startTime;
  await recordError(
    username,
    provider.name,
    provider.model,
    promptVersion,
    "BOTH_ATTEMPTS_FAILED",
    latency
  );

  return { decision: "ERROR" };
}

async function tryModerate(
  username: string,
  provider: { name: string; checkUsername: (u: string, v: string) => Promise<{ allowed: boolean; category?: string; reason?: string }> },
  promptVersion: string
): Promise<ModerationOutcome | null> {
  try {
    const result = await provider.checkUsername(username, promptVersion);

    return {
      decision: result.allowed ? "ALLOW" : "BLOCK",
      category: result.category,
      reason: result.reason,
    };
  } catch {
    return null;
  }
}

async function recordAttempt(
  username: string,
  provider: string,
  model: string,
  promptVersion: string,
  outcome: ModerationOutcome,
  latencyMs: number
): Promise<void> {
  try {
    const db = getDb();
    await db.insert(moderationAttempts).values({
      id: uuid(),
      candidateHash: hashCandidate(username),
      provider,
      model,
      promptVersion,
      decision: outcome.decision,
      category: outcome.category ?? null,
      reason: outcome.reason ?? null,
      latencyMs,
      createdAt: new Date(),
    });
  } catch {
    // Logging failure should not block registration
    console.error("Failed to record moderation attempt");
  }
}

async function recordError(
  username: string,
  provider: string,
  model: string,
  promptVersion: string,
  errorCode: string,
  latencyMs: number
): Promise<void> {
  try {
    const db = getDb();
    await db.insert(moderationAttempts).values({
      id: uuid(),
      candidateHash: hashCandidate(username),
      provider,
      model,
      promptVersion,
      decision: "ERROR",
      errorCode,
      latencyMs,
      createdAt: new Date(),
    });
  } catch {
    console.error("Failed to record moderation error");
  }
}

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}
