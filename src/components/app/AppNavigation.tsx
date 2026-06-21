"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

type IconProps = {
className?: string;
};

type NavigationItem = {
label: string;
mobileLabel?: string;
href: string;
available: boolean;
icon: (props: IconProps) => JSX.Element;
};

function HomeIcon({ className }: IconProps) {
return ( <svg
   viewBox="0 0 24 24"
   fill="none"
   stroke="currentColor"
   strokeWidth="1.8"
   className={className}
   aria-hidden="true"
 > <path d="M3 10.8 12 3l9 7.8" /> <path d="M5.5 9.5V21h13V9.5" /> <path d="M9.5 21v-6h5v6" /> </svg>
);
}

function SearchIcon({ className }: IconProps) {
return ( <svg
   viewBox="0 0 24 24"
   fill="none"
   stroke="currentColor"
   strokeWidth="1.8"
   className={className}
   aria-hidden="true"
 > <circle cx="11" cy="11" r="7" /> <path d="m20 20-4-4" /> </svg>
);
}

function DiaryIcon({ className }: IconProps) {
return ( <svg
   viewBox="0 0 24 24"
   fill="none"
   stroke="currentColor"
   strokeWidth="1.8"
   className={className}
   aria-hidden="true"
 > <path d="M5 4.5h11.5A2.5 2.5 0 0 1 19 7v12H7.5A2.5 2.5 0 0 1 5 16.5v-12Z" /> <path d="M5 16.5A2.5 2.5 0 0 1 7.5 14H19" /> <path d="M9 8h6" /> </svg>
);
}

function WatchlistIcon({ className }: IconProps) {
return ( <svg
   viewBox="0 0 24 24"
   fill="none"
   stroke="currentColor"
   strokeWidth="1.8"
   className={className}
   aria-hidden="true"
 > <path d="M7 4h10a1 1 0 0 1 1 1v16l-6-3.5L6 21V5a1 1 0 0 1 1-1Z" /> </svg>
);
}

function FollowRequestsIcon({
className,
}: IconProps) {
return ( <svg
   viewBox="0 0 24 24"
   fill="none"
   stroke="currentColor"
   strokeWidth="1.8"
   className={className}
   aria-hidden="true"
 > <circle cx="9" cy="8" r="3" />

  <path
    d="M3.5 19c.4-3.4 2.3-5.2 5.5-5.2 1.8 0 3.2.6 4.1 1.7"
    strokeLinecap="round"
  />

  <path
    d="M17 13v6M14 16h6"
    strokeLinecap="round"
  />
</svg>

);
}

const mainNavigationItems: NavigationItem[] = [
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
];

