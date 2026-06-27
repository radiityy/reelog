import {
  FollowStatus,
  NotificationType,
} from "@prisma/client";
import { revalidatePath } from "next/cache";
import { getServerSession } from "next-auth";
import { NextResponse } from "next/server";

import { authOptions } from "@/lib/auth";
import {
  createOrRefreshNotification,
  markNotificationReadByEntity,
} from "@/lib/notifications";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

type RouteContext = {
  params: {
    id: string;
  };
};

export async function PATCH(
  request: Request,
  { params }: RouteContext,
) {
  try {
    const session =
      await getServerSession(authOptions);

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

    const currentUser =
      await prisma.user.findFirst({
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

    if (!currentUser?.username) {
      return NextResponse.json(
        {
          message:
            "Your account is unavailable.",
        },
        {
          status: 403,
        },
      );
    }

    const body = (await request
      .json()
      .catch(() => null)) as {
      action?: unknown;
    } | null;

    const action = body?.action;

    if (
      action !== "accept" &&
      action !== "reject"
    ) {
      return NextResponse.json(
        {
          message:
            "Action must be accept or reject.",
        },
        {
          status: 422,
        },
      );
    }

    const followRequest =
      await prisma.follow.findFirst({
        where: {
          id: params.id,
          followingId: currentUser.id,
          status: FollowStatus.PENDING,
        },
        select: {
          id: true,
          followerId: true,
          followingId: true,

          follower: {
            select: {
              username: true,
            },
          },

          following: {
            select: {
              username: true,
            },
          },
        },
      });

    if (
      !followRequest ||
      !followRequest.follower.username ||
      !followRequest.following.username
    ) {
      return NextResponse.json(
        {
          message:
            "Pending follow request was not found.",
        },
        {
          status: 404,
        },
      );
    }

    const nextStatus =
      action === "accept"
        ? FollowStatus.ACCEPTED
        : FollowStatus.REJECTED;

    const updatedFollow =
      await prisma.follow.update({
        where: {
          id: followRequest.id,
        },
        data: {
          status: nextStatus,
          respondedAt: new Date(),
        },
        select: {
          id: true,
          status: true,
          respondedAt: true,
        },
      });

    await markNotificationReadByEntity({
      recipientId: currentUser.id,
      actorId: followRequest.followerId,
      type: NotificationType.FOLLOW_REQUEST,
      entityId: followRequest.id,
    });

    if (
      nextStatus === FollowStatus.ACCEPTED
    ) {
      await createOrRefreshNotification({
        recipientId:
          followRequest.followerId,
        actorId: currentUser.id,
        type: NotificationType.FOLLOW_ACCEPTED,
        entityId: followRequest.id,
      });
    }

    const pendingCount =
      await prisma.follow.count({
        where: {
          followingId: currentUser.id,
          status: FollowStatus.PENDING,
        },
      });

    revalidatePath("/follow-requests");

    revalidatePath(
      `/u/${followRequest.follower.username}`,
    );
    revalidatePath(
      `/u/${followRequest.follower.username}/followers`,
    );
    revalidatePath(
      `/u/${followRequest.follower.username}/following`,
    );

    revalidatePath(
      `/u/${followRequest.following.username}`,
    );
    revalidatePath(
      `/u/${followRequest.following.username}/followers`,
    );
    revalidatePath(
      `/u/${followRequest.following.username}/following`,
    );

    return NextResponse.json({
      message:
        action === "accept"
          ? "Follow request accepted."
          : "Follow request declined.",

      request: {
        id: updatedFollow.id,
        status: updatedFollow.status,
        respondedAt:
          updatedFollow.respondedAt,
      },

      pendingCount,
    });
  } catch (error) {
    console.error(
      "PATCH /api/follow-requests/[id] failed:",
      error,
    );

    return NextResponse.json(
      {
        message:
          "Unable to update follow request.",
      },
      {
        status: 500,
      },
    );
  }
}