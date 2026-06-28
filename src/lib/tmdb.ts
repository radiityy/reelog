const TMDB_BASE_URL = "https://api.themoviedb.org/3";

export type TmdbMediaType = "movie" | "tv";

type TmdbRawSearchResult = {
  id: number;
  media_type: "movie" | "tv" | "person";
  title?: string;
  name?: string;
  overview?: string;
  poster_path?: string | null;
  release_date?: string;
  first_air_date?: string;
  vote_average?: number;
  popularity?: number;
};

type TmdbMultiSearchResponse = {
  page: number;
  results: TmdbRawSearchResult[];
  total_pages: number;
  total_results: number;
};

type TmdbRawGenre = {
  id: number;
  name: string;
};

type TmdbRawTitleDetails = {
  id: number;
  title?: string;
  name?: string;
  overview?: string;
  poster_path?: string | null;
  backdrop_path?: string | null;
  release_date?: string;
  first_air_date?: string;
  vote_average?: number;
  vote_count?: number;
  genres?: TmdbRawGenre[];
  runtime?: number | null;
  episode_run_time?: number[];
  number_of_episodes?: number | null;
  number_of_seasons?: number | null;
  status?: string | null;
};

export type TmdbSearchResult = {
  id: number;
  mediaType: TmdbMediaType;
  title: string;
  overview: string;
  posterPath: string | null;
  releaseDate: string | null;
  rating: number;
  popularity: number;
};

export type TmdbSearchResponse = {
  page: number;
  totalPages: number;
  totalResults: number;
  results: TmdbSearchResult[];
};

export type TmdbTitleDetails = {
  id: number;
  mediaType: TmdbMediaType;
  title: string;
  overview: string;
  posterPath: string | null;
  backdropPath: string | null;
  releaseDate: string | null;
  rating: number;
  voteCount: number;
  genres: string[];
  runtimeMinutes: number | null;
  episodeRuntimeMinutes: number | null;
  numberOfEpisodes: number | null;
  numberOfSeasons: number | null;
  status: string | null;
};

function getTmdbToken() {
  const token = process.env.TMDB_API_READ_TOKEN;

  if (!token) {
    throw new Error(
      "TMDB_API_READ_TOKEN is missing from the environment variables.",
    );
  }

  return token;
}

async function fetchTmdb<T>(path: string): Promise<T> {
  const response = await fetch(`${TMDB_BASE_URL}${path}`, {
    headers: {
      Authorization: `Bearer ${getTmdbToken()}`,
      Accept: "application/json",
    },
    cache: "no-store",
  });

  if (!response.ok) {
    const body = await response.text();

    console.error("TMDB request failed:", {
      path,
      status: response.status,
      body,
    });

    throw new Error(
      `TMDB request failed with status ${response.status}.`,
    );
  }

  return (await response.json()) as T;
}

function getPositiveInteger(value: unknown) {
  if (
    typeof value !== "number" ||
    !Number.isInteger(value) ||
    value < 1
  ) {
    return null;
  }

  return value;
}

function getEpisodeRuntime(values: number[] | undefined) {
  if (!values) {
    return null;
  }

  const runtime = values.find(
    (value) =>
      Number.isInteger(value) &&
      value > 0,
  );

  return runtime ?? null;
}

export function getTmdbPosterUrl(
  posterPath: string | null,
  size: "w342" | "w500" | "w780" = "w342",
) {
  if (!posterPath) {
    return null;
  }

  return `https://image.tmdb.org/t/p/${size}${posterPath}`;
}

export function getTmdbBackdropUrl(
  backdropPath: string | null,
  size: "w780" | "w1280" | "original" = "w1280",
) {
  if (!backdropPath) {
    return null;
  }

  return `https://image.tmdb.org/t/p/${size}${backdropPath}`;
}

export async function searchTmdb(
  query: string,
  page = 1,
): Promise<TmdbSearchResponse> {
  const normalizedQuery = query.trim();

  if (!normalizedQuery) {
    return {
      page: 1,
      totalPages: 0,
      totalResults: 0,
      results: [],
    };
  }

  const params = new URLSearchParams({
    query: normalizedQuery,
    include_adult: "false",
    language: "en-US",
    page: String(page),
  });

  const data = await fetchTmdb<TmdbMultiSearchResponse>(
    `/search/multi?${params.toString()}`,
  );

  const results = data.results
    .filter(
      (
        item,
      ): item is TmdbRawSearchResult & {
        media_type: TmdbMediaType;
      } =>
        item.media_type === "movie" ||
        item.media_type === "tv",
    )
    .map<TmdbSearchResult>((item) => ({
      id: item.id,
      mediaType: item.media_type,
      title:
        item.media_type === "movie"
          ? item.title ?? "Untitled film"
          : item.name ?? "Untitled series",
      overview: item.overview?.trim() ?? "",
      posterPath: item.poster_path ?? null,
      releaseDate:
        item.media_type === "movie"
          ? item.release_date || null
          : item.first_air_date || null,
      rating:
        typeof item.vote_average === "number"
          ? item.vote_average
          : 0,
      popularity:
        typeof item.popularity === "number"
          ? item.popularity
          : 0,
    }));

  return {
    page: data.page,
    totalPages: data.total_pages,
    totalResults: data.total_results,
    results,
  };
}

export async function getTmdbTitleDetails(
  mediaType: TmdbMediaType,
  tmdbId: number,
): Promise<TmdbTitleDetails> {
  const data = await fetchTmdb<TmdbRawTitleDetails>(
    `/${mediaType}/${tmdbId}?language=en-US`,
  );

  const genres = (data.genres ?? [])
    .map((genre) => genre.name.trim())
    .filter(Boolean);

  return {
    id: data.id,
    mediaType,
    title:
      mediaType === "movie"
        ? data.title ?? "Untitled film"
        : data.name ?? "Untitled series",
    overview: data.overview?.trim() ?? "",
    posterPath: data.poster_path ?? null,
    backdropPath: data.backdrop_path ?? null,
    releaseDate:
      mediaType === "movie"
        ? data.release_date || null
        : data.first_air_date || null,
    rating:
      typeof data.vote_average === "number"
        ? data.vote_average
        : 0,
    voteCount:
      typeof data.vote_count === "number"
        ? data.vote_count
        : 0,
    genres,
    runtimeMinutes:
      mediaType === "movie"
        ? getPositiveInteger(data.runtime)
        : null,
    episodeRuntimeMinutes:
      mediaType === "tv"
        ? getEpisodeRuntime(data.episode_run_time)
        : null,
    numberOfEpisodes:
      mediaType === "tv"
        ? getPositiveInteger(data.number_of_episodes)
        : null,
    numberOfSeasons:
      mediaType === "tv"
        ? getPositiveInteger(data.number_of_seasons)
        : null,
    status: data.status?.trim() || null,
  };
}