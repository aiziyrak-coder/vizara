import { useEffect, useState, useCallback, type FormEvent } from 'react';
import { Link, useParams } from 'react-router-dom';
import { useAuth } from '../lib/auth-context';
import { useI18n } from '../lib/i18n-context';
import { api, TourDetail, TourScene } from '../lib/api';
import { useToast } from '../lib/toast-context';
import { ArrowLeft, Upload, Trash2, Star, Link2, Plus, ExternalLink } from 'lucide-react';
import { LoadingSpinner } from '../components/ui/LoadingSpinner';
import { TourPanoramaPicker } from '../components/TourPanoramaPicker';
import { resolveUploadUrl } from '../lib/assets';

export function TourEditor() {
  const { tourId } = useParams<{ tourId: string }>();
  const { currentOrg } = useAuth();
  const { t } = useI18n();
  const { showToast } = useToast();
  const [tour, setTour] = useState<TourDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [sceneForm, setSceneForm] = useState({ name: '', file: null as File | null });
  const [hotspotSceneId, setHotspotSceneId] = useState<string | null>(null);
  const [hotspotForm, setHotspotForm] = useState({ targetSceneId: '', text: '', pitch: '0', yaw: '0' });
  const [busyId, setBusyId] = useState<string | null>(null);

  const handleHotspotPick = useCallback((pitch: number, yaw: number) => {
    setHotspotForm((prev) => ({
      ...prev,
      pitch: String(Math.round(pitch * 10) / 10),
      yaw: String(Math.round(yaw * 10) / 10),
    }));
  }, []);

  const load = async () => {
    if (!currentOrg || !tourId) return;
    setLoading(true);
    try {
      const data = await api.getTour(currentOrg.id, tourId);
      setTour(data);
    } catch (err) {
      showToast(err instanceof Error ? err.message : t('common.loadError'), 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, [currentOrg, tourId]);

  const handleUploadScene = async (e: FormEvent) => {
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

  const handleAddHotspot = async (e: FormEvent) => {
    e.preventDefault();
    if (!currentOrg || !tourId || !hotspotSceneId) return;
    try {
      await api.createTourHotspot(currentOrg.id, tourId, hotspotSceneId, {
        type: 'scene',
        targetSceneId: hotspotForm.targetSceneId,
        text: hotspotForm.text,
        pitch: Number(hotspotForm.pitch),
        yaw: Number(hotspotForm.yaw),
      });
      setHotspotForm({ targetSceneId: '', text: '', pitch: '0', yaw: '0' });
      setHotspotSceneId(null);
      showToast(t('tours.hotspotAdded'));
      load();
    } catch (err) {
      showToast(err instanceof Error ? err.message : t('common.loadError'), 'error');
    }
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

  if (!currentOrg || !tourId) return null;

  if (loading || !tour) {
    return <div className="page-content"><LoadingSpinner label={t('common.loading')} /></div>;
  }

  const tourUrl = tour.tourUrl || `${window.location.origin}/tour/${currentOrg.slug}/${tour.slug}`;
  const otherScenes = (scene: TourScene) => tour.scenes.filter((s) => s.id !== scene.id);

  return (
    <div className="page-content">
      <div className="mb-6">
        <Link to="/dashboard/tours" className="inline-flex items-center gap-2 text-sm text-secondary hover:text-[var(--brand)] mb-3">
          <ArrowLeft className="w-4 h-4" /> {t('tours.back')}
        </Link>
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <div>
            <h1 className="text-xl sm:text-2xl font-bold">{tour.name}</h1>
            {tour.description && <p className="text-secondary text-sm mt-1">{tour.description}</p>}
          </div>
          <a href={tourUrl} target="_blank" rel="noopener noreferrer" className="btn btn-secondary w-full sm:w-auto">
            <ExternalLink className="w-4 h-4" /> {t('tours.preview')}
          </a>
        </div>
      </div>

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
          {tour.scenes.map((scene) => (
            <div key={scene.id} className="card overflow-hidden">
              <div className="grid sm:grid-cols-[140px_1fr] gap-4 p-4">
                <img src={resolveUploadUrl(scene.panoramaUrl)} alt={scene.name} className="w-full h-28 sm:h-full object-cover rounded-lg bg-[#f1f5f9]" />
                <div className="min-w-0">
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <p className="font-semibold">{scene.name}</p>
                      {tour.startSceneId === scene.id && (
                        <span className="inline-flex items-center gap-1 text-xs text-teal-700 bg-teal-50 px-2 py-0.5 rounded-full mt-1">
                          <Star className="w-3 h-3 fill-current" /> {t('tours.startScene')}
                        </span>
                      )}
                    </div>
                    <div className="flex gap-1 shrink-0">
                      {tour.startSceneId !== scene.id && (
                        <button type="button" onClick={() => handleSetStart(scene.id)} disabled={busyId === scene.id} className="icon-btn text-[#94a3b8] hover:text-teal-600" title={t('tours.setStart')}>
                          <Star className="w-4 h-4" />
                        </button>
                      )}
                      <button type="button" onClick={() => setHotspotSceneId(hotspotSceneId === scene.id ? null : scene.id)} className="icon-btn text-[#94a3b8] hover:text-teal-600" title={t('tours.addHotspot')}>
                        <Link2 className="w-4 h-4" />
                      </button>
                      <button type="button" onClick={() => handleDeleteScene(scene.id)} disabled={busyId === scene.id} className="icon-btn text-[#94a3b8] hover:text-red-600">
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>

                  {scene.hotspots.length > 0 && (
                    <div className="mt-3 space-y-1">
                      <p className="text-xs font-medium text-secondary">{t('tours.hotspots')}</p>
                      {scene.hotspots.map((h) => {
                        const target = tour.scenes.find((s) => s.id === h.targetSceneId);
                        return (
                          <div key={h.id} className="flex items-center justify-between gap-2 text-xs bg-[#f8fafc] rounded-lg px-3 py-2">
                            <span>{h.text || target?.name || t('tours.hotspot')}</span>
                            <button type="button" onClick={() => handleDeleteHotspot(h.id)} className="text-red-500 hover:underline">{t('common.delete')}</button>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              </div>

              {hotspotSceneId === scene.id && otherScenes(scene).length > 0 && (
                <form onSubmit={handleAddHotspot} className="border-t border-[#e2e8f0] p-4 bg-[#f8fafc] space-y-3">
                  <p className="text-sm font-medium flex items-center gap-2"><Plus className="w-4 h-4" /> {t('tours.addHotspot')}</p>
                  <TourPanoramaPicker
                    sceneId={scene.id}
                    sceneName={scene.name}
                    panoramaUrl={scene.panoramaUrl}
                    pitch={scene.pitch}
                    yaw={scene.yaw}
                    hfov={scene.hfov}
                    onPick={handleHotspotPick}
                  />
                  <div className="grid gap-3 sm:grid-cols-2">
                    <div>
                      <label className="label">{t('tours.targetScene')}</label>
                      <select value={hotspotForm.targetSceneId} onChange={(e) => setHotspotForm({ ...hotspotForm, targetSceneId: e.target.value })} required className="input">
                        <option value="">{t('tours.selectScene')}</option>
                        {otherScenes(scene).map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}
                      </select>
                    </div>
                    <div>
                      <label className="label">{t('tours.hotspotLabel')}</label>
                      <input value={hotspotForm.text} onChange={(e) => setHotspotForm({ ...hotspotForm, text: e.target.value })} placeholder={t('tours.hotspotLabelPh')} className="input" />
                    </div>
                    <div>
                      <label className="label">{t('tours.pitch')}</label>
                      <input type="number" step="0.1" value={hotspotForm.pitch} onChange={(e) => setHotspotForm({ ...hotspotForm, pitch: e.target.value })} className="input" />
                    </div>
                    <div>
                      <label className="label">{t('tours.yaw')}</label>
                      <input type="number" step="0.1" value={hotspotForm.yaw} onChange={(e) => setHotspotForm({ ...hotspotForm, yaw: e.target.value })} className="input" />
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <button type="submit" className="btn btn-primary text-sm" disabled={!hotspotForm.targetSceneId}>{t('tours.saveHotspot')}</button>
                    <button type="button" onClick={() => setHotspotSceneId(null)} className="btn btn-secondary text-sm">{t('common.cancel')}</button>
                  </div>
                </form>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
