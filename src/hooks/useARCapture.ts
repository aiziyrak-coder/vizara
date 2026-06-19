import { useState, useRef, useCallback } from 'react';
import type { RefObject } from 'react';
import { captureFromVideo, shareCapture, type CaptureResult } from '../utils/capture';
import type { ModelViewerElement } from '../components/ARModelStage';
import { FacingMode, OverlayConfig } from '../types';
import { useI18n } from '../lib/i18n-context';

interface UseARCaptureOptions {
  videoRef: RefObject<HTMLVideoElement | null>;
  facingMode: FacingMode;
  overlayConfig: OverlayConfig;
  modelViewerRef?: RefObject<ModelViewerElement | null>;
  isReady: boolean;
}

export function useARCapture({
  videoRef,
  facingMode,
  overlayConfig,
  modelViewerRef,
  isReady,
}: UseARCaptureOptions) {
  const { t } = useI18n();
  const [captureMsg, setCaptureMsg] = useState('');
  const [captureResult, setCaptureResult] = useState<CaptureResult | null>(null);
  const [capturing, setCapturing] = useState(false);
  const [flash, setFlash] = useState(false);

  const handleCapture = useCallback(async () => {
    if (!videoRef.current || !isReady || capturing) return;

    setCapturing(true);
    setFlash(true);
    window.setTimeout(() => setFlash(false), 180);

    try {
      const result = await captureFromVideo(
        videoRef.current,
        facingMode,
        overlayConfig,
        modelViewerRef?.current ?? undefined
      );
      const shared = await shareCapture(result);

      if (shared) {
        setCaptureMsg(t('ar.photoSaved'));
        window.setTimeout(() => setCaptureMsg(''), 3000);
      } else {
        setCaptureResult(result);
      }
    } catch (err) {
      setCaptureMsg(err instanceof Error ? err.message : t('common.loadError'));
      window.setTimeout(() => setCaptureMsg(''), 4000);
    } finally {
      setCapturing(false);
    }
  }, [videoRef, isReady, capturing, facingMode, overlayConfig, modelViewerRef, t]);

  return {
    handleCapture,
    capturing,
    flash,
    captureMsg,
    captureResult,
    clearCaptureResult: () => setCaptureResult(null),
  };
}
