import { useCallback, useEffect, useRef, useState } from 'react';
import { usePannellum } from '../hooks/usePannellum';
import { resolveUploadUrl } from '../lib/assets';
import { hotspotMarkerClass } from '../../shared/tour-types';
import { useI18n } from '../lib/i18n-context';
import { Upload, Maximize2, Minimize2 } from 'lucide-react';

export interface PickerHotspot {
  id: string;
  pitch: number;
  yaw: number;
  type: string;
  icon?: string | null;
  text?: string | null;
  title?: string | null;
  targetSceneId?: string | null;
}

interface PannellumViewer {
  destroy?: () => void;
  mouseEventToCoords?: (event: MouseEvent) => [number, number];
  getPitch?: () => number;
  getYaw?: () => number;
  getHfov?: () => number;
}

interface TourPanoramaPickerProps {
  sceneId: string;
  sceneName: string;
  panoramaUrl: string;
  pitch?: number;
  yaw?: number;
  hfov?: number;
  hotspots?: PickerHotspot[];
  preview?: { pitch: number; yaw: number; icon?: string | null; type?: string } | null;
  size?: 'compact' | 'studio';
  placeMode?: boolean;
  onPick?: (pitch: number, yaw: number) => void;
  onViewChange?: (pitch: number, yaw: number, hfov: number) => void;
  onFileDrop?: (file: File) => void;
  emptyDrop?: boolean;
  className?: string;
}

