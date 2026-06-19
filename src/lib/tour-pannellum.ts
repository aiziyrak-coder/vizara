import { hotspotMarkerClass, type TourHotspotPayload } from '../../shared/tour-types';

export interface TourViewerSceneInput {
  id: string;
  title: string;
  panorama: string;
  pitch?: number;
  yaw?: number;
  hfov?: number;
  hotSpots: TourHotspotPayload[];
}

type HotspotClickHandler = (hotspotId: string) => void;

export function buildTourViewerConfig(
  scenes: TourViewerSceneInput[],
  startSceneId: string,
  onHotspotClick: HotspotClickHandler
): Record<string, unknown> {
  const sceneMap: Record<string, unknown> = {};

  for (const scene of scenes) {
    const hotSpots = scene.hotSpots.map((h) => {
      const cssClass = `vizara-tour-hotspot ${hotspotMarkerClass(h.type, h.icon)}`;
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
        clickHandlerFunc: (_evt: MouseEvent, args: string) => onHotspotClick(args),
        clickHandlerArgs: h.id,
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

export function findHotspotById(
  scenes: { hotspots: TourHotspotPayload[] }[],
  hotspotId: string
): TourHotspotPayload | undefined {
  for (const scene of scenes) {
    const found = scene.hotspots.find((h) => h.id === hotspotId);
    if (found) return found;
  }
  return undefined;
}
