import {
  translations,
  LOCALE_STORAGE_KEY,
  isValidLocale,
  DEFAULT_LOCALE,
} from '../i18n';

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
      <div className="w-10 h-10 border-2 border-white/30 border-t-white rounded-full animate-spin" />
      <p className="mt-4 text-sm text-white/90 font-medium">{label ?? getDefaultLabel()}</p>
    </div>
  );
}
