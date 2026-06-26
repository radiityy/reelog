"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useState } from "react";

type NotificationType =
  | "FOLLOW_REQUEST"
  | "FOLLOW_ACCEPTED"
  | "NEW_FOLLOWER"
  | "DIARY_PUBLISHED";

type NotificationItem = {
  id: string;
  type: NotificationType;
  entityId: string | null;
  readAt: string | null;
  createdAt: string;
  actor: {
    id: string;
    username: string;
    name: string | null;
    avatarUrl: string | null;
  } | null;
};

type NotificationsResponse = {
  items?: NotificationItem[];
  unreadCount?: number;
  message?: string;
};

export default function NotificationsPage() {
  const router = useRouter();

  const [items, setItems] = useState<
    NotificationItem[]
  >([]);

  const [unreadCount, setUnreadCount] =
    useState(0);

  const [isLoading, setIsLoading] =
    useState(true);

  const [isMarkingAll, setIsMarkingAll] =
    useState(false);

  const [
    activeNotificationId,
    setActiveNotificationId,
  ] = useState<string | null>(null);

  const [errorMessage, setErrorMessage] =
    useState("");

  const loadNotifications = useCallback(
    async () => {
      setIsLoading(true);
      setErrorMessage("");

      try {
        const response = await fetch(
          "/api/notifications?limit=50",
          {
            method: "GET",
            cache: "no-store",
          },
        );

        const payload =
          (await response.json()) as NotificationsResponse;

        if (!response.ok) {
          setErrorMessage(
            payload.message ??
              "Unable to load notifications.",
          );

          return;
        }

        setItems(payload.items ?? []);
        setUnreadCount(
          payload.unreadCount ?? 0,
        );
      } catch {
        setErrorMessage(
          "Unable to connect to the server.",
        );
      } finally {
        setIsLoading(false);
      }
    },
    [],
  );

  useEffect(() => {
    void loadNotifications();
  }, [loadNotifications]);

  async function handleNotificationClick(
    notification: NotificationItem,
  ) {
    const destination =
      getNotificationDestination(
        notification,
      );

    if (
      activeNotificationId ||
      isMarkingAll
    ) {
      return;
    }

    if (notification.readAt) {
      router.push(destination);
      return;
    }

    setActiveNotificationId(
      notification.id,
    );
    setErrorMessage("");

    try {
      const response = await fetch(
        `/api/notifications/${notification.id}/read`,
        {
          method: "PATCH",
        },
      );

      const payload =
        (await response.json()) as {
          message?: string;
          unreadCount?: number;
        };

      if (!response.ok) {
        setErrorMessage(
          payload.message ??
            "Unable to update notification.",
        );

        return;
      }

      setItems((currentItems) =>
        currentItems.map((currentItem) =>
          currentItem.id === notification.id
            ? {
                ...currentItem,
                readAt:
                  new Date().toISOString(),
              }
            : currentItem,
        ),
      );

      setUnreadCount(
        payload.unreadCount ?? 0,
      );

      router.push(destination);
      router.refresh();
    } catch {
      setErrorMessage(
        "Unable to connect to the server.",
      );
    } finally {
      setActiveNotificationId(null);
    }
  }

  async function handleMarkAllRead() {
    if (
      unreadCount === 0 ||
      isMarkingAll ||
      activeNotificationId
    ) {
      return;
    }

    setIsMarkingAll(true);
    setErrorMessage("");

    try {
      const response = await fetch(
        "/api/notifications/read-all",
        {
          method: "PATCH",
        },
      );

      const payload =
        (await response.json()) as {
          message?: string;
          unreadCount?: number;
        };

      if (!response.ok) {
        setErrorMessage(
          payload.message ??
            "Unable to mark notifications as read.",
        );

        return;
      }

      const readAt =
        new Date().toISOString();

      setItems((currentItems) =>
        currentItems.map((item) => ({
          ...item,
          readAt: item.readAt ?? readAt,
        })),
      );

      setUnreadCount(0);
      router.refresh();
    } catch {
      setErrorMessage(
        "Unable to connect to the server.",
      );
    } finally {
      setIsMarkingAll(false);
    }
  }

  return (
    <main className="mx-auto w-full max-w-4xl">
      <header className="flex flex-col gap-5 border-b border-[#292521] pb-7 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[#C84B18]">
            Activity
          </p>

          <h1 className="mt-2 text-3xl font-bold tracking-tight text-[#F4F1EB] md:text-4xl">
            Notifications
          </h1>

          <p className="mt-2 text-sm leading-6 text-[#8A8580]">
            Follow requests, new followers,
            and updates from your Reelog
            connections.
          </p>
        </div>

        {unreadCount > 0 ? (
          <button
            type="button"
            onClick={handleMarkAllRead}
            disabled={
              isMarkingAll ||
              Boolean(activeNotificationId)
            }
            className="inline-flex w-max items-center justify-center rounded-full border border-[#3A3530] bg-[#211E1B] px-4 py-2 text-xs font-semibold text-[#D4CFC7] transition hover:border-[#C84B18]/60 hover:text-[#F4F1EB] disabled:cursor-not-allowed disabled:opacity-50"
          >
            {isMarkingAll
              ? "Marking..."
              : "Mark all as read"}
          </button>
        ) : null}
      </header>

      {errorMessage ? (
        <div className="mt-6 rounded-xl border border-red-900/50 bg-red-950/20 px-4 py-3 text-sm text-red-300">
          {errorMessage}
        </div>
      ) : null}

      {isLoading ? (
        <NotificationSkeleton />
      ) : items.length === 0 ? (
        <EmptyNotifications />
      ) : (
        <section className="mt-7 overflow-hidden rounded-2xl border border-[#2C2824] bg-[#171411]">
          <div className="flex items-center justify-between border-b border-[#292521] px-5 py-4">
            <p className="text-sm font-semibold text-[#F4F1EB]">
              Recent activity
            </p>

            <span className="rounded-full bg-[#211E1B] px-2.5 py-1 text-xs text-[#8A8580]">
              {unreadCount} unread
            </span>
          </div>

          <div className="divide-y divide-[#292521]">
            {items.map((notification) => {
              const isUnread =
                !notification.readAt;

              const isProcessing =
                activeNotificationId ===
                notification.id;

              const content =
                getNotificationContent(
                  notification,
                );

              return (
                <button
                  key={notification.id}
                  type="button"
                  onClick={() =>
                    void handleNotificationClick(
                      notification,
                    )
                  }
                  disabled={
                    Boolean(
                      activeNotificationId,
                    ) || isMarkingAll
                  }
                  className={[
                    "relative flex w-full items-start gap-4 px-5 py-5 text-left transition disabled:cursor-not-allowed disabled:opacity-60",
                    isUnread
                      ? "bg-[#1D1916] hover:bg-[#241F1B]"
                      : "hover:bg-[#1C1916]",
                  ].join(" ")}
                >
                  {isUnread ? (
                    <span className="absolute left-0 top-0 h-full w-0.5 bg-[#C84B18]" />
                  ) : null}

                  <NotificationAvatar
                    notification={
                      notification
                    }
                  />

                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-start justify-between gap-x-4 gap-y-1">
                      <p className="text-sm leading-6 text-[#C9C4BC]">
                        {notification.actor ? (
                          <span className="font-semibold text-[#F4F1EB]">
                            {notification.actor.name?.trim() ||
                              `@${notification.actor.username}`}
                          </span>
                        ) : (
                          <span className="font-semibold text-[#F4F1EB]">
                            Reelog
                          </span>
                        )}{" "}
                        {content.message}
                      </p>

                      <span className="shrink-0 text-xs text-[#716B65]">
                        {formatRelativeDate(
                          notification.createdAt,
                        )}
                      </span>
                    </div>

                    {notification.actor ? (
                      <p className="mt-1 text-xs text-[#716B65]">
                        @
                        {
                          notification.actor
                            .username
                        }
                      </p>
                    ) : null}

                    <div className="mt-3 flex items-center gap-2">
                      <span
                        className={[
                          "text-xs font-semibold",
                          isUnread
                            ? "text-[#E45A1C]"
                            : "text-[#8A8580]",
                        ].join(" ")}
                      >
                        {isProcessing
                          ? "Opening..."
                          : content.actionLabel}
                      </span>

                      <ArrowRightIcon className="h-3.5 w-3.5 text-[#625D58]" />
                    </div>
                  </div>

                  {isUnread ? (
                    <span
                      aria-label="Unread notification"
                      className="mt-2 h-2 w-2 shrink-0 rounded-full bg-[#E45A1C]"
                    />
                  ) : null}
                </button>
              );
            })}
          </div>
        </section>
      )}
    </main>
  );
}

