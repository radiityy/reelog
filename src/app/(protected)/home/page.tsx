import Link from "next/link";
import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";

import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

function getPosterUrl(posterPath: string | null) {
  if (!posterPath) {
    return null;
  }

  return `https://image.tmdb.org/t/p/w342${posterPath}`;
}

export default async function HomePage() {
  const session = await getServerSession(authOptions);

  if (!session?.user?.id) {
    redirect("/login");
  }

  const [
    user,
    diaryCount,
    watchlistCount,
    featuredCount,
    recentEntries,
    watchlistItems,
  ] = await Promise.all([
    prisma.user.findUnique({
      where: {
        id: session.user.id,
      },
      select: {
        username: true,
      },
    }),

    prisma.diaryEntry.count({
      where: {
        userId: session.user.id,
        deletedAt: null,
      },
    }),

    prisma.watchlistItem.count({
      where: {
        userId: session.user.id,
        deletedAt: null,
      },
    }),

    prisma.featuredFilm.count({
      where: {
        userId: session.user.id,
      },
    }),

    prisma.diaryEntry.findMany({
      where: {
        userId: session.user.id,
        deletedAt: null,
      },
      orderBy: {
        watchedAt: "desc",
      },
      take: 5,
      select: {
        id: true,
        title: true,
        posterPath: true,
        mediaType: true,
        rating: true,
        isPublic: true,
      },
    }),

    prisma.watchlistItem.findMany({
      where: {
        userId: session.user.id,
        deletedAt: null,
      },
      orderBy: {
        addedAt: "desc",
      },
      take: 5,
      select: {
        id: true,
        title: true,
        posterPath: true,
        mediaType: true,
      },
    }),
  ]);

  if (!user?.username) {
    redirect("/onboarding");
  }

  return (
    <div>
      <section className="flex flex-col gap-6 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-sm text-[#8A8580]">@{user.username}</p>

          <h1 className="mt-1 text-3xl font-bold tracking-tight text-[#F4F1EB] md:text-4xl">
            Welcome back, {user.username}
          </h1>

          <p className="mt-3 max-w-xl text-sm leading-6 text-[#8A8580]">
            Search for something you watched, save what comes next, or continue
            building your diary.
          </p>
        </div>

        <Link
          href="/search"
          className="inline-flex w-max items-center gap-2 rounded-full bg-[#C84B18] px-5 py-3 text-sm font-semibold text-white transition hover:bg-[#DC5520]"
        >
          Find something
          <span aria-hidden="true">→</span>
        </Link>
      </section>

      <section className="mt-8 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <DashboardCard
          label="Diary entries"
          value={diaryCount}
          description="Everything you have logged."
        />

        <DashboardCard
          label="Watchlist"
          value={watchlistCount}
          description="Saved for another night."
        />

        <DashboardCard
          label="Top films"
          value={`${featuredCount}/5`}
          description="Your curated favorites."
        />

        <Link
          href="/search"
          className="group flex min-h-32 flex-col justify-between rounded-lg bg-[#211E1B] p-5 transition hover:bg-[#2A2622]"
        >
          <div>
            <p className="text-sm font-semibold text-[#F4F1EB]">
              Search TMDB
            </p>

            <p className="mt-2 text-xs leading-5 text-[#8A8580]">
              Find films and series to add to Reelog.
            </p>
          </div>

          <span className="self-end text-2xl text-[#C84B18] transition group-hover:translate-x-1">
            →
          </span>
        </Link>
      </section>

      <section className="mt-12">
        <SectionHeader
          title="Recently logged"
          subtitle="Your latest diary entries"
        />

        {recentEntries.length === 0 ? (
          <EmptySection
            title="Your diary is still empty"
            description="Search for a film or series and write your first entry."
            actionLabel="Search films and series"
            actionHref="/search"
          />
        ) : (
          <div className="mt-5 grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4 xl:grid-cols-5">
            {recentEntries.map((entry) => (
              <MediaCard
                key={entry.id}
                title={entry.title}
                posterPath={entry.posterPath}
                mediaType={entry.mediaType}
                footer={entry.rating ? `${entry.rating} / 5` : "Not rated"}
                badge={entry.isPublic ? "Public" : "Private"}
              />
            ))}
          </div>
        )}
      </section>

      <section className="mt-12">
        <SectionHeader
          title="Your watchlist"
          subtitle="Saved for your next movie night"
        />

        {watchlistItems.length === 0 ? (
          <EmptySection
            title="Nothing saved yet"
            description="Keep films and series here so you do not forget what to watch next."
            actionLabel="Explore titles"
            actionHref="/search"
          />
        ) : (
          <div className="mt-5 grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4 xl:grid-cols-5">
            {watchlistItems.map((item) => (
              <MediaCard
                key={item.id}
                title={item.title}
                posterPath={item.posterPath}
                mediaType={item.mediaType}
                footer="In watchlist"
              />
            ))}
          </div>
        )}
      </section>
    </div>
  );
}

