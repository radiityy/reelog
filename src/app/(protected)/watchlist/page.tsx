import { Prisma } from "@prisma/client";
import { getServerSession } from "next-auth";
import Link from "next/link";
import { redirect } from "next/navigation";
import type { ReactNode } from "react";

import { WatchlistButton } from "@/components/watchlist/WatchlistButton";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { getTmdbPosterUrl } from "@/lib/tmdb";

export const dynamic = "force-dynamic";

type WatchlistSearchParams = {
  q?: string | string[];
  media?: string | string[];
  sort?: string | string[];
  page?: string | string[];
};

type WatchlistPageProps = {
  searchParams?: WatchlistSearchParams;
};

type MediaFilter = "all" | "movie" | "tv";

type SortFilter =
  | "newest"
  | "oldest"
  | "title-asc"
  | "title-desc";

const ITEMS_PER_PAGE = 12;

export default async function WatchlistPage({
  searchParams,
}: WatchlistPageProps) {
  const session = await getServerSession(authOptions);

  if (!session?.user?.id) {
    redirect("/login");
  }

  const query = getParam(searchParams?.q).trim();

  const media = getAllowedParam<MediaFilter>(
    searchParams?.media,
    ["all", "movie", "tv"],
    "all",
  );

  const sort = getAllowedParam<SortFilter>(
    searchParams?.sort,
    ["newest", "oldest", "title-asc", "title-desc"],
    "newest",
  );

  const requestedPage = getPageNumber(searchParams?.page);

  const baseWhere: Prisma.WatchlistItemWhereInput = {
    userId: session.user.id,
    deletedAt: null,
  };

  const where: Prisma.WatchlistItemWhereInput = {
    ...baseWhere,
  };

  if (query) {
    where.title = {
      contains: query,
      mode: "insensitive",
    };
  }

  if (media !== "all") {
    where.mediaType = media;
  }

  const orderBy = getOrderBy(sort);

  const [totalItems, filteredItems] = await Promise.all([
    prisma.watchlistItem.count({
      where: baseWhere,
    }),
    prisma.watchlistItem.count({
      where,
    }),
  ]);

  const totalPages = Math.max(
    1,
    Math.ceil(filteredItems / ITEMS_PER_PAGE),
  );

  const currentPage = Math.min(requestedPage, totalPages);

  const items = await prisma.watchlistItem.findMany({
    where,
    orderBy,
    skip: (currentPage - 1) * ITEMS_PER_PAGE,
    take: ITEMS_PER_PAGE,
    select: {
      id: true,
      tmdbId: true,
      mediaType: true,
      title: true,
      posterPath: true,
      addedAt: true,
    },
  });

  const hasActiveFilters =
    Boolean(query) || media !== "all" || sort !== "newest";

  const filterParams = {
    q: query,
    media,
    sort,
  };

  const firstVisibleItem =
    filteredItems === 0
      ? 0
      : (currentPage - 1) * ITEMS_PER_PAGE + 1;

  const lastVisibleItem = Math.min(
    currentPage * ITEMS_PER_PAGE,
    filteredItems,
  );

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

          {totalItems > 0 ? (
            <p className="mt-3 text-xs text-[#625D58]">
              {totalItems}{" "}
              {totalItems === 1 ? "title" : "titles"} saved
            </p>
          ) : null}
        </div>

        <Link
          href="/search"
          className="inline-flex w-max items-center gap-2 rounded-full bg-[#C84B18] px-5 py-3 text-sm font-semibold text-white transition hover:bg-[#DC5520]"
        >
          Find a title
          <span aria-hidden="true">→</span>
        </Link>
      </section>

      {totalItems > 0 ? (
        <section className="mt-8 rounded-xl border border-[#27231F] bg-[#191613] p-4 sm:p-5">
          <form action="/watchlist" method="get">
            <div className="grid gap-4 md:grid-cols-[minmax(220px,1fr)_minmax(150px,0.45fr)_minmax(170px,0.55fr)_auto]">
              <Field label="Search">
                <div className="relative">
                  <SearchIcon className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-[#625D58]" />

                  <input
                    type="search"
                    name="q"
                    defaultValue={query}
                    placeholder="Search saved titles"
                    className="w-full rounded-lg border border-[#302C28] bg-[#100E0C] py-3 pl-11 pr-4 text-sm text-[#F4F1EB] outline-none transition placeholder:text-[#625D58] focus:border-[#C84B18]"
                  />
                </div>
              </Field>

              <Field label="Media type">
                <select
                  name="media"
                  defaultValue={media}
                  className="w-full rounded-lg border border-[#302C28] bg-[#100E0C] px-4 py-3 text-sm text-[#F4F1EB] outline-none transition focus:border-[#C84B18]"
                >
                  <option value="all">All titles</option>
                  <option value="movie">Films</option>
                  <option value="tv">Series</option>
                </select>
              </Field>

              <Field label="Sort by">
                <select
                  name="sort"
                  defaultValue={sort}
                  className="w-full rounded-lg border border-[#302C28] bg-[#100E0C] px-4 py-3 text-sm text-[#F4F1EB] outline-none transition focus:border-[#C84B18]"
                >
                  <option value="newest">Recently added</option>
                  <option value="oldest">Oldest added</option>
                  <option value="title-asc">Title A–Z</option>
                  <option value="title-desc">Title Z–A</option>
                </select>
              </Field>

              <div className="flex items-end gap-2">
                <button
                  type="submit"
                  className="inline-flex min-h-[46px] flex-1 items-center justify-center rounded-full bg-[#C84B18] px-5 text-sm font-semibold text-white transition hover:bg-[#DC5520]"
                >
                  Apply
                </button>

                {hasActiveFilters ? (
                  <Link
                    href="/watchlist"
                    aria-label="Clear watchlist filters"
                    title="Clear filters"
                    className="inline-flex h-[46px] w-[46px] shrink-0 items-center justify-center rounded-full border border-[#302C28] text-[#8A8580] transition hover:border-[#48413B] hover:text-[#F4F1EB]"
                  >
                    <ResetIcon className="h-4 w-4" />
                  </Link>
                ) : null}
              </div>
            </div>
          </form>
        </section>
      ) : null}

      {totalItems === 0 ? (
        <EmptyWatchlist />
      ) : items.length === 0 ? (
        <EmptyFilteredWatchlist query={query} />
      ) : (
        <>
          <div className="mt-8 flex flex-wrap items-center justify-between gap-3">
            <p className="text-sm text-[#8A8580]">
              Showing{" "}
              <span className="font-medium text-[#F4F1EB]">
                {firstVisibleItem}–{lastVisibleItem}
              </span>{" "}
              of{" "}
              <span className="font-medium text-[#F4F1EB]">
                {filteredItems}
              </span>{" "}
              {filteredItems === 1 ? "title" : "titles"}
            </p>

            {hasActiveFilters ? (
              <p className="text-xs text-[#625D58]">
                {totalItems - filteredItems} hidden by filters
              </p>
            ) : null}
          </div>

          <div className="mt-5 grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4 xl:grid-cols-5 2xl:grid-cols-6">
            {items.map((item) => (
              <WatchlistCard
                key={item.id}
                item={item}
              />
            ))}
          </div>

          {totalPages > 1 ? (
            <Pagination
              currentPage={currentPage}
              totalPages={totalPages}
              filterParams={filterParams}
            />
          ) : null}
        </>
      )}
    </div>
  );
}

