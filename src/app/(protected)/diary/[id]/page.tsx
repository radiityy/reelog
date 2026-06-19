import Link from "next/link";
import { getServerSession } from "next-auth";
import { notFound, redirect } from "next/navigation";

import { DeleteDiaryEntryButton } from "@/components/diary/DeleteDiaryEntryButton";
import { FormattedReview } from "@/components/diary/FormattedReview";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { getTmdbPosterUrl } from "@/lib/tmdb";

type DiaryDetailPageProps = {
  params: {
    id: string;
  };
};

export default async function DiaryDetailPage({
  params,
}: DiaryDetailPageProps) {
  const session = await getServerSession(authOptions);

  if (!session?.user?.id) {
    redirect("/login");
  }

  const entry = await prisma.diaryEntry.findFirst({
    where: {
      id: params.id,
      userId: session.user.id,
      deletedAt: null,
    },
    select: {
      id: true,
      title: true,
      posterPath: true,
      mediaType: true,
      watchedAt: true,
      rating: true,
      review: true,
      privateNotes: true,
      spoiler: true,
      isPublic: true,
      reviewIsPublic: true,
      createdAt: true,
      updatedAt: true,
    },
  });

  if (!entry) {
    notFound();
  }

  const posterUrl = getTmdbPosterUrl(entry.posterPath, "w500");

  const watchedDate = new Intl.DateTimeFormat("en", {
    day: "2-digit",
    month: "long",
    year: "numeric",
    timeZone: "UTC",
  }).format(entry.watchedAt);

  const updatedDate = new Intl.DateTimeFormat("en", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    timeZone: "UTC",
  }).format(entry.updatedAt);

  return (
    <div>
      <div className="flex flex-wrap items-center justify-between gap-4">
        <Link
          href="/diary"
          className="inline-flex items-center gap-2 text-sm text-[#8A8580] transition hover:text-[#F4F1EB]"
        >
          <span aria-hidden="true">←</span>
          Back to diary
        </Link>

        <div className="flex flex-wrap items-center gap-3">
          <Link
            href={`/diary/${entry.id}/edit`}
            className="inline-flex rounded-full bg-[#C84B18] px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-[#DC5520]"
          >
            Edit entry
          </Link>

          <DeleteDiaryEntryButton
            entryId={entry.id}
            title={entry.title}
          />
        </div>
      </div>

      <div className="mt-7 grid gap-8 lg:grid-cols-[260px_1fr]">
        <aside>
          <div
            className="aspect-[2/3] overflow-hidden rounded-xl bg-gradient-to-br from-[#3A2419] to-[#171411] bg-cover bg-center shadow-2xl shadow-black/30"
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
                <span className="text-lg font-semibold text-[#8A8580]">
                  {entry.title}
                </span>
              </div>
            ) : null}
          </div>
        </aside>

        <main className="min-w-0">
          <div className="flex flex-col gap-5 sm:flex-row sm:items-start sm:justify-between">
            <div className="min-w-0">
              <div className="flex flex-wrap items-center gap-2">
                <span className="rounded-full bg-[#211E1B] px-3 py-1 text-[10px] uppercase tracking-wide text-[#8A8580]">
                  {entry.mediaType === "movie" ? "Film" : "Series"}
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
                  <span className="rounded-full bg-[#211E1B] px-3 py-1 text-[9px] uppercase tracking-wide text-[#625D58]">
                    No review
                  </span>
                )}
              </div>

              <h1 className="mt-4 text-3xl font-bold tracking-tight text-[#F4F1EB] md:text-4xl">
                {entry.title}
              </h1>

              <p className="mt-3 text-sm text-[#8A8580]">
                Watched on {watchedDate}
              </p>
            </div>

            <div className="shrink-0 sm:text-right">
              <p className="text-[10px] uppercase tracking-[0.14em] text-[#625D58]">
                Your rating
              </p>

              <p className="mt-1 text-xl font-semibold text-[#E45A1C]">
                {entry.rating
                  ? `${entry.rating.toFixed(1)} / 5`
                  : "Not rated"}
              </p>
            </div>
          </div>

          <section className="mt-8 rounded-xl border border-[#302C28] bg-[#211E1B] p-5">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <h2 className="text-lg font-semibold text-[#F4F1EB]">
                Your review
              </h2>

              {entry.spoiler ? (
                <span className="rounded-full bg-[#C84B18]/10 px-3 py-1 text-[9px] uppercase tracking-wide text-[#E45A1C]">
                  Contains spoilers
                </span>
              ) : null}
            </div>

            <div className="mt-4">
              {entry.review ? (
                <FormattedReview
                  text={entry.review}
                  hideWholeReview={entry.spoiler}
                />
              ) : (
                <p className="text-sm italic text-[#625D58]">
                  No review written for this entry.
                </p>
              )}
            </div>

            {entry.review ? (
              <p className="mt-5 border-t border-[#302C28] pt-4 text-xs text-[#625D58]">
                {entry.reviewIsPublic
                  ? "This review may appear on your public profile."
                  : "This review is only visible to you."}
              </p>
            ) : null}
          </section>

          <section className="mt-5 rounded-xl border border-[#302C28] bg-[#171411] p-5">
            <div className="flex items-center gap-2">
              <LockIcon className="h-4 w-4 text-[#8A8580]" />

              <h2 className="text-lg font-semibold text-[#F4F1EB]">
                Private notes
              </h2>
            </div>

            <p className="mt-2 text-xs leading-5 text-[#625D58]">
              These notes are always visible only to you.
            </p>

            <div className="mt-4 rounded-lg border border-[#302C28] bg-[#211E1B] px-4 py-4">
              {entry.privateNotes ? (
                <p className="whitespace-pre-wrap text-sm leading-7 text-[#C9C4BC]">
                  {entry.privateNotes}
                </p>
              ) : (
                <p className="text-sm italic text-[#625D58]">
                  No private notes written.
                </p>
              )}
            </div>
          </section>

          <section className="mt-5 grid gap-4 rounded-xl border border-[#302C28] bg-[#171411] p-5 sm:grid-cols-3">
            <DetailItem
              label="Diary visibility"
              value={entry.isPublic ? "Public" : "Private"}
            />

            <DetailItem
              label="Review visibility"
              value={
                entry.review
                  ? entry.reviewIsPublic
                    ? "Public"
                    : "Private"
                  : "No review"
              }
            />

            <DetailItem
              label="Last updated"
              value={updatedDate}
            />
          </section>
        </main>
      </div>
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
        "rounded-full px-3 py-1 text-[9px] uppercase tracking-wide",
        isPublic
          ? "bg-[#C84B18]/15 text-[#E45A1C]"
          : "bg-[#211E1B] text-[#625D58]",
      ].join(" ")}
    >
      {label}: {isPublic ? "Public" : "Private"}
    </span>
  );
}

function DetailItem({
  label,
  value,
}: {
  label: string;
  value: string;
}) {
  return (
    <div>
      <p className="text-[10px] uppercase tracking-[0.14em] text-[#625D58]">
        {label}
      </p>

      <p className="mt-2 text-sm font-medium text-[#C9C4BC]">
        {value}
      </p>
    </div>
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
      <path
        d="M7 10V8a5 5 0 0 1 10 0v2"
        stroke="currentColor"
        strokeWidth="1.7"
        strokeLinecap="round"
      />

      <rect
        x="5"
        y="10"
        width="14"
        height="11"
        rx="2"
        stroke="currentColor"
        strokeWidth="1.7"
      />

      <path
        d="M12 14v3"
        stroke="currentColor"
        strokeWidth="1.7"
        strokeLinecap="round"
      />
    </svg>
  );
}