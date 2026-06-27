import { getServerSession } from "next-auth";
import Link from "next/link";
import { redirect } from "next/navigation";

import { WatchlistButton } from "@/components/watchlist/WatchlistButton";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import {
  getTmdbPosterUrl,
  searchTmdb,
  type TmdbSearchResult,
} from "@/lib/tmdb";

export const dynamic = "force-dynamic";

type SearchPageProps = {
  searchParams?: {
    q?: string | string[];
    page?: string | string[];
  };
};

export default async function SearchPage({
  searchParams,
}: SearchPageProps) {
  const session = await getServerSession(authOptions);

  if (!session?.user?.id) {
    redirect("/login");
  }

  const query = getParam(searchParams?.q).trim();
  const currentPage = getPageNumber(searchParams?.page);

  let result: Awaited<ReturnType<typeof searchTmdb>> | null =
    null;

  let errorMessage = "";

  if (query) {
    try {
      result = await searchTmdb(query, currentPage);
    } catch (error) {
      console.error("Search page error:", error);

      errorMessage =
        "Search results could not be loaded. Check the TMDB token and try again.";
    }
  }

  const savedKeys = new Set<string>();

  if (result && result.results.length > 0) {
    const savedItems = await prisma.watchlistItem.findMany({
      where: {
        userId: session.user.id,
        deletedAt: null,
        OR: result.results.map((item) => ({
          tmdbId: item.id,
          mediaType: item.mediaType,
        })),
      },
      select: {
        tmdbId: true,
        mediaType: true,
      },
    });

    for (const item of savedItems) {
      savedKeys.add(
        getMediaKey(item.mediaType, item.tmdbId),
      );
    }
  }

  return (
    <div>
      <section>
        <h1 className="text-3xl font-bold tracking-tight text-[#F4F1EB]">
          Search
        </h1>

        <p className="mt-2 text-sm text-[#8A8580]">
          Find films and series, view their details, then add them to
          your diary, watchlist, or Top 5.
        </p>
      </section>

      {!query ? (
        <div className="mt-10 rounded-xl border border-dashed border-[#302C28] bg-[#171411] px-6 py-16 text-center">
          <span className="mx-auto flex h-12 w-12 items-center justify-center rounded-full border border-[#302C28] bg-[#211E1B] text-[#8A8580]">
            <SearchIcon className="h-5 w-5" />
          </span>

          <h2 className="mt-4 text-lg font-semibold text-[#F4F1EB]">
            Search from the bar above
          </h2>

          <p className="mt-2 text-sm text-[#8A8580]">
            Enter the title of a film or series.
          </p>
        </div>
      ) : null}

      {errorMessage ? (
        <div className="mt-10 rounded-xl border border-red-900/50 bg-red-950/20 px-6 py-8">
          <h2 className="font-semibold text-red-300">
            Search unavailable
          </h2>

          <p className="mt-2 text-sm leading-6 text-red-300/75">
            {errorMessage}
          </p>
        </div>
      ) : null}

      {query && result && !errorMessage ? (
        <section className="mt-10">
          <div className="flex flex-wrap items-end justify-between gap-4">
            <div>
              <p className="text-sm text-[#8A8580]">
                Search results for
              </p>

              <h2 className="mt-1 break-words text-2xl font-bold text-[#F4F1EB]">
                “{query}”
              </h2>
            </div>

            <p className="text-xs text-[#625D58]">
              {result.results.length}{" "}
              {result.results.length === 1 ? "title" : "titles"} on
              this page
            </p>
          </div>

          {result.results.length === 0 ? (
            <div className="mt-6 rounded-xl border border-dashed border-[#302C28] bg-[#171411] px-6 py-14 text-center">
              <h3 className="text-lg font-semibold text-[#F4F1EB]">
                No results found
              </h3>

              <p className="mt-2 text-sm text-[#8A8580]">
                Try searching with another title.
              </p>
            </div>
          ) : (
            <div className="mt-6 grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4 xl:grid-cols-5 2xl:grid-cols-6">
              {result.results.map((item) => (
                <SearchResultCard
                  key={`${item.mediaType}-${item.id}`}
                  item={item}
                  isSaved={savedKeys.has(
                    getMediaKey(item.mediaType, item.id),
                  )}
                />
              ))}
            </div>
          )}

          {result.totalPages > 1 ? (
            <Pagination
              query={query}
              currentPage={result.page}
              totalPages={result.totalPages}
            />
          ) : null}
        </section>
      ) : null}

      <p className="mt-12 text-center text-[11px] text-[#625D58]">
        This product uses the TMDB API but is not endorsed or
        certified by TMDB.
      </p>
    </div>
  );
}

