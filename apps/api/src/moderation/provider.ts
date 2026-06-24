import { ModerationResult } from "@community-gate/contracts";

export interface ModerationProvider {
  readonly name: string;
  readonly model: string;
  checkUsername(username: string, promptVersion: string): Promise<ModerationResult>;
}
