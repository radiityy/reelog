"use client";

import { signOut } from "next-auth/react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  useEffect,
  useRef,
  useState,
} from "react";

import { GlobalSearch } from "@/components/app/GlobalSearch";

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
  followRequestCount?: number;
  notificationUnreadCount?: number;
};

export function AppHeader({
  user,
  username,
  name,
  image,
  followRequestCount = 0,
  notificationUnreadCount = 0,
}: AppHeaderProps) {
  const pathname = usePathname();
  const menuRef = useRef<HTMLDivElement>(null);

  const [isMenuOpen, setIsMenuOpen] =
    useState(false);

  const [isSigningOut, setIsSigningOut] =
    useState(false);

  const requestCount = Math.max(
    followRequestCount,
    0,
  );

  const unreadCount = Math.max(
    notificationUnreadCount,
    0,
  );

  const accountBadgeCount = Math.max(
    requestCount,
    unreadCount,
  );

  const resolvedUsername =
    user?.username ?? username ?? null;

  const resolvedName =
    user?.name ?? name ?? null;

  const resolvedImage =
    user?.image ?? image ?? null;

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
    setIsMenuOpen(false);
  }, [pathname]);

  useEffect(() => {
    function handlePointerDown(event: MouseEvent) {
      if (
        menuRef.current &&
        !menuRef.current.contains(
          event.target as Node,
        )
      ) {
        setIsMenuOpen(false);
      }
    }

    function handleKeyDown(
      event: KeyboardEvent,
    ) {
      if (event.key === "Escape") {
        setIsMenuOpen(false);
      }
    }

    document.addEventListener(
      "mousedown",
      handlePointerDown,
    );

    window.addEventListener(
      "keydown",
      handleKeyDown,
    );

    return () => {
      document.removeEventListener(
        "mousedown",
        handlePointerDown,
      );

      window.removeEventListener(
        "keydown",
        handleKeyDown,
      );
    };
  }, []);

  function closeMenu() {
    setIsMenuOpen(false);
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
        <div className="min-w-0 flex-1">
          <GlobalSearch />
        </div>

        <div
          ref={menuRef}
          className="relative shrink-0"
        >
          <button
            type="button"
            onClick={() =>
              setIsMenuOpen(
                (current) => !current,
              )
            }
            aria-expanded={isMenuOpen}
            aria-haspopup="menu"
            className="flex h-12 items-center gap-3 rounded-full border border-transparent bg-[#211E1B] p-1.5 pr-3 transition hover:border-[#302C28] hover:bg-[#292521]"
          >
            <span className="relative shrink-0">
              <span
                className="flex h-9 w-9 items-center justify-center rounded-full bg-[#9B7567] bg-cover bg-center text-sm font-semibold text-white"
                style={
                  resolvedImage
                    ? {
                        backgroundImage: `url("${resolvedImage}")`,
                      }
                    : undefined
                }
              >
                {!resolvedImage
                  ? avatarInitial
                  : null}
              </span>

              {accountBadgeCount > 0 ? (
                <NotificationBadge
                  count={accountBadgeCount}
                />
              ) : null}
            </span>

            <span className="hidden max-w-40 truncate text-sm font-semibold text-[#EDE8DE] sm:block">
              {accountLabel}
            </span>

            <ChevronIcon
              className={[
                "hidden h-3.5 w-3.5 text-[#8A8580] transition sm:block",
                isMenuOpen
                  ? "rotate-180"
                  : "",
              ].join(" ")}
            />
          </button>

          {isMenuOpen ? (
            <div
              role="menu"
              className="absolute right-0 top-[calc(100%+10px)] w-64 overflow-hidden rounded-xl border border-[#302C28] bg-[#1A1714] p-2 shadow-2xl shadow-black/50"
            >
              <div className="border-b border-[#302C28] px-3 py-3">
                <p className="truncate text-sm font-semibold text-[#F4F1EB]">
                  {accountLabel}
                </p>

                {resolvedName &&
                resolvedName !==
                  resolvedUsername ? (
                  <p className="mt-1 truncate text-xs text-[#716B65]">
                    {resolvedName}
                  </p>
                ) : null}
              </div>

              {resolvedUsername ? (
                <Link
                  href={`/u/${resolvedUsername}`}
                  role="menuitem"
                  onClick={closeMenu}
                  className="mt-2 flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-sm text-[#C9C4BC] transition hover:bg-[#292521] hover:text-[#F4F1EB]"
                >
                  <ProfileIcon className="h-4 w-4" />
                  View profile
                </Link>
              ) : null}

              <Link
                href="/notifications"
                role="menuitem"
                onClick={closeMenu}
                className="mt-1 flex w-full items-center justify-between gap-3 rounded-lg px-3 py-2.5 text-sm text-[#C9C4BC] transition hover:bg-[#292521] hover:text-[#F4F1EB]"
              >
                <span className="flex items-center gap-3">
                  <BellIcon className="h-4 w-4" />
                  Notifications
                </span>

                {unreadCount > 0 ? (
                  <MenuBadge
                    count={unreadCount}
                  />
                ) : null}
              </Link>

              <Link
                href="/follow-requests"
                role="menuitem"
                onClick={closeMenu}
                className="mt-1 flex w-full items-center justify-between gap-3 rounded-lg px-3 py-2.5 text-sm text-[#C9C4BC] transition hover:bg-[#292521] hover:text-[#F4F1EB]"
              >
                <span className="flex items-center gap-3">
                  <FollowRequestsIcon className="h-4 w-4" />
                  Follow requests
                </span>

                {requestCount > 0 ? (
                  <MenuBadge
                    count={requestCount}
                  />
                ) : null}
              </Link>

              <Link
                href="/settings"
                role="menuitem"
                onClick={closeMenu}
                className="mt-1 flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-sm text-[#C9C4BC] transition hover:bg-[#292521] hover:text-[#F4F1EB]"
              >
                <SettingsIcon className="h-4 w-4" />
                Settings
              </Link>

              <div className="my-2 border-t border-[#302C28]" />

              <button
                type="button"
                role="menuitem"
                disabled={isSigningOut}
                onClick={handleSignOut}
                className="flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-left text-sm text-[#C9C4BC] transition hover:bg-[#292521] hover:text-[#F4F1EB] disabled:cursor-not-allowed disabled:opacity-50"
              >
                <SignOutIcon className="h-4 w-4" />

                {isSigningOut
                  ? "Signing out..."
                  : "Sign out"}
              </button>
            </div>
          ) : null}
        </div>
      </div>
    </header>
  );
}

