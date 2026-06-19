import { getServerSession } from "next-auth";
import { notFound, redirect } from "next/navigation";

import { DiaryEntryForm } from "@/components/diary/DiaryEntryForm";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import {
  getTmdbTitleDetails,
  type TmdbMediaType,
} from "@/lib/tmdb";

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

  const tmdbId = Number(params.tmdbId);

  if (!Number.isInteger(tmdbId) || tmdbId <= 0) {
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
    },
  });

  if (!user) {
    redirect("/login");
  }

  let media;

  try {
    media = await getTmdbTitleDetails(
      params.mediaType as TmdbMediaType,
      tmdbId,
    );
  } catch {
    notFound();
  }

  const today = new Date().toISOString().slice(0, 10);

  return (
    <DiaryEntryForm
      media={media}
      defaultIsPublic={
        user.defaultDiaryVisibility === "PUBLIC"
      }
      defaultWatchedAt={today}
    />
  );
}