"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";

export type ConnectionRelationship =
  | "SELF"
  | "NONE"
  | "PENDING"
  | "ACCEPTED"
  | "REJECTED";

export type ProfileConnectionItem = {
  id: string;
  username: string;
  name: string | null;
  bio: string | null;
  avatarUrl: string | null;
  isPrivate: boolean;
  relationship: ConnectionRelationship;
  followsYou: boolean;
  isViewer: boolean;
};

type ProfileConnectionsListProps = {
  profileUsername: string;
  profileDisplayName: string;
  kind: "followers" | "following";
  isOwner: boolean;
  isAuthenticated: boolean;
  totalCount: number;
  initialItems: ProfileConnectionItem[];
};

type FollowResponse = {
  message?: string;
  relationship?: ConnectionRelationship;
  followsYou?: boolean;
};

export function ProfileConnectionsList({
  profileUsername,
  profileDisplayName,
  kind,
  isOwner,
  isAuthenticated,
  totalCount,
  initialItems,
}: ProfileConnectionsListProps) {
  const router = useRouter();

  const [items, setItems] =
    useState(initialItems);

  const [activeUserId, setActiveUserId] =
    useState<string | null>(null);

  const [errorMessage, setErrorMessage] =
    useState("");

  const [noticeMessage, setNoticeMessage] =
    useState("");

  useEffect(() => {
    setItems(initialItems);
  }, [initialItems]);

  const title =
    kind === "followers"
      ? "Followers"
      : "Following";

  const description =
    kind === "followers"
      ? `People following ${profileDisplayName}.`
      : `People followed by ${profileDisplayName}.`;

  async function handleFollowAction(
    item: ProfileConnectionItem,
  ) {
    if (
      !isAuthenticated ||
      item.isViewer ||
      activeUserId
    ) {
      return;
    }

    const shouldRemove =
      item.relationship === "ACCEPTED" ||
      item.relationship === "PENDING";

    setActiveUserId(item.id);
    setErrorMessage("");
    setNoticeMessage("");

    try {
      const response = await fetch(
        `/api/users/${encodeURIComponent(
          item.username,
        )}/follow`,
        {
          method: shouldRemove
            ? "DELETE"
            : "POST",
        },
      );

      const payload =
        (await response.json()) as FollowResponse;

      if (!response.ok) {
        setErrorMessage(
          payload.message ??
            "Unable to update follow status.",
        );
        return;
      }

      const nextRelationship =
        payload.relationship ?? "NONE";

      if (
        isOwner &&
        kind === "following" &&
        shouldRemove &&
        nextRelationship === "NONE"
      ) {
        setItems((currentItems) =>
          currentItems.filter(
            (currentItem) =>
              currentItem.id !== item.id,
          ),
        );

        setNoticeMessage(
          `You unfollowed @${item.username}.`,
        );
      } else {
        setItems((currentItems) =>
          currentItems.map((currentItem) =>
            currentItem.id === item.id
              ? {
                  ...currentItem,
                  relationship:
                    nextRelationship,
                  followsYou:
                    payload.followsYou ??
                    currentItem.followsYou,
                }
              : currentItem,
          ),
        );
      }

      router.refresh();
    } catch {
      setErrorMessage(
        "Unable to connect to the server.",
      );
    } finally {
      setActiveUserId(null);
    }
  }

  async function handleRemoveFollower(
    item: ProfileConnectionItem,
  ) {
    if (
      !isOwner ||
      kind !== "followers" ||
      activeUserId
    ) {
      return;
    }

    setActiveUserId(item.id);
    setErrorMessage("");
    setNoticeMessage("");

    try {
      const response = await fetch(
        `/api/users/${encodeURIComponent(
          profileUsername,
        )}/followers/${encodeURIComponent(
          item.username,
        )}`,
        {
          method: "DELETE",
        },
      );

      const payload = (await response.json()) as {
        message?: string;
      };

      if (!response.ok) {
        setErrorMessage(
          payload.message ??
            "Unable to remove this follower.",
        );
        return;
      }

      setItems((currentItems) =>
        currentItems.filter(
          (currentItem) =>
            currentItem.id !== item.id,
        ),
      );

      setNoticeMessage(
        `@${item.username} was removed from your followers.`,
      );

      router.refresh();
    } catch {
      setErrorMessage(
        "Unable to connect to the server.",
      );
    } finally {
      setActiveUserId(null);
    }
  }

  return (
    <main className="mx-auto w-full max-w-4xl px-5 py-10 md:px-8 md:py-14">
      <div className="flex flex-wrap items-start justify-between gap-5 border-b border-[#27231F] pb-7">
        <div>
          <Link
            href={`/u/${profileUsername}`}
            className="inline-flex items-center gap-2 text-xs font-medium text-[#8A8580] transition hover:text-[#E45A1C]"
          >
            <ArrowLeftIcon className="h-3.5 w-3.5" />
            Back to profile
          </Link>

          <h1 className="mt-4 text-3xl font-bold tracking-tight text-[#F4F1EB]">
            {title}
          </h1>

          <p className="mt-2 text-sm leading-6 text-[#8A8580]">
            {description}
          </p>
        </div>

        <span className="rounded-full border border-[#302C28] bg-[#171411] px-3 py-1.5 text-xs font-medium text-[#A7A19A]">
          {totalCount}{" "}
          {totalCount === 1
            ? kind === "followers"
              ? "follower"
              : "account"
            : kind}
        </span>
      </div>

      <div className="mt-6 flex border-b border-[#27231F]">
        <ConnectionTab
          href={`/u/${profileUsername}/followers`}
          label="Followers"
          active={kind === "followers"}
        />

        <ConnectionTab
          href={`/u/${profileUsername}/following`}
          label="Following"
          active={kind === "following"}
        />
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

      {items.length === 0 ? (
        <EmptyState kind={kind} />
      ) : (
        <section className="mt-7 divide-y divide-[#27231F] overflow-hidden rounded-2xl border border-[#27231F] bg-[#171411]">
          {items.map((item) => {
            const isProcessing =
              activeUserId === item.id;

            return (
              <article
                key={item.id}
                className="flex flex-col gap-5 p-5 transition hover:bg-[#1C1916] sm:flex-row sm:items-center sm:justify-between"
              >
                <div className="flex min-w-0 items-start gap-4">
                  <ConnectionAvatar item={item} />

                  <div className="min-w-0 pt-0.5">
                    <div className="flex flex-wrap items-center gap-2">
                      <Link
                        href={`/u/${item.username}`}
                        className="truncate text-sm font-semibold text-[#F4F1EB] transition hover:text-[#E45A1C]"
                      >
                        {item.name?.trim() ||
                          `@${item.username}`}
                      </Link>

                      {item.isPrivate ? (
                        <span className="inline-flex items-center gap-1 rounded-full border border-[#302C28] bg-[#211E1B] px-2 py-0.5 text-[9px] font-medium uppercase tracking-wide text-[#8A8580]">
                          <LockIcon className="h-2.5 w-2.5" />
                          Private
                        </span>
                      ) : null}

                      {!item.isViewer &&
                      item.followsYou ? (
                        <span className="rounded-full bg-[#25201C] px-2 py-0.5 text-[9px] font-medium text-[#A7A19A]">
                          Follows you
                        </span>
                      ) : null}
                    </div>

                    <p className="mt-1 text-xs font-medium text-[#E45A1C]">
                      @{item.username}
                    </p>

                    {item.bio ? (
                      <p className="mt-2 line-clamp-2 max-w-lg text-xs leading-5 text-[#8A8580]">
                        {item.bio}
                      </p>
                    ) : null}
                  </div>
                </div>

                <div className="shrink-0 pl-14 sm:pl-0">
                  <ConnectionAction
                    item={item}
                    kind={kind}
                    isOwner={isOwner}
                    isAuthenticated={
                      isAuthenticated
                    }
                    isProcessing={isProcessing}
                    hasActiveAction={Boolean(
                      activeUserId,
                    )}
                    onFollow={() =>
                      void handleFollowAction(item)
                    }
                    onRemove={() =>
                      void handleRemoveFollower(
                        item,
                      )
                    }
                    profileUsername={
                      profileUsername
                    }
                  />
                </div>
              </article>
            );
          })}
        </section>
      )}
    </main>
  );
}

