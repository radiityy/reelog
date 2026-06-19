"use client";

import Link from "next/link";
import { signIn } from "next-auth/react";

function GoogleIcon() {
  return (
    <svg viewBox="0 0 24 24" className="h-5 w-5" aria-hidden="true">
      <path
        fill="#4285F4"
        d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
      />
      <path
        fill="#34A853"
        d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
      />
      <path
        fill="#FBBC05"
        d="M5.84 14.1c-.22-.66-.35-1.36-.35-2.1s.13-1.44.35-2.1V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l3.66-2.84z"
      />
      <path
        fill="#EA4335"
        d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06L5.84 9.9C6.71 7.3 9.14 5.38 12 5.38z"
      />
    </svg>
  );
}

export default function LoginPage() {
  return (
    <main className="grid min-h-screen bg-[#0C0A08] text-[#EDE8DE] lg:grid-cols-2">
      <section className="relative hidden overflow-hidden border-r border-[#252220] p-14 lg:flex lg:flex-col">
        <div className="pointer-events-none absolute -bottom-48 -left-40 h-[460px] w-[460px] rounded-full bg-[radial-gradient(circle,rgba(200,75,24,0.10)_0%,transparent_65%)]" />

        <Link
          href="/"
          className="font-display relative z-10 text-[22px] font-bold"
        >
          Reelog
        </Link>

        <div className="relative z-10 flex flex-1 flex-col justify-center pt-12">
          <div className="mb-8 inline-flex w-max items-center gap-3 rounded-sm border border-[#C84B18]/25 px-4 py-2 font-mono text-[10px] uppercase tracking-[0.14em] text-[#C84B18]">
            <span className="h-[5px] w-[5px] rounded-full bg-[#C84B18]" />
            Welcome back
          </div>

          <h1 className="font-display text-[58px] font-black leading-[0.97] tracking-[-0.03em]">
            Your watch
            <br />
            history
            <br />
            deserves a
            <br />
            <em className="font-bold text-[#C84B18]">better home.</em>
          </h1>

          <div className="mt-12 max-w-[340px] rounded-md border border-[#252220] bg-[#181511] p-6">
            <div className="mb-4 flex justify-between">
              <span className="font-mono text-[9px] uppercase tracking-[0.12em] text-[#C84B18]">
                Last ticket
              </span>

              <span className="font-mono text-[9px] text-[#6E6862]">
                4.5 / 5
              </span>
            </div>

            <h2 className="font-display text-xl font-bold">The Quiet One</h2>

            <p className="mt-3 text-xs italic leading-6 text-[#6E6862]">
              “The kind of story that feels small at first, then follows you
              home.”
            </p>
          </div>
        </div>
      </section>

      <section className="flex min-h-screen items-center justify-center px-6 py-12 lg:px-14">
        <div className="w-full max-w-[356px]">
          <Link
            href="/"
            className="font-display mb-16 block text-[22px] font-bold lg:hidden"
          >
            Reelog
          </Link>

          <p className="font-mono text-[9px] uppercase tracking-[0.14em] text-[#C84B18]">
            Sign in
          </p>

          <h1 className="font-display mt-4 text-[42px] font-bold leading-[1.08] tracking-[-0.025em]">
            Continue
            <br />
            to Reelog
          </h1>

          <p className="mt-4 text-sm leading-7 text-[#6E6862]">
            Use your Google account to start your private diary, watchlist, and
            public profile.
          </p>

          <button
            type="button"
            onClick={() => signIn("google", { callbackUrl: "/onboarding" })}
            className="mt-10 flex w-full items-center justify-center gap-3 rounded-[3px] bg-[#EDE8DE] px-6 py-4 text-sm font-medium text-[#1A1410] transition hover:bg-[#F4EFE5]"
          >
            <GoogleIcon />
            Continue with Google
          </button>

          <div className="my-7 flex items-center gap-4">
            <div className="h-px flex-1 bg-[#252220]" />
            <span className="font-mono text-[9px] uppercase tracking-[0.1em] text-[#6E6862]">
              Reelog
            </span>
            <div className="h-px flex-1 bg-[#252220]" />
          </div>

          <p className="text-center text-[11.5px] leading-6 text-[#6E6862]">
            By continuing, you agree to Reelog&apos;s{" "}
            <Link href="/terms" className="text-[#C84B18]">
              Terms of Service
            </Link>{" "}
            and{" "}
            <Link href="/privacy" className="text-[#C84B18]">
              Privacy Policy
            </Link>
            .
            <br />
            You&apos;ll choose your diary visibility during onboarding.
          </p>

          <p className="mt-8 text-center text-sm text-[#6E6862]">
            Just looking around?{" "}
            <Link
              href="/"
              className="font-mono text-[10px] tracking-[0.06em] text-[#C84B18]"
            >
              Back to home →
            </Link>
          </p>
        </div>
      </section>
    </main>
  );
}