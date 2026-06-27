"use client";

import Link from "next/link";
import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";

type FeaturedFilmItem = {
  id: string;
  tmdbId: number;
  mediaType: "movie" | "tv";
  title: string;
  posterPath: string | null;
  position: number;
};

type FeaturedFilmsSectionProps = {
  username: string;
  items: FeaturedFilmItem[];
  isOwner: boolean;
};

type TopFiveSlot = {
  position: number;
  item: FeaturedFilmItem | null;
};

const MAX_FEATURED_FILMS = 5;

export function FeaturedFilmsSection({
  username,
  items,
  isOwner,
}: FeaturedFilmsSectionProps) {
  const trackRef = useRef<HTMLDivElement>(null);

  const [activeIndex, setActiveIndex] = useState(0);
  const [hasOverflow, setHasOverflow] = useState(false);
  const [canScrollLeft, setCanScrollLeft] = useState(false);
  const [canScrollRight, setCanScrollRight] = useState(false);

  const sortedItems = useMemo(
    () =>
      [...items]
        .sort(
          (firstItem, secondItem) =>
            firstItem.position - secondItem.position,
        )
        .slice(0, MAX_FEATURED_FILMS),
    [items],
  );

  const slots = useMemo<TopFiveSlot[]>(() => {
    if (!isOwner) {
      return sortedItems.map((item, index) => ({
        position: index + 1,
        item,
      }));
    }

    return Array.from(
      {
        length: MAX_FEATURED_FILMS,
      },
      (_, index) => ({
        position: index + 1,
        item: sortedItems[index] ?? null,
      }),
    );
  }, [isOwner, sortedItems]);

  const updateCarouselState = useCallback(() => {
    const track = trackRef.current;

    if (!track) {
      return;
    }

    const maximumScroll = track.scrollWidth - track.clientWidth;
    const overflow = maximumScroll > 4;

    setHasOverflow(overflow);
    setCanScrollLeft(overflow && track.scrollLeft > 4);
    setCanScrollRight(
      overflow && track.scrollLeft < maximumScroll - 4,
    );

    const cards = Array.from(
      track.querySelectorAll<HTMLElement>(
        "[data-top-five-card]",
      ),
    );

    if (cards.length === 0) {
      setActiveIndex(0);
      return;
    }

    const nearestCard = cards.reduce(
      (nearest, card, index) => {
        const distance = Math.abs(
          card.offsetLeft - track.offsetLeft - track.scrollLeft,
        );

        if (distance < nearest.distance) {
          return {
            index,
            distance,
          };
        }

        return nearest;
      },
      {
        index: 0,
        distance: Number.POSITIVE_INFINITY,
      },
    );

    setActiveIndex(nearestCard.index);
  }, []);

  useEffect(() => {
    const track = trackRef.current;

    if (!track) {
      return;
    }

    let animationFrame = 0;

    function handleScroll() {
      window.cancelAnimationFrame(animationFrame);

      animationFrame = window.requestAnimationFrame(
        updateCarouselState,
      );
    }

    const resizeObserver = new ResizeObserver(
      updateCarouselState,
    );

    resizeObserver.observe(track);
    track.addEventListener("scroll", handleScroll, {
      passive: true,
    });

    updateCarouselState();

    return () => {
      resizeObserver.disconnect();
      track.removeEventListener("scroll", handleScroll);
      window.cancelAnimationFrame(animationFrame);
    };
  }, [slots, updateCarouselState]);

  if (!isOwner && sortedItems.length === 0) {
    return null;
  }

  function scrollToIndex(index: number) {
    const track = trackRef.current;

    if (!track) {
      return;
    }

    const cards = Array.from(
      track.querySelectorAll<HTMLElement>(
        "[data-top-five-card]",
      ),
    );

    const targetCard = cards[index];

    if (!targetCard) {
      return;
    }

    track.scrollTo({
      left: targetCard.offsetLeft - track.offsetLeft,
      behavior: "smooth",
    });
  }

  function scrollCarousel(
    direction: "previous" | "next",
  ) {
    const nextIndex =
      direction === "previous"
        ? Math.max(activeIndex - 1, 0)
        : Math.min(activeIndex + 1, slots.length - 1);

    scrollToIndex(nextIndex);
  }

  const desktopGridClass = getDesktopGridClass(slots.length);

  return (
    <section className="mt-16 min-w-0 overflow-hidden border-t border-[#27231F] pt-8">
      <div>
        <p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-[#E45A1C]">
          Profile favorites
        </p>

        <h2 className="mt-2 text-2xl font-semibold tracking-tight text-[#F4F1EB]">
          Top 5
        </h2>

        <p className="mt-2 text-sm text-[#625D58]">
          The films and series that define{" "}
          <span className="text-[#E45A1C]">@{username}</span>
          &apos;s taste.
        </p>
      </div>

      <div className="relative mt-7 w-full min-w-0 overflow-hidden">
        <div
          ref={trackRef}
          className={[
            "flex w-full snap-x snap-mandatory gap-4 overflow-x-auto pb-2",
            "touch-pan-x overscroll-x-contain scroll-smooth",
            "[scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden",
            "xl:grid xl:snap-none xl:overflow-visible xl:pb-0",
            desktopGridClass,
          ].join(" ")}
        >
          {slots.map((slot) =>
            slot.item ? (
              <FeaturedFilmCard
                key={slot.item.id}
                item={slot.item}
                position={slot.position}
                isOwner={isOwner}
              />
            ) : (
              <AddTitleCard
                key={`add-${slot.position}`}
                position={slot.position}
              />
            ),
          )}
        </div>
      </div>

      {hasOverflow ? (
        <div className="mt-5 flex items-center justify-between gap-5 xl:hidden">
          <div className="flex items-center gap-1.5">
            {slots.map((slot, index) => (
              <button
                key={`dot-${slot.position}`}
                type="button"
                onClick={() => scrollToIndex(index)}
                aria-label={`Go to Top 5 position ${slot.position}`}
                className={[
                  "h-1.5 rounded-full transition-all",
                  activeIndex === index
                    ? "w-4 bg-[#E45A1C]"
                    : "w-1.5 bg-[#302C28] hover:bg-[#514C47]",
                ].join(" ")}
              />
            ))}
          </div>

          <div className="flex items-center gap-2">
            <CarouselButton
              direction="previous"
              disabled={!canScrollLeft}
              onClick={() => scrollCarousel("previous")}
            />

            <CarouselButton
              direction="next"
              disabled={!canScrollRight}
              onClick={() => scrollCarousel("next")}
            />

            {isOwner ? (
              <Link
                href="/featured-films"
                className="inline-flex items-center justify-center rounded-full border border-[#302C28] px-4 py-2 text-xs font-semibold text-[#8A8580] transition hover:border-[#48413B] hover:text-[#F4F1EB]"
              >
                Manage Top 5
              </Link>
            ) : null}
          </div>
        </div>
      ) : isOwner ? (
        <div className="mt-5 flex justify-end xl:mt-4">
          <Link
            href="/featured-films"
            className="inline-flex items-center justify-center rounded-full border border-[#302C28] px-4 py-2 text-xs font-semibold text-[#8A8580] transition hover:border-[#48413B] hover:text-[#F4F1EB]"
          >
            Manage Top 5
          </Link>
        </div>
      ) : null}
    </section>
  );
}

function FeaturedFilmCard({
  item,
  position,
  isOwner,
}: {
  item: FeaturedFilmItem;
  position: number;
  isOwner: boolean;
}) {
  const posterUrl = getPosterUrl(item.posterPath);

  return (
    <Link
      href={`/title/${item.mediaType}/${item.tmdbId}`}
      data-top-five-card
      draggable={false}
      aria-label={`View details for ${item.title}`}
      className="group relative w-[42vw] min-w-[138px] max-w-[180px] shrink-0 snap-start sm:w-[170px] md:w-[185px] lg:w-[200px] xl:w-auto xl:min-w-0 xl:max-w-none"
    >
      <div className="relative aspect-[2/3] overflow-hidden rounded-xl border border-[#211E1B] bg-[#181614] shadow-xl shadow-black/20 transition duration-200 group-hover:-translate-y-1 group-hover:border-[#3A3530] group-hover:shadow-2xl group-hover:shadow-black/40">
        <div
          className="absolute inset-0 bg-gradient-to-br from-[#3A2419] to-[#171411] bg-cover bg-center"
          style={
            posterUrl
              ? {
                  backgroundImage: `url("${posterUrl}")`,
                }
              : undefined
          }
        />

        {!posterUrl ? (
          <div className="absolute inset-0 flex items-center justify-center p-4 text-center">
            <span className="text-sm font-semibold leading-5 text-[#8A8580]">
              {item.title}
            </span>
          </div>
        ) : null}

        <div className="absolute inset-0 bg-gradient-to-t from-black/95 via-black/10 to-transparent" />

        <span
          className={[
            "absolute left-2.5 top-2.5 flex h-7 w-7 items-center justify-center rounded-full border text-[10px] font-semibold backdrop-blur-sm",
            position === 1
              ? "border-[#E45A1C] bg-[#E45A1C] text-white"
              : "border-white/10 bg-black/75 text-[#A7A19A]",
          ].join(" ")}
        >
          {position}
        </span>

        <div className="absolute inset-x-0 bottom-0 p-3">
          <h3 className="line-clamp-2 text-sm font-semibold leading-5 text-[#F4F1EB]">
            {item.title}
          </h3>

          <span className="mt-2 inline-flex rounded border border-white/10 bg-black/50 px-1.5 py-0.5 text-[8px] font-medium uppercase tracking-[0.1em] text-[#8A8580]">
            {item.mediaType === "movie" ? "Film" : "Series"}
          </span>
        </div>

        <div className="pointer-events-none absolute inset-0 flex items-center justify-center bg-black/55 opacity-0 transition group-hover:opacity-100">
          <span className="flex h-10 w-10 items-center justify-center rounded-full border border-white/20 bg-black/30 text-white backdrop-blur">
            {isOwner ? (
              <ArrowUpRightIcon className="h-4 w-4" />
            ) : (
              <EyeIcon className="h-4 w-4" />
            )}
          </span>
        </div>
      </div>
    </Link>
  );
}

function AddTitleCard({
  position,
}: {
  position: number;
}) {
  return (
    <Link
      href="/search"
      data-top-five-card
      aria-label={`Add a title to Top 5 position ${position}`}
      className="group relative w-[42vw] min-w-[138px] max-w-[180px] shrink-0 snap-start sm:w-[170px] md:w-[185px] lg:w-[200px] xl:w-auto xl:min-w-0 xl:max-w-none"
    >
      <div className="relative flex aspect-[2/3] flex-col items-center justify-center overflow-hidden rounded-xl border border-dashed border-[#302C28] bg-[#141210] p-4 text-center transition duration-200 group-hover:-translate-y-1 group-hover:border-[#C84B18]/60 group-hover:bg-[#1A1613] group-hover:shadow-xl group-hover:shadow-black/30">
        <span className="absolute left-2.5 top-2.5 flex h-7 w-7 items-center justify-center rounded-full border border-[#302C28] bg-black/25 text-[10px] font-semibold text-[#625D58] transition group-hover:border-[#C84B18]/40 group-hover:text-[#E45A1C]">
          {position}
        </span>

        <span className="flex h-12 w-12 items-center justify-center rounded-full border border-[#38332E] bg-[#211E1B] text-[#8A8580] transition duration-200 group-hover:scale-110 group-hover:border-[#C84B18]/60 group-hover:bg-[#2A1C15] group-hover:text-[#E45A1C]">
          <PlusIcon className="h-5 w-5" />
        </span>

        <p className="mt-4 text-sm font-semibold text-[#C9C4BC] transition group-hover:text-[#F4F1EB]">
          Add title
        </p>

        <p className="mt-2 text-[10px] text-[#625D58]">
          Search films or series
        </p>
      </div>
    </Link>
  );
}

function CarouselButton({
  direction,
  disabled,
  onClick,
}: {
  direction: "previous" | "next";
  disabled: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      disabled={disabled}
      onClick={onClick}
      aria-label={
        direction === "previous"
          ? "Previous Top 5 title"
          : "Next Top 5 title"
      }
      className="flex h-8 w-8 items-center justify-center rounded-full border border-[#27231F] text-[#625D58] transition hover:border-[#3A3530] hover:text-[#C9C4BC] disabled:cursor-not-allowed disabled:opacity-30"
    >
      <ChevronIcon
        className={[
          "h-3.5 w-3.5",
          direction === "previous" ? "rotate-180" : "",
        ].join(" ")}
      />
    </button>
  );
}

function getDesktopGridClass(itemCount: number) {
  switch (itemCount) {
    case 1:
      return "xl:max-w-[210px] xl:grid-cols-1";
    case 2:
      return "xl:max-w-[436px] xl:grid-cols-2";
    case 3:
      return "xl:max-w-[662px] xl:grid-cols-3";
    case 4:
      return "xl:max-w-[888px] xl:grid-cols-4";
    default:
      return "xl:grid-cols-5";
  }
}

function getPosterUrl(posterPath: string | null) {
  if (!posterPath) {
    return null;
  }

  return `https://image.tmdb.org/t/p/w500${posterPath}`;
}

function PlusIcon({
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
        d="M12 5v14M5 12h14"
        stroke="currentColor"
        strokeWidth="1.8"
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
        d="m9 6 6 6-6 6"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function EyeIcon({
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
        d="M2.8 12s3.3-5.5 9.2-5.5 9.2 5.5 9.2 5.5-3.3 5.5-9.2 5.5S2.8 12 2.8 12Z"
        stroke="currentColor"
        strokeWidth="1.7"
        strokeLinejoin="round"
      />

      <circle
        cx="12"
        cy="12"
        r="2.5"
        stroke="currentColor"
        strokeWidth="1.7"
      />
    </svg>
  );
}

function ArrowUpRightIcon({
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
        d="M8 16 16 8M9 8h7v7"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}