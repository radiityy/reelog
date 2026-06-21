import type { ReactNode } from "react";

type ProfileActivityStatsProps = {
  diaryCount: number;
  reviewCount: number;
  averageRating: number | null;
};

export function ProfileActivityStats({
  diaryCount,
  reviewCount,
  averageRating,
}: ProfileActivityStatsProps) {
  return (
    <section className="mt-6 w-full lg:w-[560px]">
      <div className="grid grid-cols-1 gap-2 sm:grid-cols-3 sm:gap-6">
        <MetricItem
          label="Diary entries"
          value={diaryCount.toString()}
          icon={<DiaryIcon className="h-4 w-4" />}
          perforated
        />

        <MetricItem
          label="Reviews"
          value={reviewCount.toString()}
          icon={<ReviewIcon className="h-4 w-4" />}
          dashedEmpty={reviewCount === 0}
        />

        <MetricItem
          label="Average rating"
          value={
            averageRating !== null
              ? averageRating.toFixed(1)
              : "—"
          }
          icon={<StarIcon className="h-4 w-4" />}
          accent
          watermark
        />
      </div>
    </section>
  );
}

function MetricItem({
  label,
  value,
  icon,
  accent = false,
  perforated = false,
  dashedEmpty = false,
  watermark = false,
}: {
  label: string;
  value: string;
  icon: ReactNode;
  accent?: boolean;
  perforated?: boolean;
  dashedEmpty?: boolean;
  watermark?: boolean;
}) {
  return (
    <div
      className={[
        "group relative flex min-h-[104px] items-center gap-4 rounded-2xl bg-[#171411]/60 px-4 py-5 transition duration-200",
        "hover:bg-[#1B1714]",
      ].join(" ")}
    >
      <span
        className={[
          "relative flex h-10 w-10 shrink-0 items-center justify-center overflow-hidden border transition duration-200",
          accent
            ? "rounded-tl-xl rounded-tr-xl rounded-br-[18px] rounded-bl-xl border-[#5B3223] bg-[#251712] text-[#E06532] group-hover:border-[#7A3E27] group-hover:bg-[#2D1A13]"
            : dashedEmpty
              ? "rounded-xl border-dashed border-[#3A332D] bg-[#1C1815] text-[#6F675F] group-hover:border-[#4A4039]"
              : "rounded-xl border-[#312B26] bg-[#1C1815] text-[#8C837C] group-hover:border-[#423933] group-hover:text-[#D0C8C0]",
        ].join(" ")}
      >
        {perforated ? (
          <>
            <span
              aria-hidden="true"
              className="absolute inset-y-0 left-0 flex w-[5px] flex-col items-center justify-evenly"
            >
              <span className="h-[3px] w-[3px] rounded-full bg-[#14110F]" />
              <span className="h-[3px] w-[3px] rounded-full bg-[#14110F]" />
              <span className="h-[3px] w-[3px] rounded-full bg-[#14110F]" />
            </span>

            <span
              aria-hidden="true"
              className="absolute inset-y-0 right-0 flex w-[5px] flex-col items-center justify-evenly"
            >
              <span className="h-[3px] w-[3px] rounded-full bg-[#14110F]" />
              <span className="h-[3px] w-[3px] rounded-full bg-[#14110F]" />
              <span className="h-[3px] w-[3px] rounded-full bg-[#14110F]" />
            </span>
          </>
        ) : null}

        {watermark ? (
          <StarIcon
            aria-hidden="true"
            className="absolute -bottom-1 -right-1 h-6 w-6 text-[#E06532] opacity-20"
          />
        ) : null}

        <span className="relative">{icon}</span>
      </span>

      <div className="min-w-0">
        <p
          className={[
            "text-2xl font-bold leading-none tracking-[-0.03em]",
            accent
              ? "text-[#E06532]"
              : "text-[#F4F1EB]",
          ].join(" ")}
        >
          {value}
        </p>

        <p className="mt-2 truncate text-xs font-medium text-[#7B736D]">
          {label}
        </p>
      </div>

      <span
        aria-hidden="true"
        className={[
          "absolute bottom-1 left-4 right-4 h-px scale-x-0 transition-transform duration-200 group-hover:scale-x-100",
          accent
            ? "bg-[#D95D2B]/70"
            : "bg-[#4A4039]/60",
        ].join(" ")}
      />
    </div>
  );
}

function DiaryIcon({
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
      <rect
        x="5"
        y="3.5"
        width="14"
        height="17"
        rx="2.5"
        stroke="currentColor"
        strokeWidth="1.7"
      />

      <path
        d="M9 3.5v17M12 8h4M12 12h4M12 16h2.5"
        stroke="currentColor"
        strokeWidth="1.7"
        strokeLinecap="round"
      />
    </svg>
  );
}

function ReviewIcon({
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
        d="M5 5.5h14v10H10l-5 4v-14Z"
        stroke="currentColor"
        strokeWidth="1.7"
        strokeLinejoin="round"
      />

      <path
        d="M8.5 9h7M8.5 12h4.5"
        stroke="currentColor"
        strokeWidth="1.7"
        strokeLinecap="round"
      />
    </svg>
  );
}

function StarIcon({
  className = "",
  ...rest
}: {
  className?: string;
} & React.SVGProps<SVGSVGElement>) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="currentColor"
      aria-hidden="true"
      className={className}
      {...rest}
    >
      <path d="m12 2.8 2.75 5.57 6.15.9-4.45 4.33 1.05 6.13L12 16.84l-5.5 2.89 1.05-6.13L3.1 9.27l6.15-.9L12 2.8Z" />
    </svg>
  );
}