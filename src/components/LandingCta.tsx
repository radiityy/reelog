import Link from "next/link";

export function LandingCta() {
  return (
    <section className="relative z-10 mx-auto w-full max-w-7xl px-6 pb-10 md:px-10">
      <div className="overflow-hidden rounded-[2rem] border border-[#F2ECE4]/10 bg-[#F2ECE4]/5 p-7 shadow-2xl shadow-black/20 md:p-10">
        <div className="flex flex-col gap-7 md:flex-row md:items-center md:justify-between">
          <div>
            <p className="font-mono text-xs font-bold uppercase tracking-[0.25em] text-[#F5A623]">
              Start your diary
            </p>

            <h2 className="mt-3 max-w-2xl text-3xl font-black tracking-tight md:text-4xl">
              Keep every film night, series binge, and favorite moment in one place.
            </h2>

            <p className="mt-4 max-w-xl text-sm leading-7 text-[#F2ECE4]/60">
              Log what you watch, save what comes next, and share your taste through
              a public Reelog profile.
            </p>
          </div>

          <Link
            href="/login"
            className="shrink-0 rounded-full bg-[#E8553E] px-7 py-3.5 text-center text-sm font-black text-white shadow-lg shadow-[#E8553E]/20 transition hover:-translate-y-0.5 hover:opacity-95"
          >
            Continue with Google
          </Link>
        </div>
      </div>
    </section>
  );
}