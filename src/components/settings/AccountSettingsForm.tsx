"use client";

import Link from "next/link";
import {
  type FormEvent,
  type ReactNode,
  useState,
} from "react";
import { useRouter } from "next/navigation";

import { SettingsAvatarEditor } from "@/components/settings/SettingsAvatarEditor";

type DiaryVisibility = "PRIVATE" | "PUBLIC";

type AccountSettingsFormProps = {
  initialValues: {
    name: string;
    username: string;
    email: string;
    image: string | null;
    hasCustomAvatar: boolean;
    bio: string;
    socialLink: string;
    isPublic: boolean;
    defaultDiaryVisibility: DiaryVisibility;
  };
};

export function AccountSettingsForm({
  initialValues,
}: AccountSettingsFormProps) {
  const router = useRouter();

  const [name, setName] = useState(initialValues.name);
  const [bio, setBio] = useState(initialValues.bio);
  const [socialLink, setSocialLink] = useState(
    initialValues.socialLink,
  );
  const [isPublic, setIsPublic] = useState(
    initialValues.isPublic,
  );
  const [
    defaultDiaryVisibility,
    setDefaultDiaryVisibility,
  ] = useState<DiaryVisibility>(
    initialValues.defaultDiaryVisibility,
  );

  const [errorMessage, setErrorMessage] = useState("");
  const [successMessage, setSuccessMessage] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function handleSubmit(
    event: FormEvent<HTMLFormElement>,
  ) {
    event.preventDefault();

    setErrorMessage("");
    setSuccessMessage("");
    setIsSubmitting(true);

    try {
      const response = await fetch("/api/settings/account", {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          name,
          bio,
          socialLink,
          isPublic,
          defaultDiaryVisibility,
        }),
      });

      const payload = (await response.json()) as {
        message?: string;
      };

      if (!response.ok) {
        setErrorMessage(
          payload.message ??
            "Unable to update your account settings.",
        );
        return;
      }

      setSuccessMessage(
        payload.message ?? "Account settings updated.",
      );

      router.refresh();
    } catch {
      setErrorMessage("Unable to connect to the server.");
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <form onSubmit={handleSubmit}>
      <section className="rounded-xl border border-[#2B2723] bg-[#191613] p-5 sm:p-6">
        <div className="flex flex-col gap-5 sm:flex-row sm:items-center">
          <SettingsAvatarEditor
            username={initialValues.username}
            initialAvatarUrl={initialValues.image}
            initialHasCustomAvatar={
              initialValues.hasCustomAvatar
            }
          />

          <div className="min-w-0">
            <h2 className="truncate text-xl font-semibold text-[#F4F1EB]">
              {name || `@${initialValues.username}`}
            </h2>

            <p className="mt-1 text-sm font-medium text-[#E45A1C]">
              @{initialValues.username}
            </p>

            <p className="mt-1 truncate text-sm text-[#716B65]">
              {initialValues.email}
            </p>

            <Link
              href={`/u/${initialValues.username}`}
              className="mt-4 inline-flex rounded-full border border-[#3A3530] px-4 py-2 text-xs font-medium text-[#C9C4BC] transition hover:border-[#C84B18]/60 hover:text-[#E45A1C]"
            >
              View profile
            </Link>
          </div>
        </div>

        <div className="mt-6 grid gap-5 border-t border-[#302C28] pt-6 sm:grid-cols-2">
          <ReadOnlyField
            label="Username"
            value={`@${initialValues.username}`}
            helper="Your username cannot be changed yet."
          />

          <ReadOnlyField
            label="Email"
            value={initialValues.email}
            helper="Managed through your Google account."
          />
        </div>
      </section>

      <section className="mt-6 rounded-xl border border-[#2B2723] bg-[#191613] p-5 sm:p-6">
        <div>
          <h2 className="text-xl font-semibold text-[#F4F1EB]">
            Profile details
          </h2>

          <p className="mt-1 text-sm leading-6 text-[#8A8580]">
            Information displayed on your Reelog profile.
          </p>
        </div>

        <div className="mt-6 space-y-5">
          <Field
            label="Display name"
            helper={`${name.length}/80`}
          >
            <input
              type="text"
              value={name}
              onChange={(event) => setName(event.target.value)}
              maxLength={80}
              required
              disabled={isSubmitting}
              placeholder="Your display name"
              className="w-full rounded-lg border border-[#302C28] bg-[#100E0C] px-4 py-3 text-sm text-[#F4F1EB] outline-none transition placeholder:text-[#625D58] focus:border-[#C84B18] disabled:cursor-not-allowed disabled:opacity-50"
            />
          </Field>

          <Field label="Bio" helper={`${bio.length}/160`}>
            <textarea
              value={bio}
              onChange={(event) => setBio(event.target.value)}
              maxLength={160}
              rows={4}
              disabled={isSubmitting}
              placeholder="Tell people a little about yourself."
              className="w-full resize-y rounded-lg border border-[#302C28] bg-[#100E0C] px-4 py-3 text-sm leading-6 text-[#F4F1EB] outline-none transition placeholder:text-[#625D58] focus:border-[#C84B18] disabled:cursor-not-allowed disabled:opacity-50"
            />
          </Field>

          <Field
            label="Social link"
            helper={`${socialLink.length}/500`}
          >
            <input
              type="url"
              value={socialLink}
              onChange={(event) =>
                setSocialLink(event.target.value)
              }
              maxLength={500}
              disabled={isSubmitting}
              placeholder="https://github.com/username"
              className="w-full rounded-lg border border-[#302C28] bg-[#100E0C] px-4 py-3 text-sm text-[#F4F1EB] outline-none transition placeholder:text-[#625D58] focus:border-[#C84B18] disabled:cursor-not-allowed disabled:opacity-50"
            />
          </Field>
        </div>
      </section>

      <section className="mt-6 rounded-xl border border-[#2B2723] bg-[#191613] p-5 sm:p-6">
        <h2 className="text-xl font-semibold text-[#F4F1EB]">
          Privacy
        </h2>

        <p className="mt-1 text-sm leading-6 text-[#8A8580]">
          Control who can open your profile and view public activity.
        </p>

        <div className="mt-6">
          <SettingSelector
            label="Profile visibility"
            value={isPublic ? "PUBLIC" : "PRIVATE"}
            onChange={(value) =>
              setIsPublic(value === "PUBLIC")
            }
            disabled={isSubmitting}
            privateTitle="Private profile"
            publicTitle="Public profile"
            privateDescription="Other people cannot open your profile, you can still preview it yourself."
            publicDescription="Anyone with your profile link can view your public diary activity and public reviews."
          />
        </div>

        {!isPublic ? (
          <div className="mt-4 rounded-lg border border-[#3A3530] bg-[#100E0C] px-4 py-3">
            <p className="text-xs leading-5 text-[#8A8580]">
              Public diary entries remain hidden from other people
              while your profile is private.
            </p>
          </div>
        ) : null}
      </section>

      <section className="mt-6 rounded-xl border border-[#2B2723] bg-[#191613] p-5 sm:p-6">
        <h2 className="text-xl font-semibold text-[#F4F1EB]">
          Diary preferences
        </h2>

        <p className="mt-1 text-sm leading-6 text-[#8A8580]">
          Choose the initial visibility used when logging a new
          title.
        </p>

        <div className="mt-6">
          <SettingSelector
            label="Default diary visibility"
            value={defaultDiaryVisibility}
            onChange={setDefaultDiaryVisibility}
            disabled={isSubmitting}
            privateTitle="Private by default"
            publicTitle="Public by default"
            privateDescription="New diary entries begin as private, uou can still change each entry before saving."
            publicDescription="New diary entries begin as public, review visibility is still selected separately."
          />
        </div>
      </section>

      {errorMessage ? (
        <p className="mt-6 rounded-lg border border-red-900/50 bg-red-950/20 px-4 py-3 text-sm text-red-300">
          {errorMessage}
        </p>
      ) : null}

      {successMessage ? (
        <p className="mt-6 rounded-lg border border-emerald-900/50 bg-emerald-950/20 px-4 py-3 text-sm text-emerald-300">
          {successMessage}
        </p>
      ) : null}

      <div className="mt-6 flex justify-end">
        <button
          type="submit"
          disabled={isSubmitting}
          className="rounded-full bg-[#C84B18] px-6 py-3 text-sm font-semibold text-white transition hover:bg-[#DC5520] disabled:cursor-not-allowed disabled:opacity-50"
        >
          {isSubmitting ? "Saving changes..." : "Save changes"}
        </button>
      </div>
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
      <div className="mb-2 flex items-center justify-between gap-4">
        <label className="text-sm font-medium text-[#C9C4BC]">
          {label}
        </label>

        {helper ? (
          <span className="text-xs text-[#625D58]">
            {helper}
          </span>
        ) : null}
      </div>

      {children}
    </div>
  );
}

