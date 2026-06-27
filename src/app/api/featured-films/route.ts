import { MediaType } from "@prisma/client";
import { revalidatePath } from "next/cache";
import { getServerSession } from "next-auth";
import { NextResponse } from "next/server";

import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { getTmdbTitleDetails } from "@/lib/tmdb";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

type FeaturedFilmInput = {
  tmdbId: number;
  mediaType: MediaType;
  position: number;
};

export async function GET() {
  try {
    const user = await getCurrentUser();

    if (!user) {
      return NextResponse.json(
        {
          message: "Unauthorized.",
        },
        {
          status: 401,
        },
      );
    }

    const items =
      await prisma.featuredFilm.findMany({
        where: {
          userId: user.id,
        },
        orderBy: {
          position: "asc",
        },
        select: {
          id: true,
          tmdbId: true,
          mediaType: true,
          title: true,
          posterPath: true,
          position: true,
        },
      });

    return NextResponse.json({
      items,
      count: items.length,
    });
  } catch (error) {
    console.error(
      "GET /api/featured-films failed:",
      error,
    );

    return NextResponse.json(
      {
        message:
          "Unable to load featured films.",
      },
      {
        status: 500,
      },
    );
  }
}

export async function PUT(request: Request) {
  try {
    const user = await getCurrentUser();

    if (!user?.username) {
      return NextResponse.json(
        {
          message: "Unauthorized.",
        },
        {
          status: 401,
        },
      );
    }

    const requestBody = (await request
      .json()
      .catch(() => null)) as {
      items?: unknown;
    } | null;

    const validationResult =
      validateFeaturedItems(
        requestBody?.items,
      );

    if (!validationResult.success) {
      return NextResponse.json(
        {
          message:
            validationResult.message,
        },
        {
          status: 422,
        },
      );
    }

    const mediaDetails =
      await Promise.all(
        validationResult.items.map(
          async (item) => {
            const media =
              await getTmdbTitleDetails(
                item.mediaType,
                item.tmdbId,
              );

            return {
              input: item,
              media,
            };
          },
        ),
      );

    const savedItems =
      await prisma.$transaction(
        async (transaction) => {
          await transaction.featuredFilm.deleteMany({
            where: {
              userId: user.id,
            },
          });

          if (mediaDetails.length > 0) {
            await transaction.featuredFilm.createMany({
              data: mediaDetails.map(
                ({ input, media }) => ({
                  userId: user.id,
                  tmdbId: media.id,
                  mediaType:
                    media.mediaType,
                  title: media.title,
                  posterPath:
                    media.posterPath,
                  position:
                    input.position,
                }),
              ),
            });
          }

          return transaction.featuredFilm.findMany({
            where: {
              userId: user.id,
            },
            orderBy: {
              position: "asc",
            },
            select: {
              id: true,
              tmdbId: true,
              mediaType: true,
              title: true,
              posterPath: true,
              position: true,
            },
          });
        },
      );

    revalidatePath("/featured-films");
    revalidatePath("/home");
    revalidatePath(
      `/u/${user.username}`,
    );

    return NextResponse.json({
      message:
        "Your Top 5 has been updated.",
      items: savedItems,
      count: savedItems.length,
    });
  } catch (error) {
    console.error(
      "PUT /api/featured-films failed:",
      error,
    );

    return NextResponse.json(
      {
        message:
          "Unable to update your Top 5.",
      },
      {
        status: 500,
      },
    );
  }
}

async function getCurrentUser() {
  const session = await getServerSession(
    authOptions,
  );

  if (!session?.user?.id) {
    return null;
  }

  return prisma.user.findFirst({
    where: {
      id: session.user.id,
      onboardingCompleted: true,
      deletedAt: null,
      suspendedAt: null,
    },
    select: {
      id: true,
      username: true,
    },
  });
}

function validateFeaturedItems(
  value: unknown,
):
  | {
      success: true;
      items: FeaturedFilmInput[];
    }
  | {
      success: false;
      message: string;
    } {
  if (!Array.isArray(value)) {
    return {
      success: false,
      message:
        "Featured films must be an array.",
    };
  }

  if (value.length > 5) {
    return {
      success: false,
      message:
        "You can only feature up to five titles.",
    };
  }

  const items: FeaturedFilmInput[] = [];
  const mediaKeys = new Set<string>();
  const positions = new Set<number>();

  for (const rawItem of value) {
    if (
      typeof rawItem !== "object" ||
      rawItem === null
    ) {
      return {
        success: false,
        message:
          "One of the selected titles is invalid.",
      };
    }

    const item = rawItem as {
      tmdbId?: unknown;
      mediaType?: unknown;
      position?: unknown;
    };

    if (
      typeof item.tmdbId !== "number" ||
      !Number.isInteger(item.tmdbId) ||
      item.tmdbId < 1
    ) {
      return {
        success: false,
        message: "TMDB ID is invalid.",
      };
    }

    if (
      item.mediaType !== MediaType.movie &&
      item.mediaType !== MediaType.tv
    ) {
      return {
        success: false,
        message: "Media type is invalid.",
      };
    }

    if (
      typeof item.position !== "number" ||
      !Number.isInteger(item.position) ||
      item.position < 1 ||
      item.position > 5
    ) {
      return {
        success: false,
        message:
          "Top 5 position must be between 1 and 5.",
      };
    }

    const mediaKey = `${item.mediaType}:${item.tmdbId}`;

    if (mediaKeys.has(mediaKey)) {
      return {
        success: false,
        message:
          "The same title cannot appear more than once.",
      };
    }

    if (positions.has(item.position)) {
      return {
        success: false,
        message:
          "Two titles cannot use the same Top 5 position.",
      };
    }

    mediaKeys.add(mediaKey);
    positions.add(item.position);

    items.push({
      tmdbId: item.tmdbId,
      mediaType: item.mediaType,
      position: item.position,
    });
  }

  const orderedItems = [...items].sort(
  (firstItem, secondItem) =>
    firstItem.position -
    secondItem.position,
);

const hasPositionGap =
  orderedItems.some(
    (item, index) =>
      item.position !== index + 1,
  );

if (hasPositionGap) {
  return {
    success: false,
    message:
      "Top 5 positions must be filled in order.",
  };
}

return {
  success: true,
  items: orderedItems,
};
  return {
    success: true,
    items,
  };
}