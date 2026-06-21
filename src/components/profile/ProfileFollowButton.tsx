"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";

export type ProfileRelationship =
  | "SELF"
  | "NONE"
  | "PENDING"
  | "ACCEPTED"
  | "REJECTED";

type ProfileFollowButtonProps = {
  username: string;
  isOwner: boolean;
  isSignedIn: boolean;
  initialRelationship: ProfileRelationship;
  initialFollowsYou: boolean;
};

type FollowResponse = {
  message?: string;
  relationship?: ProfileRelationship;
  followsYou?: boolean;
};

export function ProfileFollowButton({
  username,
  isOwner,
  isSignedIn,
  initialRelationship,
  initialFollowsYou,
}: ProfileFollowButtonProps) {
  const router = useRouter();

  const [relationship, setRelationship] =
    useState<ProfileRelationship>(
      initialRelationship,
    );

  const [followsYou, setFollowsYou] = useState(
    initialFollowsYou,
  );

  const [isLoading, setIsLoading] =
    useState(false);

  const [errorMessage, setErrorMessage] =
    useState("");

  if (isOwner) {
    return null;
  }

  if (!isSignedIn) {
    return (
      <Link
        href={`/login?callbackUrl=${encodeURIComponent(
          `/u/${username}`,
        )}`}
        className="inline-flex items-center justify-center rounded-full bg-[#C84B18] px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-[#DC5520]"
      >
        Follow
      </Link>
    );
  }

  const isFollowing =
    relationship === "ACCEPTED";

  const isRequested =
    relationship === "PENDING";

  const shouldRemove =
    isFollowing || isRequested;

  const buttonLabel = isLoading
    ? "Please wait..."
    : isFollowing
      ? "Following"
      : isRequested
        ? "Requested"
        : followsYou
          ? "Follow back"
          : "Follow";

  async function handleFollowAction() {
    if (isLoading) {
      return;
    }

    setErrorMessage("");
    setIsLoading(true);

    try {
      const response = await fetch(
        `/api/users/${encodeURIComponent(
          username,
        )}/follow`,
        {
          method: shouldRemove
            ? "DELETE"
            : "POST",
        },
      );

      const payload =
        (await response.json()) as FollowResponse;

      if (!response.ok) {
        setErrorMessage(
          payload.message ??
            "Unable to update follow status.",
        );

        return;
      }

      if (payload.relationship) {
        setRelationship(payload.relationship);
      }

      if (
        typeof payload.followsYou === "boolean"
      ) {
        setFollowsYou(payload.followsYou);
      }

      router.refresh();
    } catch {
      setErrorMessage(
        "Unable to connect to the server.",
      );
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <div className="flex flex-col items-start gap-2 lg:items-end">
      <button
        type="button"
        onClick={handleFollowAction}
        disabled={isLoading}
        aria-busy={isLoading}
        className={[
          "inline-flex min-w-28 items-center justify-center rounded-full px-5 py-2.5 text-sm font-semibold transition disabled:cursor-not-allowed disabled:opacity-60",
          isFollowing
            ? "border border-[#3A3530] bg-[#211E1B] text-[#F4F1EB] hover:border-red-900/60 hover:bg-red-950/20 hover:text-red-300"
            : isRequested
              ? "border border-[#3A3530] bg-[#211E1B] text-[#A7A19A] hover:border-red-900/60 hover:text-red-300"
              : "bg-[#C84B18] text-white hover:bg-[#DC5520]",
        ].join(" ")}
      >
        {buttonLabel}
      </button>

      {errorMessage ? (
        <p className="max-w-56 text-left text-xs leading-5 text-red-300 lg:text-right">
          {errorMessage}
        </p>
      ) : null}
    </div>
  );
}