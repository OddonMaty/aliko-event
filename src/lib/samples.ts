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

const TOKEN = /^\/samples\/([a-z-]+)\.svg$/;

export function isSampleToken(src: string): boolean {
  return TOKEN.test(src);
}

/** Photo Unsplash correspondant au thème, ou la source telle quelle si ce n'est pas une photo d'exemple. */
export function sampleUrl(src: string, width = 1200): string {
  const id = TOKEN.exec(src)?.[1];
  const photo = id ? SAMPLE_PHOTOS[id] : undefined;
  return photo ? `${UNSPLASH}${photo}?auto=format&fit=crop&w=${width}&q=70` : src;
}
