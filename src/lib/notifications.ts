import {
  FollowStatus,
  NotificationType,
} from "@prisma/client";

import { prisma } from "@/lib/prisma";

type CreateNotificationInput = {
  recipientId: string;
  actorId: string;
  type: NotificationType;
  entityId?: string | null;
};

type NotificationEntityInput = {
  recipientId: string;
  actorId: string;
  type: NotificationType;
  entityId: string;
};

type DiaryNotificationInput = {
  actorId: string;
  diaryEntryId: string;
};

export async function createOrRefreshNotification({
  recipientId,
  actorId,
  type,
  entityId = null,
}: CreateNotificationInput) {
  if (recipientId === actorId) {
    return null;
  }

  const existingNotification =
    await prisma.notification.findFirst({
      where: {
        recipientId,
        actorId,
        type,
        entityId,
      },
      select: {
        id: true,
      },
    });

  if (existingNotification) {
    return prisma.notification.update({
      where: {
        id: existingNotification.id,
      },
      data: {
        readAt: null,
        createdAt: new Date(),
      },
    });
  }

  return prisma.notification.create({
    data: {
      recipientId,
      actorId,
      type,
      entityId,
    },
  });
}

export async function markNotificationReadByEntity({
  recipientId,
  actorId,
  type,
  entityId,
}: NotificationEntityInput) {
  return prisma.notification.updateMany({
    where: {
      recipientId,
      actorId,
      type,
      entityId,
      readAt: null,
    },
    data: {
      readAt: new Date(),
    },
  });
}

export async function deleteNotificationByEntity({
  recipientId,
  actorId,
  type,
  entityId,
}: NotificationEntityInput) {
  return prisma.notification.deleteMany({
    where: {
      recipientId,
      actorId,
      type,
      entityId,
    },
  });
}

export async function notifyFollowersAboutDiary({
  actorId,
  diaryEntryId,
}: DiaryNotificationInput) {
  const followers = await prisma.follow.findMany({
    where: {
      followingId: actorId,
      status: FollowStatus.ACCEPTED,
      follower: {
        onboardingCompleted: true,
        deletedAt: null,
        suspendedAt: null,
      },
    },
    select: {
      followerId: true,
    },
  });

  const recipientIds = Array.from(
    new Set(
      followers.map(
        (follow) => follow.followerId,
      ),
    ),
  ).filter(
    (recipientId) => recipientId !== actorId,
  );

  await prisma.notification.deleteMany({
    where: {
      actorId,
      type: NotificationType.DIARY_PUBLISHED,
      entityId: diaryEntryId,
    },
  });

  if (recipientIds.length === 0) {
    return {
      count: 0,
    };
  }

  return prisma.notification.createMany({
    data: recipientIds.map(
      (recipientId) => ({
        recipientId,
        actorId,
        type: NotificationType.DIARY_PUBLISHED,
        entityId: diaryEntryId,
      }),
    ),
  });
}

export async function deleteDiaryPublishedNotifications({
  actorId,
  diaryEntryId,
}: DiaryNotificationInput) {
  return prisma.notification.deleteMany({
    where: {
      actorId,
      type: NotificationType.DIARY_PUBLISHED,
      entityId: diaryEntryId,
    },
  });
}