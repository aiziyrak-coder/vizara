import { Link } from 'react-router-dom';
import { PageShell } from '../components/FuturisticBg';
import { LogoLink } from '../components/Logo';
import { useI18n } from '../lib/i18n-context';

export function NotFound() {
  const { t } = useI18n();

  return (
    <PageShell className="min-h-app flex flex-col safe-top safe-bottom">
      <div className="flex-1 flex items-center justify-center p-6">
        <div className="text-center max-w-sm">
          <LogoLink size="md" animated />
          <h1 className="text-6xl font-extrabold text-[#0f172a] mt-8 mb-2">{t('errors.notFound')}</h1>
          <p className="text-[#64748b] mb-6">{t('errors.pageNotFound')}</p>
          <Link to="/" className="btn btn-primary w-full sm:w-auto">{t('common.home')}</Link>
        </div>
      </div>
    </PageShell>
  );
}
