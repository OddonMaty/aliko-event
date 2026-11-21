import type { CategoryId } from "./catalog";

// Moteur de designs : chaque design = une mise en page + une palette + des polices.
// Ajouter un design = ajouter un objet ici (aucun fichier à télécharger, rien à copier).

export type LayoutId = "classic" | "frame" | "arch" | "minimal" | "split";

export interface Template {
  id: string;
  name: string;
  description: string;
  layout: LayoutId;
  categories: CategoryId[];
  palette: { bg: string; fg: string; accent: string; muted: string; surface: string };
  fonts: { display: string; body: string };
}

const PLAYFAIR = "var(--font-playfair), Georgia, serif";
const CORMORANT = "var(--font-cormorant), Georgia, serif";
const MONTSERRAT = "var(--font-montserrat), system-ui, sans-serif";
const INTER = "var(--font-inter), system-ui, sans-serif";

export const TEMPLATES: Template[] = [
  {
    id: "or-royal",
    name: "Or Royal",
    description: "Fond noir profond, or lumineux. Solennel et luxueux.",
    layout: "classic",
    categories: ["mariage", "dot", "anniversaire"],
    palette: { bg: "#0C0B09", fg: "#F3EBD7", accent: "#D4AF37", muted: "#A89B7C", surface: "#16140F" },
    fonts: { display: PLAYFAIR, body: INTER },
  },
  {
    id: "ivoire-dore",
    name: "Ivoire & Doré",
    description: "Cadre fin, ivoire chaud et filets dorés. Classique intemporel.",
    layout: "frame",
    categories: ["mariage", "dot", "bapteme"],
    palette: { bg: "#FAF6EC", fg: "#2B2418", accent: "#B08D2E", muted: "#7A6E58", surface: "#F1EAD7" },
    fonts: { display: CORMORANT, body: INTER },
  },
  {
    id: "rose-poudre",
    name: "Rose Poudré",
    description: "Arche douce et tons poudrés. Romantique et délicat.",
    layout: "arch",
    categories: ["mariage", "baby-shower", "anniversaire"],
    palette: { bg: "#FBEFEF", fg: "#3B2A2E", accent: "#B7777F", muted: "#8C6A70", surface: "#F5E0E1" },
    fonts: { display: CORMORANT, body: INTER },
  },
  {
    id: "emeraude",
    name: "Émeraude",
    description: "Vert profond et or pâle. Élégant, naturel, cérémonial.",
    layout: "classic",
    categories: ["mariage", "dot", "bapteme"],
    palette: { bg: "#0F2A22", fg: "#F1EBDA", accent: "#D9B96A", muted: "#A7B8AE", surface: "#163A2F" },
    fonts: { display: PLAYFAIR, body: INTER },
  },
  {
    id: "minimal-noir",
    name: "Minimal Noir",
    description: "Noir et blanc, typographie nette. Moderne et direct.",
    layout: "minimal",
    categories: ["conference", "reunion", "anniversaire", "autre"],
    palette: { bg: "#0A0A0A", fg: "#F5F5F5", accent: "#FFFFFF", muted: "#8A8A8A", surface: "#151515" },
    fonts: { display: MONTSERRAT, body: INTER },
  },
  {
    id: "bleu-nuit",
    name: "Bleu Nuit",
    description: "Bleu nuit et or. Sérieux et prestigieux.",
    layout: "split",
    categories: ["conference", "reunion", "diplome", "anniversaire"],
    palette: { bg: "#0E1630", fg: "#EAEFFA", accent: "#C9A84C", muted: "#9AA6C4", surface: "#16213F" },
    fonts: { display: PLAYFAIR, body: INTER },
  },
  {
    id: "fete-or",
    name: "Fête Dorée",
    description: "Violet profond et or. Pour les soirées qui comptent.",
    layout: "frame",
    categories: ["anniversaire", "autre", "baby-shower"],
    palette: { bg: "#1B1030", fg: "#FBF3FF", accent: "#F0C75E", muted: "#BCA9D6", surface: "#261746" },
    fonts: { display: PLAYFAIR, body: INTER },
  },
  {
    id: "ciel-doux",
    name: "Ciel Doux",
    description: "Bleu ciel et arche légère. Tendre et lumineux.",
    layout: "arch",
    categories: ["baby-shower", "bapteme", "anniversaire"],
    palette: { bg: "#EEF5FB", fg: "#23324A", accent: "#6C9BCF", muted: "#6B7F99", surface: "#E0ECF7" },
    fonts: { display: CORMORANT, body: INTER },
  },
  {
    id: "lumiere",
    name: "Lumière",
    description: "Blanc crème et or sobre. Parfait pour le religieux et les diplômes.",
    layout: "classic",
    categories: ["bapteme", "diplome", "mariage", "autre"],
    palette: { bg: "#FFFDF8", fg: "#2A2A2A", accent: "#C2A04A", muted: "#7E7767", surface: "#F6F1E3" },
    fonts: { display: CORMORANT, body: INTER },
  },
  {
    id: "campus",
    name: "Campus",
    description: "Ivoire, marine et or. Académique et affirmé.",
    layout: "split",
    categories: ["diplome", "conference", "reunion"],
    palette: { bg: "#F4F1EA", fg: "#14213D", accent: "#C9A227", muted: "#5A6478", surface: "#E9E4D6" },
    fonts: { display: MONTSERRAT, body: INTER },
  },
];

export function getTemplate(id: string): Template | undefined {
  return TEMPLATES.find((t) => t.id === id);
}

export function templatesForCategory(cat: CategoryId): Template[] {
  return TEMPLATES.filter((t) => t.categories.includes(cat));
}
