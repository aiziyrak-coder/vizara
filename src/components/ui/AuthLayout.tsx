import { Link } from 'react-router-dom';
import { ArrowLeft, Check } from 'lucide-react';
import type { ReactNode } from 'react';
import { PageShell } from '../FuturisticBg';
import { LogoLink } from '../Logo';
import { LanguageSwitcher } from '../LanguageSwitcher';
import { useI18n } from '../../lib/i18n-context';

interface AuthLayoutProps {
  children: ReactNode;
  title: string;
  subtitle: string;
}

export function AuthLayout({ children, title, subtitle }: AuthLayoutProps) {
  const { t } = useI18n();

  const perks = [
    t('auth.perk1'),
    t('auth.perk2'),
    t('auth.perk3'),
    t('auth.perk4'),
  ];

  return (
    <PageShell className="min-h-app">
      <div className="grid lg:grid-cols-2 min-h-app">
        <div className="hidden lg:flex flex-col justify-between auth-panel p-12 relative z-10">
          <LogoLink size="md" variant="light" animated />
          <div>
            <h2 className="text-3xl font-bold text-white leading-tight mb-4 tracking-tight">
              {t('auth.panelTitle')}
            </h2>
            <p className="text-white/75 text-lg leading-relaxed mb-8">
              {t('auth.panelDesc')}
            </p>
            <ul className="space-y-3">
              {perks.map((p) => (
                <li key={p} className="flex items-center gap-3 text-white/90 text-sm">
                  <span className="w-6 h-6 rounded-full glass-thick flex items-center justify-center shrink-0" style={{ background: 'rgba(255,255,255,0.15)' }}>
                    <Check className="w-3 h-3 text-white" />
                  </span>
                  {p}
                </li>
              ))}
            </ul>
          </div>
          <p className="text-white/40 text-xs">{t('auth.panelCopy')}</p>
        </div>

        <div className="flex flex-col safe-top safe-bottom relative z-10">
          <div className="p-4 lg:p-6 flex items-center justify-between gap-3">
            <Link to="/" className="inline-flex items-center gap-2 text-sm text-secondary hover:text-[var(--color-ink)] font-medium transition-colors">
              <ArrowLeft className="w-4 h-4" />
              {t('auth.backHome')}
            </Link>
            <LanguageSwitcher compact />
          </div>
          <div className="flex-1 flex items-center justify-center p-4 sm:p-6 pb-10">
            <div className="w-full max-w-[400px]">
              <div className="lg:hidden text-center mb-6">
                <LogoLink size="md" animated />
              </div>
              <div className="glass-liquid p-5 sm:p-8 rounded-[var(--radius-xl)]">
                <h1 className="text-xl font-bold mb-1 tracking-tight">{title}</h1>
                <p className="text-sm text-secondary mb-6">{subtitle}</p>
                {children}
              </div>
            </div>
          </div>
        </div>
      </div>
    </PageShell>
  );
}
