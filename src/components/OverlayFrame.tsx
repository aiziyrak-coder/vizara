import { OverlayConfig, DEFAULT_OVERLAY } from '../types';

interface OverlayFrameProps {
  config?: OverlayConfig;
}

export const OverlayFrame = ({ config }: OverlayFrameProps) => {
  const cfg = { ...DEFAULT_OVERLAY, ...config };
  const brandColor = cfg.brandColor || '#1ba39c';

  return (
    <div className="absolute inset-0 pointer-events-none z-10 flex flex-col justify-between">
      <div className="absolute inset-0 bg-gradient-to-b from-black/25 via-transparent to-black/35" />

      <div className="absolute top-[max(0.75rem,env(safe-area-inset-top))] left-3 w-7 h-7 border-l-2 border-t-2 rounded-tl-md opacity-70" style={{ borderColor: brandColor }} />
      <div className="absolute top-[max(0.75rem,env(safe-area-inset-top))] right-3 w-7 h-7 border-r-2 border-t-2 rounded-tr-md opacity-70" style={{ borderColor: brandColor }} />
      <div className="absolute bottom-[calc(5.5rem+env(safe-area-inset-bottom,0px))] left-3 w-7 h-7 border-l-2 border-b-2 rounded-bl-md opacity-70" style={{ borderColor: brandColor }} />
      <div className="absolute bottom-[calc(5.5rem+env(safe-area-inset-bottom,0px))] right-3 w-7 h-7 border-r-2 border-b-2 rounded-br-md opacity-70" style={{ borderColor: brandColor }} />

      <div className="relative z-10 p-3 pt-[max(0.75rem,env(safe-area-inset-top))] safe-x">
        <div className="inline-flex items-center gap-2.5 bg-black/35 backdrop-blur-md rounded-xl px-3 py-2.5 border border-white/10 max-w-[calc(100vw-1.5rem)]">
          <div className="w-8 h-8 rounded-lg flex items-center justify-center shrink-0" style={{ backgroundColor: brandColor }}>
            <div className="w-3.5 h-3.5 border-2 border-white/90 rounded-sm" />
          </div>
          <div className="min-w-0">
            <h1 className="text-sm font-bold text-white leading-tight truncate">{cfg.title}</h1>
            <p className="text-[10px] text-white/70 mt-0.5 truncate">{cfg.subtitle}</p>
          </div>
        </div>
      </div>

      <div className="absolute inset-0 flex items-center justify-center pb-[calc(5rem+env(safe-area-inset-bottom,0px))]">
        <div className="w-[min(70vw,16rem)] aspect-square rounded-2xl border-2 border-white/35 opacity-55" style={{ boxShadow: `0 0 0 1px ${brandColor}44` }} />
      </div>

      <div className="absolute bottom-[calc(5.5rem+env(safe-area-inset-bottom,0px))] left-3 z-10 safe-x max-w-[60vw]">
        <p className="text-xs font-semibold text-white drop-shadow truncate">{cfg.website}</p>
        <p className="text-[10px] text-white/70 mt-0.5 truncate">{cfg.watermark}</p>
      </div>
    </div>
  );
};
