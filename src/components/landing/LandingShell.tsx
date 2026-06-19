import { useCallback, useEffect, useState, type ReactNode } from 'react';
import { Link } from 'react-router-dom';
import { AnimatePresence, motion } from 'motion/react';
import {
  ArrowUp, Home, LayoutDashboard, LogIn, Menu, X,
  Sparkles, Map, Box, CreditCard, HelpCircle, Zap,
} from 'lucide-react';
import { LogoLink } from '../Logo';
import { LanguageSwitcher } from '../LanguageSwitcher';
import { LandingFx } from './LandingFx';
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
  const [isDesktop, setIsDesktop] = useState(() =>
    typeof window !== 'undefined' ? window.matchMedia('(min-width: 1024px)').matches : false,
  );
  const activeId = useScrollSpy([...SECTION_IDS], 140);
  const progress = useScrollProgress();

  const navItems = [
    { id: 'hero', label: t('landing.navHome'), icon: Home },
    { id: 'vizara-ar', label: 'VizaraAR', icon: Box },
    { id: 'vizara-tour', label: 'VizaraTour', icon: Map },
    { id: 'pricing', label: t('nav.pricing'), icon: CreditCard },
    { id: 'faq', label: t('nav.faq'), icon: HelpCircle },
  ];

  const scrollTo = useCallback((id: string) => {
    setSidebarOpen(false);
    onNavigate?.();
    const el = document.getElementById(id);
    if (!el) return;
    const top = el.getBoundingClientRect().top + window.scrollY - 72;
    window.scrollTo({ top: Math.max(0, top), behavior: 'smooth' });
    window.history.replaceState(null, '', id === 'hero' ? '/' : `/#${id}`);
  }, [onNavigate]);

  useEffect(() => {
    const mq = window.matchMedia('(min-width: 1024px)');
    const onChange = () => setIsDesktop(mq.matches);
    onChange();
    mq.addEventListener('change', onChange);
    return () => mq.removeEventListener('change', onChange);
  }, []);

  useEffect(() => {
    const hash = window.location.hash.replace('#', '');
    if (hash && SECTION_IDS.includes(hash as typeof SECTION_IDS[number])) {
      const timer = window.setTimeout(() => scrollTo(hash), 280);
      return () => window.clearTimeout(timer);
    }
  }, [scrollTo]);

  useEffect(() => {
    const onScroll = () => setShowTop(window.scrollY > 480);
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  useEffect(() => {
    document.body.style.overflow = sidebarOpen && !isDesktop ? 'hidden' : '';
    return () => { document.body.style.overflow = ''; };
  }, [sidebarOpen, isDesktop]);

  const activeIndex = navItems.findIndex((n) => n.id === activeId);
  const sidebarVisible = isDesktop || sidebarOpen;

  return (
    <div className="landing-shell min-h-app">
      <LandingFx />

      <div className="landing-ambient" aria-hidden="true">
        <div className="landing-orb landing-orb-1" />
        <div className="landing-orb landing-orb-2" />
        <div className="landing-orb landing-orb-3" />
      </div>

      <div className="landing-progress-track" aria-hidden="true">
        <div className="landing-progress-bar" style={{ width: `${progress}%` }}>
          <div className="landing-progress-glow" />
        </div>
      </div>

      <AnimatePresence>
        {sidebarOpen && !isDesktop && (
          <motion.button
            type="button"
            className="landing-sidebar-backdrop"
            aria-label={t('common.close')}
            onClick={() => setSidebarOpen(false)}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          />
        )}
      </AnimatePresence>

      <motion.aside
        className="landing-sidebar glass-sidebar-fx"
        aria-label={t('landing.navSections')}
        aria-hidden={!sidebarVisible}
        initial={false}
        animate={{ x: isDesktop || sidebarOpen ? 0 : '-108%' }}
        transition={{ type: 'spring', stiffness: 320, damping: 32 }}
      >
        <div className="landing-sidebar-inner">
          <div className="landing-sidebar-rail" aria-hidden>
            <motion.div
              className="landing-sidebar-rail-fill"
              animate={{ height: `${((activeIndex + 1) / navItems.length) * 100}%` }}
              transition={{ type: 'spring', stiffness: 280, damping: 28 }}
            />
          </div>

          <div className="landing-sidebar-head">
            <LogoLink size="sm" />
            <button
              type="button"
              className="icon-btn lg:hidden landing-sidebar-close"
              onClick={() => setSidebarOpen(false)}
              aria-label={t('common.close')}
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          <div className="landing-sidebar-badge">
            <Zap className="w-3.5 h-3.5" />
            <span>WebAR · 360° · QR</span>
          </div>

          <p className="landing-sidebar-label">{t('landing.navSections')}</p>
          <nav className="landing-sidebar-nav">
            {navItems.map(({ id, label, icon: Icon }, i) => (
              <motion.button
                key={id}
                type="button"
                onClick={() => scrollTo(id)}
                className={`landing-sidebar-link ${activeId === id ? 'landing-sidebar-link--active' : ''}`}
                initial={{ opacity: 0, x: -16 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: i * 0.05, duration: 0.35 }}
                whileHover={{ x: 4 }}
                whileTap={{ scale: 0.98 }}
              >
                <span className="landing-sidebar-link-icon"><Icon className="w-4 h-4" /></span>
                <span className="truncate">{label}</span>
                {activeId === id && <span className="landing-sidebar-link-dot" aria-hidden />}
              </motion.button>
            ))}
          </nav>

          <div className="landing-sidebar-cta">
            <p className="landing-sidebar-label">{t('landing.footerAccount')}</p>
            {user ? (
              <Link to="/dashboard" className="btn btn-primary w-full text-sm landing-sidebar-btn" onClick={() => setSidebarOpen(false)}>
                <LayoutDashboard className="w-4 h-4" />
                {t('nav.dashboard')}
              </Link>
            ) : (
              <>
                <Link to="/login" className="btn btn-secondary w-full text-sm landing-sidebar-btn" onClick={() => setSidebarOpen(false)}>
                  <LogIn className="w-4 h-4" />
                  {t('nav.login')}
                </Link>
                <Link to="/register" className="btn btn-primary w-full text-sm landing-sidebar-btn landing-sidebar-btn-glow" onClick={() => setSidebarOpen(false)}>
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
      </motion.aside>

      <div className="landing-main">
        <header className="landing-topbar glass-header-fx sticky top-0 z-40 safe-top">
          <div className="landing-topbar-glow" aria-hidden />
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
              <span className="landing-topbar-pip" />
              {navItems.find((n) => n.id === activeId)?.label}
            </p>

            <div className="landing-topbar-actions">
              <LanguageSwitcher compact className="hidden md:flex" />
              {user ? (
                <Link to="/dashboard" className="btn btn-primary text-sm hidden sm:inline-flex landing-topbar-cta">
                  {t('nav.dashboard')}
                </Link>
              ) : (
                <>
                  <Link to="/login" className="btn btn-ghost text-sm hidden sm:inline-flex">{t('nav.login')}</Link>
                  <Link to="/register" className="btn btn-primary text-sm hidden sm:inline-flex landing-topbar-cta">{t('nav.start')}</Link>
                </>
              )}
            </div>
          </div>
        </header>

        {children}
      </div>

      <AnimatePresence>
        {showTop && (
          <motion.button
            type="button"
            className="landing-back-top"
            onClick={() => scrollTo('hero')}
            aria-label={t('landing.backToTop')}
            initial={{ opacity: 0, y: 20, scale: 0.85 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.85 }}
            whileHover={{ scale: 1.08 }}
            whileTap={{ scale: 0.95 }}
          >
            <ArrowUp className="w-5 h-5" />
          </motion.button>
        )}
      </AnimatePresence>
    </div>
  );
}
