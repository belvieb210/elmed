export function EnTetePage({ titre, description }: { titre: string; description?: string }) {
  return (
    <div className="mb-5">
      <h1 className="text-xl font-semibold text-slate-900 sm:text-2xl">{titre}</h1>
      {description && <p className="mt-1 text-sm text-slate-500">{description}</p>}
    </div>
  );
}
