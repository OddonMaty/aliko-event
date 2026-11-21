import type { CSSProperties, ReactNode } from "react";
import { CalendarDays, Clock, MapPin, Phone, Shirt } from "lucide-react";

import { isAllowedImageUrl, isAllowedMapUrl, type InvitationContent } from "@/lib/content";
import type { Template } from "@/lib/templates";
import { formatDateFr } from "@/lib/utils";

type Palette = Template["palette"];

interface ViewProps {
  content: InvitationContent;
  template: Template;
  /** Affiche « Créé avec Aliko Event » (masqué pour le palier Premium). */
  brand?: boolean;
  children?: ReactNode;
}

function Ornament({ p }: { p: Palette }) {
  return (
    <div className="flex items-center justify-center gap-3" aria-hidden>
      <span className="h-px w-12" style={{ background: p.accent, opacity: 0.7 }} />
      <span className="size-1.5 rotate-45" style={{ background: p.accent }} />
      <span className="h-px w-12" style={{ background: p.accent, opacity: 0.7 }} />
    </div>
  );
}

function Photo({ src, className, style }: { src: string; className?: string; style?: CSSProperties }) {
  if (!isAllowedImageUrl(src)) return null;
  // eslint-disable-next-line @next/next/no-img-element
  return <img src={src} alt="" loading="lazy" className={className} style={style} />;
}

function dateTime(c: InvitationContent) {
  const date = formatDateFr(c.date, "full");
  const time = c.time ? c.time.replace(":", "h") : "";
  return { date, time };
}

/* ───────────── COVERS (une par mise en page) ───────────── */

function CoverClassic({ c, t }: { c: InvitationContent; t: Template }) {
  const p = t.palette;
  const { date, time } = dateTime(c);
  return (
    <section className="px-6 py-16 text-center" style={{ background: p.bg }}>
      {c.photos[0] && (
        <Photo
          src={c.photos[0]}
          className="mx-auto mb-8 size-40 rounded-full object-cover"
          style={{ border: `2px solid ${p.accent}`, padding: 4 }}
        />
      )}
      {c.eyebrow && (
        <p className="mb-5 text-[11px] tracking-[0.3em] uppercase" style={{ color: p.accent }}>
          {c.eyebrow}
        </p>
      )}
      <Ornament p={p} />
      <h1 className="my-6 text-4xl leading-tight font-semibold sm:text-5xl" style={{ fontFamily: t.fonts.display, color: p.fg }}>
        {c.title}
      </h1>
      {c.subtitle && (
        <p className="text-lg italic" style={{ fontFamily: t.fonts.display, color: p.muted }}>
          {c.subtitle}
        </p>
      )}
      <div className="mt-6">
        <Ornament p={p} />
      </div>
      {(date || time) && (
        <p className="mt-6 text-sm tracking-widest uppercase" style={{ color: p.accent }}>
          {[date, time].filter(Boolean).join(" · ")}
        </p>
      )}
      {c.venueName && (
        <p className="mt-2 text-sm" style={{ color: p.muted }}>
          {c.venueName}
        </p>
      )}
    </section>
  );
}

function CoverFrame({ c, t }: { c: InvitationContent; t: Template }) {
  const p = t.palette;
  const { date, time } = dateTime(c);
  return (
    <section className="p-4" style={{ background: p.bg }}>
      <div className="p-1.5" style={{ border: `1px solid ${p.accent}` }}>
        <div className="px-6 py-14 text-center" style={{ border: `1px solid ${p.accent}66`, background: p.surface }}>
          {c.photos[0] && (
            <Photo src={c.photos[0]} className="mx-auto mb-8 aspect-[4/3] w-full max-w-xs object-cover" />
          )}
          {c.eyebrow && (
            <p className="mb-4 text-[11px] tracking-[0.3em] uppercase" style={{ color: p.accent }}>
              {c.eyebrow}
            </p>
          )}
          <h1 className="text-4xl leading-tight font-semibold sm:text-5xl" style={{ fontFamily: t.fonts.display, color: p.fg }}>
            {c.title}
          </h1>
          {c.subtitle && (
            <p className="mt-3 text-lg italic" style={{ fontFamily: t.fonts.display, color: p.muted }}>
              {c.subtitle}
            </p>
          )}
          <div className="my-6">
            <Ornament p={p} />
          </div>
          {(date || time) && (
            <p className="text-sm tracking-widest uppercase" style={{ color: p.accent }}>
              {[date, time].filter(Boolean).join(" · ")}
            </p>
          )}
          {c.venueName && (
            <p className="mt-2 text-sm" style={{ color: p.muted }}>
              {c.venueName}
            </p>
          )}
        </div>
      </div>
    </section>
  );
}

