import { SamplePhotoCard } from "@/components/admin-sample-photo";
import { CATEGORIES } from "@/lib/catalog";
import { SAMPLE_THEMES, unsplashUrl } from "@/lib/samples";
import { getSettings } from "@/lib/settings";
import { PageTitle } from "../ui";

export default async function SamplePhotosPage() {
  const s = await getSettings();
  const label = (id: string) => CATEGORIES.find((c) => c.id === id)?.label ?? id;
  return (
    <>
      <PageTitle
        title="Photos d'exemple"
        hint="Les photos montrées dans la page Modèles et dans les nouvelles invitations. Remplacez-les petit à petit par de vraies photos d'événements (JPEG, PNG ou WebP, 4 Mo maximum)."
      />
      <p className="text-muted-foreground mb-4 rounded-lg border border-dashed p-3 text-xs">
        N&apos;utilisez que des photos dont vous avez les droits (les vôtres, ou prises avec l&apos;accord écrit des personnes visibles). Le changement s&apos;affiche en une minute environ.
      </p>
      <ul className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
        {SAMPLE_THEMES.map((t) => (
          <SamplePhotoCard key={t} theme={t} label={label(t)} src={s.samples[t] ?? unsplashUrl(t, 600)!} custom={!!s.samples[t]} />
        ))}
      </ul>
    </>
  );
}
