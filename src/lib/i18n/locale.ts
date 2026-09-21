export const DEFAULT_LOCALE = "mk" as const;
export const SUPPORTED_LOCALES = ["mk"] as const;

export type Locale = (typeof SUPPORTED_LOCALES)[number];

export function isSupportedLocale(value: string): value is Locale {
  return (SUPPORTED_LOCALES as readonly string[]).includes(value);
}
