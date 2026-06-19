import { useEffect, useRef } from 'react';
import { Box } from 'lucide-react';
import { Logo } from './Logo';
import { useI18n } from '../lib/i18n-context';
import { resolveUploadUrl } from '../lib/assets';

interface ModelARViewerProps {
  organization: { name: string; brandColor: string; website?: string };
  model?: { fileUrl: string; name: string };
  experienceName: string;
  whiteLabel?: boolean;
}

export function ModelARViewer({ organization, model, experienceName, whiteLabel }: ModelARViewerProps) {
  const { t } = useI18n();
  const scriptLoaded = useRef(false);

  useEffect(() => {
    if (scriptLoaded.current) return;
    if (document.querySelector('script[data-model-viewer]')) { scriptLoaded.current = true; return; }
    const script = document.createElement('script');
    script.type = 'module';
    script.src = 'https://ajax.googleapis.com/ajax/libs/model-viewer/4.0.0/model-viewer.min.js';
    script.setAttribute('data-model-viewer', 'true');
    document.head.appendChild(script);
    scriptLoaded.current = true;
  }, []);

  if (!model) {
    return (
      <div className="min-h-app flex items-center justify-center p-4" style={{ background: 'var(--color-bg)' }}>
        <p className="text-secondary">{t('ar.modelNotFound')}</p>
      </div>
    );
  }

  const brand = organization.brandColor || '#1ba39c';

  return (
    <div className="h-app flex flex-col safe-top safe-bottom" style={{ background: '#1a1a1a' }}>
      <header className="ar-bar border-b px-4 py-3 flex items-center justify-between gap-2 shrink-0 safe-x">
        <div className="flex items-center gap-2.5 min-w-0">
          <div className="icon-glass w-9 h-9 shrink-0" style={{ background: brand, border: 'none' }}>
            <Box className="w-4 h-4 text-white" />
          </div>
          <div className="min-w-0">
            <p className="font-semibold text-sm truncate">{organization.name}</p>
            <p className="text-xs text-secondary truncate">{experienceName}</p>
          </div>
        </div>
        {!whiteLabel && <div className="shrink-0"><Logo size="sm" /></div>}
      </header>

      <div className="flex-1 relative min-h-0 bg-[#1a1a1a]">
        <model-viewer
          src={resolveUploadUrl(model.fileUrl)}
          ar
          ar-modes="webxr scene-viewer quick-look"
          camera-controls
          touch-action="pan-y"
          alt={model.name}
          loading="eager"
          reveal="auto"
          shadow-intensity="1"
          shadow-softness="0.5"
          exposure="1"
          environment-image="neutral"
          skybox-image="neutral"
          tone-mapping="aces"
          style={{ width: '100%', height: '100%', background: 'transparent' }}
        />
      </div>

      <footer className="ar-bar border-t px-4 py-3 text-center shrink-0 safe-x">
        <p className="text-xs text-secondary">{t('ar.viewInSpace')}</p>
        {organization.website && (
          <a
            href={organization.website.startsWith('http') ? organization.website : `https://${organization.website}`}
            target="_blank"
            rel="noopener noreferrer"
            className="text-xs font-semibold mt-1 inline-block"
            style={{ color: brand }}
          >
            {organization.website}
          </a>
        )}
      </footer>
    </div>
  );
}
