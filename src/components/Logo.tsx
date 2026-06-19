import { Link } from 'react-router-dom';
import { VizaraMark, type VizaraMarkVariant } from './VizaraMark';

interface LogoProps {
  size?: 'sm' | 'md' | 'lg' | 'xl';
  showText?: boolean;
  showTagline?: boolean;
  animated?: boolean;
  variant?: VizaraMarkVariant;
  stacked?: boolean;
}

const sizes = {
  sm: { mark: 30, name: 'text-[15px]', tagline: 'text-[7px]' },
  md: { mark: 36, name: 'text-[17px]', tagline: 'text-[8px]' },
  lg: { mark: 44, name: 'text-xl', tagline: 'text-[9px]' },
  xl: { mark: 72, name: 'text-3xl', tagline: 'text-[11px] tracking-[0.22em]' },
};

export function Logo({
  size = 'md',
  showText = true,
  showTagline = false,
  animated = false,
  variant = 'default',
  stacked,
}: LogoProps) {
  const s = sizes[size];
  const isStacked = stacked ?? (showTagline || size === 'xl');
  const nameColor = variant === 'light' ? 'text-white' : 'text-[#003B73]';
  const taglineColor = variant === 'light' ? 'text-white/70' : 'text-[#4A4A4A]';

  return (
    <div
      className={
        isStacked
          ? 'flex flex-col items-center gap-1 text-center'
          : 'flex items-center gap-2.5'
      }
    >
      <VizaraMark height={s.mark} variant={variant} animated={animated} />
      {showText && (
        <span className={`${s.name} font-bold tracking-tight leading-none ${nameColor}`}>
          Vizara
        </span>
      )}
      {showTagline && (
        <span
          className={`${s.tagline} font-medium uppercase tracking-[0.18em] leading-tight ${taglineColor}`}
        >
          Web AR &amp; Virtual Tour
        </span>
      )}
    </div>
  );
}

export function LogoLink({
  to = '/',
  size = 'md',
  variant = 'default',
  showTagline = false,
}: {
  to?: string;
  size?: 'sm' | 'md' | 'lg' | 'xl';
  variant?: VizaraMarkVariant;
  showTagline?: boolean;
}) {
  return (
    <Link to={to} className="inline-flex hover:opacity-85 transition-opacity duration-200">
      <Logo size={size} variant={variant} showTagline={showTagline} />
    </Link>
  );
}