function ConnectionAction({
  item,
  kind,
  isOwner,
  isAuthenticated,
  isProcessing,
  hasActiveAction,
  onFollow,
  onRemove,
  profileUsername,
}: {
  item: ProfileConnectionItem;
  kind: "followers" | "following";
  isOwner: boolean;
  isAuthenticated: boolean;
  isProcessing: boolean;
  hasActiveAction: boolean;
  onFollow: () => void;
  onRemove: () => void;
  profileUsername: string;
}) {
  if (item.isViewer) {
    return (
      <span className="text-xs text-[#625D58]">
        You
      </span>
    );
  }

  if (isOwner && kind === "followers") {
    return (
      <button
        type="button"
        onClick={onRemove}
        disabled={
          hasActiveAction || isProcessing
        }
        className="rounded-full border border-[#3A3530] px-4 py-2 text-xs font-semibold text-[#A7A19A] transition hover:border-red-900/70 hover:bg-red-950/20 hover:text-red-300 disabled:cursor-not-allowed disabled:opacity-45"
      >
        {isProcessing
          ? "Removing..."
          : "Remove"}
      </button>
    );
  }

  if (!isAuthenticated) {
    return (
      <Link
        href={`/login?callbackUrl=${encodeURIComponent(
          `/u/${profileUsername}/${kind}`,
        )}`}
        className="rounded-full bg-[#C84B18] px-4 py-2 text-xs font-semibold text-white transition hover:bg-[#DC5520]"
      >
        Follow
      </Link>
    );
  }

  return (
    <button
      type="button"
      onClick={onFollow}
      disabled={
        hasActiveAction || isProcessing
      }
      className={getFollowButtonClass(
        item.relationship,
      )}
    >
      {isProcessing
        ? "Please wait..."
        : getFollowButtonLabel(item)}
    </button>
  );
}

