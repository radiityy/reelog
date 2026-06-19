"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

import { usernameSchema } from "@/lib/validation/username";

type AvailabilityStatus =
  | "idle"
  | "checking"
  | "available"
  | "taken"
  | "invalid";

type OnboardingFormProps = {
  initialUsername?: string;
};

export function OnboardingForm({
  initialUsername = "",
}: OnboardingFormProps) {
  const router = useRouter();

  const [username, setUsername] = useState(initialUsername);
  const [availability, setAvailability] =
    useState<AvailabilityStatus>("idle");
  const [fieldMessage, setFieldMessage] = useState("");
  const [submitError, setSubmitError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    const normalizedUsername = username.trim().toLowerCase();

    if (!normalizedUsername) {
      setAvailability("idle");
      setFieldMessage("");
      return;
    }

    const validationResult = usernameSchema.safeParse(normalizedUsername);

    if (!validationResult.success) {
      setAvailability("invalid");
      setFieldMessage(
        validationResult.error.issues[0]?.message ?? "Invalid username.",
      );
      return;
    }

    const controller = new AbortController();

    const timeout = window.setTimeout(async () => {
      setAvailability("checking");
      setFieldMessage("Checking availability...");

      try {
        const response = await fetch(
          `/api/onboarding?username=${encodeURIComponent(
            validationResult.data,
          )}`,
          {
            signal: controller.signal,
          },
        );

        const payload = (await response.json()) as {
          available?: boolean;
          message?: string;
        };

        if (!response.ok) {
          setAvailability("invalid");
          setFieldMessage(payload.message ?? "Unable to check username.");
          return;
        }

        if (payload.available) {
          setAvailability("available");
          setFieldMessage("Username is available.");
        } else {
          setAvailability("taken");
          setFieldMessage("This username is already being used.");
        }
      } catch (error) {
        if (error instanceof DOMException && error.name === "AbortError") {
          return;
        }

        setAvailability("invalid");
        setFieldMessage("Unable to check username right now.");
      }
    }, 450);

    return () => {
      window.clearTimeout(timeout);
      controller.abort();
    };
  }, [username]);

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();

    setSubmitError("");

    const validationResult = usernameSchema.safeParse(username);

    if (!validationResult.success) {
      setAvailability("invalid");
      setFieldMessage(
        validationResult.error.issues[0]?.message ?? "Invalid username.",
      );
      return;
    }

    if (availability !== "available") {
      setSubmitError("Choose an available username before continuing.");
      return;
    }

    setIsSubmitting(true);

    try {
      const response = await fetch("/api/onboarding", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          username: validationResult.data,
        }),
      });

      const payload = (await response.json()) as {
        message?: string;
      };

      if (!response.ok) {
        setSubmitError(payload.message ?? "Unable to complete onboarding.");

        if (response.status === 409) {
          setAvailability("taken");
          setFieldMessage("This username is already being used.");
        }

        return;
      }

      router.replace("/");
      router.refresh();
    } catch {
      setSubmitError("Unable to connect to the server.");
    } finally {
      setIsSubmitting(false);
    }
  }

  const canSubmit =
    availability === "available" &&
    !isSubmitting &&
    username.trim().length > 0;

  return (
    <form onSubmit={handleSubmit} className="mt-10">
      <label
        htmlFor="username"
        className="font-mono text-[10px] uppercase tracking-[0.14em] text-[#6E6862]"
      >
        Username
      </label>

      <div
        className={[
          "mt-3 flex items-center rounded-md border bg-[#111009] transition",
          availability === "available"
            ? "border-emerald-700/60"
            : availability === "taken" || availability === "invalid"
              ? "border-red-800/70"
              : "border-[#252220] focus-within:border-[#C84B18]/70",
        ].join(" ")}
      >
        <span className="border-r border-[#252220] px-4 py-4 font-mono text-sm text-[#6E6862]">
          @
        </span>

        <input
          id="username"
          name="username"
          type="text"
          value={username}
          onChange={(event) => {
            setUsername(event.target.value.toLowerCase());
            setSubmitError("");
          }}
          minLength={3}
          maxLength={24}
          autoComplete="username"
          autoCapitalize="none"
          spellCheck={false}
          placeholder="your_username"
          className="min-w-0 flex-1 bg-transparent px-4 py-4 text-sm text-[#EDE8DE] outline-none placeholder:text-[#3E3A36]"
        />
      </div>

      <div className="mt-3 flex min-h-5 items-start justify-between gap-4">
        <p
          className={[
            "text-xs",
            availability === "available"
              ? "text-emerald-600"
              : availability === "taken" || availability === "invalid"
                ? "text-red-500"
                : "text-[#6E6862]",
          ].join(" ")}
        >
          {fieldMessage ||
            "3–24 characters. Lowercase letters, numbers, and underscores."}
        </p>

        <span className="shrink-0 font-mono text-[9px] text-[#3E3A36]">
          {username.length}/24
        </span>
      </div>

      <div className="mt-8 rounded-md border border-[#252220] bg-[#111009] p-4">
        <p className="font-mono text-[9px] uppercase tracking-[0.12em] text-[#C84B18]">
          Your public address
        </p>

        <p className="mt-2 break-all text-sm text-[#6E6862]">
          reelog.app/u/
          <span className="text-[#EDE8DE]">
            {username.trim().toLowerCase() || "your_username"}
          </span>
        </p>
      </div>

      {submitError ? (
        <p className="mt-5 rounded-md border border-red-900/50 bg-red-950/20 px-4 py-3 text-sm text-red-400">
          {submitError}
        </p>
      ) : null}

      <button
        type="submit"
        disabled={!canSubmit}
        className="mt-8 flex w-full items-center justify-center rounded-[3px] bg-[#C84B18] px-6 py-4 font-mono text-[11px] font-bold uppercase tracking-[0.09em] text-[#EDE8DE] transition hover:bg-[#DC5520] disabled:cursor-not-allowed disabled:opacity-40"
      >
        {isSubmitting ? "Saving username..." : "Finish setup"}
      </button>
    </form>
  );
}