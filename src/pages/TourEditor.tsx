import { useEffect, useState, useCallback, useRef } from 'react';
import { Link, useParams } from 'react-router-dom';
import { useAuth } from '../lib/auth-context';
import { useI18n } from '../lib/i18n-context';
import { api, TourDetail, TourScene, TourHotspot } from '../lib/api';
import { useToast } from '../lib/toast-context';
import { parseTourSettings, type TourSettings } from '../../shared/tour-types';
import {
  ArrowLeft, Upload, Trash2, Star, Plus, ExternalLink, Settings, Layers,
  Pencil, ChevronDown, ChevronUp,
} from 'lucide-react';
import { LoadingSpinner } from '../components/ui/LoadingSpinner';
import { TourHotspotEditor, emptyHotspotForm, type HotspotFormState } from '../components/tour/TourHotspotEditor';
import { resolveUploadUrl } from '../lib/assets';

type Tab = 'settings' | 'scenes';

export function TourEditor() {
  const { tourId } = useParams<{ tourId: string }>();
  const { currentOrg } = useAuth();
  const { t } = useI18n();
  const { showToast } = useToast();
  const [tour, setTour] = useState<TourDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState<Tab>('scenes');
  const [uploading, setUploading] = useState(false);
  const [sceneForm, setSceneForm] = useState({ name: '', file: null as File | null });
  const [hotspotSceneId, setHotspotSceneId] = useState<string | null>(null);
  const [hotspotForm, setHotspotForm] = useState<HotspotFormState>(emptyHotspotForm());
  const [editingHotspotId, setEditingHotspotId] = useState<string | null>(null);
  const [expandedSceneId, setExpandedSceneId] = useState<string | null>(null);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [savingSettings, setSavingSettings] = useState(false);

  const [settingsForm, setSettingsForm] = useState({
    name: '',
    description: '',
    isActive: true,
    showSceneList: true,
    showGyro: true,
  });

  const audioRef = useRef<HTMLAudioElement | null>(null);

  const load = async () => {
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
  };

  useEffect(() => {
    load();
  }, [currentOrg, tourId]);

  const handleHotspotPick = useCallback((pitch: number, yaw: number) => {
    setHotspotForm((prev) => ({
      ...prev,
      pitch: String(Math.round(pitch * 10) / 10),
      yaw: String(Math.round(yaw * 10) / 10),
    }));
  }, []);

  const resetHotspotForm = () => {
    setHotspotForm(emptyHotspotForm());
    setEditingHotspotId(null);
    setHotspotSceneId(null);
  };

  const handleUploadScene = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentOrg || !tourId || !sceneForm.file) return;
    setUploading(true);
    try {
      await api.uploadTourScene(currentOrg.id, tourId, sceneForm.name || t('tours.newScene'), sceneForm.file);
      setSceneForm({ name: '', file: null });
      showToast(t('tours.sceneAdded'));
      load();
    } catch (err) {
      showToast(err instanceof Error ? err.message : t('common.loadError'), 'error');
    } finally {
      setUploading(false);
    }
  };

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

  const handleSaveSceneMeta = async (scene: TourScene, description: string) => {
    if (!currentOrg || !tourId) return;
    setBusyId(scene.id);
    try {
      await api.updateTourScene(currentOrg.id, tourId, scene.id, { description: description || null });
      showToast(t('common.save'));
      load();
    } catch (err) {
      showToast(err instanceof Error ? err.message : t('common.loadError'), 'error');
    } finally {
      setBusyId(null);
    }
  };

  const handleSaveHotspot = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentOrg || !tourId || !hotspotSceneId) return;

    const payload = {
      type: hotspotForm.type,
      pitch: Number(hotspotForm.pitch),
      yaw: Number(hotspotForm.yaw),
      title: hotspotForm.title || undefined,
      text: hotspotForm.text || undefined,
      body: hotspotForm.body || undefined,
      mediaUrl: hotspotForm.mediaUrl || undefined,
      mediaType: hotspotForm.mediaType || undefined,
      linkUrl: hotspotForm.linkUrl || undefined,
      targetSceneId: hotspotForm.type === 'scene' ? hotspotForm.targetSceneId : undefined,
    };

    try {
      if (editingHotspotId) {
        await api.updateTourHotspot(currentOrg.id, tourId, editingHotspotId, payload);
        showToast(t('tours.hotspotUpdated'));
      } else {
        await api.createTourHotspot(currentOrg.id, tourId, hotspotSceneId, payload);
        showToast(t('tours.hotspotAdded'));
      }
      resetHotspotForm();
      load();
    } catch (err) {
      showToast(err instanceof Error ? err.message : t('common.loadError'), 'error');
    }
  };

  const startEditHotspot = (sceneId: string, hotspot: TourHotspot) => {
    setHotspotSceneId(sceneId);
    setEditingHotspotId(hotspot.id);
    setHotspotForm({
      type: hotspot.type as HotspotFormState['type'],
      title: hotspot.title || '',
      text: hotspot.text || '',
      body: hotspot.body || '',
      linkUrl: hotspot.linkUrl || '',
      targetSceneId: hotspot.targetSceneId || '',
      pitch: String(hotspot.pitch),
      yaw: String(hotspot.yaw),
      mediaUrl: hotspot.mediaUrl || '',
      mediaType: hotspot.mediaType || '',
    });
  };

  const handleDeleteHotspot = async (hotspotId: string) => {
    if (!currentOrg || !tourId) return;
    setBusyId(hotspotId);
    try {
      await api.deleteTourHotspot(currentOrg.id, tourId, hotspotId);
      showToast(t('tours.hotspotDeleted'));
      load();
    } catch (err) {
      showToast(err instanceof Error ? err.message : t('common.loadError'), 'error');
    } finally {
      setBusyId(null);
    }
  };

  const hotspotTypeLabel = (type: string) =>
    t(`tours.hotspotType_${type}` as 'tours.hotspotType_info');

  if (!currentOrg || !tourId) return null;

  if (loading || !tour) {
    return <div className="page-content"><LoadingSpinner label={t('common.loading')} /></div>;
  }

  const tourUrl = tour.tourUrl || `${window.location.origin}/tour/${currentOrg.slug}/${tour.slug}`;
  const otherScenes = (scene: TourScene) => tour.scenes.filter((s) => s.id !== scene.id);

  return (
    <div className="page-content">
      <audio ref={audioRef} className="hidden" />

      <div className="mb-6">
        <Link to="/dashboard/tours" className="inline-flex items-center gap-2 text-sm text-secondary hover:text-[var(--brand)] mb-3">
          <ArrowLeft className="w-4 h-4" /> {t('tours.back')}
        </Link>
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <div>
            <h1 className="text-xl sm:text-2xl font-bold">{tour.name}</h1>
            <p className="text-secondary text-sm mt-1">{t('tours.editorDesc')}</p>
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
          <Layers className="w-4 h-4" /> {t('tours.tabScenes')} ({tour.scenes.length})
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
            <label className="label">{t('tours.description')}</label>
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
        <>
          <form onSubmit={handleUploadScene} className="card p-4 sm:p-6 mb-6 space-y-4">
            <h2 className="font-semibold flex items-center gap-2"><Upload className="w-4 h-4" /> {t('tours.addScene')}</h2>
            <p className="text-sm text-secondary">{t('tours.panoramaHint')}</p>
            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <label className="label">{t('tours.sceneName')}</label>
                <input value={sceneForm.name} onChange={(e) => setSceneForm({ ...sceneForm, name: e.target.value })} placeholder={t('tours.sceneNamePh')} className="input" />
              </div>
              <div>
                <label className="label">{t('tours.panoramaFile')}</label>
                <input type="file" accept="image/jpeg,image/png,image/webp" required onChange={(e) => setSceneForm({ ...sceneForm, file: e.target.files?.[0] || null })} className="input file:mr-3 file:py-1 file:px-3 file:rounded-lg file:border-0 file:bg-[#f1f5f9] file:text-sm" />
              </div>
            </div>
            <button type="submit" disabled={uploading || !sceneForm.file} className="btn btn-primary w-full sm:w-auto">
              {uploading ? t('tours.uploading') : t('tours.uploadScene')}
            </button>
          </form>

          {tour.scenes.length === 0 ? (
            <div className="card p-8 text-center text-secondary">{t('tours.noScenes')}</div>
          ) : (
            <div className="space-y-4">
              {tour.scenes.map((scene) => {
                const expanded = expandedSceneId === scene.id;
                const editingThis = hotspotSceneId === scene.id;
                return (
                  <div key={scene.id} className="card overflow-hidden">
                    <div className="grid sm:grid-cols-[140px_1fr] gap-4 p-4">
                      <img src={resolveUploadUrl(scene.panoramaUrl)} alt={scene.name} className="w-full h-28 sm:h-full object-cover rounded-lg bg-[#f1f5f9]" />
                      <div className="min-w-0">
                        <div className="flex items-start justify-between gap-2">
                          <div className="min-w-0">
                            <p className="font-semibold truncate">{scene.name}</p>
                            {scene.description && <p className="text-xs text-secondary mt-1 line-clamp-2">{scene.description}</p>}
                            {tour.startSceneId === scene.id && (
                              <span className="inline-flex items-center gap-1 text-xs text-teal-700 bg-teal-50 px-2 py-0.5 rounded-full mt-1">
                                <Star className="w-3 h-3 fill-current" /> {t('tours.startScene')}
                              </span>
                            )}
                            <p className="text-xs text-secondary mt-1">{scene.hotspots.length} {t('tours.hotspots')}</p>
                          </div>
                          <div className="flex gap-1 shrink-0">
                            <button type="button" onClick={() => setExpandedSceneId(expanded ? null : scene.id)} className="icon-btn text-[#94a3b8] hover:text-teal-600">
                              {expanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                            </button>
                            {tour.startSceneId !== scene.id && (
                              <button type="button" onClick={() => handleSetStart(scene.id)} disabled={busyId === scene.id} className="icon-btn text-[#94a3b8] hover:text-teal-600" title={t('tours.setStart')}>
                                <Star className="w-4 h-4" />
                              </button>
                            )}
                            <button type="button" onClick={() => { setHotspotSceneId(editingThis ? null : scene.id); setEditingHotspotId(null); setHotspotForm(emptyHotspotForm()); }} className="icon-btn text-[#94a3b8] hover:text-teal-600" title={t('tours.addHotspot')}>
                              <Plus className="w-4 h-4" />
                            </button>
                            <button type="button" onClick={() => handleDeleteScene(scene.id)} disabled={busyId === scene.id} className="icon-btn text-[#94a3b8] hover:text-red-600">
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        </div>

                        {scene.hotspots.length > 0 && (
                          <div className="mt-3 space-y-1">
                            {scene.hotspots.map((h) => {
                              const target = tour.scenes.find((s) => s.id === h.targetSceneId);
                              return (
                                <div key={h.id} className="flex items-center justify-between gap-2 text-xs bg-[#f8fafc] rounded-lg px-3 py-2">
                                  <span className="truncate">
                                    <span className="font-medium text-[var(--brand)]">{hotspotTypeLabel(h.type)}</span>
                                    {' · '}
                                    {h.title || h.text || target?.name || t('tours.hotspot')}
                                  </span>
                                  <div className="flex gap-2 shrink-0">
                                    <button type="button" onClick={() => startEditHotspot(scene.id, h)} className="text-[var(--brand)] hover:underline">
                                      <Pencil className="w-3 h-3 inline" />
                                    </button>
                                    <button type="button" onClick={() => handleDeleteHotspot(h.id)} className="text-red-500 hover:underline">{t('common.delete')}</button>
                                  </div>
                                </div>
                              );
                            })}
                          </div>
                        )}
                      </div>
                    </div>

                    {expanded && (
                      <div className="border-t border-[#e2e8f0] p-4 bg-[#f8fafc]">
                        <label className="label">{t('tours.sceneDescription')}</label>
                        <textarea
                          defaultValue={scene.description || ''}
                          className="input min-h-[72px] mb-2"
                          id={`scene-desc-${scene.id}`}
                          rows={2}
                        />
                        <button
                          type="button"
                          className="btn btn-secondary text-sm"
                          disabled={busyId === scene.id}
                          onClick={() => {
                            const el = document.getElementById(`scene-desc-${scene.id}`) as HTMLTextAreaElement;
                            handleSaveSceneMeta(scene, el?.value || '');
                          }}
                        >
                          {t('tours.saveSceneInfo')}
                        </button>
                      </div>
                    )}

                    {editingThis && (
                      <form onSubmit={handleSaveHotspot} className="border-t border-[#e2e8f0] p-4 bg-white space-y-4">
                        <p className="text-sm font-semibold flex items-center gap-2">
                          <Plus className="w-4 h-4" />
                          {editingHotspotId ? t('tours.editHotspot') : t('tours.addHotspot')}
                        </p>
                        <TourHotspotEditor
                          orgId={currentOrg.id}
                          tourId={tourId}
                          scene={scene}
                          otherScenes={otherScenes(scene)}
                          form={hotspotForm}
                          onChange={setHotspotForm}
                          onPick={handleHotspotPick}
                        />
                        <div className="flex gap-2">
                          <button
                            type="submit"
                            className="btn btn-primary text-sm"
                            disabled={
                              (hotspotForm.type === 'scene' && !hotspotForm.targetSceneId) ||
                              (hotspotForm.type === 'link' && !hotspotForm.linkUrl && !hotspotForm.mediaUrl)
                            }
                          >
                            {editingHotspotId ? t('common.save') : t('tours.saveHotspot')}
                          </button>
                          <button type="button" onClick={resetHotspotForm} className="btn btn-secondary text-sm">{t('common.cancel')}</button>
                        </div>
                      </form>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </>
      )}
    </div>
  );
}
