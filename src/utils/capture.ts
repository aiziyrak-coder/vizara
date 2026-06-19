import { FacingMode, OverlayConfig, DEFAULT_OVERLAY } from '../types';

export interface CaptureResult {
  blob: Blob;
  dataUrl: string;
  filename: string;
}

export function drawOverlay(
  ctx: CanvasRenderingContext2D,
  width: number,
  height: number,
  config: OverlayConfig = {}
) {
  const cfg = { ...DEFAULT_OVERLAY, ...config };
  const scale = width / 1080;

  if (cfg.showGrid) {
    ctx.strokeStyle = 'rgba(13, 148, 136, 0.15)';
    ctx.lineWidth = 1 * scale;
    const gridSize = 100 * scale;
    for (let x = 0; x < width; x += gridSize) {
      ctx.beginPath();
      ctx.moveTo(x, 0);
      ctx.lineTo(x, height);
      ctx.stroke();
    }
    for (let y = 0; y < height; y += gridSize) {
      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.lineTo(width, y);
      ctx.stroke();
    }
  }

  const m = 48 * scale;
  const brandColor = cfg.brandColor || '#1ba39c';

  ctx.fillStyle = brandColor;
  ctx.fillRect(m, m, 48 * scale, 48 * scale);
  ctx.fillStyle = 'white';
  ctx.font = `bold ${28 * scale}px sans-serif`;
  ctx.textAlign = 'left';
  ctx.fillText((cfg.title || 'Vizara').toUpperCase(), m + 64 * scale, m + 30 * scale);

  ctx.font = `${14 * scale}px sans-serif`;
  ctx.fillStyle = 'rgba(255,255,255,0.75)';
  ctx.fillText(cfg.subtitle || '', m + 64 * scale, m + 50 * scale);

  ctx.strokeStyle = 'rgba(255, 255, 255, 0.5)';
  ctx.lineWidth = 3 * scale;
  const cSize = 48 * scale;
  ctx.beginPath();
  ctx.moveTo(m + cSize, m);
  ctx.lineTo(m, m);
  ctx.lineTo(m, m + cSize);
  ctx.stroke();
  ctx.beginPath();
  ctx.moveTo(width - m - cSize, m);
  ctx.lineTo(width - m, m);
  ctx.lineTo(width - m, m + cSize);
  ctx.stroke();

  ctx.font = `bold ${22 * scale}px sans-serif`;
  ctx.fillStyle = 'rgba(255,255,255,0.85)';
  ctx.textAlign = 'left';
  ctx.fillText(cfg.website || '', m, height - m - 20 * scale);

  ctx.font = `${14 * scale}px sans-serif`;
  ctx.fillStyle = 'rgba(255, 255, 255, 0.55)';
  ctx.fillText(cfg.watermark || 'Powered by Vizara', m, height - m);
}

function waitForVideoFrame(video: HTMLVideoElement): Promise<void> {
  if (video.videoWidth > 0 && video.videoHeight > 0) {
    return Promise.resolve();
  }

  return new Promise((resolve, reject) => {
    const timeout = window.setTimeout(() => {
      cleanup();
      reject(new Error('Kamera hali tayyor emas. Biroz kuting va qayta urinib ko\'ring.'));
    }, 8000);

    const onReady = () => {
      if (video.videoWidth > 0 && video.videoHeight > 0) {
        cleanup();
        resolve();
      }
    };

    const cleanup = () => {
      window.clearTimeout(timeout);
      video.removeEventListener('loadeddata', onReady);
      video.removeEventListener('resize', onReady);
    };

    video.addEventListener('loadeddata', onReady);
    video.addEventListener('resize', onReady);
    onReady();
  });
}

function canvasToBlob(canvas: HTMLCanvasElement): Promise<Blob> {
  return new Promise((resolve, reject) => {
    canvas.toBlob(
      (blob) => {
        if (blob) {
          resolve(blob);
          return;
        }
        try {
          const dataUrl = canvas.toDataURL('image/jpeg', 0.92);
          const byteString = atob(dataUrl.split(',')[1] || '');
          const mime = 'image/jpeg';
          const buffer = new Uint8Array(byteString.length);
          for (let i = 0; i < byteString.length; i++) {
            buffer[i] = byteString.charCodeAt(i);
          }
          resolve(new Blob([buffer], { type: mime }));
        } catch {
          reject(new Error('Rasm yaratib bo\'lmadi'));
        }
      },
      'image/jpeg',
      0.92
    );
  });
}

export async function captureFromVideo(
  video: HTMLVideoElement,
  facingMode: FacingMode,
  config?: OverlayConfig,
  modelViewer?: HTMLElement & { toDataURL?: (type?: string, quality?: number) => Promise<string> }
): Promise<CaptureResult> {
  await waitForVideoFrame(video);

  const canvas = document.createElement('canvas');
  canvas.width = video.videoWidth;
  canvas.height = video.videoHeight;
  const ctx = canvas.getContext('2d');
  if (!ctx) throw new Error('Rasm yaratib bo\'lmadi');

  if (facingMode === 'user') {
    ctx.translate(canvas.width, 0);
    ctx.scale(-1, 1);
  }
  ctx.drawImage(video, 0, 0, canvas.width, canvas.height);

  if (facingMode === 'user') {
    ctx.translate(canvas.width, 0);
    ctx.scale(-1, 1);
  }

  if (modelViewer?.toDataURL) {
    try {
      const modelDataUrl = await modelViewer.toDataURL('image/png');
      const modelImg = await loadImage(modelDataUrl);
      ctx.drawImage(modelImg, 0, 0, canvas.width, canvas.height);
    } catch {
      // Model layer optional — still save camera frame
    }
  }

  drawOverlay(ctx, canvas.width, canvas.height, config);

  const blob = await canvasToBlob(canvas);
  const dataUrl = canvas.toDataURL('image/jpeg', 0.92);
  const filename = `vizara-photo-${Date.now()}.jpg`;

  return { blob, dataUrl, filename };
}

function loadImage(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = () => reject(new Error('Model qatlamini yuklab bo\'lmadi'));
    img.src = src;
  });
}

function isShareCancelled(err: unknown): boolean {
  if (!(err instanceof Error)) return false;
  return err.name === 'AbortError' || /cancel|abort|dismiss/i.test(err.message);
}

export async function shareCapture(result: CaptureResult): Promise<boolean> {
  const file = new File([result.blob], result.filename, { type: result.blob.type || 'image/jpeg' });

  if (navigator.share) {
    try {
      if (navigator.canShare?.({ files: [file] })) {
        await navigator.share({ files: [file], title: 'Vizara Photo' });
        return true;
      }
      await navigator.share({ title: 'Vizara Photo', text: 'Vizara Photo' });
      return true;
    } catch (err) {
      if (isShareCancelled(err)) return false;
      throw err;
    }
  }

  return false;
}

export async function downloadCapture(result: CaptureResult): Promise<void> {
  const url = URL.createObjectURL(result.blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = result.filename;
  link.rel = 'noopener';
  document.body.appendChild(link);
  link.click();
  link.remove();
  window.setTimeout(() => URL.revokeObjectURL(url), 1000);
}

/** @deprecated Use captureFromVideo + shareCapture */
export const takeSnapshot = async (
  video: HTMLVideoElement,
  facingMode: FacingMode,
  config?: OverlayConfig
): Promise<void> => {
  const result = await captureFromVideo(video, facingMode, config);
  const shared = await shareCapture(result);
  if (!shared) {
    await downloadCapture(result);
  }
};
