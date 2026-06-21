import { FollowStatus } from "@prisma/client";
import { getServerSession } from "next-auth";
import Link from "next/link";
import { notFound } from "next/navigation";

import {
  ProfileConnectionsList,
  type ConnectionRelationship,
  type ProfileConnectionItem,
} from "@/components/profile/ProfileConnectionsList";
import { getUserAvatarUrl } from "@/lib/avatar";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

type FollowingPageProps = {
  params: {
    username: string;
  };
};

type ConnectionUser = {
  id: string;
  username: string;
  name: string | null;
  bio: string | null;
  image: string | null;
  avatarPath: string | null;
  isPublic: boolean;
};

export default async function FollowingPage({
  params,
}: FollowingPageProps) {
  const session = await getServerSession(authOptions);
  const viewerId = session?.user?.id ?? null;

  const username = normalizeUsername(params.username);

  const profile = await prisma.user.findFirst({
    where: {
      username,
      onboardingCompleted: true,
      deletedAt: null,
      suspendedAt: null,
    },
    select: {
      id: true,
      username: true,
      name: true,
      isPublic: true,
    },
  });

  if (!profile?.username) {
    notFound();
  }

  const isOwner = viewerId === profile.id;

  const canView = await canViewConnections({
    viewerId,
    profileId: profile.id,
    isOwner,
    isPublic: profile.isPublic,
  });

  if (!canView) {
    return (
      <PrivateConnectionsState
        username={profile.username}
      />
    );
  }

  const connectionWhere = {
    followerId: profile.id,
    status: FollowStatus.ACCEPTED,
    following: {
      onboardingCompleted: true,
      deletedAt: null,
      suspendedAt: null,
    },
  } as const;

  const [rows, totalCount] = await Promise.all([
    prisma.follow.findMany({
      where: connectionWhere,
      orderBy: {
        respondedAt: "desc",
      },
      take: 100,
      select: {
        following: {
          select: {
            id: true,
            username: true,
            name: true,
            bio: true,
            image: true,
            avatarPath: true,
            isPublic: true,
          },
        },
      },
    }),

    prisma.follow.count({
      where: connectionWhere,
    }),
  ]);

  const users = rows
    .map((row) => row.following)
    .filter(
      (user): user is ConnectionUser =>
        Boolean(user.username),
    );

  const items = await buildConnectionItems(
    users,
    viewerId,
  );

  const displayName =
    profile.name?.trim() || `@${profile.username}`;

  return (
    <ProfileConnectionsList
      profileUsername={profile.username}
      profileDisplayName={displayName}
      kind="following"
      isOwner={isOwner}
      isAuthenticated={Boolean(viewerId)}
      totalCount={totalCount}
      initialItems={items}
    />
  );
}

async function buildConnectionItems(
  users: ConnectionUser[],
  viewerId: string | null,
): Promise<ProfileConnectionItem[]> {
  if (!viewerId) {
    return users.map((user) =>
      mapConnectionItem(
        user,
        "NONE",
        false,
        false,
      ),
    );
  }

  const userIds = users.map((user) => user.id);

  if (userIds.length === 0) {
    return [];
  }

  const [outgoingRelationships, incomingRelationships] =
    await Promise.all([
      prisma.follow.findMany({
        where: {
          followerId: viewerId,
          followingId: {
            in: userIds,
          },
        },
        select: {
          followingId: true,
          status: true,
        },
      }),

      prisma.follow.findMany({
        where: {
          followingId: viewerId,
          followerId: {
            in: userIds,
          },
          status: FollowStatus.ACCEPTED,
        },
        select: {
          followerId: true,
        },
      }),
    ]);

  const outgoingRelationshipMap = new Map<
    string,
    ConnectionRelationship
  >(
    outgoingRelationships.map((follow) => [
      follow.followingId,
      follow.status,
    ]),
  );

  const incomingRelationshipSet = new Set(
    incomingRelationships.map(
      (follow) => follow.followerId,
    ),
  );

  return users.map((user) => {
    const isViewer = user.id === viewerId;

    return mapConnectionItem(
      user,
      isViewer
        ? "SELF"
        : outgoingRelationshipMap.get(user.id) ??
            "NONE",
      incomingRelationshipSet.has(user.id),
      isViewer,
    );
  });
}

function mapConnectionItem(
  user: ConnectionUser,
  relationship: ConnectionRelationship,
  followsYou: boolean,
  isViewer: boolean,
): ProfileConnectionItem {
  return {
    id: user.id,
    username: user.username,
    name: user.name,
    bio: user.bio,
    avatarUrl: getUserAvatarUrl(
      user.avatarPath,
      user.image,
    ),
    isPrivate: !user.isPublic,
    relationship,
    followsYou,
    isViewer,
  };
}

async function canViewConnections({
  viewerId,
  profileId,
  isOwner,
  isPublic,
}: {
  viewerId: string | null;
  profileId: string;
  isOwner: boolean;
  isPublic: boolean;
}) {
  if (isOwner || isPublic) {
    return true;
  }

  if (!viewerId) {
    return false;
  }

  const relationship =
    await prisma.follow.findUnique({
      where: {
        followerId_followingId: {
          followerId: viewerId,
          followingId: profileId,
        },
      },
      select: {
        status: true,
      },
    });

  return (
    relationship?.status ===
    FollowStatus.ACCEPTED
  );
}

function PrivateConnectionsState({
  username,
}: {
  username: string;
}) {
  return (
    <main className="mx-auto w-full max-w-4xl px-5 py-16 text-center md:px-8">
      <span className="mx-auto flex h-14 w-14 items-center justify-center rounded-full border border-[#302C28] bg-[#211E1B] text-[#8A8580]">
        <LockIcon className="h-6 w-6" />
      </span>

      <h1 className="mt-5 text-2xl font-bold text-[#F4F1EB]">
        This account is private
      </h1>

      <p className="mx-auto mt-3 max-w-md text-sm leading-6 text-[#8A8580]">
        Follow @{username} and wait for approval to
        view the accounts they follow.
      </p>

      <Link
        href={`/u/${username}`}
        className="mt-6 inline-flex rounded-full border border-[#302C28] px-5 py-2.5 text-sm font-medium text-[#C9C4BC] transition hover:border-[#C84B18]/60 hover:text-[#F4F1EB]"
      >
        Back to profile
      </Link>
    </main>
  );
}

function LockIcon({
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
      <rect
        x="5"
        y="10"
        width="14"
        height="10"
        rx="2"
        stroke="currentColor"
        strokeWidth="1.7"
      />

      <path
        d="M8 10V7.5a4 4 0 0 1 8 0V10"
        stroke="currentColor"
        strokeWidth="1.7"
        strokeLinecap="round"
      />
    </svg>
  );
}

function normalizeUsername(value: string) {
  return decodeURIComponent(value)
    .trim()
    .toLowerCase();
}