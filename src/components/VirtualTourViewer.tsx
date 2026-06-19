import { useEffect, useRef, useState, useCallback } from 'react';
import { Compass, MapPin } from 'lucide-react';
import { usePannellum } from '../hooks/usePannellum';
import { buildTourViewerConfig, findHotspotById } from '../lib/tour-pannellum';
import { resolveUploadUrl } from '../lib/assets';
import { parseTourSettings, type TourHotspotPayload } from '../../shared/tour-types';
import { useI18n } from '../lib/i18n-context';
import { Preloader } from './Preloader';
import { TourHotspotModal } from './tour/TourHotspotModal';
import { TourAiGuide } from './tour/TourAiGuide';

interface TourScene {
  id: string;
  name: string;
  description?: string | null;
  panoramaUrl: string;
  pitch: number;
  yaw: number;
  hfov: number;
  ambientAudioUrl?: string | null;
  hotspots: TourHotspotPayload[];
}

interface PannellumViewer {
  destroy?: () => void;
  loadScene?: (sceneId: string, pitch?: number, yaw?: number, hfov?: number) => void;
  getScene?: () => string;
  startOrientation?: () => void;
  stopOrientation?: () => void;
  on?: (event: string, handler: (...args: unknown[]) => void) => void;
}

interface VirtualTourViewerProps {
  orgSlug: string;
  tourSlug: string;
  tour: { name: string; description?: string | null; startSceneId: string; settings?: string | null };
  organization: { name: string; brandColor: string; website?: string };
  scenes: TourScene[];
  whiteLabel?: boolean;
}

