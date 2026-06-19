import { useEffect, useRef } from 'react';
import { usePannellum, buildPannellumConfig } from '../hooks/usePannellum';
import { resolveUploadUrl } from '../lib/assets';
import { useI18n } from '../lib/i18n-context';

interface TourPanoramaPickerProps {
  sceneId: string;
  sceneName: string;
  panoramaUrl: string;
  pitch?: number;
  yaw?: number;
  hfov?: number;
  onPick: (pitch: number, yaw: number) => void;
}

interface PannellumViewer {
  destroy?: () => void;
  mouseEventToCoords?: (event: MouseEvent) => [number, number];
}

export function TourPanoramaPicker({
  sceneId,
  sceneName,
  panoramaUrl,
  pitch = 0,
  yaw = 0,
  hfov = 100,
  onPick,
}: TourPanoramaPickerProps) {
  const { t } = useI18n();
  const { ready } = usePannellum();
  const containerRef = useRef<HTMLDivElement>(null);
  const viewerRef = useRef<PannellumViewer | null>(null);

  useEffect(() => {
    if (!ready || !containerRef.current) return;

    const pannellum = (window as Window & {
      pannellum?: { viewer: (el: HTMLElement, config: Record<string, unknown>) => PannellumViewer };
    }).pannellum;
    if (!pannellum) return;

    viewerRef.current?.destroy?.();

    const config = buildPannellumConfig(
      [{
        id: sceneId,
        title: sceneName,
        panorama: resolveUploadUrl(panoramaUrl),
        pitch,
        yaw,
        hfov,
      }],
      sceneId
    );

    const viewer = pannellum.viewer(containerRef.current, config);
    viewerRef.current = viewer;

    const handleClick = (event: MouseEvent) => {
      const coords = viewer.mouseEventToCoords?.(event);
      if (!coords) return;
      onPick(coords[0], coords[1]);
    };

    containerRef.current.addEventListener('click', handleClick);

    return () => {
      containerRef.current?.removeEventListener('click', handleClick);
      viewer.destroy?.();
      viewerRef.current = null;
    };
  }, [ready, sceneId, sceneName, panoramaUrl, pitch, yaw, hfov, onPick]);

  if (!ready) {
    return <div className="tour-picker-loading">{t('common.loading')}</div>;
  }

  return (
    <div className="tour-picker-wrap">
      <p className="tour-picker-hint">{t('tours.clickToPlace')}</p>
      <div ref={containerRef} className="tour-picker-canvas" />
    </div>
  );
}
