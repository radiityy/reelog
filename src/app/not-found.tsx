import Link from "next/link";

export default function NotFound() {
  return (
    <main className="flex min-h-screen items-center justify-center bg-[#14110F] px-6 text-[#F2ECE4]">
      <div className="text-center">
        <p className="font-mono text-sm font-bold uppercase tracking-[0.25em] text-[#F5A623]">
          404
        </p>

        <h1 className="mt-4 text-4xl font-black">Page not found</h1>

        <p className="mt-3 text-[#F2ECE4]/60">
          The page you are looking for does not exist.
        </p>

        <Link
          href="/"
          className="mt-8 inline-flex rounded-full bg-[#E8553E] px-6 py-3 text-sm font-black text-white"
        >
          Back to home
        </Link>
      </div>
    </main>
  );
}