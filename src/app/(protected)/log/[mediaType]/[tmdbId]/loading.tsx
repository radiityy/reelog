export default function LogTitleLoading() {
  return (
    <div className="animate-pulse">
      <div className="grid gap-8 lg:grid-cols-[260px_1fr]">
        <div className="aspect-[2/3] w-full rounded-xl bg-[#211E1B]" />

        <div className="space-y-5">
          <div className="h-4 w-24 rounded bg-[#211E1B]" />

          <div className="h-10 w-3/4 rounded bg-[#211E1B]" />

          <div className="h-5 w-40 rounded bg-[#211E1B]" />

          <div className="h-32 rounded-xl bg-[#211E1B]" />

          <div className="h-12 w-36 rounded-full bg-[#211E1B]" />
        </div>
      </div>
    </div>
  );
}