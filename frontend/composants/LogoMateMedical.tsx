export function LogoMateMedical({ taille = "md" }: { taille?: "sm" | "md" }) {
  const dimension = taille === "sm" ? "h-8 w-8" : "h-10 w-10";
  const texte = taille === "sm" ? "text-lg" : "text-xl";

  return (
    <div className="flex items-center gap-2.5">
      <span
        className={`${dimension} grid place-items-center rounded-xl bg-violet-marque text-white shadow-sm`}
      >
        <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" aria-hidden>
          <path
            d="M12 4v16M8 8h8M9 16c.8 1.4 2 2.2 3 2.2S14.2 17.4 15 16"
            stroke="currentColor"
            strokeWidth="2.1"
            strokeLinecap="round"
          />
          <circle cx="8.2" cy="8" r="1.2" fill="currentColor" />
          <circle cx="15.8" cy="8" r="1.2" fill="currentColor" />
        </svg>
      </span>
      <span className={`${texte} font-semibold tracking-tight text-violet-marque`}>MateMedical</span>
    </div>
  );
}
