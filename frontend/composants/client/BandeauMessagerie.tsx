import Link from "next/link";

export function BandeauMessagerie() {
  return (
    <div className="sticky bottom-0 z-20 mt-6 flex flex-col gap-3 rounded-2xl border border-slate-100 bg-white px-4 py-3 shadow-[0_-8px_24px_rgba(15,23,42,0.04)] sm:flex-row sm:items-center sm:justify-between sm:px-5">
      <p className="text-sm text-slate-600">
        Des questions ? Notre équipe est disponible pour vous aider.
      </p>
      <Link
        href="/messagerie"
        className="inline-flex items-center justify-center rounded-xl bg-violet-marque px-4 py-2.5 text-sm font-medium text-white transition hover:bg-violet-fonce"
      >
        Ouvrir la messagerie
      </Link>
    </div>
  );
}