function WatchlistCard({
  item,
}: {
  item: {
    id: string;
    tmdbId: number;
    mediaType: "movie" | "tv";
    title: string;
    posterPath: string | null;
    addedAt: Date;
  };
}) {
  const detailsHref = `/title/${item.mediaType}/${item.tmdbId}`;
  const logHref = `/log/${item.mediaType}/${item.tmdbId}`;
  const posterUrl = getTmdbPosterUrl(item.posterPath);

  const addedDate = new Intl.DateTimeFormat("en", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    timeZone: "UTC",
  }).format(item.addedAt);

  return (
    <article className="group min-w-0 overflow-hidden rounded-xl border border-[#27231F] bg-[#211E1B] p-3 transition duration-200 hover:-translate-y-1 hover:border-[#38332E] hover:shadow-xl hover:shadow-black/30">
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
            <div className="flex h-full items-center justify-center p-4 text-center">
              <span className="text-sm font-semibold text-[#8A8580]">
                {item.title}
              </span>
            </div>
          ) : null}

          <span className="absolute left-2 top-2 rounded-full bg-black/75 px-2 py-1 text-[9px] uppercase text-white backdrop-blur-sm">
            {item.mediaType === "movie" ? "Film" : "Series"}
          </span>

          <div className="pointer-events-none absolute inset-0 flex items-center justify-center bg-black/55 opacity-0 transition duration-200 group-hover:opacity-100">
            <span className="flex h-11 w-11 items-center justify-center rounded-full border border-white/20 bg-black/35 text-white backdrop-blur-sm">
              <EyeIcon className="h-5 w-5" />
            </span>
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

      <p className="mt-1 text-[11px] text-[#625D58]">
        Added {addedDate}
      </p>

      <div className="mt-3 space-y-2">
        <Link
          href={detailsHref}
          className="flex w-full items-center justify-center gap-2 rounded-full border border-[#C84B18]/50 px-3 py-2 text-center text-xs font-semibold text-[#E45A1C] transition hover:border-[#C84B18] hover:bg-[#C84B18] hover:text-white"
        >
          View details
          <ArrowIcon className="h-3.5 w-3.5" />
        </Link>

        <Link
          href={logHref}
          className="block w-full rounded-full bg-[#C84B18] px-3 py-2 text-center text-xs font-semibold text-white transition hover:bg-[#DC5520]"
        >
          Log this title
        </Link>

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
}

