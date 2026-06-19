import { useEffect, useState } from 'react';

const PANNELLUM_JS = 'https://cdn.jsdelivr.net/npm/pannellum@2.5.6/build/pannellum.js';
const PANNELLUM_CSS = 'https://cdn.jsdelivr.net/npm/pannellum@2.5.6/build/pannellum.css';

export function usePannellum() {
  const [ready, setReady] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    async function load() {
      try {
        if (!document.querySelector('link[data-pannellum]')) {
          const link = document.createElement('link');
          link.rel = 'stylesheet';
          link.href = PANNELLUM_CSS;
          link.setAttribute('data-pannellum', 'true');
          document.head.appendChild(link);
        }

        if (!(window as Window & { pannellum?: unknown }).pannellum) {
          const existing = document.querySelector('script[data-pannellum]');
          if (!existing) {
            await new Promise<void>((resolve, reject) => {
              const script = document.createElement('script');
              script.src = PANNELLUM_JS;
              script.setAttribute('data-pannellum', 'true');
              script.onload = () => resolve();
              script.onerror = () => reject(new Error('pannellum'));
              document.head.appendChild(script);
            });
          }
        }

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
        };
      }
      return {
        pitch: h.pitch,
        yaw: h.yaw,
        type: 'info',
        text: h.text || '',
      };
    });

    sceneMap[scene.id] = {
      title: scene.title,
      type: 'equirectangular',
      panorama: scene.panorama,
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
      compass: false,
    },
    scenes: sceneMap,
  };
}
