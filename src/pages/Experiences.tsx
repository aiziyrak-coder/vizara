import { useEffect, useState, type FormEvent } from 'react';
import { useAuth } from '../lib/auth-context';
import { useI18n } from '../lib/i18n-context';
import { api, Experience, Model3D, ApiError, BillingStatus } from '../lib/api';
import { useToast } from '../lib/toast-context';
import { isSubscriptionActive } from '../lib/subscription';
import { Plus, QrCode, Trash2, ExternalLink, RefreshCw, AlertCircle, Share2 } from 'lucide-react';
import { Link } from 'react-router-dom';
import { PageHeader } from '../components/ui/PageHeader';
import { LoadingSpinner } from '../components/ui/LoadingSpinner';
import { EmptyState } from '../components/ui/EmptyState';
import { resolveUploadUrl } from '../lib/assets';

export function Experiences() {
  const { currentOrg } = useAuth();
  const { t } = useI18n();
  const { showToast } = useToast();
  const [experiences, setExperiences] = useState<Experience[]>([]);
  const [models, setModels] = useState<Model3D[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ name: '', type: 'photo_zone', modelId: '' });
  const [loading, setLoading] = useState(false);
  const [pageLoading, setPageLoading] = useState(true);
  const [error, setError] = useState('');
  const [billing, setBilling] = useState<BillingStatus | null>(null);
  const [busyId, setBusyId] = useState<string | null>(null);

  const load = async () => {
    if (!currentOrg) return;
    setPageLoading(true);
    try {
      const [exps, mods, bill] = await Promise.all([
        api.getExperiences(currentOrg.id),
        api.getModels(currentOrg.id),
        api.getBillingStatus(currentOrg.id),
      ]);
      setExperiences(exps);
      setModels(mods);
      setBilling(bill);
    } catch (err) {
      showToast(err instanceof Error ? err.message : t('common.loadError'), 'error');
    } finally {
      setPageLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, [currentOrg]);

  const canUseModelAR = billing?.plan?.features?.modelAR ?? false;
  const subActive = billing?.subscriptionActive ?? isSubscriptionActive(billing?.subscription);

  const handleCreate = async (e: FormEvent) => {
    e.preventDefault();
    if (!currentOrg) return;
    setLoading(true);
    setError('');
    try {
      await api.createExperience(currentOrg.id, {
        name: form.name,
        type: form.type,
        modelId: form.modelId || undefined,
        config: form.type === 'photo_zone' ? {
          title: currentOrg.name,
          website: currentOrg.website || 'vizara.app',
          brandColor: currentOrg.brandColor,
        } : undefined,
      });
      setForm({ name: '', type: 'photo_zone', modelId: '' });
      setShowForm(false);
      showToast(t('experiences.created'));
      load();
    } catch (err) {
      const msg = err instanceof ApiError ? err.message : err instanceof Error ? err.message : t('common.loadError');
      setError(msg);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (expId: string) => {
    if (!currentOrg || !confirm(t('experiences.confirmDelete'))) return;
    setBusyId(expId);
    try {
      await api.deleteExperience(currentOrg.id, expId);
      showToast(t('experiences.deleted'));
      load();
    } catch (err) {
      showToast(err instanceof Error ? err.message : t('models.deleteError'), 'error');
    } finally {
      setBusyId(null);
    }
  };

  const handleRegenerateQR = async (expId: string) => {
    if (!currentOrg) return;
    setBusyId(expId);
    try {
      await api.regenerateQR(currentOrg.id, expId);
      showToast(t('experiences.qrUpdated'));
      load();
    } catch (err) {
      showToast(err instanceof Error ? err.message : t('common.loadError'), 'error');
    } finally {
      setBusyId(null);
    }
  };

  const copyLink = async (url: string) => {
    try {
      await navigator.clipboard.writeText(url);
      showToast(t('experiences.linkCopied'));
    } catch {
      showToast(t('experiences.copyFailed'), 'error');
    }
  };

  const shareLink = async (title: string, url: string) => {
    if (navigator.share) {
      try {
        await navigator.share({ title, url });
        return;
      } catch {
        /* cancelled */
      }
    }
    copyLink(url);
  };

  if (!currentOrg) return null;

  if (pageLoading) {
    return <div className="page-content"><LoadingSpinner label={t('common.loading')} /></div>;
  }

  return (
    <div className="page-content">
      <PageHeader
        title={t('experiences.title')}
        description={t('experiences.desc')}
        action={
          <button onClick={() => setShowForm(!showForm)} className="btn btn-primary w-full sm:w-auto">
            <Plus className="w-4 h-4" />
            {showForm ? t('experiences.close') : t('experiences.new')}
          </button>
        }
      />

      {!subActive && (
        <div className="alert alert-warning mb-5">
          <p className="font-semibold">{t('experiences.activateFirst')}</p>
          <Link to="/dashboard/billing" className="text-sm font-semibold text-amber-800 underline mt-1 inline-block">
            {t('common.goToBilling')}
          </Link>
        </div>
      )}

      {error && (
        <div className="alert alert-error mb-5 flex items-start gap-3">
          <AlertCircle className="w-5 h-5 shrink-0" />
          <div>
            {error}
            {(error.includes('obuna') || error.includes('tarif') || error.includes('subscription') || error.includes('plan')) && (
              <Link to="/dashboard/billing" className="block mt-1 font-semibold text-sm hover:underline" style={{ color: 'var(--brand)' }}>
                {t('common.activatePlan')} →
              </Link>
            )}
          </div>
        </div>
      )}

      {showForm && (
        <form onSubmit={handleCreate} className="card p-4 sm:p-6 mb-6 space-y-4">
          <div>
            <label className="label">{t('experiences.name')}</label>
            <input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} required placeholder={t('experiences.namePh')} className="input" />
          </div>
          <div>
            <label className="label">{t('experiences.type')}</label>
            <select value={form.type} onChange={(e) => setForm({ ...form, type: e.target.value, modelId: '' })} className="input">
              <option value="photo_zone">{t('experiences.typePhoto')}</option>
              <option value="model_ar" disabled={!canUseModelAR}>
                {canUseModelAR ? t('experiences.typeModelAr') : t('experiences.typeModelArLocked')}
              </option>
            </select>
            {!canUseModelAR && (
              <p className="text-xs text-amber-700 mt-1.5">
                {t('experiences.modelArHint')}
              </p>
            )}
          </div>
          {(form.type === 'model_ar' || (form.type === 'photo_zone' && canUseModelAR)) && (
            <div>
              <label className="label">{t('experiences.model')}</label>
              <select
                value={form.modelId}
                onChange={(e) => setForm({ ...form, modelId: e.target.value })}
                required={form.type === 'model_ar'}
                className="input"
              >
                <option value="">{t('experiences.selectModel')}</option>
                {models.map((m) => <option key={m.id} value={m.id}>{m.name}</option>)}
              </select>
              {models.length === 0 && (
                <p className="text-xs text-amber-700 mt-1.5">
                  {t('experiences.uploadModelFirst')}
                </p>
              )}
            </div>
          )}
          <div className="flex flex-col sm:flex-row gap-3 pt-1">
            <button type="submit" disabled={loading || !subActive} className="btn btn-primary w-full sm:w-auto">
              {loading ? t('experiences.creating') : t('experiences.create')}
            </button>
            <button type="button" onClick={() => setShowForm(false)} className="btn btn-secondary w-full sm:w-auto">{t('common.cancel')}</button>
          </div>
        </form>
      )}

      {experiences.length === 0 ? (
        <EmptyState
          icon={QrCode}
          title={t('experiences.emptyTitle')}
          description={t('experiences.emptyDesc')}
          action={subActive ? (
            <button onClick={() => setShowForm(true)} className="btn btn-primary">
              <Plus className="w-4 h-4" /> {t('experiences.firstCreate')}
            </button>
          ) : (
            <Link to="/dashboard/billing" className="btn btn-primary">{t('common.activatePlan')}</Link>
          )}
        />
      ) : (
        <div className="space-y-4">
          {experiences.map((exp) => {
            const arUrl = `${window.location.origin}/ar/${currentOrg.slug}/${exp.slug}`;
            const arPath = `/ar/${currentOrg.slug}/${exp.slug}`;
            const isBusy = busyId === exp.id;
            return (
              <div key={exp.id} className="card overflow-hidden">
                <div className="p-4 flex items-start justify-between gap-2 border-b border-[#e2e8f0]">
                  <div className="min-w-0 flex-1">
                    <p className="font-semibold truncate">{exp.name}</p>
                    <p className="text-xs text-secondary mt-0.5">
                      {exp.type === 'model_ar' ? t('experiences.type3d') : t('experiences.typePhotoShort')} · /{exp.slug}
                    </p>
                  </div>
                  <div className="flex gap-0.5 shrink-0">
                    <button
                      onClick={() => handleRegenerateQR(exp.id)}
                      disabled={isBusy}
                      className="icon-btn text-[#94a3b8] hover:text-teal-600 hover:bg-teal-50 disabled:opacity-40"
                      title={t('experiences.qrRegen')}
                    >
                      <RefreshCw className={`w-4 h-4 ${isBusy ? 'animate-spin' : ''}`} />
                    </button>
                    <button
                      onClick={() => handleDelete(exp.id)}
                      disabled={isBusy}
                      className="icon-btn text-[#94a3b8] hover:text-red-500 hover:bg-red-50 disabled:opacity-40"
                      aria-label={t('common.delete')}
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
                {exp.qrCodeUrl && (
                  <div className="p-4 bg-[#f8fafc]">
                    <div className="flex flex-col items-center sm:flex-row sm:items-start gap-4">
                      <img src={resolveUploadUrl(exp.qrCodeUrl)} alt={`QR: ${exp.name}`} className="w-36 h-36 sm:w-28 sm:h-28 bg-white rounded-xl p-2 border border-[#e2e8f0]" />
                      <div className="flex-1 w-full min-w-0 text-center sm:text-left">
                        <p className="label !mb-1 text-xs">{t('experiences.arLink')}</p>
                        <code className="code text-[11px] break-all block">{arUrl}</code>
                        <div className="grid grid-cols-2 gap-2 mt-3">
                          <a href={arPath} target="_blank" rel="noopener noreferrer" className="btn btn-secondary w-full !text-sm">
                            <ExternalLink className="w-4 h-4" /> {t('common.open')}
                          </a>
                          <a href={resolveUploadUrl(exp.qrCodeUrl)} download={`vizara-qr-${exp.slug}.png`} className="btn btn-primary w-full !text-sm">
                            <QrCode className="w-4 h-4" /> {t('experiences.downloadQr')}
                          </a>
                          <button type="button" onClick={() => copyLink(arUrl)} className="btn btn-secondary w-full !text-sm">
                            {t('common.copy')}
                          </button>
                          <button type="button" onClick={() => shareLink(exp.name, arUrl)} className="btn btn-secondary w-full !text-sm">
                            <Share2 className="w-4 h-4" /> {t('common.share')}
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
