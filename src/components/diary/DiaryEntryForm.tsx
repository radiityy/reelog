"use client";

import {
  type FormEvent,
  type ReactNode,
  useRef,
  useState,
} from "react";
import { useRouter } from "next/navigation";

import { StarRating } from "@/components/diary/StarRating";
import {
  getTmdbPosterUrl,
  type TmdbTitleDetails,
} from "@/lib/tmdb";

type DiaryEntryInitialValues = {
  watchedAt: string;
  rating: number | null;
  isRewatch: boolean;
  review: string;
  privateNotes: string;
  spoiler: boolean;
  isPublic: boolean;
  reviewIsPublic: boolean;
};

type DiaryEntryFormProps = {
  media: TmdbTitleDetails;
  defaultIsPublic: boolean;
  defaultWatchedAt: string;
  mode?: "create" | "edit";
  entryId?: string;
  initialValues?: DiaryEntryInitialValues;
};

export function DiaryEntryForm({
  media,
  defaultIsPublic,
  defaultWatchedAt,
  mode = "create",
  entryId,
  initialValues,
}: DiaryEntryFormProps) {
  const router = useRouter();
  const reviewRef = useRef<HTMLTextAreaElement>(null);
  const isEditMode = mode === "edit";

  const posterUrl = getTmdbPosterUrl(media.posterPath, "w500");

  const [watchedAt, setWatchedAt] = useState(
    initialValues?.watchedAt ?? defaultWatchedAt,
  );

  const [rating, setRating] = useState<number | null>(
    initialValues?.rating ?? null,
  );

  const [isRewatch, setIsRewatch] = useState(
  initialValues?.isRewatch ?? false,
  );

  const [review, setReview] = useState(
    initialValues?.review ?? "",
  );

  const [privateNotes, setPrivateNotes] = useState(
    initialValues?.privateNotes ?? "",
  );

  const [spoiler, setSpoiler] = useState(
    initialValues?.spoiler ?? false,
  );

  const [isPublic, setIsPublic] = useState(
    initialValues?.isPublic ?? defaultIsPublic,
  );

  const [reviewIsPublic, setReviewIsPublic] = useState(
    initialValues?.reviewIsPublic ?? false,
  );

  const [errorMessage, setErrorMessage] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const hasReview = Boolean(review.trim());
  const canPublishReview = isPublic && hasReview;

  function applyReviewFormat(
    prefix: string,
    suffix: string,
    placeholder: string,
  ) {
    const textarea = reviewRef.current;

    if (!textarea) {
      return;
    }

    const selectionStart = textarea.selectionStart;
    const selectionEnd = textarea.selectionEnd;

    const selectedText =
      review.slice(selectionStart, selectionEnd) || placeholder;

    const nextReview =
      review.slice(0, selectionStart) +
      prefix +
      selectedText +
      suffix +
      review.slice(selectionEnd);

    if (nextReview.length > 1000) {
      setErrorMessage(
        "The formatted review would exceed 1000 characters.",
      );
      return;
    }

    setErrorMessage("");
    setReview(nextReview);

    window.requestAnimationFrame(() => {
      textarea.focus();

      const contentStart = selectionStart + prefix.length;
      const contentEnd = contentStart + selectedText.length;

      textarea.setSelectionRange(contentStart, contentEnd);
    });
  }

  function changeDiaryVisibility(nextIsPublic: boolean) {
    setIsPublic(nextIsPublic);

    if (!nextIsPublic) {
      setReviewIsPublic(false);
    }
  }

  function handleReviewChange(nextReview: string) {
    setReview(nextReview);

    if (!nextReview.trim()) {
      setReviewIsPublic(false);
      setSpoiler(false);
    }
  }

  function handleCancel() {
    if (isEditMode && entryId) {
      router.push(`/diary/${entryId}`);
      return;
    }

    router.back();
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (isEditMode && !entryId) {
      setErrorMessage("Diary entry ID is missing.");
      return;
    }

    setErrorMessage("");
    setIsSubmitting(true);

    const editablePayload = {
      watchedAt,
      rating,
      isRewatch,
      review,
      privateNotes,
      spoiler,
      isPublic,
      reviewIsPublic,
    };

    const requestBody = isEditMode
      ? editablePayload
      : {
          tmdbId: media.id,
          mediaType: media.mediaType,
          ...editablePayload,
        };

    const endpoint =
      isEditMode && entryId
        ? `/api/diary/${entryId}`
        : "/api/diary";

    try {
      const response = await fetch(endpoint, {
        method: isEditMode ? "PATCH" : "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(requestBody),
      });

      const payload = (await response.json()) as {
        message?: string;
      };

      if (!response.ok) {
        setErrorMessage(
          payload.message ??
            `Unable to ${
              isEditMode ? "update" : "save"
            } this diary entry.`,
        );
        return;
      }

      router.push(
        isEditMode && entryId
          ? `/diary/${entryId}`
          : "/diary",
      );

      router.refresh();
    } catch {
      setErrorMessage("Unable to connect to the server.");
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="grid gap-8 lg:grid-cols-[280px_1fr]"
    >
      <aside>
        <div
          className="aspect-[2/3] overflow-hidden rounded-lg bg-gradient-to-br from-[#3A2419] to-[#171411] bg-cover bg-center shadow-2xl shadow-black/30"
          style={
            posterUrl
              ? {
                  backgroundImage: `url("${posterUrl}")`,
                }
              : undefined
          }
        >
          {!posterUrl ? (
            <div className="flex h-full items-center justify-center p-6 text-center">
              <span className="text-lg font-semibold text-[#8A8580]">
                {media.title}
              </span>
            </div>
          ) : null}
        </div>

        <p className="mt-4 text-xs uppercase tracking-wide text-[#625D58]">
          {media.mediaType === "movie" ? "Film" : "Series"}
          {media.releaseDate
            ? ` · ${media.releaseDate.slice(0, 4)}`
            : ""}
        </p>
      </aside>

      <section>
        <p className="text-sm text-[#8A8580]">
          {isEditMode ? "Edit diary entry" : "Log this title"}
        </p>

        <h1 className="mt-1 text-3xl font-bold tracking-tight text-[#F4F1EB] md:text-4xl">
          {media.title}
        </h1>

        {media.overview ? (
          <p className="mt-4 max-w-3xl text-sm leading-7 text-[#8A8580]">
            {media.overview}
          </p>
        ) : null}

        <div className="mt-8 grid gap-6 sm:grid-cols-2">
          <Field label="Watched date">
            <input
              type="date"
              value={watchedAt}
              onChange={(event) =>
                setWatchedAt(event.target.value)
              }
              required
              disabled={isSubmitting}
              className="w-full rounded-md border border-[#302C28] bg-[#171411] px-4 py-3 text-sm text-[#F4F1EB] outline-none transition focus:border-[#C84B18] disabled:cursor-not-allowed disabled:opacity-50"
            />
          </Field>

          <Field label="Your rating">
            <StarRating
              value={rating}
              onChange={setRating}
              disabled={isSubmitting}
            />
          </Field>
        </div>

        <div className="mt-6">
          <ToggleOption
            checked={isRewatch}
            onChange={setIsRewatch}
            disabled={isSubmitting}
            title="This viewing was a rewatch"
            description={
              isRewatch
                ? "You have watched this film or series before."
                : "Turn this on when this was not your first time watching the title."
            }
          />
        </div>

        <div className="mt-7">
          <VisibilitySelector
            label="Diary visibility"
            value={isPublic}
            onChange={changeDiaryVisibility}
            disabled={isSubmitting}
            privateTitle="Private diary entry"
            publicTitle="Public diary entry"
            privateDescription="Only you can see this viewing activity, rating, and watched date."
            publicDescription="Your viewing activity, rating, and watched date may appear on your public profile."
          />
        </div>

        <div className="mt-7 border-t border-[#302C28] pt-7">
          <h2 className="text-lg font-semibold text-[#F4F1EB]">
            Your review
          </h2>

          <div className="mt-5">
            <Field label="Review" helper={`${review.length}/1000`}>
              <div className="overflow-hidden rounded-md border border-[#302C28] bg-[#171411] transition focus-within:border-[#C84B18]">
                <div className="flex flex-wrap items-center gap-1 border-b border-[#302C28] px-3 py-2">
                  <FormatButton
                    label="B"
                    title="Bold"
                    disabled={isSubmitting}
                    onClick={() =>
                      applyReviewFormat("**", "**", "bold text")
                    }
                    className="font-bold"
                  />

                  <FormatButton
                    label="I"
                    title="Italic"
                    disabled={isSubmitting}
                    onClick={() =>
                      applyReviewFormat("*", "*", "italic text")
                    }
                    className="italic"
                  />

                  <FormatButton
                    label="||"
                    title="Hide selected text as spoiler"
                    disabled={isSubmitting}
                    onClick={() =>
                      applyReviewFormat(
                        "||",
                        "||",
                        "spoiler text",
                      )
                    }
                  />

                  <span className="ml-2 text-[11px] text-[#625D58]">
                    Select text, then apply formatting
                  </span>
                </div>

                <textarea
                  ref={reviewRef}
                  value={review}
                  onChange={(event) =>
                    handleReviewChange(event.target.value)
                  }
                  maxLength={1000}
                  rows={6}
                  disabled={isSubmitting}
                  placeholder="What did you think about it?"
                  className="w-full resize-y bg-transparent px-4 py-3 text-sm leading-6 text-[#F4F1EB] outline-none placeholder:text-[#625D58] disabled:cursor-not-allowed disabled:opacity-50"
                />
              </div>

              <p className="mt-2 text-xs text-[#625D58]">
                Supports <strong>**bold**</strong>,{" "}
                <em>*italic*</em>, and ||hidden spoilers||.
              </p>
            </Field>
          </div>

          <div className="mt-6">
            <ToggleOption
              checked={spoiler}
              onChange={setSpoiler}
              disabled={isSubmitting || !hasReview}
              title="The whole review contains spoilers"
              description="Hide the complete review behind a spoiler warning. Use ||spoiler|| when only part of the review needs to be hidden."
            />
          </div>

          <div className="mt-6">
            <p className="mb-3 text-sm font-medium text-[#C9C4BC]">
              Review privacy
            </p>

            <ToggleOption
              checked={reviewIsPublic}
              onChange={setReviewIsPublic}
              disabled={isSubmitting || !canPublishReview}
              title="Show this review on my public profile"
              description={
                !isPublic
                  ? "Make the diary entry public first. Your review stays private until then."
                  : !hasReview
                    ? "Write a review first. Empty reviews cannot be published."
                    : reviewIsPublic
                      ? "People who can view your profile may read this review."
                      : "This review is saved privately and only visible to you."
              }
            />

            <div className="mt-3 flex items-start gap-2 rounded-md border border-[#302C28] bg-[#171411] px-4 py-3">
              {reviewIsPublic ? (
                <GlobeIcon className="mt-0.5 h-4 w-4 shrink-0 text-[#E45A1C]" />
              ) : (
                <LockIcon className="mt-0.5 h-4 w-4 shrink-0 text-[#8A8580]" />
              )}

              <p className="text-xs leading-5 text-[#8A8580]">
                {reviewIsPublic
                  ? "Only the review is shared. Your private notes are never published."
                  : "Private is the default. Reelog will not publish this review unless you turn this on."}
              </p>
            </div>
          </div>
        </div>

        <div className="mt-7 border-t border-[#302C28] pt-7">
          <h2 className="text-lg font-semibold text-[#F4F1EB]">
            Private notes
          </h2>

          <p className="mt-1 text-sm text-[#8A8580]">
            Personal notes that are always visible only to you.
          </p>

          <div className="mt-5">
            <Field
              label="Notes"
              helper={`${privateNotes.length}/1000`}
            >
              <textarea
                value={privateNotes}
                onChange={(event) =>
                  setPrivateNotes(event.target.value)
                }
                maxLength={1000}
                rows={4}
                disabled={isSubmitting}
                placeholder="Write something you want to remember privately."
                className="w-full resize-y rounded-md border border-[#302C28] bg-[#171411] px-4 py-3 text-sm leading-6 text-[#F4F1EB] outline-none transition placeholder:text-[#625D58] focus:border-[#C84B18] disabled:cursor-not-allowed disabled:opacity-50"
              />
            </Field>
          </div>

          <div className="mt-3 flex items-start gap-2 rounded-md border border-[#302C28] bg-[#171411] px-4 py-3">
            <LockIcon className="mt-0.5 h-4 w-4 shrink-0 text-[#8A8580]" />

            <p className="text-xs leading-5 text-[#8A8580]">
              Private notes are never shown on your public profile,
              even when the diary entry and review are public.
            </p>
          </div>
        </div>

        {errorMessage ? (
          <p className="mt-6 rounded-md border border-red-900/50 bg-red-950/20 px-4 py-3 text-sm text-red-300">
            {errorMessage}
          </p>
        ) : null}

        <div className="mt-8 flex flex-wrap items-center gap-3">
          <button
            type="submit"
            disabled={isSubmitting}
            className="rounded-full bg-[#C84B18] px-6 py-3 text-sm font-semibold text-white transition hover:bg-[#DC5520] disabled:cursor-not-allowed disabled:opacity-50"
          >
            {isSubmitting
              ? isEditMode
                ? "Saving changes..."
                : "Saving entry..."
              : isEditMode
                ? "Save changes"
                : "Save to diary"}
          </button>

          <button
            type="button"
            onClick={handleCancel}
            disabled={isSubmitting}
            className="rounded-full border border-[#302C28] px-6 py-3 text-sm text-[#C9C4BC] transition hover:bg-[#211E1B] disabled:cursor-not-allowed disabled:opacity-50"
          >
            Cancel
          </button>
        </div>
      </section>
    </form>
  );
}

function Field({
  label,
  helper,
  children,
}: {
  label: string;
  helper?: string;
  children: ReactNode;
}) {
  return (
    <div>
      <div className="mb-2 flex items-center justify-between text-sm font-medium text-[#C9C4BC]">
        <span>{label}</span>

        {helper ? (
          <span className="text-xs font-normal text-[#625D58]">
            {helper}
          </span>
        ) : null}
      </div>

      {children}
    </div>
  );
}

function FormatButton({
  label,
  title,
  onClick,
  disabled = false,
  className = "",
}: {
  label: string;
  title: string;
  onClick: () => void;
  disabled?: boolean;
  className?: string;
}) {
  return (
    <button
      type="button"
      title={title}
      disabled={disabled}
      onMouseDown={(event) => event.preventDefault()}
      onClick={onClick}
      className={[
        "flex h-8 min-w-8 items-center justify-center rounded px-2 text-xs text-[#C9C4BC] transition hover:bg-[#302C28] hover:text-white disabled:cursor-not-allowed disabled:opacity-40",
        className,
      ].join(" ")}
    >
      {label}
    </button>
  );
}

function ToggleOption({
  checked,
  onChange,
  title,
  description,
  disabled = false,
}: {
  checked: boolean;
  onChange: (value: boolean) => void;
  title: string;
  description: string;
  disabled?: boolean;
}) {
  return (
    <button
      type="button"
      disabled={disabled}
      onClick={() => onChange(!checked)}
      className={[
        "flex w-full items-start gap-3 rounded-lg border p-4 text-left transition disabled:cursor-not-allowed disabled:opacity-40",
        checked
          ? "border-[#C84B18]/60 bg-[#C84B18]/10"
          : "border-[#302C28] bg-[#171411]",
      ].join(" ")}
    >
      <span
        className={[
          "mt-0.5 flex h-5 w-9 shrink-0 rounded-full p-0.5 transition",
          checked ? "justify-end bg-[#C84B18]" : "bg-[#3A3530]",
        ].join(" ")}
      >
        <span className="h-4 w-4 rounded-full bg-white" />
      </span>

      <span>
        <span className="block text-sm font-medium text-[#F4F1EB]">
          {title}
        </span>

        <span className="mt-1 block text-xs leading-5 text-[#8A8580]">
          {description}
        </span>
      </span>
    </button>
  );
}

function VisibilitySelector({
  label,
  value,
  onChange,
  privateTitle,
  publicTitle,
  privateDescription,
  publicDescription,
  disabled = false,
  publicDisabled = false,
}: {
  label: string;
  value: boolean;
  onChange: (value: boolean) => void;
  privateTitle: string;
  publicTitle: string;
  privateDescription: string;
  publicDescription: string;
  disabled?: boolean;
  publicDisabled?: boolean;
}) {
  return (
    <div>
      <p className="text-sm font-medium text-[#C9C4BC]">
        {label}
      </p>

      <div className="mt-3 grid grid-cols-2 rounded-lg bg-[#171411] p-1">
        <button
          type="button"
          disabled={disabled}
          onClick={() => onChange(false)}
          className={[
            "rounded-md px-4 py-3 text-sm font-medium transition disabled:cursor-not-allowed disabled:opacity-40",
            !value
              ? "bg-[#302C28] text-[#F4F1EB] shadow"
              : "text-[#8A8580] hover:text-[#F4F1EB]",
          ].join(" ")}
        >
          Private
        </button>

        <button
          type="button"
          disabled={disabled || publicDisabled}
          onClick={() => onChange(true)}
          className={[
            "rounded-md px-4 py-3 text-sm font-medium transition disabled:cursor-not-allowed disabled:opacity-35",
            value
              ? "bg-[#C84B18] text-white shadow"
              : "text-[#8A8580] hover:text-[#F4F1EB]",
          ].join(" ")}
        >
          Public
        </button>
      </div>

      <div className="mt-3 rounded-md border border-[#302C28] bg-[#171411] px-4 py-3">
        <p className="text-sm font-medium text-[#F4F1EB]">
          {value ? publicTitle : privateTitle}
        </p>

        <p className="mt-1 text-xs leading-5 text-[#8A8580]">
          {value ? publicDescription : privateDescription}
        </p>
      </div>
    </div>
  );
}

function GlobeIcon({
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
        d="M3.5 12h17M12 3c2.2 2.5 3.4 5.5 3.4 9S14.2 18.5 12 21M12 3C9.8 5.5 8.6 8.5 8.6 12S9.8 18.5 12 21"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
      />
    </svg>
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
      <path
        d="M7 10V8a5 5 0 0 1 10 0v2"
        stroke="currentColor"
        strokeWidth="1.7"
        strokeLinecap="round"
      />

      <rect
        x="5"
        y="10"
        width="14"
        height="11"
        rx="2"
        stroke="currentColor"
        strokeWidth="1.7"
      />

      <path
        d="M12 14v3"
        stroke="currentColor"
        strokeWidth="1.7"
        strokeLinecap="round"
      />
    </svg>
  );
}