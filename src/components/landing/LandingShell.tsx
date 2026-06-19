import { useEffect, useState, type ReactNode } from 'react';
import { Link } from 'react-router-dom';
import {
  ArrowUp, Home, LayoutDashboard, LogIn, Menu, X,
  Sparkles, Map, Box, CreditCard, HelpCircle,
} from 'lucide-react';
import { PageShell } from '../FuturisticBg';
import { LogoLink } from '../Logo';
import { LanguageSwitcher } from '../LanguageSwitcher';
import { useScrollSpy, useScrollProgress } from '../../hooks/useScrollSpy';
import { useI18n } from '../../lib/i18n-context';

const SECTION_IDS = ['hero', 'vizara-ar', 'vizara-tour', 'pricing', 'faq'] as const;

interface LandingShellProps {
  children: ReactNode;
  user: { email: string } | null;
  onNavigate?: () => void;
}

export function LandingShell({ children, user, onNavigate }: LandingShellProps) {
  const { t } = useI18n();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [showTop, setShowTop] = useState(false);
  const activeId = useScrollSpy([...SECTION_IDS]);
  const progress = useScrollProgress();

  const navItems = [
    { id: 'hero', label: t('landing.navHome'), icon: Home },
    { id: 'vizara-ar', label: 'VizaraAR', icon: Box },
    { id: 'vizara-tour', label: 'VizaraTour', icon: Map },
    { id: 'pricing', label: t('nav.pricing'), icon: CreditCard },
    { id: 'faq', label: t('nav.faq'), icon: HelpCircle },
  ];

  const scrollTo = (id: string) => {
    setSidebarOpen(false);
    onNavigate?.();
    const el = document.getElementById(id);
    if (el) {
      el.scrollIntoView({ behavior: 'smooth', block: 'start' });
      window.history.replaceState(null, '', id === 'hero' ? '/' : `/#${id}`);
    }
  };

  useEffect(() => {
    const hash = window.location.hash.replace('#', '');
    if (hash && SECTION_IDS.includes(hash as typeof SECTION_IDS[number])) {
      window.setTimeout(() => scrollTo(hash), 120);
    }
  }, []);

  useEffect(() => {
    const onScroll = () => setShowTop(window.scrollY > 480);
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  useEffect(() => {
    document.body.style.overflow = sidebarOpen ? 'hidden' : '';
    return () => { document.body.style.overflow = ''; };
  }, [sidebarOpen]);

  const sidebar = (
    <div className="landing-sidebar-inner">
      <div className="landing-sidebar-head">
        <LogoLink size="sm" />
        <button
          type="button"
          className="icon-btn lg:hidden"
          onClick={() => setSidebarOpen(false)}
          aria-label={t('common.close')}
        >
          <X className="w-5 h-5" />
        </button>
      </div>

      <p className="landing-sidebar-label">{t('landing.navSections')}</p>
      <nav className="landing-sidebar-nav" aria-label={t('landing.navSections')}>
        {navItems.map(({ id, label, icon: Icon }) => (
          <button
            key={id}
            type="button"
            onClick={() => scrollTo(id)}
            className={`landing-sidebar-link ${activeId === id ? 'landing-sidebar-link--active' : ''}`}
          >
            <span className="landing-sidebar-link-icon"><Icon className="w-4 h-4" /></span>
            <span className="truncate">{label}</span>
            {activeId === id && <span className="landing-sidebar-link-dot" aria-hidden />}
          </button>
        ))}
      </nav>

      <div className="landing-sidebar-cta">
        <p className="landing-sidebar-label">{t('landing.footerAccount')}</p>
        {user ? (
          <Link to="/dashboard" className="btn btn-primary w-full text-sm" onClick={() => setSidebarOpen(false)}>
            <LayoutDashboard className="w-4 h-4" />
            {t('nav.dashboard')}
          </Link>
        ) : (
          <>
            <Link to="/login" className="btn btn-secondary w-full text-sm" onClick={() => setSidebarOpen(false)}>
              <LogIn className="w-4 h-4" />
              {t('nav.login')}
            </Link>
            <Link to="/register" className="btn btn-primary w-full text-sm" onClick={() => setSidebarOpen(false)}>
              <Sparkles className="w-4 h-4" />
              {t('nav.start')}
            </Link>
          </>
        )}
        <div className="pt-2">
          <LanguageSwitcher />
        </div>
      </div>
    </div>
  );

  return (
    <PageShell className="landing-shell min-h-app">
      <div className="landing-ambient" aria-hidden="true">
        <div className="landing-orb landing-orb-1" />
        <div className="landing-orb landing-orb-2" />
        <div className="landing-orb landing-orb-3" />
        <div className="landing-grid-glow" />
      </div>

      <div className="landing-progress-track" aria-hidden="true">
        <div className="landing-progress-bar" style={{ width: `${progress}%` }} />
      </div>

      <aside className={`landing-sidebar glass-sidebar ${sidebarOpen ? 'landing-sidebar--open' : ''}`}>
        {sidebar}
      </aside>

      {sidebarOpen && (
        <button
          type="button"
          className="landing-sidebar-backdrop"
          aria-label={t('common.close')}
          onClick={() => setSidebarOpen(false)}
        />
      )}

      <div className="landing-main">
        <header className="landing-topbar glass-header sticky top-0 z-40 safe-top">
          <div className="landing-topbar-inner">
            <button
              type="button"
              className="icon-btn landing-menu-btn"
              onClick={() => setSidebarOpen(true)}
              aria-label={t('common.menu')}
              aria-expanded={sidebarOpen}
            >
              <Menu className="w-5 h-5" />
            </button>

            <div className="landing-topbar-logo lg:hidden">
              <LogoLink size="sm" />
            </div>

            <p className="landing-topbar-section hidden sm:block truncate">
              {navItems.find((n) => n.id === activeId)?.label}
            </p>

            <div className="landing-topbar-actions">
              <LanguageSwitcher compact className="hidden md:flex" />
              {user ? (
                <Link to="/dashboard" className="btn btn-primary text-sm hidden sm:inline-flex">
                  {t('nav.dashboard')}
                </Link>
              ) : (
                <>
                  <Link to="/login" className="btn btn-ghost text-sm hidden sm:inline-flex">{t('nav.login')}</Link>
                  <Link to="/register" className="btn btn-primary text-sm hidden sm:inline-flex">{t('nav.start')}</Link>
                </>
              )}
            </div>
          </div>
        </header>

        {children}
      </div>

      {showTop && (
        <button
          type="button"
          className="landing-back-top"
          onClick={() => scrollTo('hero')}
          aria-label={t('landing.backToTop')}
        >
          <ArrowUp className="w-5 h-5" />
        </button>
      )}
    </PageShell>
  );
}
