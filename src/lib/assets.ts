/** API origin without /api suffix — for static uploads */
export function getApiOrigin(): string {
  const url = import.meta.env.VITE_API_URL as string | undefined;
  if (url) return url.replace(/\/api\/?$/, '');
  return '';
}

/** Resolve /uploads/... to full URL when API is on another domain */
export function resolveUploadUrl(path: string | undefined | null): string {
  if (!path) return '';
  if (path.startsWith('http://') || path.startsWith('https://')) return path;
  const origin = getApiOrigin();
  if (origin) return `${origin}${path.startsWith('/') ? path : `/${path}`}`;
  return path;
}
