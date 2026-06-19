import { z } from "zod";

const mediaTypeSchema = z.enum(["movie", "tv"]);

const watchedDateSchema = z
  .string()
  .regex(/^\d{4}-\d{2}-\d{2}$/, "Watched date is invalid.")
  .refine((value) => {
    const [year, month, day] = value.split("-").map(Number);
    const date = new Date(Date.UTC(year, month - 1, day));

    return (
      date.getUTCFullYear() === year &&
      date.getUTCMonth() === month - 1 &&
      date.getUTCDate() === day
    );
  }, "Watched date is invalid.");

const ratingSchema = z
  .number()
  .min(0.5, "Rating must be at least 0.5.")
  .max(5, "Rating cannot exceed 5.")
  .refine(
    (value) => Number.isInteger(value * 2),
    "Rating must use 0.5 increments.",
  )
  .nullable();

const editableDiaryFields = {
  watchedAt: watchedDateSchema,
  rating: ratingSchema,
  review: z
    .string()
    .trim()
    .max(1000, "Review cannot exceed 1000 characters."),
  privateNotes: z
    .string()
    .trim()
    .max(1000, "Private notes cannot exceed 1000 characters."),
  spoiler: z.boolean(),
  isPublic: z.boolean(),
  reviewIsPublic: z.boolean(),
};

function validateVisibility(
  data: {
    review: string;
    isPublic: boolean;
    reviewIsPublic: boolean;
  },
  context: z.RefinementCtx,
) {
  if (data.reviewIsPublic && !data.isPublic) {
    context.addIssue({
      code: z.ZodIssueCode.custom,
      path: ["reviewIsPublic"],
      message:
        "A review cannot be public when the diary entry is private.",
    });
  }

  if (data.reviewIsPublic && !data.review.trim()) {
    context.addIssue({
      code: z.ZodIssueCode.custom,
      path: ["reviewIsPublic"],
      message: "Write a review before making it public.",
    });
  }
}

export const createDiaryEntrySchema = z
  .object({
    tmdbId: z.number().int().positive(),
    mediaType: mediaTypeSchema,
    ...editableDiaryFields,
  })
  .superRefine(validateVisibility);

export const updateDiaryEntrySchema = z
  .object(editableDiaryFields)
  .superRefine(validateVisibility);

export type CreateDiaryEntryInput = z.infer<
  typeof createDiaryEntrySchema
>;

export type UpdateDiaryEntryInput = z.infer<
  typeof updateDiaryEntrySchema
>;