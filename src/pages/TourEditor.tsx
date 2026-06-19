import { useEffect, useState, useCallback, useRef } from 'react';
import { Link, useParams } from 'react-router-dom';
import { useAuth } from '../lib/auth-context';
import { useI18n } from '../lib/i18n-context';
import { api, TourDetail } from '../lib/api';
import { useToast } from '../lib/toast-context';
import { parseTourSettings, type TourSettings } from '../../shared/tour-types';
import { ArrowLeft, ExternalLink, Settings, Layers } from 'lucide-react';
import { LoadingSpinner } from '../components/ui/LoadingSpinner';
import { TourStudio } from '../components/tour/TourStudio';
import { AiGenerateButton } from '../components/ai/AiGenerateButton';

type Tab = 'settings' | 'scenes';

export function TourEditor() {
  const { tourId } = useParams<{ tourId: string }>();
  const { currentOrg } = useAuth();
  const { t } = useI18n();
  const { showToast } = useToast();
  const [tour, setTour] = useState<TourDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState<Tab>('scenes');
  const [busyId, setBusyId] = useState<string | null>(null);
  const [savingSettings, setSavingSettings] = useState(false);

  const [settingsForm, setSettingsForm] = useState({
    name: '',
    description: '',
    isActive: true,
    showSceneList: true,
    showGyro: true,
  });

  const load = useCallback(async () => {
    if (!currentOrg || !tourId) return;
    setLoading(true);
    try {
      const data = await api.getTour(currentOrg.id, tourId);
      setTour(data);
      const parsed = parseTourSettings(data.settings);
      setSettingsForm({
        name: data.name,
        description: data.description || '',
        isActive: data.isActive,
        showSceneList: parsed.showSceneList !== false,
        showGyro: parsed.showGyro !== false,
      });
    } catch (err) {
      showToast(err instanceof Error ? err.message : t('common.loadError'), 'error');
    } finally {
      setLoading(false);
    }
  }, [currentOrg, tourId, showToast, t]);

  useEffect(() => {
    load();
  }, [load]);

  const handleSaveSettings = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentOrg || !tourId) return;
    setSavingSettings(true);
    try {
      const settings: TourSettings = {
        showSceneList: settingsForm.showSceneList,
        showGyro: settingsForm.showGyro,
      };
      await api.updateTour(currentOrg.id, tourId, {
        name: settingsForm.name,
        description: settingsForm.description,
        isActive: settingsForm.isActive,
        settings,
      });
      showToast(t('common.save'));
      load();
    } catch (err) {
      showToast(err instanceof Error ? err.message : t('common.loadError'), 'error');
    } finally {
      setSavingSettings(false);
    }
  };

  const handleSetStart = async (sceneId: string) => {
    if (!currentOrg || !tourId) return;
    setBusyId(sceneId);
    try {
      await api.updateTour(currentOrg.id, tourId, { startSceneId: sceneId });
      showToast(t('tours.startSet'));
      load();
    } catch (err) {
      showToast(err instanceof Error ? err.message : t('common.loadError'), 'error');
    } finally {
      setBusyId(null);
    }
  };

  const handleDeleteScene = async (sceneId: string) => {
    if (!currentOrg || !tourId || !confirm(t('tours.confirmDeleteScene'))) return;
    setBusyId(sceneId);
    try {
      await api.deleteTourScene(currentOrg.id, tourId, sceneId);
      showToast(t('tours.sceneDeleted'));
      load();
    } catch (err) {
      showToast(err instanceof Error ? err.message : t('common.loadError'), 'error');
    } finally {
      setBusyId(null);
    }
  };

  if (!currentOrg || !tourId) return null;

  if (loading || !tour) {
    return <div className="page-content"><LoadingSpinner label={t('common.loading')} /></div>;
  }

  const tourUrl = tour.tourUrl || `${window.location.origin}/tour/${currentOrg.slug}/${tour.slug}`;

  return (
    <div className="page-content tour-editor-page">
      <div className="mb-6">
        <Link to="/dashboard/tours" className="inline-flex items-center gap-2 text-sm text-secondary hover:text-[var(--brand)] mb-3">
          <ArrowLeft className="w-4 h-4" /> {t('tours.back')}
        </Link>
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <div>
            <h1 className="text-xl sm:text-2xl font-bold">{tour.name}</h1>
            <p className="text-secondary text-sm mt-1">{t('tours.studioDesc')}</p>
          </div>
          <a href={tourUrl} target="_blank" rel="noopener noreferrer" className="btn btn-secondary w-full sm:w-auto">
            <ExternalLink className="w-4 h-4" /> {t('tours.preview')}
          </a>
        </div>
      </div>

      <div className="tour-editor-tabs mb-6">
        <button type="button" className={`tour-editor-tab ${tab === 'settings' ? 'tour-editor-tab--active' : ''}`} onClick={() => setTab('settings')}>
          <Settings className="w-4 h-4" /> {t('tours.tabSettings')}
        </button>
        <button type="button" className={`tour-editor-tab ${tab === 'scenes' ? 'tour-editor-tab--active' : ''}`} onClick={() => setTab('scenes')}>
          <Layers className="w-4 h-4" /> {t('tours.tabStudio')} ({tour.scenes.length})
        </button>
      </div>

      {tab === 'settings' && (
        <form onSubmit={handleSaveSettings} className="card p-4 sm:p-6 space-y-4 max-w-2xl">
          <h2 className="font-semibold">{t('tours.tabSettings')}</h2>
          <div>
            <label className="label">{t('tours.name')}</label>
            <input value={settingsForm.name} onChange={(e) => setSettingsForm({ ...settingsForm, name: e.target.value })} required className="input" />
          </div>
          <div>
            <div className="flex items-center justify-between gap-2 mb-1">
              <label className="label mb-0">{t('tours.description')}</label>
              <AiGenerateButton
                task="tour_description"
                context={{
                  orgId: currentOrg.id,
                  tourName: settingsForm.name || tour.name,
                  sceneNames: tour.scenes.map((s) => s.name),
                }}
                onResult={(result) => setSettingsForm({
                  ...settingsForm,
                  description: result.description || settingsForm.description,
                })}
                className="!py-1 !px-2.5 text-xs"
              />
            </div>
            <textarea value={settingsForm.description} onChange={(e) => setSettingsForm({ ...settingsForm, description: e.target.value })} className="input min-h-[88px]" rows={3} />
          </div>
          <label className="flex items-center gap-2 text-sm">
            <input type="checkbox" checked={settingsForm.isActive} onChange={(e) => setSettingsForm({ ...settingsForm, isActive: e.target.checked })} />
            {t('tours.tourActive')}
          </label>
          <label className="flex items-center gap-2 text-sm">
            <input type="checkbox" checked={settingsForm.showSceneList} onChange={(e) => setSettingsForm({ ...settingsForm, showSceneList: e.target.checked })} />
            {t('tours.showSceneList')}
          </label>
          <label className="flex items-center gap-2 text-sm">
            <input type="checkbox" checked={settingsForm.showGyro} onChange={(e) => setSettingsForm({ ...settingsForm, showGyro: e.target.checked })} />
            {t('tours.showGyro')}
          </label>
          <button type="submit" disabled={savingSettings} className="btn btn-primary">
            {savingSettings ? t('common.saving') : t('common.save')}
          </button>
        </form>
      )}

      {tab === 'scenes' && (
        <TourStudio
          orgId={currentOrg.id}
          tourId={tourId}
          tour={tour}
          onReload={load}
          onSetStart={handleSetStart}
          onDeleteScene={handleDeleteScene}
          busyId={busyId}
        />
      )}
    </div>
  );
}
