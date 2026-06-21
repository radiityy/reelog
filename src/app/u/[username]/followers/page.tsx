import {
  FollowStatus,
  type User,
} from "@prisma/client";
import { getServerSession } from "next-auth";
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

type FollowersPageProps = {
  params: {
    username: string;
  };
};

export default async function FollowersPage({
  params,
}: FollowersPageProps) {
  const session = await getServerSession(authOptions);
  const viewerId = session?.user?.id ?? null;

  const username = normalizeUsername(
    params.username,
  );

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
    followingId: profile.id,
    status: FollowStatus.ACCEPTED,
    follower: {
      onboardingCompleted: true,
      deletedAt: null,
      suspendedAt: null,
    },
  } as const;

  const [rows, totalCount] =
    await Promise.all([
      prisma.follow.findMany({
        where: connectionWhere,
        orderBy: {
          respondedAt: "desc",
        },
        take: 100,
        select: {
          follower: {
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
  .map((row) => row.follower)
  .filter(
    (user): user is ConnectionUser =>
      Boolean(user.username),
  );

  const items = await buildConnectionItems(
    users,
    viewerId,
  );

  const displayName =
    profile.name?.trim() ||
    `@${profile.username}`;

  return (
    <ProfileConnectionsList
      profileUsername={profile.username}
      profileDisplayName={displayName}
      kind="followers"
      isOwner={isOwner}
      isAuthenticated={Boolean(viewerId)}
      totalCount={totalCount}
      initialItems={items}
    />
  );
}

type ConnectionUser = Pick<
  User,
  | "id"
  | "username"
  | "name"
  | "bio"
  | "image"
  | "avatarPath"
  | "isPublic"
>;

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

  const [outgoing, incoming] =
    userIds.length > 0
      ? await Promise.all([
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
        ])
      : [[], []];

  const outgoingMap = new Map(
    outgoing.map((follow) => [
      follow.followingId,
      follow.status as ConnectionRelationship,
    ]),
  );

  const incomingSet = new Set(
    incoming.map((follow) => follow.followerId),
  );

  return users.map((user) => {
    const isViewer = user.id === viewerId;

    return mapConnectionItem(
      user,
      isViewer
        ? "SELF"
        : outgoingMap.get(user.id) ?? "NONE",
      incomingSet.has(user.id),
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
    username: user.username as string,
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
      <h1 className="text-2xl font-bold text-[#F4F1EB]">
        This account is private
      </h1>

      <p className="mt-3 text-sm text-[#8A8580]">
        Follow @{username} to view their
        connections.
      </p>
    </main>
  );
}

function normalizeUsername(value: string) {
  return decodeURIComponent(value)
    .trim()
    .toLowerCase();
}