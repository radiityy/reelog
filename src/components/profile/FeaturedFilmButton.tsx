"use client";

import { useRouter } from "next/navigation";
import { useEffect, useMemo, useState } from "react";

type MediaType = "movie" | "tv";

type FeaturedFilmItem = {
  id: string;
  tmdbId: number;
  mediaType: MediaType;
  title: string;
  posterPath: string | null;
  position: number;
};

type FeaturedFilmsResponse = {
  message?: string;
  items?: FeaturedFilmItem[];
  count?: number;
};

type FeaturedFilmButtonProps = {
  tmdbId: number;
  mediaType: MediaType;
  title: string;
  fullWidth?: boolean;
};

const FEATURED_POSITIONS = [1, 2, 3, 4, 5];

export function FeaturedFilmButton({
  tmdbId,
  mediaType,
  title,
  fullWidth = false,
}: FeaturedFilmButtonProps) {
  const router = useRouter();

  const [items, setItems] = useState<
    FeaturedFilmItem[]
  >([]);

  const [isLoading, setIsLoading] =
    useState(true);

  const [isSubmitting, setIsSubmitting] =
    useState(false);

  const [errorMessage, setErrorMessage] =
    useState("");

  const selectedItem = useMemo(
    () =>
      items.find(
        (item) =>
          item.tmdbId === tmdbId &&
          item.mediaType === mediaType,
      ) ?? null,
    [items, mediaType, tmdbId],
  );

  const isSelected = Boolean(selectedItem);
  const isFull = items.length >= 5 && !isSelected;

  useEffect(() => {
    let isActive = true;

    async function loadFeaturedFilms() {
      setIsLoading(true);
      setErrorMessage("");

      try {
        const response = await fetch(
          "/api/featured-films",
          {
            method: "GET",
            cache: "no-store",
          },
        );

        const payload =
          (await response.json()) as FeaturedFilmsResponse;

        if (!response.ok) {
          if (isActive) {
            setErrorMessage(
              payload.message ??
                "Unable to load your Top 5.",
            );
          }

          return;
        }

        if (isActive) {
          setItems(
            sortItems(payload.items ?? []),
          );
        }
      } catch {
        if (isActive) {
          setErrorMessage(
            "Unable to connect to the server.",
          );
        }
      } finally {
        if (isActive) {
          setIsLoading(false);
        }
      }
    }

    void loadFeaturedFilms();

    return () => {
      isActive = false;
    };
  }, []);

  async function handleClick() {
    if (isLoading || isSubmitting) {
      return;
    }

    if (isFull) {
      router.push("/featured-films");
      return;
    }

    let nextItems: FeaturedFilmItem[];

    if (selectedItem) {
      nextItems = items.filter(
        (item) => item.id !== selectedItem.id,
      );
    } else {
      const nextAvailablePosition =
        FEATURED_POSITIONS.find(
          (position) =>
            !items.some(
              (item) =>
                item.position === position,
            ),
        );

      if (
        nextAvailablePosition === undefined
      ) {
        router.push("/featured-films");
        return;
      }

      nextItems = [
        ...items,
        {
          id: `temporary-${mediaType}-${tmdbId}`,
          tmdbId,
          mediaType,
          title,
          posterPath: null,
          position: nextAvailablePosition,
        },
      ];
    }

    setIsSubmitting(true);
    setErrorMessage("");

    try {
      const response = await fetch(
        "/api/featured-films",
        {
          method: "PUT",
          headers: {
            "Content-Type":
              "application/json",
          },
          body: JSON.stringify({
            items: nextItems.map((item) => ({
              tmdbId: item.tmdbId,
              mediaType: item.mediaType,
              position: item.position,
            })),
          }),
        },
      );

      const payload =
        (await response.json()) as FeaturedFilmsResponse;

      if (!response.ok) {
        setErrorMessage(
          payload.message ??
            "Unable to update your Top 5.",
        );

        return;
      }

      setItems(
        sortItems(payload.items ?? []),
      );

      router.refresh();
    } catch {
      setErrorMessage(
        "Unable to connect to the server.",
      );
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <div
      className={
        fullWidth ? "w-full" : "w-auto"
      }
    >
      <button
        type="button"
        onClick={handleClick}
        disabled={isLoading || isSubmitting}
        className={[
          "inline-flex items-center justify-center gap-2 rounded-full px-5 py-2.5 text-sm font-semibold transition disabled:cursor-not-allowed disabled:opacity-50",
          fullWidth ? "w-full" : "",
          isSelected
            ? "border border-[#C84B18]/60 bg-[#2A1C15] text-[#E9783E] hover:border-red-800 hover:bg-red-950/25 hover:text-red-300"
            : isFull
              ? "border border-[#38332E] bg-[#211E1B] text-[#C9C4BC] hover:border-[#C84B18]/60 hover:text-[#F4F1EB]"
              : "bg-[#C84B18] text-white hover:bg-[#DC5520]",
        ].join(" ")}
      >
        {isSubmitting ? (
          <LoadingIcon className="h-4 w-4 animate-spin" />
        ) : isSelected ? (
          <StarIcon className="h-4 w-4" />
        ) : isFull ? (
          <ManageIcon className="h-4 w-4" />
        ) : (
          <PlusIcon className="h-4 w-4" />
        )}

        {getButtonLabel({
          isLoading,
          isSubmitting,
          isSelected,
          isFull,
        })}
      </button>

      {errorMessage ? (
        <p className="mt-2 text-xs leading-5 text-red-300">
          {errorMessage}
        </p>
      ) : null}
    </div>
  );
}

function sortItems(
  items: FeaturedFilmItem[],
) {
  return [...items].sort(
    (firstItem, secondItem) =>
      firstItem.position -
      secondItem.position,
  );
}

function getButtonLabel({
  isLoading,
  isSubmitting,
  isSelected,
  isFull,
}: {
  isLoading: boolean;
  isSubmitting: boolean;
  isSelected: boolean;
  isFull: boolean;
}) {
  if (isLoading) {
    return "Checking Top 5...";
  }

  if (isSubmitting) {
    return isSelected
      ? "Removing..."
      : "Adding...";
  }

  if (isSelected) {
    return "Remove from Top 5";
  }

  if (isFull) {
    return "Manage Top 5";
  }

  return "Add to Top 5";
}

function StarIcon({
  className = "",
}: {
  className?: string;
}) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="currentColor"
      aria-hidden="true"
      className={className}
    >
      <path d="m12 2.8 2.75 5.57 6.15.9-4.45 4.33 1.05 6.13L12 16.84l-5.5 2.89 1.05-6.13L3.1 9.27l6.15-.9L12 2.8Z" />
    </svg>
  );
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

function ManageIcon({
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
        d="M4 7h10M18 7h2M4 17h2M10 17h10"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
      />

      <circle
        cx="16"
        cy="7"
        r="2"
        stroke="currentColor"
        strokeWidth="1.8"
      />

      <circle
        cx="8"
        cy="17"
        r="2"
        stroke="currentColor"
        strokeWidth="1.8"
      />
    </svg>
  );
}

function LoadingIcon({
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
        r="8"
        stroke="currentColor"
        strokeWidth="2"
        strokeOpacity="0.3"
      />

      <path
        d="M20 12a8 8 0 0 0-8-8"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
      />
    </svg>
  );
}