import { Baby, Cake, Church, Gem, GraduationCap, Heart, Presentation, Sparkles, Users, type LucideProps } from "lucide-react";

import type { Category } from "@/lib/catalog";

const ICONS = {
  heart: Heart,
  gem: Gem,
  cake: Cake,
  baby: Baby,
  church: Church,
  graduation: GraduationCap,
  presentation: Presentation,
  users: Users,
  sparkles: Sparkles,
} as const;

export function CategoryIcon({ name, ...props }: { name: Category["icon"] } & LucideProps) {
  const Icon = ICONS[name] ?? Sparkles;
  return <Icon {...props} />;
}
