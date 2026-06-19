import { forwardRef, useEffect, useImperativeHandle, useRef, useState, type CSSProperties } from 'react';
import { Box } from 'lucide-react';
import { useModelViewer } from '../hooks/useModelViewer';
import { resolveUploadUrl } from '../lib/assets';
import { useI18n } from '../lib/i18n-context';

export interface ModelViewerElement extends HTMLElement {
  activateAR?: () => void;
  toDataURL?: (type?: string, quality?: number) => Promise<string>;
  updateFraming?: () => void;
  getBoundingBoxCenter?: () => { x: number; y: number; z: number };
  getDimensions?: () => { x: number; y: number; z: number };
  cameraTarget?: string;
  cameraOrbit?: string;
  fieldOfView?: string;
  jumpCameraToGoal?: () => void;
}

interface ARModelStageProps {
  fileUrl: string;
  name: string;
  showArButton?: boolean;
}

function frameModelOnFloor(viewer: ModelViewerElement) {
  if (!viewer.getBoundingBoxCenter || !viewer.getDimensions) return;

  viewer.updateFraming?.();

  const center = viewer.getBoundingBoxCenter();
  const size = viewer.getDimensions();
  const maxDim = Math.max(size.x, size.y, size.z, 0.01);
  const groundY = center.y - size.y / 2;

  viewer.cameraTarget = `${center.x.toFixed(3)}m ${groundY.toFixed(3)}m ${center.z.toFixed(3)}m`;
  viewer.cameraOrbit = `0deg 76deg ${(maxDim * 2.35).toFixed(2)}m`;
  viewer.fieldOfView = '34deg';
  viewer.jumpCameraToGoal?.();
}

export const ARModelStage = forwardRef<ModelViewerElement, ARModelStageProps>(function ARModelStage(
  { fileUrl, name, showArButton = true },
  ref
) {
  const { t } = useI18n();
  const { ready, error: scriptError } = useModelViewer();
  const viewerRef = useRef<ModelViewerElement>(null);
  const [modelError, setModelError] = useState(false);
  const [modelLoaded, setModelLoaded] = useState(false);
  const src = resolveUploadUrl(fileUrl);

  useImperativeHandle(ref, () => viewerRef.current as ModelViewerElement);

  useEffect(() => {
    const el = viewerRef.current;
    if (!el || !ready) return;

    const onError = () => setModelError(true);
    const onLoad = () => {
      setModelError(false);
      setModelLoaded(true);
      frameModelOnFloor(el);
    };

    el.addEventListener('error', onError);
    el.addEventListener('load', onLoad);
    return () => {
      el.removeEventListener('error', onError);
      el.removeEventListener('load', onLoad);
    };
  }, [ready, src]);

  const activateAR = () => {
    viewerRef.current?.activateAR?.();
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
        ar-tone-mapping="aces"
        camera-controls
        touch-action="none"
        loading="eager"
        reveal="auto"
        interaction-prompt="none"
        shadow-intensity="1.2"
        shadow-softness="0.65"
        exposure="1.05"
        environment-image="neutral"
        tone-mapping="aces"
        min-camera-orbit="auto 12deg auto"
        max-camera-orbit="auto 88deg auto"
        interpolation-decay="100"
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
});
