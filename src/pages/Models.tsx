import { useEffect, useState, useRef, type FormEvent } from 'react';
import { useAuth } from '../lib/auth-context';
import { useI18n } from '../lib/i18n-context';
import { api, Model3D, BillingStatus } from '../lib/api';
import { useToast } from '../lib/toast-context';
import { toDateLocale } from '../i18n';
import { Upload, Trash2, Box, AlertCircle, Plus } from 'lucide-react';
import { Link } from 'react-router-dom';
import { PageHeader } from '../components/ui/PageHeader';
import { LoadingSpinner } from '../components/ui/LoadingSpinner';
import { EmptyState } from '../components/ui/EmptyState';
import { UsageBar } from '../components/ui/UsageBar';

export function Models() {
  const { currentOrg } = useAuth();
  const { t, locale } = useI18n();
  const { showToast } = useToast();
  const [models, setModels] = useState<Model3D[]>([]);
  const [billing, setBilling] = useState<BillingStatus | null>(null);
  const [name, setName] = useState('');
  const [loading, setLoading] = useState(false);
  const [pageLoading, setPageLoading] = useState(true);
  const [error, setError] = useState('');
  const [busyId, setBusyId] = useState<string | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  const load = async () => {
    if (!currentOrg) return;
    setPageLoading(true);
    try {
      const [mods, bill] = await Promise.all([
        api.getModels(currentOrg.id),
        api.getBillingStatus(currentOrg.id),
      ]);
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

  const subActive = billing?.ar?.subscriptionActive ?? false;
  const maxFileMB = billing?.ar?.plan?.maxFileSizeMB ?? -1;
  const fileSizeLabel = maxFileMB === -1 ? t('models.unlimitedSize') : `${maxFileMB} MB`;
  const modelLimit = billing?.ar?.plan?.maxModels ?? 3;
  const dateLocale = toDateLocale(locale);

  const handleUpload = async (e: FormEvent) => {
    e.preventDefault();
    if (!currentOrg || !fileRef.current?.files?.[0]) return;
    setLoading(true);
    setError('');
    try {
      await api.uploadModel(currentOrg.id, name, fileRef.current.files[0]);
      setName('');
      if (fileRef.current) fileRef.current.value = '';
      showToast(t('models.uploaded'));
      load();
    } catch (err) {
      setError(err instanceof Error ? err.message : t('common.loadError'));
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (modelId: string) => {
    if (!currentOrg || !confirm(t('models.confirmDelete'))) return;
    setBusyId(modelId);
    try {
      await api.deleteModel(currentOrg.id, modelId);
      showToast(t('models.deleted'));
      load();
    } catch (err) {
      const msg = err instanceof Error ? err.message : t('models.deleteError');
      showToast(msg, 'error');
    } finally {
      setBusyId(null);
    }
  };

  const formatSize = (bytes: number) => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  if (!currentOrg) return null;

  if (pageLoading) {
    return <div className="page-content"><LoadingSpinner label={t('common.loading')} /></div>;
  }

  return (
    <div className="page-content">
      <PageHeader
        title={t('models.title')}
        description={t('models.desc')}
      />

      {billing?.ar?.plan && (
        <div className="card p-4 mb-5">
          <UsageBar label={t('models.limitLabel')} used={models.length} max={modelLimit} />
        </div>
      )}

      {!subActive && (
        <div className="alert alert-warning mb-5">
          <p className="font-semibold">{t('models.activateFirst')}</p>
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
            {(error.includes('obuna') || error.includes('Obuna') || error.includes('tarif') || error.includes('subscription') || error.includes('plan')) && (
              <Link to="/dashboard/billing" className="block mt-1 font-semibold text-sm hover:underline" style={{ color: 'var(--brand)' }}>
                {t('common.activatePlan')} →
              </Link>
            )}
          </div>
        </div>
      )}

      <form id="upload-form" onSubmit={handleUpload} className="card p-4 sm:p-6 mb-6 space-y-4">
        <div>
          <label className="label">{t('models.modelName')}</label>
          <input value={name} onChange={(e) => setName(e.target.value)} required placeholder={t('models.modelNamePh')} className="input" />
        </div>
        <div>
          <label className="label">{t('models.fileLabel')}</label>
          <input ref={fileRef} type="file" accept=".glb,.gltf" required className="input !py-3 w-full max-w-full" style={{ colorScheme: 'light' }} />
          <p className="text-xs text-secondary mt-1">{t('models.maxSize')}: {fileSizeLabel}</p>
          <p className="text-xs text-secondary mt-1">{t('models.glbHint')}</p>
        </div>
        <button type="submit" disabled={loading || !subActive} className="btn btn-primary w-full sm:w-auto">
          <Upload className="w-4 h-4" />
          {loading ? t('models.uploading') : t('models.upload')}
        </button>
      </form>

      {models.length === 0 ? (
        <EmptyState
          icon={Box}
          title={t('models.emptyTitle')}
          description={t('models.emptyDesc')}
          action={subActive ? (
            <button type="button" onClick={() => document.getElementById('upload-form')?.scrollIntoView({ behavior: 'smooth' })} className="btn btn-primary">
              <Plus className="w-4 h-4" /> {t('models.firstUpload')}
            </button>
          ) : (
            <Link to="/dashboard/billing" className="btn btn-primary">{t('common.activatePlan')}</Link>
          )}
        />
      ) : (
        <div className="space-y-2">
          {models.map((model) => (
            <div key={model.id} className="card p-4 flex items-center gap-3">
              <div className="icon-glass w-11 h-11 shrink-0">
                <Box className="w-5 h-5" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-semibold truncate">{model.name}</p>
                <p className="text-xs text-secondary mt-0.5">
                  {formatSize(model.fileSize)} · {new Date(model.createdAt).toLocaleDateString(dateLocale)}
                </p>
              </div>
              <button
                onClick={() => handleDelete(model.id)}
                disabled={busyId === model.id}
                className="icon-btn text-[#94a3b8] hover:text-red-500 hover:bg-red-50 shrink-0 disabled:opacity-40"
                aria-label={t('common.delete')}
              >
                <Trash2 className="w-5 h-5" />
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
