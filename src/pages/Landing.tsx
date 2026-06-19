import { useState } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'motion/react';
import {
  Box, QrCode, Globe, ArrowRight, Check, ChevronDown,
  Upload, Smartphone, Camera, Palette, LayoutDashboard, XCircle,
  Building2, PartyPopper, ShoppingBag, GraduationCap,
  Map, Navigation, Hotel, Link2,
} from 'lucide-react';
import { PricingCards } from '../components/PricingCards';
import { LogoLink } from '../components/Logo';
import { SectionHeader } from '../components/ui/SectionHeader';
import { LandingShell } from '../components/landing/LandingShell';
import { RevealOnScroll } from '../components/landing/RevealOnScroll';
import { HeroTitle } from '../components/landing/HeroTitle';
import { HeroVisual } from '../components/landing/HeroVisual';
import { TiltGlowCard } from '../components/landing/TiltGlowCard';
import { MarqueeBand } from '../components/landing/MarqueeBand';
import { LanguageSwitcher } from '../components/LanguageSwitcher';
import { useAuth } from '../lib/auth-context';
import { useI18n } from '../lib/i18n-context';

function PhoneMockup({ brand, subtitle }: { brand: string; subtitle: string }) {
  return (
    <motion.div
      className="landing-phone-wrap"
      animate={{ y: [0, -14, 0] }}
      transition={{ duration: 5, repeat: Infinity, ease: 'easeInOut' }}
    >
      <motion.div
        className="landing-phone landing-phone--light"
        aria-hidden="true"
        initial={{ opacity: 0, rotateY: -18, scale: 0.92 }}
        whileInView={{ opacity: 1, rotateY: 0, scale: 1 }}
        viewport={{ once: true }}
        transition={{ duration: 0.9, ease: [0.16, 1, 0.3, 1] }}
        style={{ transformPerspective: 1200 }}
      >
      <div className="landing-phone-halo" />
      <div className="landing-phone-ring landing-phone-ring-1" />
      <div className="landing-phone-ring landing-phone-ring-2" />
      <div className="landing-phone-glow" />
      <div className="landing-phone-notch" />
      <div className="landing-phone-screen">
        <div className="landing-phone-grid" />
        <div className="landing-phone-scan" />
        <div className="absolute top-4 left-3 right-3 flex items-center gap-2 glass-thick rounded-2xl px-3 py-2 landing-phone-ui-bar">
          <div className="icon-glass w-7 h-7 landing-phone-ui-icon"><Box className="w-3.5 h-3.5 text-white" /></div>
          <div><p className="text-[10px] font-bold text-white leading-tight">{brand}</p><p className="text-[8px] text-white/60">{subtitle}</p></div>
        </div>
        <div className="absolute inset-0 flex items-center justify-center pb-8">
          <div className="w-28 h-28 rounded-2xl border-2 border-cyan-400/40 flex items-center justify-center landing-phone-ar-frame">
            <div className="landing-phone-ar-corners" aria-hidden />
            <Camera className="w-9 h-9 text-cyan-300/80" />
          </div>
        </div>
        <div className="absolute bottom-4 inset-x-0 flex justify-center">
          <div className="camera-dock w-14 h-14 flex items-center justify-center !p-0 !rounded-full mx-auto landing-phone-dock">
            <div className="w-11 h-11 rounded-full border-[3px] border-cyan-300/90 landing-phone-shutter" />
          </div>
        </div>
      </div>
      </motion.div>
    </motion.div>
  );
}

