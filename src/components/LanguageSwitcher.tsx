import { Globe } from 'lucide-react';
import { useI18n, LOCALES, type Locale } from '../lib/i18n-context';

interface LanguageSwitcherProps {
  compact?: boolean;
  className?: string;
}

export function LanguageSwitcher({ compact = false, className = '' }: LanguageSwitcherProps) {
  const { locale, setLocale, localeLabel } = useI18n();

  return (
    <div className={`relative ${className}`}>
      <label className="sr-only">Language</label>
      <div className="flex items-center gap-1.5">
        {!compact && <Globe className="w-4 h-4 text-secondary shrink-0" aria-hidden="true" />}
        <select
          value={locale}
          onChange={(e) => setLocale(e.target.value as Locale)}
          className={`input !min-h-0 !py-2 text-sm ${compact ? '!py-1.5 !px-2.5 !text-xs' : ''}`}
          style={{ width: compact ? 'auto' : '100%', minWidth: compact ? '7.5rem' : undefined }}
          aria-label="Til"
        >
          {LOCALES.map((loc) => (
            <option key={loc} value={loc}>
              {localeLabel(loc)}
            </option>
          ))}
        </select>
      </div>
    </div>
  );
}
