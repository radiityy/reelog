import Link from "next/link";

import {
  getTmdbPosterUrl,
  searchTmdb,
  type TmdbSearchResult,
} from "@/lib/tmdb";

type SearchPageProps = {
  searchParams?: {
    q?: string | string[];
    page?: string | string[];
  };
};

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

export default async function SearchPage({
  searchParams,
}: SearchPageProps) {
  const query = getParam(searchParams?.q).trim();
  const currentPage = getPageNumber(searchParams?.page);

  let result = null;
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

  return (
    <div>
      <section>
        <h1 className="text-3xl font-bold tracking-tight text-[#F4F1EB]">
          Search
        </h1>

        <p className="mt-2 text-sm text-[#8A8580]">
          Find films and series to add to your diary or watchlist.
        </p>
      </section>

      {!query ? (
        <div className="mt-10 rounded-xl border border-dashed border-[#302C28] bg-[#171411] px-6 py-16 text-center">
          <h2 className="text-lg font-semibold text-[#F4F1EB]">
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
          <div className="flex items-end justify-between gap-4">
            <div>
              <p className="text-sm text-[#8A8580]">
                Search results for
              </p>

              <h2 className="mt-1 text-2xl font-bold text-[#F4F1EB]">
                “{query}”
              </h2>
            </div>

            <p className="text-xs text-[#625D58]">
              {result.totalResults.toLocaleString("en-US")} results
            </p>
          </div>

          {result.results.length === 0 ? (
            <div className="mt-6 rounded-xl border border-dashed border-[#302C28] bg-[#171411] px-6 py-14 text-center">
              <h3 className="text-lg font-semibold text-[#F4F1EB]">
                No results found
              </h3>

              <p className="mt-2 text-sm text-[#8A8580]">
                Try another title.
              </p>
            </div>
          ) : (
            <div className="mt-6 grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4 xl:grid-cols-5 2xl:grid-cols-6">
              {result.results.map((item) => (
                <SearchResultCard
                  key={`${item.mediaType}-${item.id}`}
                  item={item}
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
        This product uses the TMDB API but is not endorsed or certified by
        TMDB.
      </p>
    </div>
  );
}

function SearchResultCard({
  item,
}: {
  item: TmdbSearchResult;
}) {
  const posterUrl = getTmdbPosterUrl(item.posterPath);

  const releaseYear = item.releaseDate
    ? item.releaseDate.slice(0, 4)
    : "Unknown";

  return (
    <article className="group min-w-0 rounded-lg bg-[#211E1B] p-3 transition hover:-translate-y-1 hover:bg-[#2A2622]">
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
              {item.title}
            </span>
          </div>
        ) : null}

        <span className="absolute left-2 top-2 rounded-full bg-black/75 px-2 py-1 text-[9px] font-medium text-white">
          {item.mediaType === "movie" ? "Film" : "Series"}
        </span>

        {item.rating > 0 ? (
          <span className="absolute right-2 top-2 rounded-full bg-black/75 px-2 py-1 text-[9px] font-medium text-[#F4C95D]">
            ★ {item.rating.toFixed(1)}
          </span>
        ) : null}

        <div className="absolute inset-x-0 bottom-0 translate-y-full bg-gradient-to-t from-black via-black/90 to-transparent px-3 pb-3 pt-14 transition duration-300 group-hover:translate-y-0">
          <p className="line-clamp-4 text-[11px] leading-5 text-white/75">
            {item.overview || "No overview available."}
          </p>
        </div>
      </div>

      <h3
        title={item.title}
        className="mt-3 truncate text-sm font-semibold text-[#F4F1EB]"
      >
        {item.title}
      </h3>

      <div className="mt-1 flex items-center justify-between gap-2">
        <span className="text-xs text-[#8A8580]">
          {releaseYear}
        </span>

        <span className="text-[10px] uppercase text-[#625D58]">
          {item.mediaType === "movie" ? "Movie" : "TV"}
        </span>
      </div>

        <Link
        href={`/log/${item.mediaType}/${item.id}`}
        className="mt-3 block w-full rounded-full border border-[#C84B18]/50 px-3 py-2 text-center text-xs font-medium text-[#C84B18] transition hover:bg-[#C84B18] hover:text-white"
        >
        Log this title
        </Link>
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
    <div className="mt-10 flex items-center justify-center gap-4">
      {currentPage > 1 ? (
        <Link
          href={`/search?q=${encodeURIComponent(query)}&page=${
            currentPage - 1
          }`}
          className="rounded-full border border-[#302C28] px-5 py-2.5 text-sm text-[#C9C4BC]"
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
          className="rounded-full border border-[#302C28] px-5 py-2.5 text-sm text-[#C9C4BC]"
        >
          Next →
        </Link>
      ) : null}
    </div>
  );
}