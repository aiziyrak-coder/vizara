import { useState, useEffect } from 'react';
import { Link, Outlet, useLocation, Navigate } from 'react-router-dom';
import { useAuth } from '../lib/auth-context';
import { useI18n } from '../lib/i18n-context';
import { isProductActive } from '../lib/subscription';
import { LayoutDashboard, Box, QrCode, CreditCard, LogOut, Menu, X, Settings, Home, Map } from 'lucide-react';
import { AppBackground } from './FuturisticBg';
import { LogoLink } from './Logo';
import { LanguageSwitcher } from './LanguageSwitcher';
import { AiAssistant } from './ai/AiAssistant';

export function DashboardLayout() {
  const { user, currentOrg, organizations, setCurrentOrg, logout, isLoading } = useAuth();
  const { t } = useI18n();
  const location = useLocation();
  const [menuOpen, setMenuOpen] = useState(false);

  const nav = [
    { to: '/dashboard', labelKey: 'nav.control', shortLabelKey: 'nav.control', icon: LayoutDashboard, end: true },
    { to: '/dashboard/models', labelKey: 'nav.modelsFull', shortLabelKey: 'nav.models', icon: Box },
    { to: '/dashboard/experiences', labelKey: 'nav.experiences', shortLabelKey: 'nav.experiences', icon: QrCode },
    { to: '/dashboard/tours', labelKey: 'nav.tours', shortLabelKey: 'nav.tours', icon: Map },
    { to: '/dashboard/billing', labelKey: 'nav.billing', shortLabelKey: 'nav.billing', icon: CreditCard },
    { to: '/dashboard/settings', labelKey: 'nav.settings', shortLabelKey: 'nav.settings', icon: Settings },
  ];

  const pageTitleKeys: Record<string, string> = {
    '/dashboard': 'nav.control',
    '/dashboard/models': 'nav.modelsFull',
    '/dashboard/experiences': 'nav.experiences',
    '/dashboard/tours': 'nav.tours',
    '/dashboard/billing': 'nav.billing',
    '/dashboard/settings': 'nav.settings',
  };

  const isActive = (to: string, end?: boolean) =>
    end ? location.pathname === to : location.pathname.startsWith(to);

  useEffect(() => {
    setMenuOpen(false);
  }, [location.pathname]);

  if (isLoading) {
    return (
      <div className="min-h-app flex items-center justify-center">
        <AppBackground />
        <div className="glass-spinner relative z-10" />
      </div>
    );
  }

  if (!user) return <Navigate to="/login" replace />;

  const arActive = isProductActive(currentOrg, 'vizara_ar');
  const tourActive = isProductActive(currentOrg, 'vizara_tour');
  const subActive = arActive || tourActive;
  const pageTitle = location.pathname.startsWith('/dashboard/tours/')
    ? t('tours.edit')
    : t(pageTitleKeys[location.pathname] || 'nav.control');

  return (
    <div className="min-h-app flex flex-col lg:flex-row overflow-x-hidden">
      <AppBackground />

      <aside className="glass-sidebar relative z-10 hidden lg:flex w-[268px] shrink-0 flex-col">
        <div className="p-5 flex items-center justify-between">
          <LogoLink size="sm" />
          <Link to="/" className="icon-btn" title={t('common.home')}>
            <Home className="w-4 h-4" />
          </Link>
        </div>

        {organizations.length > 1 && (
          <div className="px-4 pb-4">
            <label className="label text-xs">{t('layout.org')}</label>
            <select
              value={currentOrg?.id || ''}
              onChange={(e) => {
                const org = organizations.find((o) => o.id === e.target.value);
                if (org) setCurrentOrg(org);
              }}
              className="input text-sm py-2"
            >
              {organizations.map((o) => (
                <option key={o.id} value={o.id}>{o.name}</option>
              ))}
            </select>
          </div>
        )}

        <nav className="flex-1 px-3 space-y-0.5">
          {nav.map(({ to, labelKey, icon: Icon, end }) => (
            <Link key={to} to={to} className={`nav-item ${isActive(to, end) ? 'nav-item-active' : ''}`}>
              <Icon className="w-[18px] h-[18px]" strokeWidth={isActive(to, end) ? 2.25 : 1.75} />
              {t(labelKey)}
            </Link>
          ))}
        </nav>

        <div className="p-4" style={{ borderTop: '0.5px solid rgba(0,0,0,0.06)' }}>
          <div className="mb-3">
            <LanguageSwitcher />
          </div>
          <div className="mb-3 px-1">
            <span className={`status-badge ${subActive ? 'status-badge-active' : 'status-badge-inactive'}`}>
              <span className={`w-1.5 h-1.5 rounded-full ${arActive ? 'bg-[#34c759]' : 'bg-[#ff3b30]'}`} />
              AR
            </span>
            <span className={`status-badge ml-1 ${subActive ? 'status-badge-active' : 'status-badge-inactive'}`}>
              <span className={`w-1.5 h-1.5 rounded-full ${tourActive ? 'bg-[#34c759]' : 'bg-[#ff3b30]'}`} />
              Tour
            </span>
          </div>
          <p className="text-xs text-secondary truncate mb-2 px-1">{user.email}</p>
          <button type="button" onClick={logout} className="nav-item w-full text-left text-secondary hover:text-[#ff3b30] hover:bg-[rgba(255,59,48,0.08)]">
            <LogOut className="w-[18px] h-[18px]" />
            {t('common.logout')}
          </button>
        </div>
      </aside>

      <main className="relative z-10 flex-1 flex flex-col min-w-0 overflow-x-hidden">
        <header className="glass-header sticky top-0 z-30 safe-top lg:hidden">
          <div className="flex items-center gap-2 px-3 sm:px-4 py-2.5 min-w-0">
            <Link to="/" className="icon-btn shrink-0" title={t('common.home')} aria-label={t('common.home')}>
              <Home className="w-5 h-5" />
            </Link>
            <div className="shrink-0">
              <LogoLink size="sm" />
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-sm font-semibold leading-tight truncate">{pageTitle}</p>
              <p className="text-[11px] text-secondary truncate">{currentOrg?.name}</p>
            </div>
            <span className={`status-badge shrink-0 text-[10px] px-2 py-1 ${subActive ? 'status-badge-active' : 'status-badge-inactive'}`}>
              {subActive ? t('layout.activeShort') : t('layout.noneShort')}
            </span>
            <button
              type="button"
              onClick={() => setMenuOpen(!menuOpen)}
              className="icon-btn shrink-0 !min-w-[40px] !min-h-[40px]"
              aria-label={t('common.menu')}
              aria-expanded={menuOpen}
            >
              {menuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>
          </div>

          {menuOpen && (
            <div className="glass-thick px-4 py-4 space-y-1 max-h-[70vh] overflow-y-auto" style={{ borderTop: '0.5px solid rgba(0,0,0,0.06)' }}>
              <div className="pb-3 mb-1" style={{ borderBottom: '0.5px solid rgba(0,0,0,0.06)' }}>
                <p className="text-xs text-secondary truncate">{user.email}</p>
                {user.name && <p className="text-sm font-medium truncate mt-0.5">{user.name}</p>}
              </div>
              {organizations.length > 1 && (
                <div className="pb-3">
                  <label className="label text-xs">{t('layout.org')}</label>
                  <select
                    value={currentOrg?.id || ''}
                    onChange={(e) => {
                      const org = organizations.find((o) => o.id === e.target.value);
                      if (org) setCurrentOrg(org);
                    }}
                    className="input text-sm"
                  >
                    {organizations.map((o) => (
                      <option key={o.id} value={o.id}>{o.name}</option>
                    ))}
                  </select>
                </div>
              )}
              <div className="pb-3">
                <LanguageSwitcher />
              </div>
              <Link to="/" className="nav-item">
                <Home className="w-4 h-4" /> {t('common.home')}
              </Link>
              <button type="button" onClick={logout} className="nav-item w-full text-left text-[#ff3b30]">
                <LogOut className="w-4 h-4" /> {t('common.logout')}
              </button>
            </div>
          )}
        </header>

        <div className="flex-1 overflow-x-hidden overflow-y-auto">
          <Outlet />
        </div>
      </main>

      <nav className="bottom-nav lg:hidden safe-x" aria-label={t('nav.control')}>
        <div className="bottom-nav-inner">
          {nav.map(({ to, shortLabelKey, icon: Icon, end }) => {
            const active = isActive(to, end);
            return (
              <Link
                key={to}
                to={to}
                className={`bottom-nav-item ${active ? 'bottom-nav-item-active' : ''}`}
                aria-current={active ? 'page' : undefined}
              >
                <Icon className="bottom-nav-icon" strokeWidth={active ? 2.25 : 1.75} />
                <span className="bottom-nav-label">{t(shortLabelKey)}</span>
              </Link>
            );
          })}
        </div>
      </nav>
      <AiAssistant />
    </div>
  );
}
