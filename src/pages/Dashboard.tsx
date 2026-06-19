import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../lib/auth-context';
import { useI18n } from '../lib/i18n-context';
import { api, BillingStatus } from '../lib/api';
import { useToast } from '../lib/toast-context';
import { isProductActive } from '../lib/subscription';
import { isValidPlanId } from '../lib/plans';
import { Box, QrCode, CreditCard, ArrowRight, Sparkles, Map } from 'lucide-react';
import { PageHeader } from '../components/ui/PageHeader';
import { LoadingSpinner } from '../components/ui/LoadingSpinner';

export function Dashboard() {
  const { currentOrg, user } = useAuth();
  const { t, getPlanName } = useI18n();
  const { showToast } = useToast();
  const [stats, setStats] = useState({ models: 0, experiences: 0, tours: 0 });
  const [billing, setBilling] = useState<BillingStatus | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!currentOrg) return;
    setLoading(true);
    Promise.all([
      api.getModels(currentOrg.id),
      api.getExperiences(currentOrg.id),
      api.getTours(currentOrg.id),
      api.getBillingStatus(currentOrg.id),
    ])
      .then(([models, experiences, tours, bill]) => {
        setStats({ models: models.length, experiences: experiences.length, tours: tours.length });
        setBilling(bill);
      })
      .catch((err) => {
        showToast(err instanceof Error ? err.message : t('common.loadError'), 'error');
      })
      .finally(() => setLoading(false));
  }, [currentOrg, showToast, t]);

  if (!currentOrg) return <div className="page-content text-secondary">{t('dashboard.noOrg')}</div>;
  if (loading) return <div className="page-content"><LoadingSpinner label={t('common.loading')} /></div>;

  const arActive = billing?.ar?.subscriptionActive ?? isProductActive(currentOrg, 'vizara_ar');
  const tourActive = billing?.tour?.subscriptionActive ?? isProductActive(currentOrg, 'vizara_tour');
  const allDone = arActive && stats.models > 0 && stats.experiences > 0;

  const arPlanId = billing?.ar?.plan?.id;
  const tourPlanId = billing?.tour?.plan?.id;
  const arPlanLabel = arActive && arPlanId && isValidPlanId(arPlanId) ? getPlanName(arPlanId) : t('dashboard.inactive');
  const tourPlanLabel = tourActive && tourPlanId && isValidPlanId(tourPlanId) ? getPlanName(tourPlanId) : t('dashboard.inactive');

  return (
    <div className="page-content">
      <PageHeader
        title={t('dashboard.greeting', { name: user?.name?.split(' ')[0] || '' })}
        description={t('dashboard.desc')}
      />

      {(!arActive || !tourActive) && (
        <div className="alert alert-warning flex flex-col sm:flex-row sm:items-center gap-3 mb-6">
          <div className="flex-1">
            <p className="font-semibold">{t('dashboard.planInactive')}</p>
            <p className="text-sm opacity-90 mt-0.5">{t('dashboard.planInactiveDesc')}</p>
          </div>
          <Link to="/dashboard/billing" className="btn btn-primary text-sm w-full sm:w-auto shrink-0">{t('common.activate')}</Link>
        </div>
      )}

      {allDone && (
        <div className="alert alert-info flex items-center gap-3 mb-6">
          <Sparkles className="w-5 h-5 shrink-0" />
          <p className="text-sm font-medium">{t('dashboard.allDone')}</p>
        </div>
      )}

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 mb-6">
        {[
          { label: t('dashboard.statModels'), value: stats.models, icon: Box, to: '/dashboard/models', accent: 'var(--brand)' },
          { label: t('dashboard.statExperiences'), value: stats.experiences, icon: QrCode, to: '/dashboard/experiences', accent: 'var(--brand)' },
          { label: t('nav.tours'), value: stats.tours, icon: Map, to: '/dashboard/tours', accent: '#6366f1' },
          { label: 'VizaraAR', value: arPlanLabel, icon: CreditCard, to: '/dashboard/billing', accent: arActive ? '#34c759' : '#ff3b30' },
        ].map(({ label, value, icon: Icon, to, accent }) => (
          <Link key={label} to={to} className="card card-hover p-4 flex items-center gap-3">
            <div className="icon-glass w-10 h-10 shrink-0" style={{ color: accent }}><Icon className="w-5 h-5" /></div>
            <div className="min-w-0">
              <p className="text-xs text-secondary truncate">{label}</p>
              <p className="font-bold text-lg leading-tight truncate">{value}</p>
            </div>
            <ArrowRight className="w-4 h-4 text-secondary shrink-0 ml-auto" />
          </Link>
        ))}
      </div>

      <div className="card p-4 flex items-center justify-between gap-3">
        <div>
          <p className="text-sm font-semibold">VizaraTour</p>
          <p className="text-xs text-secondary mt-0.5">{tourPlanLabel}</p>
        </div>
        <Link to="/dashboard/billing?product=vizara_tour" className="btn btn-secondary text-sm">{t('common.activate')}</Link>
      </div>
    </div>
  );
}
