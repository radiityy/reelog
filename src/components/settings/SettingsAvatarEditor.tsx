"use client";

import {
  type ChangeEvent,
  useEffect,
  useRef,
  useState,
} from "react";
import { useRouter } from "next/navigation";

type SettingsAvatarEditorProps = {
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

const ALLOWED_MIME_TYPES = [
  "image/jpeg",
  "image/png",
  "image/webp",
];

export function SettingsAvatarEditor({
  username,
  initialAvatarUrl,
  initialHasCustomAvatar,
}: SettingsAvatarEditorProps) {
  const router = useRouter();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [avatarUrl, setAvatarUrl] = useState(initialAvatarUrl);
  const [hasCustomAvatar, setHasCustomAvatar] = useState(
    initialHasCustomAvatar,
  );
  const [selectedFile, setSelectedFile] = useState<File | null>(
    null,
  );
  const [previewUrl, setPreviewUrl] = useState<string | null>(
    null,
  );
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [showRemoveConfirmation, setShowRemoveConfirmation] =
    useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [isRemoving, setIsRemoving] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");

  const displayedAvatarUrl = previewUrl ?? avatarUrl;
  const avatarInitial = username.charAt(0).toUpperCase();
  const isBusy = isUploading || isRemoving;

  useEffect(() => {
    setAvatarUrl(initialAvatarUrl);
    setHasCustomAvatar(initialHasCustomAvatar);
  }, [initialAvatarUrl, initialHasCustomAvatar]);

  useEffect(() => {
    if (!isModalOpen) {
      return;
    }

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    function handleKeyDown(event: KeyboardEvent) {
      if (event.key !== "Escape" || isBusy) {
        return;
      }

      if (showRemoveConfirmation) {
        setShowRemoveConfirmation(false);
        return;
      }

      closeModal();
    }

    window.addEventListener("keydown", handleKeyDown);

    return () => {
      document.body.style.overflow = previousOverflow;
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [isModalOpen, isBusy, showRemoveConfirmation]);

  useEffect(() => {
    return () => {
      if (previewUrl) {
        URL.revokeObjectURL(previewUrl);
      }
    };
  }, [previewUrl]);

  function openModal() {
    if (isBusy) {
      return;
    }

    setErrorMessage("");
    setShowRemoveConfirmation(false);
    setIsModalOpen(true);
  }

  function closeModal() {
    if (isBusy) {
      return;
    }

    clearSelectedFile();
    setErrorMessage("");
    setShowRemoveConfirmation(false);
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
    setShowRemoveConfirmation(false);

    if (!file) {
      return;
    }

    if (!ALLOWED_MIME_TYPES.includes(file.type)) {
      setErrorMessage(
        "Only JPG, PNG, and WebP images are allowed.",
      );
      event.target.value = "";
      return;
    }

    if (file.size > MAX_AVATAR_SIZE) {
      setErrorMessage("Profile photo cannot exceed 2 MB.");
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
      const response = await fetch("/api/settings/avatar", {
        method: "POST",
        body: formData,
      });

      const payload = (await response.json()) as AvatarResponse;

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
      setShowRemoveConfirmation(false);
      setIsModalOpen(false);
      router.refresh();
    } catch {
      setErrorMessage("Unable to connect to the server.");
    } finally {
      setIsUploading(false);
    }
  }

  async function handleRemove() {
    setErrorMessage("");
    setIsRemoving(true);

    try {
      const response = await fetch("/api/settings/avatar", {
        method: "DELETE",
      });

      const payload = (await response.json()) as AvatarResponse;

      if (!response.ok) {
        setErrorMessage(
          payload.message ??
            "Unable to remove the profile photo.",
        );
        setShowRemoveConfirmation(false);
        return;
      }

      setAvatarUrl(payload.avatarUrl ?? null);
      setHasCustomAvatar(false);
      clearSelectedFile();
      setShowRemoveConfirmation(false);
      setIsModalOpen(false);
      router.refresh();
    } catch {
      setErrorMessage("Unable to connect to the server.");
      setShowRemoveConfirmation(false);
    } finally {
      setIsRemoving(false);
    }
  }

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

      <button
        type="button"
        onClick={openModal}
        disabled={isBusy}
        aria-label="Change profile photo"
        className="group relative h-20 w-20 shrink-0 overflow-visible rounded-full focus:outline-none focus:ring-2 focus:ring-[#C84B18] focus:ring-offset-4 focus:ring-offset-[#191613] disabled:cursor-not-allowed disabled:opacity-60"
      >
        <span className="relative block h-20 w-20 overflow-hidden rounded-full bg-[#9B7567] shadow-lg shadow-black/25 transition group-hover:scale-[1.03]">
          <AvatarContent
            avatarUrl={avatarUrl}
            fallback={avatarInitial}
          />

          <span className="absolute inset-0 flex flex-col items-center justify-center gap-1 bg-black/60 text-white opacity-0 transition group-hover:opacity-100 group-focus-visible:opacity-100">
            <CameraIcon className="h-5 w-5" />
            <span className="text-[9px] font-semibold leading-tight">
              Change photo
            </span>
          </span>
        </span>

        <span className="absolute bottom-0 right-0 flex h-7 w-7 items-center justify-center rounded-full border-2 border-[#191613] bg-[#C84B18] text-white shadow-md">
          <CameraIcon className="h-3.5 w-3.5" />
        </span>
      </button>

      {isModalOpen ? (
        <div
          role="presentation"
          onMouseDown={(event) => {
            if (
              event.target === event.currentTarget &&
              !isBusy &&
              !showRemoveConfirmation
            ) {
              closeModal();
            }
          }}
          className="fixed inset-0 z-[100] flex items-center justify-center bg-black/75 px-4 py-8 backdrop-blur-sm"
        >
          <div
            role="dialog"
            aria-modal="true"
            aria-labelledby="profile-photo-title"
            className="w-full max-w-md rounded-2xl border border-[#302C28] bg-[#191613] p-6 shadow-2xl shadow-black/70"
          >
            {showRemoveConfirmation ? (
              <div>
                <div className="flex h-12 w-12 items-center justify-center rounded-full bg-red-950/40 text-red-300">
                  <TrashIcon className="h-5 w-5" />
                </div>

                <h2 className="mt-5 text-xl font-semibold text-[#F4F1EB]">
                  Remove profile photo?
                </h2>

                <p className="mt-2 text-sm leading-6 text-[#8A8580]">
                  Your custom profile photo will be deleted, your
                  Google account photo will be used again.
                </p>

                {errorMessage ? (
                  <p className="mt-5 rounded-lg border border-red-900/50 bg-red-950/20 px-4 py-3 text-sm leading-6 text-red-300">
                    {errorMessage}
                  </p>
                ) : null}

                <div className="mt-7 flex justify-end gap-3">
                  <button
                    type="button"
                    onClick={() =>
                      setShowRemoveConfirmation(false)
                    }
                    disabled={isRemoving}
                    className="rounded-full border border-[#3A3530] px-5 py-2.5 text-sm font-medium text-[#C9C4BC] transition hover:text-[#F4F1EB] disabled:opacity-50"
                  >
                    Cancel
                  </button>

                  <button
                    type="button"
                    onClick={handleRemove}
                    disabled={isRemoving}
                    className="rounded-full bg-red-600 px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-red-500 disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    {isRemoving ? "Removing..." : "Remove photo"}
                  </button>
                </div>
              </div>
            ) : (
              <>
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <h2
                      id="profile-photo-title"
                      className="text-xl font-semibold text-[#F4F1EB]"
                    >
                      Profile photo
                    </h2>

                    <p className="mt-1 text-sm leading-6 text-[#8A8580]">
                      Choose a JPG, PNG, or WebP image up to 2 MB.
                    </p>
                  </div>

                  <button
                    type="button"
                    onClick={closeModal}
                    disabled={isBusy}
                    aria-label="Close profile photo modal"
                    className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-[#8A8580] transition hover:bg-[#292521] hover:text-[#F4F1EB] disabled:opacity-50"
                  >
                    <CloseIcon className="h-4 w-4" />
                  </button>
                </div>

                <button
                  type="button"
                  onClick={openFilePicker}
                  disabled={isBusy}
                  className="group relative mx-auto mt-7 flex h-44 w-44 overflow-hidden rounded-full bg-[#9B7567] shadow-xl shadow-black/40 disabled:cursor-not-allowed disabled:opacity-60"
                >
                  <AvatarContent
                    avatarUrl={displayedAvatarUrl}
                    fallback={avatarInitial}
                  />

                  <span className="absolute inset-0 bg-black/45 transition group-hover:bg-black/65" />

                  <span className="absolute inset-0 flex flex-col items-center justify-center gap-2 text-white">
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
                    By uploading a photo, you confirm that you have
                    the right to use it. Inappropriate or harmful
                    profile images are not allowed on Reelog.
                  </p>
                </div>

                <div className="mt-6 flex flex-col-reverse gap-3 sm:flex-row sm:items-center sm:justify-between">
                  <div>
                    {hasCustomAvatar ? (
                      <button
                        type="button"
                        onClick={() => {
                          setErrorMessage("");
                          setShowRemoveConfirmation(true);
                        }}
                        disabled={isBusy}
                        className="rounded-full border border-red-900/60 px-4 py-2.5 text-sm font-medium text-red-300 transition hover:bg-red-950/30 disabled:cursor-not-allowed disabled:opacity-50"
                      >
                        Remove photo
                      </button>
                    ) : null}
                  </div>

                  <div className="flex justify-end gap-3">
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
                      {isUploading ? "Uploading..." : "Save photo"}
                    </button>
                  </div>
                </div>
              </>
            )}
          </div>
        </div>
      ) : null}
    </>
  );
}

function AvatarContent({
  avatarUrl,
  fallback,
}: {
  avatarUrl: string | null;
  fallback: string;
}) {
  return (
    <>
      <span
        className="absolute inset-0 bg-cover bg-center"
        style={
          avatarUrl
            ? {
                backgroundImage: `url("${avatarUrl}")`,
              }
            : undefined
        }
      />

      {!avatarUrl ? (
        <span className="absolute inset-0 flex items-center justify-center text-xl font-bold text-white">
          {fallback}
        </span>
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

function TrashIcon({
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
        d="M5 7h14M9 7V4.5h6V7M8 10v7M12 10v7M16 10v7M6.5 7l.8 13h9.4l.8-13"
        stroke="currentColor"
        strokeWidth="1.7"
        strokeLinecap="round"
        strokeLinejoin="round"
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
