import { FollowStatus } from "@prisma/client";
import type { ReactNode } from "react";
import Link from "next/link";
import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";

import { AppHeader } from "@/components/app/AppHeader";
import { AppNavigation } from "@/components/app/AppNavigation";
import { UserMenu } from "@/components/app/UserMenu";
import { getUserAvatarUrl } from "@/lib/avatar";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

type ProtectedLayoutProps = {
children: ReactNode;
};

export default async function ProtectedLayout({
children,
}: ProtectedLayoutProps) {
const session = await getServerSession(authOptions);

if (!session?.user?.id) {
redirect("/login");
}

const user = await prisma.user.findFirst({
where: {
id: session.user.id,
deletedAt: null,
suspendedAt: null,
},
select: {
id: true,
username: true,
name: true,
image: true,
avatarPath: true,
onboardingCompleted: true,
},
});

if (!user) {
redirect("/login");
}

if (
!user.onboardingCompleted ||
!user.username
) {
redirect("/onboarding");
}

const [avatarUrl, followRequestCount] =
await Promise.all([
Promise.resolve(
getUserAvatarUrl(
user.avatarPath,
user.image,
),
),
  prisma.follow.count({
    where: {
      followingId: user.id,
      status: FollowStatus.PENDING,
      follower: {
        onboardingCompleted: true,
        deletedAt: null,
        suspendedAt: null,
      },
    },
  }),
]);

return ( <div className="min-h-screen bg-[#080706] text-[#EDE8DE]"> <aside className="fixed inset-y-0 left-0 z-40 hidden w-[232px] flex-col border-r border-[#211E1B] bg-[#080706] px-4 py-6 lg:flex"> <Link
       href="/home"
       className="font-display px-3 text-[22px] font-bold tracking-tight"
     >
Reelog </Link>
    <p className="mt-2 px-3 text-xs text-[#514C47]">
      Your film &amp; series diary
    </p>

    <div className="mt-9 flex-1">
      <AppNavigation
        followRequestCount={
          followRequestCount
        }
      />
    </div>

    <UserMenu
      username={user.username}
      image={avatarUrl}
    />
  </aside>

  <div className="min-h-screen bg-[#12100E] lg:pl-[232px]">
    <AppHeader
      username={user.username}
      name={user.name}
      image={avatarUrl}
    />

    <main className="mx-auto min-h-[calc(100vh-72px)] w-full max-w-[1600px] px-5 pb-28 pt-8 sm:px-8 lg:px-10 lg:pb-12">
      {children}
    </main>
  </div>

  <div className="fixed inset-x-0 bottom-0 z-40 border-t border-[#302C28] bg-[#12100E]/95 backdrop-blur lg:hidden">
    <AppNavigation
      mobile
      followRequestCount={
        followRequestCount
      }
    />
  </div>
</div>
);
}
