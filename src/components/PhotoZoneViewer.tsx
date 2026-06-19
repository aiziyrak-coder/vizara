import { useState, useRef } from 'react';
import { AlertCircle } from 'lucide-react';
import { useCamera } from '../hooks/useCamera';
import { useARCapture } from '../hooks/useARCapture';
import { Preloader } from './Preloader';
import { OverlayFrame } from './OverlayFrame';
import { ARModelStage, type ModelViewerElement } from './ARModelStage';
import { CaptureSheet } from './CaptureSheet';
import { ARCameraDock } from './ARCameraDock';
import { FacingMode, OverlayConfig } from '../types';
import { useI18n } from '../lib/i18n-context';

interface PhotoZoneViewerProps {
  organization: { name: string; brandColor: string; website?: string };
  config?: Record<string, string>;
  whiteLabel?: boolean;
  model?: { fileUrl: string; name: string };
}

export function PhotoZoneViewer({ organization, config, whiteLabel, model }: PhotoZoneViewerProps) {
  const { t } = useI18n();
  const [facingMode, setFacingMode] = useState<FacingMode>('environment');
  const { videoRef, error, isLoading, isReady, retry } = useCamera(facingMode);
  const modelViewerRef = useRef<ModelViewerElement>(null);

  const overlayConfig: OverlayConfig = {
    title: config?.title || organization.name,
    subtitle: config?.subtitle || t('ar.photoZone'),
    website: config?.website || organization.website || 'vizara.app',
    brandColor: config?.brandColor || organization.brandColor || '#1ba39c',
    watermark: whiteLabel ? organization.name : t('ar.poweredBy'),
    showGrid: false,
  };

  const {
    handleCapture,
    capturing,
    flash,
    captureMsg,
    captureResult,
    clearCaptureResult,
  } = useARCapture({
    videoRef,
    facingMode,
    overlayConfig,
    modelViewerRef: model ? modelViewerRef : undefined,
    isReady,
  });

  return (
    <div className="ar-camera-root safe-top">
      {isLoading && <Preloader label={t('ar.cameraLoading')} />}

      {error && (
        <div className="absolute inset-0 z-50 flex items-center justify-center p-4 safe-bottom" style={{ background: 'var(--color-bg)' }}>
          <div className="glass-liquid p-6 sm:p-8 flex flex-col items-center max-w-sm text-center w-full rounded-[var(--radius-xl)]">
            <AlertCircle className="w-10 h-10 mb-4" style={{ color: '#ff3b30' }} />
            <p className="text-lg font-bold mb-2">{t('ar.noCamera')}</p>
            <p className="text-secondary text-sm mb-6">{t('ar.noCameraDesc')}</p>
            <button type="button" onClick={retry} className="btn btn-primary w-full">{t('common.retry')}</button>
          </div>
        </div>
      )}

      <video
        ref={videoRef}
        autoPlay
        playsInline
        muted
        className={`ar-camera-video ${facingMode === 'user' ? 'ar-camera-mirror' : ''}`}
      />

      {flash && <div className="ar-capture-flash" aria-hidden="true" />}

      {model && (
        <ARModelStage
          ref={modelViewerRef}
          fileUrl={model.fileUrl}
          name={model.name}
          showArButton
        />
      )}

      <OverlayFrame config={overlayConfig} showCenterGuide={!model} />

      {captureMsg && (
        <div className="ar-camera-toast toast-glass text-sm px-5 py-2.5 font-medium max-w-[90vw] text-center">
          {captureMsg}
        </div>
      )}

      {captureResult && (
        <CaptureSheet result={captureResult} onClose={clearCaptureResult} />
      )}

      <ARCameraDock
        onSwitchCamera={() => setFacingMode((p) => (p === 'user' ? 'environment' : 'user'))}
        onCapture={handleCapture}
        capturing={capturing}
        captureDisabled={!isReady}
      />
    </div>
  );
}
