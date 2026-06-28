import { z } from "zod";

const reservedUsernames = new Set([
  "admin",
  "api",
  "auth",
  "diary",
  "featured-films",
  "follow-requests",
  "followers",
  "following",
  "help",
  "home",
  "login",
  "logout",
  "notifications",
  "onboarding",
  "privacy",
  "profile",
  "reelog",
  "search",
  "settings",
  "support",
  "terms",
  "title",
  "u",
  "watchlist",
]);

const usernameSchema = z
  .string()
  .trim()
  .min(3, "Username must contain at least 3 characters.")
  .max(24, "Username cannot exceed 24 characters.")
  .regex(
    /^[A-Za-z0-9_]+$/,
    "Username may only contain letters, numbers, and underscores.",
  )
  .refine(
    (value) => !value.startsWith("_") && !value.endsWith("_"),
    "Username cannot start or end with an underscore.",
  )
  .refine(
    (value) => !value.includes("__"),
    "Username cannot contain consecutive underscores.",
  )
  .transform((value) => value.toLowerCase())
  .refine(
    (value) => !reservedUsernames.has(value),
    "This username is reserved.",
  );

const socialLinkSchema = z
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
  }, "Enter a valid HTTP or HTTPS URL.");

export const updateAccountSettingsSchema = z.object({
  name: z
    .string()
    .trim()
    .min(1, "Display name is required.")
    .max(80, "Display name cannot exceed 80 characters."),
  username: usernameSchema,
  bio: z
    .string()
    .trim()
    .max(160, "Bio cannot exceed 160 characters."),
  socialLink: socialLinkSchema,
  isPublic: z.boolean(),
  defaultDiaryVisibility: z.enum(["PRIVATE", "PUBLIC"]),
});

export type UpdateAccountSettingsInput = z.infer<
  typeof updateAccountSettingsSchema
>;