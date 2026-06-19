import { useState, type FormEvent } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { useAuth } from '../lib/auth-context';
import { useI18n } from '../lib/i18n-context';
import { AuthLayout } from '../components/ui/AuthLayout';
import { isValidPlanId, getPlan } from '../lib/plans';

export function Register() {
  const { register } = useAuth();
  const { t, getPlanName } = useI18n();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const planParam = searchParams.get('plan');
  const selectedPlan = planParam && isValidPlanId(planParam) ? planParam : null;

  const [form, setForm] = useState({ name: '', email: '', password: '', organizationName: '' });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      await register({
        ...form,
        email: form.email.trim().toLowerCase(),
        name: form.name.trim(),
        organizationName: form.organizationName.trim(),
      });
      navigate(selectedPlan ? `/dashboard/billing?plan=${selectedPlan}` : '/dashboard/billing');
    } catch (err) {
      setError(err instanceof Error ? err.message : t('errors.registerFailed'));
    } finally {
      setLoading(false);
    }
  };

  const fields = [
    { key: 'name', label: t('auth.name'), type: 'text', auto: 'name', ph: t('auth.placeholderName') },
    { key: 'organizationName', label: t('auth.orgName'), type: 'text', auto: 'organization', ph: t('auth.placeholderOrg') },
    { key: 'email', label: t('auth.email'), type: 'email', auto: 'email', ph: t('auth.placeholderEmail') },
    { key: 'password', label: t('auth.passwordHint'), type: 'password', auto: 'new-password', ph: '••••••••' },
  ] as const;

  return (
    <AuthLayout title={t('auth.registerTitle')} subtitle={t('auth.registerSubtitle')}>
      {selectedPlan && (
        <div className="badge mb-5 w-full justify-center py-2">
          {t('auth.selectedPlan')}: {getPlanName(selectedPlan)} · ${getPlan(selectedPlan).price}{t('common.perMonth')}
        </div>
      )}
      {error && <div className="alert alert-error mb-4">{error}</div>}
      <form onSubmit={handleSubmit} className="space-y-4">
        {fields.map(({ key, label, type, auto, ph }) => (
          <div key={key}>
            <label className="label">{label}</label>
            <input
              type={type}
              autoComplete={auto}
              inputMode={type === 'email' ? 'email' : undefined}
              placeholder={ph}
              value={form[key]}
              onChange={(e) => setForm({ ...form, [key]: e.target.value })}
              required
              minLength={key === 'password' ? 6 : undefined}
              className="input"
            />
          </div>
        ))}
        <button type="submit" disabled={loading} className="btn btn-primary w-full">
          {loading ? t('auth.registerLoading') : t('auth.registerBtn')}
        </button>
      </form>
      <p className="text-center text-sm text-secondary mt-6">
        {t('auth.hasAccount')}{' '}
        <Link to="/login" className="font-semibold hover:underline" style={{ color: 'var(--brand)' }}>{t('auth.loginBtn')}</Link>
      </p>
    </AuthLayout>
  );
}
