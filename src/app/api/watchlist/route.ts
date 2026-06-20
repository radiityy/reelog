import { revalidatePath } from "next/cache";
import { getServerSession } from "next-auth";
import { NextResponse } from "next/server";

import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { getTmdbTitleDetails } from "@/lib/tmdb";
import { watchlistItemSchema } from "@/lib/validation/watchlist";

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

  const result = watchlistItemSchema.safeParse(requestBody);

  if (!result.success) {
    return NextResponse.json(
      {
        message:
          result.error.issues[0]?.message ??
          "Invalid watchlist item.",
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

  const { tmdbId, mediaType } = result.data;

  try {
    const media = await getTmdbTitleDetails(
      mediaType,
      tmdbId,
    );

    const watchlistItem = await prisma.watchlistItem.upsert({
      where: {
        userId_tmdbId_mediaType: {
          userId: user.id,
          tmdbId,
          mediaType,
        },
      },
      update: {
        title: media.title,
        posterPath: media.posterPath,
        addedAt: new Date(),
        deletedAt: null,
      },
      create: {
        userId: user.id,
        tmdbId,
        mediaType,
        title: media.title,
        posterPath: media.posterPath,
      },
      select: {
        id: true,
        title: true,
      },
    });

    revalidatePath("/watchlist");
    revalidatePath("/search");
    revalidatePath("/home");

    return NextResponse.json(
      {
        message: "Added to watchlist.",
        watchlistItem,
      },
      {
        status: 201,
      },
    );
  } catch (error) {
    console.error("Failed to add watchlist item:", error);

    return NextResponse.json(
      {
        message: "Unable to add this title to your watchlist.",
      },
      {
        status: 500,
      },
    );
  }
}

export async function DELETE(request: Request) {
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

  const result = watchlistItemSchema.safeParse(requestBody);

  if (!result.success) {
    return NextResponse.json(
      {
        message:
          result.error.issues[0]?.message ??
          "Invalid watchlist item.",
      },
      {
        status: 422,
      },
    );
  }

  const { tmdbId, mediaType } = result.data;

  try {
    const updateResult = await prisma.watchlistItem.updateMany({
      where: {
        userId: session.user.id,
        tmdbId,
        mediaType,
        deletedAt: null,
      },
      data: {
        deletedAt: new Date(),
      },
    });

    if (updateResult.count === 0) {
      return NextResponse.json(
        {
          message: "Watchlist item was not found.",
        },
        {
          status: 404,
        },
      );
    }

    revalidatePath("/watchlist");
    revalidatePath("/search");
    revalidatePath("/home");

    return NextResponse.json({
      message: "Removed from watchlist.",
    });
  } catch (error) {
    console.error("Failed to remove watchlist item:", error);

    return NextResponse.json(
      {
        message:
          "Unable to remove this title from your watchlist.",
      },
      {
        status: 500,
      },
    );
  }
}