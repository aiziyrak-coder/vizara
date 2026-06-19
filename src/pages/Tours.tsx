import { useEffect, useState, type FormEvent } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../lib/auth-context';
import { useI18n } from '../lib/i18n-context';
import { api, VirtualTour, ApiError, BillingStatus } from '../lib/api';
import { useToast } from '../lib/toast-context';
import { Plus, Trash2, ExternalLink, RefreshCw, AlertCircle, Share2, Map, Pencil } from 'lucide-react';
import { PageHeader } from '../components/ui/PageHeader';
import { LoadingSpinner } from '../components/ui/LoadingSpinner';
import { EmptyState } from '../components/ui/EmptyState';
import { resolveUploadUrl } from '../lib/assets';

export function Tours() {
  const { currentOrg } = useAuth();
  const { t } = useI18n();
  const { showToast } = useToast();
  const [tours, setTours] = useState<VirtualTour[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ name: '', description: '' });
  const [loading, setLoading] = useState(false);
  const [pageLoading, setPageLoading] = useState(true);
  const [error, setError] = useState('');
  const [billing, setBilling] = useState<BillingStatus | null>(null);
  const [busyId, setBusyId] = useState<string | null>(null);

  const load = async () => {
    if (!currentOrg) return;
    setPageLoading(true);
    try {
      const [list, bill] = await Promise.all([
        api.getTours(currentOrg.id),
        api.getBillingStatus(currentOrg.id),
      ]);
      setTours(list);
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

  const subActive = billing?.tour?.subscriptionActive ?? false;
  const canUseTour = subActive;

  const handleCreate = async (e: FormEvent) => {
    e.preventDefault();
    if (!currentOrg) return;
    setLoading(true);
    setError('');
    try {
      const created = await api.createTour(currentOrg.id, {
        name: form.name,
        description: form.description || undefined,
      });
      setForm({ name: '', description: '' });
      setShowForm(false);
      showToast(t('tours.created'));
      load();
      window.location.href = `/dashboard/tours/${created.id}`;
    } catch (err) {
      const msg = err instanceof ApiError ? err.message : err instanceof Error ? err.message : t('common.loadError');
      setError(msg);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (tourId: string) => {
    if (!currentOrg || !confirm(t('tours.confirmDelete'))) return;
    setBusyId(tourId);
    try {
      await api.deleteTour(currentOrg.id, tourId);
      showToast(t('tours.deleted'));
      load();
    } catch (err) {
      showToast(err instanceof Error ? err.message : t('common.loadError'), 'error');
    } finally {
      setBusyId(null);
    }
  };

  const handleRegenerateQR = async (tourId: string) => {
    if (!currentOrg) return;
    setBusyId(tourId);
    try {
      await api.regenerateTourQR(currentOrg.id, tourId);
      showToast(t('tours.qrUpdated'));
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
      showToast(t('tours.linkCopied'));
    } catch {
      showToast(t('tours.copyFailed'), 'error');
    }
  };

  const shareLink = async (title: string, url: string) => {
    if (navigator.share) {
      try {
        await navigator.share({ title, url });
        return;
      } catch { /* cancelled */ }
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
        title={t('tours.title')}
        description={t('tours.desc')}
        action={
          <button onClick={() => setShowForm(!showForm)} className="btn btn-primary w-full sm:w-auto" disabled={!subActive || !canUseTour}>
            <Plus className="w-4 h-4" />
            {showForm ? t('tours.close') : t('tours.new')}
          </button>
        }
      />

      {!subActive && (
        <div className="alert alert-warning mb-5">
          <p className="font-semibold">{t('tours.activateFirst')}</p>
          <Link to="/dashboard/billing" className="text-sm font-semibold text-amber-800 underline mt-1 inline-block">
            {t('common.goToBilling')}
          </Link>
        </div>
      )}

      {subActive && !canUseTour && (
        <div className="alert alert-warning mb-5">
          <p className="font-semibold">{t('tours.planRequired')}</p>
          <Link to="/dashboard/billing" className="text-sm font-semibold text-amber-800 underline mt-1 inline-block">
            {t('common.goToBilling')}
          </Link>
        </div>
      )}

      {error && (
        <div className="alert alert-error mb-5 flex items-start gap-3">
          <AlertCircle className="w-5 h-5 shrink-0" />
          <div>{error}</div>
        </div>
      )}

      {showForm && (
        <form onSubmit={handleCreate} className="card p-4 sm:p-6 mb-6 space-y-4">
          <div>
            <label className="label">{t('tours.name')}</label>
            <input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} required placeholder={t('tours.namePh')} className="input" />
          </div>
          <div>
            <label className="label">{t('tours.description')}</label>
            <textarea value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} placeholder={t('tours.descriptionPh')} className="input min-h-[80px]" rows={3} />
          </div>
          <div className="flex flex-col sm:flex-row gap-3 pt-1">
            <button type="submit" disabled={loading || !subActive || !canUseTour} className="btn btn-primary w-full sm:w-auto">
              {loading ? t('tours.creating') : t('tours.create')}
            </button>
            <button type="button" onClick={() => setShowForm(false)} className="btn btn-secondary w-full sm:w-auto">{t('common.cancel')}</button>
          </div>
        </form>
      )}

      {tours.length === 0 ? (
        <EmptyState
          icon={Map}
          title={t('tours.emptyTitle')}
          description={t('tours.emptyDesc')}
          action={subActive && canUseTour ? (
            <button onClick={() => setShowForm(true)} className="btn btn-primary">
              <Plus className="w-4 h-4" /> {t('tours.firstCreate')}
            </button>
          ) : (
            <Link to="/dashboard/billing" className="btn btn-primary">{t('common.activatePlan')}</Link>
          )}
        />
      ) : (
        <div className="space-y-4">
          {tours.map((tour) => {
            const tourUrl = `${window.location.origin}/tour/${currentOrg.slug}/${tour.slug}`;
            const isBusy = busyId === tour.id;
            return (
              <div key={tour.id} className="card overflow-hidden">
                <div className="p-4 flex items-start justify-between gap-2 border-b border-[#e2e8f0]">
                  <div className="min-w-0 flex-1">
                    <p className="font-semibold truncate">{tour.name}</p>
                    <p className="text-xs text-secondary mt-0.5">
                      {t('tours.sceneCount', { count: tour._count?.scenes ?? 0 })} · /{tour.slug}
                    </p>
                  </div>
                  <div className="flex gap-0.5 shrink-0">
                    <Link to={`/dashboard/tours/${tour.id}`} className="icon-btn text-[#94a3b8] hover:text-teal-600 hover:bg-teal-50" title={t('tours.edit')}>
                      <Pencil className="w-4 h-4" />
                    </Link>
                    <button onClick={() => handleRegenerateQR(tour.id)} disabled={isBusy} className="icon-btn text-[#94a3b8] hover:text-teal-600 hover:bg-teal-50 disabled:opacity-40" title={t('tours.qrRegen')}>
                      <RefreshCw className={`w-4 h-4 ${isBusy ? 'animate-spin' : ''}`} />
                    </button>
                    <button onClick={() => handleDelete(tour.id)} disabled={isBusy} className="icon-btn text-[#94a3b8] hover:text-red-600 hover:bg-red-50 disabled:opacity-40" title={t('common.delete')}>
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>

                <div className="p-4 grid gap-4 sm:grid-cols-[auto_1fr]">
                  {tour.qrCodeUrl ? (
                    <img src={resolveUploadUrl(tour.qrCodeUrl)} alt="QR" className="w-28 h-28 rounded-lg border border-[#e2e8f0] bg-white p-1 mx-auto sm:mx-0" />
                  ) : (
                    <div className="w-28 h-28 rounded-lg border border-dashed border-[#cbd5e1] flex items-center justify-center text-xs text-secondary mx-auto sm:mx-0">{t('tours.noQr')}</div>
                  )}
                  <div className="min-w-0 space-y-3">
                    <p className="text-xs text-secondary break-all font-mono bg-[#f8fafc] rounded-lg px-3 py-2">{tourUrl}</p>
                    <div className="flex flex-wrap gap-2">
                      <a href={tourUrl} target="_blank" rel="noopener noreferrer" className="btn btn-secondary text-sm">
                        <ExternalLink className="w-4 h-4" /> {t('tours.open')}
                      </a>
                      <button type="button" onClick={() => copyLink(tourUrl)} className="btn btn-secondary text-sm">{t('common.copy')}</button>
                      <button type="button" onClick={() => shareLink(tour.name, tourUrl)} className="btn btn-secondary text-sm">
                        <Share2 className="w-4 h-4" /> {t('common.share')}
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
