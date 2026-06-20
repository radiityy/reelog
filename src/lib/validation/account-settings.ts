import { z } from "zod";

export const updateAccountSettingsSchema = z.object({
  name: z
    .string()
    .trim()
    .min(1, "Display name is required.")
    .max(80, "Display name cannot exceed 80 characters."),
  bio: z
    .string()
    .trim()
    .max(160, "Bio cannot exceed 160 characters."),
  socialLink: z
    .string()
    .trim()
    .max(500, "Social link cannot exceed 500 characters.")
    .refine((value) => {
      if (!value) {
        return true;
      }

      try {
        const url = new URL(value);

        return url.protocol === "http:" || url.protocol === "https:";
      } catch {
        return false;
      }
    }, "Enter a valid http or https URL."),
  isPublic: z.boolean(),
  defaultDiaryVisibility: z.enum(["PRIVATE", "PUBLIC"]),
});

export type UpdateAccountSettingsInput = z.infer<
  typeof updateAccountSettingsSchema
>;