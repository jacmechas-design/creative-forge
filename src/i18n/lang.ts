export type Lang = "en" | "fr" | "es";
export type Tri = Record<Lang, string>;

export const LANGS: { id: Lang; label: string; short: string; flag: string }[] = [
  { id: "en", label: "English", short: "EN", flag: "🇨🇦" },
  { id: "fr", label: "Français (CA)", short: "FR", flag: "⚜️" },
  { id: "es", label: "Español", short: "ES", flag: "🌎" },
];