function EmptyWatchlist() {
  return (
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
        className="mt-6 inline-flex rounded-full bg-[#F4F1EB] px-5 py-2.5 text-sm font-semibold text-[#171411] transition hover:bg-white"
      >
        Search titles
      </Link>
    </div>
  );
}

function EmptyFilteredWatchlist({
  query,
}: {
  query: string;
}) {
  return (
    <div className="mt-8 rounded-xl border border-dashed border-[#302C28] bg-[#171411] px-6 py-14 text-center">
      <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-[#211E1B] text-[#8A8580]">
        <SearchIcon className="h-5 w-5" />
      </div>

      <h2 className="mt-5 text-xl font-semibold text-[#F4F1EB]">
        No matching watchlist titles
      </h2>

      <p className="mx-auto mt-2 max-w-md text-sm leading-6 text-[#8A8580]">
        {query
          ? `No saved titles matched “${query}” and the selected filters.`
          : "No saved titles matched the selected filters."}
      </p>

      <Link
        href="/watchlist"
        className="mt-6 inline-flex rounded-full border border-[#302C28] px-5 py-2.5 text-sm font-semibold text-[#C9C4BC] transition hover:border-[#48413B] hover:text-[#F4F1EB]"
      >
        Clear filters
      </Link>
    </div>
  );
}

function Pagination({
  currentPage,
  totalPages,
  filterParams,
}: {
  currentPage: number;
  totalPages: number;
  filterParams: {
    q: string;
    media: MediaFilter;
    sort: SortFilter;
  };
}) {
  const pageNumbers = getVisiblePages(
    currentPage,
    totalPages,
  );

  return (
    <nav
      aria-label="Watchlist pagination"
      className="mt-10 flex flex-wrap items-center justify-center gap-2"
    >
      <PaginationLink
        href={buildWatchlistUrl(
          filterParams,
          currentPage - 1,
        )}
        disabled={currentPage <= 1}
        label="Previous page"
      >
        ←
      </PaginationLink>

      {pageNumbers.map((pageNumber, index) =>
        pageNumber === "ellipsis" ? (
          <span
            key={`ellipsis-${index}`}
            className="flex h-10 w-10 items-center justify-center text-sm text-[#625D58]"
          >
            …
          </span>
        ) : (
          <Link
            key={pageNumber}
            href={buildWatchlistUrl(
              filterParams,
              pageNumber,
            )}
            aria-current={
              currentPage === pageNumber
                ? "page"
                : undefined
            }
            className={[
              "flex h-10 min-w-10 items-center justify-center rounded-full px-3 text-sm font-medium transition",
              currentPage === pageNumber
                ? "bg-[#C84B18] text-white"
                : "border border-[#302C28] text-[#8A8580] hover:border-[#48413B] hover:text-[#F4F1EB]",
            ].join(" ")}
          >
            {pageNumber}
          </Link>
        ),
      )}

      <PaginationLink
        href={buildWatchlistUrl(
          filterParams,
          currentPage + 1,
        )}
        disabled={currentPage >= totalPages}
        label="Next page"
      >
        →
      </PaginationLink>
    </nav>
  );
}

function PaginationLink({
  href,
  disabled,
  label,
  children,
}: {
  href: string;
  disabled: boolean;
  label: string;
  children: ReactNode;
}) {
  if (disabled) {
    return (
      <span
        aria-disabled="true"
        className="flex h-10 w-10 cursor-not-allowed items-center justify-center rounded-full border border-[#27231F] text-sm text-[#3A3530]"
      >
        {children}
      </span>
    );
  }

  return (
    <Link
      href={href}
      aria-label={label}
      className="flex h-10 w-10 items-center justify-center rounded-full border border-[#302C28] text-sm text-[#8A8580] transition hover:border-[#48413B] hover:text-[#F4F1EB]"
    >
      {children}
    </Link>
  );
}

function Field({
  label,
  children,
}: {
  label: string;
  children: ReactNode;
}) {
  return (
    <label>
      <span className="mb-2 block text-xs font-medium text-[#8A8580]">
        {label}
      </span>

      {children}
    </label>
  );
}

function getOrderBy(
  sort: SortFilter,
): Prisma.WatchlistItemOrderByWithRelationInput[] {
  switch (sort) {
    case "oldest":
      return [
        {
          addedAt: "asc",
        },
        {
          title: "asc",
        },
      ];

    case "title-asc":
      return [
        {
          title: "asc",
        },
        {
          addedAt: "desc",
        },
      ];

    case "title-desc":
      return [
        {
          title: "desc",
        },
        {
          addedAt: "desc",
        },
      ];

    default:
      return [
        {
          addedAt: "desc",
        },
        {
          title: "asc",
        },
      ];
  }
}

function getParam(
  value: string | string[] | undefined,
) {
  if (Array.isArray(value)) {
    return value[0] ?? "";
  }

  return value ?? "";
}

function getAllowedParam<T extends string>(
  value: string | string[] | undefined,
  allowedValues: readonly T[],
  fallback: T,
): T {
  const normalizedValue = getParam(value);

  return allowedValues.includes(normalizedValue as T)
    ? (normalizedValue as T)
    : fallback;
}

function getPageNumber(
  value: string | string[] | undefined,
) {
  const page = Number(getParam(value));

  if (!Number.isInteger(page) || page < 1) {
    return 1;
  }

  return page;
}

function buildWatchlistUrl(
  filters: {
    q: string;
    media: MediaFilter;
    sort: SortFilter;
  },
  page: number,
) {
  const params = new URLSearchParams();

  if (filters.q) {
    params.set("q", filters.q);
  }

  if (filters.media !== "all") {
    params.set("media", filters.media);
  }

  if (filters.sort !== "newest") {
    params.set("sort", filters.sort);
  }

  if (page > 1) {
    params.set("page", String(page));
  }

  const queryString = params.toString();

  return queryString
    ? `/watchlist?${queryString}`
    : "/watchlist";
}

function getVisiblePages(
  currentPage: number,
  totalPages: number,
): Array<number | "ellipsis"> {
  if (totalPages <= 7) {
    return Array.from(
      {
        length: totalPages,
      },
      (_, index) => index + 1,
    );
  }

  if (currentPage <= 4) {
    return [1, 2, 3, 4, 5, "ellipsis", totalPages];
  }

  if (currentPage >= totalPages - 3) {
    return [
      1,
      "ellipsis",
      totalPages - 4,
      totalPages - 3,
      totalPages - 2,
      totalPages - 1,
      totalPages,
    ];
  }

  return [
    1,
    "ellipsis",
    currentPage - 1,
    currentPage,
    currentPage + 1,
    "ellipsis",
    totalPages,
  ];
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

function ResetIcon({
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
        d="M4 7h11a5 5 0 1 1-4.6 7"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
      />

      <path
        d="m4 7 3-3M4 7l3 3"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}