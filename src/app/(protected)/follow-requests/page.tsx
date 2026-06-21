"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

type FollowRequestUser = {
  id: string;
  username: string;
  name: string | null;
  avatarUrl: string | null;
  bio: string | null;
  isPrivate: boolean;
};

type FollowRequestItem = {
  id: string;
  requestedAt: string;
  user: FollowRequestUser;
};

type FollowRequestsResponse = {
  requests: FollowRequestItem[];
  count: number;
  message?: string;
};

type RequestAction = "accept" | "reject";

export default function FollowRequestsPage() {
  const router = useRouter();

  const [requests, setRequests] = useState<FollowRequestItem[]>([]);
  const [pendingCount, setPendingCount] = useState(0);
  const [activeRequestId, setActiveRequestId] = useState<string | null>(
    null,
  );

  const [isLoading, setIsLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState("");
  const [noticeMessage, setNoticeMessage] = useState("");

  useEffect(() => {
    const controller = new AbortController();

    async function loadRequests() {
      setIsLoading(true);
      setErrorMessage("");

      try {
        const response = await fetch("/api/follow-requests", {
          method: "GET",
          cache: "no-store",
          signal: controller.signal,
        });

        const payload =
          (await response.json()) as FollowRequestsResponse;

        if (!response.ok) {
          setErrorMessage(
            payload.message ?? "Unable to load follow requests.",
          );
          return;
        }

        setRequests(payload.requests);
        setPendingCount(payload.count);
      } catch (error) {
        if (
          error instanceof DOMException &&
          error.name === "AbortError"
        ) {
          return;
        }

        setErrorMessage("Unable to connect to the server.");
      } finally {
        setIsLoading(false);
      }
    }

    void loadRequests();

    return () => {
      controller.abort();
    };
  }, []);

  async function handleRequestAction(
    requestItem: FollowRequestItem,
    action: RequestAction,
  ) {
    if (activeRequestId) {
      return;
    }

    setActiveRequestId(requestItem.id);
    setErrorMessage("");
    setNoticeMessage("");

    try {
      const response = await fetch(
        `/api/follow-requests/${requestItem.id}`,
        {
          method: "PATCH",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            action,
          }),
        },
      );

      const payload = (await response.json()) as {
        message?: string;
        pendingCount?: number;
      };

      if (!response.ok) {
        setErrorMessage(
          payload.message ??
            "Unable to respond to this follow request.",
        );
        return;
      }

      setRequests((currentRequests) =>
        currentRequests.filter(
          (item) => item.id !== requestItem.id,
        ),
      );

      setPendingCount((currentCount) =>
        typeof payload.pendingCount === "number"
          ? payload.pendingCount
          : Math.max(currentCount - 1, 0),
      );

      setNoticeMessage(
        action === "accept"
          ? `@${requestItem.user.username} can now follow you.`
          : `Request from @${requestItem.user.username} declined.`,
      );

      router.refresh();
    } catch {
      setErrorMessage("Unable to connect to the server.");
    } finally {
      setActiveRequestId(null);
    }
  }

  return (
    <main className="mx-auto w-full max-w-4xl px-5 py-8 md:px-8 md:py-12">
      <div className="flex flex-wrap items-end justify-between gap-4 border-b border-[#27231F] pb-7">
        <div>
          <p className="text-xs font-medium uppercase tracking-[0.16em] text-[#625D58]">
            Social
          </p>

          <div className="mt-2 flex items-center gap-3">
            <h1 className="text-3xl font-bold tracking-tight text-[#F4F1EB]">
              Follow requests
            </h1>

            {!isLoading && pendingCount > 0 ? (
              <span className="inline-flex min-w-6 items-center justify-center rounded-full bg-[#C84B18] px-2 py-1 text-[11px] font-bold text-white">
                {pendingCount > 99 ? "99+" : pendingCount}
              </span>
            ) : null}
          </div>

          <p className="mt-3 max-w-xl text-sm leading-6 text-[#8A8580]">
            Review people who want to follow your private account.
          </p>
        </div>

        <Link
          href="/home"
          className="rounded-full border border-[#302C28] px-4 py-2 text-sm font-medium text-[#C9C4BC] transition hover:border-[#C84B18]/60 hover:text-[#F4F1EB]"
        >
          Back to home
        </Link>
      </div>

      {errorMessage ? (
        <div className="mt-6 rounded-xl border border-red-900/50 bg-red-950/20 px-4 py-3 text-sm text-red-300">
          {errorMessage}
        </div>
      ) : null}

      {noticeMessage ? (
        <div className="mt-6 rounded-xl border border-[#4A3327] bg-[#241811] px-4 py-3 text-sm text-[#E7A27F]">
          {noticeMessage}
        </div>
      ) : null}

      <section className="mt-7">
        {isLoading ? (
          <FollowRequestsSkeleton />
        ) : requests.length === 0 ? (
          <EmptyState />
        ) : (
          <div className="divide-y divide-[#27231F] overflow-hidden rounded-2xl border border-[#27231F] bg-[#171411]">
            {requests.map((requestItem) => {
              const isProcessing =
                activeRequestId === requestItem.id;

              return (
                <article
                  key={requestItem.id}
                  className="flex flex-col gap-5 p-5 transition hover:bg-[#1C1916] sm:flex-row sm:items-center sm:justify-between"
                >
                  <div className="flex min-w-0 items-start gap-4">
                    <ProfileAvatar
                      user={requestItem.user}
                    />

                    <div className="min-w-0 pt-0.5">
                      <div className="flex flex-wrap items-center gap-2">
                        <Link
                          href={`/u/${requestItem.user.username}`}
                          className="truncate text-sm font-semibold text-[#F4F1EB] transition hover:text-[#E45A1C]"
                        >
                          {requestItem.user.name?.trim() ||
                            `@${requestItem.user.username}`}
                        </Link>

                        {requestItem.user.isPrivate ? (
                          <span className="inline-flex items-center gap-1 rounded-full border border-[#302C28] bg-[#211E1B] px-2 py-0.5 text-[9px] font-medium uppercase tracking-wide text-[#8A8580]">
                            <LockIcon className="h-2.5 w-2.5" />
                            Private
                          </span>
                        ) : null}
                      </div>

                      <p className="mt-1 text-xs font-medium text-[#E45A1C]">
                        @{requestItem.user.username}
                      </p>

                      {requestItem.user.bio ? (
                        <p className="mt-2 line-clamp-2 max-w-lg text-xs leading-5 text-[#8A8580]">
                          {requestItem.user.bio}
                        </p>
                      ) : null}

                      <p className="mt-2 text-[11px] text-[#625D58]">
                        Requested{" "}
                        {formatRequestedAt(
                          requestItem.requestedAt,
                        )}
                      </p>
                    </div>
                  </div>

                  <div className="flex shrink-0 items-center gap-2 pl-14 sm:pl-0">
                    <button
                      type="button"
                      disabled={
                        Boolean(activeRequestId) ||
                        isProcessing
                      }
                      onClick={() =>
                        void handleRequestAction(
                          requestItem,
                          "reject",
                        )
                      }
                      className="rounded-full border border-[#302C28] px-4 py-2 text-xs font-semibold text-[#A7A19A] transition hover:border-[#4A433D] hover:bg-[#211E1B] hover:text-[#F4F1EB] disabled:cursor-not-allowed disabled:opacity-45"
                    >
                      {isProcessing
                        ? "Please wait"
                        : "Decline"}
                    </button>

                    <button
                      type="button"
                      disabled={
                        Boolean(activeRequestId) ||
                        isProcessing
                      }
                      onClick={() =>
                        void handleRequestAction(
                          requestItem,
                          "accept",
                        )
                      }
                      className="rounded-full bg-[#C84B18] px-4 py-2 text-xs font-semibold text-white transition hover:bg-[#DC5520] disabled:cursor-not-allowed disabled:opacity-45"
                    >
                      {isProcessing
                        ? "Processing..."
                        : "Accept"}
                    </button>
                  </div>
                </article>
              );
            })}
          </div>
        )}
      </section>
    </main>
  );
}

