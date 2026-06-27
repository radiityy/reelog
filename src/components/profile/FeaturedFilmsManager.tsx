"use client";

import {
  closestCenter,
  DndContext,
  DragOverlay,
  PointerSensor,
  TouchSensor,
  type DragEndEvent,
  type DragStartEvent,
  useDraggable,
  useDroppable,
  useSensor,
  useSensors,
} from "@dnd-kit/core";
import { arrayMove } from "@dnd-kit/sortable";
import { useRouter } from "next/navigation";
import { useMemo, useState } from "react";

type MediaType = "movie" | "tv";

export type FeaturedFilmItem = {
  id: string;
  tmdbId: number;
  mediaType: MediaType;
  title: string;
  posterPath: string | null;
  position: number;
};

type FeaturedFilmsManagerProps = {
  initialItems: FeaturedFilmItem[];
};

type FeaturedFilmsResponse = {
  message?: string;
  items?: FeaturedFilmItem[];
};

const MAX_FEATURED_FILMS = 5;

export function FeaturedFilmsManager({
  initialItems,
}: FeaturedFilmsManagerProps) {
  const router = useRouter();

  const [featuredItems, setFeaturedItems] = useState(() =>
    reindexItems(sortItems(initialItems)),
  );

  const [activeId, setActiveId] = useState<string | null>(null);
  const [activeAction, setActiveAction] = useState<string | null>(
    null,
  );
  const [errorMessage, setErrorMessage] = useState("");
  const [noticeMessage, setNoticeMessage] = useState("");

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8,
      },
    }),
    useSensor(TouchSensor, {
      activationConstraint: {
        delay: 200,
        tolerance: 8,
      },
    }),
  );

  const activeItem = useMemo(
    () =>
      featuredItems.find((item) => item.id === activeId) ?? null,
    [activeId, featuredItems],
  );

  const slots = useMemo(
    () =>
      Array.from(
        {
          length: MAX_FEATURED_FILMS,
        },
        (_, index) => ({
          position: index + 1,
          item: featuredItems[index] ?? null,
        }),
      ),
    [featuredItems],
  );

  async function saveItems(
    nextItems: FeaturedFilmItem[],
    rollbackItems: FeaturedFilmItem[],
    action: string,
    successMessage: string,
  ) {
    if (activeAction) {
      return;
    }

    setActiveAction(action);
    setErrorMessage("");
    setNoticeMessage("");

    try {
      const response = await fetch("/api/featured-films", {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          items: nextItems.map((item) => ({
            tmdbId: item.tmdbId,
            mediaType: item.mediaType,
            position: item.position,
          })),
        }),
      });

      const payload =
        (await response.json()) as FeaturedFilmsResponse;

      if (!response.ok) {
        setFeaturedItems(rollbackItems);
        setErrorMessage(
          payload.message ?? "Unable to update your Top 5.",
        );
        return;
      }

      setFeaturedItems(
        reindexItems(sortItems(payload.items ?? [])),
      );
      setNoticeMessage(successMessage);
      router.refresh();
    } catch {
      setFeaturedItems(rollbackItems);
      setErrorMessage("Unable to connect to the server.");
    } finally {
      setActiveAction(null);
    }
  }

  function handleDragStart(event: DragStartEvent) {
    if (activeAction) {
      return;
    }

    setActiveId(String(event.active.id));
    setErrorMessage("");
    setNoticeMessage("");
  }

  function handleDragCancel() {
    setActiveId(null);
  }

  function handleDragEnd(event: DragEndEvent) {
    setActiveId(null);

    if (activeAction || !event.over) {
      return;
    }

    const previousItems = reindexItems(sortItems(featuredItems));
    const draggedId = String(event.active.id);
    const draggedIndex = previousItems.findIndex(
      (item) => item.id === draggedId,
    );

    if (draggedIndex < 0) {
      return;
    }

    const targetIndex = resolveTargetIndex(
      String(event.over.id),
      previousItems,
    );

    if (targetIndex === null) {
      return;
    }

    if (targetIndex >= previousItems.length) {
      setErrorMessage(
        "Fill the previous positions before moving a title here.",
      );
      return;
    }

    if (draggedIndex === targetIndex) {
      return;
    }

    const nextItems = reindexItems(
      arrayMove(previousItems, draggedIndex, targetIndex),
    );

    setFeaturedItems(nextItems);

    void saveItems(
      nextItems,
      previousItems,
      "reorder",
      "Your Top 5 order was updated.",
    );
  }

  function handleRemove(item: FeaturedFilmItem) {
    if (activeAction) {
      return;
    }

    const previousItems = featuredItems;

    const nextItems = reindexItems(
      previousItems.filter(
        (currentItem) => currentItem.id !== item.id,
      ),
    );

    setFeaturedItems(nextItems);

    void saveItems(
      nextItems,
      previousItems,
      `remove:${item.id}`,
      `${item.title} was removed from your Top 5.`,
    );
  }

  const isDragging = activeId !== null;

  return (
    <div>
      <section>
        <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[#C84B18]">
          Profile curation
        </p>

        <h1 className="mt-2 text-3xl font-bold tracking-tight text-[#F4F1EB] md:text-4xl">
          Your Top 5
        </h1>

        <p className="mt-3 max-w-2xl text-sm leading-6 text-[#8A8580]">
          Drag posters to change their order. Positions must be filled
          consecutively, starting from number one.
        </p>
      </section>

      {errorMessage ? (
        <div className="mt-6 rounded-xl border border-red-900/50 bg-red-950/20 px-4 py-3 text-sm text-red-300">
          {errorMessage}
        </div>
      ) : null}

      {noticeMessage ? (
        <div className="mt-6 rounded-xl border border-[#4A3327] bg-[#241811] px-4 py-3 text-sm text-[#E7A27F]">
          {noticeMessage}
        </div>
      ) : null}

      <section className="mt-9">
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <h2 className="text-xl font-bold text-[#F4F1EB]">
              Current selection
            </h2>

            <p className="mt-1 text-sm text-[#8A8580]">
              {featuredItems.length}/5 titles selected
            </p>
          </div>

          <button
            type="button"
            onClick={() => router.push("/search")}
            className="inline-flex items-center gap-2 rounded-full bg-[#C84B18] px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-[#DC5520]"
          >
            <PlusIcon className="h-4 w-4" />
            Add title
          </button>
        </div>

        <p className="mt-4 flex items-center gap-2 text-xs text-[#625D58]">
          <DragIcon className="h-4 w-4" />
          Drag directly from a poster to reorder your filled
          positions.
        </p>

        <div className="mt-6">
          <DndContext
            sensors={sensors}
            collisionDetection={closestCenter}
            onDragStart={handleDragStart}
            onDragCancel={handleDragCancel}
            onDragEnd={handleDragEnd}
          >
            <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 xl:grid-cols-5">
              {slots.map((slot) => (
                <TopFiveSlot
                  key={slot.position}
                  position={slot.position}
                  item={slot.item}
                  isBusy={Boolean(activeAction)}
                  isDragging={isDragging}
                  onAddTitle={() => router.push("/search")}
                  onRemove={handleRemove}
                />
              ))}
            </div>

            <DragOverlay
              dropAnimation={{
                duration: 180,
                easing: "cubic-bezier(0.18, 0.67, 0.6, 1.22)",
              }}
            >
              {activeItem ? (
                <div className="w-[210px] max-w-[44vw] rotate-[1.5deg] scale-[1.04] cursor-grabbing">
                  <FeaturedCardPreview
                    item={activeItem}
                    position={activeItem.position}
                  />
                </div>
              ) : null}
            </DragOverlay>
          </DndContext>
        </div>

        {activeAction === "reorder" ? (
          <p className="mt-4 flex items-center gap-2 text-xs text-[#E7A27F]">
            <LoadingIcon className="h-4 w-4 animate-spin" />
            Saving new order...
          </p>
        ) : null}
      </section>
    </div>
  );
}