function NotificationAvatar({
  notification,
}: {
  notification: NotificationItem;
}) {
  const actor = notification.actor;

  const initial = (
    actor?.name?.trim() ||
    actor?.username ||
    "R"
  )
    .charAt(0)
    .toUpperCase();

  return (
    <span
      className="flex h-11 w-11 shrink-0 items-center justify-center overflow-hidden rounded-full border border-[#38332E] bg-[#765A4E] bg-cover bg-center text-sm font-bold text-white"
      style={
        actor?.avatarUrl
          ? {
              backgroundImage: `url("${actor.avatarUrl}")`,
            }
          : undefined
      }
    >
      {!actor?.avatarUrl ? initial : null}
    </span>
  );
}

function getNotificationContent(
  notification: NotificationItem,
) {
  switch (notification.type) {
    case "FOLLOW_REQUEST":
      return {
        message:
          "sent you a follow request.",
        actionLabel: "Review request",
      };

    case "FOLLOW_ACCEPTED":
      return {
        message:
          "accepted your follow request.",
        actionLabel: "View profile",
      };

    case "NEW_FOLLOWER":
      return {
        message: "started following you.",
        actionLabel: "View follower",
      };

    case "DIARY_PUBLISHED":
      return {
        message:
          "published a new diary entry.",
        actionLabel: "View activity",
      };

    default:
      return {
        message:
          "sent you a new notification.",
        actionLabel: "Open",
      };
  }
}

