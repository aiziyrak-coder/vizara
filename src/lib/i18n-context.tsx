import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import {
  DEFAULT_LOCALE,
  LOCALE_STORAGE_KEY,
  LOCALES,
  getNestedValue,
  interpolate,
  isValidLocale,
  translations,
  type Locale,
  type TranslationSchema,
} from '../i18n';
import type { PlanId } from '../../shared/plans';
import { PLANS } from '../../shared/plans';

type Params = Record<string, string | number>;

interface I18nContextType {
  locale: Locale;
  setLocale: (locale: Locale) => void;
  t: (key: string, params?: Params) => string;
  dict: TranslationSchema;
  getPlanName: (planId: PlanId) => string;
  getPlanDescription: (planId: PlanId) => string;
  getPlanFeatures: (planId: PlanId) => string[];
  localeLabel: (locale: Locale) => string;
}

const I18nContext = createContext<I18nContextType | null>(null);

function readStoredLocale(): Locale {
  try {
    const stored = localStorage.getItem(LOCALE_STORAGE_KEY);
    if (stored && isValidLocale(stored)) return stored;
  } catch {
    /* ignore */
  }
  return DEFAULT_LOCALE;
}

function formatLimit(count: number, unlimited: string): string {
  return count === -1 ? unlimited : String(count);
}

export function I18nProvider({ children }: { children: React.ReactNode }) {
  const [locale, setLocaleState] = useState<Locale>(readStoredLocale);

  const dict = translations[locale];

  const setLocale = useCallback((next: Locale) => {
    setLocaleState(next);
    localStorage.setItem(LOCALE_STORAGE_KEY, next);
  }, []);

  useEffect(() => {
    document.documentElement.lang = locale === 'uz-Cyrl' ? 'uz' : locale;
  }, [locale]);

  const t = useCallback(
    (key: string, params?: Params) => {
      const raw = getNestedValue(dict, key) ?? getNestedValue(translations.uz, key) ?? key;
      return interpolate(raw, params);
    },
    [dict]
  );

  const getPlanName = useCallback(
    (planId: PlanId) => dict.plans[planId].name,
    [dict]
  );

  const getPlanDescription = useCallback(
    (planId: PlanId) => dict.plans[planId].description,
    [dict]
  );

  const getPlanFeatures = useCallback(
    (planId: PlanId) => {
      const plan = PLANS[planId];
      const f = dict.plans.features;
      const ul = f.unlimited;
      const items: string[] = [
        interpolate(f.models, { count: formatLimit(plan.maxModels, ul) }),
        interpolate(f.experiences, { count: formatLimit(plan.maxExperiences, ul) }),
        f.qr,
        plan.maxFileSizeMB === -1
          ? f.fileSizeUnlimited
          : interpolate(f.fileSize, { mb: plan.maxFileSizeMB }),
      ];
      if (plan.features.photoZone) items.push(f.photoZone);
      if (plan.features.modelAR) items.push(f.modelAR);
      if (plan.features.customBranding) items.push(f.branding);
      if (plan.features.customLogo) items.push(f.logo);
      if (plan.features.analytics) items.push(f.analytics);
      if (plan.features.whiteLabel) items.push(f.whiteLabel);
      if (plan.features.prioritySupport) items.push(f.prioritySupport);
      if (plan.features.apiAccess) items.push(f.apiAccess);
      return items;
    },
    [dict]
  );

  const localeLabel = useCallback(
    (loc: Locale) => dict.lang[loc],
    [dict]
  );

  const value = useMemo(
    () => ({
      locale,
      setLocale,
      t,
      dict,
      getPlanName,
      getPlanDescription,
      getPlanFeatures,
      localeLabel,
    }),
    [locale, setLocale, t, dict, getPlanName, getPlanDescription, getPlanFeatures, localeLabel]
  );

  return <I18nContext.Provider value={value}>{children}</I18nContext.Provider>;
}

export function useI18n() {
  const ctx = useContext(I18nContext);
  if (!ctx) throw new Error('useI18n must be used within I18nProvider');
  return ctx;
}

export { LOCALES, type Locale };
