"use client";

import { useState } from "react";

type ShareProfileButtonProps = {
  username: string;
};

type ShareStatus = "idle" | "copied" | "error";

export function ShareProfileButton({
  username,
}: ShareProfileButtonProps) {
  const [status, setStatus] = useState<ShareStatus>("idle");

  async function copyProfileUrl(profileUrl: string) {
    if (navigator.clipboard?.writeText) {
      await navigator.clipboard.writeText(profileUrl);
      return;
    }

    const textarea = document.createElement("textarea");

    textarea.value = profileUrl;
    textarea.style.position = "fixed";
    textarea.style.opacity = "0";

    document.body.appendChild(textarea);
    textarea.focus();
    textarea.select();

    const copied = document.execCommand("copy");

    document.body.removeChild(textarea);

    if (!copied) {
      throw new Error("Unable to copy profile link.");
    }
  }

  function resetStatus() {
    window.setTimeout(() => {
      setStatus("idle");
    }, 2200);
  }

  async function handleShare() {
    const profileUrl = `${window.location.origin}/u/${username}`;

    setStatus("idle");

    try {
      if (navigator.share) {
        await navigator.share({
          title: `@${username} on Reelog`,
          text: `View @${username}'s film and series diary on Reelog.`,
          url: profileUrl,
        });

        return;
      }

      await copyProfileUrl(profileUrl);
      setStatus("copied");
      resetStatus();
    } catch (error) {
      if (
        error instanceof DOMException &&
        error.name === "AbortError"
      ) {
        return;
      }

      try {
        await copyProfileUrl(profileUrl);
        setStatus("copied");
      } catch {
        setStatus("error");
      }

      resetStatus();
    }
  }

  return (
    <div>
      <button
        type="button"
        onClick={handleShare}
        className="inline-flex items-center justify-center gap-2 rounded-full border border-[#302C28] px-5 py-2.5 text-sm font-semibold text-[#C9C4BC] transition hover:border-[#C84B18]/60 hover:bg-[#211E1B] hover:text-[#F4F1EB]"
      >
        <ShareIcon className="h-4 w-4" />

        {status === "copied" ? "Link copied" : "Share profile"}
      </button>

      <p
        aria-live="polite"
        className={[
          "mt-2 text-center text-xs",
          status === "error"
            ? "text-red-300"
            : "text-[#716B65]",
        ].join(" ")}
      >
        {status === "copied"
          ? "Profile link copied to clipboard."
          : status === "error"
            ? "Unable to share this profile."
            : ""}
      </p>
    </div>
  );
}

function ShareIcon({
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
        cx="18"
        cy="5"
        r="2.5"
        stroke="currentColor"
        strokeWidth="1.7"
      />

      <circle
        cx="6"
        cy="12"
        r="2.5"
        stroke="currentColor"
        strokeWidth="1.7"
      />

      <circle
        cx="18"
        cy="19"
        r="2.5"
        stroke="currentColor"
        strokeWidth="1.7"
      />

      <path
        d="m8.2 10.8 7.6-4.5M8.2 13.2l7.6 4.5"
        stroke="currentColor"
        strokeWidth="1.7"
        strokeLinecap="round"
      />
    </svg>
  );
}