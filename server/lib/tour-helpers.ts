import path from 'path';
import fs from 'fs';
import { TOUR_MEDIA_DIR } from './paths.js';
import { TOUR_HOTSPOT_TYPES, type TourHotspotType } from '../../shared/tour-types.js';

const ALLOWED_MEDIA_EXT = [
  '.jpg', '.jpeg', '.png', '.webp', '.gif',
  '.mp4', '.webm', '.mov',
  '.mp3', '.wav', '.ogg', '.m4a',
] as const;

export function resolveTourMediaPath(mediaUrl: string): string | null {
  if (!mediaUrl.startsWith('/uploads/tour-media/')) return null;
  const filename = path.basename(mediaUrl);
  const resolved = path.join(TOUR_MEDIA_DIR, filename);
  if (!resolved.startsWith(TOUR_MEDIA_DIR)) return null;
  return resolved;
}

export function detectMediaType(filename: string, mime?: string): string {
  const ext = path.extname(filename).toLowerCase();
  if (ext === '.gif' || mime === 'image/gif') return 'gif';
  if (['.mp4', '.webm', '.mov'].includes(ext) || mime?.startsWith('video/')) return 'video';
  if (['.mp3', '.wav', '.ogg', '.m4a'].includes(ext) || mime?.startsWith('audio/')) return 'audio';
  return 'image';
}

export function isAllowedTourMedia(filename: string): boolean {
  const ext = path.extname(filename).toLowerCase();
  return ALLOWED_MEDIA_EXT.includes(ext as typeof ALLOWED_MEDIA_EXT[number]);
}

export function cleanupTourMedia(mediaUrl: string | null | undefined) {
  if (!mediaUrl) return;
  const filePath = resolveTourMediaPath(mediaUrl);
  if (filePath && fs.existsSync(filePath)) {
    try { fs.unlinkSync(filePath); } catch { /* ignore */ }
  }
}

export function normalizeHotspotType(type: string): TourHotspotType {
  const t = type as TourHotspotType;
  return TOUR_HOTSPOT_TYPES.includes(t) ? t : 'info';
}

export function serializeHotspot(h: {
  id: string;
  type: string;
  pitch: number;
  yaw: number;
  title: string | null;
  text: string | null;
  body: string | null;
  mediaUrl: string | null;
  mediaType: string | null;
  linkUrl: string | null;
  icon: string | null;
  order: number;
  targetSceneId: string | null;
}) {
  return {
    id: h.id,
    type: h.type,
    pitch: h.pitch,
    yaw: h.yaw,
    title: h.title,
    text: h.text,
    body: h.body,
    mediaUrl: h.mediaUrl,
    mediaType: h.mediaType,
    linkUrl: h.linkUrl,
    icon: h.icon,
    order: h.order,
    targetSceneId: h.targetSceneId,
  };
}

export function serializeScene(scene: {
  id: string;
  name: string;
  description: string | null;
  panoramaUrl: string;
  pitch: number;
  yaw: number;
  hfov: number;
  ambientAudioUrl: string | null;
  order: number;
  hotspots: Parameters<typeof serializeHotspot>[0][];
}) {
  return {
    id: scene.id,
    name: scene.name,
    description: scene.description,
    panoramaUrl: scene.panoramaUrl,
    pitch: scene.pitch,
    yaw: scene.yaw,
    hfov: scene.hfov,
    ambientAudioUrl: scene.ambientAudioUrl,
    order: scene.order,
    hotspots: scene.hotspots
      .sort((a, b) => a.order - b.order)
      .map(serializeHotspot),
  };
}
