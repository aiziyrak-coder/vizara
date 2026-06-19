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
  sm: { mark: 32, full: 52 },
  md: { mark: 38, full: 64 },
  lg: { mark: 48, full: 80 },
  xl: { mark: 72, full: 120 },
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
  const useFullImage = showText && (isStacked || size === 'xl');

  if (useFullImage) {
    const h = s.full;
    const w = (h * 529) / 532;
    return (
      <div className="flex flex-col items-center text-center">
        <span
          className={`vizara-full-logo-wrap ${animated ? 'vizara-full-logo-wrap--animated' : ''}`}
          style={{ height: h, width: w }}
        >
          <img
            src="/vizara-logo.png"
            alt="Vizara"
            width={w}
            height={h}
            className={`vizara-full-logo ${variant === 'light' ? 'vizara-full-logo--light' : ''}`}
            draggable={false}
          />
        </span>
      </div>
    );
  }

  return (
    <div className="flex items-center gap-2.5">
      <VizaraMark height={s.mark} variant={variant} animated={animated} />
      {showText && (
        <span
          className={`font-bold tracking-tight leading-none ${
            variant === 'light' ? 'text-white' : 'text-[#003B73]'
          } ${size === 'sm' ? 'text-[15px]' : size === 'lg' ? 'text-xl' : 'text-[17px]'}`}
        >
          Vizara
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
  animated = false,
}: {
  to?: string;
  size?: 'sm' | 'md' | 'lg' | 'xl';
  variant?: VizaraMarkVariant;
  showTagline?: boolean;
  animated?: boolean;
}) {
  return (
    <Link to={to} className="inline-flex hover:opacity-90 transition-opacity duration-200 logo-link">
      <Logo
        size={size}
        variant={variant}
        showTagline={showTagline}
        animated={animated}
        stacked={showTagline}
      />
    </Link>
  );
}
