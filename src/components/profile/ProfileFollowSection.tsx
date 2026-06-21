"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";

import { ShareProfileButton } from "@/components/profile/ShareProfileButton";

type FollowRelationship =
| "SELF"
| "NONE"
| "PENDING"
| "ACCEPTED"
| "REJECTED";

type FollowResponse = {
message?: string;
relationship?: FollowRelationship;
followsYou?: boolean;
counts?: {
followers: number;
following: number;
};
};

type ProfileFollowSectionProps = {
username: string;
isOwner: boolean;
isAuthenticated: boolean;
initialRelationship: FollowRelationship;
initialFollowsYou: boolean;
initialFollowersCount: number;
initialFollowingCount: number;
};

export function ProfileFollowSection({
username,
isOwner,
isAuthenticated,
initialRelationship,
initialFollowsYou,
initialFollowersCount,
initialFollowingCount,
}: ProfileFollowSectionProps) {
const router = useRouter();

const [relationship, setRelationship] =
useState<FollowRelationship>(initialRelationship);

const [followsYou, setFollowsYou] =
useState(initialFollowsYou);

const [followersCount, setFollowersCount] =
useState(initialFollowersCount);

const [followingCount, setFollowingCount] =
useState(initialFollowingCount);

const [isSubmitting, setIsSubmitting] =
useState(false);

const [errorMessage, setErrorMessage] =
useState("");

useEffect(() => {
setRelationship(initialRelationship);
setFollowsYou(initialFollowsYou);
setFollowersCount(initialFollowersCount);
setFollowingCount(initialFollowingCount);
}, [
initialRelationship,
initialFollowsYou,
initialFollowersCount,
initialFollowingCount,
]);

const shouldRemoveFollow =
relationship === "ACCEPTED" ||
relationship === "PENDING";

async function handleFollowAction() {
if (!isAuthenticated || isOwner) {
return;
}
setErrorMessage("");
setIsSubmitting(true);

try {
  const response = await fetch(
    `/api/users/${encodeURIComponent(username)}/follow`,
    {
      method: shouldRemoveFollow
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

  if (payload.counts) {
    setFollowersCount(
      payload.counts.followers,
    );

    setFollowingCount(
      payload.counts.following,
    );
  }

  router.refresh();
} catch {
  setErrorMessage(
    "Unable to connect to the server.",
  );
} finally {
  setIsSubmitting(false);
}
}

const buttonLabel = getFollowButtonLabel(
relationship,
followsYou,
isSubmitting,
);

return ( <div className="w-full lg:min-w-[340px]"> <div className="flex flex-wrap justify-start gap-3 lg:justify-end">
{isOwner ? ( <Link
         href="/settings"
         className="inline-flex items-center justify-center gap-2 rounded-full bg-[#C84B18] px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-[#DC5520]"
       > <EditIcon className="h-4 w-4" />
Edit profile </Link>
) : isAuthenticated ? (
<button
type="button"
onClick={handleFollowAction}
disabled={isSubmitting}
className={getFollowButtonClass(
relationship,
)}
>
{isSubmitting ? ( <LoadingIcon className="h-4 w-4 animate-spin" />
) : relationship === "ACCEPTED" ? ( <CheckIcon className="h-4 w-4" />
) : relationship === "PENDING" ? ( <ClockIcon className="h-4 w-4" />
) : ( <UserPlusIcon className="h-4 w-4" />
)}
        {buttonLabel}
      </button>
    ) : (
      <Link
        href={`/login?callbackUrl=${encodeURIComponent(
          `/u/${username}`,
        )}`}
        className="inline-flex items-center justify-center gap-2 rounded-full bg-[#C84B18] px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-[#DC5520]"
      >
        <UserPlusIcon className="h-4 w-4" />
        Follow
      </Link>
    )}

    <ShareProfileButton username={username} />
  </div>

  <div className="mt-5 flex flex-wrap items-center gap-x-6 gap-y-2 lg:justify-end">
    <SocialStat
      href={`/u/${username}/followers`}
      label={
        followersCount === 1
          ? "follower"
          : "followers"
      }
      value={followersCount}
    />

    <span
      aria-hidden="true"
      className="h-1 w-1 rounded-full bg-[#514C47]"
    />

    <SocialStat
      href={`/u/${username}/following`}
      label="following"
      value={followingCount}
    />
  </div>

  {!isOwner && followsYou ? (
    <div className="mt-3 flex justify-start lg:justify-end">
      <span className="inline-flex items-center gap-2 rounded-full border border-[#302C28] bg-[#171411] px-3 py-1.5 text-xs font-medium text-[#A7A19A]">
        <UserCheckIcon className="h-3.5 w-3.5 text-[#E45A1C]" />
        Follows you
      </span>
    </div>
  ) : null}

  {errorMessage ? (
    <p className="mt-4 rounded-lg border border-red-900/50 bg-red-950/20 px-4 py-3 text-sm text-red-300">
      {errorMessage}
    </p>
  ) : null}
</div>
);
}

function SocialStat({
href,
label,
value,
}: {
href: string;
label: string;
value: number;
}) {
return (
<Link
href={href}
aria-label={`View ${formatCount(value)} ${label}`}
className="group inline-flex items-baseline gap-1.5 rounded-md outline-none transition focus-visible:ring-2 focus-visible:ring-[#C84B18]/70 focus-visible:ring-offset-2 focus-visible:ring-offset-[#100E0C]"
> <span className="text-sm font-bold text-[#F4F1EB] transition group-hover:text-[#E45A1C]">
{formatCount(value)} </span>
  <span className="text-sm text-[#8A8580] transition group-hover:text-[#C9C4BC]">
    {label}
  </span>
</Link>
);
}

function getFollowButtonLabel(
relationship: FollowRelationship,
followsYou: boolean,
isSubmitting: boolean,
) {
if (isSubmitting) {
if (relationship === "PENDING") {
return "Cancelling...";
}

if (relationship === "ACCEPTED") {
  return "Unfollowing...";
}

return "Following...";
}

if (relationship === "PENDING") {
return "Requested";
}

if (relationship === "ACCEPTED") {
return "Following";
}

if (followsYou) {
return "Follow back";
}

return "Follow";
}

function getFollowButtonClass(
relationship: FollowRelationship,
) {
const baseClass =
"inline-flex items-center justify-center gap-2 rounded-full px-5 py-2.5 text-sm font-semibold transition disabled:cursor-not-allowed disabled:opacity-60";

if (relationship === "ACCEPTED") {
return `${baseClass} border border-[#3A3530] bg-[#211E1B] text-[#F4F1EB] hover:border-red-900/70 hover:bg-red-950/20 hover:text-red-300`;
}

if (relationship === "PENDING") {
return `${baseClass} border border-[#3A3530] bg-[#211E1B] text-[#A7A19A] hover:border-red-900/70 hover:bg-red-950/20 hover:text-red-300`;
}

return `${baseClass} bg-[#C84B18] text-white hover:bg-[#DC5520]`;
}

function formatCount(value: number) {
return new Intl.NumberFormat("en", {
notation:
value >= 1000 ? "compact" : "standard",
maximumFractionDigits: 1,
}).format(value);
}

function EditIcon({
className = "",
}: {
className?: string;
}) {
return ( <svg
   viewBox="0 0 24 24"
   fill="none"
   aria-hidden="true"
   className={className}
 > <path
     d="m14.5 5.5 4 4M4 20l4.5-1 10-10a2.83 2.83 0 0 0-4-4l-10 10L4 20Z"
     stroke="currentColor"
     strokeWidth="1.7"
     strokeLinecap="round"
     strokeLinejoin="round"
   /> </svg>
);
}

function UserPlusIcon({
className = "",
}: {
className?: string;
}) {
return ( <svg
   viewBox="0 0 24 24"
   fill="none"
   aria-hidden="true"
   className={className}
 > <circle
     cx="9"
     cy="8"
     r="4"
     stroke="currentColor"
     strokeWidth="1.7"
   />
  <path
    d="M3.5 20c.4-4 2.4-6 5.5-6s5.1 2 5.5 6M18 8v6M15 11h6"
    stroke="currentColor"
    strokeWidth="1.7"
    strokeLinecap="round"
  />
</svg>
);
}

function UserCheckIcon({
className = "",
}: {
className?: string;
}) {
return ( <svg
   viewBox="0 0 24 24"
   fill="none"
   aria-hidden="true"
   className={className}
 > <circle
     cx="8"
     cy="8"
     r="4"
     stroke="currentColor"
     strokeWidth="1.7"
   />
  <path
    d="M2.5 20c.4-4 2.4-6 5.5-6 2.1 0 3.7.9 4.6 2.7M15 16.5l2 2 4-5"
    stroke="currentColor"
    strokeWidth="1.7"
    strokeLinecap="round"
    strokeLinejoin="round"
  />
</svg>
);
}

function CheckIcon({
className = "",
}: {
className?: string;
}) {
return ( <svg
   viewBox="0 0 24 24"
   fill="none"
   aria-hidden="true"
   className={className}
 > <path
     d="m5 12.5 4.2 4.2L19 7"
     stroke="currentColor"
     strokeWidth="1.9"
     strokeLinecap="round"
     strokeLinejoin="round"
   /> </svg>
);
}

function ClockIcon({
className = "",
}: {
className?: string;
}) {
return ( <svg
   viewBox="0 0 24 24"
   fill="none"
   aria-hidden="true"
   className={className}
 > <circle
     cx="12"
     cy="12"
     r="8.5"
     stroke="currentColor"
     strokeWidth="1.7"
   />
  <path
    d="M12 7.5V12l3 2"
    stroke="currentColor"
    strokeWidth="1.7"
    strokeLinecap="round"
  />
</svg>
);
}

function LoadingIcon({
className = "",
}: {
className?: string;
}) {
return ( <svg
   viewBox="0 0 24 24"
   fill="none"
   aria-hidden="true"
   className={className}
 > <circle
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