function NotificationBadge({
  count,
}: {
  count: number;
}) {
  return (
    <span className="absolute -right-1.5 -top-1.5 flex min-h-5 min-w-5 items-center justify-center rounded-full border-2 border-[#100E0C] bg-[#C84B18] px-1 text-[9px] font-bold leading-none text-white">
      {formatBadgeCount(count)}
    </span>
  );
}

function MenuBadge({
  count,
}: {
  count: number;
}) {
  return (
    <span className="flex min-h-5 min-w-5 items-center justify-center rounded-full bg-[#C84B18] px-1.5 text-[9px] font-bold text-white">
      {formatBadgeCount(count)}
    </span>
  );
}

function formatBadgeCount(count: number) {
  return count > 99 ? "99+" : count.toString();
}

function BellIcon({
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
        d="M18 9a6 6 0 0 0-12 0c0 7-3 7-3 9h18c0-2-3-2-3-9ZM10 21h4"
        stroke="currentColor"
        strokeWidth="1.7"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function FollowRequestsIcon({
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
        cx="8.5"
        cy="8"
        r="3.5"
        stroke="currentColor"
        strokeWidth="1.7"
      />

      <path
        d="M3 20c.4-4 2.3-6 5.5-6 1.8 0 3.2.6 4.1 1.7M17 13v6M14 16h6"
        stroke="currentColor"
        strokeWidth="1.7"
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

function ProfileIcon({
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
        cx="12"
        cy="8"
        r="3.5"
        stroke="currentColor"
        strokeWidth="1.7"
      />

      <path
        d="M5.5 20c.5-4 2.7-6 6.5-6s6 2 6.5 6"
        stroke="currentColor"
        strokeWidth="1.7"
        strokeLinecap="round"
      />
    </svg>
  );
}

function SettingsIcon({
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
        cx="12"
        cy="12"
        r="3"
        stroke="currentColor"
        strokeWidth="1.7"
      />

      <path
        d="M19 12a7.3 7.3 0 0 0-.08-1l2-1.55-2-3.46-2.43.98a7.4 7.4 0 0 0-1.73-1L14.4 3h-4.8l-.36 2.97a7.4 7.4 0 0 0-1.73 1L5.08 5.99l-2 3.46L5.08 11a7.3 7.3 0 0 0 0 2l-2 1.55 2 3.46 2.43-.98a7.4 7.4 0 0 0 1.73 1L9.6 21h4.8l.36-2.97a7.4 7.4 0 0 0 1.73-1l2.43.98 2-3.46L18.92 13c.05-.33.08-.66.08-1Z"
        stroke="currentColor"
        strokeWidth="1.5"
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