import { getServerSession } from "next-auth";
import { notFound, redirect } from "next/navigation";

import { DiaryEntryForm } from "@/components/diary/DiaryEntryForm";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import {
  getTmdbTitleDetails,
  type TmdbTitleDetails,
} from "@/lib/tmdb";

export const dynamic = "force-dynamic";

type EditDiaryPageProps = {
  params: {
    id: string;
  };
};

export default async function EditDiaryPage({
  params,
}: EditDiaryPageProps) {
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
      tmdbId: true,
      mediaType: true,
      title: true,
      posterPath: true,
      watchedAt: true,
      rating: true,
      isRewatch: true,
      review: true,
      privateNotes: true,
      spoiler: true,
      isPublic: true,
      reviewIsPublic: true,
    },
  });

  if (!entry) {
    notFound();
  }

  let media: TmdbTitleDetails;

  try {
    media = await getTmdbTitleDetails(
      entry.mediaType,
      entry.tmdbId,
    );
  } catch (error) {
    console.error(
      "Failed to load TMDB details for diary edit:",
      error,
    );

  media = {
    id: entry.tmdbId,
    mediaType: entry.mediaType,
    title: entry.title,
    overview: "",
    posterPath: entry.posterPath,
    backdropPath: null,
    releaseDate: null,
    rating: 0,
    voteCount: 0,
    genres: [],
    runtimeMinutes: null,
    episodeRuntimeMinutes: null,
    numberOfEpisodes: null,
    numberOfSeasons: null,
    status: null,
  };
  }

  const watchedAt = entry.watchedAt
    .toISOString()
    .slice(0, 10);

  return (
    <DiaryEntryForm
      media={media}
      mode="edit"
      entryId={entry.id}
      defaultIsPublic={entry.isPublic}
      defaultWatchedAt={watchedAt}
      initialValues={{
        watchedAt,
        rating: entry.rating,
        isRewatch: entry.isRewatch,
        review: entry.review ?? "",
        privateNotes: entry.privateNotes ?? "",
        spoiler: entry.spoiler,
        isPublic: entry.isPublic,
        reviewIsPublic: entry.reviewIsPublic,
      }}
    />
  );
}