import { randomUUID } from "node:crypto";

import { revalidatePath } from "next/cache";
import { getServerSession } from "next-auth";
import { NextResponse } from "next/server";

import { getUserAvatarUrl } from "@/lib/avatar";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import {
  getAvatarBucketName,
  getSupabaseAdmin,
} from "@/lib/supabase-admin";

export const runtime = "nodejs";

const MAX_AVATAR_SIZE = 2 * 1024 * 1024;

const allowedMimeTypes = [
  "image/jpeg",
  "image/png",
  "image/webp",
] as const;

type AllowedMimeType =
  (typeof allowedMimeTypes)[number];

const extensionByMimeType: Record<
  AllowedMimeType,
  string
> = {
  "image/jpeg": "jpg",
  "image/png": "png",
  "image/webp": "webp",
};

export async function POST(request: Request) {
  const session = await getServerSession(authOptions);

  if (!session?.user?.id) {
    return NextResponse.json(
      {
        message: "Unauthorized.",
      },
      {
        status: 401,
      },
    );
  }

  let formData: FormData;

  try {
    formData = await request.formData();
  } catch {
    return NextResponse.json(
      {
        message: "Invalid upload request.",
      },
      {
        status: 400,
      },
    );
  }

  const avatar = formData.get("avatar");

  if (!(avatar instanceof File)) {
    return NextResponse.json(
      {
        message: "Choose an image to upload.",
      },
      {
        status: 422,
      },
    );
  }

  if (avatar.size === 0) {
    return NextResponse.json(
      {
        message: "The selected image is empty.",
      },
      {
        status: 422,
      },
    );
  }

  if (avatar.size > MAX_AVATAR_SIZE) {
    return NextResponse.json(
      {
        message: "Profile photo cannot exceed 2 MB.",
      },
      {
        status: 422,
      },
    );
  }

  if (
    !allowedMimeTypes.includes(
      avatar.type as AllowedMimeType,
    )
  ) {
    return NextResponse.json(
      {
        message:
          "Only JPG, PNG, and WebP images are allowed.",
      },
      {
        status: 422,
      },
    );
  }

  const user = await prisma.user.findFirst({
    where: {
      id: session.user.id,
      deletedAt: null,
      suspendedAt: null,
      onboardingCompleted: true,
    },
    select: {
      id: true,
      username: true,
      image: true,
      avatarPath: true,
    },
  });

  if (!user) {
    return NextResponse.json(
      {
        message: "User account was not found.",
      },
      {
        status: 404,
      },
    );
  }

  const buffer = Buffer.from(
    await avatar.arrayBuffer(),
  );

  const detectedMimeType = detectImageMimeType(buffer);

  if (!detectedMimeType) {
    return NextResponse.json(
      {
        message:
          "The selected file is not a valid JPG, PNG, or WebP image.",
      },
      {
        status: 422,
      },
    );
  }

  if (detectedMimeType !== avatar.type) {
    return NextResponse.json(
      {
        message:
          "The image content does not match its file type.",
      },
      {
        status: 422,
      },
    );
  }

  const extension =
    extensionByMimeType[detectedMimeType];

  const objectPath = `${user.id}/${randomUUID()}.${extension}`;

  const supabase = getSupabaseAdmin();
  const bucketName = getAvatarBucketName();

  const { error: uploadError } = await supabase.storage
    .from(bucketName)
    .upload(objectPath, buffer, {
      cacheControl: "31536000",
      contentType: detectedMimeType,
      upsert: false,
    });

  if (uploadError) {
    console.error(
      "Avatar storage upload failed:",
      uploadError,
    );

    return NextResponse.json(
      {
        message: "Unable to upload the profile photo.",
      },
      {
        status: 500,
      },
    );
  }

  try {
    await prisma.user.update({
      where: {
        id: user.id,
      },
      data: {
        avatarPath: objectPath,
      },
    });
  } catch (error) {
    await supabase.storage
      .from(bucketName)
      .remove([objectPath]);

    console.error("Avatar database update failed:", error);

    return NextResponse.json(
      {
        message: "Unable to save the profile photo.",
      },
      {
        status: 500,
      },
    );
  }

  if (
    user.avatarPath &&
    user.avatarPath !== objectPath
  ) {
    const { error: removeOldAvatarError } =
      await supabase.storage
        .from(bucketName)
        .remove([user.avatarPath]);

    if (removeOldAvatarError) {
      console.error(
        "Failed to remove previous avatar:",
        removeOldAvatarError,
      );
    }
  }

  revalidateUserPages(user.username);

  return NextResponse.json({
    message: "Profile photo updated.",
    avatarUrl: getUserAvatarUrl(
      objectPath,
      user.image,
    ),
    hasCustomAvatar: true,
  });
}

export async function DELETE() {
  const session = await getServerSession(authOptions);

  if (!session?.user?.id) {
    return NextResponse.json(
      {
        message: "Unauthorized.",
      },
      {
        status: 401,
      },
    );
  }

  const user = await prisma.user.findFirst({
    where: {
      id: session.user.id,
      deletedAt: null,
      suspendedAt: null,
      onboardingCompleted: true,
    },
    select: {
      id: true,
      username: true,
      image: true,
      avatarPath: true,
    },
  });

  if (!user) {
    return NextResponse.json(
      {
        message: "User account was not found.",
      },
      {
        status: 404,
      },
    );
  }

  if (!user.avatarPath) {
    return NextResponse.json({
      message: "Custom profile photo is already removed.",
      avatarUrl: user.image,
      hasCustomAvatar: false,
    });
  }

  try {
    await prisma.user.update({
      where: {
        id: user.id,
      },
      data: {
        avatarPath: null,
      },
    });

    const supabase = getSupabaseAdmin();

    const { error: removeError } =
      await supabase.storage
        .from(getAvatarBucketName())
        .remove([user.avatarPath]);

    if (removeError) {
      console.error(
        "Failed to remove avatar from storage:",
        removeError,
      );
    }

    revalidateUserPages(user.username);

    return NextResponse.json({
      message:
        "Custom profile photo removed. Your Google photo will be used again.",
      avatarUrl: user.image,
      hasCustomAvatar: false,
    });
  } catch (error) {
    console.error("Failed to remove avatar:", error);

    return NextResponse.json(
      {
        message: "Unable to remove the profile photo.",
      },
      {
        status: 500,
      },
    );
  }
}

function revalidateUserPages(
  username: string | null,
) {
  revalidatePath("/home");
  revalidatePath("/settings");
  revalidatePath("/diary");
  revalidatePath("/watchlist");

  if (username) {
    revalidatePath(`/u/${username}`);
  }
}

function detectImageMimeType(
  buffer: Buffer,
): AllowedMimeType | null {
  if (
    buffer.length >= 3 &&
    buffer[0] === 0xff &&
    buffer[1] === 0xd8 &&
    buffer[2] === 0xff
  ) {
    return "image/jpeg";
  }

  if (
    buffer.length >= 8 &&
    buffer[0] === 0x89 &&
    buffer[1] === 0x50 &&
    buffer[2] === 0x4e &&
    buffer[3] === 0x47 &&
    buffer[4] === 0x0d &&
    buffer[5] === 0x0a &&
    buffer[6] === 0x1a &&
    buffer[7] === 0x0a
  ) {
    return "image/png";
  }

  if (
    buffer.length >= 12 &&
    buffer.subarray(0, 4).toString("ascii") ===
      "RIFF" &&
    buffer.subarray(8, 12).toString("ascii") ===
      "WEBP"
  ) {
    return "image/webp";
  }

  return null;
}