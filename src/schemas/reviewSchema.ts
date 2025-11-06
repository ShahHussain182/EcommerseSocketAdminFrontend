import { z } from "zod";

export const updateReviewSchema = z.object({
  rating: z.number().int().min(1, "Rating must be at least 1 star.").max(5, "Rating cannot exceed 5 stars.").optional(),
  title: z.string().max(100, "Review title cannot exceed 100 characters.").optional(),
  comment: z.string().min(10, "Review comment must be at least 10 characters.").max(1000, "Review comment cannot exceed 1000 characters.").optional(),
}).strict().partial(); // Allow partial updates for review edits