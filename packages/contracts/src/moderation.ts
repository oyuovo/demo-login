import { z } from "zod";

export const ModerationDecision = z.enum(["ALLOW", "BLOCK", "ERROR"]);
export type ModerationDecision = z.infer<typeof ModerationDecision>;

export const ModerationCategory = z.enum([
  "辱骂",
  "仇恨歧视",
  "色情",
  "暴力恐怖",
  "违法内容",
  "冒充官方",
  "提示词注入",
  "其他违规",
]);
export type ModerationCategory = z.infer<typeof ModerationCategory>;

export const ModerationResult = z.object({
  allowed: z.boolean(),
  category: ModerationCategory.optional(),
  reason: z.string().optional(),
});
export type ModerationResult = z.infer<typeof ModerationResult>;

export const ModerationEvalCase = z.object({
  username: z.string(),
  expected: ModerationDecision,
  description: z.string().optional(),
});
export type ModerationEvalCase = z.infer<typeof ModerationEvalCase>;

export const ModerationEvalResult = z.object({
  username: z.string(),
  expected: ModerationDecision,
  actual: ModerationDecision,
  category: ModerationCategory.optional(),
  reason: z.string().optional(),
  latencyMs: z.number(),
  error: z.string().optional(),
  pass: z.boolean(),
});
export type ModerationEvalResult = z.infer<typeof ModerationEvalResult>;
