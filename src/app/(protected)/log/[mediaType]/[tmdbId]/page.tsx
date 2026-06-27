import { getServerSession } from "next-auth";
import Link from "next/link";
import { notFound, redirect } from "next/navigation";

import { DiaryEntryForm } from "@/components/diary/DiaryEntryForm";
import { FeaturedFilmButton } from "@/components/profile/FeaturedFilmButton";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import {
  getTmdbTitleDetails,
  type TmdbMediaType,
} from "@/lib/tmdb";

export const dynamic = "force-dynamic";

type LogTitlePageProps = {
  params: {
    mediaType: string;
    tmdbId: string;
  };
};

export default async function LogTitlePage({
  params,
}: LogTitlePageProps) {
  const session = await getServerSession(authOptions);

  if (!session?.user?.id) {
    redirect("/login");
  }

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
    tmdbId <= 0
  ) {
    notFound();
  }

  const user = await prisma.user.findFirst({
    where: {
      id: session.user.id,
      deletedAt: null,
      suspendedAt: null,
      onboardingCompleted: true,
    },
    select: {
      defaultDiaryVisibility: true,
      username: true,
    },
  });

  if (!user?.username) {
    redirect("/onboarding");
  }

  let media;

  try {
    media = await getTmdbTitleDetails(
      mediaType,
      tmdbId,
    );
  } catch {
    notFound();
  }

  const today = new Date()
    .toISOString()
    .slice(0, 10);

  return (
    <div>
      <section className="mb-8 overflow-hidden rounded-2xl border border-[#302C28] bg-[#171411]">
        <div className="flex flex-col gap-5 px-5 py-5 sm:flex-row sm:items-center sm:justify-between sm:px-6">
          <div className="min-w-0">
            <p className="text-xs font-semibold uppercase tracking-[0.16em] text-[#C84B18]">
              Profile favorite
            </p>

            <h2 className="mt-2 truncate text-lg font-semibold text-[#F4F1EB]">
              Add {media.title} to your Top 5
            </h2>

            <p className="mt-1 max-w-xl text-sm leading-6 text-[#8A8580]">
              Feature this title on your Reelog
              profile, new titles are placed in
              the last available position.
            </p>
          </div>

          <div className="flex shrink-0 flex-col gap-2 sm:items-end">
            <FeaturedFilmButton
              tmdbId={media.id}
              mediaType={media.mediaType}
              title={media.title}
              fullWidth
            />

            <Link
              href="/featured-films"
              className="text-center text-xs font-medium text-[#8A8580] transition hover:text-[#E45A1C]"
            >
              Manage your Top 5
            </Link>
          </div>
        </div>
      </section>

      <DiaryEntryForm
        media={media}
        defaultIsPublic={
          user.defaultDiaryVisibility ===
          "PUBLIC"
        }
        defaultWatchedAt={today}
      />
    </div>
  );
}