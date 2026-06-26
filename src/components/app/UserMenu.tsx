"use client";

import { signOut } from "next-auth/react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  useEffect,
  useRef,
  useState,
} from "react";

type UserMenuProps = {
  username: string;
  name?: string | null;
  image?: string | null;
  followRequestCount?: number;
  notificationUnreadCount?: number;
};

export function UserMenu({
  username,
  name,
  image,
  followRequestCount = 0,
  notificationUnreadCount = 0,
}: UserMenuProps) {
  const pathname = usePathname();
  const menuRef = useRef<HTMLDivElement>(null);

  const [isOpen, setIsOpen] = useState(false);
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

  const avatarInitial = username
    .charAt(0)
    .toUpperCase();

  const displayName =
    name?.trim() || `@${username}`;

  useEffect(() => {
    setIsOpen(false);
  }, [pathname]);

  useEffect(() => {
    function handlePointerDown(event: MouseEvent) {
      if (
        menuRef.current &&
        !menuRef.current.contains(
          event.target as Node,
        )
      ) {
        setIsOpen(false);
      }
    }

    function handleKeyDown(
      event: KeyboardEvent,
    ) {
      if (event.key === "Escape") {
        setIsOpen(false);
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

  async function handleSignOut() {
    setIsSigningOut(true);

    await signOut({
      callbackUrl: "/",
    });
  }

  return (
    <div ref={menuRef} className="relative">
      {isOpen ? (
        <div className="absolute bottom-[calc(100%+12px)] left-0 w-full min-w-[260px] overflow-hidden rounded-2xl border border-[#302C28] bg-[#1A1714] p-3 shadow-2xl shadow-black/60">
          <div className="flex items-center gap-3 border-b border-[#302C28] px-2 pb-4">
            <span className="relative shrink-0">
              <span
                className="flex h-12 w-12 items-center justify-center rounded-full bg-[#9B7567] bg-cover bg-center text-sm font-semibold text-white"
                style={
                  image
                    ? {
                        backgroundImage: `url("${image}")`,
                      }
                    : undefined
                }
              >
                {!image ? avatarInitial : null}
              </span>

              {accountBadgeCount > 0 ? (
                <NotificationBadge
                  count={accountBadgeCount}
                  className="-right-1 -top-1"
                />
              ) : null}
            </span>

            <div className="min-w-0">
              <p className="truncate text-sm font-semibold text-[#F4F1EB]">
                {displayName}
              </p>

              <p className="mt-1 truncate text-xs text-[#8A8580]">
                @{username}
              </p>
            </div>
          </div>

          <div className="pt-2">
            <Link
              href={`/u/${username}`}
              className="flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm text-[#C9C4BC] transition hover:bg-[#292521] hover:text-[#F4F1EB]"
            >
              <ProfileIcon className="h-4 w-4" />
              View profile
            </Link>

            <Link
              href="/notifications"
              className="mt-1 flex items-center justify-between gap-3 rounded-lg px-3 py-2.5 text-sm text-[#C9C4BC] transition hover:bg-[#292521] hover:text-[#F4F1EB]"
            >
              <span className="flex items-center gap-3">
                <BellIcon className="h-4 w-4" />
                Notifications
              </span>

              {unreadCount > 0 ? (
                <MenuBadge count={unreadCount} />
              ) : null}
            </Link>

            <Link
              href="/follow-requests"
              className="mt-1 flex items-center justify-between gap-3 rounded-lg px-3 py-2.5 text-sm text-[#C9C4BC] transition hover:bg-[#292521] hover:text-[#F4F1EB]"
            >
              <span className="flex items-center gap-3">
                <FollowRequestsIcon className="h-4 w-4" />
                Follow requests
              </span>

              {requestCount > 0 ? (
                <MenuBadge count={requestCount} />
              ) : null}
            </Link>

            <Link
              href="/settings"
              className="mt-1 flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm text-[#C9C4BC] transition hover:bg-[#292521] hover:text-[#F4F1EB]"
            >
              <EditIcon className="h-4 w-4" />
              Edit profile
            </Link>
          </div>

          <div className="my-2 border-t border-[#302C28]" />

          <button
            type="button"
            disabled={isSigningOut}
            onClick={handleSignOut}
            className="flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-left text-sm text-red-300 transition hover:bg-red-950/25 disabled:cursor-not-allowed disabled:opacity-50"
          >
            <SignOutIcon className="h-4 w-4" />

            {isSigningOut
              ? "Signing out..."
              : "Sign out"}
          </button>
        </div>
      ) : null}

      <button
        type="button"
        onClick={() =>
          setIsOpen((current) => !current)
        }
        aria-expanded={isOpen}
        aria-haspopup="menu"
        className="group flex w-full items-center gap-3 rounded-xl border border-transparent px-3 py-3 text-left transition hover:border-[#2B2723] hover:bg-[#171411]"
      >
        <span className="relative shrink-0">
          <span
            className="flex h-11 w-11 items-center justify-center rounded-full bg-[#9B7567] bg-cover bg-center text-sm font-semibold text-white"
            style={
              image
                ? {
                    backgroundImage: `url("${image}")`,
                  }
                : undefined
            }
          >
            {!image ? avatarInitial : null}
          </span>

          {accountBadgeCount > 0 ? (
            <NotificationBadge
              count={accountBadgeCount}
              className="-right-1.5 -top-1.5"
            />
          ) : null}
        </span>

        <span className="min-w-0 flex-1">
          <span className="block truncate text-sm font-semibold text-[#F4F1EB] transition group-hover:text-[#E45A1C]">
            @{username}
          </span>

          <span className="mt-1 block truncate text-xs text-[#716B65]">
            Reelog account
          </span>
        </span>

        <ChevronIcon
          className={[
            "h-4 w-4 shrink-0 text-[#716B65] transition",
            isOpen ? "rotate-180" : "",
          ].join(" ")}
        />
      </button>
    </div>
  );
}

function NotificationBadge({
  count,
  className = "",
}: {
  count: number;
  className?: string;
}) {
  return (
    <span
      className={[
        "absolute flex min-h-5 min-w-5 items-center justify-center rounded-full border-2 border-[#080706] bg-[#C84B18] px-1 text-[9px] font-bold leading-none text-white",
        className,
      ].join(" ")}
    >
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

function EditIcon({
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
        d="m14.5 5.5 4 4M4 20l4.5-1 10-10a2.83 2.83 0 0 0-4-4l-10 10L4 20Z"
        stroke="currentColor"
        strokeWidth="1.7"
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