export function TourPanoramaPicker({
  sceneId,
  sceneName,
  panoramaUrl,
  pitch = 0,
  yaw = 0,
  hfov = 100,
  hotspots = [],
  preview = null,
  size = 'compact',
  placeMode = true,
  onPick,
  onViewChange,
  onFileDrop,
  emptyDrop = false,
  className = '',
}: TourPanoramaPickerProps) {
  const { t } = useI18n();
  const { ready } = usePannellum();
  const containerRef = useRef<HTMLDivElement>(null);
  const viewerRef = useRef<PannellumViewer | null>(null);
  const [fullscreen, setFullscreen] = useState(false);
  const [dragOver, setDragOver] = useState(false);

  const buildHotspots = useCallback(() => {
    const list: Record<string, unknown>[] = hotspots.map((h) => {
      const cssClass = `vizara-tour-hotspot vizara-hs-editor ${hotspotMarkerClass(h.type, h.icon)}`;
      if (h.type === 'scene' && h.targetSceneId) {
        return {
          pitch: h.pitch,
          yaw: h.yaw,
          type: 'scene',
          text: h.title || h.text || '',
          sceneId: h.targetSceneId,
          cssClass,
        };
      }
      return {
        pitch: h.pitch,
        yaw: h.yaw,
        type: 'info',
        text: h.title || h.text || '',
        cssClass,
      };
    });

    if (preview) {
      list.push({
        pitch: preview.pitch,
        yaw: preview.yaw,
        type: 'info',
        text: '●',
        cssClass: `vizara-tour-hotspot vizara-hs-preview ${hotspotMarkerClass(preview.type || 'scene', preview.icon)}`,
      });
    }

    return list;
  }, [hotspots, preview]);

  useEffect(() => {
    if (!ready || !containerRef.current || !panoramaUrl) return;

    const pannellum = (window as Window & {
      pannellum?: { viewer: (el: HTMLElement, config: Record<string, unknown>) => PannellumViewer };
    }).pannellum;
    if (!pannellum) return;

    viewerRef.current?.destroy?.();

    const config = {
      default: {
        firstScene: sceneId,
        sceneFadeDuration: 400,
        autoLoad: true,
        showControls: true,
        showZoomCtrl: true,
        showFullscreenCtrl: false,
        compass: false,
        orientationOnByDefault: false,
        autoRotate: 0,
        friction: 0.15,
        hfov,
        minHfov: 50,
        maxHfov: 120,
      },
      scenes: {
        [sceneId]: {
          title: sceneName,
          type: 'equirectangular',
          panorama: resolveUploadUrl(panoramaUrl),
          crossOrigin: 'anonymous',
          pitch,
          yaw,
          hfov,
          hotSpots: buildHotspots(),
        },
      },
    };

    const viewer = pannellum.viewer(containerRef.current, config);
    viewerRef.current = viewer;

    const handleClick = (event: MouseEvent) => {
      if (!placeMode || !onPick) return;
      const coords = viewer.mouseEventToCoords?.(event);
      if (!coords) return;
      onPick(coords[0], coords[1]);
    };

    const handleMouseUp = () => {
      if (!onViewChange) return;
      const p = viewer.getPitch?.();
      const y = viewer.getYaw?.();
      const h = viewer.getHfov?.();
      if (p !== undefined && y !== undefined && h !== undefined) {
        onViewChange(p, y, h);
      }
    };

    const el = containerRef.current;
    el.addEventListener('click', handleClick);
    el.addEventListener('mouseup', handleMouseUp);
    el.addEventListener('touchend', handleMouseUp);

    return () => {
      el.removeEventListener('click', handleClick);
      el.removeEventListener('mouseup', handleMouseUp);
      el.removeEventListener('touchend', handleMouseUp);
      viewer.destroy?.();
      viewerRef.current = null;
    };
  }, [ready, sceneId, sceneName, panoramaUrl, pitch, yaw, hfov, placeMode, onPick, onViewChange, buildHotspots]);

  const handleDragOver = (e: React.DragEvent) => {
    if (!onFileDrop && !emptyDrop) return;
    e.preventDefault();
    setDragOver(true);
  };

  const handleDragLeave = () => setDragOver(false);

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    const file = e.dataTransfer.files?.[0];
    if (file && onFileDrop) onFileDrop(file);
  };

  const handleFileInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file && onFileDrop) onFileDrop(file);
    e.target.value = '';
  };

  if (!ready) {
    return <div className="tour-picker-loading">{t('common.loading')}</div>;
  }

  const wrapClass = [
    'tour-picker-wrap',
    size === 'studio' ? 'tour-picker-wrap--studio' : '',
    fullscreen ? 'tour-picker-wrap--fullscreen' : '',
    dragOver ? 'tour-picker-wrap--drag' : '',
    className,
  ].filter(Boolean).join(' ');

  return (
    <div className={wrapClass} onDragOver={handleDragOver} onDragLeave={handleDragLeave} onDrop={handleDrop}>
      <div className="tour-picker-toolbar">
        <p className="tour-picker-hint">
          {placeMode ? t('tours.clickToPlace') : t('tours.studioBrowse')}
        </p>
        <div className="tour-picker-toolbar-actions">
          {(onFileDrop || emptyDrop) && (
            <label className="tour-picker-upload-btn">
              <Upload className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">{t('tours.dropPanorama')}</span>
              <input type="file" accept="image/jpeg,image/png,image/webp" className="sr-only" onChange={handleFileInput} />
            </label>
          )}
          {size === 'studio' && (
            <button
              type="button"
              className="tour-picker-fs-btn"
              onClick={() => setFullscreen((f) => !f)}
              aria-label={fullscreen ? t('tours.exitFullscreen') : t('tours.fullscreen')}
            >
              {fullscreen ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
            </button>
          )}
        </div>
      </div>
      <div ref={containerRef} className={`tour-picker-canvas ${size === 'studio' ? 'tour-picker-canvas--studio' : ''}`} />
      {(dragOver || emptyDrop) && onFileDrop && (
        <div className="tour-picker-drop-overlay">
          <Upload className="w-10 h-10 mb-2 opacity-80" />
          <p className="font-semibold">{t('tours.dropPanoramaHere')}</p>
          <p className="text-xs opacity-70 mt-1">{t('tours.panoramaHint')}</p>
        </div>
      )}
    </div>
  );
}
