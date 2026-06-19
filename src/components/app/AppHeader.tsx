"use client";

import {
  type FormEvent,
  useEffect,
  useRef,
  useState,
} from "react";
import { signOut } from "next-auth/react";
import {
  usePathname,
  useRouter,
  useSearchParams,
} from "next/navigation";

type HeaderUser = {
  username?: string | null;
  name?: string | null;
  image?: string | null;
};

type AppHeaderProps = {
  user?: HeaderUser;
  username?: string | null;
  name?: string | null;
  image?: string | null;
};

export function AppHeader({
  user,
  username,
  name,
  image,
}: AppHeaderProps) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const inputRef = useRef<HTMLInputElement>(null);
  const menuRef = useRef<HTMLDivElement>(null);

  const [query, setQuery] = useState(
    searchParams.get("q") ?? "",
  );
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isSigningOut, setIsSigningOut] = useState(false);

  const resolvedUsername = user?.username ?? username ?? null;
  const resolvedName = user?.name ?? name ?? null;
  const resolvedImage = user?.image ?? image ?? null;

  const accountLabel = resolvedUsername
    ? `@${resolvedUsername}`
    : resolvedName ?? "Account";

  const avatarInitial = (
    resolvedUsername ??
    resolvedName ??
    "R"
  )
    .charAt(0)
    .toUpperCase();

  useEffect(() => {
    setQuery(searchParams.get("q") ?? "");
  }, [searchParams]);

  useEffect(() => {
    function handlePointerDown(event: MouseEvent) {
      if (
        menuRef.current &&
        !menuRef.current.contains(event.target as Node)
      ) {
        setIsMenuOpen(false);
      }
    }

    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") {
        setIsMenuOpen(false);
      }
    }

    document.addEventListener("mousedown", handlePointerDown);
    window.addEventListener("keydown", handleKeyDown);

    return () => {
      document.removeEventListener(
        "mousedown",
        handlePointerDown,
      );
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, []);

  function handleSearch(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    const normalizedQuery = query.trim();

    if (!normalizedQuery) {
      router.push("/search");
      return;
    }

    router.push(
      `/search?q=${encodeURIComponent(normalizedQuery)}`,
    );
  }

  function handleClearSearch() {
    setQuery("");

    if (pathname === "/search" && searchParams.get("q")) {
      router.replace("/search", {
        scroll: false,
      });
    }

    window.requestAnimationFrame(() => {
      inputRef.current?.focus();
    });
  }

  async function handleSignOut() {
    setIsSigningOut(true);

    await signOut({
      callbackUrl: "/",
    });
  }

  return (
    <header className="sticky top-0 z-30 border-b border-[#27231F] bg-[#100E0C]/95 backdrop-blur-xl">
      <div className="flex h-[88px] items-center gap-4 px-5 md:px-8">
        <form
          onSubmit={handleSearch}
          className="flex min-w-0 flex-1"
        >
          <div className="flex h-12 w-full max-w-4xl items-center rounded-full border border-[#302C28] bg-[#211E1B] px-4 transition focus-within:border-[#4A4540] focus-within:bg-[#25211E]">
            <SearchIcon className="h-5 w-5 shrink-0 text-[#8A8580]" />

            <input
              ref={inputRef}
              type="search"
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="Search films and series"
              aria-label="Search films and series"
              className="min-w-0 flex-1 bg-transparent px-4 text-sm font-medium text-[#F4F1EB] outline-none placeholder:font-normal placeholder:text-[#625D58] [&::-webkit-search-cancel-button]:hidden [&::-webkit-search-decoration]:hidden"
            />

            {query ? (
              <button
                type="button"
                onClick={handleClearSearch}
                aria-label="Clear search"
                title="Clear search"
                className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-[#716B65] transition hover:bg-[#37322E] hover:text-[#F4F1EB] focus:outline-none focus:ring-2 focus:ring-[#C84B18]/40"
              >
                <CloseIcon className="h-[15px] w-[15px]" />
              </button>
            ) : null}
          </div>
        </form>

        <div ref={menuRef} className="relative shrink-0">
          <button
            type="button"
            onClick={() => setIsMenuOpen((current) => !current)}
            aria-expanded={isMenuOpen}
            aria-haspopup="menu"
            className="flex h-12 items-center gap-3 rounded-full border border-transparent bg-[#211E1B] p-1.5 pr-3 transition hover:border-[#302C28] hover:bg-[#292521]"
          >
            <span
              className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-[#9B7567] bg-cover bg-center text-sm font-semibold text-white"
              style={
                resolvedImage
                  ? {
                      backgroundImage: `url("${resolvedImage}")`,
                    }
                  : undefined
              }
            >
              {!resolvedImage ? avatarInitial : null}
            </span>

            <span className="hidden max-w-40 truncate text-sm font-semibold text-[#EDE8DE] sm:block">
              {accountLabel}
            </span>

            <ChevronIcon
              className={[
                "hidden h-3.5 w-3.5 text-[#8A8580] transition sm:block",
                isMenuOpen ? "rotate-180" : "",
              ].join(" ")}
            />
          </button>

          {isMenuOpen ? (
            <div
              role="menu"
              className="absolute right-0 top-[calc(100%+10px)] w-56 overflow-hidden rounded-xl border border-[#302C28] bg-[#1A1714] p-2 shadow-2xl shadow-black/50"
            >
              <div className="border-b border-[#302C28] px-3 py-3">
                <p className="truncate text-sm font-semibold text-[#F4F1EB]">
                  {accountLabel}
                </p>

                {resolvedName &&
                resolvedName !== resolvedUsername ? (
                  <p className="mt-1 truncate text-xs text-[#716B65]">
                    {resolvedName}
                  </p>
                ) : null}
              </div>

              <button
                type="button"
                role="menuitem"
                disabled={isSigningOut}
                onClick={handleSignOut}
                className="mt-2 flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-left text-sm text-[#C9C4BC] transition hover:bg-[#292521] hover:text-[#F4F1EB] disabled:cursor-not-allowed disabled:opacity-50"
              >
                <SignOutIcon className="h-4 w-4" />

                {isSigningOut ? "Signing out..." : "Sign out"}
              </button>
            </div>
          ) : null}
        </div>
      </div>
    </header>
  );
}

function SearchIcon({
  className = "",
}: {
  className?: string;
}) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      aria-hidden="true"
      className={className}
    >
      <circle
        cx="11"
        cy="11"
        r="6.5"
        stroke="currentColor"
        strokeWidth="1.8"
      />

      <path
        d="m16 16 4 4"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
      />
    </svg>
  );
}

function CloseIcon({
  className = "",
}: {
  className?: string;
}) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      aria-hidden="true"
      className={className}
    >
      <path
        d="M7.5 7.5 16.5 16.5M16.5 7.5l-9 9"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
      />
    </svg>
  );
}

function ChevronIcon({
  className = "",
}: {
  className?: string;
}) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      aria-hidden="true"
      className={className}
    >
      <path
        d="m8 10 4 4 4-4"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function SignOutIcon({
  className = "",
}: {
  className?: string;
}) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      aria-hidden="true"
      className={className}
    >
      <path
        d="M10 5H6.5A2.5 2.5 0 0 0 4 7.5v9A2.5 2.5 0 0 0 6.5 19H10"
        stroke="currentColor"
        strokeWidth="1.7"
        strokeLinecap="round"
      />

      <path
        d="M13 8.5 16.5 12 13 15.5M16 12H9"
        stroke="currentColor"
        strokeWidth="1.7"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}