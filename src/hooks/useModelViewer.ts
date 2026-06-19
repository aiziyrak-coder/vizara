import { useEffect, useState } from 'react';

const SCRIPT_URL = 'https://ajax.googleapis.com/ajax/libs/model-viewer/4.0.0/model-viewer.min.js';

export function useModelViewer() {
  const [ready, setReady] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    async function load() {
      try {
        if (!customElements.get('model-viewer')) {
          const existing = document.querySelector('script[data-model-viewer]');
          if (!existing) {
            await new Promise<void>((resolve, reject) => {
              const script = document.createElement('script');
              script.type = 'module';
              script.src = SCRIPT_URL;
              script.setAttribute('data-model-viewer', 'true');
              script.onload = () => resolve();
              script.onerror = () => reject(new Error('model-viewer'));
              document.head.appendChild(script);
            });
          }
          await customElements.whenDefined('model-viewer');
        }
        if (!cancelled) setReady(true);
      } catch {
        if (!cancelled) setError('model-viewer');
      }
    }

    load();
    return () => {
      cancelled = true;
    };
  }, []);

  return { ready, error };
}
