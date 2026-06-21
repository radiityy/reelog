import { FollowStatus } from "@prisma/client";
import { revalidatePath } from "next/cache";
import { getServerSession } from "next-auth";
import { NextResponse } from "next/server";

import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

type RouteContext = {
  params: {
    id: string;
  };
};

type FollowRequestAction =
  | "accept"
  | "reject";

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

  const action = getAction(requestBody);

  if (!action) {
    return NextResponse.json(
      {
        message:
          "Action must be either accept or reject.",
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
      username: true,
    },
  });

  if (!user?.username) {
    return NextResponse.json(
      {
        message: "User account was not found.",
      },
      {
        status: 404,
      },
    );
  }

  const followRequest =
    await prisma.follow.findFirst({
      where: {
        id: params.id,
        followingId: user.id,
        status: FollowStatus.PENDING,
      },
      select: {
        id: true,
        follower: {
          select: {
            username: true,
            deletedAt: true,
            suspendedAt: true,
            onboardingCompleted: true,
          },
        },
      },
    });

  if (
    !followRequest ||
    !followRequest.follower.username ||
    followRequest.follower.deletedAt ||
    followRequest.follower.suspendedAt ||
    !followRequest.follower.onboardingCompleted
  ) {
    return NextResponse.json(
      {
        message:
          "Follow request was not found or has already been handled.",
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

  try {
    const updateResult =
      await prisma.follow.updateMany({
        where: {
          id: followRequest.id,
          followingId: user.id,
          status: FollowStatus.PENDING,
        },
        data: {
          status: nextStatus,
          respondedAt: new Date(),
        },
      });

    if (updateResult.count === 0) {
      return NextResponse.json(
        {
          message:
            "This follow request has already been handled.",
        },
        {
          status: 409,
        },
      );
    }

    const pendingCount = await prisma.follow.count({
      where: {
        followingId: user.id,
        status: FollowStatus.PENDING,
      },
    });

    revalidatePath(`/u/${user.username}`);
    revalidatePath(
      `/u/${followRequest.follower.username}`,
    );

    return NextResponse.json({
      message:
        action === "accept"
          ? "Follow request accepted."
          : "Follow request declined.",
      request: {
        id: followRequest.id,
        status: nextStatus,
      },
      pendingCount,
    });
  } catch (error) {
    console.error(
      "Failed to respond to follow request:",
      error,
    );

    return NextResponse.json(
      {
        message:
          "Unable to respond to this follow request.",
      },
      {
        status: 500,
      },
    );
  }
}

function getAction(
  value: unknown,
): FollowRequestAction | null {
  if (
    typeof value !== "object" ||
    value === null ||
    !("action" in value)
  ) {
    return null;
  }

  const action = value.action;

  if (
    action === "accept" ||
    action === "reject"
  ) {
    return action;
  }

  return null;
}