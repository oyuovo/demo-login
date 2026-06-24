import { describe, it, expect } from "vitest";

// Test JSON parsing logic by replicating parseResponse from deepseek adapter
function parseModerationResponse(raw: string): {
  allowed: boolean;
  category?: string;
  reason?: string;
} {
  let jsonStr = raw.trim();

  const fenceMatch = jsonStr.match(/```(?:json)?\s*([\s\S]*?)```/);
  if (fenceMatch) {
    jsonStr = fenceMatch[1].trim();
  }

  const braceStart = jsonStr.indexOf("{");
  const braceEnd = jsonStr.lastIndexOf("}");
  if (braceStart !== -1 && braceEnd !== -1 && braceEnd > braceStart) {
    jsonStr = jsonStr.slice(braceStart, braceEnd + 1);
  }

  const parsed = JSON.parse(jsonStr);
  if (typeof parsed.allowed !== "boolean") {
    throw new Error("Missing 'allowed' field");
  }
  return {
    allowed: parsed.allowed,
    category: parsed.category ?? undefined,
    reason: parsed.reason ?? undefined,
  };
}

describe("Moderation JSON parsing", () => {
  it("parses a clean ALLOW response", () => {
    const result = parseModerationResponse('{"allowed":true,"category":null,"reason":null}');
    expect(result.allowed).toBe(true);
    expect(result.category).toBeUndefined();
  });

  it("parses a clean BLOCK response", () => {
    const result = parseModerationResponse(
      '{"allowed":false,"category":"辱骂","reason":"包含侮辱性内容"}'
    );
    expect(result.allowed).toBe(false);
    expect(result.category).toBe("辱骂");
    expect(result.reason).toBe("包含侮辱性内容");
  });

  it("extracts JSON from markdown code fence", () => {
    const result = parseModerationResponse(
      '```json\n{"allowed":true,"category":null,"reason":null}\n```'
    );
    expect(result.allowed).toBe(true);
  });

  it("extracts JSON from plain code fence", () => {
    const result = parseModerationResponse(
      '```\n{"allowed":false,"category":"色情","reason":"test"}\n```'
    );
    expect(result.allowed).toBe(false);
  });

  it("extracts JSON with surrounding text", () => {
    const result = parseModerationResponse(
      'Here is the result: {"allowed":true,"category":null,"reason":null} End.'
    );
    expect(result.allowed).toBe(true);
  });

  it("throws on invalid JSON", () => {
    expect(() => parseModerationResponse("not json at all")).toThrow();
  });

  it("throws when allowed field is missing", () => {
    expect(() => parseModerationResponse('{"category":"test"}')).toThrow();
  });

  it("handles whitespace and newlines", () => {
    const result = parseModerationResponse(
      '  \n  {"allowed": true,  "category": null,  "reason": null}  \n  '
    );
    expect(result.allowed).toBe(true);
  });
});
