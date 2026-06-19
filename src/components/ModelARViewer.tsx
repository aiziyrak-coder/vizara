import { useState } from 'react';
import { SwitchCamera, AlertCircle, Box } from 'lucide-react';
import { useCamera } from '../hooks/useCamera';
import { Preloader } from './Preloader';
import { OverlayFrame } from './OverlayFrame';
import { ARModelStage } from './ARModelStage';
import { FacingMode, OverlayConfig } from '../types';
import { useI18n } from '../lib/i18n-context';

interface ModelARViewerProps {
  organization: { name: string; brandColor: string; website?: string };
  model?: { fileUrl: string; name: string };
  experienceName: string;
  whiteLabel?: boolean;
}

export function ModelARViewer({ organization, model, experienceName, whiteLabel }: ModelARViewerProps) {
  const { t } = useI18n();
  const [facingMode, setFacingMode] = useState<FacingMode>('environment');
  const { videoRef, error, isLoading, retry } = useCamera(facingMode);

  if (!model) {
    return (
      <div className="min-h-app flex items-center justify-center p-4" style={{ background: 'var(--color-bg)' }}>
        <p className="text-secondary">{t('ar.modelNotFound')}</p>
      </div>
    );
  }

  const overlayConfig: OverlayConfig = {
    title: organization.name,
    subtitle: experienceName,
    website: organization.website || 'vizara.app',
    brandColor: organization.brandColor || '#1ba39c',
    watermark: whiteLabel ? organization.name : t('ar.poweredBy'),
    showGrid: false,
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
            <button onClick={retry} className="btn btn-primary w-full">{t('common.retry')}</button>
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

      <ARModelStage fileUrl={model.fileUrl} name={model.name} />

      <OverlayFrame config={overlayConfig} showCenterGuide={false} />

      <footer className="ar-camera-dock safe-x">
        <div className="camera-dock max-w-sm mx-auto px-4 py-3 flex items-center justify-between">
          <button
            onClick={() => setFacingMode((p) => (p === 'user' ? 'environment' : 'user'))}
            className="icon-btn rounded-full glass-thick"
            aria-label={t('ar.switchCamera')}
          >
            <SwitchCamera className="w-6 h-6" />
          </button>

          <p className="text-xs text-center text-secondary max-w-[10rem] leading-tight">
            {t('ar.viewInSpace')}
          </p>

          <div className="w-11 h-11 flex items-center justify-center" aria-hidden="true">
            <Box className="w-5 h-5 opacity-40" />
          </div>
        </div>
      </footer>
    </div>
  );
}
