import { Prisma } from "@prisma/client";
import { getServerSession } from "next-auth";
import Link from "next/link";
import { redirect } from "next/navigation";

import { FormattedReview } from "@/components/diary/FormattedReview";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { getTmdbPosterUrl } from "@/lib/tmdb";

export const dynamic = "force-dynamic";

type SearchParams = {
  q?: string | string[];
  media?: string | string[];
  visibility?: string | string[];
  viewing?: string | string[];
  rating?: string | string[];
  sort?: string | string[];
  page?: string | string[];
};

type DiaryPageProps = {
  searchParams?: SearchParams;
};

type MediaFilter = "all" | "movie" | "tv";
type VisibilityFilter = "all" | "public" | "private";
type ViewingFilter = "all" | "first" | "rewatch";
type RatingFilter =
  | "all"
  | "unrated"
  | "0.5"
  | "1"
  | "1.5"
  | "2"
  | "2.5"
  | "3"
  | "3.5"
  | "4"
  | "4.5"
  | "5";
type SortFilter =
  | "newest"
  | "oldest"
  | "rating-high"
  | "rating-low"
  | "title";

const ITEMS_PER_PAGE = 8;

export default async function DiaryPage({
  searchParams,
}: DiaryPageProps) {
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

  const visibility = getAllowedParam<VisibilityFilter>(
    searchParams?.visibility,
    ["all", "public", "private"],
    "all",
  );

  const viewing = getAllowedParam<ViewingFilter>(
    searchParams?.viewing,
    ["all", "first", "rewatch"],
    "all",
  );

  const rating = getAllowedParam<RatingFilter>(
    searchParams?.rating,
    [
      "all",
      "unrated",
      "0.5",
      "1",
      "1.5",
      "2",
      "2.5",
      "3",
      "3.5",
      "4",
      "4.5",
      "5",
    ],
    "all",
  );

  const sort = getAllowedParam<SortFilter>(
    searchParams?.sort,
    [
      "newest",
      "oldest",
      "rating-high",
      "rating-low",
      "title",
    ],
    "newest",
  );

  const requestedPage = getPageNumber(searchParams?.page);

  const where: Prisma.DiaryEntryWhereInput = {
    userId: session.user.id,
    deletedAt: null,
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

  if (visibility === "public") {
    where.isPublic = true;
  }

  if (visibility === "private") {
    where.isPublic = false;
  }

  if (viewing === "first") {
    where.isRewatch = false;
  }

  if (viewing === "rewatch") {
    where.isRewatch = true;
  }

  if (rating === "unrated") {
    where.rating = null;
  } else if (rating !== "all") {
    where.rating = Number(rating);
  }

  const orderBy = getOrderBy(sort);

  const [totalEntries, filteredEntries] = await Promise.all([
    prisma.diaryEntry.count({
      where: {
        userId: session.user.id,
        deletedAt: null,
      },
    }),
    prisma.diaryEntry.count({
      where,
    }),
  ]);

  const totalPages = Math.max(
    1,
    Math.ceil(filteredEntries / ITEMS_PER_PAGE),
  );

  const currentPage = Math.min(requestedPage, totalPages);

  const entries = await prisma.diaryEntry.findMany({
    where,
    orderBy,
    skip: (currentPage - 1) * ITEMS_PER_PAGE,
    take: ITEMS_PER_PAGE,
    select: {
      id: true,
      title: true,
      posterPath: true,
      mediaType: true,
      rating: true,
      review: true,
      spoiler: true,
      isRewatch: true,
      isPublic: true,
      reviewIsPublic: true,
      watchedAt: true,
    },
  });

  const hasActiveFilters =
    Boolean(query) ||
    media !== "all" ||
    visibility !== "all" ||
    viewing !== "all" ||
    rating !== "all" ||
    sort !== "newest";

  const filterParams = {
    q: query,
    media,
    visibility,
    viewing,
    rating,
    sort,
  };

  return (
    <div>
      <section className="flex flex-col gap-5 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-[#F4F1EB]">
            Your diary
          </h1>

          <p className="mt-2 text-sm text-[#8A8580]">
            Your viewing history, ratings, and personal reviews.
          </p>
        </div>

        <Link
          href="/search"
          className="inline-flex w-max items-center gap-2 rounded-full bg-[#C84B18] px-5 py-3 text-sm font-semibold text-white transition hover:bg-[#DC5520]"
        >
          Log a title
          <span aria-hidden="true">→</span>
        </Link>
      </section>

      {totalEntries > 0 ? (
        <section className="mt-8 rounded-xl border border-[#27231F] bg-[#191613] p-4 sm:p-5">
          <form action="/diary" method="get">
            <div className="grid gap-4 lg:grid-cols-[minmax(220px,1.5fr)_repeat(2,minmax(140px,0.7fr))]">
              <Field label="Search">
                <div className="relative">
                  <SearchIcon className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-[#625D58]" />

                  <input
                    type="search"
                    name="q"
                    defaultValue={query}
                    placeholder="Search diary titles"
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

              <Field label="Visibility">
                <select
                  name="visibility"
                  defaultValue={visibility}
                  className="w-full rounded-lg border border-[#302C28] bg-[#100E0C] px-4 py-3 text-sm text-[#F4F1EB] outline-none transition focus:border-[#C84B18]"
                >
                  <option value="all">All visibility</option>
                  <option value="public">Public</option>
                  <option value="private">Private</option>
                </select>
              </Field>
            </div>

            <div className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-[repeat(3,minmax(150px,1fr))_auto]">
              <Field label="Viewing type">
                <select
                  name="viewing"
                  defaultValue={viewing}
                  className="w-full rounded-lg border border-[#302C28] bg-[#100E0C] px-4 py-3 text-sm text-[#F4F1EB] outline-none transition focus:border-[#C84B18]"
                >
                  <option value="all">All viewings</option>
                  <option value="first">First watch</option>
                  <option value="rewatch">Rewatch</option>
                </select>
              </Field>

              <Field label="Rating">
                <select
                  name="rating"
                  defaultValue={rating}
                  className="w-full rounded-lg border border-[#302C28] bg-[#100E0C] px-4 py-3 text-sm text-[#F4F1EB] outline-none transition focus:border-[#C84B18]"
                >
                  <option value="all">All ratings</option>
                  <option value="unrated">Not rated</option>
                  <option value="5">5.0 stars</option>
                  <option value="4.5">4.5 stars</option>
                  <option value="4">4.0 stars</option>
                  <option value="3.5">3.5 stars</option>
                  <option value="3">3.0 stars</option>
                  <option value="2.5">2.5 stars</option>
                  <option value="2">2.0 stars</option>
                  <option value="1.5">1.5 stars</option>
                  <option value="1">1.0 star</option>
                  <option value="0.5">0.5 stars</option>
                </select>
              </Field>

              <Field label="Sort by">
                <select
                  name="sort"
                  defaultValue={sort}
                  className="w-full rounded-lg border border-[#302C28] bg-[#100E0C] px-4 py-3 text-sm text-[#F4F1EB] outline-none transition focus:border-[#C84B18]"
                >
                  <option value="newest">Recently watched</option>
                  <option value="oldest">Oldest watched</option>
                  <option value="rating-high">
                    Highest rating
                  </option>
                  <option value="rating-low">
                    Lowest rating
                  </option>
                  <option value="title">Title A–Z</option>
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
                    href="/diary"
                    aria-label="Clear diary filters"
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

      {totalEntries === 0 ? (
        <EmptyDiary />
      ) : entries.length === 0 ? (
        <EmptyFilteredDiary query={query} />
      ) : (
        <>
          <div className="mt-8 flex flex-wrap items-center justify-between gap-3">
            <p className="text-sm text-[#8A8580]">
              Showing{" "}
              <span className="font-medium text-[#F4F1EB]">
                {(currentPage - 1) * ITEMS_PER_PAGE + 1}–
                {Math.min(
                  currentPage * ITEMS_PER_PAGE,
                  filteredEntries,
                )}
              </span>{" "}
              of{" "}
              <span className="font-medium text-[#F4F1EB]">
                {filteredEntries}
              </span>{" "}
              {filteredEntries === 1 ? "entry" : "entries"}
            </p>

            {hasActiveFilters ? (
              <p className="text-xs text-[#625D58]">
                {totalEntries - filteredEntries} hidden by filters
              </p>
            ) : null}
          </div>

          <div className="mt-5 space-y-5">
            {entries.map((entry) => {
              const posterUrl = getTmdbPosterUrl(
                entry.posterPath,
              );

              const watchedDate = new Intl.DateTimeFormat("en", {
                day: "2-digit",
                month: "long",
                year: "numeric",
                timeZone: "UTC",
              }).format(entry.watchedAt);

              return (
                <article
                  key={entry.id}
                  className="rounded-xl border border-[#27231F] bg-[#211E1B] p-4 transition hover:border-[#38332E] sm:p-5"
                >
                  <div className="grid gap-5 sm:grid-cols-[88px_minmax(0,1fr)]">
                    <Link
                      href={`/diary/${entry.id}`}
                      aria-label={`View details for ${entry.title}`}
                      className="block w-[88px]"
                    >
                      <div
                        className="aspect-[2/3] w-[88px] overflow-hidden rounded-md bg-gradient-to-br from-[#3A2419] to-[#171411] bg-cover bg-center shadow-lg shadow-black/20 transition hover:opacity-80"
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
                            <span className="line-clamp-3 text-[10px] font-medium text-[#8A8580]">
                              {entry.title}
                            </span>
                          </div>
                        ) : null}
                      </div>
                    </Link>

                    <div className="min-w-0">
                      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                        <div className="min-w-0">
                          <div className="flex flex-wrap items-center gap-2">
                            <Link
                              href={`/diary/${entry.id}`}
                              className="min-w-0"
                            >
                              <h2 className="truncate text-xl font-semibold text-[#F4F1EB] transition hover:text-[#E45A1C]">
                                {entry.title}
                              </h2>
                            </Link>

                            <Badge>
                              {entry.mediaType === "movie"
                                ? "Film"
                                : "Series"}
                            </Badge>

                            {entry.isRewatch ? (
                              <span className="rounded-full bg-[#C84B18]/15 px-2.5 py-1 text-[9px] uppercase tracking-wide text-[#E45A1C]">
                                Rewatch
                              </span>
                            ) : (
                              <Badge>First watch</Badge>
                            )}

                            <VisibilityBadge
                              label="Diary"
                              isPublic={entry.isPublic}
                            />

                            {entry.review ? (
                              <VisibilityBadge
                                label="Review"
                                isPublic={entry.reviewIsPublic}
                              />
                            ) : (
                              <Badge>No review</Badge>
                            )}
                          </div>

                          <div className="mt-3 flex flex-wrap items-center gap-x-5 gap-y-2 text-xs text-[#8A8580]">
                            <p>Watched {watchedDate}</p>

                            <p>
                              {entry.isPublic
                                ? "Viewing activity may appear publicly"
                                : "Viewing activity is only visible to you"}
                            </p>
                          </div>
                        </div>

                        <div className="shrink-0 sm:text-right">
                          <p className="text-[10px] uppercase tracking-[0.12em] text-[#625D58]">
                            Your rating
                          </p>

                          <p className="mt-1 text-lg font-semibold text-[#E45A1C]">
                            {entry.rating !== null
                              ? `${entry.rating.toFixed(1)} / 5`
                              : "Not rated"}
                          </p>

                          <Link
                            href={`/diary/${entry.id}`}
                            className="mt-3 inline-flex rounded-full border border-[#302C28] px-4 py-2 text-xs font-medium text-[#C9C4BC] transition hover:border-[#C84B18]/60 hover:text-[#E45A1C]"
                          >
                            View details
                          </Link>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="mt-5 border-t border-[#302C28] pt-5 sm:ml-[108px]">
                    <div className="mb-3 flex items-center justify-between gap-4">
                      <p className="text-[10px] font-medium uppercase tracking-[0.14em] text-[#625D58]">
                        Your review
                      </p>

                      {entry.spoiler ? (
                        <span className="rounded-full bg-[#C84B18]/10 px-2.5 py-1 text-[9px] uppercase tracking-wide text-[#E45A1C]">
                          Contains spoilers
                        </span>
                      ) : null}
                    </div>

                    {entry.review ? (
                      <>
                        <FormattedReview
                          text={entry.review}
                          hideWholeReview={entry.spoiler}
                          className="max-w-3xl"
                        />

                        <p className="mt-4 text-xs text-[#625D58]">
                          {entry.reviewIsPublic
                            ? "This review may appear on your public profile."
                            : "This review is only visible to you."}
                        </p>
                      </>
                    ) : (
                      <div className="rounded-md border border-dashed border-[#302C28] bg-[#171411] px-4 py-4">
                        <p className="text-sm italic text-[#625D58]">
                          No review written for this entry.
                        </p>
                      </div>
                    )}
                  </div>
                </article>
              );
            })}
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

function EmptyDiary() {
  return (
    <div className="mt-10 rounded-xl border border-dashed border-[#302C28] bg-[#171411] px-6 py-16 text-center">
      <h2 className="text-xl font-semibold text-[#F4F1EB]">
        Your diary is empty
      </h2>

      <p className="mx-auto mt-2 max-w-md text-sm leading-6 text-[#8A8580]">
        Search for a film or series and create your first diary
        entry.
      </p>

      <Link
        href="/search"
        className="mt-6 inline-flex rounded-full bg-[#F4F1EB] px-5 py-2.5 text-sm font-semibold text-[#171411]"
      >
        Find something to log
      </Link>
    </div>
  );
}

function EmptyFilteredDiary({
  query,
}: {
  query: string;
}) {
  return (
    <div className="mt-8 rounded-xl border border-dashed border-[#302C28] bg-[#171411] px-6 py-14 text-center">
      <h2 className="text-xl font-semibold text-[#F4F1EB]">
        No matching diary entries
      </h2>

      <p className="mx-auto mt-2 max-w-md text-sm leading-6 text-[#8A8580]">
        {query
          ? `No entries matched “${query}” and the selected filters.`
          : "No entries matched the selected filters."}
      </p>

      <Link
        href="/diary"
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
    visibility: VisibilityFilter;
    viewing: ViewingFilter;
    rating: RatingFilter;
    sort: SortFilter;
  };
}) {
  const pageNumbers = getVisiblePages(
    currentPage,
    totalPages,
  );

  return (
    <nav
      aria-label="Diary pagination"
      className="mt-10 flex flex-wrap items-center justify-center gap-2"
    >
      <PaginationLink
        href={buildDiaryUrl(
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
            href={buildDiaryUrl(
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
        href={buildDiaryUrl(
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
  children: React.ReactNode;
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
  children: React.ReactNode;
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

function Badge({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <span className="rounded-full bg-[#171411] px-2.5 py-1 text-[9px] uppercase tracking-wide text-[#625D58]">
      {children}
    </span>
  );
}

function VisibilityBadge({
  label,
  isPublic,
}: {
  label: string;
  isPublic: boolean;
}) {
  return (
    <span
      className={[
        "rounded-full px-2.5 py-1 text-[9px] uppercase tracking-wide",
        isPublic
          ? "bg-[#C84B18]/15 text-[#E45A1C]"
          : "bg-[#171411] text-[#625D58]",
      ].join(" ")}
    >
      {label}: {isPublic ? "Public" : "Private"}
    </span>
  );
}

function getOrderBy(
  sort: SortFilter,
): Prisma.DiaryEntryOrderByWithRelationInput[] {
  switch (sort) {
    case "oldest":
      return [
        {
          watchedAt: "asc",
        },
        {
          createdAt: "asc",
        },
      ];

    case "rating-high":
      return [
        {
          rating: "desc",
        },
        {
          watchedAt: "desc",
        },
      ];

    case "rating-low":
      return [
        {
          rating: "asc",
        },
        {
          watchedAt: "desc",
        },
      ];

    case "title":
      return [
        {
          title: "asc",
        },
        {
          watchedAt: "desc",
        },
      ];

    default:
      return [
        {
          watchedAt: "desc",
        },
        {
          createdAt: "desc",
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

function buildDiaryUrl(
  filters: {
    q: string;
    media: MediaFilter;
    visibility: VisibilityFilter;
    viewing: ViewingFilter;
    rating: RatingFilter;
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

  if (filters.visibility !== "all") {
    params.set("visibility", filters.visibility);
  }

  if (filters.viewing !== "all") {
    params.set("viewing", filters.viewing);
  }

  if (filters.rating !== "all") {
    params.set("rating", filters.rating);
  }

  if (filters.sort !== "newest") {
    params.set("sort", filters.sort);
  }

  if (page > 1) {
    params.set("page", String(page));
  }

  const queryString = params.toString();

  return queryString ? `/diary?${queryString}` : "/diary";
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