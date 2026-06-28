"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  type FormEvent,
  type ReactNode,
  useState,
} from "react";

import { SettingsAvatarEditor } from "@/components/settings/SettingsAvatarEditor";

type DiaryVisibility = "PRIVATE" | "PUBLIC";

type AccountSettingsValues = {
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

type UpdatedUser = {
  name: string | null;
  username: string;
  bio: string | null;
  socialLink: string | null;
  isPublic: boolean;
  defaultDiaryVisibility: DiaryVisibility;
};

type AccountSettingsResponse = {
  message?: string;
  profilePath?: string;
  user?: UpdatedUser;
  errors?: Record<string, string[] | undefined>;
};

type AccountSettingsFormProps = {
  initialValues: AccountSettingsValues;
};

export function AccountSettingsForm({
  initialValues,
}: AccountSettingsFormProps) {
  const router = useRouter();

  const [name, setName] = useState(initialValues.name);
  const [username, setUsername] = useState(
    initialValues.username,
  );
  const [savedUsername, setSavedUsername] = useState(
    initialValues.username,
  );
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

  function handleUsernameChange(value: string) {
    setUsername(
      value
        .toLowerCase()
        .replace(/[^a-z0-9_]/g, "")
        .slice(0, 24),
    );
  }

  async function handleSubmit(
    event: FormEvent<HTMLFormElement>,
  ) {
    event.preventDefault();

    const normalizedUsername = username.trim().toLowerCase();

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
          username: normalizedUsername,
          bio,
          socialLink,
          isPublic,
          defaultDiaryVisibility,
        }),
      });

      const payload =
        (await response.json()) as AccountSettingsResponse;

      if (!response.ok) {
        const usernameError =
          payload.errors?.username?.[0];

        setErrorMessage(
          usernameError ??
            payload.message ??
            "Unable to update your account settings.",
        );

        return;
      }

      if (payload.user) {
        setName(payload.user.name ?? "");
        setUsername(payload.user.username);
        setSavedUsername(payload.user.username);
        setBio(payload.user.bio ?? "");
        setSocialLink(payload.user.socialLink ?? "");
        setIsPublic(payload.user.isPublic);
        setDefaultDiaryVisibility(
          payload.user.defaultDiaryVisibility,
        );
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
            username={savedUsername}
            initialAvatarUrl={initialValues.image}
            initialHasCustomAvatar={
              initialValues.hasCustomAvatar
            }
          />

          <div className="min-w-0">
            <h2 className="truncate text-xl font-semibold text-[#F4F1EB]">
              {name || `@${savedUsername}`}
            </h2>

            <p className="mt-1 text-sm font-medium text-[#E45A1C]">
              @{savedUsername}
            </p>

            <p className="mt-1 truncate text-sm text-[#716B65]">
              {initialValues.email}
            </p>

            <Link
              href={`/u/${savedUsername}`}
              className="mt-4 inline-flex rounded-full border border-[#3A3530] px-4 py-2 text-xs font-medium text-[#C9C4BC] transition hover:border-[#C84B18]/60 hover:text-[#E45A1C]"
            >
              View profile
            </Link>
          </div>
        </div>

        <div className="mt-6 grid gap-5 border-t border-[#302C28] pt-6 sm:grid-cols-2">
          <ReadOnlyField
            label="Profile URL"
            value={`/u/${savedUsername}`}
            helper="This URL changes when you update your username."
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
              onChange={(event) =>
                setName(event.target.value)
              }
              maxLength={80}
              required
              disabled={isSubmitting}
              placeholder="Your display name"
              className="w-full rounded-lg border border-[#302C28] bg-[#100E0C] px-4 py-3 text-sm text-[#F4F1EB] outline-none transition placeholder:text-[#625D58] focus:border-[#C84B18] disabled:cursor-not-allowed disabled:opacity-50"
            />
          </Field>

          <Field
            label="Username"
            helper={`${username.length}/24`}
          >
            <div className="flex overflow-hidden rounded-lg border border-[#302C28] bg-[#100E0C] transition focus-within:border-[#C84B18]">
              <span className="flex items-center border-r border-[#302C28] px-4 text-sm text-[#625D58]">
                @
              </span>

              <input
                type="text"
                value={username}
                onChange={(event) =>
                  handleUsernameChange(event.target.value)
                }
                minLength={3}
                maxLength={24}
                required
                disabled={isSubmitting}
                autoComplete="username"
                spellCheck={false}
                placeholder="username"
                className="min-w-0 flex-1 bg-transparent px-4 py-3 text-sm text-[#F4F1EB] outline-none placeholder:text-[#625D58] disabled:cursor-not-allowed disabled:opacity-50"
              />
            </div>

            <p className="mt-2 text-xs leading-5 text-[#625D58]">
              Use 3–24 lowercase letters, numbers, or underscores.
              Changing this also changes your public profile URL.
            </p>
          </Field>

          <Field label="Bio" helper={`${bio.length}/160`}>
            <textarea
              value={bio}
              onChange={(event) =>
                setBio(event.target.value)
              }
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
            privateDescription="Only approved followers can access your profile activity."
            publicDescription="Anyone with your profile link can view your public diary activity and reviews."
          />
        </div>

        {!isPublic ? (
          <div className="mt-4 rounded-lg border border-[#3A3530] bg-[#100E0C] px-4 py-3">
            <p className="text-xs leading-5 text-[#8A8580]">
              Public diary entries remain hidden from people who are
              not approved followers while your profile is private.
            </p>
          </div>
        ) : null}
      </section>

      <section className="mt-6 rounded-xl border border-[#2B2723] bg-[#191613] p-5 sm:p-6">
        <h2 className="text-xl font-semibold text-[#F4F1EB]">
          Diary preferences
        </h2>

        <p className="mt-1 text-sm leading-6 text-[#8A8580]">
          Choose the initial visibility used when logging a new title.
        </p>

        <div className="mt-6">
          <SettingSelector
            label="Default diary visibility"
            value={defaultDiaryVisibility}
            onChange={setDefaultDiaryVisibility}
            disabled={isSubmitting}
            privateTitle="Private by default"
            publicTitle="Public by default"
            privateDescription="New diary entries begin as private. You can still change each entry before saving."
            publicDescription="New diary entries begin as public. Review visibility is still selected separately."
          />
        </div>
      </section>

      {errorMessage ? (
        <p
          role="alert"
          className="mt-6 rounded-lg border border-red-900/50 bg-red-950/20 px-4 py-3 text-sm text-red-300"
        >
          {errorMessage}
        </p>
      ) : null}

      {successMessage ? (
        <p
          role="status"
          className="mt-6 rounded-lg border border-emerald-900/50 bg-emerald-950/20 px-4 py-3 text-sm text-emerald-300"
        >
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