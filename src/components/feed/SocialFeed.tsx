"use client";

import Link from "next/link";
import { useEffect, useState } from "react";

import { FormattedReview } from "@/components/diary/FormattedReview";

type FeedItem = {
  id: string;
  tmdbId: number;
  mediaType: "movie" | "tv";
  title: string;
  posterPath: string | null;
  rating: number | null;
  review: string | null;
  spoiler: boolean;
  watchedAt: string;
  createdAt: string;
  user: {
    id: string;
    username: string;
    name: string | null;
    avatarUrl: string | null;
    isPrivate: boolean;
  };
};

type FeedResponse = {
  items?: FeedItem[];
  nextCursor?: string | null;
  hasMore?: boolean;
  message?: string;
};

export function SocialFeed() {
  const [items, setItems] = useState<FeedItem[]>([]);
  const [nextCursor, setNextCursor] =
    useState<string | null>(null);
  const [hasMore, setHasMore] = useState(false);
  const [isLoading, setIsLoading] =
    useState(true);
  const [isLoadingMore, setIsLoadingMore] =
    useState(false);
  const [errorMessage, setErrorMessage] =
    useState("");

  useEffect(() => {
    let isActive = true;

    async function loadInitialFeed() {
      setIsLoading(true);
      setErrorMessage("");

      try {
        const response = await fetch(
          "/api/feed?limit=10",
          {
            method: "GET",
            cache: "no-store",
          },
        );

        const payload =
          (await response.json()) as FeedResponse;

        if (!response.ok) {
          if (isActive) {
            setErrorMessage(
              payload.message ??
                "Unable to load your feed.",
            );
          }

          return;
        }

        if (isActive) {
          setItems(payload.items ?? []);
          setNextCursor(
            payload.nextCursor ?? null,
          );
          setHasMore(
            Boolean(payload.hasMore),
          );
        }
      } catch {
        if (isActive) {
          setErrorMessage(
            "Unable to connect to the server.",
          );
        }
      } finally {
        if (isActive) {
          setIsLoading(false);
        }
      }
    }

    void loadInitialFeed();

    return () => {
      isActive = false;
    };
  }, []);

  async function handleLoadMore() {
    if (
      !nextCursor ||
      !hasMore ||
      isLoadingMore
    ) {
      return;
    }

    setIsLoadingMore(true);
    setErrorMessage("");

    try {
      const response = await fetch(
        `/api/feed?limit=10&cursor=${encodeURIComponent(
          nextCursor,
        )}`,
        {
          method: "GET",
          cache: "no-store",
        },
      );

      const payload =
        (await response.json()) as FeedResponse;

      if (!response.ok) {
        setErrorMessage(
          payload.message ??
            "Unable to load more activities.",
        );

        return;
      }

      setItems((currentItems) => {
        const existingIds = new Set(
          currentItems.map((item) => item.id),
        );

        const newItems = (
          payload.items ?? []
        ).filter(
          (item) => !existingIds.has(item.id),
        );

        return [...currentItems, ...newItems];
      });

      setNextCursor(
        payload.nextCursor ?? null,
      );

      setHasMore(Boolean(payload.hasMore));
    } catch {
      setErrorMessage(
        "Unable to connect to the server.",
      );
    } finally {
      setIsLoadingMore(false);
    }
  }

  return (
    <section className="mt-12">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold tracking-tight text-[#F4F1EB]">
            From people you follow
          </h2>

          <p className="mt-1 text-sm text-[#8A8580]">
            Recent films, series, ratings, and
            reviews from your connections.
          </p>
        </div>

        <Link
          href="/search"
          className="text-sm font-medium text-[#C84B18] transition hover:text-[#E45A1C]"
        >
          Find people and titles
        </Link>
      </div>

      {errorMessage ? (
        <div className="mt-6 rounded-xl border border-red-900/50 bg-red-950/20 px-4 py-3 text-sm text-red-300">
          {errorMessage}
        </div>
      ) : null}

      {isLoading ? (
        <FeedSkeleton />
      ) : items.length === 0 ? (
        <EmptyFeed />
      ) : (
        <>
          <div className="mt-6 space-y-4">
            {items.map((item) => (
              <FeedCard
                key={item.id}
                item={item}
              />
            ))}
          </div>

          {hasMore && nextCursor ? (
            <div className="mt-7 flex justify-center">
              <button
                type="button"
                onClick={handleLoadMore}
                disabled={isLoadingMore}
                className="inline-flex min-w-32 items-center justify-center rounded-full border border-[#38332E] bg-[#211E1B] px-5 py-2.5 text-sm font-semibold text-[#F4F1EB] transition hover:border-[#C84B18]/60 hover:bg-[#29241F] disabled:cursor-not-allowed disabled:opacity-50"
              >
                {isLoadingMore
                  ? "Loading..."
                  : "Load more"}
              </button>
            </div>
          ) : null}
        </>
      )}
    </section>
  );
}

function FeedCard({
  item,
}: {
  item: FeedItem;
}) {
  const posterUrl = getPosterUrl(
    item.posterPath,
  );

  const displayName =
    item.user.name?.trim() ||
    `@${item.user.username}`;

  return (
    <article className="overflow-hidden rounded-2xl border border-[#2C2824] bg-[#171411]">
      <header className="flex items-center justify-between gap-4 border-b border-[#292521] px-5 py-4">
        <div className="flex min-w-0 items-center gap-3">
          <UserAvatar item={item} />

          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-2">
              <Link
                href={`/u/${item.user.username}`}
                className="truncate text-sm font-semibold text-[#F4F1EB] transition hover:text-[#E45A1C]"
              >
                {displayName}
              </Link>

              {item.user.isPrivate ? (
                <span className="rounded-full border border-[#38332E] px-2 py-0.5 text-[9px] font-medium uppercase tracking-wide text-[#716B65]">
                  Private
                </span>
              ) : null}
            </div>

            <p className="mt-0.5 text-xs text-[#716B65]">
              @{item.user.username}
              <span className="mx-1.5">·</span>
              {formatRelativeDate(
                item.createdAt,
              )}
            </p>
          </div>
        </div>

        <span className="shrink-0 text-[10px] font-medium uppercase tracking-wider text-[#625D58]">
          {item.mediaType === "movie"
            ? "Film"
            : "Series"}
        </span>
      </header>

      <div className="flex flex-col gap-5 p-5 sm:flex-row">
        <div className="w-full shrink-0 sm:w-32">
          <div
            className="aspect-[2/3] overflow-hidden rounded-lg bg-gradient-to-br from-[#3A2419] to-[#171411] bg-cover bg-center shadow-lg shadow-black/20"
            style={
              posterUrl
                ? {
                    backgroundImage: `url("${posterUrl}")`,
                  }
                : undefined
            }
          >
            {!posterUrl ? (
              <div className="flex h-full items-center justify-center px-3 text-center">
                <span className="text-xs font-semibold text-[#8A8580]">
                  {item.title}
                </span>
              </div>
            ) : null}
          </div>
        </div>

        <div className="min-w-0 flex-1">
          <h3 className="text-xl font-bold tracking-tight text-[#F4F1EB]">
            {item.title}
          </h3>

          <p className="mt-1 text-xs text-[#716B65]">
            Watched{" "}
            {formatWatchedDate(
              item.watchedAt,
            )}
          </p>

          <div className="mt-4 flex flex-wrap items-center gap-3">
            {item.rating !== null ? (
              <RatingBadge
                rating={item.rating}
              />
            ) : (
              <span className="rounded-full border border-[#38332E] px-3 py-1 text-xs text-[#716B65]">
                Not rated
              </span>
            )}

            {item.review ? (
              <span className="text-xs text-[#716B65]">
                Shared a review
              </span>
            ) : (
              <span className="text-xs text-[#625D58]">
                Logged this title
              </span>
            )}
          </div>

          {item.review ? (
            <div className="mt-5 border-t border-[#292521] pt-5">
              <FormattedReview
                text={item.review}
                hideWholeReview={item.spoiler}
                className="max-w-2xl"
              />
            </div>
          ) : null}
        </div>
      </div>
    </article>
  );
}

function UserAvatar({
  item,
}: {
  item: FeedItem;
}) {
  const initial = (
    item.user.name?.trim() ||
    item.user.username
  )
    .charAt(0)
    .toUpperCase();

  return (
    <Link
      href={`/u/${item.user.username}`}
      className="flex h-10 w-10 shrink-0 items-center justify-center overflow-hidden rounded-full border border-[#38332E] bg-[#765A4E] bg-cover bg-center text-sm font-bold text-white transition hover:border-[#C84B18]/70"
      style={
        item.user.avatarUrl
          ? {
              backgroundImage: `url("${item.user.avatarUrl}")`,
            }
          : undefined
      }
      aria-label={`Open ${item.user.username}'s profile`}
    >
      {!item.user.avatarUrl
        ? initial
        : null}
    </Link>
  );
}

function RatingBadge({
  rating,
}: {
  rating: number;
}) {
  return (
    <span className="inline-flex items-center gap-1.5 rounded-full bg-[#2A1C15] px-3 py-1 text-xs font-semibold text-[#E9783E]">
      <StarIcon className="h-3.5 w-3.5" />
      {formatRating(rating)} / 5
    </span>
  );
}

function EmptyFeed() {
  return (
    <div className="mt-6 rounded-2xl border border-dashed border-[#302C28] bg-[#171411] px-6 py-14 text-center">
      <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full border border-[#302C28] bg-[#211E1B] text-[#8A8580]">
        <UsersIcon className="h-6 w-6" />
      </div>

      <h3 className="mt-5 text-lg font-semibold text-[#F4F1EB]">
        Your feed is quiet
      </h3>

      <p className="mx-auto mt-2 max-w-md text-sm leading-6 text-[#8A8580]">
        Follow other Reelog members to see
        their public diary entries, ratings,
        and reviews here.
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

function FeedSkeleton() {
  return (
    <div className="mt-6 space-y-4">
      {[1, 2].map((item) => (
        <div
          key={item}
          className="animate-pulse overflow-hidden rounded-2xl border border-[#2C2824] bg-[#171411]"
        >
          <div className="flex items-center gap-3 border-b border-[#292521] px-5 py-4">
            <div className="h-10 w-10 rounded-full bg-[#292521]" />

            <div className="space-y-2">
              <div className="h-3 w-32 rounded bg-[#292521]" />
              <div className="h-2.5 w-24 rounded bg-[#24201D]" />
            </div>
          </div>

          <div className="flex gap-5 p-5">
            <div className="h-48 w-32 shrink-0 rounded-lg bg-[#292521]" />

            <div className="flex-1 space-y-4">
              <div className="h-5 w-48 rounded bg-[#292521]" />
              <div className="h-3 w-28 rounded bg-[#24201D]" />
              <div className="h-7 w-24 rounded-full bg-[#292521]" />
              <div className="space-y-2 pt-3">
                <div className="h-3 w-full rounded bg-[#24201D]" />
                <div className="h-3 w-4/5 rounded bg-[#24201D]" />
              </div>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}

function getPosterUrl(
  posterPath: string | null,
) {
  if (!posterPath) {
    return null;
  }

  return `https://image.tmdb.org/t/p/w342${posterPath}`;
}

function formatRating(value: number) {
  return Number.isInteger(value)
    ? value.toFixed(0)
    : value.toFixed(1);
}

function formatWatchedDate(value: string) {
  return new Intl.DateTimeFormat("en", {
    day: "numeric",
    month: "short",
    year: "numeric",
  }).format(new Date(value));
}

function formatRelativeDate(value: string) {
  const date = new Date(value);
  const difference =
    Date.now() - date.getTime();

  const minutes = Math.floor(
    difference / 60_000,
  );

  if (minutes < 1) {
    return "just now";
  }

  if (minutes < 60) {
    return `${minutes}m ago`;
  }

  const hours = Math.floor(
    minutes / 60,
  );

  if (hours < 24) {
    return `${hours}h ago`;
  }

  const days = Math.floor(
    hours / 24,
  );

  if (days < 7) {
    return `${days}d ago`;
  }

  return new Intl.DateTimeFormat("en", {
    day: "numeric",
    month: "short",
  }).format(date);
}

function StarIcon({
  className = "",
}: {
  className?: string;
}) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="currentColor"
      aria-hidden="true"
      className={className}
    >
      <path d="m12 2.8 2.7 5.5 6.1.9-4.4 4.3 1 6.1-5.4-2.9-5.4 2.9 1-6.1-4.4-4.3 6.1-.9L12 2.8Z" />
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
        d="M3.5 19c.4-3.4 2.3-5.2 5.5-5.2s5.1 1.8 5.5 5.2M15.5 5.5a3 3 0 0 1 0 5.7M16 14c2.6.4 4 2.1 4.4 5"
        stroke="currentColor"
        strokeWidth="1.7"
        strokeLinecap="round"
      />
    </svg>
  );
}