function getFollowButtonLabel(
  item: ProfileConnectionItem,
) {
  if (item.relationship === "ACCEPTED") {
    return "Following";
  }

  if (item.relationship === "PENDING") {
    return "Requested";
  }

  if (item.followsYou) {
    return "Follow back";
  }

  return "Follow";
}

function getFollowButtonClass(
  relationship: ConnectionRelationship,
) {
  const baseClass =
    "rounded-full px-4 py-2 text-xs font-semibold transition disabled:cursor-not-allowed disabled:opacity-45";

  if (
    relationship === "ACCEPTED" ||
    relationship === "PENDING"
  ) {
    return `${baseClass} border border-[#3A3530] bg-[#211E1B] text-[#C9C4BC] hover:border-red-900/70 hover:bg-red-950/20 hover:text-red-300`;
  }

  return `${baseClass} bg-[#C84B18] text-white hover:bg-[#DC5520]`;
}

function ConnectionAvatar({
  item,
}: {
  item: ProfileConnectionItem;
}) {
  const initial = (
    item.name?.trim() || item.username
  )
    .charAt(0)
    .toUpperCase();

  return (
    <Link
      href={`/u/${item.username}`}
      className="flex h-12 w-12 shrink-0 items-center justify-center overflow-hidden rounded-full border border-[#342E29] bg-[#9B7567] bg-cover bg-center text-sm font-bold text-white transition hover:border-[#C84B18]/70"
      style={
        item.avatarUrl
          ? {
              backgroundImage: `url("${item.avatarUrl}")`,
            }
          : undefined
      }
    >
      {!item.avatarUrl ? initial : null}
    </Link>
  );
}

function ConnectionTab({
  href,
  label,
  active,
}: {
  href: string;
  label: string;
  active: boolean;
}) {
  return (
    <Link
      href={href}
      className={[
        "relative px-5 pb-3 text-sm font-medium transition",
        active
          ? "text-[#F4F1EB]"
          : "text-[#716B65] hover:text-[#C9C4BC]",
      ].join(" ")}
    >
      {label}

      {active ? (
        <span className="absolute inset-x-0 bottom-0 h-0.5 rounded-full bg-[#C84B18]" />
      ) : null}
    </Link>
  );
}

function EmptyState({
  kind,
}: {
  kind: "followers" | "following";
}) {
  return (
    <div className="mt-7 rounded-2xl border border-dashed border-[#302C28] bg-[#171411] px-6 py-16 text-center">
      <span className="mx-auto flex h-14 w-14 items-center justify-center rounded-full border border-[#302C28] bg-[#211E1B] text-[#8A8580]">
        <UsersIcon className="h-6 w-6" />
      </span>

      <h2 className="mt-5 text-lg font-semibold text-[#F4F1EB]">
        {kind === "followers"
          ? "No followers yet"
          : "Not following anyone yet"}
      </h2>

      <p className="mx-auto mt-2 max-w-md text-sm leading-6 text-[#8A8580]">
        {kind === "followers"
          ? "New followers will appear here."
          : "Accounts followed by this user will appear here."}
      </p>
    </div>
  );
}

function ArrowLeftIcon({
  className = "",
}: {
  className?: string;
}) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      className={className}
      aria-hidden="true"
    >
      <path
        d="m15 6-6 6 6 6"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
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
      className={className}
      aria-hidden="true"
    >
      <rect
        x="5"
        y="10"
        width="14"
        height="10"
        rx="2"
        stroke="currentColor"
        strokeWidth="1.7"
      />

      <path
        d="M8 10V7.5a4 4 0 0 1 8 0V10"
        stroke="currentColor"
        strokeWidth="1.7"
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
      className={className}
      aria-hidden="true"
    >
      <circle
        cx="9"
        cy="8"
        r="3"
        stroke="currentColor"
        strokeWidth="1.7"
      />

      <path
        d="M3.5 19c.4-3.4 2.3-5.2 5.5-5.2s5.1 1.8 5.5 5.2M15.5 5.5a3 3 0 0 1 0 5.7M16 14c2.6.4 4 2.1 4.4 5"
        stroke="currentColor"
        strokeWidth="1.7"
        strokeLinecap="round"
      />
    </svg>
  );
}