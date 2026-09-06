"use client";

import { useState } from "react";
import { Eye, EyeOff } from "lucide-react";

export function ChampMotDePasse({
  label,
  value,
  onChange,
  autoComplete,
  placeholder,
  required = true,
  aide,
}: {
  label: string;
  value: string;
  onChange: (valeur: string) => void;
  autoComplete?: string;
  placeholder?: string;
  required?: boolean;
  aide?: string;
}) {
  const [visible, setVisible] = useState(false);

  return (
    <label className="block text-sm font-medium text-slate-700">
      {label}
      <span className="relative mt-1.5 block">
        <input
          type={visible ? "text" : "password"}
          value={value}
          autoComplete={autoComplete}
          placeholder={placeholder}
          onChange={(e) => onChange(e.target.value)}
          className="w-full rounded-xl border border-slate-200 bg-white px-3.5 py-2.5 pr-12 text-sm text-slate-900 outline-none transition focus:border-violet-marque focus:ring-4 focus:ring-violet-marque/10"
          required={required}
        />
        <button
          type="button"
          onClick={() => setVisible((actuel) => !actuel)}
          className="absolute inset-y-0 right-0 grid w-11 place-items-center text-slate-400 transition hover:text-slate-700"
          aria-label={visible ? "Masquer le mot de passe" : "Afficher le mot de passe"}
        >
          {visible ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
        </button>
      </span>
      {aide && <span className="mt-1.5 block text-xs font-normal text-slate-400">{aide}</span>}
    </label>
  );
}
