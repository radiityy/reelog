import {
  FollowStatus,
  type MediaType,
} from "@prisma/client";
import type { Metadata } from "next";
import Link from "next/link";
import { getServerSession } from "next-auth";
import { notFound } from "next/navigation";

import { FormattedReview } from "@/components/diary/FormattedReview";
import { ProfileAvatarEditor } from "@/components/profile/ProfileAvatarEditor";
import { ProfileFollowSection } from "@/components/profile/ProfileFollowSection";
import { ProfileActivityStats } from "@/components/profile/ProfileActivityStats";
import { getUserAvatarUrl } from "@/lib/avatar";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { getTmdbPosterUrl } from "@/lib/tmdb";

export const dynamic = "force-dynamic";

type PublicProfilePageProps = {
  params: {
    username: string;
  };
};

type FollowRelationship =
  | "SELF"
  | "NONE"
  | "PENDING"
  | "ACCEPTED"
  | "REJECTED";

type ConnectionPlatform =
  | "github"
  | "instagram"
  | "twitter"
  | "tiktok"
  | "spotify"
  | "website";

type SocialConnection = {
  url: string;
  label: string;
  platform: ConnectionPlatform;
};

type ProfileDiaryEntry = {
  id: string;
  title: string;
  posterPath: string | null;
  mediaType: MediaType;
  rating: number | null;
  review: string | null;
  spoiler: boolean;
  reviewIsPublic: boolean;
  watchedAt: Date;
};

type MutualFollower = {
  id: string;
  username: string;
  name: string | null;
  avatarUrl: string | null;
};

export async function generateMetadata({
  params,
}: PublicProfilePageProps): Promise<Metadata> {
  const username = normalizeUsername(params.username);

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

  if (!user?.username) {
    return {
      title: "Profile not found | Reelog",
    };
  }

  return {
    title: `${user.name?.trim() || `@${user.username}`} | Reelog`,
    description: user.isPublic
      ? `View @${user.username}'s public film and series diary on Reelog.`
      : `View @${user.username}'s profile on Reelog.`,
  };
}