function TopFiveSlot({
  position,
  item,
  isBusy,
  isDragging,
  onAddTitle,
  onRemove,
}: {
  position: number;
  item: FeaturedFilmItem | null;
  isBusy: boolean;
  isDragging: boolean;
  onAddTitle: () => void;
  onRemove: (item: FeaturedFilmItem) => void;
}) {
  const { setNodeRef, isOver } = useDroppable({
    id: `slot-${position}`,
    disabled: isBusy,
  });

  return (
    <div
      ref={setNodeRef}
      className={[
        "min-w-0 rounded-2xl transition duration-200",
        isOver
          ? "scale-[1.02] bg-[#C84B18]/10 ring-2 ring-[#C84B18]/70 ring-offset-4 ring-offset-[#12100E]"
          : "",
      ].join(" ")}
    >
      {item ? (
        <DraggableFeaturedCard
          item={item}
          position={position}
          isBusy={isBusy}
          onRemove={onRemove}
        />
      ) : (
        <AddTitleSlot
          position={position}
          disabled={isBusy || isDragging}
          onClick={onAddTitle}
        />
      )}
    </div>
  );
}

function DraggableFeaturedCard({
  item,
  position,
  isBusy,
  onRemove,
}: {
  item: FeaturedFilmItem;
  position: number;
  isBusy: boolean;
  onRemove: (item: FeaturedFilmItem) => void;
}) {
  const {
    attributes,
    listeners,
    setNodeRef,
    isDragging,
  } = useDraggable({
    id: item.id,
    disabled: isBusy,
  });

  const posterUrl = getPosterUrl(item.posterPath);

  return (
    <article
      ref={setNodeRef}
      className={[
        "min-w-0 overflow-hidden rounded-2xl border bg-[#1A1714] transition duration-200",
        isDragging
          ? "border-[#C84B18]/70 opacity-20"
          : "border-[#302C28] shadow-lg shadow-black/10 hover:-translate-y-1 hover:border-[#48413B] hover:shadow-2xl hover:shadow-black/40",
      ].join(" ")}
    >
      <div
        {...attributes}
        {...listeners}
        role="button"
        tabIndex={0}
        aria-label={`Drag ${item.title} from position ${position}`}
        className={[
          "group relative aspect-[2/3] touch-none overflow-hidden bg-gradient-to-br from-[#3A2419] to-[#171411] bg-cover bg-center outline-none",
          isBusy
            ? "cursor-not-allowed"
            : "cursor-grab active:cursor-grabbing",
        ].join(" ")}
        style={
          posterUrl
            ? {
                backgroundImage: `url("${posterUrl}")`,
              }
            : undefined
        }
      >
        {!posterUrl ? (
          <div className="absolute inset-0 flex items-center justify-center p-4 text-center">
            <span className="text-sm font-semibold leading-5 text-[#8A8580]">
              {item.title}
            </span>
          </div>
        ) : null}

        <div className="absolute inset-0 bg-gradient-to-t from-black/95 via-black/5 to-transparent" />

        <span className="absolute left-3 top-3 flex h-9 w-9 items-center justify-center rounded-full bg-[#C84B18] text-sm font-bold text-white shadow-lg shadow-black/30">
          {position}
        </span>

        <span className="absolute right-3 top-3 flex h-9 w-9 items-center justify-center rounded-full border border-white/15 bg-black/65 text-white/75 opacity-0 backdrop-blur transition group-hover:opacity-100 group-focus:opacity-100">
          <DragIcon className="h-4 w-4" />
        </span>

        <div className="absolute inset-x-0 bottom-0 p-4">
          <h3 className="line-clamp-2 text-base font-semibold leading-5 text-white">
            {item.title}
          </h3>

          <span className="mt-2 inline-flex rounded border border-white/10 bg-black/50 px-1.5 py-0.5 text-[8px] font-medium uppercase tracking-[0.1em] text-white/55">
            {item.mediaType === "movie" ? "Film" : "Series"}
          </span>
        </div>
      </div>

      <div className="p-3">
        <button
          type="button"
          disabled={isBusy}
          onClick={() => onRemove(item)}
          className="w-full rounded-xl border border-red-900/60 px-3 py-2.5 text-xs font-semibold text-red-300 transition hover:border-red-800 hover:bg-red-950/25 disabled:cursor-not-allowed disabled:opacity-40"
        >
          {isBusy ? "Please wait..." : "Remove"}
        </button>
      </div>
    </article>
  );
}

