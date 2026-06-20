import Link from "next/link";
import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";

import { WatchlistButton } from "@/components/watchlist/WatchlistButton";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { getTmdbPosterUrl } from "@/lib/tmdb";

export default async function WatchlistPage() {
  const session = await getServerSession(authOptions);

  if (!session?.user?.id) {
    redirect("/login");
  }

  const items = await prisma.watchlistItem.findMany({
    where: {
      userId: session.user.id,
      deletedAt: null,
    },
    orderBy: {
      addedAt: "desc",
    },
    select: {
      id: true,
      tmdbId: true,
      mediaType: true,
      title: true,
      posterPath: true,
      addedAt: true,
    },
  });

  return (
    <div>
      <section className="flex flex-col gap-5 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-[#F4F1EB]">
            Your watchlist
          </h1>

          <p className="mt-2 text-sm text-[#8A8580]">
            Titles you want to watch later.
          </p>

          {items.length > 0 ? (
            <p className="mt-3 text-xs text-[#625D58]">
              {items.length}{" "}
              {items.length === 1 ? "title" : "titles"} saved
            </p>
          ) : null}
        </div>

        <Link
          href="/search"
          className="inline-flex w-max rounded-full bg-[#C84B18] px-5 py-3 text-sm font-semibold text-white transition hover:bg-[#DC5520]"
        >
          Find a title
        </Link>
      </section>

      {items.length === 0 ? (
        <div className="mt-10 rounded-xl border border-dashed border-[#302C28] bg-[#171411] px-6 py-16 text-center">
          <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-[#211E1B] text-[#8A8580]">
            <BookmarkIcon className="h-5 w-5" />
          </div>

          <h2 className="mt-5 text-xl font-semibold text-[#F4F1EB]">
            Your watchlist is empty
          </h2>

          <p className="mx-auto mt-2 max-w-md text-sm leading-6 text-[#8A8580]">
            Save films and series that you want to watch later.
          </p>

          <Link
            href="/search"
            className="mt-6 inline-flex rounded-full bg-[#F4F1EB] px-5 py-2.5 text-sm font-semibold text-[#171411]"
          >
            Search titles
          </Link>
        </div>
      ) : (
        <div className="mt-8 grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4 xl:grid-cols-5 2xl:grid-cols-6">
          {items.map((item) => {
            const posterUrl = getTmdbPosterUrl(
              item.posterPath,
            );

            return (
              <article
                key={item.id}
                className="min-w-0 rounded-xl border border-[#27231F] bg-[#211E1B] p-3"
              >
                <Link
                  href={`/log/${item.mediaType}/${item.tmdbId}`}
                  aria-label={`Log ${item.title}`}
                  className="block"
                >
                  <div
                    className="relative aspect-[2/3] overflow-hidden rounded-lg bg-gradient-to-br from-[#3A2419] to-[#171411] bg-cover bg-center shadow-lg shadow-black/20 transition hover:opacity-85"
                    style={
                      posterUrl
                        ? {
                            backgroundImage: `url("${posterUrl}")`,
                          }
                        : undefined
                    }
                  >
                    {!posterUrl ? (
                      <div className="flex h-full items-center justify-center p-4 text-center">
                        <span className="text-sm font-semibold text-[#8A8580]">
                          {item.title}
                        </span>
                      </div>
                    ) : null}

                    <span className="absolute left-2 top-2 rounded-full bg-black/75 px-2 py-1 text-[9px] uppercase text-white">
                      {item.mediaType === "movie"
                        ? "Film"
                        : "Series"}
                    </span>
                  </div>
                </Link>

                <h2
                  title={item.title}
                  className="mt-3 truncate text-sm font-semibold text-[#F4F1EB]"
                >
                  {item.title}
                </h2>

                <p className="mt-1 text-[11px] text-[#625D58]">
                  Added{" "}
                  {new Intl.DateTimeFormat("en", {
                    day: "2-digit",
                    month: "short",
                    year: "numeric",
                  }).format(item.addedAt)}
                </p>

                <Link
                  href={`/log/${item.mediaType}/${item.tmdbId}`}
                  className="mt-3 block w-full rounded-full bg-[#C84B18] px-3 py-2 text-center text-xs font-medium text-white transition hover:bg-[#DC5520]"
                >
                  Log this title
                </Link>

                <div className="mt-2">
                  <WatchlistButton
                    tmdbId={item.tmdbId}
                    mediaType={item.mediaType}
                    title={item.title}
                    initialSaved
                    variant="remove"
                    fullWidth
                  />
                </div>
              </article>
            );
          })}
        </div>
      )}
    </div>
  );
}

function BookmarkIcon({
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
        d="M7 4.5A1.5 1.5 0 0 1 8.5 3h7A1.5 1.5 0 0 1 17 4.5V21l-5-3-5 3V4.5Z"
        stroke="currentColor"
        strokeWidth="1.7"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}