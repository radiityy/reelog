const TMDB_BASE_URL = "https://api.themoviedb.org/3";

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
};

type TmdbMultiSearchResponse = {
  page: number;
  results: TmdbRawSearchResult[];
  total_pages: number;
  total_results: number;
};

export type TmdbSearchResult = {
  id: number;
  mediaType: "movie" | "tv";
  title: string;
  overview: string;
  posterPath: string | null;
  releaseDate: string | null;
  rating: number;
};

export type TmdbSearchResponse = {
  page: number;
  totalPages: number;
  totalResults: number;
  results: TmdbSearchResult[];
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

export function getTmdbPosterUrl(posterPath: string | null) {
  if (!posterPath) {
    return null;
  }

  return `https://image.tmdb.org/t/p/w342${posterPath}`;
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

  const response = await fetch(
    `${TMDB_BASE_URL}/search/multi?${params.toString()}`,
    {
      headers: {
        Authorization: `Bearer ${getTmdbToken()}`,
        Accept: "application/json",
      },
      cache: "no-store",
    },
  );

  if (!response.ok) {
    const responseBody = await response.text();

    console.error("TMDB search failed:", {
      status: response.status,
      responseBody,
    });

    throw new Error(`TMDB request failed with status ${response.status}.`);
  }

  const data = (await response.json()) as TmdbMultiSearchResponse;

  const results = data.results
    .filter(
      (
        item,
      ): item is TmdbRawSearchResult & {
        media_type: "movie" | "tv";
      } => item.media_type === "movie" || item.media_type === "tv",
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
    }));

  return {
    page: data.page,
    totalPages: data.total_pages,
    totalResults: data.total_results,
    results,
  };
}