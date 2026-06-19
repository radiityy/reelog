import { getServerSession } from "next-auth";
import { NextResponse } from "next/server";

import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { getTmdbTitleDetails } from "@/lib/tmdb";
import { createDiaryEntrySchema } from "@/lib/validation/diary";

export async function POST(request: Request) {
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

  const result = createDiaryEntrySchema.safeParse(requestBody);

  if (!result.success) {
    return NextResponse.json(
      {
        message:
          result.error.issues[0]?.message ?? "Invalid diary entry.",
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

    const {
    tmdbId,
    mediaType,
    watchedAt,
    rating,
    review,
    privateNotes,
    spoiler,
    isPublic,
    reviewIsPublic,
    } = result.data;

  try {
    const media = await getTmdbTitleDetails(mediaType, tmdbId);

    const diaryEntry = await prisma.diaryEntry.create({
      data: {
        userId: user.id,
        tmdbId: media.id,
        mediaType: media.mediaType,
        title: media.title,
        posterPath: media.posterPath,
        watchedAt: new Date(`${watchedAt}T12:00:00.000Z`),
        rating,
        review: review || null,
        privateNotes: privateNotes || null,
        spoiler,
        isPublic,
        reviewIsPublic:
        isPublic && review.length > 0
            ? reviewIsPublic
            : false,
         },
      select: {
        id: true,
        title: true,
      },
    });

    return NextResponse.json(
      {
        message: "Diary entry created.",
        diaryEntry,
      },
      {
        status: 201,
      },
    );
  } catch (error) {
    console.error("Failed to create diary entry:", error);

    return NextResponse.json(
      {
        message: "Unable to save this diary entry.",
      },
      {
        status: 500,
      },
    );
  }
}