import { OverlayConfig, DEFAULT_OVERLAY } from '../types';

interface OverlayFrameProps {
  config?: OverlayConfig;
  showCenterGuide?: boolean;
}

export const OverlayFrame = ({ config, showCenterGuide = true }: OverlayFrameProps) => {
  const cfg = { ...DEFAULT_OVERLAY, ...config };
  const brandColor = cfg.brandColor || '#1ba39c';

  return (
    <div className="ar-camera-overlay pointer-events-none">
      <div className="ar-camera-vignette" />

      <div className="ar-corner ar-corner-tl" style={{ borderColor: brandColor }} />
      <div className="ar-corner ar-corner-tr" style={{ borderColor: brandColor }} />
      <div className="ar-corner ar-corner-bl" style={{ borderColor: brandColor }} />
      <div className="ar-corner ar-corner-br" style={{ borderColor: brandColor }} />

      <header className="ar-camera-header safe-x">
        <div className="ar-brand-badge">
          <div className="ar-brand-icon" style={{ backgroundColor: brandColor }}>
            <div className="ar-brand-icon-inner" />
          </div>
          <div className="ar-brand-text">
            <h1 className="ar-brand-title">{cfg.title}</h1>
            <p className="ar-brand-subtitle">{cfg.subtitle}</p>
            {cfg.website && <p className="ar-brand-website">{cfg.website}</p>}
            {cfg.watermark && <p className="ar-brand-watermark">{cfg.watermark}</p>}
          </div>
        </div>
      </header>

      {showCenterGuide && (
        <div className="ar-camera-frame-guide" style={{ boxShadow: `0 0 0 1px ${brandColor}44` }} />
      )}
    </div>
  );
};
