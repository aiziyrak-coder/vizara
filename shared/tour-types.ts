/** Virtual tour hotspot & media types (shared client/server) */

export const TOUR_HOTSPOT_TYPES = [
  'scene',
  'info',
  'image',
  'video',
  'audio',
  'link',
  'banner',
] as const;

export type TourHotspotType = (typeof TOUR_HOTSPOT_TYPES)[number];

export const TOUR_MEDIA_TYPES = ['image', 'gif', 'video', 'audio'] as const;
export type TourMediaType = (typeof TOUR_MEDIA_TYPES)[number];

export interface TourHotspotPayload {
  id: string;
  type: TourHotspotType;
  pitch: number;
  yaw: number;
  title?: string | null;
  text?: string | null;
  body?: string | null;
  mediaUrl?: string | null;
  mediaType?: TourMediaType | null;
  linkUrl?: string | null;
  icon?: string | null;
  targetSceneId?: string | null;
  order?: number;
}

export interface TourScenePayload {
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

export interface TourSettings {
  showSceneList?: boolean;
  showGyro?: boolean;
  introTitle?: string;
  introBody?: string;
}

export const DEFAULT_TOUR_SETTINGS: TourSettings = {
  showSceneList: true,
  showGyro: true,
};

export function parseTourSettings(raw?: string | null): TourSettings {
  if (!raw) return { ...DEFAULT_TOUR_SETTINGS };
  try {
    const parsed = JSON.parse(raw) as TourSettings;
    return { ...DEFAULT_TOUR_SETTINGS, ...parsed };
  } catch {
    return { ...DEFAULT_TOUR_SETTINGS };
  }
}

export const TOUR_MARKER_ICONS = ['door', 'walk', 'arrow', 'pin'] as const;
export type TourMarkerIcon = (typeof TOUR_MARKER_ICONS)[number];

export function normalizeMarkerIcon(icon?: string | null): TourMarkerIcon | null {
  if (!icon) return null;
  return TOUR_MARKER_ICONS.includes(icon as TourMarkerIcon) ? (icon as TourMarkerIcon) : null;
}

export function hotspotIconClass(type: string): string {
  switch (type) {
    case 'scene': return 'vizara-hs-scene';
    case 'image': return 'vizara-hs-image';
    case 'video': return 'vizara-hs-video';
    case 'audio': return 'vizara-hs-audio';
    case 'link': return 'vizara-hs-link';
    case 'banner': return 'vizara-hs-banner';
    default: return 'vizara-hs-info';
  }
}

/** Combined type + custom marker icon for Pannellum cssClass */
export function hotspotMarkerClass(type: string, icon?: string | null): string {
  const marker = normalizeMarkerIcon(icon);
  if (marker) return `vizara-hs-marker vizara-hs-${marker}`;
  return hotspotIconClass(type);
}

export function isMediaGif(url: string, mediaType?: string | null): boolean {
  return mediaType === 'gif' || url.toLowerCase().endsWith('.gif');
}
