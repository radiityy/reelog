import { revalidatePath } from "next/cache";
import { getServerSession } from "next-auth";
import { NextResponse } from "next/server";

import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { updateDiaryEntrySchema } from "@/lib/validation/diary";

type RouteContext = {
  params: {
    id: string;
  };
};

export async function PATCH(
  request: Request,
  { params }: RouteContext,
) {
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

  const result = updateDiaryEntrySchema.safeParse(requestBody);

  if (!result.success) {
    return NextResponse.json(
      {
        message:
          result.error.issues[0]?.message ??
          "Invalid diary entry.",
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

  const existingEntry = await prisma.diaryEntry.findFirst({
    where: {
      id: params.id,
      userId: user.id,
      deletedAt: null,
    },
    select: {
      id: true,
    },
  });

  if (!existingEntry) {
    return NextResponse.json(
      {
        message: "Diary entry was not found.",
      },
      {
        status: 404,
      },
    );
  }

  const {
    watchedAt,
    rating,
    review,
    privateNotes,
    spoiler,
    isPublic,
    reviewIsPublic,
  } = result.data;

  const hasReview = review.length > 0;

  try {
    const diaryEntry = await prisma.diaryEntry.update({
      where: {
        id: existingEntry.id,
      },
      data: {
        watchedAt: new Date(`${watchedAt}T12:00:00.000Z`),
        rating,
        review: hasReview ? review : null,
        privateNotes: privateNotes || null,
        spoiler: hasReview ? spoiler : false,
        isPublic,
        reviewIsPublic:
          hasReview && isPublic ? reviewIsPublic : false,
      },
      select: {
        id: true,
        title: true,
      },
    });

    revalidatePath("/home");
    revalidatePath("/diary");
    revalidatePath(`/diary/${existingEntry.id}`);

    return NextResponse.json({
      message: "Diary entry updated.",
      diaryEntry,
    });
  } catch (error) {
    console.error("Failed to update diary entry:", error);

    return NextResponse.json(
      {
        message: "Unable to update this diary entry.",
      },
      {
        status: 500,
      },
    );
  }
}

export async function DELETE(
  _request: Request,
  { params }: RouteContext,
) {
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

  const user = await prisma.user.findFirst({
    where: {
      id: session.user.id,
      deletedAt: null,
      suspendedAt: null,
      onboardingCompleted: true,
    },
    select: {
      id: true,
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

  try {
    const result = await prisma.diaryEntry.updateMany({
      where: {
        id: params.id,
        userId: user.id,
        deletedAt: null,
      },
      data: {
        deletedAt: new Date(),
      },
    });

    if (result.count === 0) {
      return NextResponse.json(
        {
          message: "Diary entry was not found.",
        },
        {
          status: 404,
        },
      );
    }

    revalidatePath("/home");
    revalidatePath("/diary");
    revalidatePath(`/diary/${params.id}`);

    return NextResponse.json({
      message: "Diary entry deleted.",
    });
  } catch (error) {
    console.error("Failed to delete diary entry:", error);

    return NextResponse.json(
      {
        message: "Unable to delete this diary entry.",
      },
      {
        status: 500,
      },
    );
  }
}