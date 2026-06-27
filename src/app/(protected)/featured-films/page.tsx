import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";

import { FeaturedFilmsManager } from "@/components/profile/FeaturedFilmsManager";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

export default async function FeaturedFilmsPage() {
  const session = await getServerSession(
    authOptions,
  );

  if (!session?.user?.id) {
    redirect("/login");
  }

  const user = await prisma.user.findFirst({
    where: {
      id: session.user.id,
      onboardingCompleted: true,
      deletedAt: null,
      suspendedAt: null,
    },
    select: {
      id: true,
      username: true,
    },
  });

  if (!user?.username) {
    redirect("/onboarding");
  }

  const initialItems =
    await prisma.featuredFilm.findMany({
      where: {
        userId: user.id,
      },
      orderBy: {
        position: "asc",
      },
      select: {
        id: true,
        tmdbId: true,
        mediaType: true,
        title: true,
        posterPath: true,
        position: true,
      },
    });

  return (
    <FeaturedFilmsManager
      initialItems={initialItems}
    />
  );
}