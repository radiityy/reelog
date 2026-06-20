import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";

import { AccountSettingsForm } from "@/components/settings/AccountSettingsForm";
import { getUserAvatarUrl } from "@/lib/avatar";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export default async function SettingsPage() {
  const session = await getServerSession(authOptions);

  if (!session?.user?.id) {
    redirect("/login");
  }

  const user = await prisma.user.findFirst({
    where: {
      id: session.user.id,
      deletedAt: null,
      suspendedAt: null,
      onboardingCompleted: true,
    },
    select: {
      name: true,
      username: true,
      email: true,
      image: true,
      avatarPath: true,
      bio: true,
      socialLink: true,
      isPublic: true,
      defaultDiaryVisibility: true,
    },
  });

  if (!user?.username || !user.email) {
    redirect("/onboarding");
  }

  const avatarUrl = getUserAvatarUrl(
    user.avatarPath,
    user.image,
  );

  return (
    <div className="mx-auto max-w-4xl">
      <section>
        <h1 className="text-3xl font-bold tracking-tight text-[#F4F1EB]">
          Account settings
        </h1>

        <p className="mt-2 text-sm leading-6 text-[#8A8580]">
          Manage your profile, privacy, and diary preferences.
        </p>
      </section>

      <div className="mt-8">
        <AccountSettingsForm
          initialValues={{
            name: user.name ?? "",
            username: user.username,
            email: user.email,
            image: avatarUrl,
            hasCustomAvatar: Boolean(user.avatarPath),
            bio: user.bio ?? "",
            socialLink: user.socialLink ?? "",
            isPublic: user.isPublic,
            defaultDiaryVisibility:
              user.defaultDiaryVisibility,
          }}
        />
      </div>
    </div>
  );
}