function ReadOnlyField({
  label,
  value,
  helper,
}: {
  label: string;
  value: string;
  helper: string;
}) {
  return (
    <div>
      <p className="text-sm font-medium text-[#C9C4BC]">
        {label}
      </p>

      <div className="mt-2 rounded-lg border border-[#302C28] bg-[#100E0C] px-4 py-3">
        <p className="truncate text-sm text-[#8A8580]">
          {value}
        </p>
      </div>

      <p className="mt-2 text-xs leading-5 text-[#625D58]">
        {helper}
      </p>
    </div>
  );
}

function SettingSelector({
  label,
  value,
  onChange,
  privateTitle,
  publicTitle,
  privateDescription,
  publicDescription,
  disabled = false,
}: {
  label: string;
  value: DiaryVisibility;
  onChange: (value: DiaryVisibility) => void;
  privateTitle: string;
  publicTitle: string;
  privateDescription: string;
  publicDescription: string;
  disabled?: boolean;
}) {
  const isPublic = value === "PUBLIC";

  return (
    <div>
      <p className="text-sm font-medium text-[#C9C4BC]">
        {label}
      </p>

      <div className="mt-3 grid grid-cols-2 rounded-lg bg-[#100E0C] p-1">
        <button
          type="button"
          disabled={disabled}
          onClick={() => onChange("PRIVATE")}
          className={[
            "rounded-md px-4 py-3 text-sm font-medium transition disabled:cursor-not-allowed disabled:opacity-50",
            !isPublic
              ? "bg-[#302C28] text-[#F4F1EB]"
              : "text-[#8A8580] hover:text-[#F4F1EB]",
          ].join(" ")}
        >
          Private
        </button>

        <button
          type="button"
          disabled={disabled}
          onClick={() => onChange("PUBLIC")}
          className={[
            "rounded-md px-4 py-3 text-sm font-medium transition disabled:cursor-not-allowed disabled:opacity-50",
            isPublic
              ? "bg-[#C84B18] text-white"
              : "text-[#8A8580] hover:text-[#F4F1EB]",
          ].join(" ")}
        >
          Public
        </button>
      </div>

      <div className="mt-3 rounded-lg border border-[#302C28] bg-[#100E0C] px-4 py-3">
        <p className="text-sm font-medium text-[#F4F1EB]">
          {isPublic ? publicTitle : privateTitle}
        </p>

        <p className="mt-1 text-xs leading-5 text-[#8A8580]">
          {isPublic
            ? publicDescription
            : privateDescription}
        </p>
      </div>
    </div>
  );
}