function AddTitleSlot({
  position,
  disabled,
  onClick,
}: {
  position: number;
  disabled: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      disabled={disabled}
      onClick={onClick}
      className="group relative flex aspect-[2/3] w-full flex-col items-center justify-center overflow-hidden rounded-2xl border border-dashed border-[#38332E] bg-[#141210] p-5 text-center transition duration-200 hover:-translate-y-1 hover:border-[#C84B18]/60 hover:bg-[#1A1613] hover:shadow-xl hover:shadow-black/30 disabled:pointer-events-none"
    >
      <span className="absolute left-3 top-3 flex h-9 w-9 items-center justify-center rounded-full border border-[#302C28] bg-black/25 text-sm font-semibold text-[#625D58] transition group-hover:border-[#C84B18]/40 group-hover:text-[#E45A1C]">
        {position}
      </span>

      <span className="flex h-14 w-14 items-center justify-center rounded-full border border-[#38332E] bg-[#211E1B] text-[#8A8580] transition duration-200 group-hover:scale-110 group-hover:border-[#C84B18]/60 group-hover:bg-[#2A1C15] group-hover:text-[#E45A1C]">
        <PlusIcon className="h-6 w-6" />
      </span>

      <h3 className="mt-5 text-sm font-semibold text-[#C9C4BC] transition group-hover:text-[#F4F1EB]">
        Add title
      </h3>

      <p className="mt-2 text-xs leading-5 text-[#625D58]">
        Search films or series
      </p>
    </button>
  );
}

