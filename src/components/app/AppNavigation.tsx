"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

type IconProps = {
  className?: string;
};

function HomeIcon({ className }: IconProps) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      className={className}
      aria-hidden="true"
    >
      <path d="M3 10.8 12 3l9 7.8" />
      <path d="M5.5 9.5V21h13V9.5" />
      <path d="M9.5 21v-6h5v6" />
    </svg>
  );
}

function SearchIcon({ className }: IconProps) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      className={className}
      aria-hidden="true"
    >
      <circle cx="11" cy="11" r="7" />
      <path d="m20 20-4-4" />
    </svg>
  );
}

function DiaryIcon({ className }: IconProps) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      className={className}
      aria-hidden="true"
    >
      <path d="M5 4.5h11.5A2.5 2.5 0 0 1 19 7v12H7.5A2.5 2.5 0 0 1 5 16.5v-12Z" />
      <path d="M5 16.5A2.5 2.5 0 0 1 7.5 14H19" />
      <path d="M9 8h6" />
    </svg>
  );
}

function WatchlistIcon({ className }: IconProps) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      className={className}
      aria-hidden="true"
    >
      <path d="M7 4h10a1 1 0 0 1 1 1v16l-6-3.5L6 21V5a1 1 0 0 1 1-1Z" />
    </svg>
  );
}

const navigationItems = [
  {
    label: "Home",
    href: "/home",
    available: true,
    icon: HomeIcon,
  },
  {
    label: "Search",
    href: "/search",
    available: true,
    icon: SearchIcon,
  },
  {
    label: "Diary",
    href: "/diary",
    available: true,
    icon: DiaryIcon,
  },
  {
    label: "Watchlist",
    href: "/watchlist",
    available: true,
    icon: WatchlistIcon,
  },
];

type AppNavigationProps = {
  mobile?: boolean;
};

export function AppNavigation({
  mobile = false,
}: AppNavigationProps) {
  const pathname = usePathname();

  function isActive(href: string) {
    if (href === "/home") {
      return pathname === "/home";
    }

    return pathname === href || pathname.startsWith(`${href}/`);
  }

  if (mobile) {
    return (
      <nav className="grid grid-cols-4">
        {navigationItems.map((item) => {
          const Icon = item.icon;
          const active = isActive(item.href);

          if (!item.available) {
            return (
              <span
                key={item.href}
                className="flex cursor-not-allowed flex-col items-center justify-center gap-1.5 px-2 py-3 text-[#4A4642]"
              >
                <Icon className="h-5 w-5" />
                <span className="text-[10px]">{item.label}</span>
              </span>
            );
          }

          return (
            <Link
              key={item.href}
              href={item.href}
              aria-current={active ? "page" : undefined}
              className={[
                "flex flex-col items-center justify-center gap-1.5 px-2 py-3 transition",
                active
                  ? "text-[#C84B18]"
                  : "text-[#8A8580] hover:text-[#EDE8DE]",
              ].join(" ")}
            >
              <Icon className="h-5 w-5" />
              <span className="text-[10px]">{item.label}</span>
            </Link>
          );
        })}
      </nav>
    );
  }

  return (
    <nav>
      <p className="mb-3 px-3 font-mono text-[9px] uppercase tracking-[0.14em] text-[#4A4642]">
        Menu
      </p>

      <div className="space-y-1">
        {navigationItems.slice(0, 2).map((item) => {
          const Icon = item.icon;
          const active = isActive(item.href);

          return (
            <Link
              key={item.href}
              href={item.href}
              aria-current={active ? "page" : undefined}
              className={[
                "flex items-center gap-4 rounded-md px-3 py-3 text-sm font-medium transition",
                active
                  ? "bg-[#211E1B] text-[#EDE8DE]"
                  : "text-[#8A8580] hover:bg-[#171411] hover:text-[#EDE8DE]",
              ].join(" ")}
            >
              <Icon
                className={[
                  "h-5 w-5",
                  active ? "text-[#C84B18]" : "",
                ].join(" ")}
              />

              {item.label}
            </Link>
          );
        })}
      </div>

            <p className="mb-3 mt-9 px-3 font-mono text-[9px] uppercase tracking-[0.14em] text-[#4A4642]">
            Your library
            </p>

            <div className="space-y-1">
            {navigationItems.slice(2).map((item) => {
                const Icon = item.icon;
                const active = isActive(item.href);

                if (!item.available) {
                return (
                    <div
                    key={item.href}
                    className="flex cursor-not-allowed items-center justify-between rounded-md px-3 py-3 text-[#514C47]"
                    >
                    <div className="flex items-center gap-4">
                        <Icon className="h-5 w-5" />
                        <span className="text-sm">{item.label}</span>
                    </div>

                    <span className="font-mono text-[7px] uppercase tracking-[0.1em]">
                        Soon
                    </span>
                    </div>
                );
                }

                return (
                <Link
                    key={item.href}
                    href={item.href}
                    aria-current={active ? "page" : undefined}
                    className={[
                    "flex items-center gap-4 rounded-md px-3 py-3 text-sm font-medium transition",
                    active
                        ? "bg-[#211E1B] text-[#EDE8DE]"
                        : "text-[#8A8580] hover:bg-[#171411] hover:text-[#EDE8DE]",
                    ].join(" ")}
                >
                    <Icon
                    className={[
                        "h-5 w-5",
                        active ? "text-[#C84B18]" : "",
                    ].join(" ")}
                    />

                    {item.label}
                </Link>
                );
            })}
        </div>
    </nav>
  );
}