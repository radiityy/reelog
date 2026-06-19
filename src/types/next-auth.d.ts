import type { DefaultSession } from "next-auth";

declare module "next-auth" {
  interface Session {
    user: {
      id: string;
      username: string | null;
      role: "USER" | "ADMIN";
      onboardingCompleted: boolean;
    } & DefaultSession["user"];
  }

  interface User {
    username: string | null;
    role: "USER" | "ADMIN";
    onboardingCompleted: boolean;
  }
}