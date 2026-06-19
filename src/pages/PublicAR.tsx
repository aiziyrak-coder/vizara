import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { api, PublicExperienceData } from '../lib/api';
import { ModelARViewer } from '../components/ModelARViewer';
import { PhotoZoneViewer } from '../components/PhotoZoneViewer';
import { AlertCircle } from 'lucide-react';
import { LoadingSpinner } from '../components/ui/LoadingSpinner';
import { Logo } from '../components/Logo';
import { useI18n } from '../lib/i18n-context';

export function PublicAR() {
  const { orgSlug, expSlug } = useParams<{ orgSlug: string; expSlug: string }>();
  const { t } = useI18n();
  const [data, setData] = useState<PublicExperienceData | null>(null);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!orgSlug || !expSlug) return;
    api.getPublicExperience(orgSlug, expSlug)
      .then(setData)
      .catch((err) => setError(err instanceof Error ? err.message : t('common.loadError')))
      .finally(() => setLoading(false));
  }, [orgSlug, expSlug, t]);

  if (loading) {
    return (
      <div className="min-h-app flex items-center justify-center bg-[#f8fafc] safe-top safe-bottom">
        <LoadingSpinner label={t('ar.loading')} />
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="min-h-app flex items-center justify-center p-4 bg-[#f8fafc] safe-top safe-bottom">
        <div className="text-center max-w-sm card p-8 w-full">
          <AlertCircle className="w-10 h-10 text-red-500 mx-auto mb-4" />
          <p className="text-lg font-bold text-[#0f172a] mb-2">{t('ar.notFound')}</p>
          <p className="text-[#64748b] text-sm">{error || t('ar.notFoundDesc')}</p>
          <div className="mt-6 flex justify-center"><Logo size="sm" animated /></div>
        </div>
      </div>
    );
  }

  if (data.experience.type === 'photo_zone') {
    return (
      <PhotoZoneViewer
        organization={data.organization}
        config={data.experience.config as Record<string, string>}
        whiteLabel={data.plan?.whiteLabel}
        model={data.model ?? undefined}
      />
    );
  }

  return (
    <ModelARViewer
      organization={data.organization}
      model={data.model}
      experienceName={data.experience.name}
      whiteLabel={data.plan?.whiteLabel}
    />
  );
}
