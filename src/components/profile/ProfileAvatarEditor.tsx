"use client";

import {
  type ChangeEvent,
  useEffect,
  useRef,
  useState,
} from "react";
import { useRouter } from "next/navigation";

type ProfileAvatarEditorProps = {
  username: string;
  initialAvatarUrl: string | null;
  initialHasCustomAvatar: boolean;
  editable: boolean;
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

export function ProfileAvatarEditor({
  username,
  initialAvatarUrl,
  initialHasCustomAvatar,
  editable,
}: ProfileAvatarEditorProps) {
  const router = useRouter();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [avatarUrl, setAvatarUrl] = useState(
    initialAvatarUrl,
  );

  const [hasCustomAvatar, setHasCustomAvatar] =
    useState(initialHasCustomAvatar);

  const [selectedFile, setSelectedFile] =
    useState<File | null>(null);

  const [previewUrl, setPreviewUrl] = useState<
    string | null
  >(null);

  const [isModalOpen, setIsModalOpen] =
    useState(false);

  const [isUploading, setIsUploading] =
    useState(false);

  const [isRemoving, setIsRemoving] =
    useState(false);

  const [errorMessage, setErrorMessage] =
    useState("");

  const displayedAvatarUrl =
    previewUrl ?? avatarUrl;

  const avatarInitial = username
    .charAt(0)
    .toUpperCase();

  const isBusy = isUploading || isRemoving;

  useEffect(() => {
    setAvatarUrl(initialAvatarUrl);
    setHasCustomAvatar(initialHasCustomAvatar);
  }, [
    initialAvatarUrl,
    initialHasCustomAvatar,
  ]);

  useEffect(() => {
    if (!isModalOpen) {
      return;
    }

    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape" && !isBusy) {
        closeModal();
      }
    }

    const previousOverflow =
      document.body.style.overflow;

    document.body.style.overflow = "hidden";
    window.addEventListener("keydown", handleKeyDown);

    return () => {
      document.body.style.overflow =
        previousOverflow;

      window.removeEventListener(
        "keydown",
        handleKeyDown,
      );
    };
  }, [isModalOpen, isBusy]);

  useEffect(() => {
    return () => {
      if (previewUrl) {
        URL.revokeObjectURL(previewUrl);
      }
    };
  }, [previewUrl]);

  function openModal() {
    if (!editable || isBusy) {
      return;
    }

    setErrorMessage("");
    setIsModalOpen(true);
  }

  function closeModal() {
    if (isBusy) {
      return;
    }

    clearSelectedFile();
    setErrorMessage("");
    setIsModalOpen(false);
  }

  function openFilePicker() {
    if (!isBusy) {
      fileInputRef.current?.click();
    }
  }

  function handleFileChange(
    event: ChangeEvent<HTMLInputElement>,
  ) {
    const file = event.target.files?.[0];

    setErrorMessage("");

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

    setSelectedFile(file);
    setPreviewUrl(URL.createObjectURL(file));
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
      setIsModalOpen(false);

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
      setIsModalOpen(false);

      router.refresh();
    } catch {
      setErrorMessage(
        "Unable to connect to the server.",
      );
    } finally {
      setIsRemoving(false);
    }
  }

  const avatarContent = (
    <>
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
        <span className="absolute inset-0 flex items-center justify-center text-3xl font-bold text-white">
          {avatarInitial}
        </span>
      ) : null}
    </>
  );

  return (
    <>
      <input
        ref={fileInputRef}
        type="file"
        accept="image/jpeg,image/png,image/webp"
        disabled={isBusy}
        onChange={handleFileChange}
        className="hidden"
      />

      {editable ? (
        <button
          type="button"
          onClick={openModal}
          disabled={isBusy}
          aria-label="Change profile photo"
          className="group relative h-32 w-32 shrink-0 overflow-hidden rounded-full bg-[#9B7567] shadow-xl shadow-black/30 transition hover:scale-[1.02] focus:outline-none focus:ring-2 focus:ring-[#C84B18] focus:ring-offset-4 focus:ring-offset-[#100E0C] disabled:cursor-not-allowed disabled:opacity-60"
        >
          {avatarContent}

          <span className="absolute inset-0 flex flex-col items-center justify-center gap-2 bg-black/55 text-white opacity-0 transition group-hover:opacity-100 group-focus-visible:opacity-100">
            <CameraIcon className="h-7 w-7" />

            <span className="text-xs font-semibold">
              Change photo
            </span>
          </span>
        </button>
      ) : (
        <div className="relative h-32 w-32 shrink-0 overflow-hidden rounded-full bg-[#9B7567] shadow-xl shadow-black/30">
          {avatarContent}
        </div>
      )}

      {isModalOpen ? (
        <div
          role="presentation"
          onMouseDown={(event) => {
            if (
              event.target === event.currentTarget &&
              !isBusy
            ) {
              closeModal();
            }
          }}
          className="fixed inset-0 z-[100] flex items-center justify-center bg-black/75 px-4 py-8 backdrop-blur-sm"
        >
          <div
            role="dialog"
            aria-modal="true"
            aria-labelledby="avatar-modal-title"
            className="w-full max-w-md rounded-2xl border border-[#302C28] bg-[#191613] p-6 shadow-2xl shadow-black/60"
          >
            <div className="flex items-start justify-between gap-4">
              <div>
                <h2
                  id="avatar-modal-title"
                  className="text-xl font-semibold text-[#F4F1EB]"
                >
                  Profile photo
                </h2>

                <p className="mt-1 text-sm leading-6 text-[#8A8580]">
                  Choose a JPG, PNG, or WebP image up to
                  2 MB.
                </p>
              </div>

              <button
                type="button"
                onClick={closeModal}
                disabled={isBusy}
                aria-label="Close"
                className="flex h-9 w-9 items-center justify-center rounded-full text-[#8A8580] transition hover:bg-[#292521] hover:text-[#F4F1EB] disabled:opacity-50"
              >
                <CloseIcon className="h-4 w-4" />
              </button>
            </div>

            <button
              type="button"
              onClick={openFilePicker}
              disabled={isBusy}
              className="group relative mx-auto mt-7 flex h-44 w-44 overflow-hidden rounded-full bg-[#9B7567] shadow-xl shadow-black/30 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {avatarContent}

              <span className="absolute inset-0 flex flex-col items-center justify-center gap-2 bg-black/55 text-white opacity-0 transition group-hover:opacity-100 group-focus-visible:opacity-100">
                <CameraIcon className="h-8 w-8" />

                <span className="text-sm font-semibold">
                  Choose photo
                </span>
              </span>
            </button>

            {selectedFile ? (
              <div className="mt-5 rounded-lg border border-[#302C28] bg-[#100E0C] px-4 py-3">
                <p className="truncate text-sm font-medium text-[#F4F1EB]">
                  {selectedFile.name}
                </p>

                <p className="mt-1 text-xs text-[#716B65]">
                  {formatFileSize(selectedFile.size)}
                </p>
              </div>
            ) : (
              <button
                type="button"
                onClick={openFilePicker}
                disabled={isBusy}
                className="mx-auto mt-5 block rounded-full border border-[#3A3530] px-5 py-2.5 text-sm font-medium text-[#C9C4BC] transition hover:border-[#C84B18]/60 hover:text-[#F4F1EB] disabled:opacity-50"
              >
                Choose photo
              </button>
            )}

            {errorMessage ? (
              <p className="mt-5 rounded-lg border border-red-900/50 bg-red-950/20 px-4 py-3 text-sm leading-6 text-red-300">
                {errorMessage}
              </p>
            ) : null}

            <div className="mt-6 flex gap-3 rounded-lg bg-[#25221F] px-4 py-4">
              <InfoIcon className="mt-0.5 h-5 w-5 shrink-0 text-[#A7A19A]" />

              <p className="text-xs leading-5 text-[#C9C4BC]">
                By uploading a photo, you confirm that
                you have the right to use it.
                Inappropriate or harmful profile images
                are not allowed on Reelog.
              </p>
            </div>

            <div className="mt-6 flex flex-wrap justify-between gap-3">
              <div>
                {hasCustomAvatar ? (
                  <button
                    type="button"
                    onClick={handleRemove}
                    disabled={isBusy}
                    className="rounded-full border border-red-900/60 px-4 py-2.5 text-sm font-medium text-red-300 transition hover:bg-red-950/30 disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    {isRemoving
                      ? "Removing..."
                      : "Remove photo"}
                  </button>
                ) : null}
              </div>

              <div className="flex gap-3">
                <button
                  type="button"
                  onClick={closeModal}
                  disabled={isBusy}
                  className="rounded-full border border-[#3A3530] px-5 py-2.5 text-sm font-medium text-[#C9C4BC] transition hover:text-[#F4F1EB] disabled:opacity-50"
                >
                  Cancel
                </button>

                <button
                  type="button"
                  onClick={handleUpload}
                  disabled={!selectedFile || isBusy}
                  className="rounded-full bg-[#C84B18] px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-[#DC5520] disabled:cursor-not-allowed disabled:opacity-40"
                >
                  {isUploading
                    ? "Uploading..."
                    : "Save photo"}
                </button>
              </div>
            </div>
          </div>
        </div>
      ) : null}
    </>
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

function CloseIcon({
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
        d="M7.5 7.5 16.5 16.5M16.5 7.5l-9 9"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
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