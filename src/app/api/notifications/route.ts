import { getServerSession } from "next-auth";
import { NextResponse } from "next/server";

import { getUserAvatarUrl } from "@/lib/avatar";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

const DEFAULT_LIMIT = 20;
const MAX_LIMIT = 50;

export async function GET(request: Request) {
  try {
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
        },
      });

    if (!currentUser) {
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

    const url = new URL(request.url);
    const limit = getLimit(
      url.searchParams.get("limit"),
    );

    const [notifications, unreadCount] =
      await Promise.all([
        prisma.notification.findMany({
          where: {
            recipientId: currentUser.id,
          },
          orderBy: [
            {
              createdAt: "desc",
            },
            {
              id: "desc",
            },
          ],
          take: limit,
          select: {
            id: true,
            type: true,
            entityId: true,
            readAt: true,
            createdAt: true,

            actor: {
              select: {
                id: true,
                username: true,
                name: true,
                image: true,
                avatarPath: true,
              },
            },
          },
        }),

        prisma.notification.count({
          where: {
            recipientId: currentUser.id,
            readAt: null,
          },
        }),
      ]);

    const items = notifications.map(
      (notification) => ({
        id: notification.id,
        type: notification.type,
        entityId: notification.entityId,
        readAt: notification.readAt,
        createdAt: notification.createdAt,

        actor: notification.actor?.username
          ? {
              id: notification.actor.id,
              username:
                notification.actor.username,
              name: notification.actor.name,
              avatarUrl: getUserAvatarUrl(
                notification.actor.avatarPath,
                notification.actor.image,
              ),
            }
          : null,
      }),
    );

    return NextResponse.json({
      items,
      unreadCount,
    });
  } catch (error) {
    console.error(
      "GET /api/notifications failed:",
      error,
    );

    return NextResponse.json(
      {
        message:
          "Unable to load notifications.",
      },
      {
        status: 500,
      },
    );
  }
}

function getLimit(value: string | null) {
  if (!value) {
    return DEFAULT_LIMIT;
  }

  const parsedValue = Number(value);

  if (
    !Number.isInteger(parsedValue) ||
    parsedValue < 1
  ) {
    return DEFAULT_LIMIT;
  }

  return Math.min(parsedValue, MAX_LIMIT);
}