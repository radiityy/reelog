import "server-only";

import {
  getAvatarBucketName,
  getSupabaseAdmin,
} from "@/lib/supabase-admin";

export function getUserAvatarUrl(
  avatarPath: string | null | undefined,
  fallbackUrl: string | null | undefined,
) {
  if (!avatarPath) {
    return fallbackUrl ?? null;
  }

  const supabase = getSupabaseAdmin();

  const { data } = supabase.storage
    .from(getAvatarBucketName())
    .getPublicUrl(avatarPath);

  return data.publicUrl;
}