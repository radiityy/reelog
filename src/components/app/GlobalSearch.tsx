"use client";

import {
  type FormEvent,
  type KeyboardEvent as ReactKeyboardEvent,
  type ReactNode,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import {
  usePathname,
  useRouter,
  useSearchParams,
} from "next/navigation";

type TitleSuggestion = {
  id: number;
  title: string;
  mediaType: "movie" | "tv";
  posterUrl: string | null;
  releaseYear: string | null;
  rating: number;
};

type PersonSuggestion = {
  id: string;
  username: string;
  name: string | null;
  avatarUrl: string | null;
};

type SuggestionResponse = {
  titles: TitleSuggestion[];
  people: PersonSuggestion[];
  message?: string;
};

type RecentSearch =
  | {
      key: string;
      type: "query";
      query: string;
    }
  | {
      key: string;
      type: "title";
      title: string;
      href: string;
      subtitle: string;
      imageUrl: string | null;
    }
  | {
      key: string;
      type: "profile";
      title: string;
      href: string;
      subtitle: string;
      imageUrl: string | null;
    };

type NavigableItem =
  | {
      key: string;
      kind: "search-all";
      label: string;
      href: string;
    }
  | {
      key: string;
      kind: "title";
      data: TitleSuggestion;
      href: string;
    }
  | {
      key: string;
      kind: "person";
      data: PersonSuggestion;
      href: string;
    }
  | {
      key: string;
      kind: "recent";
      data: RecentSearch;
      href: string;
    };

const RECENT_SEARCHES_KEY = "reelog-recent-searches";
const MAX_RECENT_SEARCHES = 6;
const SEARCH_DEBOUNCE = 180;

export function GlobalSearch() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const rootRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const [query, setQuery] = useState(
    searchParams.get("q") ?? "",
  );

  const [isOpen, setIsOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");

  const [titles, setTitles] = useState<
    TitleSuggestion[]
  >([]);

  const [people, setPeople] = useState<
    PersonSuggestion[]
  >([]);

  const [recentSearches, setRecentSearches] =
    useState<RecentSearch[]>([]);

  const [activeIndex, setActiveIndex] = useState(-1);

  const normalizedQuery = query.trim();
  const hasQuery = normalizedQuery.length > 0;

  useEffect(() => {
    setQuery(searchParams.get("q") ?? "");
  }, [searchParams]);

  useEffect(() => {
    try {
      const storedValue = window.localStorage.getItem(
        RECENT_SEARCHES_KEY,
      );

      if (!storedValue) {
        return;
      }

      const parsedValue = JSON.parse(
        storedValue,
      ) as unknown;

      if (!Array.isArray(parsedValue)) {
        window.localStorage.removeItem(
          RECENT_SEARCHES_KEY,
        );
        return;
      }

      setRecentSearches(
        parsedValue.slice(
          0,
          MAX_RECENT_SEARCHES,
        ) as RecentSearch[],
      );
    } catch {
      window.localStorage.removeItem(
        RECENT_SEARCHES_KEY,
      );
    }
  }, []);

  useEffect(() => {
    function handlePointerDown(event: MouseEvent) {
      if (
        rootRef.current &&
        !rootRef.current.contains(event.target as Node)
      ) {
        setIsOpen(false);
        setActiveIndex(-1);
      }
    }

    function handleGlobalKeyDown(
      event: KeyboardEvent,
    ) {
      const isSearchShortcut =
        (event.ctrlKey || event.metaKey) &&
        event.key.toLowerCase() === "k";

      if (isSearchShortcut) {
        event.preventDefault();

        setIsOpen(true);

        window.requestAnimationFrame(() => {
          inputRef.current?.focus();
        });

        return;
      }

      if (event.key === "Escape") {
        setIsOpen(false);
        setActiveIndex(-1);
      }
    }

    document.addEventListener(
      "mousedown",
      handlePointerDown,
    );

    window.addEventListener(
      "keydown",
      handleGlobalKeyDown,
    );

    return () => {
      document.removeEventListener(
        "mousedown",
        handlePointerDown,
      );

      window.removeEventListener(
        "keydown",
        handleGlobalKeyDown,
      );
    };
  }, []);

  useEffect(() => {
    setActiveIndex(-1);

    if (normalizedQuery.length < 2) {
      setTitles([]);
      setPeople([]);
      setErrorMessage("");
      setIsLoading(false);
      return;
    }

    const controller = new AbortController();

    const timeout = window.setTimeout(async () => {
      setIsLoading(true);
      setErrorMessage("");

      try {
        const response = await fetch(
          `/api/search/suggestions?q=${encodeURIComponent(
            normalizedQuery,
          )}`,
          {
            signal: controller.signal,
          },
        );

        const payload =
          (await response.json()) as SuggestionResponse;

        if (!response.ok) {
          setTitles([]);
          setPeople([]);

          setErrorMessage(
            payload.message ??
              "Unable to load search suggestions.",
          );

          return;
        }

        setTitles(payload.titles ?? []);
        setPeople(payload.people ?? []);
      } catch (error) {
        if (
          error instanceof DOMException &&
          error.name === "AbortError"
        ) {
          return;
        }

        setTitles([]);
        setPeople([]);

        setErrorMessage(
          "Unable to load search suggestions.",
        );
      } finally {
        setIsLoading(false);
      }
    }, SEARCH_DEBOUNCE);

    return () => {
      window.clearTimeout(timeout);
      controller.abort();
    };
  }, [normalizedQuery]);

  useEffect(() => {
    for (const title of titles) {
      router.prefetch(
        `/log/${title.mediaType}/${title.id}`,
      );
    }

    for (const person of people) {
      router.prefetch(`/u/${person.username}`);
    }
  }, [people, router, titles]);

  const navigableItems =
    useMemo<NavigableItem[]>(() => {
      if (!hasQuery) {
        return recentSearches.map((recent) => ({
          key: recent.key,
          kind: "recent",
          data: recent,
          href:
            recent.type === "query"
              ? `/search?q=${encodeURIComponent(
                  recent.query,
                )}`
              : recent.href,
        }));
      }

      const items: NavigableItem[] = [
        {
          key: `search-all:${normalizedQuery}`,
          kind: "search-all",
          label: normalizedQuery,
          href: `/search?q=${encodeURIComponent(
            normalizedQuery,
          )}`,
        },
      ];

      for (const title of titles) {
        items.push({
          key: `title:${title.mediaType}:${title.id}`,
          kind: "title",
          data: title,
          href: `/log/${title.mediaType}/${title.id}`,
        });
      }

      for (const person of people) {
        items.push({
          key: `person:${person.id}`,
          kind: "person",
          data: person,
          href: `/u/${person.username}`,
        });
      }

      return items;
    }, [
      hasQuery,
      normalizedQuery,
      people,
      recentSearches,
      titles,
    ]);

  function persistRecentSearches(
    items: RecentSearch[],
  ) {
    if (items.length === 0) {
      window.localStorage.removeItem(
        RECENT_SEARCHES_KEY,
      );
      return;
    }

    window.localStorage.setItem(
      RECENT_SEARCHES_KEY,
      JSON.stringify(items),
    );
  }

  function saveRecentSearch(item: RecentSearch) {
    setRecentSearches((current) => {
      const nextItems = [
        item,
        ...current.filter(
          (currentItem) =>
            currentItem.key !== item.key,
        ),
      ].slice(0, MAX_RECENT_SEARCHES);

      persistRecentSearches(nextItems);

      return nextItems;
    });
  }

  function removeRecentSearch(key: string) {
    setRecentSearches((current) => {
      const nextItems = current.filter(
        (item) => item.key !== key,
      );

      persistRecentSearches(nextItems);

      return nextItems;
    });

    setActiveIndex(-1);
  }

  function clearRecentSearches() {
    setRecentSearches([]);
    persistRecentSearches([]);
    setActiveIndex(-1);
  }

  function navigateToItem(item: NavigableItem) {
    if (item.kind === "search-all") {
      saveRecentSearch({
        key: `query:${item.label.toLowerCase()}`,
        type: "query",
        query: item.label,
      });
    }

    if (item.kind === "title") {
      saveRecentSearch({
        key: item.key,
        type: "title",
        title: item.data.title,
        subtitle: `${
          item.data.mediaType === "movie"
            ? "Film"
            : "Series"
        }${
          item.data.releaseYear
            ? ` · ${item.data.releaseYear}`
            : ""
        }`,
        href: item.href,
        imageUrl: item.data.posterUrl,
      });
    }

    if (item.kind === "person") {
      saveRecentSearch({
        key: item.key,
        type: "profile",
        title:
          item.data.name?.trim() ||
          `@${item.data.username}`,
        subtitle: `@${item.data.username}`,
        href: item.href,
        imageUrl: item.data.avatarUrl,
      });
    }

    setIsOpen(false);
    setActiveIndex(-1);

    router.push(item.href);
  }

  function handleSubmit(
    event: FormEvent<HTMLFormElement>,
  ) {
    event.preventDefault();

    if (!normalizedQuery) {
      setIsOpen(true);
      inputRef.current?.focus();
      return;
    }

    if (
      activeIndex >= 0 &&
      navigableItems[activeIndex]
    ) {
      navigateToItem(
        navigableItems[activeIndex],
      );
      return;
    }

    saveRecentSearch({
      key: `query:${normalizedQuery.toLowerCase()}`,
      type: "query",
      query: normalizedQuery,
    });

    setIsOpen(false);
    setActiveIndex(-1);

    router.push(
      `/search?q=${encodeURIComponent(
        normalizedQuery,
      )}`,
    );
  }

  function handleInputKeyDown(
    event: ReactKeyboardEvent<HTMLInputElement>,
  ) {
    if (event.key === "ArrowDown") {
      event.preventDefault();
      setIsOpen(true);

      setActiveIndex((current) => {
        if (navigableItems.length === 0) {
          return -1;
        }

        if (
          current >=
          navigableItems.length - 1
        ) {
          return 0;
        }

        return current + 1;
      });

      return;
    }

    if (event.key === "ArrowUp") {
      event.preventDefault();
      setIsOpen(true);

      setActiveIndex((current) => {
        if (navigableItems.length === 0) {
          return -1;
        }

        if (current <= 0) {
          return navigableItems.length - 1;
        }

        return current - 1;
      });

      return;
    }

    if (
      event.key === "Enter" &&
      activeIndex >= 0 &&
      navigableItems[activeIndex]
    ) {
      event.preventDefault();

      navigateToItem(
        navigableItems[activeIndex],
      );
    }
  }

  function handleClear() {
    setQuery("");
    setTitles([]);
    setPeople([]);
    setErrorMessage("");
    setActiveIndex(-1);
    setIsOpen(true);

    if (
      pathname === "/search" &&
      searchParams.get("q")
    ) {
      router.replace("/search", {
        scroll: false,
      });
    }

    window.requestAnimationFrame(() => {
      inputRef.current?.focus();
    });
  }

  const showDropdown = isOpen;

  const showEmptyState =
    hasQuery &&
    normalizedQuery.length >= 2 &&
    !isLoading &&
    !errorMessage &&
    titles.length === 0 &&
    people.length === 0;

  return (
    <div
      ref={rootRef}
      className="relative w-full max-w-4xl"
    >
      <form onSubmit={handleSubmit}>
        <div
          className={[
            "flex h-12 w-full items-center rounded-full border bg-[#211E1B] px-4 transition",
            showDropdown
              ? "border-[#F4F1EB] shadow-lg shadow-black/20"
              : "border-[#302C28] focus-within:border-[#4A4540] focus-within:bg-[#25211E]",
          ].join(" ")}
        >
          <SearchIcon className="h-5 w-5 shrink-0 text-[#8A8580]" />

          <input
            ref={inputRef}
            type="search"
            role="combobox"
            aria-autocomplete="list"
            value={query}
            onFocus={() => setIsOpen(true)}
            onChange={(event) => {
              setQuery(event.target.value);
              setIsOpen(true);
            }}
            onKeyDown={handleInputKeyDown}
            placeholder="Search films, series, or people"
            aria-label="Search films, series, or people"
            aria-expanded={showDropdown}
            aria-controls="global-search-results"
            className="min-w-0 flex-1 bg-transparent px-4 text-sm font-medium text-[#F4F1EB] outline-none placeholder:font-normal placeholder:text-[#625D58] [&::-webkit-search-cancel-button]:hidden [&::-webkit-search-decoration]:hidden"
          />

          {query ? (
            <button
              type="button"
              onClick={handleClear}
              aria-label="Clear search"
              className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-[#716B65] transition hover:bg-[#37322E] hover:text-[#F4F1EB]"
            >
              <CloseIcon className="h-4 w-4" />
            </button>
          ) : showDropdown ? (
            <div className="hidden items-center gap-1 sm:flex">
              <KeyboardKey>Ctrl</KeyboardKey>
              <KeyboardKey>K</KeyboardKey>
            </div>
          ) : null}
        </div>
      </form>

      {showDropdown ? (
        <div
          id="global-search-results"
          className="absolute left-0 right-0 top-[calc(100%+8px)] z-50 max-h-[min(70vh,620px)] overflow-y-auto rounded-xl border border-[#302C28] bg-[#1A1714] p-2 shadow-2xl shadow-black/60"
        >
          {!hasQuery ? (
            <RecentSearches
              items={recentSearches}
              activeIndex={activeIndex}
              onChoose={(index) => {
                const item =
                  navigableItems[index];

                if (item) {
                  navigateToItem(item);
                }
              }}
              onRemove={removeRecentSearch}
              onClear={clearRecentSearches}
            />
          ) : (
            <>
              <KeyboardHint />

              <SearchAllRow
                query={normalizedQuery}
                active={activeIndex === 0}
                onClick={() => {
                  const item = navigableItems[0];

                  if (item) {
                    navigateToItem(item);
                  }
                }}
              />

              {isLoading ? <LoadingState /> : null}

              {errorMessage ? (
                <p className="px-4 py-5 text-sm text-red-300">
                  {errorMessage}
                </p>
              ) : null}

              {!isLoading &&
              titles.length > 0 ? (
                <section className="mt-2">
                  <SectionLabel>
                    Titles
                  </SectionLabel>

                  <div className="mt-1 space-y-1">
                    {titles.map(
                      (title, titleIndex) => {
                        const itemIndex =
                          titleIndex + 1;

                        return (
                          <TitleRow
                            key={`${title.mediaType}-${title.id}`}
                            item={title}
                            active={
                              activeIndex ===
                              itemIndex
                            }
                            onPrefetch={() =>
                              router.prefetch(
                                `/log/${title.mediaType}/${title.id}`,
                              )
                            }
                            onClick={() => {
                              const item =
                                navigableItems[
                                  itemIndex
                                ];

                              if (item) {
                                navigateToItem(
                                  item,
                                );
                              }
                            }}
                          />
                        );
                      },
                    )}
                  </div>
                </section>
              ) : null}

              {!isLoading &&
              people.length > 0 ? (
                <section className="mt-3 border-t border-[#302C28] pt-3">
                  <SectionLabel>
                    People
                  </SectionLabel>

                  <div className="mt-1 space-y-1">
                    {people.map(
                      (person, personIndex) => {
                        const itemIndex =
                          1 +
                          titles.length +
                          personIndex;

                        return (
                          <PersonRow
                            key={person.id}
                            item={person}
                            active={
                              activeIndex ===
                              itemIndex
                            }
                            onPrefetch={() =>
                              router.prefetch(
                                `/u/${person.username}`,
                              )
                            }
                            onClick={() => {
                              const item =
                                navigableItems[
                                  itemIndex
                                ];

                              if (item) {
                                navigateToItem(
                                  item,
                                );
                              }
                            }}
                          />
                        );
                      },
                    )}
                  </div>
                </section>
              ) : null}

              {showEmptyState ? (
                <div className="px-4 py-8 text-center">
                  <p className="text-sm font-semibold text-[#F4F1EB]">
                    No quick results found
                  </p>

                  <p className="mt-2 text-xs text-[#716B65]">
                    Press Enter to search all
                    titles.
                  </p>
                </div>
              ) : null}
            </>
          )}
        </div>
      ) : null}
    </div>
  );
}

function RecentSearches({
  items,
  activeIndex,
  onChoose,
  onRemove,
  onClear,
}: {
  items: RecentSearch[];
  activeIndex: number;
  onChoose: (index: number) => void;
  onRemove: (key: string) => void;
  onClear: () => void;
}) {
  if (items.length === 0) {
    return (
      <div className="flex items-center gap-3 px-3 py-3">
        <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-[#211E1B] text-[#716B65]">
          <SearchIcon className="h-5 w-5" />
        </span>

        <div className="min-w-0">
          <p className="text-sm font-semibold text-[#F4F1EB]">
            Start searching
          </p>

          <p className="mt-0.5 truncate text-xs text-[#716B65]">
            Find films, series, and public
            profiles.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div>
      <div className="flex items-center justify-between gap-4 px-3 pb-3 pt-2">
        <h2 className="text-base font-semibold text-[#F4F1EB]">
          Recent searches
        </h2>

        <button
          type="button"
          onClick={onClear}
          className="text-xs font-medium text-[#8A8580] transition hover:text-[#E45A1C]"
        >
          Clear all
        </button>
      </div>

      <div className="space-y-1">
        {items.map((item, index) => {
          const title =
            item.type === "query"
              ? item.query
              : item.title;

          return (
            <div
              key={item.key}
              className={[
                "group flex items-center rounded-xl transition",
                activeIndex === index
                  ? "bg-[#3A3632]"
                  : "hover:bg-[#302C28]",
              ].join(" ")}
            >
              <button
                type="button"
                onClick={() => onChoose(index)}
                className="flex min-w-0 flex-1 items-center gap-3 px-3 py-3 text-left"
              >
                {item.type === "query" ? (
                  <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-[#211E1B] text-[#8A8580]">
                    <SearchIcon className="h-5 w-5" />
                  </span>
                ) : (
                  <SearchImage
                    imageUrl={item.imageUrl}
                    rounded={
                      item.type === "profile"
                    }
                    fallback={item.title}
                    size="large"
                  />
                )}

                <span className="min-w-0 flex-1">
                  <span className="block truncate text-sm font-semibold text-[#F4F1EB]">
                    {title}
                  </span>

                  <span className="mt-1 block truncate text-xs text-[#A7A19A]">
                    {item.type === "query"
                      ? "Search"
                      : item.subtitle}
                  </span>
                </span>
              </button>

              <button
                type="button"
                onClick={() =>
                  onRemove(item.key)
                }
                aria-label={`Remove ${title} from recent searches`}
                title="Remove from recent searches"
                className="mr-3 flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-[#A7A19A] transition hover:bg-[#4A4540] hover:text-[#F4F1EB] focus:outline-none focus:ring-2 focus:ring-[#C84B18]/50"
              >
                <CloseIcon className="h-[18px] w-[18px]" />
              </button>
            </div>
          );
        })}
      </div>
    </div>
  );
}

function KeyboardHint() {
  return (
    <div className="flex items-center justify-between gap-4 border-b border-[#302C28] px-3 pb-3 pt-1 text-xs text-[#716B65]">
      <span className="flex items-center gap-2">
        <KeyboardKey>↑</KeyboardKey>
        <KeyboardKey>↓</KeyboardKey>
        Navigate
      </span>

      <span className="flex items-center gap-2">
        <KeyboardKey>Enter</KeyboardKey>
        Open
      </span>
    </div>
  );
}

function SearchAllRow({
  query,
  active,
  onClick,
}: {
  query: string;
  active: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={[
        "mt-2 flex w-full items-center gap-3 rounded-xl px-3 py-3 text-left transition",
        active
          ? "bg-[#302C28]"
          : "hover:bg-[#292521]",
      ].join(" ")}
    >
      <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-[#211E1B] text-[#A7A19A]">
        <SearchIcon className="h-5 w-5" />
      </span>

      <span className="min-w-0 text-sm text-[#A7A19A]">
        Search all results for{" "}
        <strong className="font-semibold text-[#F4F1EB]">
          {query}
        </strong>
      </span>
    </button>
  );
}

function TitleRow({
  item,
  active,
  onClick,
  onPrefetch,
}: {
  item: TitleSuggestion;
  active: boolean;
  onClick: () => void;
  onPrefetch: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      onMouseEnter={onPrefetch}
      onFocus={onPrefetch}
      className={[
        "flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-left transition",
        active
          ? "bg-[#302C28]"
          : "hover:bg-[#292521]",
      ].join(" ")}
    >
      <SearchImage
        imageUrl={item.posterUrl}
        fallback={item.title}
      />

      <span className="min-w-0 flex-1">
        <span className="block truncate text-sm font-semibold text-[#F4F1EB]">
          {item.title}
        </span>

        <span className="mt-1 block truncate text-xs text-[#8A8580]">
          {item.mediaType === "movie"
            ? "Film"
            : "Series"}

          {item.releaseYear
            ? ` · ${item.releaseYear}`
            : ""}
        </span>
      </span>

      {item.rating > 0 ? (
        <span className="shrink-0 text-xs font-medium text-[#E45A1C]">
          ★ {item.rating.toFixed(1)}
        </span>
      ) : null}
    </button>
  );
}

function PersonRow({
  item,
  active,
  onClick,
  onPrefetch,
}: {
  item: PersonSuggestion;
  active: boolean;
  onClick: () => void;
  onPrefetch: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      onMouseEnter={onPrefetch}
      onFocus={onPrefetch}
      className={[
        "flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-left transition",
        active
          ? "bg-[#302C28]"
          : "hover:bg-[#292521]",
      ].join(" ")}
    >
      <SearchImage
        imageUrl={item.avatarUrl}
        rounded
        fallback={item.username}
      />

      <span className="min-w-0 flex-1">
        <span className="block truncate text-sm font-semibold text-[#F4F1EB]">
          {item.name?.trim() ||
            `@${item.username}`}
        </span>

        <span className="mt-1 block truncate text-xs text-[#8A8580]">
          @{item.username} · Profile
        </span>
      </span>
    </button>
  );
}

function SearchImage({
  imageUrl,
  fallback,
  rounded = false,
  size = "normal",
}: {
  imageUrl: string | null;
  fallback: string;
  rounded?: boolean;
  size?: "normal" | "large";
}) {
  return (
    <span
      className={[
        "flex shrink-0 items-center justify-center bg-[#211E1B] bg-cover bg-center text-xs font-semibold text-[#8A8580]",
        size === "large"
          ? "h-12 w-12"
          : "h-11 w-11",
        rounded
          ? "rounded-full"
          : "rounded-lg",
      ].join(" ")}
      style={
        imageUrl
          ? {
              backgroundImage: `url("${imageUrl}")`,
            }
          : undefined
      }
    >
      {!imageUrl
        ? fallback.charAt(0).toUpperCase()
        : null}
    </span>
  );
}

function LoadingState() {
  return (
    <div className="flex items-center gap-3 px-4 py-6 text-sm text-[#8A8580]">
      <span className="h-4 w-4 animate-spin rounded-full border-2 border-[#514C47] border-t-[#E45A1C]" />

      Searching Reelog...
    </div>
  );
}

function SectionLabel({
  children,
}: {
  children: ReactNode;
}) {
  return (
    <p className="px-3 text-[10px] font-semibold uppercase tracking-[0.16em] text-[#625D58]">
      {children}
    </p>
  );
}

function KeyboardKey({
  children,
}: {
  children: ReactNode;
}) {
  return (
    <span className="inline-flex min-h-6 items-center justify-center rounded border border-[#514C47] bg-[#25211E] px-1.5 text-[10px] font-medium text-[#A7A19A]">
      {children}
    </span>
  );
}

function SearchIcon({
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
        cx="11"
        cy="11"
        r="6.5"
        stroke="currentColor"
        strokeWidth="1.8"
      />

      <path
        d="m16 16 4 4"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
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