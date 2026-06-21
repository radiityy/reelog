import { getServerSession } from "next-auth";
import { NextResponse } from "next/server";

import { getUserAvatarUrl } from "@/lib/avatar";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import {
  getTmdbPosterUrl,
  searchTmdb,
} from "@/lib/tmdb";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

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

  const { searchParams } = new URL(request.url);
  const query = searchParams.get("q")?.trim() ?? "";

  if (query.length < 2) {
    return NextResponse.json({
      titles: [],
      people: [],
    });
  }

  try {
    const [tmdbResult, users] = await Promise.all([
      searchTmdb(query, 1),

      prisma.user.findMany({
        where: {
          onboardingCompleted: true,
          deletedAt: null,
          suspendedAt: null,

          username: {
            not: null,
          },

          OR: [
            {
              username: {
                contains: query,
                mode: "insensitive",
              },
            },
            {
              name: {
                contains: query,
                mode: "insensitive",
              },
            },
          ],
        },

        orderBy: {
          username: "asc",
        },

        take: 5,

        select: {
          id: true,
          username: true,
          name: true,
          image: true,
          avatarPath: true,
          isPublic: true,
        },
      }),
    ]);

    const titles = tmdbResult.results
      .slice(0, 6)
      .map((item) => ({
        id: item.id,
        title: item.title,
        mediaType: item.mediaType,
        posterUrl: getTmdbPosterUrl(
          item.posterPath,
        ),
        releaseYear: item.releaseDate
          ? item.releaseDate.slice(0, 4)
          : null,
        rating: item.rating,
      }));

    const people = users
      .filter(
        (
          user,
        ): user is typeof user & {
          username: string;
        } => Boolean(user.username),
      )
      .map((user) => ({
        id: user.id,
        username: user.username,
        name: user.name,
        avatarUrl: getUserAvatarUrl(
          user.avatarPath,
          user.image,
        ),
        isPrivate: !user.isPublic,
      }));

    return NextResponse.json({
      titles,
      people,
    });
  } catch (error) {
    console.error(
      "Global search suggestion error:",
      error,
    );

    return NextResponse.json(
      {
        message:
          "Unable to load search suggestions.",
      },
      {
        status: 500,
      },
    );
  }
}