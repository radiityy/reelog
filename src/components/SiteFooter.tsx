import Link from "next/link";

const productLinks = [
  { label: "Diary", href: "#features" },
  { label: "Watchlist", href: "#features" },
  { label: "Public Profile", href: "#preview" },
  { label: "Top 5", href: "#preview" },
];

const resourceLinks = [
  { label: "Privacy", href: "/privacy" },
  { label: "Terms", href: "/terms" },
];

export function SiteFooter() {
  return (
    <footer className="relative z-10 border-t border-[#F2ECE4]/10 bg-[#0f0c0b]">
      <div className="mx-auto grid w-full max-w-7xl gap-10 px-6 py-10 md:grid-cols-[1.4fr_0.8fr_0.8fr] md:px-10">
        <div>
          <Link href="/" className="inline-flex items-center gap-2">
            <span className="grid h-9 w-9 place-items-center rounded-2xl bg-[#E8553E] text-sm font-black text-white">
              R
            </span>
            <span className="text-xl font-black tracking-tight text-[#F2ECE4]">
              Reelog
            </span>
          </Link>

          <p className="mt-4 max-w-md text-sm leading-7 text-[#F2ECE4]/55">
            A film & series diary for everything you watch. Log your favorites,
            save your watchlist, and share your taste.
          </p>
        </div>

        <div>
          <p className="font-mono text-xs font-bold uppercase tracking-[0.25em] text-[#F5A623]">
            Product
          </p>

          <div className="mt-4 grid gap-3">
            {productLinks.map((link) => (
              <Link
                key={link.label}
                href={link.href}
                className="text-sm text-[#F2ECE4]/55 transition hover:text-[#F2ECE4]"
              >
                {link.label}
              </Link>
            ))}
          </div>
        </div>

        <div>
          <p className="font-mono text-xs font-bold uppercase tracking-[0.25em] text-[#F5A623]">
            Resources
          </p>

          <div className="mt-4 grid gap-3">
            {resourceLinks.map((link) => (
              <Link
                key={link.label}
                href={link.href}
                className="text-sm text-[#F2ECE4]/55 transition hover:text-[#F2ECE4]"
              >
                {link.label}
              </Link>
            ))}
          </div>
        </div>
      </div>

      <div className="mx-auto flex w-full max-w-7xl flex-col gap-3 border-t border-[#F2ECE4]/10 px-6 py-5 text-xs text-[#F2ECE4]/40 md:flex-row md:items-center md:justify-between md:px-10">
        <p>© 2026 Reelog. Built for movie nights.</p>
        <p>Film data powered by TMDB.</p>
      </div>
    </footer>
  );
}