type DashboardCardProps = {
  label: string;
  value: number | string;
  description: string;
};

function DashboardCard({
  label,
  value,
  description,
}: DashboardCardProps) {
  return (
    <article className="flex min-h-32 flex-col justify-between rounded-lg bg-[#211E1B] p-5">
      <div>
        <p className="text-sm font-semibold text-[#F4F1EB]">{label}</p>

        <p className="mt-2 text-xs leading-5 text-[#8A8580]">{description}</p>
      </div>

      <p className="mt-4 text-3xl font-bold text-[#C84B18]">{value}</p>
    </article>
  );
}

type SectionHeaderProps = {
  title: string;
  subtitle: string;
};

function SectionHeader({ title, subtitle }: SectionHeaderProps) {
  return (
    <div className="flex items-end justify-between">
      <div>
        <h2 className="text-2xl font-bold tracking-tight text-[#F4F1EB]">
          {title}
        </h2>

        <p className="mt-1 text-sm text-[#8A8580]">{subtitle}</p>
      </div>
    </div>
  );
}

type EmptySectionProps = {
  title: string;
  description: string;
  actionLabel: string;
  actionHref: string;
};

function EmptySection({
  title,
  description,
  actionLabel,
  actionHref,
}: EmptySectionProps) {
  return (
    <div className="mt-5 rounded-lg border border-dashed border-[#302C28] bg-[#171411] px-6 py-12 text-center">
      <h3 className="text-lg font-semibold text-[#F4F1EB]">{title}</h3>

      <p className="mx-auto mt-2 max-w-md text-sm leading-6 text-[#8A8580]">
        {description}
      </p>

      <Link
        href={actionHref}
        className="mt-6 inline-flex rounded-full bg-[#F4F1EB] px-5 py-2.5 text-sm font-semibold text-[#171411] transition hover:bg-white"
      >
        {actionLabel}
      </Link>
    </div>
  );
}

type MediaCardProps = {
  title: string;
  posterPath: string | null;
  mediaType: "movie" | "tv";
  footer: string;
  badge?: string;
};

function MediaCard({
  title,
  posterPath,
  mediaType,
  footer,
  badge,
}: MediaCardProps) {
  const posterUrl = getPosterUrl(posterPath);

  return (
    <article className="group min-w-0 rounded-lg bg-[#211E1B] p-3 transition hover:bg-[#2A2622]">
      <div
        className="relative aspect-[2/3] overflow-hidden rounded-md bg-gradient-to-br from-[#3A2419] to-[#171411] bg-cover bg-center shadow-lg shadow-black/20"
        style={
          posterUrl
            ? {
                backgroundImage: `url("${posterUrl}")`,
              }
            : undefined
        }
      >
        {!posterUrl ? (
          <div className="flex h-full items-center justify-center px-4 text-center">
            <span className="text-sm font-semibold text-[#8A8580]">
              {title}
            </span>
          </div>
        ) : null}

        {badge ? (
          <span className="absolute right-2 top-2 rounded-full bg-black/75 px-2 py-1 text-[9px] font-medium text-white backdrop-blur">
            {badge}
          </span>
        ) : null}
      </div>

      <h3 className="mt-3 truncate text-sm font-semibold text-[#F4F1EB]">
        {title}
      </h3>

      <div className="mt-1 flex items-center justify-between gap-2">
        <span className="truncate text-xs text-[#8A8580]">{footer}</span>

        <span className="shrink-0 text-[10px] uppercase text-[#625D58]">
          {mediaType === "movie" ? "Film" : "Series"}
        </span>
      </div>
    </article>
  );
}