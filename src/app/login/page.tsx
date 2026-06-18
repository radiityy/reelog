"use client";

import Link from "next/link";
import { signIn } from "next-auth/react";

export default function LoginPage() {
  return (
    <main className="min-h-screen bg-[#14110F] text-[#F2ECE4]">
      <div className="mx-auto grid min-h-screen max-w-6xl grid-cols-1 items-center gap-10 px-6 py-8 lg:grid-cols-[0.95fr_1.05fr] lg:px-10">
        <section className="hidden lg:block">
          <Link href="/" className="text-xl font-black tracking-tight">
            Reelog
          </Link>

          <div className="mt-14 max-w-xl">
            <p className="mb-5 inline-flex rounded-full border border-[#F2ECE4]/15 bg-[#F2ECE4]/5 px-4 py-2 text-xs uppercase tracking-[0.28em] text-[#F5A623]">
              Welcome back
            </p>

            <h1 className="text-6xl font-black leading-[0.95] tracking-tight">
              Your watch history deserves a better home.
            </h1>

            <p className="mt-6 text-base leading-8 text-[#F2ECE4]/65">
              Log what you watch, keep your reviews, curate your Top 5, and
              share your taste through a public profile.
            </p>
          </div>

          <div className="mt-12 rounded-[2rem] border border-[#F2ECE4]/10 bg-[#F2ECE4]/5 p-5">
            <div className="flex items-center justify-between border-b border-dashed border-[#F2ECE4]/15 pb-4">
              <p className="font-mono text-xs uppercase tracking-[0.25em] text-[#F5A623]">
                Last ticket
              </p>
              <p className="font-mono text-xs text-[#F2ECE4]/40">4.5 / 5</p>
            </div>

            <p className="mt-5 text-2xl font-black">The quiet one</p>
            <p className="mt-3 text-sm leading-7 text-[#F2ECE4]/60">
              “The kind of story that feels small at first, then follows you
              home.”
            </p>
          </div>
        </section>

        <section className="mx-auto w-full max-w-md">
          <div className="mb-8 flex items-center justify-between lg:hidden">
            <Link href="/" className="text-xl font-black tracking-tight">
              Reelog
            </Link>
          </div>

          <div className="rounded-[2rem] border border-[#F2ECE4]/12 bg-[#F2ECE4]/6 p-7 shadow-2xl shadow-black/40 backdrop-blur md:p-9">
            <p className="font-mono text-xs uppercase tracking-[0.28em] text-[#F5A623]">
              Sign in
            </p>

            <h1 className="mt-4 text-3xl font-black tracking-tight">
              Continue to Reelog
            </h1>

            <p className="mt-3 text-sm leading-6 text-[#F2ECE4]/60">
              Use your Google account to start your private diary, watchlist,
              and public profile.
            </p>

            <button
              type="button"
              onClick={() => signIn("google", { callbackUrl: "/" })}
              className="mt-8 flex w-full items-center justify-center gap-3 rounded-full bg-[#F2ECE4] px-5 py-3 font-bold text-[#14110F] transition hover:-translate-y-0.5 hover:bg-white"
            >
              <span className="flex h-6 w-6 items-center justify-center rounded-full bg-white text-sm shadow-sm">
                G
              </span>
              Continue with Google
            </button>

            <div className="my-7 flex items-center gap-3">
              <div className="h-px flex-1 bg-[#F2ECE4]/10" />
              <span className="text-xs uppercase tracking-widest text-[#F2ECE4]/35">
                Reelog
              </span>
              <div className="h-px flex-1 bg-[#F2ECE4]/10" />
            </div>

            <p className="text-xs leading-6 text-[#F2ECE4]/45">
              By continuing, you agree to Reelog&apos;s future Terms and Privacy
              Policy. Your diary visibility can be managed during onboarding.
            </p>
          </div>

          <p className="mt-6 text-center text-sm text-[#F2ECE4]/50">
            Just looking around?{" "}
            <Link href="/" className="font-semibold text-[#F5A623]">
              Back to home
            </Link>
          </p>
        </section>
      </div>
    </main>
  );
}