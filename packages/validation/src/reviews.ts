import { z } from "zod";

export const submitReviewBodySchema = z.object({
  rating: z.number().min(0.1).max(10),
  comment: z.string().max(1000).nullable().optional(),
});

export type SubmitReviewBody = z.infer<typeof submitReviewBodySchema>;
