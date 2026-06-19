type SearchPageProps = {
  searchParams?: {
    q?: string | string[];
  };
};

export default function SearchPage({ searchParams }: SearchPageProps) {
  const rawQuery = searchParams?.q;

  const query = Array.isArray(rawQuery)
    ? rawQuery[0]
    : rawQuery?.trim();

  return (
    <div>
      <h1 className="text-3xl font-bold tracking-tight text-[#F4F1EB]">
        Search
      </h1>

      <p className="mt-2 text-sm text-[#8A8580]">
        Find films and series to add to your diary or watchlist.
      </p>

      {query ? (
        <section className="mt-10">
          <p className="text-sm text-[#8A8580]">Search results for</p>

          <h2 className="mt-1 text-2xl font-bold text-[#F4F1EB]">
            “{query}”
          </h2>

          <div className="mt-6 rounded-lg border border-dashed border-[#302C28] bg-[#171411] px-6 py-12 text-center">
            <p className="text-lg font-semibold text-[#F4F1EB]">
              TMDB search comes next
            </p>

            <p className="mx-auto mt-2 max-w-md text-sm leading-6 text-[#8A8580]">
              The search bar and navigation are ready. Actual results will be
              connected in the TMDB feature branch.
            </p>
          </div>
        </section>
      ) : (
        <div className="mt-10 rounded-lg border border-dashed border-[#302C28] bg-[#171411] px-6 py-12 text-center">
          <p className="text-lg font-semibold text-[#F4F1EB]">
            Search from the bar above
          </p>

          <p className="mx-auto mt-2 max-w-md text-sm leading-6 text-[#8A8580]">
            Try entering the title of a film or series.
          </p>
        </div>
      )}
    </div>
  );
}