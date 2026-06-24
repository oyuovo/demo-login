import { z } from "zod";

export const ResourceAContent = z.object({
  resource: z.literal("A"),
  name: z.string(),
  description: z.string(),
  data: z.object({
    announcements: z.array(
      z.object({
        id: z.string(),
        title: z.string(),
        date: z.string(),
        summary: z.string(),
      })
    ),
    guides: z.array(
      z.object({
        id: z.string(),
        title: z.string(),
        url: z.string(),
      })
    ),
  }),
});
export type ResourceAContent = z.infer<typeof ResourceAContent>;

export const ResourceBContent = z.object({
  resource: z.literal("B"),
  name: z.string(),
  description: z.string(),
  data: z.object({
    metrics: z.object({
      totalUsers: z.number(),
      activeUsers24h: z.number(),
      newRegistrations24h: z.number(),
      moderationPassRate: z.number(),
    }),
    operations: z.array(
      z.object({
        id: z.string(),
        action: z.string(),
        operator: z.string(),
        timestamp: z.string(),
      })
    ),
  }),
});
export type ResourceBContent = z.infer<typeof ResourceBContent>;
