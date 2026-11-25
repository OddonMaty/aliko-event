// Photos d'exemple (Unsplash, licence Unsplash : usage commercial libre, sans obligation de citation).
// Dans le contenu stocké, une photo d'exemple reste le jeton « /samples/<thème>.svg » :
// on le remplace par la photo Unsplash à l'affichage, et on retombe sur l'illustration locale en cas d'échec.
const UNSPLASH = "https://images.unsplash.com/photo-";

const SAMPLE_PHOTOS: Record<string, string> = {
  mariage: "1759271493839-be0cf1d86537",
  dot: "1661332517932-2d441bfb2994",
  anniversaire: "1619428257129-a37f903d0f56",
  "baby-shower": "1751860186520-96f61a6cc975",
  bapteme: "1731743214989-9b4d60937ddf",
  diplome: "1761781342506-821be95168c5",
  conference: "1760420940953-3958ad9f6287",
  reunion: "1758518730083-4c12527b6742",
  autre: "1768244016479-756ee49fe26c",
};

export const SAMPLE_THEMES = Object.keys(SAMPLE_PHOTOS);

/** Photo Unsplash par défaut d'un thème (ou undefined si le thème est inconnu). */
export function unsplashUrl(theme: string, width = 1200): string | undefined {
  const photo = SAMPLE_PHOTOS[theme];
  return photo ? `${UNSPLASH}${photo}?auto=format&fit=crop&w=${width}&q=70` : undefined;
}

const TOKEN = /^\/samples\/([a-z-]+)\.svg$/;

export function isSampleToken(src: string): boolean {
  return TOKEN.test(src);
}

/**
 * Adresse d'affichage d'une photo d'exemple : une route du site qui redirige vers la photo choisie
 * par l'administrateur, ou vers la photo Unsplash par défaut. Fonctionne côté serveur comme côté navigateur.
 */
export function sampleUrl(src: string, width = 1200): string {
  const id = TOKEN.exec(src)?.[1];
  return id && SAMPLE_PHOTOS[id] ? `/api/sample/${id}?w=${width}` : src;
}
