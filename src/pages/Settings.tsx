import { useEffect, useState, type FormEvent } from 'react';
import { useAuth } from '../lib/auth-context';
import { useI18n } from '../lib/i18n-context';
import { api } from '../lib/api';
import { useToast } from '../lib/toast-context';
import { Save, Palette, Link as LinkIcon } from 'lucide-react';
import { PageHeader } from '../components/ui/PageHeader';
import { LoadingSpinner } from '../components/ui/LoadingSpinner';

export function Settings() {
  const { currentOrg, refreshUser } = useAuth();
  const { t } = useI18n();
  const { showToast } = useToast();
  const [form, setForm] = useState({ name: '', website: '', brandColor: '#1ba39c' });
  const [loading, setLoading] = useState(false);
  const [initialLoading, setInitialLoading] = useState(true);
  const [canBrand, setCanBrand] = useState(false);

  useEffect(() => {
    if (!currentOrg) return;
    setForm({
      name: currentOrg.name,
      website: currentOrg.website || '',
      brandColor: currentOrg.brandColor || '#1ba39c',
    });
    api.getBillingStatus(currentOrg.id)
      .then((b) => setCanBrand(b.plan?.features?.customBranding ?? false))
      .finally(() => setInitialLoading(false));
  }, [currentOrg]);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!currentOrg) return;
    setLoading(true);
    try {
      await api.updateOrganization(currentOrg.id, {
        name: form.name,
        website: form.website || undefined,
        ...(canBrand ? { brandColor: form.brandColor } : {}),
      });
      await refreshUser();
      showToast(t('settings.saved'));
    } catch (err) {
      showToast(err instanceof Error ? err.message : t('common.loadError'), 'error');
    } finally {
      setLoading(false);
    }
  };

  if (!currentOrg) return null;
  if (initialLoading) return <div className="page-content"><LoadingSpinner label={t('common.loading')} /></div>;

  return (
    <div className="page-content w-full max-w-lg mx-auto">
      <PageHeader title={t('settings.title')} description={t('settings.desc')} />

      <div className="card p-4 mb-6 flex items-center gap-4">
        <div className="w-12 h-12 rounded-xl flex items-center justify-center text-white shrink-0" style={{ backgroundColor: form.brandColor }}>
          <span className="text-lg font-bold">{form.name.charAt(0).toUpperCase()}</span>
        </div>
        <div className="min-w-0">
          <p className="font-semibold text-[#0f172a] truncate">{form.name || t('settings.orgDefault')}</p>
          <p className="text-xs text-secondary truncate">{form.website || t('settings.noWebsite')}</p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="card p-5 sm:p-6 space-y-5">
        <div>
          <label className="label">{t('settings.orgName')}</label>
          <input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} required className="input" />
        </div>

        <div>
          <label className="label flex items-center gap-1.5"><LinkIcon className="w-3.5 h-3.5" /> {t('settings.website')}</label>
          <input type="text" inputMode="url" autoComplete="url" value={form.website} onChange={(e) => setForm({ ...form, website: e.target.value })} placeholder="example.com" className="input" />
        </div>

        <div>
          <label className="label flex items-center gap-1.5"><Palette className="w-3.5 h-3.5" /> {t('settings.brandColor')}</label>
          <div className="flex flex-col sm:flex-row sm:items-center gap-3">
            <input type="color" value={form.brandColor} onChange={(e) => setForm({ ...form, brandColor: e.target.value })} disabled={!canBrand} className="w-12 h-12 rounded-xl border border-[#e2e8f0] p-1 cursor-pointer disabled:opacity-40 shrink-0 self-start" />
            <input value={form.brandColor} onChange={(e) => setForm({ ...form, brandColor: e.target.value })} disabled={!canBrand} className="input w-full min-w-0 disabled:opacity-40" />
          </div>
          {!canBrand && (
            <p className="text-xs text-amber-700 mt-2">
              {t('settings.brandLocked')}
            </p>
          )}
        </div>

        <div>
          <p className="label">{t('settings.slug')}</p>
          <code className="code text-sm">{currentOrg.slug}</code>
          <p className="text-xs text-secondary mt-2">{t('settings.arPath')}: <code className="code text-xs">/ar/{currentOrg.slug}/[slug]</code></p>
        </div>

        <button type="submit" disabled={loading} className="btn btn-primary w-full sm:w-auto">
          <Save className="w-4 h-4" />
          {loading ? t('common.saving') : t('common.save')}
        </button>
      </form>
    </div>
  );
}
