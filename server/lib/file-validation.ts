import fs from 'fs';
import path from 'path';
import { MODELS_DIR, QR_DIR, UPLOADS_DIR } from './paths.js';

const SAFE_FILENAME = /^[a-zA-Z0-9._-]+$/;

export function resolveModelFilePath(fileUrl: string): string | null {
  if (!fileUrl.startsWith('/uploads/models/')) return null;
  const filename = fileUrl.slice('/uploads/models/'.length);
  if (!filename || !SAFE_FILENAME.test(filename) || filename.includes('..')) return null;
  const resolved = path.resolve(MODELS_DIR, filename);
  if (!resolved.startsWith(path.resolve(MODELS_DIR))) return null;
  return resolved;
}

export function resolveQrFilePath(fileUrl: string): string | null {
  if (!fileUrl.startsWith('/uploads/qr/')) return null;
  const filename = fileUrl.slice('/uploads/qr/'.length);
  if (!filename || !SAFE_FILENAME.test(filename) || filename.includes('..')) return null;
  const resolved = path.resolve(QR_DIR, filename);
  if (!resolved.startsWith(path.resolve(QR_DIR))) return null;
  return resolved;
}

export function resolveUploadPath(fileUrl: string): string | null {
  return resolveModelFilePath(fileUrl) ?? resolveQrFilePath(fileUrl);
}

export function isSafeSlug(value: string): boolean {
  if (!value || value.length > 64) return false;
  return /^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(value);
}

/** GLB files start with "glTF" at byte 0; GLTF is JSON text starting with "{". */
export function isValidModelBuffer(buffer: Buffer, ext: string): boolean {
  if (buffer.length < 4) return false;
  if (ext === '.glb') {
    return buffer.subarray(0, 4).toString('ascii') === 'glTF';
  }
  if (ext === '.gltf') {
    const head = buffer.subarray(0, 64).toString('utf8').trimStart();
    return head.startsWith('{') && head.includes('"asset"');
  }
  return false;
}

export function ensureUploadsWritable(): boolean {
  try {
    const testFile = path.join(UPLOADS_DIR, '.write-test');
    fs.writeFileSync(testFile, 'ok');
    fs.unlinkSync(testFile);
    return true;
  } catch {
    return false;
  }
}
