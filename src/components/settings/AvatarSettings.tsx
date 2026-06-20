"use client";

import {
  type ChangeEvent,
  useEffect,
  useRef,
  useState,
} from "react";
import { useRouter } from "next/navigation";

type AvatarSettingsProps = {
  username: string;
  initialAvatarUrl: string | null;
  initialHasCustomAvatar: boolean;
};

type AvatarResponse = {
  message?: string;
  avatarUrl?: string | null;
  hasCustomAvatar?: boolean;
};

const MAX_AVATAR_SIZE = 2 * 1024 * 1024;

const allowedMimeTypes = [
  "image/jpeg",
  "image/png",
  "image/webp",
];

export function AvatarSettings({
  username,
  initialAvatarUrl,
  initialHasCustomAvatar,
}: AvatarSettingsProps) {
  const router = useRouter();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [selectedFile, setSelectedFile] =
    useState<File | null>(null);

  const [previewUrl, setPreviewUrl] = useState<
    string | null
  >(null);

  const [avatarUrl, setAvatarUrl] = useState(
    initialAvatarUrl,
  );

  const [hasCustomAvatar, setHasCustomAvatar] =
    useState(initialHasCustomAvatar);

  const [isUploading, setIsUploading] =
    useState(false);

  const [isRemoving, setIsRemoving] =
    useState(false);

  const [errorMessage, setErrorMessage] =
    useState("");

  const [successMessage, setSuccessMessage] =
    useState("");

  const displayedAvatarUrl =
    previewUrl ?? avatarUrl;

  const avatarInitial = username
    .charAt(0)
    .toUpperCase();

  const isBusy = isUploading || isRemoving;

  useEffect(() => {
    return () => {
      if (previewUrl) {
        URL.revokeObjectURL(previewUrl);
      }
    };
  }, [previewUrl]);

  useEffect(() => {
    if (!successMessage) {
      return;
    }

    const timeout = window.setTimeout(() => {
      setSuccessMessage("");
    }, 3000);

    return () => {
      window.clearTimeout(timeout);
    };
  }, [successMessage]);

  function handleChooseFile() {
    if (!isBusy) {
      fileInputRef.current?.click();
    }
  }

  function handleFileChange(
    event: ChangeEvent<HTMLInputElement>,
  ) {
    const file = event.target.files?.[0];

    setErrorMessage("");
    setSuccessMessage("");

    if (!file) {
      return;
    }

    if (!allowedMimeTypes.includes(file.type)) {
      setErrorMessage(
        "Only JPG, PNG, and WebP images are allowed.",
      );

      event.target.value = "";
      return;
    }

    if (file.size > MAX_AVATAR_SIZE) {
      setErrorMessage(
        "Profile photo cannot exceed 2 MB.",
      );

      event.target.value = "";
      return;
    }

    if (previewUrl) {
      URL.revokeObjectURL(previewUrl);
    }

    const nextPreviewUrl =
      URL.createObjectURL(file);

    setSelectedFile(file);
    setPreviewUrl(nextPreviewUrl);
  }

  function clearSelectedFile() {
    if (previewUrl) {
      URL.revokeObjectURL(previewUrl);
    }

    setSelectedFile(null);
    setPreviewUrl(null);

    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  }

  async function handleUpload() {
    if (!selectedFile) {
      return;
    }

    setErrorMessage("");
    setSuccessMessage("");
    setIsUploading(true);

    const formData = new FormData();

    formData.append("avatar", selectedFile);

    try {
      const response = await fetch(
        "/api/settings/avatar",
        {
          method: "POST",
          body: formData,
        },
      );

      const payload =
        (await response.json()) as AvatarResponse;

      if (!response.ok) {
        setErrorMessage(
          payload.message ??
            "Unable to upload the profile photo.",
        );

        return;
      }

      setAvatarUrl(payload.avatarUrl ?? null);
      setHasCustomAvatar(true);
      clearSelectedFile();

      setSuccessMessage(
        payload.message ??
          "Profile photo updated.",
      );

      router.refresh();
    } catch {
      setErrorMessage(
        "Unable to connect to the server.",
      );
    } finally {
      setIsUploading(false);
    }
  }

  async function handleRemove() {
    const confirmed = window.confirm(
      "Remove your custom profile photo and return to your Google photo?",
    );

    if (!confirmed) {
      return;
    }

    setErrorMessage("");
    setSuccessMessage("");
    setIsRemoving(true);

    try {
      const response = await fetch(
        "/api/settings/avatar",
        {
          method: "DELETE",
        },
      );

      const payload =
        (await response.json()) as AvatarResponse;

      if (!response.ok) {
        setErrorMessage(
          payload.message ??
            "Unable to remove the profile photo.",
        );

        return;
      }

      setAvatarUrl(payload.avatarUrl ?? null);
      setHasCustomAvatar(false);
      clearSelectedFile();

      setSuccessMessage(
        payload.message ??
          "Custom profile photo removed.",
      );

      router.refresh();
    } catch {
      setErrorMessage(
        "Unable to connect to the server.",
      );
    } finally {
      setIsRemoving(false);
    }
  }

  return (
    <section className="rounded-xl border border-[#2B2723] bg-[#191613] p-5 sm:p-6">
      <div>
        <h2 className="text-xl font-semibold text-[#F4F1EB]">
          Profile photo
        </h2>

        <p className="mt-1 text-sm leading-6 text-[#8A8580]">
          JPG, PNG, or WebP. Maximum file size 2 MB.
        </p>
      </div>

      <div className="mt-7 flex flex-col gap-7 sm:flex-row sm:items-center">
        <div className="shrink-0">
          <input
            ref={fileInputRef}
            type="file"
            accept="image/jpeg,image/png,image/webp"
            disabled={isBusy}
            onChange={handleFileChange}
            className="hidden"
          />

          <button
            type="button"
            onClick={handleChooseFile}
            disabled={isBusy}
            aria-label="Choose profile photo"
            className="group relative flex h-36 w-36 overflow-hidden rounded-full bg-[#9B7567] shadow-xl shadow-black/30 transition disabled:cursor-not-allowed disabled:opacity-60"
          >
            <span
              className="absolute inset-0 bg-cover bg-center"
              style={
                displayedAvatarUrl
                  ? {
                      backgroundImage: `url("${displayedAvatarUrl}")`,
                    }
                  : undefined
              }
            />

            {!displayedAvatarUrl ? (
              <span className="absolute inset-0 flex items-center justify-center text-4xl font-bold text-white">
                {avatarInitial}
              </span>
            ) : null}

            <span className="absolute inset-0 flex flex-col items-center justify-center gap-2 bg-black/55 text-white opacity-0 transition group-hover:opacity-100 group-focus-visible:opacity-100">
              <CameraIcon className="h-8 w-8" />

              <span className="text-sm font-semibold">
                Choose photo
              </span>
            </span>
          </button>
        </div>

        <div className="min-w-0 flex-1">
          {selectedFile ? (
            <div className="rounded-lg border border-[#302C28] bg-[#100E0C] px-4 py-3">
              <p className="truncate text-sm font-medium text-[#F4F1EB]">
                {selectedFile.name}
              </p>

              <p className="mt-1 text-xs text-[#716B65]">
                {formatFileSize(selectedFile.size)}
              </p>
            </div>
          ) : (
            <p className="text-sm leading-6 text-[#8A8580]">
              Click your profile photo to choose a new image.
            </p>
          )}

          <div className="mt-4 flex flex-wrap gap-3">
            {selectedFile ? (
              <>
                <button
                  type="button"
                  disabled={isBusy}
                  onClick={handleUpload}
                  className="rounded-full bg-[#C84B18] px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-[#DC5520] disabled:cursor-not-allowed disabled:opacity-50"
                >
                  {isUploading
                    ? "Uploading..."
                    : "Save photo"}
                </button>

                <button
                  type="button"
                  disabled={isBusy}
                  onClick={clearSelectedFile}
                  className="rounded-full border border-[#3A3530] px-5 py-2.5 text-sm font-medium text-[#C9C4BC] transition hover:border-[#625D58] hover:text-[#F4F1EB] disabled:cursor-not-allowed disabled:opacity-50"
                >
                  Cancel
                </button>
              </>
            ) : null}

            {!selectedFile &&
            hasCustomAvatar ? (
              <button
                type="button"
                disabled={isBusy}
                onClick={handleRemove}
                className="rounded-full border border-red-900/60 px-5 py-2.5 text-sm font-medium text-red-300 transition hover:bg-red-950/30 disabled:cursor-not-allowed disabled:opacity-50"
              >
                {isRemoving
                  ? "Removing..."
                  : "Remove photo"}
              </button>
            ) : null}
          </div>

          {errorMessage ? (
            <p className="mt-4 rounded-lg border border-red-900/50 bg-red-950/20 px-4 py-3 text-sm text-red-300">
              {errorMessage}
            </p>
          ) : null}

          {successMessage ? (
            <p className="mt-4 rounded-lg border border-emerald-900/50 bg-emerald-950/20 px-4 py-3 text-sm text-emerald-300">
              {successMessage}
            </p>
          ) : null}
        </div>
      </div>

      <div className="mt-7 border-t border-[#302C28] pt-5">
        <div className="flex gap-3 rounded-lg bg-[#25221F] px-4 py-4">
          <InfoIcon className="mt-0.5 h-5 w-5 shrink-0 text-[#A7A19A]" />

          <p className="text-sm leading-6 text-[#C9C4BC]">
            By uploading a photo, you confirm that you
            have the right to use it. Inappropriate or
            harmful profile images are not allowed on
            Reelog.
          </p>
        </div>
      </div>
    </section>
  );
}

function CameraIcon({
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
        d="M4 8.5A2.5 2.5 0 0 1 6.5 6H8l1.2-2h5.6L16 6h1.5A2.5 2.5 0 0 1 20 8.5v8A2.5 2.5 0 0 1 17.5 19h-11A2.5 2.5 0 0 1 4 16.5v-8Z"
        stroke="currentColor"
        strokeWidth="1.7"
        strokeLinejoin="round"
      />

      <circle
        cx="12"
        cy="12.5"
        r="3.5"
        stroke="currentColor"
        strokeWidth="1.7"
      />
    </svg>
  );
}

function InfoIcon({
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
        r="9"
        stroke="currentColor"
        strokeWidth="1.7"
      />

      <path
        d="M12 10.5V16M12 7.5h.01"
        stroke="currentColor"
        strokeWidth="1.7"
        strokeLinecap="round"
      />
    </svg>
  );
}

function formatFileSize(size: number) {
  if (size < 1024) {
    return `${size} B`;
  }

  if (size < 1024 * 1024) {
    return `${(size / 1024).toFixed(1)} KB`;
  }

  return `${(size / (1024 * 1024)).toFixed(1)} MB`;
}