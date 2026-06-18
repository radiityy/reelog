import { LandingCta } from "@/components/LandingCta";
import { SiteFooter } from "@/components/SiteFooter";
import Link from "next/link";

const featuredPosters = ["01", "02", "03", "04", "05"];

export default function HomePage() {
  return (
    <main className="min-h-screen overflow-hidden bg-[#14110F] text-[#F2ECE4]">
      <section className="relative mx-auto flex min-h-screen w-full max-w-7xl flex-col px-6 py-8 md:px-10">
        <div className="absolute left-1/2 top-0 h-96 w-96 -translate-x-1/2 rounded-full bg-[#E8553E]/20 blur-3xl" />
        <div className="absolute bottom-10 right-0 h-80 w-80 rounded-full bg-[#F5A623]/10 blur-3xl" />

        <header className="relative z-10 flex items-center justify-between">
          <Link href="/" className="text-xl font-black tracking-tight">
            Reelog
          </Link>

          <nav className="hidden items-center gap-8 text-sm text-[#F2ECE4]/70 md:flex">
            <a href="#features" className="transition hover:text-[#F2ECE4]">
              Features
            </a>
            <a href="#preview" className="transition hover:text-[#F2ECE4]">
              Preview
            </a>
            <Link href="/login" className="transition hover:text-[#F2ECE4]">
              Sign in
            </Link>
          </nav>
        </header>

        <div className="relative z-10 grid flex-1 items-center gap-12 py-16 lg:grid-cols-[1.05fr_0.95fr]">
          <section>
            <div className="mb-6 inline-flex rounded-full border border-[#F2ECE4]/15 bg-[#F2ECE4]/5 px-4 py-2 text-xs uppercase tracking-[0.28em] text-[#F5A623]">
              Film & Series Diary
            </div>

            <h1 className="max-w-4xl text-5xl font-black leading-[0.95] tracking-tight md:text-7xl">
              Keep a diary of everything you watch.
            </h1>

            <p className="mt-6 max-w-2xl text-base leading-8 text-[#F2ECE4]/70 md:text-lg">
              Reelog helps you log films and series, rate what you watched,
              write short reviews, build your watchlist, and share a public
              profile with your personal Top 5.
            </p>

            <div className="mt-9 flex flex-col gap-3 sm:flex-row">
              <Link
                href="/login"
                className="rounded-full bg-[#E8553E] px-7 py-3 text-center font-bold text-white shadow-lg shadow-[#E8553E]/20 transition hover:-translate-y-0.5 hover:opacity-95"
              >
                Start your diary
              </Link>

              <a
                href="#preview"
                className="rounded-full border border-[#F2ECE4]/15 px-7 py-3 text-center font-semibold text-[#F2ECE4] transition hover:-translate-y-0.5 hover:bg-[#F2ECE4]/10"
              >
                See preview
              </a>
            </div>

            <div className="mt-12 grid max-w-xl grid-cols-3 gap-4 border-t border-[#F2ECE4]/10 pt-6">
              <div>
                <p className="font-mono text-2xl font-bold text-[#F5A623]">
                  128
                </p>
                <p className="mt-1 text-xs uppercase tracking-widest text-[#F2ECE4]/45">
                  Logged
                </p>
              </div>

              <div>
                <p className="font-mono text-2xl font-bold text-[#F5A623]">
                  4.6
                </p>
                <p className="mt-1 text-xs uppercase tracking-widest text-[#F2ECE4]/45">
                  Avg rating
                </p>
              </div>

              <div>
                <p className="font-mono text-2xl font-bold text-[#F5A623]">
                  Top 5
                </p>
                <p className="mt-1 text-xs uppercase tracking-widest text-[#F2ECE4]/45">
                  Curated
                </p>
              </div>
            </div>
          </section>

          <section id="preview" className="relative">
            <div className="mx-auto max-w-md rotate-1 rounded-[2rem] border border-[#F2ECE4]/15 bg-[#F2ECE4]/8 p-5 shadow-2xl shadow-black/40 backdrop-blur">
              <div className="mb-4 flex items-center justify-between">
                <p className="font-mono text-xs uppercase tracking-[0.25em] text-[#F5A623]">
                  Ticket Stub
                </p>
                <p className="font-mono text-xs text-[#F2ECE4]/40">
                  2026.06.18
                </p>
              </div>

              <div className="rounded-[1.5rem] border border-dashed border-[#F2ECE4]/20 bg-[#14110F]/80 p-5">
                <p className="text-sm text-[#F2ECE4]/50">Recently watched</p>

                <h2 className="mt-2 text-3xl font-black leading-tight">
                  Afterglow at Midnight
                </h2>

                <div className="mt-4 flex items-center gap-1 text-[#F5A623]">
                  ★ ★ ★ ★ <span className="text-[#F2ECE4]/35">★</span>
                </div>

                <p className="mt-5 text-sm leading-7 text-[#F2ECE4]/65">
                  A quiet film that stays with you after the credits. Soft,
                  strange, and somehow comforting.
                </p>

                <div className="mt-6 flex flex-wrap gap-2">
                  {["Drama", "Slow burn", "Comfort"].map((tag) => (
                    <span
                      key={tag}
                      className="rounded-full bg-[#F2ECE4]/10 px-3 py-1 text-xs text-[#F2ECE4]/70"
                    >
                      {tag}
                    </span>
                  ))}
                </div>
              </div>

              <div className="my-5 border-t border-dashed border-[#F2ECE4]/20" />

              <div>
                <p className="mb-3 text-xs uppercase tracking-[0.25em] text-[#F2ECE4]/45">
                  Your Top 5
                </p>

                <div className="grid grid-cols-5 gap-2">
                  {featuredPosters.map((item) => (
                    <div
                      key={item}
                      className="flex aspect-[2/3] items-end rounded-xl bg-gradient-to-b from-[#E8553E]/70 to-[#F5A623]/25 p-2"
                    >
                      <span className="font-mono text-xs font-bold">
                        {item}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </section>
        </div>

        <section
          id="features"
          className="relative z-10 grid gap-4 pb-10 md:grid-cols-3"
        >
          {[
            ["Log your watches", "Rate films and series with short reviews."],
            ["Build a watchlist", "Save what you want to watch next."],
            ["Share your profile", "Show your public diary and curated Top 5."],
          ].map(([title, desc]) => (
            <div
              key={title}
              className="rounded-3xl border border-[#F2ECE4]/10 bg-[#F2ECE4]/5 p-6 transition hover:-translate-y-1 hover:bg-[#F2ECE4]/10"
            >
              <h3 className="font-bold">{title}</h3>
              <p className="mt-2 text-sm leading-6 text-[#F2ECE4]/60">
                {desc}
              </p>
            </div>
          ))}
        </section>
      </section>

      <LandingCta />
      <SiteFooter />
    </main>
  );
}