function SearchResultCard({
  item,
  isSaved,
}: {
  item: TmdbSearchResult;
  isSaved: boolean;
}) {
  const detailsHref = `/title/${item.mediaType}/${item.id}`;
  const posterUrl = getTmdbPosterUrl(item.posterPath);

  const releaseYear = item.releaseDate
    ? item.releaseDate.slice(0, 4)
    : "Unknown";

  return (
    <article className="group min-w-0 overflow-hidden rounded-xl border border-transparent bg-[#211E1B] p-3 transition duration-200 hover:-translate-y-1 hover:border-[#38332E] hover:bg-[#2A2622] hover:shadow-xl hover:shadow-black/30">
      <Link
        href={detailsHref}
        aria-label={`View details for ${item.title}`}
        className="block"
      >
        <div
          className="relative aspect-[2/3] overflow-hidden rounded-lg bg-gradient-to-br from-[#3A2419] to-[#171411] bg-cover bg-center shadow-lg shadow-black/20"
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
                {item.title}
              </span>
            </div>
          ) : null}

          <span className="absolute left-2 top-2 rounded-full bg-black/75 px-2 py-1 text-[9px] font-medium text-white backdrop-blur-sm">
            {item.mediaType === "movie" ? "Film" : "Series"}
          </span>

          {item.rating > 0 ? (
            <span className="absolute right-2 top-2 rounded-full bg-black/75 px-2 py-1 text-[9px] font-medium text-[#F4C95D] backdrop-blur-sm">
              ★ {item.rating.toFixed(1)}
            </span>
          ) : null}

          <div className="absolute inset-0 flex items-center justify-center bg-black/55 opacity-0 transition duration-200 group-hover:opacity-100">
            <span className="flex h-11 w-11 items-center justify-center rounded-full border border-white/20 bg-black/35 text-white backdrop-blur-sm">
              <EyeIcon className="h-5 w-5" />
            </span>
          </div>

          <div className="absolute inset-x-0 bottom-0 translate-y-full bg-gradient-to-t from-black via-black/90 to-transparent px-3 pb-3 pt-16 transition duration-300 group-hover:translate-y-0">
            <p className="line-clamp-3 text-[11px] leading-5 text-white/75">
              {item.overview || "No overview available."}
            </p>
          </div>
        </div>
      </Link>

      <Link
        href={detailsHref}
        title={item.title}
        className="mt-3 block truncate text-sm font-semibold text-[#F4F1EB] transition hover:text-[#E45A1C]"
      >
        {item.title}
      </Link>

      <div className="mt-1 flex items-center justify-between gap-2">
        <span className="truncate text-xs text-[#8A8580]">
          {releaseYear}
        </span>

        <span className="shrink-0 text-[10px] uppercase text-[#625D58]">
          {item.mediaType === "movie" ? "Movie" : "TV"}
        </span>
      </div>

      <div className="mt-3 space-y-2">
        <Link
          href={detailsHref}
          className="flex w-full items-center justify-center gap-2 rounded-full border border-[#C84B18]/50 px-3 py-2 text-center text-xs font-semibold text-[#E45A1C] transition hover:border-[#C84B18] hover:bg-[#C84B18] hover:text-white"
        >
          View details
          <ArrowIcon className="h-3.5 w-3.5" />
        </Link>

        <WatchlistButton
          tmdbId={item.id}
          mediaType={item.mediaType}
          title={item.title}
          initialSaved={isSaved}
          fullWidth
        />
      </div>
    </article>
  );
}

function Pagination({
  query,
  currentPage,
  totalPages,
}: {
  query: string;
  currentPage: number;
  totalPages: number;
}) {
  const maximumPage = Math.min(totalPages, 500);

  return (
    <nav
      aria-label="Search result pages"
      className="mt-10 flex flex-wrap items-center justify-center gap-4"
    >
      {currentPage > 1 ? (
        <Link
          href={`/search?q=${encodeURIComponent(query)}&page=${
            currentPage - 1
          }`}
          className="rounded-full border border-[#302C28] px-5 py-2.5 text-sm text-[#C9C4BC] transition hover:border-[#C84B18]/60 hover:text-[#F4F1EB]"
        >
          ← Previous
        </Link>
      ) : null}

      <span className="text-xs text-[#8A8580]">
        Page {currentPage} of {maximumPage}
      </span>

      {currentPage < maximumPage ? (
        <Link
          href={`/search?q=${encodeURIComponent(query)}&page=${
            currentPage + 1
          }`}
          className="rounded-full border border-[#302C28] px-5 py-2.5 text-sm text-[#C9C4BC] transition hover:border-[#C84B18]/60 hover:text-[#F4F1EB]"
        >
          Next →
        </Link>
      ) : null}
    </nav>
  );
}

function getParam(value: string | string[] | undefined) {
  if (Array.isArray(value)) {
    return value[0] ?? "";
  }

  return value ?? "";
}

function getPageNumber(value: string | string[] | undefined) {
  const page = Number(getParam(value));

  if (!Number.isInteger(page) || page < 1) {
    return 1;
  }

  return page;
}

function getMediaKey(
  mediaType: "movie" | "tv",
  tmdbId: number,
) {
  return `${mediaType}:${tmdbId}`;
}

function SearchIcon({
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
        cx="11"
        cy="11"
        r="6.5"
        stroke="currentColor"
        strokeWidth="1.8"
      />

      <path
        d="m16 16 4 4"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
      />
    </svg>
  );
}

function EyeIcon({
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
        d="M2.8 12s3.3-5.5 9.2-5.5 9.2 5.5 9.2 5.5-3.3 5.5-9.2 5.5S2.8 12 2.8 12Z"
        stroke="currentColor"
        strokeWidth="1.7"
        strokeLinejoin="round"
      />

      <circle
        cx="12"
        cy="12"
        r="2.5"
        stroke="currentColor"
        strokeWidth="1.7"
      />
    </svg>
  );
}

function ArrowIcon({
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