function ProfileAvatar({
  user,
}: {
  user: FollowRequestUser;
}) {
  const fallbackText = (
    user.name?.trim() ||
    user.username
  )
    .charAt(0)
    .toUpperCase();

  return (
    <Link
      href={`/u/${user.username}`}
      className="flex h-12 w-12 shrink-0 items-center justify-center overflow-hidden rounded-full border border-[#342E29] bg-[#9B7567] bg-cover bg-center text-sm font-bold text-white transition hover:border-[#C84B18]/70"
      style={
        user.avatarUrl
          ? {
              backgroundImage: `url("${user.avatarUrl}")`,
            }
          : undefined
      }
      aria-label={`Open @${user.username}'s profile`}
    >
      {!user.avatarUrl ? fallbackText : null}
    </Link>
  );
}

function EmptyState() {
  return (
    <div className="rounded-2xl border border-dashed border-[#302C28] bg-[#171411] px-6 py-16 text-center">
      <span className="mx-auto flex h-14 w-14 items-center justify-center rounded-full border border-[#302C28] bg-[#211E1B] text-[#8A8580]">
        <UsersIcon className="h-6 w-6" />
      </span>

      <h2 className="mt-5 text-lg font-semibold text-[#F4F1EB]">
        No follow requests
      </h2>

      <p className="mx-auto mt-2 max-w-md text-sm leading-6 text-[#8A8580]">
        New requests from people who want to follow your private
        account will appear here.
      </p>
    </div>
  );
}

