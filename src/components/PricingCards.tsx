import { AR_PLAN_LIST, TOUR_PLAN_LIST, type PlanId, type ProductId } from '../lib/plans';
import { Link } from 'react-router-dom';
import { Check } from 'lucide-react';
import { useI18n } from '../lib/i18n-context';

interface PricingCardsProps {
  product: ProductId;
  mode?: 'landing' | 'billing';
  currentPlanId?: PlanId | null;
  isActive?: boolean;
  loading?: boolean;
  onSelectPlan?: (planId: PlanId, product: ProductId) => void;
  onDemoActivate?: (planId: PlanId, product: ProductId) => void;
  showDemo?: boolean;
}

export function PricingCards({
  product,
  mode = 'landing',
  currentPlanId,
  isActive = false,
  loading = false,
  onSelectPlan,
  onDemoActivate,
  showDemo = false,
}: PricingCardsProps) {
  const { t, getPlanName, getPlanDescription, getPlanFeatures } = useI18n();
  const isLanding = mode === 'landing';
  const planList = product === 'vizara_ar' ? AR_PLAN_LIST : TOUR_PLAN_LIST;

  return (
    <div
      className={
        isLanding
          ? 'grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4'
          : 'scroll-row md:gap-5'
      }
    >
      {planList.map((plan) => {
        const isCurrent = isActive && currentPlanId === plan.id;
        const features = getPlanFeatures(plan.id);

        return (
          <div
            key={plan.id}
            className={`card p-5 sm:p-6 flex flex-col relative h-full min-w-0 ${
              plan.highlight ? 'pricing-highlight' : ''
            } ${isCurrent ? 'pricing-current' : ''}`}
          >
            {plan.highlight && (
              <span className="absolute -top-2.5 left-4 text-[11px] font-semibold text-white px-2.5 py-0.5 rounded-full" style={{ background: product === 'vizara_tour' ? 'linear-gradient(180deg, #818cf8, #4f46e5)' : 'linear-gradient(180deg, #22b5ad, var(--brand))' }}>
                {t('billing.popular')}
              </span>
            )}

            <h3 className="font-bold text-lg tracking-tight">{getPlanName(plan.id)}</h3>
            <p className="text-xs text-secondary mt-1 mb-4 leading-relaxed">{getPlanDescription(plan.id)}</p>

            <div className="mb-4">
              <span className="text-3xl font-bold tracking-tight">${plan.price}</span>
              <span className="text-secondary text-sm">{t('common.perMonth')}</span>
            </div>

            <ul className="space-y-2 mb-6 flex-1 text-sm text-secondary">
              {features.slice(0, isLanding ? 5 : features.length).map((f) => (
                <li key={f} className="flex items-start gap-2">
                  <Check className="w-4 h-4 shrink-0 mt-0.5" style={{ color: product === 'vizara_tour' ? '#6366f1' : 'var(--brand)' }} />
                  <span>{f}</span>
                </li>
              ))}
              {isLanding && features.length > 5 && (
                <li className="text-xs font-medium pl-6" style={{ color: product === 'vizara_tour' ? '#6366f1' : 'var(--brand)' }}>
                  {t('billing.moreFeatures', { count: features.length - 5 })}
                </li>
              )}
            </ul>

            {isLanding ? (
              <Link
                to={`/register?plan=${plan.id}&product=${product}`}
                className={`btn w-full ${plan.highlight ? 'btn-primary' : 'btn-secondary'}`}
              >
                {plan.price === 5 ? t('billing.tryFree') : t('billing.start')}
              </Link>
            ) : (
              <div className="space-y-2">
                {!isCurrent && (
                  <button
                    type="button"
                    onClick={() => onSelectPlan?.(plan.id, product)}
                    disabled={loading}
                    className={`btn w-full ${plan.highlight ? 'btn-primary' : 'btn-secondary'}`}
                  >
                    {loading ? '...' : `$${plan.price}${t('common.perMonth')}`}
                  </button>
                )}
                {showDemo && !isCurrent && (
                  <button
                    type="button"
                    onClick={() => onDemoActivate?.(plan.id, product)}
                    disabled={loading}
                    className="btn btn-ghost w-full text-xs text-secondary"
                  >
                    {t('billing.demoFree')}
                  </button>
                )}
                {isCurrent && (
                  <p className="text-center text-sm font-semibold py-1" style={{ color: 'var(--brand)' }}>{t('billing.currentPlan')}</p>
                )}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}
