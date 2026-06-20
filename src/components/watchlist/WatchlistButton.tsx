"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

type WatchlistButtonProps = {
  tmdbId: number;
  mediaType: "movie" | "tv";
  title: string;
  initialSaved: boolean;
  variant?: "default" | "remove";
  fullWidth?: boolean;
};

export function WatchlistButton({
  tmdbId,
  mediaType,
  title,
  initialSaved,
  variant = "default",
  fullWidth = false,
}: WatchlistButtonProps) {
  const router = useRouter();

  const [isSaved, setIsSaved] = useState(initialSaved);
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");

  useEffect(() => {
    setIsSaved(initialSaved);
  }, [initialSaved]);

  async function handleToggle() {
    setErrorMessage("");
    setIsLoading(true);

    const nextSavedState = !isSaved;

    try {
      const response = await fetch("/api/watchlist", {
        method: isSaved ? "DELETE" : "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          tmdbId,
          mediaType,
        }),
      });

      const payload = (await response.json()) as {
        message?: string;
      };

      if (!response.ok) {
        setErrorMessage(
          payload.message ??
            "Unable to update your watchlist.",
        );
        return;
      }

      setIsSaved(nextSavedState);
      router.refresh();
    } catch {
      setErrorMessage("Unable to connect to the server.");
    } finally {
      setIsLoading(false);
    }
  }

  const label = isLoading
    ? isSaved
      ? "Removing..."
      : "Adding..."
    : isSaved
      ? variant === "remove"
        ? "Remove from watchlist"
        : "In watchlist"
      : "Add to watchlist";

  return (
    <div className={fullWidth ? "w-full" : ""}>
      <button
        type="button"
        aria-pressed={isSaved}
        aria-label={`${label}: ${title}`}
        disabled={isLoading}
        onClick={handleToggle}
        className={[
          "inline-flex items-center justify-center gap-2 rounded-full border px-4 py-2 text-xs font-medium transition disabled:cursor-not-allowed disabled:opacity-50",
          fullWidth ? "w-full" : "",
          isSaved
            ? variant === "remove"
              ? "border-red-900/60 text-red-300 hover:bg-red-950/30"
              : "border-[#C84B18]/50 bg-[#C84B18]/10 text-[#E45A1C] hover:bg-[#C84B18]/20"
            : "border-[#302C28] text-[#C9C4BC] hover:border-[#C84B18]/50 hover:text-[#E45A1C]",
        ].join(" ")}
      >
        <BookmarkIcon
          filled={isSaved}
          className="h-4 w-4"
        />

        {label}
      </button>

      {errorMessage ? (
        <p className="mt-2 text-xs leading-5 text-red-300">
          {errorMessage}
        </p>
      ) : null}
    </div>
  );
}

function BookmarkIcon({
  filled,
  className = "",
}: {
  filled: boolean;
  className?: string;
}) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill={filled ? "currentColor" : "none"}
      aria-hidden="true"
      className={className}
    >
      <path
        d="M7 4.5A1.5 1.5 0 0 1 8.5 3h7A1.5 1.5 0 0 1 17 4.5V21l-5-3-5 3V4.5Z"
        stroke="currentColor"
        strokeWidth="1.7"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}