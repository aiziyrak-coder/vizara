import { useCallback, useEffect, useState } from 'react';
import {
  DoorOpen, Footprints, ArrowRight, MapPin, Info, Plus, Trash2,
  ChevronUp, ChevronDown, Star, Pencil, Save, Link2, Upload,
} from 'lucide-react';
import { api, TourDetail, TourScene, TourHotspot } from '../../lib/api';
import { TourPanoramaPicker } from '../TourPanoramaPicker';
import {
  TourHotspotEditor, emptyHotspotForm, type HotspotFormState,
} from './TourHotspotEditor';
import { TOUR_MARKER_ICONS, type TourMarkerIcon } from '../../shared/tour-types';
import { useI18n } from '../../lib/i18n-context';
import { useToast } from '../../lib/toast-context';

type StudioTool = 'select' | TourMarkerIcon | 'hotspot';
type StudioPanel = 'none' | 'link-next' | 'hotspot-form' | 'upload-first';

interface LinkDraft {
  pitch: number;
  yaw: number;
  icon: TourMarkerIcon;
}

interface TourStudioProps {
  orgId: string;
  tourId: string;
  tour: TourDetail;
  onReload: () => void;
  onSetStart: (sceneId: string) => void;
  onDeleteScene: (sceneId: string) => void;
  busyId: string | null;
}

const MARKER_TOOLS: { id: TourMarkerIcon; icon: typeof DoorOpen; labelKey: string }[] = [
  { id: 'door', icon: DoorOpen, labelKey: 'tours.markerDoor' },
  { id: 'walk', icon: Footprints, labelKey: 'tours.markerWalk' },
  { id: 'arrow', icon: ArrowRight, labelKey: 'tours.markerArrow' },
  { id: 'pin', icon: MapPin, labelKey: 'tours.markerPin' },
];

