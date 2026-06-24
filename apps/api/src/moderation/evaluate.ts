import "../env.js";
import { getProvider } from "./factory.js";
import { EVAL_DATASET } from "./eval-dataset.js";
import { ModerationEvalResult } from "@community-gate/contracts";
import { PROMPT_VERSION } from "./prompt.js";
import * as fs from "node:fs";
import * as path from "node:path";

async function evaluate() {
  const provider = getProvider();
  console.log(`\n=== Moderation Evaluation ===`);
  console.log(`Provider: ${provider.name}`);
  console.log(`Model: ${provider.model}`);
  console.log(`Prompt version: ${PROMPT_VERSION}`);
  console.log(`Test cases: ${EVAL_DATASET.length}`);
  console.log(`Time: ${new Date().toISOString()}\n`);

  const results: ModerationEvalResult[] = [];
  let passed = 0;
  let falsePositive = 0;
  let falseNegative = 0;
  let errors = 0;
  let totalLatency = 0;

  for (const testCase of EVAL_DATASET) {
    const start = Date.now();
    let actual: ModerationEvalResult["actual"] = "ERROR";
    let category: string | undefined;
    let reason: string | undefined;
    let error: string | undefined;

    try {
      const result = await provider.checkUsername(testCase.username, PROMPT_VERSION);
      actual = result.allowed ? "ALLOW" : "BLOCK";
      category = result.category;
      reason = result.reason;
    } catch (err) {
      actual = "ERROR";
      error = err instanceof Error ? err.message : String(err);
    }

    const latencyMs = Date.now() - start;
    totalLatency += latencyMs;

    const isPass = actual === testCase.expected;
    if (isPass) passed++;
    if (actual === "BLOCK" && testCase.expected === "ALLOW") falsePositive++;
    if (actual === "ALLOW" && testCase.expected === "BLOCK") falseNegative++;
    if (actual === "ERROR") errors++;

    const status = isPass ? "✓" : "✗";
    console.log(
      `  ${status} "${testCase.username}" | expected=${testCase.expected} actual=${actual} | ${latencyMs}ms` +
        (error ? ` | ERROR: ${error.slice(0, 80)}` : "") +
        (reason ? ` | ${reason}` : "")
    );

    results.push({
      username: testCase.username,
      expected: testCase.expected,
      actual,
      category: category as ModerationEvalResult["category"],
      reason,
      latencyMs,
      error,
      pass: isPass,
    });
  }

  // Summary
  const accuracy = ((passed / EVAL_DATASET.length) * 100).toFixed(1);
  const avgLatency = Math.round(totalLatency / EVAL_DATASET.length);

  console.log(`\n=== Summary ===`);
  console.log(`Total: ${EVAL_DATASET.length}`);
  console.log(`Passed: ${passed}/${EVAL_DATASET.length} (${accuracy}%)`);
  console.log(`False positives (误杀): ${falsePositive}`);
  console.log(`False negatives (漏放): ${falseNegative}`);
  console.log(`Errors: ${errors}`);
  console.log(`Avg latency: ${avgLatency}ms`);

  // Write report
  const reportDir = path.join(process.cwd(), "eval-reports");
  fs.mkdirSync(reportDir, { recursive: true });
  const timestamp = new Date().toISOString().replace(/[:.]/g, "-");
  const reportPath = path.join(
    reportDir,
    `eval-${provider.name}-${PROMPT_VERSION}-${timestamp}.json`
  );

  const report = {
    provider: provider.name,
    model: provider.model,
    promptVersion: PROMPT_VERSION,
    timestamp: new Date().toISOString(),
    accuracy: Number(accuracy),
    falsePositive,
    falseNegative,
    errors,
    avgLatencyMs: avgLatency,
    results,
  };

  fs.writeFileSync(reportPath, JSON.stringify(report, null, 2));
  console.log(`\nReport saved to: ${reportPath}`);
}

evaluate().catch((err) => {
  console.error("Evaluation failed:", err);
  process.exit(1);
});
