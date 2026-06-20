import type { Metadata } from "next";
import Link from "next/link";
import { getServerSession } from "next-auth";
import { notFound } from "next/navigation";

import { FormattedReview } from "@/components/diary/FormattedReview";
import { ShareProfileButton } from "@/components/profile/ShareProfileButton";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { getTmdbPosterUrl } from "@/lib/tmdb";

type PublicProfilePageProps = {
  params: {
    username: string;
  };
};

export async function generateMetadata({
  params,
}: PublicProfilePageProps): Promise<Metadata> {
  const username = params.username.trim().toLowerCase();

  const user = await prisma.user.findFirst({
    where: {
      username,
      onboardingCompleted: true,
      deletedAt: null,
      suspendedAt: null,
    },
    select: {
      username: true,
      name: true,
      isPublic: true,
    },
  });

  if (!user || !user.isPublic) {
    return {
      title: "Profile not found | Reelog",
    };
  }

  return {
    title: `${user.name ?? `@${user.username}`} | Reelog`,
    description: `View @${user.username}'s public film and series diary on Reelog.`,
  };
}

export default async function PublicProfilePage({
  params,
}: PublicProfilePageProps) {
  const session = await getServerSession(authOptions);
  const username = params.username.trim().toLowerCase();

  const user = await prisma.user.findFirst({
    where: {
      username,
      onboardingCompleted: true,
      deletedAt: null,
      suspendedAt: null,
    },
    select: {
      id: true,
      username: true,
      name: true,
      image: true,
      bio: true,
      socialLink: true,
      isPublic: true,
      createdAt: true,
    },
  });

  if (!user?.username) {
    notFound();
  }

  const isOwner = session?.user?.id === user.id;

  if (!user.isPublic && !isOwner) {
    notFound();
  }

  const [entries, publicEntryCount, publicReviewCount, ratingStats] =
    await Promise.all([
      prisma.diaryEntry.findMany({
        where: {
          userId: user.id,
          isPublic: true,
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
        take: 30,
        select: {
          id: true,
          title: true,
          posterPath: true,
          mediaType: true,
          rating: true,
          review: true,
          spoiler: true,
          reviewIsPublic: true,
          watchedAt: true,
        },
      }),

      prisma.diaryEntry.count({
        where: {
          userId: user.id,
          isPublic: true,
          deletedAt: null,
        },
      }),

      prisma.diaryEntry.count({
        where: {
          userId: user.id,
          isPublic: true,
          reviewIsPublic: true,
          review: {
            not: null,
          },
          deletedAt: null,
        },
      }),

      prisma.diaryEntry.aggregate({
        where: {
          userId: user.id,
          isPublic: true,
          rating: {
            not: null,
          },
          deletedAt: null,
        },
        _avg: {
          rating: true,
        },
      }),
    ]);

  const homeHref = session?.user?.id ? "/home" : "/";
  const displayName = user.name?.trim() || `@${user.username}`;
  const socialUrl = getSafeExternalUrl(user.socialLink);

  const joinedDate = new Intl.DateTimeFormat("en", {
    month: "long",
    year: "numeric",
  }).format(user.createdAt);

  return (
    <main className="min-h-screen bg-[#100E0C] text-[#F4F1EB]">
      <header className="border-b border-[#27231F]">
        <div className="mx-auto flex h-20 max-w-7xl items-center justify-between px-5 md:px-8">
          <Link
            href={homeHref}
            className="text-xl font-bold tracking-tight text-[#F4F1EB]"
          >
            Reelog
          </Link>

          {session?.user?.id ? (
            <Link
              href="/home"
              className="rounded-full border border-[#302C28] px-4 py-2 text-sm font-medium text-[#C9C4BC] transition hover:border-[#C84B18]/60 hover:text-[#F4F1EB]"
            >
              Back to app
            </Link>
          ) : (
            <Link
              href="/login"
              className="rounded-full bg-[#C84B18] px-4 py-2 text-sm font-semibold text-white transition hover:bg-[#DC5520]"
            >
              Sign in
            </Link>
          )}
        </div>
      </header>

      <div className="mx-auto max-w-7xl px-5 py-10 md:px-8 md:py-14">
        {!user.isPublic && isOwner ? (
          <div className="mb-8 rounded-xl border border-[#C84B18]/30 bg-[#C84B18]/10 px-5 py-4">
            <p className="text-sm font-semibold text-[#E45A1C]">
              Private profile preview
            </p>

            <p className="mt-1 text-sm leading-6 text-[#A7A19A]">
              Only you can open this profile right now. Make your
              profile public from Account Settings so other people
              can view it.
            </p>
          </div>
        ) : null}

        <section className="grid gap-8 lg:grid-cols-[1fr_auto] lg:items-end">
          <div className="flex min-w-0 flex-col gap-5 sm:flex-row sm:items-center">
            <div
              className="flex h-28 w-28 shrink-0 items-center justify-center rounded-full bg-[#9B7567] bg-cover bg-center text-3xl font-bold text-white shadow-xl shadow-black/30"
              style={
                user.image
                  ? {
                      backgroundImage: `url("${user.image}")`,
                    }
                  : undefined
              }
            >
              {!user.image
                ? user.username.charAt(0).toUpperCase()
                : null}
            </div>

            <div className="min-w-0">
              <p className="text-xs uppercase tracking-[0.16em] text-[#625D58]">
                Reelog profile
              </p>

              <h1 className="mt-2 truncate text-3xl font-bold tracking-tight text-[#F4F1EB] md:text-5xl">
                {displayName}
              </h1>

              <p className="mt-2 text-sm font-medium text-[#E45A1C]">
                @{user.username}
              </p>

              {user.bio ? (
                <p className="mt-4 max-w-2xl text-sm leading-7 text-[#A7A19A]">
                  {user.bio}
                </p>
              ) : null}

              <div className="mt-4 flex flex-wrap items-center gap-x-5 gap-y-2 text-xs text-[#625D58]">
                <span>Joined {joinedDate}</span>

                {socialUrl ? (
                  <a
                    href={socialUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="text-[#C9C4BC] transition hover:text-[#E45A1C]"
                  >
                    Social link ↗
                  </a>
                ) : null}
              </div>
            </div>
          </div>

          <div>
            <div className="flex flex-wrap justify-start gap-3 lg:justify-end">
              {isOwner ? (
                <Link
                  href="/settings"
                  className="inline-flex items-center justify-center gap-2 rounded-full bg-[#C84B18] px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-[#DC5520]"
                >
                  <EditIcon className="h-4 w-4" />
                  Edit profile
                </Link>
              ) : null}

              <ShareProfileButton username={user.username} />
            </div>

            <div className="mt-5 grid grid-cols-3 gap-3">
              <ProfileStat
                label="Diary"
                value={publicEntryCount.toString()}
              />

              <ProfileStat
                label="Reviews"
                value={publicReviewCount.toString()}
              />

              <ProfileStat
                label="Avg. rating"
                value={
                  ratingStats._avg.rating !== null
                    ? ratingStats._avg.rating.toFixed(1)
                    : "—"
                }
              />
            </div>
          </div>
        </section>

        <section className="mt-14">
          <div className="flex flex-wrap items-end justify-between gap-4">
            <div>
              <p className="text-xs uppercase tracking-[0.16em] text-[#625D58]">
                Public activity
              </p>

              <h2 className="mt-2 text-2xl font-bold text-[#F4F1EB]">
                Diary
              </h2>
            </div>

            <p className="text-xs text-[#625D58]">
              {publicEntryCount > entries.length
                ? `Showing the latest ${entries.length} entries`
                : `${publicEntryCount} ${
                    publicEntryCount === 1 ? "entry" : "entries"
                  }`}
            </p>
          </div>

          {entries.length === 0 ? (
            <div className="mt-7 rounded-xl border border-dashed border-[#302C28] bg-[#171411] px-6 py-16 text-center">
              <h3 className="text-lg font-semibold text-[#F4F1EB]">
                No public diary entries yet
              </h3>

              <p className="mx-auto mt-2 max-w-md text-sm leading-6 text-[#8A8580]">
                Public diary entries will appear here.
              </p>
            </div>
          ) : (
            <div className="mt-7 space-y-5">
              {entries.map((entry) => {
                const posterUrl = getTmdbPosterUrl(entry.posterPath);

                return (
                  <article
                    key={entry.id}
                    className="rounded-xl border border-[#27231F] bg-[#1A1714] p-5"
                  >
                    <div className="grid gap-5 sm:grid-cols-[88px_1fr]">
                      <div
                        className="aspect-[2/3] w-[88px] rounded-lg bg-gradient-to-br from-[#3A2419] to-[#171411] bg-cover bg-center shadow-lg shadow-black/20"
                        style={
                          posterUrl
                            ? {
                                backgroundImage: `url("${posterUrl}")`,
                              }
                            : undefined
                        }
                      />

                      <div className="min-w-0">
                        <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                          <div className="min-w-0">
                            <div className="flex flex-wrap items-center gap-3">
                              <h3 className="text-xl font-semibold text-[#F4F1EB]">
                                {entry.title}
                              </h3>

                              <span className="rounded-full bg-[#211E1B] px-2.5 py-1 text-[9px] uppercase tracking-wide text-[#8A8580]">
                                {entry.mediaType === "movie"
                                  ? "Film"
                                  : "Series"}
                              </span>
                            </div>

                            <p className="mt-3 text-xs text-[#8A8580]">
                              Watched{" "}
                              {new Intl.DateTimeFormat("en", {
                                day: "2-digit",
                                month: "long",
                                year: "numeric",
                                timeZone: "UTC",
                              }).format(entry.watchedAt)}
                            </p>
                          </div>

                          <div className="shrink-0 sm:text-right">
                            <p className="text-[10px] uppercase tracking-[0.12em] text-[#625D58]">
                              Rating
                            </p>

                            <p className="mt-1 text-lg font-semibold text-[#E45A1C]">
                              {entry.rating
                                ? `${entry.rating.toFixed(1)} / 5`
                                : "Not rated"}
                            </p>
                          </div>
                        </div>

                        {entry.review && entry.reviewIsPublic ? (
                          <div className="mt-5 border-t border-[#302C28] pt-5">
                            <div className="mb-3 flex flex-wrap items-center justify-between gap-3">
                              <p className="text-[10px] font-medium uppercase tracking-[0.14em] text-[#625D58]">
                                Review
                              </p>

                              {entry.spoiler ? (
                                <span className="rounded-full bg-[#C84B18]/10 px-2.5 py-1 text-[9px] uppercase tracking-wide text-[#E45A1C]">
                                  Contains spoilers
                                </span>
                              ) : null}
                            </div>

                            <FormattedReview
                              text={entry.review}
                              hideWholeReview={entry.spoiler}
                              className="max-w-3xl"
                            />
                          </div>
                        ) : null}
                      </div>
                    </div>
                  </article>
                );
              })}
            </div>
          )}
        </section>

        <footer className="mt-16 border-t border-[#27231F] pt-6 text-center">
          <p className="text-xs text-[#625D58]">
            Film and series data provided by TMDB.
          </p>
        </footer>
      </div>
    </main>
  );
}

function ProfileStat({
  label,
  value,
}: {
  label: string;
  value: string;
}) {
  return (
    <div className="min-w-[96px] rounded-xl border border-[#27231F] bg-[#171411] px-4 py-4 text-center">
      <p className="text-xl font-bold text-[#F4F1EB]">
        {value}
      </p>

      <p className="mt-1 text-[10px] uppercase tracking-[0.12em] text-[#625D58]">
        {label}
      </p>
    </div>
  );
}

function EditIcon({
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
        d="m14.5 5.5 4 4M4 20l4.5-1 10-10a2.83 2.83 0 0 0-4-4l-10 10L4 20Z"
        stroke="currentColor"
        strokeWidth="1.7"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function getSafeExternalUrl(value: string | null) {
  if (!value) {
    return null;
  }

  try {
    const url = new URL(value);

    if (url.protocol !== "http:" && url.protocol !== "https:") {
      return null;
    }

    return url.toString();
  } catch {
    return null;
  }
}