import { Prisma } from "@prisma/client";
import { revalidatePath } from "next/cache";
import { getServerSession } from "next-auth";
import { NextResponse } from "next/server";

import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { updateAccountSettingsSchema } from "@/lib/validation/account-settings";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export async function PATCH(request: Request) {
  const session = await getServerSession(authOptions);

  if (!session?.user?.id) {
    return NextResponse.json(
      {
        message: "Unauthorized.",
      },
      {
        status: 401,
      },
    );
  }

  let requestBody: unknown;

  try {
    requestBody = await request.json();
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

  const result =
    updateAccountSettingsSchema.safeParse(requestBody);

  if (!result.success) {
    return NextResponse.json(
      {
        message:
          result.error.issues[0]?.message ??
          "Invalid account settings.",
        errors: result.error.flatten().fieldErrors,
      },
      {
        status: 422,
      },
    );
  }

  const user = await prisma.user.findFirst({
    where: {
      id: session.user.id,
      deletedAt: null,
      suspendedAt: null,
      onboardingCompleted: true,
    },
    select: {
      id: true,
      username: true,
    },
  });

  if (!user?.username) {
    return NextResponse.json(
      {
        message: "User account was not found.",
      },
      {
        status: 404,
      },
    );
  }

  const {
    name,
    username,
    bio,
    socialLink,
    isPublic,
    defaultDiaryVisibility,
  } = result.data;

  const previousUsername = user.username;

  if (username !== previousUsername) {
    const usernameOwner = await prisma.user.findFirst({
      where: {
        id: {
          not: user.id,
        },
        username: {
          equals: username,
          mode: "insensitive",
        },
      },
      select: {
        id: true,
      },
    });

    if (usernameOwner) {
      return NextResponse.json(
        {
          message: "This username is already in use.",
          errors: {
            username: ["This username is already in use."],
          },
        },
        {
          status: 409,
        },
      );
    }
  }

  try {
    const updatedUser = await prisma.user.update({
      where: {
        id: user.id,
      },
      data: {
        name,
        username,
        bio: bio || null,
        socialLink: socialLink || null,
        isPublic,
        defaultDiaryVisibility,
      },
      select: {
        name: true,
        username: true,
        bio: true,
        socialLink: true,
        isPublic: true,
        defaultDiaryVisibility: true,
      },
    });

    revalidatePath("/home");
    revalidatePath("/settings");
    revalidatePath("/diary");
    revalidatePath("/watchlist");
    revalidatePath("/notifications");
    revalidatePath("/follow-requests");
    revalidatePath(`/u/${previousUsername}`);
    revalidatePath(`/u/${updatedUser.username}`);

    return NextResponse.json({
      message:
        username === previousUsername
          ? "Account settings updated."
          : "Account settings and username updated.",
      user: updatedUser,
      profilePath: `/u/${updatedUser.username}`,
    });
  } catch (error) {
    if (
      error instanceof Prisma.PrismaClientKnownRequestError &&
      error.code === "P2002"
    ) {
      return NextResponse.json(
        {
          message: "This username is already in use.",
          errors: {
            username: ["This username is already in use."],
          },
        },
        {
          status: 409,
        },
      );
    }

    console.error("Failed to update account settings:", error);

    return NextResponse.json(
      {
        message: "Unable to update your account settings.",
      },
      {
        status: 500,
      },
    );
  }
}