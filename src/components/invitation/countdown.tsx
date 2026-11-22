"use client";

import { useEffect, useState } from "react";

interface Props {
  /** Date et heure locales : YYYY-MM-DDTHH:mm:00 */
  target: string;
  label: string;
  background: string;
  color: string;
  fontFamily: string;
}

function parts(ms: number) {
  const s = Math.max(0, Math.floor(ms / 1000));
  return {
    days: Math.floor(s / 86400),
    hours: Math.floor((s % 86400) / 3600),
    minutes: Math.floor((s % 3600) / 60),
    seconds: s % 60,
  };
}

const pad = (n: number) => String(n).padStart(2, "0");

export function Countdown({ target, label, background, color, fontFamily }: Props) {
  // Évite tout décalage serveur/navigateur : le décompte démarre une fois la page affichée.
  const [now, setNow] = useState<number | null>(null);

  useEffect(() => {
    setNow(Date.now());
    const id = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(id);
  }, []);

  const end = new Date(target).getTime();
  if (now === null || Number.isNaN(end) || end <= now) return null;
  const t = parts(end - now);
  const cells: Array<[string, string]> = [
    [t.days > 99 ? String(t.days) : pad(t.days), "jours"],
    [pad(t.hours), "heures"],
    [pad(t.minutes), "minutes"],
    [pad(t.seconds), "secondes"],
  ];

  return (
    <div className="rounded-2xl px-5 py-7 text-center" style={{ background, color }} role="timer" aria-label={label}>
      <p className="mb-4 text-sm italic opacity-90" style={{ fontFamily }}>
        {label}
      </p>
      <div className="flex items-start justify-center gap-5">
        {cells.map(([value, unit]) => (
          <div key={unit} className="min-w-12">
            <p className="text-3xl leading-none font-semibold tabular-nums" style={{ fontFamily }}>
              {value}
            </p>
            <p className="mt-2 text-[9px] tracking-[0.2em] uppercase opacity-75">{unit}</p>
          </div>
        ))}
      </div>
    </div>
  );
}
