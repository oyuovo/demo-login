import { ModerationResult } from "@community-gate/contracts";
import { ModerationProvider } from "../provider.js";
import { buildSystemPrompt, buildUserMessage } from "../prompt.js";

export class QwenProvider implements ModerationProvider {
  readonly name = "qwen";
  readonly model: string;
  private readonly apiKey: string;
  private readonly baseUrl: string;

  constructor(config?: {
    apiKey?: string;
    baseUrl?: string;
    model?: string;
  }) {
    this.apiKey = config?.apiKey ?? process.env.QWEN_API_KEY ?? "";
    this.baseUrl =
      config?.baseUrl ??
      process.env.QWEN_BASE_URL ??
      "https://dashscope.aliyuncs.com/compatible-mode/v1";
    this.model = config?.model ?? process.env.QWEN_MODEL ?? "qwen-turbo";
  }

  async checkUsername(
    username: string,
    promptVersion: string
  ): Promise<ModerationResult> {
    const response = await fetch(`${this.baseUrl}/chat/completions`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${this.apiKey}`,
      },
      body: JSON.stringify({
        model: this.model,
        temperature: 0,
        max_tokens: 256,
        messages: [
          { role: "system", content: buildSystemPrompt() },
          { role: "user", content: buildUserMessage(username) },
        ],
      }),
      signal: AbortSignal.timeout(15000),
    });

    if (!response.ok) {
      const text = await response.text().catch(() => "");
      throw new Error(`LLM API error ${response.status}: ${text.slice(0, 200)}`);
    }

    const data = (await response.json()) as {
      choices: Array<{ message: { content: string } }>;
    };

    const raw = data.choices?.[0]?.message?.content ?? "";
    return this.parseResponse(raw);
  }

  private parseResponse(raw: string): ModerationResult {
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

    try {
      const parsed = JSON.parse(jsonStr);

      if (typeof parsed.allowed !== "boolean") {
        throw new Error("Missing 'allowed' field");
      }

      return {
        allowed: parsed.allowed,
        category: parsed.category ?? undefined,
        reason: parsed.reason ?? undefined,
      };
    } catch {
      throw new Error(
        `Failed to parse moderation response: ${raw.slice(0, 200)}`
      );
    }
  }
}