export function TourStudio({
  orgId,
  tourId,
  tour,
  onReload,
  onSetStart,
  onDeleteScene,
  busyId,
}: TourStudioProps) {
  const { t } = useI18n();
  const { showToast } = useToast();

  const [activeSceneId, setActiveSceneId] = useState<string | null>(tour.scenes[0]?.id ?? null);
  const [tool, setTool] = useState<StudioTool>('select');
  const [panel, setPanel] = useState<StudioPanel>(tour.scenes.length === 0 ? 'upload-first' : 'none');
  const [linkDraft, setLinkDraft] = useState<LinkDraft | null>(null);
  const [linkMode, setLinkMode] = useState<'new' | 'existing'>('new');
  const [nextRoom, setNextRoom] = useState({ name: '', file: null as File | null });
  const [existingTargetId, setExistingTargetId] = useState('');
  const [uploading, setUploading] = useState(false);
  const [hotspotForm, setHotspotForm] = useState<HotspotFormState>(emptyHotspotForm());
  const [editingHotspotId, setEditingHotspotId] = useState<string | null>(null);
  const [sceneNameEdit, setSceneNameEdit] = useState('');
  const [savingView, setSavingView] = useState(false);

  const activeScene = tour.scenes.find((s) => s.id === activeSceneId) ?? null;

  useEffect(() => {
    if (activeScene) setSceneNameEdit(activeScene.name);
  }, [activeScene?.id, activeScene?.name]);

  useEffect(() => {
    if (tour.scenes.length > 0 && !activeSceneId) {
      setActiveSceneId(tour.scenes[0].id);
      setPanel('none');
    }
    if (tour.scenes.length === 0) {
      setActiveSceneId(null);
      setPanel('upload-first');
    }
  }, [tour.scenes, activeSceneId]);

  const round = (n: number) => Math.round(n * 10) / 10;

  const handlePick = useCallback((pitch: number, yaw: number) => {
    const p = round(pitch);
    const y = round(yaw);

    if (tool === 'select') return;

    if (tool === 'hotspot') {
      setHotspotForm((prev) => ({ ...prev, pitch: String(p), yaw: String(y) }));
      setPanel('hotspot-form');
      return;
    }

    const icon = tool as TourMarkerIcon;
    setLinkDraft({ pitch: p, yaw: y, icon });
    setNextRoom({ name: '', file: null });
    setExistingTargetId('');
    setLinkMode('new');
    setPanel('link-next');
  }, [tool]);

  const uploadScene = async (name: string, file: File) => {
    setUploading(true);
    try {
      const scene = await api.uploadTourScene(orgId, tourId, name, file);
      showToast(t('tours.sceneAdded'));
      onReload();
      setActiveSceneId(scene.id);
      setPanel('none');
      setTool('door');
      showToast(t('tours.studioPlaceDoorHint'), 'info');
      return scene;
    } catch (err) {
      showToast(err instanceof Error ? err.message : t('common.loadError'), 'error');
      return null;
    } finally {
      setUploading(false);
    }
  };

  const handleFirstUpload = async (file: File) => {
    const name = nextRoom.name || t('tours.newScene');
    await uploadScene(name, file);
    setNextRoom({ name: '', file: null });
  };

  const handleReplacePanorama = async (file: File) => {
    if (!activeSceneId) return;
    setUploading(true);
    try {
      await api.replaceTourScenePanorama(orgId, tourId, activeSceneId, file);
      showToast(t('tours.panoramaReplaced'));
      onReload();
    } catch (err) {
      showToast(err instanceof Error ? err.message : t('common.loadError'), 'error');
    } finally {
      setUploading(false);
    }
  };

  const handleLinkNext = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeSceneId || !linkDraft) return;

    setUploading(true);
    try {
      let targetId = existingTargetId;

      if (linkMode === 'new') {
        if (!nextRoom.file) {
          showToast(t('tours.panoramaRequired'), 'error');
          return;
        }
        const scene = await api.uploadTourScene(
          orgId,
          tourId,
          nextRoom.name || t('tours.newScene'),
          nextRoom.file,
        );
        targetId = scene.id;
      }

      if (!targetId) {
        showToast(t('tours.selectScene'), 'error');
        return;
      }

      await api.createTourHotspot(orgId, tourId, activeSceneId, {
        type: 'scene',
        pitch: linkDraft.pitch,
        yaw: linkDraft.yaw,
        icon: linkDraft.icon,
        title: tour.scenes.find((s) => s.id === targetId)?.name,
        text: tour.scenes.find((s) => s.id === targetId)?.name,
        targetSceneId: targetId,
      });

      showToast(t('tours.linkCreated'));
      setLinkDraft(null);
      setPanel('none');
      setTool('select');
      if (linkMode === 'new' && targetId) setActiveSceneId(targetId);
      onReload();
    } catch (err) {
      showToast(err instanceof Error ? err.message : t('common.loadError'), 'error');
    } finally {
      setUploading(false);
    }
  };

  const handleSaveHotspot = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeSceneId) return;

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
      icon: hotspotForm.icon || undefined,
      targetSceneId: hotspotForm.type === 'scene' ? hotspotForm.targetSceneId : undefined,
    };

    try {
      if (editingHotspotId) {
        await api.updateTourHotspot(orgId, tourId, editingHotspotId, payload);
        showToast(t('tours.hotspotUpdated'));
      } else {
        await api.createTourHotspot(orgId, tourId, activeSceneId, payload);
        showToast(t('tours.hotspotAdded'));
      }
      setPanel('none');
      setEditingHotspotId(null);
      setHotspotForm(emptyHotspotForm());
      setTool('select');
      onReload();
    } catch (err) {
      showToast(err instanceof Error ? err.message : t('common.loadError'), 'error');
    }
  };

  const startEditHotspot = (hotspot: TourHotspot) => {
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
      icon: hotspot.icon || '',
    });
    setPanel('hotspot-form');
    setTool('hotspot');
  };

  const handleSaveSceneName = async () => {
    if (!activeSceneId || !sceneNameEdit.trim()) return;
    try {
      await api.updateTourScene(orgId, tourId, activeSceneId, { name: sceneNameEdit.trim() });
      showToast(t('common.save'));
      onReload();
    } catch (err) {
      showToast(err instanceof Error ? err.message : t('common.loadError'), 'error');
    }
  };

  const handleSaveView = async (p: number, y: number, h: number) => {
    if (!activeSceneId || savingView) return;
    const scene = tour.scenes.find((s) => s.id === activeSceneId);
    if (!scene) return;
    if (
      Math.abs(scene.pitch - p) < 0.5 &&
      Math.abs(scene.yaw - y) < 0.5 &&
      Math.abs(scene.hfov - h) < 0.5
    ) return;

    setSavingView(true);
    try {
      await api.updateTourScene(orgId, tourId, activeSceneId, {
        pitch: round(p),
        yaw: round(y),
        hfov: round(h),
      });
    } catch {
      /* silent */
    } finally {
      setSavingView(false);
    }
  };

  const moveScene = async (sceneId: string, dir: -1 | 1) => {
    const idx = tour.scenes.findIndex((s) => s.id === sceneId);
    const next = idx + dir;
    if (idx < 0 || next < 0 || next >= tour.scenes.length) return;
    const ids = tour.scenes.map((s) => s.id);
    [ids[idx], ids[next]] = [ids[next], ids[idx]];
    try {
      await api.reorderTourScenes(orgId, tourId, ids);
      onReload();
    } catch (err) {
      showToast(err instanceof Error ? err.message : t('common.loadError'), 'error');
    }
  };

  const otherScenes = activeScene ? tour.scenes.filter((s) => s.id !== activeScene.id) : [];

  const preview = linkDraft && panel === 'link-next'
    ? { pitch: linkDraft.pitch, yaw: linkDraft.yaw, icon: linkDraft.icon, type: 'scene' }
    : hotspotForm.pitch && hotspotForm.yaw && panel === 'hotspot-form'
      ? {
          pitch: Number(hotspotForm.pitch),
          yaw: Number(hotspotForm.yaw),
          icon: hotspotForm.icon || null,
          type: hotspotForm.type,
        }
      : null;

  return (
    <div className="tour-studio">
      <div className="tour-studio-steps">
        <span className="tour-studio-step tour-studio-step--active">1. {t('tours.studioStepUpload')}</span>
        <span className="tour-studio-step-arrow">→</span>
        <span className={`tour-studio-step ${tool !== 'select' || panel === 'link-next' ? 'tour-studio-step--active' : ''}`}>2. {t('tours.studioStepPlace')}</span>
        <span className="tour-studio-step-arrow">→</span>
        <span className={`tour-studio-step ${linkMode === 'new' && panel === 'link-next' ? 'tour-studio-step--active' : ''}`}>3. {t('tours.studioStepNext')}</span>
      </div>

      {tour.scenes.length > 0 && (
        <div className="tour-studio-scenes">
          {tour.scenes.map((scene, i) => (
            <div key={scene.id} className={`tour-studio-scene-chip ${activeSceneId === scene.id ? 'tour-studio-scene-chip--active' : ''}`}>
              <button type="button" className="tour-studio-scene-chip-btn" onClick={() => { setActiveSceneId(scene.id); setPanel('none'); setLinkDraft(null); }}>
                {tour.startSceneId === scene.id && <Star className="w-3 h-3 fill-current text-amber-500" />}
                <span className="truncate max-w-[6rem]">{scene.name}</span>
              </button>
              <div className="tour-studio-scene-chip-actions">
                <button type="button" className="tour-studio-scene-mini" disabled={i === 0} onClick={() => moveScene(scene.id, -1)} aria-label="Up"><ChevronUp className="w-3 h-3" /></button>
                <button type="button" className="tour-studio-scene-mini" disabled={i === tour.scenes.length - 1} onClick={() => moveScene(scene.id, 1)} aria-label="Down"><ChevronDown className="w-3 h-3" /></button>
              </div>
            </div>
          ))}
          <button
            type="button"
            className="tour-studio-scene-add"
            onClick={() => { setPanel('upload-first'); setTool('select'); }}
          >
            <Plus className="w-4 h-4" />
          </button>
        </div>
      )}

      <div className="tour-studio-layout">
        <aside className="tour-studio-tools">
          <p className="tour-studio-tools-label">{t('tours.studioMarkers')}</p>
          {MARKER_TOOLS.map(({ id, icon: Icon, labelKey }) => (
            <button
              key={id}
              type="button"
              className={`tour-studio-tool ${tool === id ? 'tour-studio-tool--active' : ''}`}
              onClick={() => { setTool(id); setPanel('none'); setLinkDraft(null); }}
            >
              <Icon className="w-5 h-5" />
              <span>{t(labelKey as 'tours.markerDoor')}</span>
            </button>
          ))}
          <button
            type="button"
            className={`tour-studio-tool ${tool === 'hotspot' ? 'tour-studio-tool--active' : ''}`}
            onClick={() => { setTool('hotspot'); setHotspotForm(emptyHotspotForm()); setEditingHotspotId(null); }}
          >
            <Info className="w-5 h-5" />
            <span>{t('tours.studioRichHotspot')}</span>
          </button>
          <button
            type="button"
            className={`tour-studio-tool ${tool === 'select' ? 'tour-studio-tool--active' : ''}`}
            onClick={() => { setTool('select'); setPanel('none'); setLinkDraft(null); }}
          >
            <Pencil className="w-5 h-5" />
            <span>{t('tours.studioBrowse')}</span>
          </button>
        </aside>

        <div className="tour-studio-canvas">
          {panel === 'upload-first' || !activeScene ? (
            <div className="tour-studio-empty">
              <div className="tour-studio-empty-inner">
                <Upload className="w-12 h-12 text-[var(--brand)] mb-4" />
                <h3 className="font-bold text-lg mb-2">{t('tours.studioFirstScene')}</h3>
                <p className="text-sm text-secondary mb-4">{t('tours.studioFirstSceneDesc')}</p>
                <input
                  value={nextRoom.name}
                  onChange={(e) => setNextRoom({ ...nextRoom, name: e.target.value })}
                  className="input mb-3 max-w-xs"
                  placeholder={t('tours.sceneNamePh')}
                />
                <label className="btn btn-primary cursor-pointer">
                  {uploading ? t('tours.uploading') : t('tours.choosePanorama')}
                  <input
                    type="file"
                    accept="image/jpeg,image/png,image/webp"
                    className="sr-only"
                    disabled={uploading}
                    onChange={async (e) => {
                      const file = e.target.files?.[0];
                      if (file) await handleFirstUpload(file);
                    }}
                  />
                </label>
                <p className="text-xs text-secondary mt-3">{t('tours.panoramaHint')}</p>
              </div>
            </div>
          ) : (
            <TourPanoramaPicker
              sceneId={activeScene.id}
              sceneName={activeScene.name}
              panoramaUrl={activeScene.panoramaUrl}
              pitch={activeScene.pitch}
              yaw={activeScene.yaw}
              hfov={activeScene.hfov}
              hotspots={activeScene.hotspots}
              preview={preview}
              size="studio"
              placeMode={tool !== 'select'}
              onPick={handlePick}
              onViewChange={handleSaveView}
              onFileDrop={handleReplacePanorama}
            />
          )}
        </div>

        <aside className="tour-studio-panel">
          {activeScene && panel !== 'upload-first' && (
            <div className="tour-studio-scene-meta">
              <label className="label">{t('tours.sceneName')}</label>
              <div className="flex gap-2">
                <input value={sceneNameEdit} onChange={(e) => setSceneNameEdit(e.target.value)} className="input text-sm" />
                <button type="button" className="icon-btn" onClick={handleSaveSceneName} title={t('common.save')}><Save className="w-4 h-4" /></button>
              </div>
              <div className="flex flex-wrap gap-2 mt-3">
                {tour.startSceneId !== activeScene.id && (
                  <button type="button" className="btn btn-secondary text-xs" onClick={() => onSetStart(activeScene.id)}>
                    <Star className="w-3 h-3" /> {t('tours.setStart')}
                  </button>
                )}
                <label className="btn btn-secondary text-xs cursor-pointer">
                  <Upload className="w-3 h-3" /> {t('tours.replacePanorama')}
                  <input type="file" accept="image/jpeg,image/png,image/webp" className="sr-only" onChange={(e) => { const f = e.target.files?.[0]; if (f) handleReplacePanorama(f); }} />
                </label>
                <button type="button" className="btn btn-secondary text-xs text-red-600" disabled={busyId === activeScene.id} onClick={() => onDeleteScene(activeScene.id)}>
                  <Trash2 className="w-3 h-3" /> {t('common.delete')}
                </button>
              </div>
            </div>
          )}

          {panel === 'link-next' && linkDraft && (
            <form onSubmit={handleLinkNext} className="tour-studio-panel-block">
              <h3 className="font-semibold flex items-center gap-2 mb-3">
                <Link2 className="w-4 h-4 text-[var(--brand)]" />
                {t('tours.studioLinkNext')}
              </h3>
              <p className="text-xs text-secondary mb-3">{t('tours.studioLinkNextDesc')}</p>

              <div className="flex gap-2 mb-3">
                <button type="button" className={`tour-studio-toggle ${linkMode === 'new' ? 'tour-studio-toggle--active' : ''}`} onClick={() => setLinkMode('new')}>
                  {t('tours.studioNewRoom')}
                </button>
                <button type="button" className={`tour-studio-toggle ${linkMode === 'existing' ? 'tour-studio-toggle--active' : ''}`} onClick={() => setLinkMode('existing')}>
                  {t('tours.studioExistingRoom')}
                </button>
              </div>

              {linkMode === 'new' ? (
                <>
                  <label className="label">{t('tours.sceneName')}</label>
                  <input value={nextRoom.name} onChange={(e) => setNextRoom({ ...nextRoom, name: e.target.value })} className="input mb-3" placeholder={t('tours.sceneNamePh')} />
                  <label className="label">{t('tours.panoramaFile')}</label>
                  <input type="file" accept="image/jpeg,image/png,image/webp" required className="input mb-3" onChange={(e) => setNextRoom({ ...nextRoom, file: e.target.files?.[0] || null })} />
                </>
              ) : (
                <>
                  <label className="label">{t('tours.targetScene')}</label>
                  <select value={existingTargetId} onChange={(e) => setExistingTargetId(e.target.value)} required className="input mb-3">
                    <option value="">{t('tours.selectScene')}</option>
                    {otherScenes.map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}
                  </select>
                </>
              )}

              <div className="flex gap-2">
                <button type="submit" disabled={uploading} className="btn btn-primary text-sm flex-1">
                  {uploading ? t('tours.uploading') : t('tours.studioCreateLink')}
                </button>
                <button type="button" className="btn btn-secondary text-sm" onClick={() => { setPanel('none'); setLinkDraft(null); }}>
                  {t('common.cancel')}
                </button>
              </div>
            </form>
          )}

          {panel === 'hotspot-form' && activeScene && (
            <form onSubmit={handleSaveHotspot} className="tour-studio-panel-block">
              <h3 className="font-semibold mb-3">{editingHotspotId ? t('tours.editHotspot') : t('tours.addHotspot')}</h3>
              <TourHotspotEditor
                orgId={orgId}
                tourId={tourId}
                scene={activeScene}
                otherScenes={otherScenes}
                form={hotspotForm}
                onChange={setHotspotForm}
                onPick={(p, y) => setHotspotForm((f) => ({ ...f, pitch: String(round(p)), yaw: String(round(y)) }))}
                hidePicker
              />
              <div className="flex gap-2 mt-4">
                <button type="submit" className="btn btn-primary text-sm">{editingHotspotId ? t('common.save') : t('tours.saveHotspot')}</button>
                <button type="button" className="btn btn-secondary text-sm" onClick={() => { setPanel('none'); setEditingHotspotId(null); setHotspotForm(emptyHotspotForm()); }}>{t('common.cancel')}</button>
              </div>
            </form>
          )}

          {activeScene && panel === 'none' && activeScene.hotspots.length > 0 && (
            <div className="tour-studio-panel-block">
              <h3 className="font-semibold mb-2">{t('tours.hotspots')} ({activeScene.hotspots.length})</h3>
              <div className="space-y-2 max-h-64 overflow-y-auto">
                {activeScene.hotspots.map((h) => {
                  const target = tour.scenes.find((s) => s.id === h.targetSceneId);
                  return (
                    <div key={h.id} className="tour-studio-hotspot-row">
                      <button type="button" className="flex-1 text-left text-sm truncate" onClick={() => startEditHotspot(h)}>
                        <span className="font-medium text-[var(--brand)]">{h.icon || h.type}</span>
                        {' · '}
                        {h.title || h.text || target?.name || t('tours.hotspot')}
                      </button>
                      <button type="button" className="text-red-500 text-xs" onClick={async () => {
                        try {
                          await api.deleteTourHotspot(orgId, tourId, h.id);
                          showToast(t('tours.hotspotDeleted'));
                          onReload();
                        } catch (err) {
                          showToast(err instanceof Error ? err.message : t('common.loadError'), 'error');
                        }
                      }}>{t('common.delete')}</button>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {panel === 'none' && !linkDraft && activeScene && (
            <div className="tour-studio-hint card p-4 text-sm text-secondary">
              <p className="font-medium text-[var(--color-ink)] mb-2">{t('tours.studioQuickGuide')}</p>
              <ol className="list-decimal list-inside space-y-1 text-xs">
                <li>{t('tours.studioGuide1')}</li>
                <li>{t('tours.studioGuide2')}</li>
                <li>{t('tours.studioGuide3')}</li>
              </ol>
            </div>
          )}
        </aside>
      </div>
    </div>
  );
}