function getNotificationDestination(
  notification: NotificationItem,
) {
  if (
    notification.type ===
    "FOLLOW_REQUEST"
  ) {
    return "/follow-requests";
  }

  if (
    notification.type ===
      "DIARY_PUBLISHED" &&
    notification.entityId
  ) {
    return `/diary/${notification.entityId}`;
  }

  if (notification.actor?.username) {
    return `/u/${notification.actor.username}`;
  }

  return "/home";
}

function EmptyNotifications() {
  return (
    <div className="mt-7 rounded-2xl border border-dashed border-[#302C28] bg-[#171411] px-6 py-16 text-center">
      <span className="mx-auto flex h-14 w-14 items-center justify-center rounded-full border border-[#302C28] bg-[#211E1B] text-[#8A8580]">
        <BellIcon className="h-6 w-6" />
      </span>

      <h2 className="mt-5 text-lg font-semibold text-[#F4F1EB]">
        No notifications yet
      </h2>

      <p className="mx-auto mt-2 max-w-md text-sm leading-6 text-[#8A8580]">
        Follow requests, accepted requests,
        and new followers will appear here.
      </p>

      <Link
        href="/search"
        className="mt-6 inline-flex rounded-full bg-[#F4F1EB] px-5 py-2.5 text-sm font-semibold text-[#171411] transition hover:bg-white"
      >
        Discover people
      </Link>
    </div>
  );
}

function NotificationSkeleton() {
  return (
    <div className="mt-7 overflow-hidden rounded-2xl border border-[#2C2824] bg-[#171411]">
      {[1, 2, 3].map((item) => (
        <div
          key={item}
          className="flex animate-pulse items-start gap-4 border-b border-[#292521] px-5 py-5 last:border-b-0"
        >
          <div className="h-11 w-11 shrink-0 rounded-full bg-[#292521]" />

          <div className="flex-1 space-y-3">
            <div className="h-3 w-3/4 rounded bg-[#292521]" />
            <div className="h-2.5 w-32 rounded bg-[#24201D]" />
            <div className="h-2.5 w-24 rounded bg-[#24201D]" />
          </div>
        </div>
      ))}
    </div>
  );
}

function formatRelativeDate(value: string) {
  const date = new Date(value);
  const difference =
    Date.now() - date.getTime();

  const minutes = Math.max(
    0,
    Math.floor(difference / 60_000),
  );

  if (minutes < 1) {
    return "Just now";
  }

  if (minutes < 60) {
    return `${minutes}m`;
  }

  const hours = Math.floor(
    minutes / 60,
  );

  if (hours < 24) {
    return `${hours}h`;
  }

  const days = Math.floor(hours / 24);

  if (days < 7) {
    return `${days}d`;
  }

  return new Intl.DateTimeFormat("en", {
    day: "numeric",
    month: "short",
    year:
      date.getFullYear() ===
      new Date().getFullYear()
        ? undefined
        : "numeric",
  }).format(date);
}

function BellIcon({
  className = "",
}: {
  className?: string;
}) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      aria-hidden="true"
      className={className}
    >
      <path
        d="M18 9a6 6 0 0 0-12 0c0 7-3 7-3 9h18c0-2-3-2-3-9ZM10 21h4"
        stroke="currentColor"
        strokeWidth="1.7"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function ArrowRightIcon({
  className = "",
}: {
  className?: string;
}) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      aria-hidden="true"
      className={className}
    >
      <path
        d="m9 6 6 6-6 6"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}