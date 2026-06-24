import { ModerationResult } from "@community-gate/contracts";
import { ModerationProvider } from "./provider.js";

/**
 * Fake provider for testing — configurable to return ALLOW, BLOCK, or throw.
 */
export class FakeProvider implements ModerationProvider {
  readonly name = "fake";
  readonly model = "fake-model";

  private readonly mode: "allow" | "block" | "throw" | "custom";
  private readonly customResult?: ModerationResult;

  constructor(
    mode: "allow" | "block" | "throw" | "custom" = "allow",
    customResult?: ModerationResult
  ) {
    this.mode = mode;
    this.customResult = customResult;
  }

  async checkUsername(
    _username: string,
    _promptVersion: string
  ): Promise<ModerationResult> {
    switch (this.mode) {
      case "allow":
        return { allowed: true };
      case "block":
        return {
          allowed: false,
          category: "辱骂",
          reason: "用户名包含不当内容",
        };
      case "throw":
        throw new Error("Simulated provider error");
      case "custom":
        return this.customResult!;
    }
  }
}