const libraryNavigationItems: NavigationItem[] = [
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

const socialNavigationItems: NavigationItem[] = [
{
label: "Follow requests",
mobileLabel: "Requests",
href: "/follow-requests",
available: true,
icon: FollowRequestsIcon,
},
];

const allNavigationItems = [
...mainNavigationItems,
...libraryNavigationItems,
...socialNavigationItems,
];

type AppNavigationProps = {
mobile?: boolean;
followRequestCount?: number;
};

export function AppNavigation({
mobile = false,
followRequestCount = 0,
}: AppNavigationProps) {
const pathname = usePathname();

const normalizedFollowRequestCount = Math.max(
followRequestCount,
0,
);

function isActive(href: string) {
if (href === "/home") {
return pathname === "/home";
}

return (
  pathname === href ||
  pathname.startsWith(`${href}/`)
);

}

function getBadgeCount(href: string) {
if (href === "/follow-requests") {
return normalizedFollowRequestCount;
}
return 0;
}

if (mobile) {
return ( <nav
     className="grid grid-cols-5"
     aria-label="Mobile navigation"
   >
{allNavigationItems.map((item) => {
const Icon = item.icon;
const active = isActive(item.href);
const badgeCount = getBadgeCount(item.href);
      if (!item.available) {
        return (
          <span
            key={item.href}
            className="flex cursor-not-allowed flex-col items-center justify-center gap-1.5 px-1 py-3 text-[#4A4642]"
          >
            <Icon className="h-5 w-5" />

            <span className="text-[9px]">
              {item.mobileLabel ?? item.label}
            </span>
          </span>
        );
      }

      return (
        <Link
          key={item.href}
          href={item.href}
          aria-current={
            active ? "page" : undefined
          }
          className={[
            "flex min-w-0 flex-col items-center justify-center gap-1.5 px-1 py-3 transition",
            active
              ? "text-[#C84B18]"
              : "text-[#8A8580] hover:text-[#EDE8DE]",
          ].join(" ")}
        >
          <span className="relative">
            <Icon className="h-5 w-5" />

            {badgeCount > 0 ? (
              <span className="absolute -right-2.5 -top-2 flex min-h-4 min-w-4 items-center justify-center rounded-full border-2 border-[#12100E] bg-[#C84B18] px-1 text-[8px] font-bold leading-none text-white">
                {formatBadgeCount(badgeCount)}
              </span>
            ) : null}
          </span>

          <span className="max-w-full truncate text-[9px]">
            {item.mobileLabel ?? item.label}
          </span>
        </Link>
      );
    })}
  </nav>
);
}

return ( <nav aria-label="Main navigation"> <NavigationSection
     label="Menu"
     items={mainNavigationItems}
     isActive={isActive}
     getBadgeCount={getBadgeCount}
   />
  <NavigationSection
    label="Your library"
    items={libraryNavigationItems}
    isActive={isActive}
    getBadgeCount={getBadgeCount}
    className="mt-9"
  />

  <NavigationSection
    label="Social"
    items={socialNavigationItems}
    isActive={isActive}
    getBadgeCount={getBadgeCount}
    className="mt-9"
  />
</nav>

);
}

function NavigationSection({
label,
items,
isActive,
getBadgeCount,
className = "",
}: {
label: string;
items: NavigationItem[];
isActive: (href: string) => boolean;
getBadgeCount: (href: string) => number;
className?: string;
}) {
return ( <section className={className}> <p className="mb-3 px-3 font-mono text-[9px] uppercase tracking-[0.14em] text-[#4A4642]">
{label} </p>
  <div className="space-y-1">
    {items.map((item) => {
      const Icon = item.icon;
      const active = isActive(item.href);
      const badgeCount = getBadgeCount(item.href);

      if (!item.available) {
        return (
          <div
            key={item.href}
            className="flex cursor-not-allowed items-center justify-between rounded-md px-3 py-3 text-[#514C47]"
          >
            <div className="flex items-center gap-4">
              <Icon className="h-5 w-5" />

              <span className="text-sm">
                {item.label}
              </span>
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
          aria-current={
            active ? "page" : undefined
          }
          className={[
            "flex items-center justify-between gap-3 rounded-md px-3 py-3 text-sm font-medium transition",
            active
              ? "bg-[#211E1B] text-[#EDE8DE]"
              : "text-[#8A8580] hover:bg-[#171411] hover:text-[#EDE8DE]",
          ].join(" ")}
        >
          <span className="flex min-w-0 items-center gap-4">
            <Icon
              className={[
                "h-5 w-5 shrink-0",
                active
                  ? "text-[#C84B18]"
                  : "",
              ].join(" ")}
            />

            <span className="truncate">
              {item.label}
            </span>
          </span>

          {badgeCount > 0 ? (
            <span className="flex min-h-5 min-w-5 shrink-0 items-center justify-center rounded-full bg-[#C84B18] px-1.5 text-[9px] font-bold leading-none text-white">
              {formatBadgeCount(badgeCount)}
            </span>
          ) : null}
        </Link>
      );
    })}
  </div>
</section>
);
}

function formatBadgeCount(count: number) {
return count > 99 ? "99+" : count.toString();
}
