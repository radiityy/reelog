import { revalidatePath } from "next/cache";
import { getServerSession } from "next-auth";
import { NextResponse } from "next/server";

import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { updateAccountSettingsSchema } from "@/lib/validation/account-settings";

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

  const result = updateAccountSettingsSchema.safeParse(requestBody);

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

  if (!user) {
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
    bio,
    socialLink,
    isPublic,
    defaultDiaryVisibility,
  } = result.data;

  try {
    const updatedUser = await prisma.user.update({
      where: {
        id: user.id,
      },
      data: {
        name,
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

    if (user.username) {
      revalidatePath(`/u/${user.username}`);
    }

    return NextResponse.json({
      message: "Account settings updated.",
      user: updatedUser,
    });
  } catch (error) {
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