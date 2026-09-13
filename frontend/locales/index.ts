import { en } from "./en";
import { hi } from "./hi";
import { bn } from "./bn";

export type LanguageCode = "en" | "hi" | "bn";

export interface LanguageMeta {
  code: LanguageCode;
  label: string;
  nativeName: string;
}

export const SUPPORTED_LANGUAGES: LanguageMeta[] = [
  { code: "en", label: "English", nativeName: "English" },
  { code: "hi", label: "हिन्दी", nativeName: "हिन्दी" },
  { code: "bn", label: "বাংলা", nativeName: "বাংলা" },
];

export const translations = {
  en,
  hi,
  bn,
} as const;

export { en, hi, bn };