function CoverArch({ c, t }: { c: InvitationContent; t: Template }) {
  const p = t.palette;
  const { date, time } = dateTime(c);
  return (
    <section className="px-6 pt-12 pb-14 text-center" style={{ background: p.bg }}>
      <div
        className="mx-auto mb-8 aspect-[3/4] w-56 overflow-hidden rounded-t-full"
        style={{ background: p.surface, border: `1px solid ${p.accent}55` }}
      >
        {c.photos[0] ? (
          <Photo src={c.photos[0]} className="size-full object-cover" />
        ) : (
          <div className="flex size-full items-end justify-center pb-10" aria-hidden>
            <span className="size-2 rotate-45" style={{ background: p.accent }} />
          </div>
        )}
      </div>
      {c.eyebrow && (
        <p className="mb-3 text-[11px] tracking-[0.3em] uppercase" style={{ color: p.accent }}>
          {c.eyebrow}
        </p>
      )}
      <h1 className="text-4xl leading-tight font-semibold sm:text-5xl" style={{ fontFamily: t.fonts.display, color: p.fg }}>
        {c.title}
      </h1>
      {c.subtitle && (
        <p className="mt-3 text-lg italic" style={{ fontFamily: t.fonts.display, color: p.muted }}>
          {c.subtitle}
        </p>
      )}
      {(date || time) && (
        <p className="mt-6 text-sm tracking-widest uppercase" style={{ color: p.accent }}>
          {[date, time].filter(Boolean).join(" · ")}
        </p>
      )}
      {c.venueName && (
        <p className="mt-2 text-sm" style={{ color: p.muted }}>
          {c.venueName}
        </p>
      )}
    </section>
  );
}

function CoverMinimal({ c, t }: { c: InvitationContent; t: Template }) {
  const p = t.palette;
  const { date, time } = dateTime(c);
  return (
    <section style={{ background: p.bg }}>
      <div className="px-8 pt-14 pb-10">
        {c.eyebrow && (
          <p className="mb-6 text-[11px] tracking-[0.3em] uppercase" style={{ color: p.muted }}>
            {c.eyebrow}
          </p>
        )}
        <h1
          className="text-4xl leading-[1.05] font-bold tracking-tight uppercase sm:text-5xl"
          style={{ fontFamily: t.fonts.display, color: p.fg }}
        >
          {c.title}
        </h1>
        {c.subtitle && (
          <p className="mt-4 text-base" style={{ color: p.muted }}>
            {c.subtitle}
          </p>
        )}
        <div className="my-8 h-px w-full" style={{ background: p.accent, opacity: 0.5 }} />
        <div className="grid grid-cols-2 gap-6 text-sm">
          <div>
            <p className="mb-1 text-[10px] tracking-[0.25em] uppercase" style={{ color: p.muted }}>Date</p>
            <p style={{ color: p.fg }}>{date || "—"}</p>
          </div>
          <div>
            <p className="mb-1 text-[10px] tracking-[0.25em] uppercase" style={{ color: p.muted }}>Heure</p>
            <p style={{ color: p.fg }}>{time || "—"}</p>
          </div>
        </div>
      </div>
      {c.photos[0] && <Photo src={c.photos[0]} className="aspect-[16/9] w-full object-cover grayscale" />}
    </section>
  );
}

function CoverSplit({ c, t }: { c: InvitationContent; t: Template }) {
  const p = t.palette;
  const { date, time } = dateTime(c);
  return (
    <section style={{ background: p.bg }}>
      <div className="flex" style={{ background: p.surface }}>
        <div className="w-2 shrink-0" style={{ background: p.accent }} />
        <div className="px-6 py-12">
          {c.eyebrow && (
            <p className="mb-4 text-[11px] tracking-[0.3em] uppercase" style={{ color: p.accent }}>
              {c.eyebrow}
            </p>
          )}
          <h1 className="text-4xl leading-tight font-semibold sm:text-5xl" style={{ fontFamily: t.fonts.display, color: p.fg }}>
            {c.title}
          </h1>
          {c.subtitle && (
            <p className="mt-3 text-base" style={{ color: p.muted }}>
              {c.subtitle}
            </p>
          )}
        </div>
      </div>
      {c.photos[0] && <Photo src={c.photos[0]} className="aspect-[16/9] w-full object-cover" />}
      {(date || time || c.venueName) && (
        <div className="px-6 py-6 text-sm" style={{ color: p.fg }}>
          <p style={{ color: p.accent }} className="tracking-widest uppercase">
            {[date, time].filter(Boolean).join(" · ")}
          </p>
          {c.venueName && <p className="mt-1">{c.venueName}</p>}
        </div>
      )}
    </section>
  );
}

