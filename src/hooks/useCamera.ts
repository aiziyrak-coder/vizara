import { useState, useEffect, useRef, useCallback } from 'react';
import { FacingMode } from '../types';

export function useCamera(facingMode: FacingMode) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const stopStream = useCallback((stream: MediaStream | null) => {
    stream?.getTracks().forEach((track) => track.stop());
  }, []);

  const attachStream = useCallback(async (mediaStream: MediaStream) => {
    streamRef.current = mediaStream;
    const video = videoRef.current;
    if (!video) return;

    video.srcObject = mediaStream;
    video.setAttribute('playsinline', 'true');
    video.muted = true;

    await new Promise<void>((resolve) => {
      if (video.readyState >= 1) {
        resolve();
        return;
      }
      video.onloadedmetadata = () => resolve();
    });

    await video.play().catch(() => {});
    setIsLoading(false);
    setError(null);
  }, []);

  const startCamera = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    stopStream(streamRef.current);
    streamRef.current = null;

    if (!navigator.mediaDevices?.getUserMedia) {
      setError('Brauzeringiz kamerani qo\'llab-quvvatlamaydi.');
      setIsLoading(false);
      return;
    }

    try {
      const mediaStream = await navigator.mediaDevices.getUserMedia({
        video: {
          facingMode: { ideal: facingMode },
          width: { ideal: 1920 },
          height: { ideal: 1080 },
        },
        audio: false,
      });
      await attachStream(mediaStream);
    } catch {
      try {
        const fallback = await navigator.mediaDevices.getUserMedia({
          video: true,
          audio: false,
        });
        await attachStream(fallback);
      } catch {
        setError('Kameraga ruxsat berilmadi yoki qurilma topilmadi.');
        setIsLoading(false);
      }
    }
  }, [attachStream, facingMode, stopStream]);

  useEffect(() => {
    let cancelled = false;

    startCamera().catch(() => {
      if (!cancelled) {
        setError('Kamerani ishga tushirib bo\'lmadi.');
        setIsLoading(false);
      }
    });

    return () => {
      cancelled = true;
      stopStream(streamRef.current);
      streamRef.current = null;
    };
  }, [facingMode, startCamera, stopStream]);

  const retry = () => {
    startCamera();
  };

  return { videoRef, error, isLoading, retry };
}
