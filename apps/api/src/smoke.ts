/**
 * Production smoke test — runs against a live server.
 * Usage: SMOKE_URL=http://localhost:3000 npx tsx src/smoke.ts
 */
const BASE = process.env.SMOKE_URL ?? "http://127.0.0.1:3000";

interface TestResult {
  name: string;
  pass: boolean;
  detail: string;
}

async function fetchJson(path: string, init?: RequestInit) {
  const res = await fetch(`${BASE}${path}`, {
    ...init,
    headers: { "Content-Type": "application/json", ...init?.headers },
    credentials: "include",
    redirect: "manual",
  });
  let body: any;
  try {
    body = await res.json();
  } catch {
    body = null;
  }
  return { status: res.status, body, headers: res.headers };
}

function extractCookie(headers: Headers): string | null {
  const setCookie = headers.get("set-cookie");
  if (!setCookie) return null;
  const match = setCookie.match(/cg_session=([^;]+)/);
  return match ? match[1] : null;
}

async function run() {
  console.log(`Smoke testing: ${BASE}\n`);
  const results: TestResult[] = [];
  let memberCookie: string | null = null;

  // Health checks
  const live = await fetch(`${BASE}/health/live`);
  results.push({
    name: "GET /health/live",
    pass: live.ok && ((await live.json()) as any).status === "ok",
    detail: `status=${live.status}`,
  });

  const ready = await fetch(`${BASE}/health/ready`);
  results.push({
    name: "GET /health/ready",
    pass: ready.ok,
    detail: `status=${ready.status}`,
  });

  // Register
  const registerRes = await fetchJson("/api/auth/register", {
    method: "POST",
    body: JSON.stringify({
      username: `smoke_${Date.now()}`,
      password: "smoke_password_123",
    }),
  });
  results.push({
    name: "POST /api/auth/register",
    pass: registerRes.status === 201,
    detail: `status=${registerRes.status}`,
  });
  memberCookie = extractCookie(registerRes.headers);

  // Me
  if (memberCookie) {
    const meRes = await fetchJson("/api/auth/me", {
      headers: { cookie: `cg_session=${memberCookie}` } as any,
    });
    results.push({
      name: "GET /api/auth/me",
      pass: meRes.status === 200 && meRes.body?.role === "MEMBER",
      detail: `role=${meRes.body?.role}`,
    });

    // Resource A
    const aRes = await fetchJson("/api/resources/a", {
      headers: { cookie: `cg_session=${memberCookie}` } as any,
    });
    results.push({
      name: "GET /api/resources/a (MEMBER)",
      pass: aRes.status === 200,
      detail: `status=${aRes.status}`,
    });

    // Resource B (should be denied)
    const bRes = await fetchJson("/api/resources/b", {
      headers: { cookie: `cg_session=${memberCookie}` } as any,
    });
    results.push({
      name: "GET /api/resources/b (MEMBER → 403)",
      pass: bRes.status === 403,
      detail: `status=${bRes.status}`,
    });

    // Logout
    const logoutRes = await fetchJson("/api/auth/logout", {
      method: "POST",
      headers: { cookie: `cg_session=${memberCookie}` } as any,
    });
    results.push({
      name: "POST /api/auth/logout",
      pass: logoutRes.status === 204,
      detail: `status=${logoutRes.status}`,
    });
  }

  // Summary
  const passed = results.filter((r) => r.pass).length;
  console.log("Results:");
  for (const r of results) {
    console.log(`  ${r.pass ? "✓" : "✗"} ${r.name} (${r.detail})`);
  }
  console.log(`\n${passed}/${results.length} passed`);

  if (passed < results.length) {
    process.exit(1);
  }
}

run().catch((err) => {
  console.error("Smoke test failed:", err);
  process.exit(1);
});
