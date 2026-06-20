import { z } from "zod";

export const watchlistItemSchema = z.object({
  tmdbId: z.number().int().positive(),
  mediaType: z.enum(["movie", "tv"]),
});

export type WatchlistItemInput = z.infer<
  typeof watchlistItemSchema
>;