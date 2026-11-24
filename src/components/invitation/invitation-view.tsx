import { SafeImg } from "./safe-img";
import type { CSSProperties, ReactNode } from "react";
import { CalendarDays, Clock, MapPin, Navigation, Phone, Shirt } from "lucide-react";

import { isAllowedImageUrl, isAllowedMapUrl, type InvitationContent } from "@/lib/content";
import type { Template } from "@/lib/templates";
import { Countdown } from "./countdown";
import { MapEmbed } from "./map-embed";
import { formatDateFr } from "@/lib/utils";

type Palette = Template["palette"];

interface ViewProps {
  content: InvitationContent;
  template: Template;
  /** Affiche « Créé avec Aliko Event » (masqué pour le palier Premium). */
  brand?: boolean;
  /** Prénom/nom de l'invité (lien personnel) : affiché dans l'accueil. */
  guestName?: string;
  /** Aperçu intégré (éditeur, galerie) : la couverture ne prend pas tout l'écran. */
  embedded?: boolean;
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
  return <SafeImg src={src} className={className} style={style} />;
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
    <section className="px-5 py-12 text-center sm:px-6 sm:py-16" style={{ background: p.bg }}>
      {c.photos[0] && (
        <Photo
          src={c.photos[0]}
          className="mx-auto mb-6 size-32 rounded-full sm:mb-8 sm:size-40 object-cover"
          style={{ border: `2px solid ${p.accent}`, padding: 4 }}
        />
      )}
      {c.eyebrow && (
        <p className="mb-5 text-[11px] tracking-[0.2em] sm:tracking-[0.3em] uppercase" style={{ color: p.accent }}>
          {c.eyebrow}
        </p>
      )}
      <Ornament p={p} />
      <h1 className="my-6 text-[clamp(1.75rem,8.5vw,2.25rem)] leading-tight font-semibold break-words sm:text-5xl" style={{ fontFamily: t.fonts.display, color: p.fg }}>
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
        <div className="px-5 py-10 text-center sm:px-6 sm:py-14" style={{ border: `1px solid ${p.accent}66`, background: p.surface }}>
          {c.photos[0] && (
            <Photo src={c.photos[0]} className="mx-auto mb-8 aspect-[4/3] w-full max-w-xs object-cover" />
          )}
          {c.eyebrow && (
            <p className="mb-4 text-[11px] tracking-[0.2em] sm:tracking-[0.3em] uppercase" style={{ color: p.accent }}>
              {c.eyebrow}
            </p>
          )}
          <h1 className="text-[clamp(1.75rem,8.5vw,2.25rem)] leading-tight font-semibold break-words sm:text-5xl" style={{ fontFamily: t.fonts.display, color: p.fg }}>
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
    <section className="px-5 pt-10 pb-12 text-center sm:px-6 sm:pt-12 sm:pb-14" style={{ background: p.bg }}>
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
        <p className="mb-3 text-[11px] tracking-[0.2em] sm:tracking-[0.3em] uppercase" style={{ color: p.accent }}>
          {c.eyebrow}
        </p>
      )}
      <h1 className="text-[clamp(1.75rem,8.5vw,2.25rem)] leading-tight font-semibold break-words sm:text-5xl" style={{ fontFamily: t.fonts.display, color: p.fg }}>
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
      <div className="px-5 pt-10 pb-8 sm:px-8 sm:pt-14 sm:pb-10">
        {c.eyebrow && (
          <p className="mb-6 text-[11px] tracking-[0.2em] sm:tracking-[0.3em] uppercase" style={{ color: p.muted }}>
            {c.eyebrow}
          </p>
        )}
        <h1
          className="text-[clamp(1.75rem,8.5vw,2.25rem)] leading-[1.05] font-bold tracking-tight break-words uppercase sm:text-5xl"
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
        <div className="grid grid-cols-2 gap-4 text-sm sm:gap-6">
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
        <div className="px-5 py-10 sm:px-6 sm:py-12">
          {c.eyebrow && (
            <p className="mb-4 text-[11px] tracking-[0.2em] sm:tracking-[0.3em] uppercase" style={{ color: p.accent }}>
              {c.eyebrow}
            </p>
          )}
          <h1 className="text-[clamp(1.75rem,8.5vw,2.25rem)] leading-tight font-semibold break-words sm:text-5xl" style={{ fontFamily: t.fonts.display, color: p.fg }}>
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
        <div className="px-5 py-5 text-sm sm:px-6 sm:py-6" style={{ color: p.fg }}>
          <p style={{ color: p.accent }} className="tracking-widest uppercase">
            {[date, time].filter(Boolean).join(" · ")}
          </p>
          {c.venueName && <p className="mt-1">{c.venueName}</p>}
        </div>
      )}
    </section>
  );
}

