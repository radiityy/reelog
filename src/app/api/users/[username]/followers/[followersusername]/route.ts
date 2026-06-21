import { FollowStatus } from "@prisma/client";
import { revalidatePath } from "next/cache";
import { getServerSession } from "next-auth";
import { NextResponse } from "next/server";

import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

type RouteContext = {
  params: {
    username: string;
    followerUsername: string;
  };
};

export async function DELETE(
  _request: Request,
  { params }: RouteContext,
) {
  const session = await getServerSession(
    authOptions,
  );

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

  const username = normalizeUsername(
    params.username,
  );

  const followerUsername = normalizeUsername(
    params.followerUsername,
  );

  const owner = await prisma.user.findFirst({
    where: {
      id: session.user.id,
      username,
      onboardingCompleted: true,
      deletedAt: null,
      suspendedAt: null,
    },
    select: {
      id: true,
      username: true,
    },
  });

  if (!owner?.username) {
    return NextResponse.json(
      {
        message:
          "You cannot manage followers for this account.",
      },
      {
        status: 403,
      },
    );
  }

  const follower =
    await prisma.user.findFirst({
      where: {
        username: followerUsername,
        onboardingCompleted: true,
        deletedAt: null,
        suspendedAt: null,
      },
      select: {
        id: true,
        username: true,
      },
    });

  if (!follower?.username) {
    return NextResponse.json(
      {
        message: "Follower was not found.",
      },
      {
        status: 404,
      },
    );
  }

  if (follower.id === owner.id) {
    return NextResponse.json(
      {
        message:
          "You cannot remove your own account.",
      },
      {
        status: 400,
      },
    );
  }

  try {
    const deleteResult =
      await prisma.follow.deleteMany({
        where: {
          followerId: follower.id,
          followingId: owner.id,
          status: FollowStatus.ACCEPTED,
        },
      });

    if (deleteResult.count === 0) {
      return NextResponse.json(
        {
          message:
            "This user is not following you.",
        },
        {
          status: 404,
        },
      );
    }

    const followersCount =
      await prisma.follow.count({
        where: {
          followingId: owner.id,
          status: FollowStatus.ACCEPTED,
        },
      });

    revalidatePath(`/u/${owner.username}`);
    revalidatePath(
      `/u/${owner.username}/followers`,
    );
    revalidatePath(
      `/u/${owner.username}/following`,
    );
    revalidatePath(
      `/u/${follower.username}`,
    );
    revalidatePath(
      `/u/${follower.username}/followers`,
    );
    revalidatePath(
      `/u/${follower.username}/following`,
    );

    return NextResponse.json({
      message: "Follower removed.",
      followersCount,
    });
  } catch (error) {
    console.error(
      "Failed to remove follower:",
      error,
    );

    return NextResponse.json(
      {
        message:
          "Unable to remove this follower.",
      },
      {
        status: 500,
      },
    );
  }
}

function normalizeUsername(value: string) {
  return decodeURIComponent(value)
    .trim()
    .toLowerCase();
}