export default async function PublicProfilePage({
  params,
}: PublicProfilePageProps) {
  const session = await getServerSession(authOptions);
  const viewerId = session?.user?.id ?? null;
  const username = normalizeUsername(params.username);

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
      avatarPath: true,
      bio: true,
      socialLink: true,
      isPublic: true,
      createdAt: true,
    },
  });

  if (!user?.username) {
    notFound();
  }

  const isOwner = viewerId === user.id;

  const [
    relationship,
    reverseRelationship,
    followersCount,
    followingCount,
  ] = await Promise.all([
    viewerId && !isOwner
      ? prisma.follow.findUnique({
          where: {
            followerId_followingId: {
              followerId: viewerId,
              followingId: user.id,
            },
          },
          select: {
            status: true,
          },
        })
      : Promise.resolve(null),

    viewerId && !isOwner
      ? prisma.follow.findUnique({
          where: {
            followerId_followingId: {
              followerId: user.id,
              followingId: viewerId,
            },
          },
          select: {
            status: true,
          },
        })
      : Promise.resolve(null),

    prisma.follow.count({
      where: {
        followingId: user.id,
        status: FollowStatus.ACCEPTED,
      },
    }),

    prisma.follow.count({
      where: {
        followerId: user.id,
        status: FollowStatus.ACCEPTED,
      },
    }),
  ]);

  const initialRelationship = resolveRelationship(
    relationship?.status,
    isOwner,
  );

  const followsYou =
    reverseRelationship?.status === FollowStatus.ACCEPTED;

  const canViewActivity =
    isOwner ||
    user.isPublic ||
    relationship?.status === FollowStatus.ACCEPTED;

  const [
    entries,
    publicEntryCount,
    publicReviewCount,
    averageRating,
  ] = canViewActivity
    ? await loadPublicActivity(user.id)
    : [[], 0, 0, null];

  const {
    users: mutualFollowers,
    total: mutualFollowersCount,
  } =
    viewerId && !isOwner
      ? await loadMutualFollowers(viewerId, user.id)
      : {
          users: [],
          total: 0,
        };

  const homeHref = viewerId ? "/home" : "/";
  const displayName =
    user.name?.trim() || `@${user.username}`;

  const avatarUrl = getUserAvatarUrl(
    user.avatarPath,
    user.image,
  );

  const socialConnection = getSocialConnection(
    user.socialLink,
  );

  const joinedDate = new Intl.DateTimeFormat("en", {
    day: "numeric",
    month: "long",
    year: "numeric",
    timeZone: "UTC",
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

          {viewerId ? (
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
        <section className="grid gap-10 lg:grid-cols-[1fr_auto] lg:items-start">
          <div className="flex min-w-0 flex-col gap-6 sm:flex-row sm:items-start">
            <ProfileAvatarEditor
              username={user.username}
              name={user.name}
              initialAvatarUrl={avatarUrl}
            />

            <div className="min-w-0 pt-1">
              <div className="flex flex-wrap items-center gap-3">
                <p className="text-xs uppercase tracking-[0.16em] text-[#625D58]">
                  Profile
                </p>

                {!user.isPublic ? (
                  <span className="inline-flex items-center gap-1.5 rounded-full border border-[#302C28] bg-[#171411] px-2.5 py-1 text-[10px] font-medium uppercase tracking-[0.1em] text-[#8A8580]">
                    <LockIcon className="h-3 w-3" />
                    Private
                  </span>
                ) : null}
              </div>

              <h1 className="mt-2 text-4xl font-bold tracking-tight text-[#F4F1EB] md:text-5xl">
                {displayName}
              </h1>

              <p className="mt-2 text-sm font-medium text-[#E45A1C]">
                @{user.username}
              </p>

              {user.bio ? (
                <p className="mt-5 max-w-2xl text-sm leading-7 text-[#A7A19A]">
                  {user.bio}
                </p>
              ) : null}

              {mutualFollowersCount > 0 ? (
                <MutualFollowersLine
                  users={mutualFollowers}
                  total={mutualFollowersCount}
                />
              ) : null}

              {socialConnection ? (
                <div className="mt-7">
                  <p className="text-xs font-medium uppercase tracking-[0.14em] text-[#625D58]">
                    Connections
                  </p>

                  <a
                    href={socialConnection.url}
                    target="_blank"
                    rel="noreferrer"
                    className="mt-3 inline-flex items-center gap-3 rounded-xl border border-[#27231F] bg-[#171411] px-4 py-3 transition hover:border-[#3A3530] hover:bg-[#211E1B]"
                  >
                    <span className="flex h-10 w-10 items-center justify-center rounded-lg bg-[#F4F1EB] text-[#171411]">
                      <ConnectionIcon
                        platform={socialConnection.platform}
                        className="h-5 w-5"
                      />
                    </span>

                    <span className="max-w-48 truncate text-sm font-semibold text-[#F4F1EB]">
                      {socialConnection.label}
                    </span>

                    <ExternalLinkIcon className="h-4 w-4 shrink-0 text-[#716B65]" />
                  </a>
                </div>
              ) : null}

              <p className="mt-6 text-xs text-[#625D58]">
                Joined {joinedDate}
              </p>
            </div>
          </div>

          <div>
            <ProfileFollowSection
              username={user.username}
              isOwner={isOwner}
              isAuthenticated={Boolean(viewerId)}
              initialRelationship={initialRelationship}
              initialFollowsYou={followsYou}
              initialFollowersCount={followersCount}
              initialFollowingCount={followingCount}
            />

              {canViewActivity ? (
                <ProfileActivityStats
                  diaryCount={publicEntryCount}
                  reviewCount={publicReviewCount}
                  averageRating={averageRating}
                />
              ) : null}
          </div>
        </section>

        {canViewActivity ? (
          <DiarySection
            entries={entries}
            publicEntryCount={publicEntryCount}
          />
        ) : (
          <PrivateProfileLock
            relationship={initialRelationship}
            username={user.username}
            isAuthenticated={Boolean(viewerId)}
          />
        )}

        <footer className="mt-16 border-t border-[#27231F] pt-6 text-center">
          <p className="text-xs text-[#625D58]">
            Film and series data provided by TMDB.
          </p>
        </footer>
      </div>
    </main>
  );
}

async function loadPublicActivity(userId: string): Promise<
  [
    ProfileDiaryEntry[],
    number,
    number,
    number | null,
  ]
> {
  const [
    entries,
    publicEntryCount,
    publicReviewCount,
    ratingStats,
  ] = await Promise.all([
    prisma.diaryEntry.findMany({
      where: {
        userId,
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
        userId,
        isPublic: true,
        deletedAt: null,
      },
    }),

    prisma.diaryEntry.count({
      where: {
        userId,
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
        userId,
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

  return [
    entries,
    publicEntryCount,
    publicReviewCount,
    ratingStats._avg.rating,
  ];
}

async function loadMutualFollowers(
  viewerId: string,
  profileUserId: string,
): Promise<{
  users: MutualFollower[];
  total: number;
}> {
  const mutualWhere = {
    followingId: profileUserId,
    status: FollowStatus.ACCEPTED,
    followerId: {
      not: viewerId,
    },
    follower: {
      onboardingCompleted: true,
      deletedAt: null,
      suspendedAt: null,
      followers: {
        some: {
          followerId: viewerId,
          status: FollowStatus.ACCEPTED,
        },
      },
    },
  } as const;

  const [rows, total] = await Promise.all([
    prisma.follow.findMany({
      where: mutualWhere,
      orderBy: {
        requestedAt: "desc",
      },
      take: 3,
      select: {
        follower: {
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

    prisma.follow.count({
      where: mutualWhere,
    }),
  ]);

  const users = rows
    .filter((row) => Boolean(row.follower.username))
    .map((row) => ({
      id: row.follower.id,
      username: row.follower.username as string,
      name: row.follower.name,
      avatarUrl: getUserAvatarUrl(
        row.follower.avatarPath,
        row.follower.image,
      ),
    }));

  return {
    users,
    total,
  };
}

function DiarySection({
  entries,
  publicEntryCount,
}: {
  entries: ProfileDiaryEntry[];
  publicEntryCount: number;
}) {
  return (
    <section className="mt-16">
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
                publicEntryCount === 1
                  ? "entry"
                  : "entries"
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
            const posterUrl = getTmdbPosterUrl(
              entry.posterPath,
            );

            return (
              <article
                key={entry.id}
                className="rounded-xl border border-[#27231F] bg-[#1A1714] p-5"
              >
                <div className="flex gap-4 sm:hidden">
                  <DiaryPoster
                    posterUrl={posterUrl}
                    title={entry.title}
                    className="h-[96px] w-[64px] shrink-0"
                  />

                  <div className="min-w-0 flex-1">
                    <h3 className="truncate text-base font-semibold text-[#F4F1EB]">
                      {entry.title}
                    </h3>

                    <div className="mt-2 flex flex-wrap items-center gap-2">
                      <span className="rounded-full bg-[#211E1B] px-2.5 py-1 text-[8px] uppercase tracking-wide text-[#8A8580]">
                        {entry.mediaType === "movie"
                          ? "Film"
                          : "Series"}
                      </span>

                      <RatingBadge
                        rating={entry.rating}
                      />
                    </div>

                    <p className="mt-2 text-[11px] text-[#8A8580]">
                      Watched{" "}
                      {new Intl.DateTimeFormat(
                        "en",
                        {
                          day: "2-digit",
                          month: "long",
                          year: "numeric",
                          timeZone: "UTC",
                        },
                      ).format(entry.watchedAt)}
                    </p>
                  </div>
                </div>

                {entry.review && entry.reviewIsPublic ? (
                  <div className="mt-4 border-t border-[#302C28] pt-4 sm:hidden">
                    <div className="mb-2 flex flex-wrap items-center justify-between gap-2">
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
                    />
                  </div>
                ) : null}

                <div className="hidden gap-5 sm:grid sm:grid-cols-[120px_1fr]">
                  <DiaryPoster
                    posterUrl={posterUrl}
                    title={entry.title}
                    className="aspect-[2/3] w-[120px]"
                  />

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

                      <RatingBadge
                        rating={entry.rating}
                      />
                    </div>

                    <p className="mt-3 text-xs text-[#8A8580]">
                      Watched{" "}
                      {new Intl.DateTimeFormat(
                        "en",
                        {
                          day: "2-digit",
                          month: "long",
                          year: "numeric",
                          timeZone: "UTC",
                        },
                      ).format(entry.watchedAt)}
                    </p>

                    {entry.review &&
                    entry.reviewIsPublic ? (
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
  );
}

function DiaryPoster({
  posterUrl,
  title,
  className = "",
}: {
  posterUrl: string | null;
  title: string;
  className?: string;
}) {
  return (
    <div
      className={[
        "rounded-lg bg-gradient-to-br from-[#3A2419] to-[#171411] bg-cover bg-center shadow-lg shadow-black/20",
        className,
      ].join(" ")}
      style={
        posterUrl
          ? {
              backgroundImage: `url("${posterUrl}")`,
            }
          : undefined
      }
    >
      {!posterUrl ? (
        <div className="flex h-full items-center justify-center p-2 text-center">
          <span className="text-xs font-medium text-[#8A8580]">
            {title}
          </span>
        </div>
      ) : null}
    </div>
  );
}

function RatingBadge({
  rating,
}: {
  rating: number | null;
}) {
  if (rating === null) {
    return (
      <span className="rounded-full bg-[#211E1B] px-2.5 py-1 text-[9px] uppercase tracking-wide text-[#625D58]">
        Not rated
      </span>
    );
  }

  return (
    <span className="inline-flex items-center gap-1 rounded-full bg-[#251712] px-2.5 py-1 text-xs font-semibold text-[#E45A1C]">
      <StarIcon className="h-3 w-3" />
      {rating.toFixed(1)}
    </span>
  );
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
      <path d="m12 2.8 2.75 5.57 6.15.9-4.45 4.33 1.05 6.13L12 16.84l-5.5 2.89 1.05-6.13L3.1 9.27l6.15-.9L12 2.8Z" />
    </svg>
  );
}

function PrivateProfileLock({
  relationship,
  username,
  isAuthenticated,
}: {
  relationship: FollowRelationship;
  username: string;
  isAuthenticated: boolean;
}) {
  let description =
    "Follow this account to see their public diary, reviews, and film activity.";

  if (!isAuthenticated) {
    description = `Sign in and follow @${username} to see their public activity.`;
  }

  if (relationship === "PENDING") {
    description =
      "Your follow request is waiting for approval.";
  }

  if (relationship === "REJECTED") {
    description =
      "Your previous request was not accepted. You can send another request.";
  }

  return (
    <section className="mt-16">
      <div className="rounded-2xl border border-[#27231F] bg-[#171411] px-6 py-16 text-center">
        <span className="mx-auto flex h-14 w-14 items-center justify-center rounded-full border border-[#302C28] bg-[#211E1B] text-[#A7A19A]">
          <LockIcon className="h-6 w-6" />
        </span>

        <h2 className="mt-5 text-xl font-semibold text-[#F4F1EB]">
          This account is private
        </h2>

        <p className="mx-auto mt-3 max-w-md text-sm leading-7 text-[#8A8580]">
          {description}
        </p>
      </div>
    </section>
  );
}

function MutualFollowersLine({
  users,
  total,
}: {
  users: MutualFollower[];
  total: number;
}) {
  const firstUser = users[0];

  if (!firstUser) {
    return null;
  }

  const remainingCount = Math.max(total - 1, 0);

  return (
    <div className="mt-5 flex items-center gap-3">
      <div className="flex shrink-0 -space-x-2">
        {users.map((user) => (
          <span
            key={user.id}
            className="relative flex h-7 w-7 items-center justify-center overflow-hidden rounded-full border-2 border-[#100E0C] bg-[#9B7567] bg-cover bg-center text-[9px] font-bold text-white"
            style={
              user.avatarUrl
                ? {
                    backgroundImage: `url("${user.avatarUrl}")`,
                  }
                : undefined
            }
          >
            {!user.avatarUrl
              ? (user.name ?? user.username)
                  .charAt(0)
                  .toUpperCase()
              : null}
          </span>
        ))}
      </div>

      <p className="min-w-0 text-xs text-[#8A8580]">
        Followed by{" "}
        <Link
          href={`/u/${firstUser.username}`}
          className="font-semibold text-[#C9C4BC] transition hover:text-[#E45A1C]"
        >
          {firstUser.name?.trim() ||
            `@${firstUser.username}`}
        </Link>

        {remainingCount > 0
          ? ` and ${remainingCount} ${
              remainingCount === 1
                ? "other"
                : "others"
            }`
          : ""}
      </p>
    </div>
  );
}

function resolveRelationship(
  status: FollowStatus | undefined,
  isOwner: boolean,
): FollowRelationship {
  if (isOwner) {
    return "SELF";
  }

  switch (status) {
    case FollowStatus.PENDING:
      return "PENDING";
    case FollowStatus.ACCEPTED:
      return "ACCEPTED";
    case FollowStatus.REJECTED:
      return "REJECTED";
    default:
      return "NONE";
  }
}

function normalizeUsername(value: string) {
  return decodeURIComponent(value)
    .trim()
    .toLowerCase();
}

function getSocialConnection(
  value: string | null,
): SocialConnection | null {
  if (!value) {
    return null;
  }

  try {
    const url = new URL(value);

    if (
      url.protocol !== "http:" &&
      url.protocol !== "https:"
    ) {
      return null;
    }

    const hostname = url.hostname
      .replace(/^www\./, "")
      .toLowerCase();

    const pathParts = url.pathname
      .split("/")
      .filter(Boolean);

    if (hostname === "github.com") {
      return {
        url: url.toString(),
        platform: "github",
        label: pathParts[0] || "GitHub",
      };
    }

    if (hostname === "instagram.com") {
      return {
        url: url.toString(),
        platform: "instagram",
        label: pathParts[0] || "Instagram",
      };
    }

    if (
      hostname === "x.com" ||
      hostname === "twitter.com"
    ) {
      return {
        url: url.toString(),
        platform: "twitter",
        label: pathParts[0] || "X",
      };
    }

    if (hostname === "tiktok.com") {
      return {
        url: url.toString(),
        platform: "tiktok",
        label:
          pathParts[0]?.replace(/^@/, "") ||
          "TikTok",
      };
    }

    if (hostname === "open.spotify.com") {
      return {
        url: url.toString(),
        platform: "spotify",
        label: "Spotify",
      };
    }

    return {
      url: url.toString(),
      platform: "website",
      label: hostname,
    };
  } catch {
    return null;
  }
}

function ConnectionIcon({
  platform,
  className = "",
}: {
  platform: ConnectionPlatform;
  className?: string;
}) {
  if (platform === "github") {
    return (
      <svg
        viewBox="0 0 24 24"
        fill="currentColor"
        aria-hidden="true"
        className={className}
      >
        <path d="M12 2C6.48 2 2 6.58 2 12.24c0 4.52 2.87 8.36 6.84 9.72.5.1.68-.22.68-.49 0-.24-.01-1.04-.01-1.89-2.78.62-3.37-1.21-3.37-1.21-.45-1.18-1.11-1.49-1.11-1.49-.91-.64.07-.62.07-.62 1 .07 1.53 1.05 1.53 1.05.9 1.56 2.35 1.11 2.92.85.09-.66.35-1.11.64-1.37-2.22-.26-4.56-1.14-4.56-5.06 0-1.12.39-2.03 1.03-2.75-.1-.26-.45-1.3.1-2.71 0 0 .84-.28 2.75 1.05A9.4 9.4 0 0 1 12 7.02a9.4 9.4 0 0 1 2.5.35c1.91-1.33 2.75-1.05 2.75-1.05.55 1.41.2 2.45.1 2.71.64.72 1.03 1.63 1.03 2.75 0 3.93-2.35 4.8-4.58 5.06.36.32.68.94.68 1.9 0 1.37-.01 2.47-.01 2.81 0 .27.18.59.69.49A10.26 10.26 0 0 0 22 12.24C22 6.58 17.52 2 12 2Z" />
      </svg>
    );
  }

  if (platform === "instagram") {
    return (
      <svg
        viewBox="0 0 24 24"
        fill="none"
        aria-hidden="true"
        className={className}
      >
        <rect
          x="3"
          y="3"
          width="18"
          height="18"
          rx="5"
          stroke="currentColor"
          strokeWidth="2"
        />

        <circle
          cx="12"
          cy="12"
          r="4"
          stroke="currentColor"
          strokeWidth="2"
        />

        <circle
          cx="17.5"
          cy="6.5"
          r="1"
          fill="currentColor"
        />
      </svg>
    );
  }

  if (platform === "twitter") {
    return (
      <svg
        viewBox="0 0 24 24"
        fill="currentColor"
        aria-hidden="true"
        className={className}
      >
        <path d="M4 3h4.7l4.15 5.91L18.2 3H20l-6.34 7.16L21 21h-4.7l-4.63-6.59L5.8 21H4l6.86-7.85L4 3Zm3.75 1.5H6.88l10.17 15h.87L7.75 4.5Z" />
      </svg>
    );
  }

  if (platform === "tiktok") {
    return (
      <svg
        viewBox="0 0 24 24"
        fill="currentColor"
        aria-hidden="true"
        className={className}
      >
        <path d="M14.5 3c.35 2.25 1.63 3.59 3.75 4.1v3.05a8.1 8.1 0 0 1-3.75-1.03v6.2A5.68 5.68 0 1 1 9.6 9.7v3.1a2.65 2.65 0 1 0 1.85 2.52V3h3.05Z" />
      </svg>
    );
  }

  if (platform === "spotify") {
    return (
      <svg
        viewBox="0 0 24 24"
        fill="currentColor"
        aria-hidden="true"
        className={className}
      >
        <path d="M12 2a10 10 0 1 0 0 20 10 10 0 0 0 0-20Zm4.58 14.42a.62.62 0 0 1-.85.2c-2.33-1.44-5.27-1.76-8.73-.97a.62.62 0 1 1-.28-1.21c3.79-.87 7.06-.49 9.66 1.11.29.18.38.57.2.87Zm1.22-2.72a.78.78 0 0 1-1.07.26c-2.67-1.65-6.75-2.13-9.91-1.17a.78.78 0 1 1-.45-1.49c3.62-1.1 8.12-.57 11.17 1.31.36.22.48.71.26 1.09Zm.1-2.84C14.7 8.95 9.42 8.77 6.36 9.7a.93.93 0 1 1-.54-1.78c3.52-1.07 9.36-.86 13.04 1.33a.93.93 0 0 1-.96 1.61Z" />
      </svg>
    );
  }

  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      aria-hidden="true"
      className={className}
    >
      <circle
        cx="12"
        cy="12"
        r="9"
        stroke="currentColor"
        strokeWidth="1.8"
      />

      <path
        d="M3.5 12h17M12 3c2.3 2.45 3.5 5.45 3.5 9S14.3 18.55 12 21M12 3C9.7 5.45 8.5 8.45 8.5 12S9.7 18.55 12 21"
        stroke="currentColor"
        strokeWidth="1.5"
      />
    </svg>
  );
}

function ExternalLinkIcon({
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
        d="M13 5h6v6M19 5l-9 9"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
      />

      <path
        d="M17 13v4a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V9a2 2 0 0 1 2-2h4"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
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
        strokeWidth="1.7"
      />

      <path
        d="M8 10V7.5a4 4 0 0 1 8 0V10"
        stroke="currentColor"
        strokeWidth="1.7"
        strokeLinecap="round"
      />

      <circle
        cx="12"
        cy="15"
        r="1"
        fill="currentColor"
      />
    </svg>
  );
}