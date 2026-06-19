import { FacingMode, OverlayConfig, DEFAULT_OVERLAY } from '../types';

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
  ctx.fillStyle = 'rgba(255,255,255,0.55)';
  ctx.fillText(cfg.watermark || 'Powered by Vizara', m, height - m);
}

export const takeSnapshot = async (
  video: HTMLVideoElement,
  facingMode: FacingMode,
  config?: OverlayConfig
): Promise<void> => {
  if (!video.videoWidth || !video.videoHeight) {
    throw new Error('Kamera hali tayyor emas. Biroz kuting va qayta urinib ko\'ring.');
  }

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

  drawOverlay(ctx, canvas.width, canvas.height, config);

  const filename = `vizara-photo-${Date.now()}.png`;

  await new Promise<void>((resolve, reject) => {
    canvas.toBlob(async (blob) => {
      if (!blob) {
        reject(new Error('Rasm yaratib bo\'lmadi'));
        return;
      }

      try {
        const file = new File([blob], filename, { type: 'image/png' });
        if (navigator.share && navigator.canShare?.({ files: [file] })) {
          await navigator.share({ files: [file], title: 'Vizara Photo' });
          resolve();
          return;
        }

        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = filename;
        document.body.appendChild(link);
        link.click();
        link.remove();
        URL.revokeObjectURL(url);
        resolve();
      } catch (err) {
        reject(err instanceof Error ? err : new Error('Rasm saqlanmadi'));
      }
    }, 'image/png', 0.92);
  });
};
