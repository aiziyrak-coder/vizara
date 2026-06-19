import { useEffect, useRef, useState, useCallback } from 'react';
import { Compass, MapPin } from 'lucide-react';
import { buildPannellumConfig, usePannellum } from '../hooks/usePannellum';
import { resolveUploadUrl } from '../lib/assets';
import { useI18n } from '../lib/i18n-context';
import { Preloader } from './Preloader';

interface TourScene {
  id: string;
  name: string;
  panoramaUrl: string;
  pitch: number;
  yaw: number;
  hfov: number;
  hotspots: {
    id: string;
    type: string;
    pitch: number;
    yaw: number;
    text?: string | null;
    targetSceneId?: string | null;
  }[];
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
  tour: { name: string; description?: string | null; startSceneId: string };
  organization: { name: string; brandColor: string; website?: string };
  scenes: TourScene[];
  whiteLabel?: boolean;
}

export function VirtualTourViewer({ tour, organization, scenes, whiteLabel }: VirtualTourViewerProps) {
  const { t } = useI18n();
  const { ready, error } = usePannellum();
  const containerRef = useRef<HTMLDivElement>(null);
  const viewerRef = useRef<PannellumViewer | null>(null);
  const [currentSceneId, setCurrentSceneId] = useState(tour.startSceneId);
  const [gyroOn, setGyroOn] = useState(false);
  const [panoramaError, setPanoramaError] = useState('');
  const brand = organization.brandColor || '#6366f1';

  const initViewer = useCallback(() => {
    if (!containerRef.current || scenes.length === 0) return;

    const pannellum = (window as Window & {
      pannellum?: { viewer: (el: HTMLElement, config: Record<string, unknown>) => PannellumViewer };
    }).pannellum;

    if (!pannellum) return;

    viewerRef.current?.destroy?.();

    const config = buildPannellumConfig(
      scenes.map((s) => ({
        id: s.id,
        title: s.name,
        panorama: resolveUploadUrl(s.panoramaUrl),
        pitch: s.pitch,
        yaw: s.yaw,
        hfov: s.hfov,
        hotSpots: s.hotspots.map((h) => ({
          pitch: h.pitch,
          yaw: h.yaw,
          type: h.type,
          text: h.text,
          sceneId: h.targetSceneId || undefined,
        })),
      })),
      tour.startSceneId
    );

    const viewer = pannellum.viewer(containerRef.current, config);
    viewerRef.current = viewer;
    setCurrentSceneId(tour.startSceneId);
    setPanoramaError('');

    viewer.on?.('scenechange', () => {
      const id = viewer.getScene?.();
      if (id) setCurrentSceneId(id);
    });

    viewer.on?.('error', (msg: unknown) => {
      setPanoramaError(typeof msg === 'string' ? msg : t('tours.panoramaError'));
    });
  }, [scenes, tour.startSceneId, t]);

  useEffect(() => {
    if (!ready) return;
    initViewer();
    return () => {
      viewerRef.current?.destroy?.();
      viewerRef.current = null;
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
      <div ref={containerRef} className="tour-pannellum" />

      <header className="tour-viewer-header safe-top safe-x">
        <div className="tour-viewer-header-row">
          <div className="tour-viewer-badge">
            <div className="tour-viewer-icon" style={{ backgroundColor: brand }} />
            <div className="min-w-0">
              <p className="tour-viewer-org truncate">{organization.name}</p>
              <p className="tour-viewer-title truncate">{tour.name}</p>
            </div>
          </div>
          <button
            type="button"
            onClick={toggleGyro}
            className={`tour-gyro-btn ${gyroOn ? 'tour-gyro-btn--on' : ''}`}
            aria-label={gyroOn ? t('tours.gyroOff') : t('tours.gyroOn')}
            title={gyroOn ? t('tours.gyroOff') : t('tours.gyroOn')}
          >
            <Compass className="w-5 h-5" />
          </button>
        </div>
      </header>

      {panoramaError && (
        <div className="tour-viewer-error safe-x">
          <p>{panoramaError}</p>
        </div>
      )}

      {scenes.length > 1 && (
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
    </div>
  );
}
