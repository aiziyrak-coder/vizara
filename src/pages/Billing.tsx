import { useEffect, useState, useCallback } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useAuth } from '../lib/auth-context';
import { useI18n } from '../lib/i18n-context';
import { api, BillingStatus } from '../lib/api';
import { useToast } from '../lib/toast-context';
import { CheckCircle, XCircle, Box, Map } from 'lucide-react';
import { PricingCards } from '../components/PricingCards';
import { PageHeader } from '../components/ui/PageHeader';
import { LoadingSpinner } from '../components/ui/LoadingSpinner';
import { UsageBar } from '../components/ui/UsageBar';
import { isValidPlanId, type PlanId, type ProductId } from '../lib/plans';
import { toDateLocale } from '../i18n';

export function Billing() {
  const { currentOrg, refreshUser } = useAuth();
  const { t, getPlanName, locale } = useI18n();
  const { showToast } = useToast();
  const [searchParams] = useSearchParams();
  const [billing, setBilling] = useState<BillingStatus | null>(null);
  const [loading, setLoading] = useState(false);
  const [pageLoading, setPageLoading] = useState(true);
  const [message, setMessage] = useState('');
  const [activeTab, setActiveTab] = useState<ProductId>('vizara_ar');
  const dateLocale = toDateLocale(locale);

  const load = useCallback(async () => {
    if (!currentOrg) return;
    setPageLoading(true);
    try {
      setBilling(await api.getBillingStatus(currentOrg.id));
    } catch (err) {
      showToast(err instanceof Error ? err.message : t('common.loadError'), 'error');
    } finally {
      setPageLoading(false);
    }
  }, [currentOrg, showToast, t]);

  useEffect(() => { load(); }, [load]);

  useEffect(() => {
    const productParam = searchParams.get('product');
    if (productParam === 'vizara_tour' || productParam === 'vizara_ar') {
      setActiveTab(productParam);
    }
    if (searchParams.get('success') === 'true') {
      setMessage(t('billing.paymentSuccess'));
      refreshUser();
      load();
    }
    if (searchParams.get('canceled') === 'true') setMessage(t('billing.paymentCanceled'));
    const planParam = searchParams.get('plan');
    if (planParam && isValidPlanId(planParam)) {
      setMessage(t('billing.selectPlanMsg', { plan: getPlanName(planParam) }));
    }
  }, [searchParams, refreshUser, load, t, getPlanName]);

  const handleSelectPlan = async (planId: PlanId, product: ProductId) => {
    if (!currentOrg) return;
    setLoading(true);
    setMessage('');
    try {
      const result = await api.createCheckout(currentOrg.id, planId, product);
      if (result.url) window.location.href = result.url;
      else if (result.demo) {
        setMessage(result.message || t('billing.demoActivatedMsg', { plan: getPlanName(planId) }));
        showToast(t('billing.planActivated'));
        refreshUser();
        load();
      }
    } catch (err) {
      setMessage(err instanceof Error ? err.message : t('common.loadError'));
    } finally {
      setLoading(false);
    }
  };

  const handleDemoActivate = async (planId: PlanId, product: ProductId) => {
    if (!currentOrg) return;
    setLoading(true);
    try {
      const result = await api.activateDemo(currentOrg.id, planId, product);
      const planName = result.plan.id && isValidPlanId(result.plan.id)
        ? getPlanName(result.plan.id)
        : getPlanName(planId);
      setMessage(t('billing.demoActivatedMsg', { plan: planName }));
      showToast(t('billing.demoActivated'));
      refreshUser();
      load();
    } catch (err) {
      setMessage(err instanceof Error ? err.message : t('common.loadError'));
    } finally {
      setLoading(false);
    }
  };

  if (!currentOrg) return null;
  if (pageLoading) return <div className="page-content"><LoadingSpinner label={t('common.loading')} /></div>;

  const ar = billing?.ar;
  const tour = billing?.tour;
  const arActive = ar?.subscriptionActive ?? false;
  const tourActive = tour?.subscriptionActive ?? false;
  const currentProduct = activeTab === 'vizara_ar' ? ar : tour;
  const isActive = currentProduct?.subscriptionActive ?? false;
  const currentPlanId = (currentProduct?.subscription?.planId || currentProduct?.plan?.id) as PlanId | undefined;
  const activePlanName = currentProduct?.plan?.id && isValidPlanId(currentProduct.plan.id)
    ? getPlanName(currentProduct.plan.id)
    : '';

  const tabs: { id: ProductId; label: string; icon: typeof Box; active: boolean }[] = [
    { id: 'vizara_ar', label: 'VizaraAR', icon: Box, active: arActive },
    { id: 'vizara_tour', label: 'VizaraTour', icon: Map, active: tourActive },
  ];

  return (
    <div className="page-content !max-w-none overflow-x-hidden">
      <PageHeader title={t('billing.title')} description={currentOrg.name} />

      {message && <div className="alert alert-info mb-5">{message}</div>}

      <div className="flex gap-2 mb-6 p-1 rounded-xl bg-black/[0.04]">
        {tabs.map(({ id, label, icon: Icon, active }) => (
          <button
            key={id}
            type="button"
            onClick={() => setActiveTab(id)}
            className={`flex-1 flex items-center justify-center gap-2 px-3 py-2.5 rounded-lg text-sm font-semibold transition-colors ${
              activeTab === id ? 'bg-white shadow-sm text-[var(--color-ink)]' : 'text-secondary hover:text-[var(--color-ink)]'
            }`}
          >
            <Icon className="w-4 h-4" />
            {label}
            <span className={`w-2 h-2 rounded-full ${active ? 'bg-[#34c759]' : 'bg-[#ff3b30]'}`} />
          </button>
        ))}
      </div>

      <div className={`glass-liquid flex flex-col sm:flex-row sm:items-center gap-3 p-4 rounded-[var(--radius-lg)] mb-6`} style={{
        background: isActive
          ? 'linear-gradient(145deg, rgba(52,199,89,0.12), rgba(255,255,255,0.72))'
          : 'linear-gradient(145deg, rgba(255,59,48,0.08), rgba(255,255,255,0.72))',
      }}>
        {isActive ? <CheckCircle className="w-5 h-5 shrink-0" style={{ color: '#34c759' }} /> : <XCircle className="w-5 h-5 shrink-0" style={{ color: '#ff3b30' }} />}
        <div className="flex-1">
          <p className="text-sm font-semibold">
            {isActive
              ? t('billing.activePlan', { plan: activePlanName, price: currentProduct?.plan?.price ?? 0 })
              : t('billing.noActivePlanProduct', { product: activeTab === 'vizara_ar' ? 'VizaraAR' : 'VizaraTour' })}
          </p>
          {currentProduct?.subscription?.currentPeriodEnd && isActive && (
            <p className="text-xs opacity-70 mt-0.5">
              {t('billing.nextPayment')}: {new Date(currentProduct.subscription.currentPeriodEnd).toLocaleDateString(dateLocale)}
            </p>
          )}
        </div>
      </div>

      {activeTab === 'vizara_ar' && ar?.usage && ar?.plan && (
        <div className="card p-5 mb-8">
          <h3 className="text-sm font-semibold mb-4">{t('billing.usage')} — VizaraAR</h3>
          <div className="space-y-4">
            <UsageBar label={t('billing.usageModels')} used={ar.usage.models} max={ar.plan.maxModels ?? 0} />
            <UsageBar label={t('billing.usageExperiences')} used={ar.usage.experiences} max={ar.plan.maxExperiences ?? 0} />
          </div>
          <div className="grid grid-cols-2 gap-3 mt-5 pt-4 divider">
            <div><p className="text-xs text-secondary">{t('billing.fileLimit')}</p><p className="font-bold">{ar.plan.maxFileSizeMB === -1 ? t('models.unlimitedSize') : `${ar.plan.maxFileSizeMB} MB`}</p></div>
            <div><p className="text-xs text-secondary">{t('billing.modelAr')}</p><p className="font-bold">{ar.plan.features.modelAR ? t('common.available') : t('common.unavailable')}</p></div>
          </div>
        </div>
      )}

      {activeTab === 'vizara_tour' && tour?.usage && tour?.plan && (
        <div className="card p-5 mb-8">
          <h3 className="text-sm font-semibold mb-4">{t('billing.usage')} — VizaraTour</h3>
          <div className="space-y-4">
            <UsageBar label={t('billing.usageTours')} used={tour.usage.tours} max={tour.plan.maxTours ?? 0} />
          </div>
        </div>
      )}

      <div className="billing-scroll-wrap">
        <PricingCards
          product={activeTab}
          mode="billing"
          currentPlanId={currentPlanId}
          isActive={isActive}
          loading={loading}
          onSelectPlan={handleSelectPlan}
          onDemoActivate={handleDemoActivate}
          showDemo={!billing?.stripeConfigured || billing?.demoMode}
        />
      </div>
    </div>
  );
}
