import { FollowStatus } from "@prisma/client";
import { getServerSession } from "next-auth";
import { NextResponse } from "next/server";

import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

type RouteContext = {
  params: {
    username: string;
  };
};

type RelationshipStatus =
  | "SELF"
  | "NONE"
  | "PENDING"
  | "ACCEPTED"
  | "REJECTED";

function normalizeUsername(value: string) {
  return decodeURIComponent(value)
    .trim()
    .toLowerCase();
}

async function findTargetUser(username: string) {
  return prisma.user.findFirst({
    where: {
      username,
      onboardingCompleted: true,
      deletedAt: null,
      suspendedAt: null,
    },
    select: {
      id: true,
      username: true,
      isPublic: true,
    },
  });
}

async function getFollowCounts(userId: string) {
  const [followers, following] = await Promise.all([
    prisma.follow.count({
      where: {
        followingId: userId,
        status: FollowStatus.ACCEPTED,
      },
    }),

    prisma.follow.count({
      where: {
        followerId: userId,
        status: FollowStatus.ACCEPTED,
      },
    }),
  ]);

  return {
    followers,
    following,
  };
}

export async function GET(
  _request: Request,
  { params }: RouteContext,
) {
  try {
    const session = await getServerSession(authOptions);

    const username = normalizeUsername(
      params.username,
    );

    const targetUser =
      await findTargetUser(username);

    if (!targetUser?.username) {
      return NextResponse.json(
        {
          message: "User not found.",
        },
        {
          status: 404,
        },
      );
    }

    const viewerId = session?.user?.id ?? null;
    const isOwner = viewerId === targetUser.id;

    const counts = await getFollowCounts(
      targetUser.id,
    );

    if (!viewerId) {
      return NextResponse.json({
        relationship: "NONE" satisfies RelationshipStatus,
        followsYou: false,
        isOwner: false,
        isPrivate: !targetUser.isPublic,
        counts,
      });
    }

    if (isOwner) {
      return NextResponse.json({
        relationship: "SELF" satisfies RelationshipStatus,
        followsYou: false,
        isOwner: true,
        isPrivate: !targetUser.isPublic,
        counts,
      });
    }

    const [relationship, reverseRelationship] =
      await Promise.all([
        prisma.follow.findUnique({
          where: {
            followerId_followingId: {
              followerId: viewerId,
              followingId: targetUser.id,
            },
          },
          select: {
            status: true,
          },
        }),

        prisma.follow.findUnique({
          where: {
            followerId_followingId: {
              followerId: targetUser.id,
              followingId: viewerId,
            },
          },
          select: {
            status: true,
          },
        }),
      ]);

    return NextResponse.json({
      relationship:
        relationship?.status ??
        ("NONE" satisfies RelationshipStatus),

      followsYou:
        reverseRelationship?.status ===
        FollowStatus.ACCEPTED,

      isOwner: false,
      isPrivate: !targetUser.isPublic,
      counts,
    });
  } catch (error) {
    console.error(
      "GET /api/users/[username]/follow failed:",
      error,
    );

    return NextResponse.json(
      {
        message:
          "Unable to load follow information.",
      },
      {
        status: 500,
      },
    );
  }
}

