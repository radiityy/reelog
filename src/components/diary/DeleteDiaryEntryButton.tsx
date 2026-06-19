"use client";

import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";

type DeleteDiaryEntryButtonProps = {
  entryId: string;
  title: string;
};

export function DeleteDiaryEntryButton({
  entryId,
  title,
}: DeleteDiaryEntryButtonProps) {
  const router = useRouter();

  const [isOpen, setIsOpen] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");

  useEffect(() => {
    if (!isOpen) {
      return;
    }

    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape" && !isDeleting) {
        setIsOpen(false);
        setErrorMessage("");
      }
    }

    window.addEventListener("keydown", handleKeyDown);

    return () => {
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [isOpen, isDeleting]);

  function openDialog() {
    setErrorMessage("");
    setIsOpen(true);
  }

  function closeDialog() {
    if (isDeleting) {
      return;
    }

    setErrorMessage("");
    setIsOpen(false);
  }

  async function handleDelete() {
    setErrorMessage("");
    setIsDeleting(true);

    try {
      const response = await fetch(`/api/diary/${entryId}`, {
        method: "DELETE",
      });

      const payload = (await response.json()) as {
        message?: string;
      };

      if (!response.ok) {
        setErrorMessage(
          payload.message ?? "Unable to delete this diary entry.",
        );
        return;
      }

      router.push("/diary");
      router.refresh();
    } catch {
      setErrorMessage("Unable to connect to the server.");
    } finally {
      setIsDeleting(false);
    }
  }

  return (
    <>
      <button
        type="button"
        onClick={openDialog}
        className="inline-flex rounded-full border border-red-900/70 px-5 py-2.5 text-sm font-semibold text-red-300 transition hover:border-red-700 hover:bg-red-950/30"
      >
        Delete entry
      </button>

      {isOpen ? (
        <div
          role="dialog"
          aria-modal="true"
          aria-labelledby="delete-entry-title"
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 px-4 backdrop-blur-sm"
          onMouseDown={(event) => {
            if (event.target === event.currentTarget) {
              closeDialog();
            }
          }}
        >
          <div className="w-full max-w-md rounded-xl border border-[#302C28] bg-[#171411] p-6 shadow-2xl shadow-black/50">
            <div className="flex h-11 w-11 items-center justify-center rounded-full bg-red-950/40 text-red-300">
              <TrashIcon className="h-5 w-5" />
            </div>

            <h2
              id="delete-entry-title"
              className="mt-5 text-xl font-semibold text-[#F4F1EB]"
            >
              Delete diary entry?
            </h2>

            <p className="mt-3 text-sm leading-6 text-[#8A8580]">
              <span className="font-medium text-[#C9C4BC]">
                {title}
              </span>{" "}
              will be removed from your diary, home page, and public
              profile.
            </p>

            <p className="mt-2 text-xs leading-5 text-[#625D58]">
              The entry is not permanently removed from the database,
              but it cannot be restored from the app yet.
            </p>

            {errorMessage ? (
              <p className="mt-4 rounded-md border border-red-900/50 bg-red-950/20 px-4 py-3 text-sm text-red-300">
                {errorMessage}
              </p>
            ) : null}

            <div className="mt-6 flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
              <button
                type="button"
                disabled={isDeleting}
                onClick={closeDialog}
                className="rounded-full border border-[#302C28] px-5 py-2.5 text-sm font-medium text-[#C9C4BC] transition hover:bg-[#211E1B] disabled:cursor-not-allowed disabled:opacity-50"
              >
                Cancel
              </button>

              <button
                type="button"
                disabled={isDeleting}
                onClick={handleDelete}
                className="rounded-full bg-red-700 px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-red-600 disabled:cursor-not-allowed disabled:opacity-50"
              >
                {isDeleting ? "Deleting..." : "Delete entry"}
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </>
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
        d="M4 7h16"
        stroke="currentColor"
        strokeWidth="1.7"
        strokeLinecap="round"
      />

      <path
        d="M9 3h6l1 4H8l1-4Z"
        stroke="currentColor"
        strokeWidth="1.7"
        strokeLinejoin="round"
      />

      <path
        d="m6.5 7 .8 13h9.4l.8-13"
        stroke="currentColor"
        strokeWidth="1.7"
        strokeLinejoin="round"
      />

      <path
        d="M10 11v5M14 11v5"
        stroke="currentColor"
        strokeWidth="1.7"
        strokeLinecap="round"
      />
    </svg>
  );
}