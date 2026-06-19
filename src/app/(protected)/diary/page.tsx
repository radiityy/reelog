import Link from "next/link";
import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";

import { FormattedReview } from "@/components/diary/FormattedReview";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { getTmdbPosterUrl } from "@/lib/tmdb";

export default async function DiaryPage() {
  const session = await getServerSession(authOptions);

  if (!session?.user?.id) {
    redirect("/login");
  }

  const entries = await prisma.diaryEntry.findMany({
    where: {
      userId: session.user.id,
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
      title: true,
      posterPath: true,
      mediaType: true,
      rating: true,
      review: true,
      spoiler: true,
      isPublic: true,
      reviewIsPublic: true,
      watchedAt: true,
    },
  });

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
          className="inline-flex w-max rounded-full bg-[#C84B18] px-5 py-3 text-sm font-semibold text-white transition hover:bg-[#DC5520]"
        >
          Log a title
        </Link>
      </section>

      {entries.length === 0 ? (
        <div className="mt-10 rounded-xl border border-dashed border-[#302C28] bg-[#171411] px-6 py-16 text-center">
          <h2 className="text-xl font-semibold text-[#F4F1EB]">
            Your diary is empty
          </h2>

          <p className="mx-auto mt-2 max-w-md text-sm leading-6 text-[#8A8580]">
            Search for a film or series and create your first diary entry.
          </p>

          <Link
            href="/search"
            className="mt-6 inline-flex rounded-full bg-[#F4F1EB] px-5 py-2.5 text-sm font-semibold text-[#171411]"
          >
            Find something to log
          </Link>
        </div>
      ) : (
        <div className="mt-8 space-y-5">
          {entries.map((entry) => {
            const posterUrl = getTmdbPosterUrl(entry.posterPath);

            return (
              <article
                key={entry.id}
                className="rounded-xl border border-[#27231F] bg-[#211E1B] p-5"
              >
                <div className="grid gap-5 sm:grid-cols-[88px_1fr]">
                  <Link
                    href={`/diary/${entry.id}`}
                    aria-label={`View details for ${entry.title}`}
                    className="block w-[88px]"
                  >
                    <div
                      className="aspect-[2/3] w-[88px] rounded-md bg-gradient-to-br from-[#3A2419] to-[#171411] bg-cover bg-center shadow-lg shadow-black/20 transition hover:opacity-80"
                      style={
                        posterUrl
                          ? {
                              backgroundImage: `url("${posterUrl}")`,
                            }
                          : undefined
                      }
                    />
                  </Link>

                  <div className="min-w-0">
                    <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                      <div className="min-w-0">
                        <div className="flex flex-wrap items-center gap-3">
                          <Link
                            href={`/diary/${entry.id}`}
                            className="min-w-0"
                          >
                            <h2 className="truncate text-xl font-semibold text-[#F4F1EB] transition hover:text-[#E45A1C]">
                              {entry.title}
                            </h2>
                          </Link>

                          <span className="rounded-full bg-[#171411] px-2.5 py-1 text-[9px] uppercase tracking-wide text-[#8A8580]">
                            {entry.mediaType === "movie"
                              ? "Film"
                              : "Series"}
                          </span>

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
                            <span className="rounded-full bg-[#171411] px-2.5 py-1 text-[9px] uppercase tracking-wide text-[#625D58]">
                              No review
                            </span>
                          )}
                        </div>

                        <div className="mt-3 flex flex-wrap items-center gap-x-5 gap-y-2 text-xs text-[#8A8580]">
                          <p>
                            Watched{" "}
                            {new Intl.DateTimeFormat("en", {
                              day: "2-digit",
                              month: "long",
                              year: "numeric",
                              timeZone: "UTC",
                            }).format(entry.watchedAt)}
                          </p>

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
                          {entry.rating
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
      )}
    </div>
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