import Link from "next/link";
import { getServerSession } from "next-auth";
import { notFound } from "next/navigation";

import { FeaturedFilmButton } from "@/components/profile/FeaturedFilmButton";
import { WatchlistButton } from "@/components/watchlist/WatchlistButton";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import {
  getTmdbPosterUrl,
  getTmdbTitleDetails,
  type TmdbMediaType,
} from "@/lib/tmdb";

export const dynamic = "force-dynamic";

type TitleDetailPageProps = {
  params: {
    mediaType: string;
    tmdbId: string;
  };
};

type TitleDetail = {
  id: number;
  mediaType: TmdbMediaType;
  title: string;
  posterPath: string | null;
  overview: string | null;
  releaseDate: string | null;
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

  const mediaType =
    params.mediaType as TmdbMediaType;

  const tmdbId = Number(params.tmdbId);

  if (
    !Number.isInteger(tmdbId) ||
    tmdbId < 1
  ) {
    notFound();
  }

  const session = await getServerSession(
    authOptions,
  );

  let media: TitleDetail | null = null;

  try {
    const tmdbMedia =
      await getTmdbTitleDetails(
        mediaType,
        tmdbId,
      );

    media = {
      id: tmdbMedia.id,
      mediaType: tmdbMedia.mediaType,
      title: tmdbMedia.title,
      posterPath: tmdbMedia.posterPath,
      overview: tmdbMedia.overview ?? null,
      releaseDate:
        tmdbMedia.releaseDate ?? null,
    };
  } catch (error) {
    console.error(
      "Unable to load title from TMDB:",
      error,
    );

    const savedTitle =
      await prisma.featuredFilm.findFirst({
        where: {
          tmdbId,
          mediaType,
        },
        select: {
          tmdbId: true,
          mediaType: true,
          title: true,
          posterPath: true,
        },
      });

    if (savedTitle) {
      media = {
        id: savedTitle.tmdbId,
        mediaType: savedTitle.mediaType,
        title: savedTitle.title,
        posterPath:
          savedTitle.posterPath,
        overview: null,
        releaseDate: null,
      };
    }
  }

  if (!media) {
    notFound();
  }

  const watchlistItem =
    session?.user?.id
      ? await prisma.watchlistItem.findFirst({
          where: {
            userId: session.user.id,
            tmdbId: media.id,
            mediaType: media.mediaType,
            deletedAt: null,
          },
          select: {
            id: true,
          },
        })
      : null;

  const posterUrl = getTmdbPosterUrl(
    media.posterPath,
  );

  return (
    <main className="min-h-screen bg-[#100E0C] text-[#F4F1EB]">
      <header className="border-b border-[#27231F]">
        <div className="mx-auto flex h-20 max-w-7xl items-center justify-between px-5 md:px-8">
          <Link
            href={
              session?.user?.id
                ? "/home"
                : "/"
            }
            className="text-xl font-bold tracking-tight"
          >
            Reelog
          </Link>

          <Link
            href={
              session?.user?.id
                ? "/home"
                : "/login"
            }
            className="rounded-full border border-[#302C28] px-4 py-2 text-sm font-medium text-[#C9C4BC] transition hover:border-[#C84B18]/60 hover:text-[#F4F1EB]"
          >
            {session?.user?.id
              ? "Back to app"
              : "Sign in"}
          </Link>
        </div>
      </header>

      <div className="mx-auto grid w-full max-w-6xl gap-8 px-5 py-10 md:px-8 lg:grid-cols-[280px_minmax(0,1fr)] lg:gap-12 lg:py-16">
        <aside className="mx-auto w-full max-w-[280px] lg:mx-0">
          <div
            className="aspect-[2/3] overflow-hidden rounded-2xl border border-[#302C28] bg-gradient-to-br from-[#3A2419] to-[#171411] bg-cover bg-center shadow-2xl shadow-black/40"
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

        <section className="min-w-0 self-center">
          <p className="text-xs font-semibold uppercase tracking-[0.16em] text-[#E45A1C]">
            {media.mediaType === "movie"
              ? "Film"
              : "Series"}
          </p>

          <h1 className="mt-3 break-words text-4xl font-bold tracking-tight md:text-5xl">
            {media.title}
          </h1>

          {media.releaseDate ? (
            <p className="mt-3 text-sm text-[#716B65]">
              {media.releaseDate.slice(0, 4)}
            </p>
          ) : null}

          <p className="mt-7 max-w-3xl text-sm leading-7 text-[#A7A19A]">
            {media.overview ||
              "Detailed information for this title is currently unavailable."}
          </p>

          <div className="mt-9 flex flex-col gap-3 sm:flex-row sm:flex-wrap">
            {session?.user?.id ? (
              <>
                <Link
                  href={`/log/${media.mediaType}/${media.id}`}
                  className="inline-flex items-center justify-center rounded-full bg-[#C84B18] px-6 py-3 text-sm font-semibold text-white transition hover:bg-[#DC5520]"
                >
                  Log this title
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
                  initialSaved={Boolean(
                    watchlistItem,
                  )}
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
        </section>
      </div>
    </main>
  );
}