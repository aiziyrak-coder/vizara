import { useEffect, useState } from 'react';

const PANNELLUM_JS = '/vendor/pannellum/pannellum.js';
const PANNELLUM_CSS = '/vendor/pannellum/pannellum.css';

function loadStylesheet(href: string): void {
  if (document.querySelector(`link[data-pannellum][href="${href}"]`)) return;
  const link = document.createElement('link');
  link.rel = 'stylesheet';
  link.href = href;
  link.setAttribute('data-pannellum', 'true');
  document.head.appendChild(link);
}

function loadScript(src: string): Promise<void> {
  if ((window as Window & { pannellum?: unknown }).pannellum) {
    return Promise.resolve();
  }

  const existing = document.querySelector(`script[data-pannellum][src="${src}"]`);
  if (existing) {
    return new Promise((resolve, reject) => {
      existing.addEventListener('load', () => resolve(), { once: true });
      existing.addEventListener('error', () => reject(new Error('pannellum')), { once: true });
    });
  }

  return new Promise((resolve, reject) => {
    const script = document.createElement('script');
    script.src = src;
    script.setAttribute('data-pannellum', 'true');
    script.onload = () => resolve();
    script.onerror = () => reject(new Error('pannellum'));
    document.head.appendChild(script);
  });
}

export function usePannellum() {
  const [ready, setReady] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    async function load() {
      try {
        loadStylesheet(PANNELLUM_CSS);
        await loadScript(PANNELLUM_JS);
        if (!cancelled) setReady(true);
      } catch {
        if (!cancelled) setError('pannellum');
      }
    }

    load();
    return () => { cancelled = true; };
  }, []);

  return { ready, error };
}

export interface PannellumHotspot {
  pitch: number;
  yaw: number;
  type: string;
  text?: string | null;
  sceneId?: string;
}

export interface PannellumSceneConfig {
  id: string;
  title: string;
  panorama: string;
  pitch?: number;
  yaw?: number;
  hfov?: number;
  hotSpots?: PannellumHotspot[];
}

export function buildPannellumConfig(
  scenes: PannellumSceneConfig[],
  startSceneId: string
): Record<string, unknown> {
  const sceneMap: Record<string, unknown> = {};

  for (const scene of scenes) {
    const hotSpots = (scene.hotSpots || []).map((h) => {
      if (h.type === 'scene' && h.sceneId) {
        return {
          pitch: h.pitch,
          yaw: h.yaw,
          type: 'scene',
          text: h.text || '',
          sceneId: h.sceneId,
          cssClass: 'vizara-tour-hotspot',
        };
      }
      return {
        pitch: h.pitch,
        yaw: h.yaw,
        type: 'info',
        text: h.text || '',
        cssClass: 'vizara-tour-hotspot',
      };
    });

    sceneMap[scene.id] = {
      title: scene.title,
      type: 'equirectangular',
      panorama: scene.panorama,
      crossOrigin: 'anonymous',
      pitch: scene.pitch ?? 0,
      yaw: scene.yaw ?? 0,
      hfov: scene.hfov ?? 100,
      hotSpots,
    };
  }

  return {
    default: {
      firstScene: startSceneId,
      sceneFadeDuration: 800,
      autoLoad: true,
      showControls: true,
      showZoomCtrl: true,
      showFullscreenCtrl: true,
      compass: false,
      orientationOnByDefault: false,
      autoRotate: 0,
      friction: 0.15,
      hfov: 100,
      minHfov: 50,
      maxHfov: 120,
      touchPanSpeedCoeffFactor: 1,
    },
    scenes: sceneMap,
  };
}
