import { useState } from 'react';
import { Link } from 'react-router-dom';
import {
  Box, QrCode, Globe, ArrowRight, Check, Menu, X,
  Upload, Smartphone, Camera, Palette, LayoutDashboard, ChevronDown,
  Building2, PartyPopper, ShoppingBag, GraduationCap, XCircle,
  Map, Navigation, Hotel, Link2,
} from 'lucide-react';
import { PricingCards } from '../components/PricingCards';
import { PageShell } from '../components/FuturisticBg';
import { LogoLink } from '../components/Logo';
import { SectionHeader } from '../components/ui/SectionHeader';
import { LanguageSwitcher } from '../components/LanguageSwitcher';
import { useAuth } from '../lib/auth-context';
import { useI18n } from '../lib/i18n-context';

function PhoneMockup({ brand, subtitle }: { brand: string; subtitle: string }) {
  return (
    <div className="landing-phone" aria-hidden="true">
      <div className="landing-phone-notch" />
      <div className="landing-phone-screen">
        <div className="absolute inset-0 opacity-20" style={{ backgroundImage: 'linear-gradient(rgba(255,255,255,0.3) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.3) 1px, transparent 1px)', backgroundSize: '20px 20px' }} />
        <div className="absolute top-4 left-3 right-3 flex items-center gap-2 glass-thick rounded-2xl px-3 py-2">
          <div className="icon-glass w-7 h-7" style={{ background: 'var(--brand)', border: 'none' }}><Box className="w-3.5 h-3.5 text-white" /></div>
          <div><p className="text-[10px] font-bold text-white leading-tight">{brand}</p><p className="text-[8px] text-white/60">{subtitle}</p></div>
        </div>
        <div className="absolute inset-0 flex items-center justify-center pb-8">
          <div className="w-28 h-28 rounded-2xl border-2 border-white/30 flex items-center justify-center"><Camera className="w-9 h-9 text-white/70" /></div>
        </div>
        <div className="absolute bottom-4 inset-x-0 flex justify-center">
          <div className="camera-dock w-14 h-14 flex items-center justify-center !p-0 !rounded-full mx-auto"><div className="w-11 h-11 rounded-full border-[3px] border-white/90" style={{ borderColor: 'var(--brand)' }} /></div>
        </div>
      </div>
    </div>
  );
}

