type ProfileAvatarEditorProps = {
  username?: string | null;
  name?: string | null;

  avatarUrl?: string | null;
  initialAvatarUrl?: string | null;
  image?: string | null;

  className?: string;

  [key: string]: unknown;
};

export function ProfileAvatarEditor({
  username,
  name,
  avatarUrl,
  initialAvatarUrl,
  image,
  className = "",
}: ProfileAvatarEditorProps) {
  const resolvedAvatarUrl =
    avatarUrl ?? initialAvatarUrl ?? image ?? null;

  const fallbackText =
    name?.trim() ||
    username?.trim() ||
    "R";

  const avatarInitial = fallbackText
    .charAt(0)
    .toUpperCase();

  return (
    <div
      className={[
        "relative h-32 w-32 shrink-0 overflow-hidden rounded-full bg-[#9B7567] shadow-xl shadow-black/30 sm:h-36 sm:w-36",
        className,
      ].join(" ")}
      aria-label={`${fallbackText} profile photo`}
    >
      {resolvedAvatarUrl ? (
        <span
          className="absolute inset-0 bg-cover bg-center"
          style={{
            backgroundImage: `url("${resolvedAvatarUrl}")`,
          }}
        />
      ) : (
        <span className="absolute inset-0 flex items-center justify-center text-4xl font-bold text-white">
          {avatarInitial}
        </span>
      )}
    </div>
  );
}

export default ProfileAvatarEditor;