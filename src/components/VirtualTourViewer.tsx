import { useEffect, useRef } from 'react';
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
  const viewerRef = useRef<{ destroy?: () => void } | null>(null);
  const brand = organization.brandColor || '#1ba39c';

  useEffect(() => {
    if (!ready || !containerRef.current || scenes.length === 0) return;

    const pannellum = (window as Window & {
      pannellum?: { viewer: (el: HTMLElement, config: Record<string, unknown>) => { destroy?: () => void } };
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

    viewerRef.current = pannellum.viewer(containerRef.current, config);

    return () => {
      viewerRef.current?.destroy?.();
      viewerRef.current = null;
    };
  }, [ready, scenes, tour.startSceneId]);

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
        <Preloader label={t('tour.loading')} />
      </div>
    );
  }

  return (
    <div className="tour-viewer-root">
      <div ref={containerRef} className="tour-pannellum" />

      <header className="tour-viewer-header safe-top safe-x">
        <div className="tour-viewer-badge">
          <div className="tour-viewer-icon" style={{ backgroundColor: brand }} />
          <div className="min-w-0">
            <p className="tour-viewer-org truncate">{organization.name}</p>
            <p className="tour-viewer-title truncate">{tour.name}</p>
          </div>
        </div>
      </header>

      <footer className="tour-viewer-footer safe-bottom safe-x">
        <p className="tour-viewer-hint">{t('tour.navigateHint')}</p>
        {!whiteLabel && <p className="tour-viewer-powered">{t('tour.poweredBy')}</p>}
        {organization.website && (
          <p className="tour-viewer-website truncate">{organization.website}</p>
        )}
      </footer>
    </div>
  );
}
