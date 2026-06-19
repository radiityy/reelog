"use client";

import Link from "next/link";
import { signOut } from "next-auth/react";
import { useRouter } from "next/navigation";
import { FormEvent, useEffect, useRef, useState } from "react";

type AppHeaderProps = {
  username: string;
  image: string | null;
};

function SearchIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      className="h-5 w-5"
      aria-hidden="true"
    >
      <circle cx="11" cy="11" r="7" />
      <path d="m20 20-4-4" />
    </svg>
  );
}

export function AppHeader({ username, image }: AppHeaderProps) {
  const router = useRouter();
  const menuRef = useRef<HTMLDivElement>(null);

  const [query, setQuery] = useState("");
  const [menuOpen, setMenuOpen] = useState(false);

  const initial = username.charAt(0).toUpperCase();

  useEffect(() => {
    function handleOutsideClick(event: MouseEvent) {
      if (
        menuRef.current &&
        !menuRef.current.contains(event.target as Node)
      ) {
        setMenuOpen(false);
      }
    }

    function handleEscape(event: KeyboardEvent) {
      if (event.key === "Escape") {
        setMenuOpen(false);
      }
    }

    document.addEventListener("mousedown", handleOutsideClick);
    document.addEventListener("keydown", handleEscape);

    return () => {
      document.removeEventListener("mousedown", handleOutsideClick);
      document.removeEventListener("keydown", handleEscape);
    };
  }, []);

  function handleSearch(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    const normalizedQuery = query.trim();

    if (!normalizedQuery) {
      router.push("/search");
      return;
    }

    router.push(`/search?q=${encodeURIComponent(normalizedQuery)}`);
  }

  return (
    <header className="sticky top-0 z-40 border-b border-[#211E1B] bg-[#12100E]/95 backdrop-blur">
      <div className="flex h-[72px] items-center gap-3 px-4 sm:px-6 lg:px-8">
        <Link
          href="/home"
          className="font-display shrink-0 text-xl font-bold lg:hidden"
        >
          Reelog
        </Link>

        <form
          onSubmit={handleSearch}
          className="mx-auto flex w-full max-w-2xl items-center gap-3 rounded-full border border-[#302C28] bg-[#211E1B] px-5 py-3 text-[#8A8580] transition focus-within:border-[#EDE8DE]/40 focus-within:bg-[#27231F]"
        >
          <SearchIcon />

          <input
            type="search"
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Search films and series"
            aria-label="Search films and series"
            className="min-w-0 flex-1 bg-transparent text-sm text-[#EDE8DE] outline-none placeholder:text-[#8A8580]"
          />
        </form>

        <div ref={menuRef} className="relative shrink-0">
          <button
            type="button"
            onClick={() => setMenuOpen((current) => !current)}
            aria-expanded={menuOpen}
            aria-label="Open account menu"
            className="flex items-center gap-2 rounded-full bg-[#211E1B] p-1.5 pr-2 transition hover:bg-[#2B2723]"
          >
            <div
              className="flex h-8 w-8 items-center justify-center rounded-full bg-[#302C28] bg-cover bg-center text-xs font-bold text-[#C84B18]"
              style={
                image
                  ? {
                      backgroundImage: `url("${image}")`,
                    }
                  : undefined
              }
            >
              {!image ? initial : null}
            </div>

            <span className="hidden max-w-32 truncate text-xs font-medium text-[#EDE8DE] sm:block">
              @{username}
            </span>

            <span className="hidden text-[10px] text-[#8A8580] sm:block">
              ▾
            </span>
          </button>

          {menuOpen ? (
            <div className="absolute right-0 top-full mt-2 w-56 rounded-lg border border-[#302C28] bg-[#211E1B] p-2 shadow-2xl shadow-black/40">
              <div className="border-b border-[#302C28] px-3 py-3">
                <p className="truncate text-sm font-medium text-[#EDE8DE]">
                  @{username}
                </p>

                <p className="mt-1 text-xs text-[#8A8580]">
                  Signed in to Reelog
                </p>
              </div>

              <button
                type="button"
                onClick={() =>
                  signOut({
                    callbackUrl: "/",
                  })
                }
                className="mt-2 w-full rounded-md px-3 py-2.5 text-left text-sm text-[#C9C4BC] transition hover:bg-[#302C28] hover:text-[#EDE8DE]"
              >
                Sign out
              </button>
            </div>
          ) : null}
        </div>
      </div>
    </header>
  );
}