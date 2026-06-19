export type FacingMode = 'user' | 'environment';

export interface OverlayConfig {
  title?: string;
  subtitle?: string;
  website?: string;
  brandColor?: string;
  showGrid?: boolean;
  watermark?: string;
}

export const DEFAULT_OVERLAY: OverlayConfig = {
  title: 'Vizara WebAR',
  subtitle: 'Digital Experience',
  website: 'vizara.app',
  brandColor: '#1ba39c',
  showGrid: false,
  watermark: 'Powered by Vizara',
};
