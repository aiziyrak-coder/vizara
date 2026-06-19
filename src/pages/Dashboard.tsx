import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../lib/auth-context';
import { useI18n } from '../lib/i18n-context';
import { api, BillingStatus } from '../lib/api';
import { useToast } from '../lib/toast-context';
import { isSubscriptionActive } from '../lib/subscription';
import { isValidPlanId } from '../lib/plans';
import { Box, QrCode, CreditCard, ArrowRight, Sparkles } from 'lucide-react';
import { PageHeader } from '../components/ui/PageHeader';
import { LoadingSpinner } from '../components/ui/LoadingSpinner';

export function Dashboard() {
  const { currentOrg, user } = useAuth();
  const { t, getPlanName } = useI18n();
  const { showToast } = useToast();
  const [stats, setStats] = useState({ models: 0, experiences: 0 });
  const [billing, setBilling] = useState<BillingStatus | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!currentOrg) return;
    setLoading(true);
    Promise.all([
      api.getModels(currentOrg.id),
      api.getExperiences(currentOrg.id),
      api.getBillingStatus(currentOrg.id),
    ])
      .then(([models, experiences, bill]) => {
        setStats({ models: models.length, experiences: experiences.length });
        setBilling(bill);
      })
      .catch((err) => {
        showToast(err instanceof Error ? err.message : t('common.loadError'), 'error');
      })
      .finally(() => setLoading(false));
  }, [currentOrg, showToast, t]);

  if (!currentOrg) return <div className="page-content text-secondary">{t('dashboard.noOrg')}</div>;
  if (loading) return <div className="page-content"><LoadingSpinner label={t('common.loading')} /></div>;

  const subActive = billing?.subscriptionActive ?? isSubscriptionActive(billing?.subscription);
  const allDone = subActive && stats.models > 0 && stats.experiences > 0;
  const planId = billing?.plan?.id;
  const planLabel = subActive && planId && isValidPlanId(planId)
    ? getPlanName(planId)
    : subActive
      ? t('dashboard.active')
      : t('dashboard.inactive');

  return (
    <div className="page-content">
      <PageHeader
        title={t('dashboard.greeting', { name: user?.name?.split(' ')[0] || '' })}
        description={t('dashboard.desc')}
      />

      {!subActive && (
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

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mb-6">
        {[
          { label: t('dashboard.statModels'), value: stats.models, icon: Box, to: '/dashboard/models', accent: 'var(--brand)' },
          { label: t('dashboard.statExperiences'), value: stats.experiences, icon: QrCode, to: '/dashboard/experiences', accent: 'var(--brand)' },
          { label: t('dashboard.statSubscription'), value: planLabel, icon: CreditCard, to: '/dashboard/billing', accent: subActive ? '#34c759' : '#ff3b30' },
        ].map(({ label, value, icon: Icon, to, accent }) => (
          <Link key={label} to={to} className="card card-hover p-4 sm:p-5">
            <Icon className="w-5 h-5 mb-2" style={{ color: accent }} />
            <p className="stat-value text-lg sm:text-2xl lg:text-[28px] truncate" title={String(value)}>{value}</p>
            <p className="text-sm text-secondary mt-1 flex items-center gap-1">{label}<ArrowRight className="w-3.5 h-3.5 opacity-40" /></p>
          </Link>
        ))}
      </div>

      <div className="card p-5 sm:p-6">
        <h2 className="font-semibold mb-1">{t('dashboard.quickStart')}</h2>
        <p className="text-xs text-secondary mb-5">{t('dashboard.quickStartDesc')}</p>
        <ol className="space-y-1">
          {[
            { n: 1, text: t('dashboard.step1'), to: '/dashboard/billing', done: subActive },
            { n: 2, text: t('dashboard.step2'), to: '/dashboard/models', done: stats.models > 0 },
            { n: 3, text: t('dashboard.step3'), to: '/dashboard/experiences', done: stats.experiences > 0 },
            { n: 4, text: t('dashboard.step4'), to: '/dashboard/settings', done: Boolean(currentOrg.website) },
          ].map(({ n, text, to, done }) => (
            <li key={n}>
              <Link to={to} className="flex items-center gap-3 text-sm py-2.5 px-2 -mx-2 rounded-[var(--radius)] hover:bg-black/[0.03] active:scale-[0.99] transition-all">
                <span
                  className="w-7 h-7 rounded-full text-xs font-bold flex items-center justify-center shrink-0 transition-all"
                  style={done
                    ? { background: 'var(--brand)', color: 'white' }
                    : { background: 'rgba(27,163,156,0.1)', color: 'var(--brand)' }}
                >
                  {done ? '✓' : n}
                </span>
                <span className={`font-medium flex-1 ${done ? 'text-secondary line-through' : ''}`}>{text}</span>
                {!done && <ArrowRight className="w-4 h-4 opacity-30" />}
              </Link>
            </li>
          ))}
        </ol>
        {currentOrg.slug && (
          <div className="mt-5 pt-4 divider">
            <p className="text-xs text-secondary mb-1">{t('dashboard.arFormat')}</p>
            <code className="code text-xs break-all">/ar/{currentOrg.slug}/[tajriba-slug]</code>
          </div>
        )}
      </div>
    </div>
  );
}