/** Couverture « Récit » : photo plein écran, titre en grand, fondu vers le contenu. */
function CoverStory({ c, t, compact }: { c: InvitationContent; t: Template; compact?: boolean }) {
  const p = t.palette;
  const photo = c.photos[0] && isAllowedImageUrl(c.photos[0]) ? c.photos[0] : null;
  return (
    <section
      className={`relative isolate flex flex-col justify-between overflow-hidden ${compact ? "h-[520px] sm:h-[560px]" : "min-h-[100svh]"}`}
      style={{ background: p.bg }}
    >
      {photo ? (
        <Photo src={photo} className="absolute inset-0 -z-20 size-full object-cover" />
      ) : (
        <div className="absolute inset-0 -z-20" style={{ background: `radial-gradient(120% 70% at 50% 0%, ${p.surface} 0%, ${p.bg} 100%)` }} />
      )}
      <div
        className="absolute inset-0 -z-10"
        style={{ background: `linear-gradient(to bottom, rgba(0,0,0,0.38) 0%, rgba(0,0,0,0) 26%, ${p.bg}00 48%, ${p.bg} 96%)` }}
      />
      <div className="px-5 pt-10 text-center sm:px-8 sm:pt-12">
        <span className="mx-auto mb-4 block size-1.5 rotate-45" style={{ background: photo ? "#ffffff" : p.accent }} aria-hidden />
        {c.eyebrow && (
          <p className="text-[10px] tracking-[0.22em] sm:tracking-[0.35em] uppercase" style={{ color: photo ? "#ffffffd9" : p.accent }}>
            {c.eyebrow}
          </p>
        )}
      </div>
      <div className="px-5 pb-8 text-center sm:px-8 sm:pb-10">
        <h1 className="text-[clamp(2.25rem,12vw,3.75rem)] leading-none break-words italic sm:text-7xl" style={{ fontFamily: t.fonts.display, color: p.fg, fontWeight: 500 }}>
          Invitation
        </h1>
        <p className="mt-8 text-[10px] tracking-[0.2em] sm:tracking-[0.3em] uppercase" style={{ color: p.muted }}>
          Faire défiler
        </p>
        <span className="mx-auto mt-2 block h-6 w-px" style={{ background: p.accent }} aria-hidden />
      </div>
    </section>
  );
}