function FollowRequestsSkeleton() {
  return (
    <div className="divide-y divide-[#27231F] overflow-hidden rounded-2xl border border-[#27231F] bg-[#171411]">
      {Array.from({ length: 3 }).map((_, index) => (
        <div
          key={index}
          className="flex items-center justify-between gap-4 p-5"
        >
          <div className="flex flex-1 items-center gap-4">
            <div className="h-12 w-12 animate-pulse rounded-full bg-[#28231F]" />

            <div className="flex-1">
              <div className="h-4 w-36 animate-pulse rounded bg-[#28231F]" />
              <div className="mt-2 h-3 w-24 animate-pulse rounded bg-[#211E1B]" />
              <div className="mt-3 h-3 max-w-sm animate-pulse rounded bg-[#211E1B]" />
            </div>
          </div>

          <div className="hidden gap-2 sm:flex">
            <div className="h-9 w-20 animate-pulse rounded-full bg-[#28231F]" />
            <div className="h-9 w-20 animate-pulse rounded-full bg-[#3B2117]" />
          </div>
        </div>
      ))}
    </div>
  );
}

function formatRequestedAt(value: string) {
  const requestedAt = new Date(value);
  const now = new Date();

  const differenceInSeconds = Math.max(
    Math.floor(
      (now.getTime() - requestedAt.getTime()) / 1000,
    ),
    0,
  );

  if (differenceInSeconds < 60) {
    return "just now";
  }

  const differenceInMinutes = Math.floor(
    differenceInSeconds / 60,
  );

  if (differenceInMinutes < 60) {
    return `${differenceInMinutes}m ago`;
  }

  const differenceInHours = Math.floor(
    differenceInMinutes / 60,
  );

  if (differenceInHours < 24) {
    return `${differenceInHours}h ago`;
  }

  const differenceInDays = Math.floor(
    differenceInHours / 24,
  );

  if (differenceInDays < 7) {
    return `${differenceInDays}d ago`;
  }

  return new Intl.DateTimeFormat("en", {
    day: "numeric",
    month: "short",
    year:
      requestedAt.getFullYear() !== now.getFullYear()
        ? "numeric"
        : undefined,
  }).format(requestedAt);
}

function LockIcon({
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
      <rect
        x="5"
        y="10"
        width="14"
        height="10"
        rx="2"
        stroke="currentColor"
        strokeWidth="1.8"
      />

      <path
        d="M8 10V7.5a4 4 0 0 1 8 0V10"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
      />
    </svg>
  );
}

function UsersIcon({
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
      <circle
        cx="9"
        cy="8"
        r="3"
        stroke="currentColor"
        strokeWidth="1.7"
      />

      <path
        d="M3.5 19c.4-3.4 2.3-5.2 5.5-5.2s5.1 1.8 5.5 5.2"
        stroke="currentColor"
        strokeWidth="1.7"
        strokeLinecap="round"
      />

      <path
        d="M15.5 5.5a3 3 0 0 1 0 5.7M16 14c2.6.4 4 2.1 4.4 5"
        stroke="currentColor"
        strokeWidth="1.7"
        strokeLinecap="round"
      />
    </svg>
  );
}