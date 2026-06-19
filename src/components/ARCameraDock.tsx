import { SwitchCamera, Camera } from 'lucide-react';
import { useI18n } from '../lib/i18n-context';

interface ARCameraDockProps {
  onSwitchCamera: () => void;
  onCapture?: () => void;
  capturing?: boolean;
  captureDisabled?: boolean;
  centerHint?: string;
}

export function ARCameraDock({
  onSwitchCamera,
  onCapture,
  capturing = false,
  captureDisabled = false,
  centerHint,
}: ARCameraDockProps) {
  const { t } = useI18n();
  const showCapture = Boolean(onCapture);

  return (
    <footer className="ar-camera-dock safe-x">
      <div className="camera-dock max-w-sm mx-auto px-4 py-3 flex items-center justify-between">
        <button
          type="button"
          onClick={onSwitchCamera}
          className="icon-btn rounded-full glass-thick"
          aria-label={t('ar.switchCamera')}
        >
          <SwitchCamera className="w-6 h-6" />
        </button>

        {showCapture ? (
          <button
            type="button"
            onClick={onCapture}
            disabled={captureDisabled || capturing}
            className="capture-btn"
            style={{ touchAction: 'manipulation' }}
            aria-label={t('ar.capture')}
          >
            <Camera className="w-8 h-8" />
          </button>
        ) : (
          <p className="text-xs text-center text-secondary max-w-[10rem] leading-tight px-2">
            {centerHint}
          </p>
        )}

        <div className="w-11 h-11" aria-hidden="true" />
      </div>
    </footer>
  );
}
