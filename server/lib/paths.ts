import path from 'path';

export const ROOT_DIR = process.cwd();
export const UPLOADS_DIR = path.join(ROOT_DIR, 'uploads');
export const MODELS_DIR = path.join(UPLOADS_DIR, 'models');
export const QR_DIR = path.join(UPLOADS_DIR, 'qr');
export const DIST_DIR = path.join(ROOT_DIR, 'dist');

/** Server-level upload cap (plan limit is separate). Default 4 GB. */
export const MAX_UPLOAD_BYTES =
  Number(process.env.MAX_UPLOAD_SIZE_MB || 4096) * 1024 * 1024;
