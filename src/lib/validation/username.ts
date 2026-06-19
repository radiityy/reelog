import { z } from "zod";

export const RESERVED_USERNAMES = [
  "admin",
  "api",
  "auth",
  "dashboard",
  "diary",
  "explore",
  "login",
  "logout",
  "onboarding",
  "privacy",
  "profile",
  "reelog",
  "search",
  "settings",
  "terms",
  "u",
  "user",
  "users",
  "watchlist",
];

export const usernameSchema = z
  .string()
  .trim()
  .toLowerCase()
  .min(3, "Username must contain at least 3 characters.")
  .max(24, "Username cannot exceed 24 characters.")
  .regex(
    /^[a-z0-9_]+$/,
    "Use lowercase letters, numbers, and underscores only.",
  )
  .refine(
    (username) => !RESERVED_USERNAMES.includes(username),
    "This username is reserved.",
  );

export const onboardingSchema = z.object({
  username: usernameSchema,
});

export type OnboardingInput = z.infer<typeof onboardingSchema>;