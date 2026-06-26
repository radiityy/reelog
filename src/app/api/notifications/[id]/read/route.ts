import { revalidatePath } from "next/cache";
import { getServerSession } from "next-auth";
import { NextResponse } from "next/server";

import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

type RouteContext = {
  params: {
    id: string;
  };
};

export async function PATCH(
  _request: Request,
  { params }: RouteContext,
) {
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

    const notification =
      await prisma.notification.findFirst({
        where: {
          id: params.id,
          recipientId: session.user.id,
        },
        select: {
          id: true,
          readAt: true,
        },
      });

    if (!notification) {
      return NextResponse.json(
        {
          message:
            "Notification was not found.",
        },
        {
          status: 404,
        },
      );
    }

    if (!notification.readAt) {
      await prisma.notification.update({
        where: {
          id: notification.id,
        },
        data: {
          readAt: new Date(),
        },
      });
    }

    const unreadCount =
      await prisma.notification.count({
        where: {
          recipientId: session.user.id,
          readAt: null,
        },
      });

    revalidatePath("/notifications");

    return NextResponse.json({
      message:
        "Notification was marked as read.",
      notificationId: notification.id,
      unreadCount,
    });
  } catch (error) {
    console.error(
      "PATCH /api/notifications/[id]/read failed:",
      error,
    );

    return NextResponse.json(
      {
        message:
          "Unable to update notification.",
      },
      {
        status: 500,
      },
    );
  }
}