export function VirtualTourViewer({ orgSlug, tourSlug, tour, organization, scenes, whiteLabel }: VirtualTourViewerProps) {
  const { t } = useI18n();
  const { ready, error } = usePannellum();
  const containerRef = useRef<HTMLDivElement>(null);
  const viewerRef = useRef<PannellumViewer | null>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const hotspotClickRef = useRef<(id: string) => void>(() => {});
  const [currentSceneId, setCurrentSceneId] = useState(tour.startSceneId);
  const [gyroOn, setGyroOn] = useState(false);
  const [panoramaError, setPanoramaError] = useState('');
  const [activeHotspot, setActiveHotspot] = useState<TourHotspotPayload | null>(null);
  const settings = parseTourSettings(tour.settings);
  const brand = organization.brandColor || '#6366f1';

  hotspotClickRef.current = (hotspotId: string) => {
    const hotspot = findHotspotById(scenes, hotspotId);
    if (!hotspot) return;
    if (hotspot.type === 'link' && hotspot.linkUrl && !hotspot.body && !hotspot.mediaUrl) {
      window.open(hotspot.linkUrl, '_blank', 'noopener,noreferrer');
      return;
    }
    setActiveHotspot(hotspot);
  };

  const playAmbient = useCallback((sceneId: string) => {
    const scene = scenes.find((s) => s.id === sceneId);
    const audio = audioRef.current;
    if (!audio) return;
    if (!scene?.ambientAudioUrl) {
      audio.pause();
      audio.removeAttribute('src');
      return;
    }
    const url = resolveUploadUrl(scene.ambientAudioUrl);
    if (audio.src !== url) {
      audio.src = url;
    }
    audio.loop = true;
    audio.volume = 0.35;
    audio.play().catch(() => {});
  }, [scenes]);

  const initViewer = useCallback(() => {
    if (!containerRef.current || scenes.length === 0) return;

    const pannellum = (window as Window & {
      pannellum?: { viewer: (el: HTMLElement, config: Record<string, unknown>) => PannellumViewer };
    }).pannellum;

    if (!pannellum) return;

    viewerRef.current?.destroy?.();

    const config = buildTourViewerConfig(
      scenes.map((s) => ({
        id: s.id,
        title: s.name,
        panorama: resolveUploadUrl(s.panoramaUrl),
        pitch: s.pitch,
        yaw: s.yaw,
        hfov: s.hfov,
        hotSpots: s.hotspots,
      })),
      tour.startSceneId,
      (id) => hotspotClickRef.current(id)
    );

    const viewer = pannellum.viewer(containerRef.current, config);
    viewerRef.current = viewer;
    setCurrentSceneId(tour.startSceneId);
    setPanoramaError('');
    playAmbient(tour.startSceneId);

    viewer.on?.('scenechange', () => {
      const id = viewer.getScene?.();
      if (id) {
        setCurrentSceneId(id);
        playAmbient(id);
      }
    });

    viewer.on?.('error', (msg: unknown) => {
      setPanoramaError(typeof msg === 'string' ? msg : t('tours.panoramaError'));
    });
  }, [scenes, tour.startSceneId, t, playAmbient]);

  useEffect(() => {
    if (!ready) return;
    initViewer();
    return () => {
      viewerRef.current?.destroy?.();
      viewerRef.current = null;
      audioRef.current?.pause();
    };
  }, [ready, initViewer]);

  const loadScene = (sceneId: string) => {
    viewerRef.current?.loadScene?.(sceneId);
    setCurrentSceneId(sceneId);
  };

  const toggleGyro = async () => {
    const viewer = viewerRef.current;
    if (!viewer) return;

    if (gyroOn) {
      viewer.stopOrientation?.();
      setGyroOn(false);
      return;
    }

    try {
      const DOE = window.DeviceOrientationEvent as typeof DeviceOrientationEvent & {
        requestPermission?: () => Promise<'granted' | 'denied' | 'default'>;
      };
      if (typeof DOE.requestPermission === 'function') {
        const permission = await DOE.requestPermission();
        if (permission !== 'granted') return;
      }
      viewer.startOrientation?.();
      setGyroOn(true);
    } catch {
      // Gyro not available
    }
  };

  const currentScene = scenes.find((s) => s.id === currentSceneId);

  if (error) {
    return (
      <div className="min-h-app flex items-center justify-center p-4" style={{ background: '#0f172a' }}>
        <p className="text-white/80">{t('common.loadError')}</p>
      </div>
    );
  }

  if (!ready) {
    return (
      <div className="min-h-app flex items-center justify-center" style={{ background: '#0f172a' }}>
        <Preloader label={t('tours.loading')} />
      </div>
    );
  }

  return (
    <div className="tour-viewer-root">
      <audio ref={audioRef} className="hidden" preload="none" />
      <div ref={containerRef} className="tour-pannellum" />

      <header className="tour-viewer-header safe-top safe-x">
        <div className="tour-viewer-header-row">
          <div className="tour-viewer-badge">
            <div className="tour-viewer-icon" style={{ backgroundColor: brand }} />
            <div className="min-w-0">
              <p className="tour-viewer-org truncate">{organization.name}</p>
              <p className="tour-viewer-title truncate">{tour.name}</p>
              {currentScene?.description && (
                <p className="tour-viewer-scene-desc truncate">{currentScene.description}</p>
              )}
            </div>
          </div>
          {settings.showGyro !== false && (
            <button
              type="button"
              onClick={toggleGyro}
              className={`tour-gyro-btn ${gyroOn ? 'tour-gyro-btn--on' : ''}`}
              aria-label={gyroOn ? t('tours.gyroOff') : t('tours.gyroOn')}
            >
              <Compass className="w-5 h-5" />
            </button>
          )}
        </div>
      </header>

      {panoramaError && (
        <div className="tour-viewer-error safe-x">
          <p>{panoramaError}</p>
        </div>
      )}

      {settings.showSceneList !== false && scenes.length > 1 && (
        <nav className="tour-scene-nav safe-x" aria-label={t('tours.scenes')}>
          {scenes.map((scene) => (
            <button
              key={scene.id}
              type="button"
              onClick={() => loadScene(scene.id)}
              className={`tour-scene-chip ${currentSceneId === scene.id ? 'tour-scene-chip--active' : ''}`}
            >
              <MapPin className="w-3.5 h-3.5 shrink-0" />
              <span className="truncate">{scene.name}</span>
            </button>
          ))}
        </nav>
      )}

      <footer className="tour-viewer-footer safe-bottom safe-x">
        <p className="tour-viewer-hint">{t('tours.navigateHint')}</p>
        {!whiteLabel && <p className="tour-viewer-powered">{t('tours.poweredBy')}</p>}
        {organization.website && (
          <p className="tour-viewer-website truncate">{organization.website}</p>
        )}
      </footer>

      {activeHotspot && (
        <TourHotspotModal hotspot={activeHotspot} onClose={() => setActiveHotspot(null)} />
      )}

      <TourAiGuide
        orgSlug={orgSlug}
        tourSlug={tourSlug}
        tourName={tour.name}
        currentSceneId={currentSceneId}
        brandColor={brand}
      />
    </div>
  );
}
