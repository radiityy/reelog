"use client";

import {
  type SVGProps,
  useState,
} from "react";

type StarRatingProps = {
  value: number | null;
  onChange: (value: number | null) => void;
  disabled?: boolean;
};

const STAR_NUMBERS = [1, 2, 3, 4, 5];

export function StarRating({
  value,
  onChange,
  disabled = false,
}: StarRatingProps) {
  const [previewValue, setPreviewValue] = useState<number | null>(
    null,
  );

  const activeValue = previewValue ?? value ?? 0;

  return (
    <div>
      <div
        className="flex w-max items-center gap-1"
        role="radiogroup"
        aria-label="Your rating"
        onMouseLeave={() => setPreviewValue(null)}
      >
        {STAR_NUMBERS.map((starNumber) => {
          const halfValue = starNumber - 0.5;
          const fullValue = starNumber;

          const fillLevel = Math.max(
            0,
            Math.min(1, activeValue - (starNumber - 1)),
          );

          return (
            <div
              key={starNumber}
              className="relative h-10 w-10"
            >
              <StarIcon className="h-10 w-10 text-[#4A4642]" />

              <div
                className="pointer-events-none absolute inset-y-0 left-0 overflow-hidden"
                style={{
                  width: `${fillLevel * 100}%`,
                }}
              >
                <StarIcon
                  filled
                  className="h-10 w-10 max-w-none text-[#F2B84B] drop-shadow-[0_0_8px_rgba(242,184,75,0.2)]"
                />
              </div>

              <button
                type="button"
                role="radio"
                aria-checked={value === halfValue}
                aria-label={`Rate ${halfValue} out of 5`}
                title={`${halfValue} / 5`}
                disabled={disabled}
                onMouseEnter={() => setPreviewValue(halfValue)}
                onFocus={() => setPreviewValue(halfValue)}
                onBlur={() => setPreviewValue(null)}
                onClick={() => onChange(halfValue)}
                className="absolute inset-y-0 left-0 w-1/2 rounded-l-md disabled:cursor-not-allowed"
              />

              <button
                type="button"
                role="radio"
                aria-checked={value === fullValue}
                aria-label={`Rate ${fullValue} out of 5`}
                title={`${fullValue} / 5`}
                disabled={disabled}
                onMouseEnter={() => setPreviewValue(fullValue)}
                onFocus={() => setPreviewValue(fullValue)}
                onBlur={() => setPreviewValue(null)}
                onClick={() => onChange(fullValue)}
                className="absolute inset-y-0 right-0 w-1/2 rounded-r-md disabled:cursor-not-allowed"
              />
            </div>
          );
        })}
      </div>

      <div className="mt-2 flex min-h-6 items-center gap-3">
        <p className="text-sm font-medium text-[#C9C4BC]">
          {activeValue > 0
            ? `${activeValue.toFixed(1)} / 5`
            : "Not rated"}
        </p>

        {value !== null ? (
          <button
            type="button"
            disabled={disabled}
            onClick={() => {
              onChange(null);
              setPreviewValue(null);
            }}
            className="text-xs text-[#8A8580] transition hover:text-[#F4F1EB] disabled:cursor-not-allowed disabled:opacity-50"
          >
            Clear rating
          </button>
        ) : null}
      </div>

      <p className="mt-1 text-xs text-[#625D58]">
        Click the left or right side of a star for a half or full
        rating.
      </p>
    </div>
  );
}

function StarIcon({
  filled = false,
  ...props
}: SVGProps<SVGSVGElement> & {
  filled?: boolean;
}) {
  return (
    <svg
      viewBox="0 0 24 24"
      aria-hidden="true"
      fill={filled ? "currentColor" : "none"}
      stroke="currentColor"
      strokeWidth="1.7"
      strokeLinecap="round"
      strokeLinejoin="round"
      {...props}
    >
      <path d="M12 2.75 14.86 8.54l6.39.93-4.62 4.5 1.09 6.36L12 17.32l-5.72 3.01 1.09-6.36-4.62-4.5 6.39-.93L12 2.75Z" />
    </svg>
  );
}