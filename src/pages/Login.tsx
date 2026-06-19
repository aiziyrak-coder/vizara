import { useState, type FormEvent } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../lib/auth-context';
import { useI18n } from '../lib/i18n-context';
import { AuthLayout } from '../components/ui/AuthLayout';

export function Login() {
  const { login } = useAuth();
  const { t } = useI18n();
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      await login(email.trim().toLowerCase(), password);
      navigate('/dashboard');
    } catch (err) {
      setError(err instanceof Error ? err.message : t('errors.loginFailed'));
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthLayout title={t('auth.loginTitle')} subtitle={t('auth.loginSubtitle')}>
      {error && <div className="alert alert-error mb-4">{error}</div>}
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="label">{t('auth.email')}</label>
          <input type="email" inputMode="email" autoComplete="email" value={email} onChange={(e) => setEmail(e.target.value)} required className="input" placeholder={t('auth.placeholderEmail')} />
        </div>
        <div>
          <label className="label">{t('auth.password')}</label>
          <input type="password" autoComplete="current-password" value={password} onChange={(e) => setPassword(e.target.value)} required className="input" placeholder="••••••••" />
        </div>
        <button type="submit" disabled={loading} className="btn btn-primary w-full">
          {loading ? t('auth.loginLoading') : t('auth.loginBtn')}
        </button>
      </form>
      <p className="text-center text-sm text-secondary mt-6">
        {t('auth.noAccount')}{' '}
        <Link to="/register" className="font-semibold hover:underline" style={{ color: 'var(--brand)' }}>{t('nav.register')}</Link>
      </p>
    </AuthLayout>
  );
}