function FeaturedCardPreview({
  item,
  position,
}: {
  item: FeaturedFilmItem;
  position: number;
}) {
  const posterUrl = getPosterUrl(item.posterPath);

  return (
    <div className="overflow-hidden rounded-2xl border border-[#C84B18]/80 bg-[#1A1714] shadow-[0_32px_90px_rgba(0,0,0,0.85)]">
      <div
        className="relative aspect-[2/3] overflow-hidden bg-gradient-to-br from-[#3A2419] to-[#171411] bg-cover bg-center"
        style={
          posterUrl
            ? {
                backgroundImage: `url("${posterUrl}")`,
              }
            : undefined
        }
      >
        {!posterUrl ? (
          <div className="absolute inset-0 flex items-center justify-center p-4 text-center">
            <span className="text-sm font-semibold text-[#8A8580]">
              {item.title}
            </span>
          </div>
        ) : null}

        <div className="absolute inset-0 bg-gradient-to-t from-black/95 via-black/5 to-transparent" />

        <span className="absolute left-3 top-3 flex h-9 w-9 items-center justify-center rounded-full bg-[#C84B18] text-sm font-bold text-white shadow-lg">
          {position}
        </span>

        <span className="absolute right-3 top-3 flex h-9 w-9 items-center justify-center rounded-full border border-white/15 bg-black/65 text-white backdrop-blur">
          <DragIcon className="h-4 w-4" />
        </span>

        <div className="absolute inset-x-0 bottom-0 p-4">
          <h3 className="line-clamp-2 text-base font-semibold leading-5 text-white">
            {item.title}
          </h3>
        </div>
      </div>
    </div>
  );
}

function resolveTargetIndex(
  overId: string,
  items: FeaturedFilmItem[],
) {
  const slotPosition = getSlotPosition(overId);

  if (slotPosition !== null) {
    return slotPosition - 1;
  }

  const itemIndex = items.findIndex((item) => item.id === overId);

  return itemIndex >= 0 ? itemIndex : null;
}

function getSlotPosition(value: string) {
  const match = /^slot-([1-5])$/.exec(value);

  if (!match) {
    return null;
  }

  return Number(match[1]);
}

function sortItems(items: FeaturedFilmItem[]) {
  return [...items].sort(
    (firstItem, secondItem) =>
      firstItem.position - secondItem.position,
  );
}

function reindexItems(items: FeaturedFilmItem[]) {
  return items.map((item, index) => ({
    ...item,
    position: index + 1,
  }));
}

function getPosterUrl(posterPath: string | null) {
  if (!posterPath) {
    return null;
  }

  return `https://image.tmdb.org/t/p/w500${posterPath}`;
}

function PlusIcon({
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
        d="M12 5v14M5 12h14"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
      />
    </svg>
  );
}

function DragIcon({
  className = "",
}: {
  className?: string;
}) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="currentColor"
      aria-hidden="true"
      className={className}
    >
      <circle cx="8" cy="7" r="1.4" />
      <circle cx="16" cy="7" r="1.4" />
      <circle cx="8" cy="12" r="1.4" />
      <circle cx="16" cy="12" r="1.4" />
      <circle cx="8" cy="17" r="1.4" />
      <circle cx="16" cy="17" r="1.4" />
    </svg>
  );
}

function LoadingIcon({
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
        r="8"
        stroke="currentColor"
        strokeWidth="2"
        strokeOpacity="0.3"
      />

      <path
        d="M20 12a8 8 0 0 0-8-8"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
      />
    </svg>
  );
}