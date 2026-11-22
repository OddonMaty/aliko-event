import { Download } from "lucide-react";

import type { Template } from "@/lib/templates";

/** Pass personnel de l'invité : son QR code, son nom, la date de l'événement. */
export function GuestPass({ token, name, date, template }: { token: string; name: string; date: string; template: Template }) {
  const p = template.palette;
  return (
    <section className="px-6 py-10" style={{ background: p.bg }}>
      <div className="rounded-2xl p-6 text-center" style={{ background: p.surface, color: p.fg }}>
        <p className="mb-5 text-[10px] tracking-[0.3em] uppercase" style={{ color: p.muted }}>
          Pass invité personnel
        </p>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={`/api/pass/${token}/qr`}
          alt={`QR code personnel de ${name}`}
          width={220}
          height={220}
          className="mx-auto size-56 rounded-xl bg-white p-2"
        />
        <p className="mt-5 text-xl" style={{ fontFamily: template.fonts.display }}>
          {name}
        </p>
        {date && (
          <p className="mt-1 text-xs capitalize" style={{ color: p.muted }}>
            {date}
          </p>
        )}
        <a
          href={`/api/pass/${token}/qr?download=1`}
          className="mt-5 inline-flex items-center gap-2 rounded-full px-5 py-2.5 text-sm font-medium"
          style={{ border: `1px solid ${p.accent}`, color: p.accent }}
        >
          <Download className="size-4" /> Télécharger
        </a>
        <p className="mt-4 text-[11px]" style={{ color: p.muted }}>
          Présentez ce code à l&apos;entrée. Il est strictement personnel.
        </p>
      </div>
    </section>
  );
}
