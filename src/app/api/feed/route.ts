import { FollowStatus } from "@prisma/client";
import { getServerSession } from "next-auth";
import { NextResponse } from "next/server";

import { getUserAvatarUrl } from "@/lib/avatar";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

const DEFAULT_PAGE_SIZE = 10;
const MAX_PAGE_SIZE = 20;

type FeedCursor = {
  createdAt: Date;
  id: string;
};

export async function GET(request: Request) {
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
      onboardingCompleted: true,
      deletedAt: null,
      suspendedAt: null,
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

  const url = new URL(request.url);
  const limit = getPageSize(
    url.searchParams.get("limit"),
  );

  const cursorValue =
    url.searchParams.get("cursor");

  const cursor = cursorValue
    ? decodeCursor(cursorValue)
    : null;

  if (cursorValue && !cursor) {
    return NextResponse.json(
      {
        message: "Feed cursor is invalid.",
      },
      {
        status: 400,
      },
    );
  }

  try {
    const entries =
      await prisma.diaryEntry.findMany({
        where: {
          isPublic: true,
          deletedAt: null,

          user: {
            onboardingCompleted: true,
            deletedAt: null,
            suspendedAt: null,

            followers: {
              some: {
                followerId: user.id,
                status: FollowStatus.ACCEPTED,
              },
            },
          },

          ...(cursor
            ? {
                OR: [
                  {
                    createdAt: {
                      lt: cursor.createdAt,
                    },
                  },
                  {
                    createdAt: cursor.createdAt,
                    id: {
                      lt: cursor.id,
                    },
                  },
                ],
              }
            : {}),
        },

        orderBy: [
          {
            createdAt: "desc",
          },
          {
            id: "desc",
          },
        ],

        take: limit + 1,

        select: {
          id: true,
          tmdbId: true,
          mediaType: true,
          title: true,
          posterPath: true,
          rating: true,
          review: true,
          reviewIsPublic: true,
          spoiler: true,
          watchedAt: true,
          createdAt: true,

          user: {
            select: {
              id: true,
              username: true,
              name: true,
              image: true,
              avatarPath: true,
              isPublic: true,
            },
          },
        },
      });

    const hasMore = entries.length > limit;

    const pageEntries = hasMore
      ? entries.slice(0, limit)
      : entries;

    const items = pageEntries
      .filter((entry) =>
        Boolean(entry.user.username),
      )
      .map((entry) => ({
        id: entry.id,
        tmdbId: entry.tmdbId,
        mediaType: entry.mediaType,
        title: entry.title,
        posterPath: entry.posterPath,
        rating: entry.rating,
        review:
          entry.reviewIsPublic &&
          entry.review?.trim()
            ? entry.review
            : null,
        spoiler:
          entry.reviewIsPublic &&
          Boolean(entry.review)
            ? entry.spoiler
            : false,
        watchedAt: entry.watchedAt,
        createdAt: entry.createdAt,

        user: {
          id: entry.user.id,
          username: entry.user.username as string,
          name: entry.user.name,
          avatarUrl: getUserAvatarUrl(
            entry.user.avatarPath,
            entry.user.image,
          ),
          isPrivate: !entry.user.isPublic,
        },
      }));

    const lastEntry =
      pageEntries[pageEntries.length - 1];

    const nextCursor =
      hasMore && lastEntry
        ? encodeCursor({
            createdAt: lastEntry.createdAt,
            id: lastEntry.id,
          })
        : null;

    return NextResponse.json({
      items,
      nextCursor,
      hasMore,
    });
  } catch (error) {
    console.error(
      "Failed to load social feed:",
      error,
    );

    return NextResponse.json(
      {
        message: "Unable to load social feed.",
      },
      {
        status: 500,
      },
    );
  }
}

function getPageSize(value: string | null) {
  if (!value) {
    return DEFAULT_PAGE_SIZE;
  }

  const parsedValue = Number(value);

  if (
    !Number.isInteger(parsedValue) ||
    parsedValue < 1
  ) {
    return DEFAULT_PAGE_SIZE;
  }

  return Math.min(
    parsedValue,
    MAX_PAGE_SIZE,
  );
}

function encodeCursor(cursor: FeedCursor) {
  return Buffer.from(
    JSON.stringify({
      createdAt: cursor.createdAt.toISOString(),
      id: cursor.id,
    }),
  ).toString("base64url");
}

function decodeCursor(
  value: string,
): FeedCursor | null {
  try {
    const decodedValue = Buffer.from(
      value,
      "base64url",
    ).toString("utf8");

    const parsedValue = JSON.parse(
      decodedValue,
    ) as {
      createdAt?: unknown;
      id?: unknown;
    };

    if (
      typeof parsedValue.createdAt !==
        "string" ||
      typeof parsedValue.id !== "string" ||
      !parsedValue.id
    ) {
      return null;
    }

    const createdAt = new Date(
      parsedValue.createdAt,
    );

    if (
      Number.isNaN(createdAt.getTime())
    ) {
      return null;
    }

    return {
      createdAt,
      id: parsedValue.id,
    };
  } catch {
    return null;
  }
}