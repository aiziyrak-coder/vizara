import { useState } from 'react';
import { SwitchCamera, AlertCircle, Camera } from 'lucide-react';
import { useCamera } from '../hooks/useCamera';
import { takeSnapshot } from '../utils/capture';
import { Preloader } from './Preloader';
import { OverlayFrame } from './OverlayFrame';
import { FacingMode, OverlayConfig } from '../types';
import { useI18n } from '../lib/i18n-context';

interface PhotoZoneViewerProps {
  organization: { name: string; brandColor: string; website?: string };
  config?: Record<string, string>;
  whiteLabel?: boolean;
}

export function PhotoZoneViewer({ organization, config, whiteLabel }: PhotoZoneViewerProps) {
  const { t } = useI18n();
  const [facingMode, setFacingMode] = useState<FacingMode>('user');
  const { videoRef, error, isLoading, retry } = useCamera(facingMode);
  const [captureMsg, setCaptureMsg] = useState('');

  const overlayConfig: OverlayConfig = {
    title: config?.title || organization.name,
    subtitle: config?.subtitle || t('ar.photoZone'),
    website: config?.website || organization.website || 'vizara.app',
    brandColor: config?.brandColor || organization.brandColor || '#1ba39c',
    watermark: whiteLabel ? organization.name : t('ar.poweredBy'),
    showGrid: false,
  };

  const handleCapture = async () => {
    if (!videoRef.current) return;
    try {
      await takeSnapshot(videoRef.current, facingMode, overlayConfig);
      setCaptureMsg(t('ar.photoSaved'));
      setTimeout(() => setCaptureMsg(''), 3000);
    } catch (err) {
      setCaptureMsg(err instanceof Error ? err.message : t('common.loadError'));
    }
  };

  return (
    <div className="relative w-full h-app overflow-hidden bg-black safe-top">
      {isLoading && <Preloader label={t('ar.cameraLoading')} />}

      {error && (
        <div className="absolute inset-0 z-50 flex items-center justify-center p-4 safe-bottom" style={{ background: 'var(--color-bg)' }}>
          <div className="glass-liquid p-6 sm:p-8 flex flex-col items-center max-w-sm text-center w-full rounded-[var(--radius-xl)]">
            <AlertCircle className="w-10 h-10 mb-4" style={{ color: '#ff3b30' }} />
            <p className="text-lg font-bold mb-2">{t('ar.noCamera')}</p>
            <p className="text-secondary text-sm mb-6">{t('ar.noCameraDesc')}</p>
            <button onClick={retry} className="btn btn-primary w-full">{t('common.retry')}</button>
          </div>
        </div>
      )}

      <video
        ref={videoRef}
        autoPlay
        playsInline
        muted
        className={`absolute inset-0 w-full h-full object-cover ${facingMode === 'user' ? 'scale-x-[-1]' : ''}`}
      />

      <OverlayFrame config={overlayConfig} />

      {captureMsg && (
        <div className="absolute top-[max(1rem,env(safe-area-inset-top))] left-1/2 -translate-x-1/2 z-30 toast-glass text-sm px-5 py-2.5 font-medium max-w-[90vw] text-center">
          {captureMsg}
        </div>
      )}

      <div className="absolute bottom-0 inset-x-0 z-20 px-4 pb-[max(1rem,env(safe-area-inset-bottom))] safe-x">
        <div className="camera-dock max-w-sm mx-auto px-4 py-3 flex items-center justify-between">
          <button
            onClick={() => setFacingMode((p) => (p === 'user' ? 'environment' : 'user'))}
            className="icon-btn rounded-full glass-thick"
            aria-label={t('ar.switchCamera')}
          >
            <SwitchCamera className="w-6 h-6" />
          </button>

          <button
            onClick={handleCapture}
            className="capture-btn"
            aria-label={t('ar.capture')}
          >
            <Camera className="w-8 h-8" />
          </button>

          <div className="w-11 h-11" aria-hidden="true" />
        </div>
      </div>
    </div>
  );
}
