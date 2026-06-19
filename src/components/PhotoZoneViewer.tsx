import { useState } from 'react';
import { SwitchCamera, AlertCircle, Camera } from 'lucide-react';
import { useCamera } from '../hooks/useCamera';
import { captureFromVideo, shareCapture, type CaptureResult } from '../utils/capture';
import { Preloader } from './Preloader';
import { OverlayFrame } from './OverlayFrame';
import { ARModelStage } from './ARModelStage';
import { CaptureSheet } from './CaptureSheet';
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
  const [captureMsg, setCaptureMsg] = useState('');
  const [captureResult, setCaptureResult] = useState<CaptureResult | null>(null);
  const [capturing, setCapturing] = useState(false);
  const [flash, setFlash] = useState(false);

  const overlayConfig: OverlayConfig = {
    title: config?.title || organization.name,
    subtitle: config?.subtitle || t('ar.photoZone'),
    website: config?.website || organization.website || 'vizara.app',
    brandColor: config?.brandColor || organization.brandColor || '#1ba39c',
    watermark: whiteLabel ? organization.name : t('ar.poweredBy'),
    showGrid: false,
  };

  const handleCapture = async () => {
    if (!videoRef.current || !isReady || capturing) return;

    setCapturing(true);
    setFlash(true);
    window.setTimeout(() => setFlash(false), 180);

    try {
      const result = await captureFromVideo(videoRef.current, facingMode, overlayConfig);
      const shared = await shareCapture(result);

      if (shared) {
        setCaptureMsg(t('ar.photoSaved'));
        setTimeout(() => setCaptureMsg(''), 3000);
      } else {
        setCaptureResult(result);
      }
    } catch (err) {
      setCaptureMsg(err instanceof Error ? err.message : t('common.loadError'));
      setTimeout(() => setCaptureMsg(''), 4000);
    } finally {
      setCapturing(false);
    }
  };

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

      {model && <ARModelStage fileUrl={model.fileUrl} name={model.name} showArButton />}

      <OverlayFrame config={overlayConfig} showCenterGuide={!model} />

      {captureMsg && (
        <div className="ar-camera-toast toast-glass text-sm px-5 py-2.5 font-medium max-w-[90vw] text-center">
          {captureMsg}
        </div>
      )}

      {captureResult && (
        <CaptureSheet result={captureResult} onClose={() => setCaptureResult(null)} />
      )}

      <footer className="ar-camera-dock safe-x">
        <div className="camera-dock max-w-sm mx-auto px-4 py-3 flex items-center justify-between">
          <button
            type="button"
            onClick={() => setFacingMode((p) => (p === 'user' ? 'environment' : 'user'))}
            className="icon-btn rounded-full glass-thick"
            aria-label={t('ar.switchCamera')}
          >
            <SwitchCamera className="w-6 h-6" />
          </button>

          <button
            type="button"
            onClick={handleCapture}
            disabled={!isReady || capturing}
            className="capture-btn"
            style={{ touchAction: 'manipulation' }}
            aria-label={t('ar.capture')}
          >
            <Camera className="w-8 h-8" />
          </button>

          <div className="w-11 h-11" aria-hidden="true" />
        </div>
      </footer>
    </div>
  );
}
