import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { api } from '../lib/api';
import { VirtualTourViewer } from '../components/VirtualTourViewer';
import { AlertCircle } from 'lucide-react';
import { LoadingSpinner } from '../components/ui/LoadingSpinner';
import { Logo } from '../components/Logo';
import { useI18n } from '../lib/i18n-context';

export function PublicTour() {
  const { orgSlug, tourSlug } = useParams<{ orgSlug: string; tourSlug: string }>();
  const { t } = useI18n();
  const [data, setData] = useState<Awaited<ReturnType<typeof api.getPublicTour>> | null>(null);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!orgSlug || !tourSlug) return;
    api.getPublicTour(orgSlug, tourSlug)
      .then(setData)
      .catch((err) => setError(err instanceof Error ? err.message : t('common.loadError')))
      .finally(() => setLoading(false));
  }, [orgSlug, tourSlug, t]);

  if (loading) {
    return (
      <div className="min-h-app flex items-center justify-center bg-[#0f172a] safe-top safe-bottom">
        <LoadingSpinner label={t('tours.loading')} />
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="min-h-app flex items-center justify-center p-4 bg-[#0f172a] safe-top safe-bottom">
        <div className="text-center max-w-sm card p-8 w-full">
          <AlertCircle className="w-10 h-10 text-red-400 mx-auto mb-4" />
          <p className="text-lg font-bold text-white mb-2">{t('tours.notFound')}</p>
          <p className="text-white/60 text-sm">{error || t('tours.notFoundDesc')}</p>
          <div className="mt-6 flex justify-center"><Logo size="sm" animated /></div>
        </div>
      </div>
    );
  }

  return (
    <VirtualTourViewer
      orgSlug={orgSlug!}
      tourSlug={tourSlug!}
      tour={data.tour}
      organization={data.organization}
      scenes={data.scenes}
      whiteLabel={data.plan?.whiteLabel}
    />
  );
}