export async function POST(
  _request: Request,
  { params }: RouteContext,
) {
  try {
    const session = await getServerSession(authOptions);

    const viewerId = session?.user?.id;

    if (!viewerId) {
      return NextResponse.json(
        {
          message:
            "You must be signed in to follow someone.",
        },
        {
          status: 401,
        },
      );
    }

    const username = normalizeUsername(
      params.username,
    );

    const targetUser =
      await findTargetUser(username);

    if (!targetUser?.username) {
      return NextResponse.json(
        {
          message: "User not found.",
        },
        {
          status: 404,
        },
      );
    }

    if (targetUser.id === viewerId) {
      return NextResponse.json(
        {
          message:
            "You cannot follow your own account.",
        },
        {
          status: 400,
        },
      );
    }

    const desiredStatus = targetUser.isPublic
      ? FollowStatus.ACCEPTED
      : FollowStatus.PENDING;

    const existingFollow =
      await prisma.follow.findUnique({
        where: {
          followerId_followingId: {
            followerId: viewerId,
            followingId: targetUser.id,
          },
        },
        select: {
          id: true,
          status: true,
        },
      });

    if (
      existingFollow?.status ===
      FollowStatus.ACCEPTED
    ) {
      const counts = await getFollowCounts(
        targetUser.id,
      );

      return NextResponse.json({
        message:
          "You are already following this user.",
        relationship: FollowStatus.ACCEPTED,
        followsYou: false,
        isPrivate: !targetUser.isPublic,
        counts,
      });
    }

    if (
      existingFollow?.status ===
        FollowStatus.PENDING &&
      desiredStatus === FollowStatus.PENDING
    ) {
      const counts = await getFollowCounts(
        targetUser.id,
      );

      return NextResponse.json({
        message:
          "Your follow request is still pending.",
        relationship: FollowStatus.PENDING,
        followsYou: false,
        isPrivate: true,
        counts,
      });
    }

    const now = new Date();

    const follow = existingFollow
      ? await prisma.follow.update({
          where: {
            id: existingFollow.id,
          },
          data: {
            status: desiredStatus,
            requestedAt: now,
            respondedAt:
              desiredStatus ===
              FollowStatus.ACCEPTED
                ? now
                : null,
          },
          select: {
            status: true,
          },
        })
      : await prisma.follow.create({
          data: {
            followerId: viewerId,
            followingId: targetUser.id,
            status: desiredStatus,
            respondedAt:
              desiredStatus ===
              FollowStatus.ACCEPTED
                ? now
                : null,
          },
          select: {
            status: true,
          },
        });

    const [counts, reverseRelationship] =
      await Promise.all([
        getFollowCounts(targetUser.id),

        prisma.follow.findUnique({
          where: {
            followerId_followingId: {
              followerId: targetUser.id,
              followingId: viewerId,
            },
          },
          select: {
            status: true,
          },
        }),
      ]);

    return NextResponse.json(
      {
        message:
          follow.status ===
          FollowStatus.ACCEPTED
            ? "You are now following this user."
            : "Follow request sent.",

        relationship: follow.status,

        followsYou:
          reverseRelationship?.status ===
          FollowStatus.ACCEPTED,

        isPrivate: !targetUser.isPublic,
        counts,
      },
      {
        status: existingFollow ? 200 : 201,
      },
    );
  } catch (error) {
    console.error(
      "POST /api/users/[username]/follow failed:",
      error,
    );

    return NextResponse.json(
      {
        message:
          "Unable to follow this user.",
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
  try {
    const session = await getServerSession(authOptions);

    const viewerId = session?.user?.id;

    if (!viewerId) {
      return NextResponse.json(
        {
          message:
            "You must be signed in to manage follows.",
        },
        {
          status: 401,
        },
      );
    }

    const username = normalizeUsername(
      params.username,
    );

    const targetUser =
      await findTargetUser(username);

    if (!targetUser?.username) {
      return NextResponse.json(
        {
          message: "User not found.",
        },
        {
          status: 404,
        },
      );
    }

    if (targetUser.id === viewerId) {
      return NextResponse.json(
        {
          message:
            "You cannot unfollow your own account.",
        },
        {
          status: 400,
        },
      );
    }

    const existingFollow =
      await prisma.follow.findUnique({
        where: {
          followerId_followingId: {
            followerId: viewerId,
            followingId: targetUser.id,
          },
        },
        select: {
          id: true,
          status: true,
        },
      });

    if (!existingFollow) {
      const counts = await getFollowCounts(
        targetUser.id,
      );

      return NextResponse.json({
        message:
          "You are not following this user.",
        relationship:
          "NONE" satisfies RelationshipStatus,
        followsYou: false,
        isPrivate: !targetUser.isPublic,
        counts,
      });
    }

    await prisma.follow.delete({
      where: {
        id: existingFollow.id,
      },
    });

    const [counts, reverseRelationship] =
      await Promise.all([
        getFollowCounts(targetUser.id),

        prisma.follow.findUnique({
          where: {
            followerId_followingId: {
              followerId: targetUser.id,
              followingId: viewerId,
            },
          },
          select: {
            status: true,
          },
        }),
      ]);

    return NextResponse.json({
      message:
        existingFollow.status ===
        FollowStatus.PENDING
          ? "Follow request cancelled."
          : "User unfollowed.",

      relationship:
        "NONE" satisfies RelationshipStatus,

      followsYou:
        reverseRelationship?.status ===
        FollowStatus.ACCEPTED,

      isPrivate: !targetUser.isPublic,
      counts,
    });
  } catch (error) {
    console.error(
      "DELETE /api/users/[username]/follow failed:",
      error,
    );

    return NextResponse.json(
      {
        message:
          "Unable to update follow status.",
      },
      {
        status: 500,
      },
    );
  }
}