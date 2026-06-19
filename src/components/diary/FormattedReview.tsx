"use client";

import { useState } from "react";

type FormattedReviewProps = {
  text: string;
  hideWholeReview?: boolean;
  className?: string;
};

export function FormattedReview({
  text,
  hideWholeReview = false,
  className = "",
}: FormattedReviewProps) {
  const [wholeReviewVisible, setWholeReviewVisible] = useState(false);
  const [visibleSpoilers, setVisibleSpoilers] = useState<Set<string>>(
    new Set(),
  );

  function toggleInlineSpoiler(id: string) {
    setVisibleSpoilers((current) => {
      const next = new Set(current);

      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }

      return next;
    });
  }

  function renderLine(line: string, lineIndex: number) {
    const segments = line.split(
      /(\|\|.*?\|\||\*\*.*?\*\*|\*[^*]+?\*)/g,
    );

    return segments.map((segment, segmentIndex) => {
      const key = `${lineIndex}-${segmentIndex}`;

      if (segment.startsWith("||") && segment.endsWith("||")) {
        const content = segment.slice(2, -2);
        const isVisible = visibleSpoilers.has(key);

        return (
          <button
            key={key}
            type="button"
            onClick={() => toggleInlineSpoiler(key)}
            aria-label={
              isVisible ? "Hide spoiler text" : "Reveal spoiler text"
            }
            className={[
              "mx-0.5 inline rounded px-1.5 py-0.5 text-left transition",
              isVisible
                ? "bg-[#302C28] text-[#EDE8DE]"
                : "bg-[#C9C4BC] text-transparent hover:bg-[#EDE8DE]",
            ].join(" ")}
          >
            {content || "Spoiler"}
          </button>
        );
      }

      if (segment.startsWith("**") && segment.endsWith("**")) {
        return (
          <strong key={key} className="font-semibold text-[#F4F1EB]">
            {segment.slice(2, -2)}
          </strong>
        );
      }

      if (
        segment.startsWith("*") &&
        segment.endsWith("*") &&
        !segment.startsWith("**")
      ) {
        return <em key={key}>{segment.slice(1, -1)}</em>;
      }

      return segment;
    });
  }

  if (hideWholeReview && !wholeReviewVisible) {
    return (
      <button
        type="button"
        onClick={() => setWholeReviewVisible(true)}
        className={[
          "block w-full rounded-md border border-[#302C28] bg-[#171411] px-4 py-3 text-left transition hover:border-[#C84B18]/50",
          className,
        ].join(" ")}
      >
        <span className="text-sm font-medium text-[#C84B18]">
          This review contains spoilers
        </span>

        <span className="mt-1 block text-xs text-[#8A8580]">
          Click to reveal the review.
        </span>
      </button>
    );
  }

  const lines = text.split("\n");

  return (
    <div className={className}>
      {hideWholeReview ? (
        <button
          type="button"
          onClick={() => setWholeReviewVisible(false)}
          className="mb-3 text-xs font-medium text-[#C84B18] hover:underline"
        >
          Hide spoiler review
        </button>
      ) : null}

      <div className="whitespace-pre-wrap text-sm leading-6 text-[#A7A19A]">
        {lines.map((line, lineIndex) => (
          <span key={lineIndex} className="block min-h-6">
            {renderLine(line, lineIndex)}
          </span>
        ))}
      </div>
    </div>
  );
}