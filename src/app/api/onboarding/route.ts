import { Prisma } from "@prisma/client";
import { getServerSession } from "next-auth";
import { NextResponse } from "next/server";

import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import {
  onboardingSchema,
  usernameSchema,
} from "@/lib/validation/username";

async function getAuthenticatedUserId() {
  const session = await getServerSession(authOptions);

  return session?.user?.id ?? null;
}

export async function GET(request: Request) {
  const userId = await getAuthenticatedUserId();

  if (!userId) {
    return NextResponse.json(
      {
        message: "Unauthorized.",
      },
      {
        status: 401,
      },
    );
  }

  const { searchParams } = new URL(request.url);
  const result = usernameSchema.safeParse(searchParams.get("username"));

  if (!result.success) {
    return NextResponse.json(
      {
        available: false,
        message: result.error.issues[0]?.message ?? "Invalid username.",
      },
      {
        status: 400,
      },
    );
  }

  const username = result.data;

  const existingUser = await prisma.user.findFirst({
    where: {
      username,
      id: {
        not: userId,
      },
      deletedAt: null,
    },
    select: {
      id: true,
    },
  });

  return NextResponse.json({
    available: !existingUser,
  });
}

export async function POST(request: Request) {
  const userId = await getAuthenticatedUserId();

  if (!userId) {
    return NextResponse.json(
      {
        message: "Unauthorized.",
      },
      {
        status: 401,
      },
    );
  }

  let body: unknown;

  try {
    body = await request.json();
  } catch {
    return NextResponse.json(
      {
        message: "Invalid request body.",
      },
      {
        status: 400,
      },
    );
  }

  const result = onboardingSchema.safeParse(body);

  if (!result.success) {
    return NextResponse.json(
      {
        message: result.error.issues[0]?.message ?? "Invalid input.",
        errors: result.error.flatten().fieldErrors,
      },
      {
        status: 422,
      },
    );
  }

  const { username } = result.data;

  const currentUser = await prisma.user.findFirst({
    where: {
      id: userId,
      deletedAt: null,
      suspendedAt: null,
    },
    select: {
      id: true,
      onboardingCompleted: true,
    },
  });

  if (!currentUser) {
    return NextResponse.json(
      {
        message: "User account was not found.",
      },
      {
        status: 404,
      },
    );
  }

  if (currentUser.onboardingCompleted) {
    return NextResponse.json(
      {
        message: "Onboarding has already been completed.",
      },
      {
        status: 409,
      },
    );
  }

  try {
    const updatedUser = await prisma.user.update({
      where: {
        id: userId,
      },
      data: {
        username,
        onboardingCompleted: true,
      },
      select: {
        id: true,
        username: true,
        onboardingCompleted: true,
      },
    });

    return NextResponse.json({
      message: "Onboarding completed.",
      user: updatedUser,
    });
  } catch (error) {
    if (
      error instanceof Prisma.PrismaClientKnownRequestError &&
      error.code === "P2002"
    ) {
      return NextResponse.json(
        {
          message: "This username is already being used.",
        },
        {
          status: 409,
        },
      );
    }

    console.error("Failed to complete onboarding:", error);

    return NextResponse.json(
      {
        message: "Something went wrong while saving your username.",
      },
      {
        status: 500,
      },
    );
  }
}