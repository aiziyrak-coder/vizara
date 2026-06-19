import { useEffect, useRef, useState, type CSSProperties } from 'react';
import { Box } from 'lucide-react';
import { useModelViewer } from '../hooks/useModelViewer';
import { resolveUploadUrl } from '../lib/assets';
import { useI18n } from '../lib/i18n-context';

interface ARModelStageProps {
  fileUrl: string;
  name: string;
  showArButton?: boolean;
}

export function ARModelStage({ fileUrl, name, showArButton = true }: ARModelStageProps) {
  const { t } = useI18n();
  const { ready, error: scriptError } = useModelViewer();
  const viewerRef = useRef<HTMLElement>(null);
  const [modelError, setModelError] = useState(false);
  const [modelLoaded, setModelLoaded] = useState(false);
  const src = resolveUploadUrl(fileUrl);

  useEffect(() => {
    const el = viewerRef.current;
    if (!el || !ready) return;

    const onError = () => setModelError(true);
    const onLoad = () => {
      setModelError(false);
      setModelLoaded(true);
    };

    el.addEventListener('error', onError);
    el.addEventListener('load', onLoad);
    return () => {
      el.removeEventListener('error', onError);
      el.removeEventListener('load', onLoad);
    };
  }, [ready, src]);

  const activateAR = () => {
    const el = viewerRef.current as HTMLElement & { activateAR?: () => void };
    el?.activateAR?.();
  };

  if (scriptError) {
    return (
      <div className="ar-model-stage flex items-center justify-center">
        <p className="text-xs text-white/80 text-center px-3">{t('common.loadError')}</p>
      </div>
    );
  }

  if (!ready) {
    return (
      <div className="ar-model-stage flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-white/30 border-t-white rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="ar-model-stage">
      {!modelLoaded && !modelError && (
        <div className="absolute inset-0 z-10 flex items-center justify-center pointer-events-none">
          <div className="w-8 h-8 border-2 border-white/30 border-t-white rounded-full animate-spin" />
        </div>
      )}
      {modelError && (
        <div className="absolute inset-0 z-10 flex flex-col items-center justify-center gap-2 pointer-events-none px-3">
          <Box className="w-8 h-8 text-white/60" />
          <p className="text-xs text-white/80 text-center">{t('ar.modelNotFound')}</p>
        </div>
      )}
      <model-viewer
        ref={viewerRef}
        src={src}
        alt={name}
        ar={showArButton}
        ar-modes="webxr scene-viewer quick-look"
        ar-scale="auto"
        ar-placement="floor"
        camera-controls
        touch-action="pan-y"
        loading="eager"
        reveal="auto"
        interaction-prompt="none"
        shadow-intensity="1"
        shadow-softness="0.5"
        exposure="1.1"
        environment-image="neutral"
        tone-mapping="aces"
        crossorigin="anonymous"
        style={{
          width: '100%',
          height: '100%',
          backgroundColor: 'transparent',
          '--poster-color': 'transparent',
        } as CSSProperties}
      />
      {showArButton && modelLoaded && (
        <button
          type="button"
          onClick={activateAR}
          className="ar-floating-ar-btn"
          aria-label={t('ar.viewInSpace')}
        >
          <Box className="w-5 h-5" />
        </button>
      )}
    </div>
  );
}
