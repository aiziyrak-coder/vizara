import {
  translations,
  LOCALE_STORAGE_KEY,
  isValidLocale,
  DEFAULT_LOCALE,
} from '../i18n';
import { Logo } from './Logo';

function getDefaultLabel(): string {
  try {
    const stored = localStorage.getItem(LOCALE_STORAGE_KEY);
    const locale = stored && isValidLocale(stored) ? stored : DEFAULT_LOCALE;
    return translations[locale].ar.cameraLoading;
  } catch {
    return translations[DEFAULT_LOCALE].ar.cameraLoading;
  }
}

interface PreloaderProps {
  label?: string;
}

export function Preloader({ label }: PreloaderProps) {
  return (
    <div className="absolute inset-0 z-50 flex flex-col items-center justify-center bg-black/40 backdrop-blur-sm">
      <Logo size="lg" showText animated variant="light" stacked />
      <p className="mt-5 text-sm text-white/90 font-medium">{label ?? getDefaultLabel()}</p>
    </div>
  );
}