function Cover({ c, t }: { c: InvitationContent; t: Template }) {
  switch (t.layout) {
    case "frame":
      return <CoverFrame c={c} t={t} />;
    case "arch":
      return <CoverArch c={c} t={t} />;
    case "minimal":
      return <CoverMinimal c={c} t={t} />;
    case "split":
      return <CoverSplit c={c} t={t} />;
    default:
      return <CoverClassic c={c} t={t} />;
  }
}

/* ───────────── CORPS (commun) ───────────── */

function Body({ c, t }: { c: InvitationContent; t: Template }) {
  const p = t.palette;
  const left = t.layout === "minimal" || t.layout === "split";
  const align = left ? "text-left" : "text-center";
  const { date, time } = dateTime(c);
  const gallery = c.photos.slice(1).filter(isAllowedImageUrl);
  const mapOk = c.mapUrl && isAllowedMapUrl(c.mapUrl);
  const phoneDigits = c.contactPhone.replace(/[^\d+]/g, "");

  return (
    <div className="space-y-10 px-6 py-10" style={{ background: p.bg }}>
      {c.message && (
        <p className={`${align} mx-auto max-w-md text-base leading-relaxed italic`} style={{ color: p.fg, fontFamily: t.fonts.display }}>
          « {c.message} »
        </p>
      )}

      {(date || time || c.venueName || c.address || c.dressCode) && (
        <div className="space-y-4 rounded-lg p-6 text-sm" style={{ background: p.surface, color: p.fg }}>
          {date && (
            <div className="flex items-start gap-3">
              <CalendarDays className="mt-0.5 size-4 shrink-0" style={{ color: p.accent }} />
              <span className="capitalize">{date}</span>
            </div>
          )}
          {time && (
            <div className="flex items-start gap-3">
              <Clock className="mt-0.5 size-4 shrink-0" style={{ color: p.accent }} />
              <span>{time}</span>
            </div>
          )}
          {(c.venueName || c.address) && (
            <div className="flex items-start gap-3">
              <MapPin className="mt-0.5 size-4 shrink-0" style={{ color: p.accent }} />
              <div>
                {c.venueName && <p className="font-medium">{c.venueName}</p>}
                {c.address && <p style={{ color: p.muted }}>{c.address}</p>}
                {mapOk && (
                  <a
                    href={c.mapUrl}
                    target="_blank"
                    rel="noopener noreferrer nofollow"
                    className="mt-1 inline-block text-xs underline underline-offset-4"
                    style={{ color: p.accent }}
                  >
                    Voir sur la carte
                  </a>
                )}
              </div>
            </div>
          )}
          {c.dressCode && (
            <div className="flex items-start gap-3">
              <Shirt className="mt-0.5 size-4 shrink-0" style={{ color: p.accent }} />
              <span>Tenue : {c.dressCode}</span>
            </div>
          )}
        </div>
      )}

      {c.program.length > 0 && (
        <div>
          <h2 className={`${align} mb-5 text-xl font-semibold`} style={{ fontFamily: t.fonts.display, color: p.fg }}>
            Programme
          </h2>
          <ol className="space-y-3">
            {c.program.map((s, i) => (
              <li key={i} className="flex gap-4 text-sm" style={{ color: p.fg }}>
                <span className="w-14 shrink-0 tabular-nums" style={{ color: p.accent }}>
                  {s.time ? s.time.replace(":", "h") : ""}
                </span>
                <span>{s.label}</span>
              </li>
            ))}
          </ol>
        </div>
      )}

      {gallery.length > 0 && (
        <div className="grid grid-cols-2 gap-2">
          {gallery.map((src) => (
            <Photo key={src} src={src} className="aspect-square w-full rounded-md object-cover" />
          ))}
        </div>
      )}

      {phoneDigits && (
        <p className={`${align} text-sm`} style={{ color: p.muted }}>
          <Phone className="mr-2 inline size-4" style={{ color: p.accent }} />
          Contact : <a href={`tel:${phoneDigits}`} style={{ color: p.fg }}>{c.contactPhone}</a>
        </p>
      )}
    </div>
  );
}

export function InvitationView({ content, template, brand = true, children }: ViewProps) {
  const p = template.palette;
  return (
    <div className="w-full overflow-hidden" style={{ background: p.bg, color: p.fg, fontFamily: template.fonts.body }}>
      <Cover c={content} t={template} />
      <Body c={content} t={template} />
      {children}
      {brand && (
        <p className="pb-8 text-center text-[11px] tracking-[0.2em] uppercase" style={{ color: p.muted }}>
          Créé avec Aliko Event
        </p>
      )}
    </div>
  );
}

/** Vignette (couverture seule) pour la galerie des modèles. */
export function InvitationCover({ content, template }: { content: InvitationContent; template: Template }) {
  return <Cover c={content} t={template} />;
}
