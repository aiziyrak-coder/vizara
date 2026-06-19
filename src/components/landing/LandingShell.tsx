import { useCallback, useEffect, useState, type ReactNode } from 'react';
import { Link } from 'react-router-dom';
import { AnimatePresence, motion } from 'motion/react';
import { ArrowUp, LayoutDashboard, LogIn, Menu, X, Sparkles } from 'lucide-react';
import { LogoLink } from '../Logo';
import { LanguageSwitcher } from '../LanguageSwitcher';
import { LandingLightBg } from './LandingLightBg';
import { useScrollSpy, useScrollProgress } from '../../hooks/useScrollSpy';
import { useI18n } from '../../lib/i18n-context';

const SECTION_IDS = ['hero', 'vizara-ar', 'vizara-tour', 'pricing', 'faq'] as const;

interface LandingShellProps {
  children: ReactNode;
  user: { email: string } | null;
}

export function LandingShell({ children, user }: LandingShellProps) {
  const { t } = useI18n();
  const [menuOpen, setMenuOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const [showTop, setShowTop] = useState(false);
  const activeId = useScrollSpy([...SECTION_IDS], 100);
  const progress = useScrollProgress();

  const navItems = [
    { id: 'hero', label: t('landing.navHome') },
    { id: 'vizara-ar', label: 'VizaraAR' },
    { id: 'vizara-tour', label: 'VizaraTour' },
    { id: 'pricing', label: t('nav.pricing') },
    { id: 'faq', label: t('nav.faq') },
  ];

  const scrollTo = useCallback((id: string) => {
    setMenuOpen(false);
    const el = document.getElementById(id);
    if (!el) return;
    const top = el.getBoundingClientRect().top + window.scrollY - 80;
    window.scrollTo({ top: Math.max(0, top), behavior: 'smooth' });
    window.history.replaceState(null, '', id === 'hero' ? '/' : `/#${id}`);
  }, []);

  useEffect(() => {
    const hash = window.location.hash.replace('#', '');
    if (hash && SECTION_IDS.includes(hash as typeof SECTION_IDS[number])) {
      const timer = window.setTimeout(() => scrollTo(hash), 300);
      return () => window.clearTimeout(timer);
    }
  }, [scrollTo]);

  useEffect(() => {
    const onScroll = () => {
      setScrolled(window.scrollY > 12);
      setShowTop(window.scrollY > 500);
    };
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  useEffect(() => {
    document.body.style.overflow = menuOpen ? 'hidden' : '';
    return () => { document.body.style.overflow = ''; };
  }, [menuOpen]);

  return (
    <div className="landing-page min-h-app">
      <LandingLightBg />

      <div className="landing-progress" aria-hidden>
        <div className="landing-progress-fill" style={{ width: `${progress}%` }} />
      </div>

      <header className={`landing-nav safe-top ${scrolled ? 'landing-nav--scrolled' : ''}`}>
        <div className="landing-nav-inner container">
          <div className="landing-nav-brand">
            <LogoLink size="sm" />
          </div>

          <nav className="landing-nav-links" aria-label={t('landing.navSections')}>
            {navItems.map(({ id, label }) => (
              <button
                key={id}
                type="button"
                onClick={() => scrollTo(id)}
                className={`landing-nav-link ${activeId === id ? 'landing-nav-link--active' : ''}`}
              >
                {label}
              </button>
            ))}
          </nav>

          <div className="landing-nav-actions">
            <LanguageSwitcher iconOnly className="landing-nav-lang hidden lg:block" />
            {user ? (
              <>
                <Link to="/dashboard" className="btn btn-primary landing-nav-cta landing-nav-cta--icon hidden lg:inline-flex xl:hidden" title={t('nav.dashboard')}>
                  <LayoutDashboard className="w-4 h-4" />
                </Link>
                <Link to="/dashboard" className="btn btn-primary landing-nav-cta hidden xl:inline-flex">
                  <LayoutDashboard className="w-4 h-4" />
                  <span>{t('nav.dashboard')}</span>
                </Link>
              </>
            ) : (
              <>
                <Link to="/login" className="landing-nav-ghost hidden xl:inline-flex">{t('nav.login')}</Link>
                <Link to="/register" className="btn btn-primary landing-nav-cta hidden lg:inline-flex">
                  {t('nav.start')}
                </Link>
              </>
            )}
            <button
              type="button"
              className="landing-nav-menu lg:hidden"
              onClick={() => setMenuOpen(true)}
              aria-label={t('common.menu')}
              aria-expanded={menuOpen}
            >
              <Menu className="w-5 h-5" />
            </button>
          </div>
        </div>
      </header>

      <AnimatePresence>
        {menuOpen && (
          <>
            <motion.button
              type="button"
              className="landing-mobile-backdrop"
              aria-label={t('common.close')}
              onClick={() => setMenuOpen(false)}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
            />
            <motion.div
              className="landing-mobile-menu safe-top"
              initial={{ opacity: 0, y: -16 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -16 }}
              transition={{ type: 'spring', stiffness: 380, damping: 32 }}
            >
              <div className="landing-mobile-menu-head">
                <LogoLink size="sm" />
                <button type="button" className="icon-btn" onClick={() => setMenuOpen(false)} aria-label={t('common.close')}>
                  <X className="w-5 h-5" />
                </button>
              </div>
              <nav className="landing-mobile-nav">
                {navItems.map(({ id, label }) => (
                  <button
                    key={id}
                    type="button"
                    onClick={() => scrollTo(id)}
                    className={`landing-mobile-link ${activeId === id ? 'landing-mobile-link--active' : ''}`}
                  >
                    {label}
                  </button>
                ))}
              </nav>
              <div className="landing-mobile-cta">
                <LanguageSwitcher />
                {user ? (
                  <Link to="/dashboard" className="btn btn-primary w-full" onClick={() => setMenuOpen(false)}>
                    {t('nav.dashboard')}
                  </Link>
                ) : (
                  <>
                    <Link to="/login" className="btn btn-secondary w-full" onClick={() => setMenuOpen(false)}>
                      <LogIn className="w-4 h-4" /> {t('nav.login')}
                    </Link>
                    <Link to="/register" className="btn btn-primary w-full" onClick={() => setMenuOpen(false)}>
                      <Sparkles className="w-4 h-4" /> {t('nav.start')}
                    </Link>
                  </>
                )}
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      <main className="landing-content">{children}</main>

      <AnimatePresence>
        {showTop && (
          <motion.button
            type="button"
            className="landing-back-top"
            onClick={() => scrollTo('hero')}
            aria-label={t('landing.backToTop')}
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.9 }}
            whileHover={{ scale: 1.06 }}
            whileTap={{ scale: 0.95 }}
          >
            <ArrowUp className="w-5 h-5" />
          </motion.button>
        )}
      </AnimatePresence>
    </div>
  );
}
