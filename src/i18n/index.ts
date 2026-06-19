import type { Locale, TranslationSchema } from './types';
import { uz } from './translations/uz';
import { uzCyrl } from './translations/uz-Cyrl';
import { ru } from './translations/ru';
import { en } from './translations/en';

export type { Locale, TranslationSchema };

export const LOCALES: Locale[] = ['uz', 'uz-Cyrl', 'ru', 'en'];

export const DEFAULT_LOCALE: Locale = 'uz';

export const translations: Record<Locale, TranslationSchema> = {
  uz,
  'uz-Cyrl': uzCyrl,
  ru,
  en,
};

export const LOCALE_STORAGE_KEY = 'vizara_locale';

export function isValidLocale(value: string): value is Locale {
  return LOCALES.includes(value as Locale);
}

export function getNestedValue(obj: unknown, path: string): string | undefined {
  const result = path.split('.').reduce<unknown>((current, key) => {
    if (current && typeof current === 'object' && key in (current as object)) {
      return (current as Record<string, unknown>)[key];
    }
    return undefined;
  }, obj);
  return typeof result === 'string' ? result : undefined;
}

export function interpolate(
  template: string,
  params?: Record<string, string | number>
): string {
  if (!params) return template;
  return template.replace(/\{\{(\w+)\}\}/g, (_, key: string) =>
    params[key] !== undefined ? String(params[key]) : `{{${key}}}`
  );
}

export function toDateLocale(locale: Locale): string {
  if (locale === 'ru') return 'ru-RU';
  if (locale === 'en') return 'en-US';
  return 'uz-UZ';
}