export function Landing() {
  const { user } = useAuth();
  const { t } = useI18n();
  const [menuOpen, setMenuOpen] = useState(false);
  const [openFaq, setOpenFaq] = useState<number | null>(0);

  const navLinks = [
    { href: '#vizara-ar', label: 'VizaraAR' },
    { href: '#vizara-tour', label: 'VizaraTour' },
    { href: '#pricing', label: t('nav.pricing') },
    { href: '#faq', label: t('nav.faq') },
  ];

  const tourSteps = [
    { n: '01', title: t('landing.tourStep1Title'), desc: t('landing.tourStep1Desc'), icon: Map },
    { n: '02', title: t('landing.tourStep2Title'), desc: t('landing.tourStep2Desc'), icon: Upload },
    { n: '03', title: t('landing.tourStep3Title'), desc: t('landing.tourStep3Desc'), icon: Link2 },
  ];

  const tourFeatures = [
    { icon: Navigation, title: t('landing.tourFeat1Title'), desc: t('landing.tourFeat1Desc') },
    { icon: Map, title: t('landing.tourFeat2Title'), desc: t('landing.tourFeat2Desc') },
    { icon: QrCode, title: t('landing.tourFeat3Title'), desc: t('landing.tourFeat3Desc') },
  ];

  const tourUseCases = [
    { icon: Building2, title: t('landing.tourUse1Title'), desc: t('landing.tourUse1Desc') },
    { icon: Hotel, title: t('landing.tourUse2Title'), desc: t('landing.tourUse2Desc') },
    { icon: GraduationCap, title: t('landing.tourUse3Title'), desc: t('landing.tourUse3Desc') },
  ];

  const stats = [
    { value: t('landing.statPrice'), label: t('landing.statPriceLabel') },
    { value: t('landing.statTime'), label: t('landing.statTimeLabel') },
    { value: t('landing.statInstall'), label: t('landing.statInstallLabel') },
  ];

  const steps = [
    { n: '01', title: t('landing.step1Title'), desc: t('landing.step1Desc'), icon: Smartphone },
    { n: '02', title: t('landing.step2Title'), desc: t('landing.step2Desc'), icon: Upload },
    { n: '03', title: t('landing.step3Title'), desc: t('landing.step3Desc'), icon: QrCode },
  ];

  const features = [
    { icon: Box, title: t('landing.feat1Title'), desc: t('landing.feat1Desc') },
    { icon: QrCode, title: t('landing.feat2Title'), desc: t('landing.feat2Desc') },
    { icon: Globe, title: t('landing.feat3Title'), desc: t('landing.feat3Desc') },
    { icon: Camera, title: t('landing.feat4Title'), desc: t('landing.feat4Desc') },
    { icon: Palette, title: t('landing.feat5Title'), desc: t('landing.feat5Desc') },
    { icon: LayoutDashboard, title: t('landing.feat6Title'), desc: t('landing.feat6Desc') },
  ];

  const useCases = [
    { icon: Building2, title: t('landing.use1Title'), desc: t('landing.use1Desc') },
    { icon: PartyPopper, title: t('landing.use2Title'), desc: t('landing.use2Desc') },
    { icon: ShoppingBag, title: t('landing.use3Title'), desc: t('landing.use3Desc') },
    { icon: GraduationCap, title: t('landing.use4Title'), desc: t('landing.use4Desc') },
  ];

  const comparisons = [
    { bad: t('landing.compareBad1'), good: t('landing.compareGood1') },
    { bad: t('landing.compareBad2'), good: t('landing.compareGood2') },
    { bad: t('landing.compareBad3'), good: t('landing.compareGood3') },
  ];

  const faqs = [
    { q: t('landing.faq1Q'), a: t('landing.faq1A') },
    { q: t('landing.faq2Q'), a: t('landing.faq2A') },
    { q: t('landing.faq3Q'), a: t('landing.faq3A') },
    { q: t('landing.faq4Q'), a: t('landing.faq4A') },
    { q: t('landing.faq5Q'), a: t('landing.faq5A') },
  ];

  const chips = [
    t('landing.chipNoApp'),
    t('landing.chipQr'),
    t('landing.chipMobile'),
    t('landing.chipDemo'),
  ];

  const scrollTo = (href: string) => {
    setMenuOpen(false);
    document.querySelector(href)?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  };

  return (
    <PageShell className="min-h-app">
      <header className="glass-header sticky top-0 z-50 safe-top">
        <div className="container flex items-center justify-between gap-2 h-14 sm:h-16 min-w-0">
          <div className="shrink-0">
            <LogoLink size="sm" />
          </div>
          <nav className="hidden md:flex items-center gap-1">
            {navLinks.map(({ href, label }) => (
              <button key={href} type="button" onClick={() => scrollTo(href)} className="px-3 py-2 text-sm font-medium text-secondary hover:text-[var(--color-ink)] rounded-[var(--radius)] hover:bg-black/[0.04] transition-colors">{label}</button>
            ))}
          </nav>
          <div className="hidden md:flex items-center gap-2">
            <LanguageSwitcher compact />
            {user ? (
              <Link to="/dashboard" className="btn btn-primary text-sm">{t('nav.dashboard')}</Link>
            ) : (
              <><Link to="/login" className="btn btn-ghost text-sm">{t('nav.login')}</Link><Link to="/register" className="btn btn-primary text-sm">{t('nav.start')}</Link></>
            )}
          </div>
          <button type="button" onClick={() => setMenuOpen(!menuOpen)} className="icon-btn md:hidden" aria-label={t('common.menu')}>
            {menuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
        </div>
        {menuOpen && (
          <div className="md:hidden glass-thick px-4 py-4 space-y-1" style={{ borderTop: '0.5px solid rgba(0,0,0,0.06)' }}>
            {navLinks.map(({ href, label }) => (
              <button key={href} type="button" onClick={() => scrollTo(href)} className="w-full text-left px-3 py-3 text-sm font-medium rounded-[var(--radius)] hover:bg-black/[0.04]">{label}</button>
            ))}
            <div className="pt-3 pb-2">
              <LanguageSwitcher />
            </div>
            <div className="pt-3 space-y-2" style={{ borderTop: '0.5px solid rgba(0,0,0,0.06)' }}>
              {user ? (
                <Link to="/dashboard" className="btn btn-primary w-full" onClick={() => setMenuOpen(false)}>{t('nav.dashboard')}</Link>
              ) : (
                <><Link to="/login" className="btn btn-secondary w-full" onClick={() => setMenuOpen(false)}>{t('nav.login')}</Link><Link to="/register" className="btn btn-primary w-full" onClick={() => setMenuOpen(false)}>{t('nav.start')}</Link></>
              )}
            </div>
          </div>
        )}
      </header>

      <section className="landing-hero-bg landing-section pt-10 sm:pt-14 pb-6">
        <div className="container">
          <div className="max-w-3xl mx-auto text-center mb-8 sm:mb-10">
            <div className="inline-flex items-center gap-2 badge mb-4 max-w-full mx-auto">
              <span className="w-1.5 h-1.5 rounded-full shrink-0 animate-pulse" style={{ background: 'var(--brand)' }} />
              <span className="leading-snug">{t('landing.badge')}</span>
            </div>
            <h1 className="landing-hero-title font-bold tracking-tight mb-4">{t('landing.platformTitle')}</h1>
            <p className="text-[15px] sm:text-lg text-secondary leading-relaxed max-w-2xl mx-auto">{t('landing.platformDesc')}</p>
          </div>

          <div className="grid gap-4 md:grid-cols-2 max-w-4xl mx-auto">
            <button type="button" onClick={() => scrollTo('#vizara-ar')} className="product-card product-card-ar text-left">
              <div className="product-card-icon"><Box className="w-6 h-6" /></div>
              <p className="product-card-name">{t('landing.productArName')}</p>
              <p className="product-card-tag">{t('landing.productArTag')}</p>
              <p className="product-card-desc">{t('landing.productArDesc')}</p>
              <span className="product-card-cta">{t('landing.productArCta')} <ArrowRight className="w-4 h-4" /></span>
            </button>
            <button type="button" onClick={() => scrollTo('#vizara-tour')} className="product-card product-card-tour text-left">
              <div className="product-card-icon product-card-icon-tour"><Map className="w-6 h-6" /></div>
              <p className="product-card-name">{t('landing.productTourName')}</p>
              <p className="product-card-tag">{t('landing.productTourTag')}</p>
              <p className="product-card-desc">{t('landing.productTourDesc')}</p>
              <span className="product-card-cta">{t('landing.productTourCta')} <ArrowRight className="w-4 h-4" /></span>
            </button>
          </div>

          <div className="flex flex-col sm:flex-row gap-3 justify-center mt-8 mb-4">
            <Link to={user ? '/dashboard' : '/register'} className="btn btn-primary w-full sm:w-auto text-[15px] px-7">
              {user ? t('landing.ctaDashboard') : t('landing.ctaStart')}<ArrowRight className="w-4 h-4" />
            </Link>
            <button type="button" onClick={() => scrollTo('#pricing')} className="btn btn-secondary w-full sm:w-auto text-[15px]">{t('landing.ctaViewPlans')}</button>
          </div>
        </div>
      </section>

      <section id="vizara-ar" className="scroll-mt-20">
      <section className="landing-section glass-section pt-8">
        <div className="container">
          <div className="grid lg:grid-cols-2 gap-8 items-center">
            <div>
              <p className="text-sm font-semibold text-[var(--brand)] mb-2">{t('landing.arSectionTitle')}</p>
              <h2 className="text-2xl sm:text-3xl font-bold mb-3">
                {t('landing.heroTitle')}{' '}
                <span className="text-gradient">{t('landing.heroTitleHighlight')}</span>
              </h2>
              <p className="text-secondary leading-relaxed mb-5">{t('landing.heroDesc')}</p>
              <div className="flex flex-wrap gap-1.5 sm:gap-2">
                {chips.map((chip) => (
                  <span key={chip} className="glass-chip max-w-full">
                    <Check className="w-3.5 h-3.5 shrink-0" style={{ color: 'var(--brand)' }} />
                    <span className="leading-snug">{chip}</span>
                  </span>
                ))}
              </div>
            </div>
            <div className="flex justify-center lg:justify-end">
              <PhoneMockup brand={t('landing.phoneBrand')} subtitle={t('landing.phoneSubtitle')} />
            </div>
          </div>
        </div>
      </section>
      <section className="glass-section">
        <div className="container py-6 sm:py-8">
          <div className="grid grid-cols-3 gap-1 sm:gap-6">
            {stats.map(({ value, label }) => (
              <div key={label} className="landing-stat">
                <p className="landing-stat-value">{value}</p>
                <p className="landing-stat-label text-secondary mt-1">{label}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section id="how" className="landing-section scroll-mt-20">
        <div className="container">
          <SectionHeader eyebrow={t('landing.howEyebrow')} title={t('landing.howTitle')} description={t('landing.howDesc')} />
          <div className="grid gap-4 sm:grid-cols-3">
            {steps.map(({ n, title, desc, icon: Icon }) => (
              <div key={n} className="card-elevated p-6 relative">
                <span className="text-4xl font-bold absolute top-4 right-5 select-none" style={{ color: 'rgba(27,163,156,0.12)' }}>{n}</span>
                <div className="icon-glass w-11 h-11 mb-4"><Icon className="w-5 h-5" /></div>
                <h3 className="font-bold mb-2">{title}</h3>
                <p className="text-sm text-secondary leading-relaxed">{desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="landing-section glass-section">
        <div className="container max-w-3xl">
          <SectionHeader eyebrow={t('landing.whyEyebrow')} title={t('landing.whyTitle')} description={t('landing.whyDesc')} align="center" className="mx-auto text-center" />
          <div className="space-y-3">
            {comparisons.map(({ bad, good }) => (
              <div key={bad} className="grid sm:grid-cols-2 gap-3">
                <div className="comparison-bad flex items-start gap-3 p-4">
                  <XCircle className="w-5 h-5 shrink-0 mt-0.5" style={{ color: '#ff3b30' }} />
                  <p className="text-sm text-secondary">{bad}</p>
                </div>
                <div className="comparison-good flex items-start gap-3 p-4">
                  <Check className="w-5 h-5 shrink-0 mt-0.5" style={{ color: 'var(--brand)' }} />
                  <p className="text-sm font-medium">{good}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section id="features" className="landing-section scroll-mt-20">
        <div className="container">
          <SectionHeader eyebrow={t('landing.featEyebrow')} title={t('landing.featTitle')} description={t('landing.featDesc')} />
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {features.map(({ icon: Icon, title, desc }) => (
              <div key={title} className="card card-hover p-5 sm:p-6">
                <div className="icon-glass w-10 h-10 mb-4"><Icon className="w-5 h-5" /></div>
                <h3 className="font-semibold mb-2">{title}</h3>
                <p className="text-sm text-secondary leading-relaxed">{desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="landing-section glass-section">
        <div className="container">
          <SectionHeader eyebrow={t('landing.useEyebrow')} title={t('landing.useTitle')} description={t('landing.useDesc')} />
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {useCases.map(({ icon: Icon, title, desc }) => (
              <div key={title} className="use-case-card">
                <Icon className="w-6 h-6 mb-3" style={{ color: 'var(--brand)' }} />
                <h3 className="font-semibold mb-1.5 text-sm">{title}</h3>
                <p className="text-xs text-secondary leading-relaxed">{desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>
      </section>

      <section id="vizara-tour" className="landing-section scroll-mt-20 glass-section">
        <div className="container">
          <SectionHeader eyebrow={t('landing.tourSectionEyebrow')} title={t('landing.tourSectionTitle')} description={t('landing.tourSectionDesc')} />
          <div className="grid gap-4 sm:grid-cols-3 mb-10">
            {tourSteps.map(({ n, title, desc, icon: Icon }) => (
              <div key={n} className="card-elevated p-6 relative">
                <span className="text-4xl font-bold absolute top-4 right-5 select-none" style={{ color: 'rgba(99,102,241,0.12)' }}>{n}</span>
                <div className="icon-glass w-11 h-11 mb-4 product-card-icon-tour !bg-indigo-500"><Icon className="w-5 h-5 text-white" /></div>
                <h3 className="font-bold mb-2">{title}</h3>
                <p className="text-sm text-secondary leading-relaxed">{desc}</p>
              </div>
            ))}
          </div>
          <div className="grid gap-4 sm:grid-cols-3 mb-10">
            {tourFeatures.map(({ icon: Icon, title, desc }) => (
              <div key={title} className="card card-hover p-5 sm:p-6">
                <div className="icon-glass w-10 h-10 mb-4 product-card-icon-tour !bg-indigo-500"><Icon className="w-5 h-5 text-white" /></div>
                <h3 className="font-semibold mb-2">{title}</h3>
                <p className="text-sm text-secondary leading-relaxed">{desc}</p>
              </div>
            ))}
          </div>
          <div className="grid gap-4 sm:grid-cols-3">
            {tourUseCases.map(({ icon: Icon, title, desc }) => (
              <div key={title} className="use-case-card">
                <Icon className="w-6 h-6 mb-3" style={{ color: '#6366f1' }} />
                <h3 className="font-semibold mb-1.5 text-sm">{title}</h3>
                <p className="text-xs text-secondary leading-relaxed">{desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section id="pricing" className="landing-section scroll-mt-[4.5rem] sm:scroll-mt-20">
        <div className="container">
          <SectionHeader eyebrow={t('landing.priceEyebrow')} title={t('landing.priceTitle')} description={t('landing.priceDesc')} />
          <h3 className="text-lg font-bold mb-4 mt-8">VizaraAR</h3>
          <PricingCards product="vizara_ar" mode="landing" />
          <h3 className="text-lg font-bold mb-4 mt-10">VizaraTour</h3>
          <PricingCards product="vizara_tour" mode="landing" />
        </div>
      </section>

      <section id="faq" className="landing-section glass-section scroll-mt-20">
        <div className="container max-w-2xl">
          <SectionHeader eyebrow={t('landing.faqEyebrow')} title={t('landing.faqTitle')} />
          <div>
            {faqs.map((faq, i) => (
              <div key={faq.q}>
                <button type="button" className="landing-faq-btn" onClick={() => setOpenFaq(openFaq === i ? null : i)} aria-expanded={openFaq === i}>
                  {faq.q}
                  <ChevronDown className={`w-5 h-5 text-secondary shrink-0 transition-transform duration-300 ${openFaq === i ? 'rotate-180' : ''}`} style={{ transitionTimingFunction: 'var(--ease-ios)' }} />
                </button>
                {openFaq === i && <p className="landing-faq-answer">{faq.a}</p>}
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="landing-section pb-10">
        <div className="container">
          <div className="landing-cta">
            <div className="relative">
              <h2 className="text-xl sm:text-2xl lg:text-3xl font-bold text-white mb-3 tracking-tight">{t('landing.ctaTitle')}</h2>
              <p className="text-sm sm:text-base text-white/80 mb-6 sm:mb-8 max-w-md mx-auto px-2">{t('landing.ctaDesc')}</p>
              <div className="flex flex-col sm:flex-row gap-3 justify-center">
                <Link to={user ? '/dashboard' : '/register'} className="btn bg-white text-[var(--brand)] hover:bg-white/95 w-full sm:w-auto text-[15px] px-8 shadow-lg">
                  {user ? t('landing.ctaDashboard') : t('landing.ctaStartNow')}
                </Link>
                <button type="button" onClick={() => scrollTo('#pricing')} className="btn btn-glass w-full sm:w-auto text-[15px]">
                  {t('landing.ctaViewPlans')}
                </button>
              </div>
            </div>
          </div>
        </div>
      </section>

      <footer className="glass-section safe-bottom">
        <div className="container py-10">
          <div className="grid gap-8 sm:grid-cols-2 lg:grid-cols-4">
            <div>
              <LogoLink size="sm" />
              <p className="text-sm text-secondary mt-3 leading-relaxed">{t('landing.footerDesc')}</p>
            </div>
            <div>
              <p className="text-sm font-semibold mb-3">{t('landing.footerPlatform')}</p>
              <div className="space-y-2">
                {navLinks.map(({ href, label }) => (
                  <button key={href} type="button" onClick={() => scrollTo(href)} className="block text-sm text-secondary hover:text-[var(--brand)] transition-colors">{label}</button>
                ))}
              </div>
            </div>
            <div>
              <p className="text-sm font-semibold mb-3">{t('landing.footerAccount')}</p>
              <div className="space-y-2">
                <Link to="/login" className="block text-sm text-secondary hover:text-[var(--brand)] transition-colors">{t('nav.login')}</Link>
                <Link to="/register" className="block text-sm text-secondary hover:text-[var(--brand)] transition-colors">{t('nav.register')}</Link>
                <Link to="/dashboard" className="block text-sm text-secondary hover:text-[var(--brand)] transition-colors">{t('nav.dashboard')}</Link>
              </div>
            </div>
            <div>
              <p className="text-sm font-semibold mb-3">{t('landing.footerContact')}</p>
              <p className="text-sm text-secondary">vizara.app</p>
              <p className="text-sm text-secondary mt-1">WebAR · 3D · QR</p>
              <div className="mt-4">
                <LanguageSwitcher />
              </div>
            </div>
          </div>
          <div className="divider mt-8 mb-6" />
          <p className="text-center text-xs text-secondary opacity-70">© {new Date().getFullYear()} {t('landing.footerCopy')}</p>
        </div>
      </footer>
    </PageShell>
  );
}
