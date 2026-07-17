import {
  Atom,
  Barbell,
  BookOpen,
  Books,
  Calculator,
  Compass,
  Dna,
  FlaskConical,
  Globe2,
  Languages,
  MathOps,
  Palette,
  PenTool,
  Shapes,
  type LucideIcon,
} from "@/components/icons";

/** Maps the `icon` name stored on a subject document to a Phosphor icon. */
const SUBJECT_ICON_MAP: Record<string, LucideIcon> = {
  BookOpen,
  MathOps,
  Calculator,
  Globe2,
  Atom,
  FlaskConical,
  Dna,
  PenTool,
  Barbell,
  Palette,
  Languages,
  Compass,
  Books,
};

export function getSubjectIcon(name: string): LucideIcon {
  return SUBJECT_ICON_MAP[name] ?? Shapes;
}
