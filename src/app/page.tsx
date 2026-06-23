import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";

import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import Link from "next/link";

const marqueeItems = [
  "Film Log",
  "Private Diary",
  "Watchlist",
  "Your Top 5",
  "Public Profile",
  "Your Reviews",
  "Now Showing",
];

const topFive = ["01", "02", "03", "04", "05"];

export default async function HomePage() {
  const session = await getServerSession(authOptions);

  if (session?.user?.id) {
    const user = await prisma.user.findUnique({
      where: {
        id: session.user.id,
      },
      select: {
        username: true,
        onboardingCompleted: true,
      },
    });

    if (!user) {
      redirect("/login");
    }

    if (!user.onboardingCompleted || !user.username) {
      redirect("/onboarding");
    }

    redirect("/home");
  }
  
  return (
    <main className="min-h-screen overflow-hidden bg-[#0C0A08] text-[#EDE8DE]">
      <header className="mx-auto flex w-full max-w-[1440px] items-center justify-between px-6 py-7 md:px-14">
        <Link
          href="/"
          className="font-display text-[22px] font-bold tracking-tight"
        >
          Reelog
        </Link>

        <nav className="hidden items-center gap-9 font-mono text-[10px] uppercase tracking-[0.14em] text-[#6E6862] md:flex">
          <a href="#features" className="transition hover:text-[#EDE8DE]">
            Features
          </a>

          <a href="#preview" className="transition hover:text-[#EDE8DE]">
            Preview
          </a>

          <Link href="/login" className="transition hover:text-[#EDE8DE]">
            Sign in
          </Link>
        </nav>

        <Link
          href="/login"
          className="font-mono text-[10px] uppercase tracking-[0.12em] text-[#C84B18] md:hidden"
        >
          Sign in
        </Link>
      </header>

      <section className="relative mx-auto grid min-h-[82vh] w-full max-w-[1440px] items-center gap-16 overflow-hidden px-6 pb-20 pt-10 md:px-14 lg:grid-cols-[1.05fr_0.95fr]">
        <div className="pointer-events-none absolute -right-20 -top-32 h-[580px] w-[580px] rounded-full bg-[radial-gradient(circle,rgba(200,75,24,0.14)_0%,rgba(200,75,24,0.04)_45%,transparent_70%)]" />

        <div className="relative z-10">
          <div className="mb-10 inline-flex items-center gap-3 rounded-sm border border-[#C84B18]/25 px-4 py-2 font-mono text-[10px] uppercase tracking-[0.14em] text-[#C84B18]">
            <span className="h-[5px] w-[5px] rounded-full bg-[#C84B18]" />
            Film & Series Diary
          </div>

          <h1 className="font-display max-w-3xl text-[52px] font-black leading-[0.96] tracking-[-0.03em] sm:text-[64px] lg:text-[82px]">
            Keep a diary
            <br />
            of every film
            <br />
            you&apos;ve{" "}
            <em className="font-bold text-[#C84B18]">loved.</em>
          </h1>

          <p className="mt-8 max-w-[430px] text-[15px] leading-7 text-[#6E6862]">
            Log what you watch, rate it honestly, write the review only you
            could write, and build a public profile that actually looks like
            you.
          </p>

          <div className="mt-10 flex flex-wrap items-center gap-6">
            <Link
              href="/login"
              className="rounded-[3px] bg-[#C84B18] px-7 py-4 font-mono text-[11px] font-bold uppercase tracking-[0.09em] text-[#EDE8DE] transition hover:bg-[#DC5520]"
            >
              Start your diary
            </Link>

            <a
              href="#preview"
              className="flex items-center gap-2 font-mono text-[11px] uppercase tracking-[0.09em] text-[#6E6862] transition hover:text-[#EDE8DE]"
            >
              See a preview
              <span className="text-[#C84B18]">→</span>
            </a>
          </div>

          <div className="mt-14 grid max-w-xl grid-cols-3 border-t border-[#252220] pt-8">
            <div>
              <p className="font-display text-4xl font-bold">128</p>
              <p className="mt-2 font-mono text-[9px] uppercase tracking-[0.14em] text-[#6E6862]">
                Sample logs
              </p>
            </div>

            <div className="border-l border-[#252220] pl-7">
              <p className="font-display text-4xl font-bold text-[#C84B18]">
                4.6
              </p>
              <p className="mt-2 font-mono text-[9px] uppercase tracking-[0.14em] text-[#6E6862]">
                Avg rating
              </p>
            </div>

            <div className="border-l border-[#252220] pl-7">
              <p className="font-display text-4xl font-bold">Top 5</p>
              <p className="mt-2 font-mono text-[9px] uppercase tracking-[0.14em] text-[#6E6862]">
                Curated
              </p>
            </div>
          </div>
        </div>

        <div
          id="preview"
          className="relative z-10 flex items-center justify-center"
        >
          <div className="group rotate-[2.5deg] transition duration-500 hover:rotate-0">
            <div className="w-[316px] overflow-hidden rounded-[10px] border border-[#252220] bg-[#111009] shadow-[0_36px_64px_rgba(0,0,0,0.75)]">
              <div className="h-[10px] border-b border-[#252220] bg-[repeating-linear-gradient(to_right,#252220_0px,#252220_14px,transparent_14px,transparent_24px)]" />

              <div className="flex items-center justify-between px-[22px] pb-2 pt-[18px]">
                <span className="font-mono text-[9px] uppercase tracking-[0.14em] text-[#C84B18]">
                  Ticket Stub
                </span>

                <span className="font-mono text-[9px] text-[#6E6862]">
                  2026.06.18
                </span>
              </div>

              <p className="px-[22px] pb-2 font-mono text-[9px] uppercase tracking-[0.1em] text-[#6E6862]">
                Recently watched
              </p>

              <h2 className="font-display px-[22px] text-[28px] font-bold leading-[1.1]">
                Afterglow
                <br />
                at Midnight
              </h2>

              <div className="flex gap-1 px-[22px] py-4 text-[#C84B18]">
                ★ ★ ★ ★ <span className="opacity-30">★</span>
              </div>

              <p className="px-[22px] pb-[18px] text-[12.5px] italic leading-[1.65] text-[#6E6862]">
                “A quiet film that stays with you after the credits. Soft,
                strange, and somehow comforting.”
              </p>

              <div className="relative border-t border-dashed border-[#2A2520] before:absolute before:-left-[10px] before:-top-[10px] before:h-5 before:w-5 before:rounded-full before:bg-[#0C0A08] after:absolute after:-right-[10px] after:-top-[10px] after:h-5 after:w-5 after:rounded-full after:bg-[#0C0A08]" />

              <div className="flex flex-wrap gap-2 px-[22px] py-4">
                {["Drama", "Slow burn", "Comfort"].map((tag) => (
                  <span
                    key={tag}
                    className="rounded-[2px] border border-[#252220] px-[10px] py-[5px] font-mono text-[8px] uppercase tracking-[0.06em] text-[#6E6862]"
                  >
                    {tag}
                  </span>
                ))}
              </div>

              <div className="px-[22px] pb-[22px]">
                <p className="mb-3 font-mono text-[9px] uppercase tracking-[0.12em] text-[#6E6862]">
                  Your Top 5
                </p>

                <div className="flex gap-[6px]">
                  {topFive.map((item, index) => (
                    <div
                      key={item}
                      className="flex aspect-[2/3] flex-1 items-end rounded-[3px] border border-[#252220] p-[6px]"
                      style={{
                        background:
                          index % 2 === 0
                            ? "linear-gradient(150deg,#251C11,#110E08)"
                            : "linear-gradient(150deg,#1E1A10,#0F0D08)",
                      }}
                    >
                      <span className="font-mono text-[7px] text-[#EDE8DE]/20">
                        {item}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <div className="overflow-hidden border-y border-[#252220] py-3">
        <div className="flex min-w-max animate-[marquee_24s_linear_infinite] whitespace-nowrap">
          {[...marqueeItems, ...marqueeItems].map((item, index) => (
            <div key={`${item}-${index}`} className="flex items-center">
              <span className="px-6 font-mono text-[10px] uppercase tracking-[0.14em] text-[#6E6862]">
                {item}
              </span>
              <span className="text-[#C84B18]">◆</span>
            </div>
          ))}
        </div>
      </div>

      <section
        id="features"
        className="mx-auto w-full max-w-[1440px] px-6 py-24 md:px-14"
      >
        <div className="mb-10 flex flex-col justify-between gap-6 md:flex-row md:items-end">
          <div>
            <p className="mb-4 font-mono text-[9px] uppercase tracking-[0.16em] text-[#C84B18]">
              What&apos;s in your diary
            </p>

            <h2 className="font-display text-5xl font-bold leading-[1.02] tracking-[-0.025em]">
              Three things
              <br />
              worth <em className="text-[#C84B18]">keeping.</em>
            </h2>
          </div>

          <p className="max-w-xs text-left text-sm leading-7 text-[#6E6862] md:text-right">
            Watch it and Keep it.
            <br />
            Make it yours.
          </p>
        </div>

        <div className="grid min-h-[580px] gap-2 lg:grid-cols-[1.2fr_1fr] lg:grid-rows-2">
          <FeatureDiaryCard />
          <FeatureWatchlistCard />
          <FeatureProfileCard />
        </div>
      </section>

      <section className="mx-auto w-full max-w-[1440px] px-6 pb-24 md:px-14">
        <div className="border-y border-[#252220] py-16 md:flex md:items-end md:justify-between">
          <div>
            <p className="font-mono text-[9px] uppercase tracking-[0.16em] text-[#C84B18]">
              Your next watch
            </p>

            <h2 className="font-display mt-4 max-w-3xl text-4xl font-bold leading-tight md:text-6xl">
              Your next favorite film deserves a place in your diary.
            </h2>
          </div>

          <Link
            href="/login"
            className="mt-8 inline-flex items-center gap-3 font-mono text-[11px] uppercase tracking-[0.1em] text-[#C84B18] md:mt-0"
          >
            Start your Reelog
            <span>→</span>
          </Link>
        </div>
      </section>

      <footer className="border-t border-[#252220]">
        <div className="mx-auto grid w-full max-w-[1440px] gap-10 px-6 py-12 md:grid-cols-[1.5fr_1fr_1fr] md:px-14">
          <div>
            <p className="font-display text-2xl font-bold">
              Reelog
            </p>

            <p className="mt-4 max-w-sm text-sm leading-7 text-[#6E6862]">
              A film and series diary for everything worth remembering.
            </p>
          </div>

          <FooterColumn
            title="Product"
            links={[
              ["Diary", "#features"],
              ["Watchlist", "#features"],
              ["Public profile", "#preview"],
            ]}
          />

          <FooterColumn
            title="Legal"
            links={[
              ["Privacy", "/privacy"],
              ["Terms", "/terms"],
            ]}
          />
        </div>

        <div className="mx-auto flex w-full max-w-[1440px] flex-col gap-3 border-t border-[#252220] px-6 py-5 font-mono text-[9px] uppercase tracking-[0.1em] text-[#6E6862] md:flex-row md:items-center md:justify-between md:px-14">
          <p>© 2026 Reelog</p>
          <p>Film data powered by TMDB</p>
        </div>
      </footer>
    </main>
  );
}

function FeatureCardShell({
  children,
  large = false,
}: {
  children: React.ReactNode;
  large?: boolean;
}) {
  return (
    <article
      className={[
        "group relative flex overflow-hidden rounded-xl border border-white/[0.04] bg-[#161310] p-8 transition duration-300 hover:-translate-y-0.5 hover:border-[#C84B18]/20",
        large ? "lg:row-span-2" : "",
      ].join(" ")}
    >
      {children}
    </article>
  );
}

function FeatureDiaryCard() {
  return (
    <FeatureCardShell large>
      <span className="font-display pointer-events-none absolute -right-2 -top-8 text-[220px] font-black italic leading-none text-[#EDE8DE]/[0.025]">
        01
      </span>

      <div className="relative z-10 flex w-full flex-col">
        <p className="font-mono text-[10px] tracking-[0.12em] text-[#C84B18]">
          01
        </p>

        <h3 className="font-display mt-5 text-4xl font-bold leading-[1.05]">
          Log every
          <br />
          watch
        </h3>

        <p className="mt-3 max-w-sm text-[13px] leading-6 text-[#6E6862]">
          Rate films and series with short, honest reviews. Your history, your
          voice, kept exactly as you left it.
        </p>

        <div className="mt-auto pt-10 transition duration-300 group-hover:-translate-y-1">
          <div className="overflow-hidden rounded-lg border border-[#252220] bg-[#111009]">
            <div className="h-2 border-b border-[#252220] bg-[repeating-linear-gradient(to_right,#252220_0px,#252220_12px,transparent_12px,transparent_22px)]" />

            <div className="p-5">
              <div className="mb-4 flex justify-between">
                <span className="font-mono text-[8px] uppercase tracking-[0.12em] text-[#C84B18]">
                  Recently logged
                </span>

                <span className="font-mono text-[8px] text-[#3E3A36]">
                  2026.06.18
                </span>
              </div>

              <h4 className="font-display text-2xl font-bold">
                Afterglow at Midnight
              </h4>

              <div className="my-3 text-sm text-[#C84B18]">
                ★ ★ ★ ★ <span className="opacity-30">★</span>
              </div>

              <p className="border-b border-dashed border-[#252220] pb-4 text-xs italic leading-6 text-[#6E6862]">
                “A quiet film that stays with you after the credits.”
              </p>

              <div className="mt-4 flex gap-2">
                {["Drama", "Slow burn", "Comfort"].map((tag) => (
                  <span
                    key={tag}
                    className="rounded-[2px] border border-[#252220] px-2 py-1 font-mono text-[8px] uppercase text-[#6E6862]"
                  >
                    {tag}
                  </span>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </FeatureCardShell>
  );
}

function FeatureWatchlistCard() {
  const items = [
    "The Zone of Interest",
    "Past Lives",
    "All of Us Strangers",
  ];

  return (
    <FeatureCardShell>
      <span className="font-display pointer-events-none absolute -right-2 -top-5 text-[160px] font-black italic leading-none text-[#EDE8DE]/[0.025]">
        02
      </span>

      <div className="relative z-10 flex w-full flex-col">
        <p className="font-mono text-[10px] tracking-[0.12em] text-[#C84B18]">
          02
        </p>

        <h3 className="font-display mt-4 text-3xl font-bold leading-tight">
          Build your watchlist
        </h3>

        <p className="mt-2 text-[13px] leading-6 text-[#6E6862]">
          Save what you want to see next, all in one place.
        </p>

        <div className="mt-auto pt-7 transition duration-300 group-hover:-translate-y-1">
          <div className="rounded-lg border border-[#252220] bg-[#111009] p-4">
            <div className="mb-4 flex justify-between border-b border-[#252220] pb-3">
              <span className="font-mono text-[8px] uppercase tracking-[0.12em] text-[#6E6862]">
                Watchlist
              </span>

              <span className="font-mono text-[8px] text-[#C84B18]">
                15 saved
              </span>
            </div>

            <div className="space-y-3">
              {items.map((item) => (
                <div
                  key={item}
                  className="flex items-center gap-3 text-xs text-[#EDE8DE]"
                >
                  <span className="h-2 w-2 rounded-full border border-[#3E3A36]" />
                  {item}
                </div>
              ))}

              <p className="font-mono text-[9px] text-[#6E6862]">+ 12 more</p>
            </div>
          </div>
        </div>
      </div>
    </FeatureCardShell>
  );
}

function FeatureProfileCard() {
  return (
    <FeatureCardShell>
      <span className="font-display pointer-events-none absolute -right-2 -top-5 text-[160px] font-black italic leading-none text-[#EDE8DE]/[0.025]">
        03
      </span>

      <div className="relative z-10 flex w-full flex-col">
        <p className="font-mono text-[10px] tracking-[0.12em] text-[#C84B18]">
          03
        </p>

        <h3 className="font-display mt-4 text-3xl font-bold leading-tight">
          Show your taste
        </h3>

        <p className="mt-2 text-[13px] leading-6 text-[#6E6862]">
          A public diary and curated Top 5 without the noise.
        </p>

        <div className="mt-auto pt-7 transition duration-300 group-hover:-translate-y-1">
          <div className="rounded-lg border border-[#252220] bg-[#111009] p-4">
            <div className="mb-4 flex items-center gap-3 border-b border-[#252220] pb-4">
              <div className="font-display flex h-8 w-8 items-center justify-center rounded-full border border-[#252220] bg-gradient-to-br from-[#3A2010] to-[#1F1208] text-xs text-[#6E6862]">
                M
              </div>

              <div>
                <p className="font-mono text-[10px]">@mira.watches</p>
                <p className="mt-1 font-mono text-[8px] text-[#6E6862]">
                  128 films · 4.6 avg
                </p>
              </div>
            </div>

            <p className="mb-3 font-mono text-[8px] uppercase tracking-[0.12em] text-[#6E6862]">
              Your Top 5
            </p>

            <div className="flex gap-1.5">
              {topFive.map((item, index) => (
                <div
                  key={item}
                  className="flex aspect-[2/3] flex-1 items-end rounded-[3px] border border-[#252220] p-1.5 transition duration-300 group-hover:-translate-y-0.5"
                  style={{
                    background: [
                      "linear-gradient(160deg,#2E1A0A,#140C05)",
                      "linear-gradient(160deg,#1E1A10,#100E07)",
                      "linear-gradient(160deg,#281608,#140A04)",
                      "linear-gradient(160deg,#221E14,#110E08)",
                      "linear-gradient(160deg,#1A1612,#0E0C08)",
                    ][index],
                  }}
                >
                  <span className="font-mono text-[7px] text-[#EDE8DE]/20">
                    {item}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </FeatureCardShell>
  );
}

function FooterColumn({
  title,
  links,
}: {
  title: string;
  links: [string, string][];
}) {
  return (
    <div>
      <p className="font-mono text-[9px] uppercase tracking-[0.14em] text-[#C84B18]">
        {title}
      </p>

      <div className="mt-4 flex flex-col gap-3">
        {links.map(([label, href]) => (
          <Link
            key={label}
            href={href}
            className="text-sm text-[#6E6862] transition hover:text-[#EDE8DE]"
          >
            {label}
          </Link>
        ))}
      </div>
    </div>
  );
}