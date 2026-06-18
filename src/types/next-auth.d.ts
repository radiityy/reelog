import type { Role } from "@prisma/client";
import type { DefaultSession } from "next-auth";

declare module "next-auth" {
  interface Session {
    user: {
      id: string;
      username: string | null;
      role: Role;
      onboardingCompleted: boolean;
    } & DefaultSession["user"];
  }

  interface User {
    username: string | null;
    role: Role;
    onboardingCompleted: boolean;
  }
}