import { Prisma } from "@prisma/client";
import { getServerSession } from "next-auth";
import Link from "next/link";
import { notFound } from "next/navigation";

import { FormattedReview } from "@/components/diary/FormattedReview";
import { FeaturedFilmButton } from "@/components/profile/FeaturedFilmButton";
import { WatchlistButton } from "@/components/watchlist/WatchlistButton";
import { getUserAvatarUrl } from "@/lib/avatar";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import {
  getTmdbBackdropUrl,
  getTmdbPosterUrl,
  getTmdbTitleDetails,
  type TmdbMediaType,
  type TmdbTitleDetails,
} from "@/lib/tmdb";

export const dynamic = "force-dynamic";

type TitleDetailPageProps = {
  params: {
    mediaType: string;
    tmdbId: string;
  };
};

export default async function TitleDetailPage({
  params,
}: TitleDetailPageProps) {
  if (
    params.mediaType !== "movie" &&
    params.mediaType !== "tv"
  ) {
    notFound();
  }

  const mediaType = params.mediaType as TmdbMediaType;
  const tmdbId = Number(params.tmdbId);

  if (!Number.isInteger(tmdbId) || tmdbId < 1) {
    notFound();
  }

  const session = await getServerSession(authOptions);
  const viewerId = session?.user?.id ?? null;

  let media: TmdbTitleDetails | null = null;

  try {
    media = await getTmdbTitleDetails(mediaType, tmdbId);
  } catch (error) {
    console.error("Unable to load title from TMDB:", error);

    const [
      savedDiaryTitle,
      savedWatchlistTitle,
      savedFeaturedTitle,
    ] = await Promise.all([
      prisma.diaryEntry.findFirst({
        where: {
          tmdbId,
          mediaType,
          deletedAt: null,
        },
        orderBy: {
          createdAt: "desc",
        },
        select: {
          tmdbId: true,
          mediaType: true,
          title: true,
          posterPath: true,
        },
      }),
      prisma.watchlistItem.findFirst({
        where: {
          tmdbId,
          mediaType,
          deletedAt: null,
        },
        orderBy: {
          addedAt: "desc",
        },
        select: {
          tmdbId: true,
          mediaType: true,
          title: true,
          posterPath: true,
        },
      }),
      prisma.featuredFilm.findFirst({
        where: {
          tmdbId,
          mediaType,
        },
        orderBy: {
          updatedAt: "desc",
        },
        select: {
          tmdbId: true,
          mediaType: true,
          title: true,
          posterPath: true,
        },
      }),
    ]);

    const savedTitle =
      savedDiaryTitle ??
      savedWatchlistTitle ??
      savedFeaturedTitle;

    if (savedTitle) {
      media = {
        id: savedTitle.tmdbId,
        mediaType: savedTitle.mediaType,
        title: savedTitle.title,
        overview: "",
        posterPath: savedTitle.posterPath,
        backdropPath: null,
        releaseDate: null,
        rating: 0,
        voteCount: 0,
        genres: [],
        runtimeMinutes: null,
        episodeRuntimeMinutes: null,
        numberOfEpisodes: null,
        numberOfSeasons: null,
        status: null,
      };
    }
  }

  if (!media) {
    notFound();
  }

  const accessibleProfileConditions: Prisma.UserWhereInput[] = [
    {
      isPublic: true,
    },
  ];

  if (viewerId) {
    accessibleProfileConditions.push(
      {
        id: viewerId,
      },
      {
        followers: {
          some: {
            followerId: viewerId,
            status: "ACCEPTED",
          },
        },
      },
    );
  }

  const visibleCommunityEntryWhere: Prisma.DiaryEntryWhereInput = {
    tmdbId: media.id,
    mediaType: media.mediaType,
    deletedAt: null,
    isPublic: true,
    user: {
      is: {
        deletedAt: null,
        suspendedAt: null,
        onboardingCompleted: true,
        username: {
          not: null,
        },
        OR: accessibleProfileConditions,
      },
    },
  };

  const [
    watchlistItem,
    ownEntryCount,
    latestOwnEntry,
    visibleLogCount,
    visibleWatchers,
    communityRating,
    communityReviews,
  ] = await Promise.all([
    viewerId
      ? prisma.watchlistItem.findFirst({
          where: {
            userId: viewerId,
            tmdbId: media.id,
            mediaType: media.mediaType,
            deletedAt: null,
          },
          select: {
            id: true,
          },
        })
      : Promise.resolve(null),

    viewerId
      ? prisma.diaryEntry.count({
          where: {
            userId: viewerId,
            tmdbId: media.id,
            mediaType: media.mediaType,
            deletedAt: null,
          },
        })
      : Promise.resolve(0),

    viewerId
      ? prisma.diaryEntry.findFirst({
          where: {
            userId: viewerId,
            tmdbId: media.id,
            mediaType: media.mediaType,
            deletedAt: null,
          },
          orderBy: [
            {
              watchedAt: "desc",
            },
            {
              createdAt: "desc",
            },
          ],
          select: {
            id: true,
            watchedAt: true,
            rating: true,
            isRewatch: true,
          },
        })
      : Promise.resolve(null),

    prisma.diaryEntry.count({
      where: visibleCommunityEntryWhere,
    }),

    prisma.diaryEntry.findMany({
      where: visibleCommunityEntryWhere,
      distinct: ["userId"],
      select: {
        userId: true,
      },
    }),

    prisma.diaryEntry.aggregate({
      where: {
        ...visibleCommunityEntryWhere,
        rating: {
          not: null,
        },
      },
      _avg: {
        rating: true,
      },
      _count: {
        rating: true,
      },
    }),

    prisma.diaryEntry.findMany({
      where: {
        ...visibleCommunityEntryWhere,
        reviewIsPublic: true,
        review: {
          not: null,
        },
      },
      orderBy: [
        {
          watchedAt: "desc",
        },
        {
          createdAt: "desc",
        },
      ],
      take: 12,
      select: {
        id: true,
        rating: true,
        review: true,
        spoiler: true,
        isRewatch: true,
        watchedAt: true,
        user: {
          select: {
            name: true,
            username: true,
            image: true,
            avatarPath: true,
          },
        },
      },
    }),
  ]);

  const posterUrl = getTmdbPosterUrl(media.posterPath, "w500");
  const backdropUrl = getTmdbBackdropUrl(
    media.backdropPath,
    "w1280",
  );

  const releaseDate = formatReleaseDate(media.releaseDate);
  const runtime = getRuntimeLabel(media);
  const reelogAverage = communityRating._avg.rating;
  const reelogRatingCount = communityRating._count.rating;

  return (
    <main className="min-h-screen bg-[#100E0C] text-[#F4F1EB]">
      <header className="relative z-20 border-b border-[#27231F] bg-[#100E0C]/90 backdrop-blur">
        <div className="mx-auto flex h-20 max-w-7xl items-center justify-between px-5 md:px-8">
          <Link
            href={viewerId ? "/home" : "/"}
            className="text-xl font-bold tracking-tight"
          >
            Reelog
          </Link>

          <Link
            href={viewerId ? "/home" : "/login"}
            className="rounded-full border border-[#302C28] px-4 py-2 text-sm font-medium text-[#C9C4BC] transition hover:border-[#C84B18]/60 hover:text-[#F4F1EB]"
          >
            {viewerId ? "Back to app" : "Sign in"}
          </Link>
        </div>
      </header>

      <section className="relative overflow-hidden border-b border-[#27231F]">
        {backdropUrl ? (
          <div
            className="absolute inset-0 bg-cover bg-center opacity-35"
            style={{
              backgroundImage: `url("${backdropUrl}")`,
            }}
          />
        ) : null}

        <div className="absolute inset-0 bg-gradient-to-r from-[#100E0C] via-[#100E0C]/90 to-[#100E0C]/50" />
        <div className="absolute inset-0 bg-gradient-to-t from-[#100E0C] via-transparent to-[#100E0C]/40" />

        <div className="relative mx-auto grid w-full max-w-7xl gap-8 px-5 py-10 md:px-8 lg:grid-cols-[280px_minmax(0,1fr)] lg:gap-12 lg:py-16">
          <aside className="mx-auto w-full max-w-[280px] lg:mx-0">
            <div
              className="aspect-[2/3] overflow-hidden rounded-2xl border border-[#3A3530] bg-gradient-to-br from-[#3A2419] to-[#171411] bg-cover bg-center shadow-2xl shadow-black/50"
              style={
                posterUrl
                  ? {
                      backgroundImage: `url("${posterUrl}")`,
                    }
                  : undefined
              }
            >
              {!posterUrl ? (
                <div className="flex h-full items-center justify-center p-6 text-center">
                  <span className="text-sm font-semibold text-[#8A8580]">
                    {media.title}
                  </span>
                </div>
              ) : null}
            </div>
          </aside>

          <div className="min-w-0 self-center">
            <div className="flex flex-wrap items-center gap-2">
              <span className="rounded-full bg-[#C84B18]/15 px-3 py-1 text-[10px] font-semibold uppercase tracking-[0.14em] text-[#E45A1C]">
                {media.mediaType === "movie"
                  ? "Film"
                  : "Series"}
              </span>

              {media.status ? (
                <span className="rounded-full border border-white/10 bg-black/20 px-3 py-1 text-[10px] uppercase tracking-[0.12em] text-[#A7A19A]">
                  {media.status}
                </span>
              ) : null}
            </div>

            <h1 className="mt-4 break-words text-4xl font-bold tracking-tight md:text-5xl lg:text-6xl">
              {media.title}
            </h1>

            <div className="mt-5 flex flex-wrap items-center gap-x-5 gap-y-2 text-sm text-[#A7A19A]">
              {releaseDate ? <span>{releaseDate}</span> : null}

              {runtime ? <span>{runtime}</span> : null}

              {media.rating > 0 ? (
                <span className="inline-flex items-center gap-1.5">
                  <StarIcon className="h-4 w-4 text-[#E45A1C]" />
                  {media.rating.toFixed(1)} TMDB
                </span>
              ) : null}

              {media.voteCount > 0 ? (
                <span>
                  {formatNumber(media.voteCount)} votes
                </span>
              ) : null}
            </div>

            {media.genres.length > 0 ? (
              <div className="mt-5 flex flex-wrap gap-2">
                {media.genres.map((genre) => (
                  <span
                    key={genre}
                    className="rounded-full border border-[#3A3530] bg-[#100E0C]/50 px-3 py-1.5 text-xs text-[#C9C4BC]"
                  >
                    {genre}
                  </span>
                ))}
              </div>
            ) : null}

            <p className="mt-7 max-w-3xl text-sm leading-7 text-[#B8B2AA] md:text-base">
              {media.overview ||
                "Detailed information for this title is currently unavailable."}
            </p>

            <div className="mt-9 flex flex-col gap-3 sm:flex-row sm:flex-wrap">
              {viewerId ? (
                <>
                  <Link
                    href={`/log/${media.mediaType}/${media.id}`}
                    className="inline-flex items-center justify-center rounded-full bg-[#C84B18] px-6 py-3 text-sm font-semibold text-white transition hover:bg-[#DC5520]"
                  >
                    {ownEntryCount > 0
                      ? "Log again"
                      : "Log this title"}
                  </Link>

                  <FeaturedFilmButton
                    tmdbId={media.id}
                    mediaType={media.mediaType}
                    title={media.title}
                  />

                  <WatchlistButton
                    tmdbId={media.id}
                    mediaType={media.mediaType}
                    title={media.title}
                    initialSaved={Boolean(watchlistItem)}
                  />
                </>
              ) : (
                <Link
                  href="/login"
                  className="inline-flex items-center justify-center rounded-full bg-[#C84B18] px-6 py-3 text-sm font-semibold text-white transition hover:bg-[#DC5520]"
                >
                  Sign in to continue
                </Link>
              )}
            </div>

            {viewerId && latestOwnEntry ? (
              <div className="mt-6 flex flex-col gap-4 rounded-xl border border-[#3A3530] bg-[#100E0C]/70 p-4 backdrop-blur sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <p className="text-sm font-semibold text-[#F4F1EB]">
                    You have logged this title{" "}
                    {ownEntryCount === 1
                      ? "once"
                      : `${ownEntryCount} times`}
                  </p>

                  <p className="mt-1 text-xs text-[#8A8580]">
                    Last watched{" "}
                    {formatDiaryDate(latestOwnEntry.watchedAt)}
                    {latestOwnEntry.isRewatch
                      ? " as a rewatch"
                      : ""}
                    {latestOwnEntry.rating !== null
                      ? ` · ${latestOwnEntry.rating.toFixed(1)} / 5`
                      : ""}
                  </p>
                </div>

                <Link
                  href={`/diary/${latestOwnEntry.id}`}
                  className="inline-flex shrink-0 items-center justify-center rounded-full border border-[#48413B] px-4 py-2 text-xs font-semibold text-[#C9C4BC] transition hover:border-[#C84B18] hover:text-[#E45A1C]"
                >
                  View latest entry
                </Link>
              </div>
            ) : null}
          </div>
        </div>
      </section>

      <section className="mx-auto w-full max-w-7xl px-5 py-10 md:px-8 lg:py-14">
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <StatisticCard
            label="Reelog rating"
            value={
              reelogAverage !== null
                ? `${reelogAverage.toFixed(1)} / 5`
                : "No ratings"
            }
            helper={
              reelogRatingCount === 1
                ? "1 public rating"
                : `${reelogRatingCount} public ratings`
            }
          />

          <StatisticCard
            label="Viewers"
            value={formatNumber(visibleWatchers.length)}
            helper={
              visibleWatchers.length === 1
                ? "1 visible member"
                : `${visibleWatchers.length} visible members`
            }
          />

          <StatisticCard
            label="Public logs"
            value={formatNumber(visibleLogCount)}
            helper={
              visibleLogCount === 1
                ? "1 diary entry"
                : `${visibleLogCount} diary entries`
            }
          />

          <StatisticCard
            label="Public reviews"
            value={formatNumber(communityReviews.length)}
            helper={
              communityReviews.length === 12
                ? "Showing the latest 12"
                : communityReviews.length === 1
                  ? "1 community review"
                  : `${communityReviews.length} community reviews`
            }
          />
        </div>

        <section className="mt-12">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.16em] text-[#E45A1C]">
              Community
            </p>

            <h2 className="mt-2 text-2xl font-bold tracking-tight text-[#F4F1EB]">
              Reelog reviews
            </h2>

            <p className="mt-2 text-sm leading-6 text-[#8A8580]">
              Public reviews from profiles you are allowed to view.
            </p>
          </div>

          {communityReviews.length === 0 ? (
            <div className="mt-7 rounded-xl border border-dashed border-[#302C28] bg-[#171411] px-6 py-14 text-center">
              <h3 className="text-lg font-semibold text-[#F4F1EB]">
                No public reviews yet
              </h3>

              <p className="mx-auto mt-2 max-w-md text-sm leading-6 text-[#8A8580]">
                Be the first person to publish a review for this
                title.
              </p>

              {viewerId ? (
                <Link
                  href={`/log/${media.mediaType}/${media.id}`}
                  className="mt-6 inline-flex rounded-full bg-[#C84B18] px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-[#DC5520]"
                >
                  Write a review
                </Link>
              ) : (
                <Link
                  href="/login"
                  className="mt-6 inline-flex rounded-full bg-[#C84B18] px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-[#DC5520]"
                >
                  Sign in to review
                </Link>
              )}
            </div>
          ) : (
            <div className="mt-7 grid gap-5 lg:grid-cols-2">
              {communityReviews.map((review) => {
                const username = review.user.username;

                if (!username || !review.review) {
                  return null;
                }

                const avatarUrl = getUserAvatarUrl(
                  review.user.avatarPath,
                  review.user.image,
                );

                const displayName =
                  review.user.name?.trim() || `@${username}`;

                return (
                  <article
                    key={review.id}
                    className="rounded-xl border border-[#27231F] bg-[#191613] p-5 sm:p-6"
                  >
                    <div className="flex items-start justify-between gap-4">
                      <Link
                        href={`/u/${username}`}
                        className="flex min-w-0 items-center gap-3"
                      >
                        <Avatar
                          avatarUrl={avatarUrl}
                          name={displayName}
                        />

                        <div className="min-w-0">
                          <p className="truncate text-sm font-semibold text-[#F4F1EB] transition hover:text-[#E45A1C]">
                            {displayName}
                          </p>

                          <p className="truncate text-xs text-[#716B65]">
                            @{username}
                          </p>
                        </div>
                      </Link>

                      {review.rating !== null ? (
                        <div className="shrink-0 text-right">
                          <p className="text-sm font-semibold text-[#E45A1C]">
                            {review.rating.toFixed(1)} / 5
                          </p>
                        </div>
                      ) : null}
                    </div>

                    <div className="mt-4 flex flex-wrap items-center gap-2 text-[10px] uppercase tracking-[0.1em] text-[#625D58]">
                      <span>
                        Watched {formatDiaryDate(review.watchedAt)}
                      </span>

                      {review.isRewatch ? (
                        <span className="rounded-full bg-[#C84B18]/15 px-2.5 py-1 text-[#E45A1C]">
                          Rewatch
                        </span>
                      ) : (
                        <span className="rounded-full bg-[#211E1B] px-2.5 py-1">
                          First watch
                        </span>
                      )}
                    </div>

                    <div className="mt-5 border-t border-[#302C28] pt-5">
                      <FormattedReview
                        text={review.review}
                        hideWholeReview={review.spoiler}
                      />
                    </div>

                    <Link
                      href={`/u/${username}`}
                      className="mt-5 inline-flex text-xs font-semibold text-[#8A8580] transition hover:text-[#E45A1C]"
                    >
                      View profile →
                    </Link>
                  </article>
                );
              })}
            </div>
          )}
        </section>
      </section>
    </main>
  );
}

function StatisticCard({
  label,
  value,
  helper,
}: {
  label: string;
  value: string;
  helper: string;
}) {
  return (
    <div className="rounded-xl border border-[#27231F] bg-[#191613] p-5">
      <p className="text-[10px] font-semibold uppercase tracking-[0.14em] text-[#625D58]">
        {label}
      </p>

      <p className="mt-3 text-2xl font-bold tracking-tight text-[#F4F1EB]">
        {value}
      </p>

      <p className="mt-1 text-xs text-[#716B65]">{helper}</p>
    </div>
  );
}

function Avatar({
  avatarUrl,
  name,
}: {
  avatarUrl: string | null;
  name: string;
}) {
  if (avatarUrl) {
    return (
      <div
        className="h-10 w-10 shrink-0 rounded-full border border-[#3A3530] bg-cover bg-center"
        style={{
          backgroundImage: `url("${avatarUrl}")`,
        }}
      />
    );
  }

  return (
    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full border border-[#3A3530] bg-[#211E1B] text-sm font-semibold uppercase text-[#C9C4BC]">
      {name.slice(0, 1)}
    </div>
  );
}

function getRuntimeLabel(media: TmdbTitleDetails) {
  if (media.mediaType === "movie") {
    return media.runtimeMinutes
      ? formatRuntime(media.runtimeMinutes)
      : null;
  }

  const parts: string[] = [];

  if (media.numberOfSeasons) {
    parts.push(
      `${media.numberOfSeasons} ${
        media.numberOfSeasons === 1 ? "season" : "seasons"
      }`,
    );
  }

  if (media.numberOfEpisodes) {
    parts.push(
      `${media.numberOfEpisodes} ${
        media.numberOfEpisodes === 1 ? "episode" : "episodes"
      }`,
    );
  }

  if (media.episodeRuntimeMinutes) {
    parts.push(
      `${formatRuntime(media.episodeRuntimeMinutes)} per episode`,
    );
  }

  return parts.length > 0 ? parts.join(" · ") : null;
}

function formatRuntime(minutes: number) {
  const hours = Math.floor(minutes / 60);
  const remainingMinutes = minutes % 60;

  if (hours === 0) {
    return `${remainingMinutes}m`;
  }

  if (remainingMinutes === 0) {
    return `${hours}h`;
  }

  return `${hours}h ${remainingMinutes}m`;
}

function formatReleaseDate(value: string | null) {
  if (!value) {
    return null;
  }

  const date = new Date(`${value}T00:00:00.000Z`);

  if (Number.isNaN(date.getTime())) {
    return value.slice(0, 4);
  }

  return new Intl.DateTimeFormat("en", {
    day: "numeric",
    month: "long",
    year: "numeric",
    timeZone: "UTC",
  }).format(date);
}

function formatDiaryDate(value: Date) {
  return new Intl.DateTimeFormat("en", {
    day: "numeric",
    month: "short",
    year: "numeric",
    timeZone: "UTC",
  }).format(value);
}

function formatNumber(value: number) {
  return new Intl.NumberFormat("en").format(value);
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
      <path d="m12 2.8 2.75 5.57 6.15.9-4.45 4.33 1.05 6.12L12 16.83l-5.5 2.89 1.05-6.12L3.1 9.27l6.15-.9L12 2.8Z" />
    </svg>
  );
}