function Cover({ c, t, compact }: { c: InvitationContent; t: Template; compact?: boolean }) {
  switch (t.layout) {
    case "story":
      return <CoverStory c={c} t={t} compact={compact} />;
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

function Body({ c, t, guestName }: { c: InvitationContent; t: Template; guestName?: string }) {
  const p = t.palette;
  const left = t.layout === "minimal" || t.layout === "split";
  const align = left ? "text-left" : "text-center";
  const { date, time } = dateTime(c);
  const gallery = c.photos.slice(1).filter(isAllowedImageUrl);
  const phoneDigits = c.contactPhone.replace(/[^\d+]/g, "");
  const story = t.layout === "story";
  const names = c.title.split(/\s*&\s*|\s+et\s+/i).filter(Boolean);
  const target = c.date ? `${c.date}T${c.time || "00:00"}:00` : "";

  return (
    <div className="space-y-8 px-5 py-8 sm:space-y-10 sm:px-6 sm:py-10" style={{ background: p.bg }}>
      <div className="text-center">
        {story && (
          <>
            <p className="mb-6 text-[10px] tracking-[0.22em] sm:tracking-[0.35em] uppercase" style={{ color: p.muted }}>
              Bienvenue à notre célébration
            </p>
            {names.length === 2 ? (
              <h2 className="text-[clamp(2rem,10vw,3rem)] leading-[1.1] break-words" style={{ fontFamily: t.fonts.display, color: p.fg, fontWeight: 500 }}>
                {names[0]}
                <span className="my-2 block text-3xl italic" style={{ color: p.accent }}>
                  &amp;
                </span>
                {names[1]}
              </h2>
            ) : (
              <h2 className="text-[clamp(1.75rem,8.5vw,2.25rem)] leading-tight break-words" style={{ fontFamily: t.fonts.display, color: p.fg, fontWeight: 500 }}>
                {c.title}
              </h2>
            )}
            {c.subtitle && (
              <p className="mt-4 text-sm" style={{ color: p.muted }}>
                {c.subtitle}
              </p>
            )}
          </>
        )}
        <p className={`${story ? "mt-12" : ""} text-2xl italic`} style={{ fontFamily: t.fonts.display, color: p.fg }}>
          Cher(e) {guestName ? guestName : "invité(e)"}
        </p>
      </div>

      {c.message && (
        <p className={`${align} mx-auto max-w-md text-base leading-relaxed italic`} style={{ color: p.fg, fontFamily: t.fonts.display }}>
          « {c.message} »
        </p>
      )}

      {(date || time || c.dressCode) && (
        <div className="space-y-4 rounded-lg p-4 text-sm sm:p-6" style={{ background: p.surface, color: p.fg }}>
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
          {c.dressCode && (
            <div className="flex items-start gap-3">
              <Shirt className="mt-0.5 size-4 shrink-0" style={{ color: p.accent }} />
              <span>Tenue : {c.dressCode}</span>
            </div>
          )}
        </div>
      )}

      {target && (
        <Countdown target={target} label="Rendez-vous dans" background={p.accent} color={p.bg} fontFamily={t.fonts.display} />
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

function Location({ c, t }: { c: InvitationContent; t: Template }) {
  const p = t.palette;
  const mapOk = c.mapUrl && isAllowedMapUrl(c.mapUrl);
  if (!c.venueName && !c.address && !mapOk) return null;
  const mapQuery = [c.venueName, c.address].filter(Boolean).join(", ");
  const embed = c.showMap && mapQuery ? `https://maps.google.com/maps?q=${encodeURIComponent(mapQuery)}&z=15&output=embed` : "";
  return (
    <section className="px-5 py-8 text-center sm:px-6 sm:py-10" style={{ background: p.bg }}>
      <h2 className="mb-5 text-2xl italic" style={{ fontFamily: t.fonts.display, color: p.fg }}>
        Localisation du lieu
      </h2>
      <div className="rounded-2xl p-4 sm:p-6" style={{ background: p.surface }}>
        <MapPin className="mx-auto mb-3 size-5" style={{ color: p.accent }} />
        {c.venueName && (
          <p className="font-medium" style={{ color: p.fg }}>
            {c.venueName}
          </p>
        )}
        {c.address && (
          <p className="mt-1 text-sm" style={{ color: p.muted }}>
            {c.address}
          </p>
        )}
        {embed && <MapEmbed src={embed} accent={p.accent} fg={p.fg} bg={p.bg} />}
        {(mapOk || embed) && (
          <a
            href={mapOk ? c.mapUrl : `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(mapQuery)}`}
            target="_blank"
            rel="noopener noreferrer nofollow"
            className="mt-5 inline-flex items-center gap-2 rounded-full px-4 py-2 text-sm font-medium"
            style={{ background: p.accent, color: p.bg }}
          >
            <Navigation className="size-4" /> Ouvrir l&apos;itinéraire
          </a>
        )}
      </div>
    </section>
  );
}

function Closing({ t }: { t: Template }) {
  const p = t.palette;
  return (
    <section className="px-5 pt-4 pb-10 text-center sm:px-8 sm:pb-12" style={{ background: p.bg }}>
      <span className="mx-auto mb-5 block size-1.5 rotate-45" style={{ background: p.accent }} aria-hidden />
      <p className="text-xl italic" style={{ fontFamily: t.fonts.display, color: p.fg }}>
        Nous avons hâte de vivre ce moment avec vous.
      </p>
    </section>
  );
}

export function InvitationView({ content, template, brand = true, guestName, embedded = false, children }: ViewProps) {
  const p = template.palette;
  return (
    <div className="w-full min-w-0 overflow-hidden break-words" style={{ background: p.bg, color: p.fg, fontFamily: template.fonts.body }}>
      <Cover c={content} t={template} compact={embedded} />
      <Body c={content} t={template} guestName={guestName} />
      {children}
      <Location c={content} t={template} />
      <Closing t={template} />
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
  return <Cover c={content} t={template} compact />;
}
