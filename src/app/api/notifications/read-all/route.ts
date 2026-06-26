import { revalidatePath } from "next/cache";
import { getServerSession } from "next-auth";
import { NextResponse } from "next/server";

import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export async function PATCH() {
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

    const result =
      await prisma.notification.updateMany({
        where: {
          recipientId: session.user.id,
          readAt: null,
        },
        data: {
          readAt: new Date(),
        },
      });

    revalidatePath("/notifications");

    return NextResponse.json({
      message:
        "All notifications were marked as read.",
      updatedCount: result.count,
      unreadCount: 0,
    });
  } catch (error) {
    console.error(
      "PATCH /api/notifications/read-all failed:",
      error,
    );

    return NextResponse.json(
      {
        message:
          "Unable to mark notifications as read.",
      },
      {
        status: 500,
      },
    );
  }
}