export function Landing() {
  const { user } = useAuth();
  const { t } = useI18n();
  const [openFaq, setOpenFaq] = useState<number | null>(0);

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

  const footerNav = [
    { id: 'hero', label: t('landing.navHome') },
    { id: 'vizara-ar', label: 'VizaraAR' },
    { id: 'vizara-tour', label: 'VizaraTour' },
    { id: 'pricing', label: t('nav.pricing') },
    { id: 'faq', label: t('nav.faq') },
  ];

  const scrollTo = (id: string) => {
    const el = document.getElementById(id);
    if (!el) return;
    const top = el.getBoundingClientRect().top + window.scrollY - 80;
    window.scrollTo({ top: Math.max(0, top), behavior: 'smooth' });
    window.history.replaceState(null, '', id === 'hero' ? '/' : `/#${id}`);
  };

  const marqueeItems = [
    'WebAR', '360° Tour', 'QR Scan', '3D Models', 'Hotspots', 'No App',
    'Mobile First', 'VizaraAR', 'VizaraTour', 'Real-time', 'Holographic',
  ];

  const platformParts = t('landing.platformTitle').split(/\s*[—–-]\s*/);
  const heroLine1 = platformParts[0]?.trim() || 'Vizara';
  const heroHighlight = platformParts[1]?.trim() || 'WebAR & Virtual Tour';

  return (
    <LandingShell user={user}>
      <section id="hero" className="landing-hero landing-hero--light scroll-mt-24">
        <div className="container landing-hero-inner">
          <motion.div
            className="landing-hero-badge landing-hero-badge--light"
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
          >
            {t('landing.badge')}
          </motion.div>

          <HeroTitle line1={heroLine1} highlight={heroHighlight} />

          <motion.p
            className="landing-hero-sub"
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2, duration: 0.55 }}
          >
            {t('landing.platformDesc')}
          </motion.p>

          <motion.div
            className="landing-hero-actions"
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.35, duration: 0.5 }}
          >
            <Link to={user ? '/dashboard' : '/register'} className="btn btn-primary landing-hero-btn-primary">
              {user ? t('landing.ctaDashboard') : t('landing.ctaStart')}
              <ArrowRight className="w-4 h-4" />
            </Link>
            <button type="button" onClick={() => scrollTo('pricing')} className="btn btn-secondary landing-hero-btn-secondary">
              {t('landing.ctaViewPlans')}
            </button>
          </motion.div>

          <HeroVisual />

          <div className="landing-hero-products">
            <TiltGlowCard glow="ar" onClick={() => scrollTo('vizara-ar')} className="product-card product-card-ar text-left">
              <div className="product-card-icon"><Box className="w-6 h-6" /></div>
              <p className="product-card-name">{t('landing.productArName')}</p>
              <p className="product-card-tag">{t('landing.productArTag')}</p>
              <p className="product-card-desc">{t('landing.productArDesc')}</p>
              <span className="product-card-cta">{t('landing.productArCta')} <ArrowRight className="w-4 h-4" /></span>
            </TiltGlowCard>
            <TiltGlowCard glow="tour" onClick={() => scrollTo('vizara-tour')} className="product-card product-card-tour text-left">
              <div className="product-card-icon product-card-icon-tour"><Map className="w-6 h-6" /></div>
              <p className="product-card-name">{t('landing.productTourName')}</p>
              <p className="product-card-tag">{t('landing.productTourTag')}</p>
              <p className="product-card-desc">{t('landing.productTourDesc')}</p>
              <span className="product-card-cta">{t('landing.productTourCta')} <ArrowRight className="w-4 h-4" /></span>
            </TiltGlowCard>
          </div>
        </div>
        <MarqueeBand items={marqueeItems} />
      </section>

      <section id="vizara-ar" className="scroll-mt-20 landing-section-anchor">
        <section className="landing-section landing-band">
          <div className="container">
            <div className="grid lg:grid-cols-2 gap-10 items-center">
              <RevealOnScroll variant="left">
                <p className="landing-eyebrow landing-eyebrow-ar">{t('landing.arSectionTitle')}</p>
                <h2 className="text-2xl sm:text-3xl font-bold mb-3">
                  {t('landing.heroTitle')}{' '}
                  <span className="text-gradient text-gradient-animated">{t('landing.heroTitleHighlight')}</span>
                </h2>
                <p className="text-secondary leading-relaxed mb-5">{t('landing.heroDesc')}</p>
                <div className="flex flex-wrap gap-1.5 sm:gap-2">
                  {chips.map((chip) => (
                    <span key={chip} className="glass-chip max-w-full landing-chip">
                      <Check className="w-3.5 h-3.5 shrink-0" style={{ color: 'var(--brand)' }} />
                      <span className="leading-snug">{chip}</span>
                    </span>
                  ))}
                </div>
              </RevealOnScroll>
              <RevealOnScroll delay={0.1} variant="scale">
                <PhoneMockup brand={t('landing.phoneBrand')} subtitle={t('landing.phoneSubtitle')} />
              </RevealOnScroll>
            </div>
          </div>
        </section>

        <section className="glass-section landing-band">
          <div className="container py-6 sm:py-8">
            <div className="grid grid-cols-3 gap-2 sm:gap-6">
              {stats.map(({ value, label }, i) => (
                <RevealOnScroll key={label} delay={i * 0.08}>
                  <div className="landing-stat landing-stat-glow">
                    <p className="landing-stat-value">{value}</p>
                    <p className="landing-stat-label text-secondary mt-1">{label}</p>
                  </div>
                </RevealOnScroll>
              ))}
            </div>
          </div>
        </section>

        <section id="how" className="landing-section scroll-mt-20">
          <div className="container">
            <RevealOnScroll>
              <SectionHeader eyebrow={t('landing.howEyebrow')} title={t('landing.howTitle')} description={t('landing.howDesc')} />
            </RevealOnScroll>
            <div className="grid gap-4 sm:grid-cols-3">
              {steps.map(({ n, title, desc, icon: Icon }, i) => (
                <RevealOnScroll key={n} delay={i * 0.08}>
                  <div className="card-elevated landing-step-card p-6 relative">
                    <span className="landing-step-num">{n}</span>
                    <div className="icon-glass w-11 h-11 mb-4"><Icon className="w-5 h-5" /></div>
                    <h3 className="font-bold mb-2">{title}</h3>
                    <p className="text-sm text-secondary leading-relaxed">{desc}</p>
                  </div>
                </RevealOnScroll>
              ))}
            </div>
          </div>
        </section>

        <section className="landing-section landing-band">
          <div className="container max-w-3xl">
            <RevealOnScroll>
              <SectionHeader eyebrow={t('landing.whyEyebrow')} title={t('landing.whyTitle')} description={t('landing.whyDesc')} align="center" className="mx-auto text-center" />
            </RevealOnScroll>
            <div className="space-y-3">
              {comparisons.map(({ bad, good }, i) => (
                <RevealOnScroll key={bad} delay={i * 0.06}>
                  <div className="grid sm:grid-cols-2 gap-3">
                    <div className="comparison-bad flex items-start gap-3 p-4">
                      <XCircle className="w-5 h-5 shrink-0 mt-0.5" style={{ color: '#ff3b30' }} />
                      <p className="text-sm text-secondary">{bad}</p>
                    </div>
                    <div className="comparison-good flex items-start gap-3 p-4">
                      <Check className="w-5 h-5 shrink-0 mt-0.5" style={{ color: 'var(--brand)' }} />
                      <p className="text-sm font-medium">{good}</p>
                    </div>
                  </div>
                </RevealOnScroll>
              ))}
            </div>
          </div>
        </section>

        <section id="features" className="landing-section scroll-mt-20">
          <div className="container">
            <RevealOnScroll>
              <SectionHeader eyebrow={t('landing.featEyebrow')} title={t('landing.featTitle')} description={t('landing.featDesc')} />
            </RevealOnScroll>
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {features.map(({ icon: Icon, title, desc }, i) => (
                <RevealOnScroll key={title} delay={(i % 3) * 0.06}>
                  <motion.div className="card card-hover landing-feature-card p-5 sm:p-6 h-full" whileHover={{ y: -3 }}>
                    <div className="icon-glass w-10 h-10 mb-4"><Icon className="w-5 h-5" /></div>
                    <h3 className="font-semibold mb-2">{title}</h3>
                    <p className="text-sm text-secondary leading-relaxed">{desc}</p>
                  </motion.div>
                </RevealOnScroll>
              ))}
            </div>
          </div>
        </section>

        <section className="landing-section landing-band">
          <div className="container">
            <RevealOnScroll>
              <SectionHeader eyebrow={t('landing.useEyebrow')} title={t('landing.useTitle')} description={t('landing.useDesc')} />
            </RevealOnScroll>
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              {useCases.map(({ icon: Icon, title, desc }, i) => (
                <RevealOnScroll key={title} delay={i * 0.05}>
                  <div className="use-case-card landing-use-card">
                    <Icon className="w-6 h-6 mb-3" style={{ color: 'var(--brand)' }} />
                    <h3 className="font-semibold mb-1.5 text-sm">{title}</h3>
                    <p className="text-xs text-secondary leading-relaxed">{desc}</p>
                  </div>
                </RevealOnScroll>
              ))}
            </div>
          </div>
        </section>
      </section>

      <section id="vizara-tour" className="landing-section scroll-mt-24 landing-band landing-tour-section">
        <div className="container">
          <RevealOnScroll>
            <SectionHeader eyebrow={t('landing.tourSectionEyebrow')} title={t('landing.tourSectionTitle')} description={t('landing.tourSectionDesc')} />
          </RevealOnScroll>
          <div className="grid gap-4 sm:grid-cols-3 mb-10">
            {tourSteps.map(({ n, title, desc, icon: Icon }, i) => (
              <RevealOnScroll key={n} delay={i * 0.08}>
                <div className="card-elevated landing-step-card landing-step-card-tour p-6 relative">
                  <span className="landing-step-num landing-step-num-tour">{n}</span>
                  <div className="icon-glass w-11 h-11 mb-4 product-card-icon-tour !bg-indigo-500"><Icon className="w-5 h-5 text-white" /></div>
                  <h3 className="font-bold mb-2">{title}</h3>
                  <p className="text-sm text-secondary leading-relaxed">{desc}</p>
                </div>
              </RevealOnScroll>
            ))}
          </div>
          <div className="grid gap-4 sm:grid-cols-3 mb-10">
            {tourFeatures.map(({ icon: Icon, title, desc }, i) => (
              <RevealOnScroll key={title} delay={i * 0.06}>
                <motion.div className="card card-hover landing-feature-card p-5 sm:p-6 h-full" whileHover={{ y: -3 }}>
                  <div className="icon-glass w-10 h-10 mb-4 product-card-icon-tour !bg-indigo-500"><Icon className="w-5 h-5 text-white" /></div>
                  <h3 className="font-semibold mb-2">{title}</h3>
                  <p className="text-sm text-secondary leading-relaxed">{desc}</p>
                </motion.div>
              </RevealOnScroll>
            ))}
          </div>
          <div className="grid gap-4 sm:grid-cols-3">
            {tourUseCases.map(({ icon: Icon, title, desc }, i) => (
              <RevealOnScroll key={title} delay={i * 0.05}>
                <div className="use-case-card landing-use-card landing-use-card-tour">
                  <Icon className="w-6 h-6 mb-3" style={{ color: '#6366f1' }} />
                  <h3 className="font-semibold mb-1.5 text-sm">{title}</h3>
                  <p className="text-xs text-secondary leading-relaxed">{desc}</p>
                </div>
              </RevealOnScroll>
            ))}
          </div>
        </div>
      </section>

      <section id="pricing" className="landing-section scroll-mt-24">
        <div className="container">
          <RevealOnScroll>
            <SectionHeader eyebrow={t('landing.priceEyebrow')} title={t('landing.priceTitle')} description={t('landing.priceDesc')} />
          </RevealOnScroll>
          <RevealOnScroll delay={0.08}>
            <h3 className="text-lg font-bold mb-4 mt-8 landing-price-heading">VizaraAR</h3>
            <PricingCards product="vizara_ar" mode="landing" />
          </RevealOnScroll>
          <RevealOnScroll delay={0.12}>
            <h3 className="text-lg font-bold mb-4 mt-10 landing-price-heading landing-price-heading-tour">VizaraTour</h3>
            <PricingCards product="vizara_tour" mode="landing" />
          </RevealOnScroll>
        </div>
      </section>

      <section id="faq" className="landing-section landing-band scroll-mt-24">
        <div className="container max-w-2xl">
          <RevealOnScroll>
            <SectionHeader eyebrow={t('landing.faqEyebrow')} title={t('landing.faqTitle')} />
          </RevealOnScroll>
          <div className="landing-faq-list">
            {faqs.map((faq, i) => (
              <RevealOnScroll key={faq.q} delay={i * 0.04}>
                <div className="landing-faq-item">
                  <button type="button" className="landing-faq-btn" onClick={() => setOpenFaq(openFaq === i ? null : i)} aria-expanded={openFaq === i}>
                    {faq.q}
                    <ChevronDown className={`w-5 h-5 text-secondary shrink-0 transition-transform duration-300 ${openFaq === i ? 'rotate-180' : ''}`} style={{ transitionTimingFunction: 'var(--ease-ios)' }} />
                  </button>
                  <motion.div
                    initial={false}
                    animate={{ height: openFaq === i ? 'auto' : 0, opacity: openFaq === i ? 1 : 0 }}
                    transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
                    className="landing-faq-panel overflow-hidden"
                  >
                    <p className="landing-faq-answer">{faq.a}</p>
                  </motion.div>
                </div>
              </RevealOnScroll>
            ))}
          </div>
        </div>
      </section>

      <section className="landing-section pb-10">
        <div className="container">
          <RevealOnScroll>
            <div className="landing-cta landing-cta--light">
              <div className="relative z-10">
                <h2 className="text-xl sm:text-2xl lg:text-3xl font-bold mb-3 tracking-tight text-[#003B73]">{t('landing.ctaTitle')}</h2>
                <p className="text-sm sm:text-base text-secondary mb-6 sm:mb-8 max-w-md mx-auto px-2">{t('landing.ctaDesc')}</p>
                <div className="flex flex-col sm:flex-row gap-3 justify-center">
                  <Link to={user ? '/dashboard' : '/register'} className="btn btn-primary w-full sm:w-auto text-[15px] px-8">
                    {user ? t('landing.ctaDashboard') : t('landing.ctaStartNow')}
                  </Link>
                  <button type="button" onClick={() => scrollTo('pricing')} className="btn btn-secondary w-full sm:w-auto text-[15px]">
                    {t('landing.ctaViewPlans')}
                  </button>
                </div>
              </div>
            </div>
          </RevealOnScroll>
        </div>
      </section>

      <footer className="landing-footer safe-bottom">
        <div className="container py-10">
          <div className="grid gap-8 sm:grid-cols-2 lg:grid-cols-4">
            <div>
              <LogoLink size="sm" />
              <p className="text-sm text-secondary mt-3 leading-relaxed">{t('landing.footerDesc')}</p>
            </div>
            <div>
              <p className="text-sm font-semibold mb-3">{t('landing.footerPlatform')}</p>
              <div className="space-y-2">
                {footerNav.map(({ id, label }) => (
                  <button key={id} type="button" onClick={() => scrollTo(id)} className="block text-sm text-secondary hover:text-[var(--brand)] transition-colors text-left">{label}</button>
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
              <p className="text-sm text-secondary mt-1">WebAR · 3D · QR · 360°</p>
              <div className="mt-4 landing-footer-lang">
                <LanguageSwitcher />
              </div>
            </div>
          </div>
          <div className="divider mt-8 mb-6" />
          <p className="text-center text-xs text-secondary opacity-70">© {new Date().getFullYear()} {t('landing.footerCopy')}</p>
        </div>
      </footer>
    </LandingShell>
  );
}
