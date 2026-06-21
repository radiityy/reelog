import { FollowStatus } from "@prisma/client";
import { getServerSession } from "next-auth";
import { NextResponse } from "next/server";

import { getUserAvatarUrl } from "@/lib/avatar";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET() {
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

  const requestWhere = {
    followingId: user.id,
    status: FollowStatus.PENDING,
    follower: {
      onboardingCompleted: true,
      deletedAt: null,
      suspendedAt: null,
    },
  } as const;

  try {
    const [rows, count] = await Promise.all([
      prisma.follow.findMany({
        where: requestWhere,
        orderBy: {
          requestedAt: "desc",
        },
        take: 50,
        select: {
          id: true,
          requestedAt: true,
          follower: {
            select: {
              id: true,
              username: true,
              name: true,
              image: true,
              avatarPath: true,
              bio: true,
              isPublic: true,
            },
          },
        },
      }),

      prisma.follow.count({
        where: requestWhere,
      }),
    ]);

    const requests = rows
      .filter((row) => Boolean(row.follower.username))
      .map((row) => ({
        id: row.id,
        requestedAt: row.requestedAt,
        user: {
          id: row.follower.id,
          username: row.follower.username as string,
          name: row.follower.name,
          avatarUrl: getUserAvatarUrl(
            row.follower.avatarPath,
            row.follower.image,
          ),
          bio: row.follower.bio,
          isPrivate: !row.follower.isPublic,
        },
      }));

    return NextResponse.json({
      requests,
      count,
    });
  } catch (error) {
    console.error(
      "Failed to load follow requests:",
      error,
    );

    return NextResponse.json(
      {
        message: "Unable to load follow requests.",
      },
      {
        status: 500,
      },
    );
  }
}