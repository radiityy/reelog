import Link from "next/link";
import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";

import { OnboardingForm } from "@/components/onboarding/OnboardingForm";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export default async function OnboardingPage() {
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
      username: true,
      onboardingCompleted: true,
    },
  });

  if (!user) {
    redirect("/login");
  }

  if (user.onboardingCompleted) {
    redirect("/");
  }

  return (
    <main className="grid min-h-screen bg-[#0C0A08] text-[#EDE8DE] lg:grid-cols-[0.9fr_1.1fr]">
      <section className="relative hidden overflow-hidden border-r border-[#252220] p-14 lg:flex lg:flex-col">
        <div className="pointer-events-none absolute -bottom-48 -left-36 h-[500px] w-[500px] rounded-full bg-[radial-gradient(circle,rgba(200,75,24,0.12)_0%,transparent_68%)]" />

        <Link
          href="/"
          className="font-display relative z-10 text-[22px] font-bold"
        >
          Reelog
        </Link>

        <div className="relative z-10 flex flex-1 flex-col justify-center">
          <div className="mb-8 inline-flex w-max items-center gap-3 rounded-sm border border-[#C84B18]/25 px-4 py-2 font-mono text-[10px] uppercase tracking-[0.14em] text-[#C84B18]">
            <span className="h-[5px] w-[5px] rounded-full bg-[#C84B18]" />
            One last detail
          </div>

          <h1 className="font-display text-[58px] font-black leading-[0.97] tracking-[-0.03em]">
            Give your
            <br />
            diary a name
            <br />
            people can
            <br />
            <em className="font-bold text-[#C84B18]">remember.</em>
          </h1>

          <p className="mt-8 max-w-sm text-sm leading-7 text-[#6E6862]">
            Your username becomes the address of your public profile. You can
            decide what to share later.
          </p>
        </div>
      </section>

      <section className="flex min-h-screen items-center justify-center px-6 py-12 lg:px-14">
        <div className="w-full max-w-[420px]">
          <Link
            href="/"
            className="font-display mb-16 block text-[22px] font-bold lg:hidden"
          >
            Reelog
          </Link>

          <p className="font-mono text-[9px] uppercase tracking-[0.14em] text-[#C84B18]">
            Set up your profile
          </p>

          <h2 className="font-display mt-4 text-[44px] font-bold leading-[1.05] tracking-[-0.025em]">
            Choose your
            <br />
            username.
          </h2>

          <p className="mt-5 text-sm leading-7 text-[#6E6862]">
            This is how people will find your Reelog profile. Usernames must be
            unique.
          </p>

          <OnboardingForm initialUsername={user.username ?? ""} />
        </div>
      </section>
    </main>
  );
}