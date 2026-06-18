import Link from "next/link";

export default function PrivacyPage() {
  return (
    <main className="min-h-screen bg-[#14110F] px-6 py-12 text-[#F2ECE4]">
      <div className="mx-auto max-w-3xl">
        <Link href="/" className="text-sm font-bold text-[#F5A623]">
          ← Back to Reelog
        </Link>

        <h1 className="mt-8 text-4xl font-black">Privacy Policy</h1>

        <p className="mt-4 leading-8 text-[#F2ECE4]/65">
          Reelog is currently in development. This page will explain how account,
          diary, watchlist, and public profile data are handled before public
          launch.
        </p>
      </div>
    </main>
  );
}