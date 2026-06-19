import { Link } from 'react-router-dom';

interface LogoProps {
  size?: 'sm' | 'md' | 'lg';
  showText?: boolean;
}

const sizes = {
  sm: { icon: 28, text: 'text-[15px]' },
  md: { icon: 32, text: 'text-[17px]' },
  lg: { icon: 36, text: 'text-xl' },
};

export function Logo({ size = 'md', showText = true }: LogoProps) {
  const s = sizes[size];

  return (
    <div className="flex items-center gap-2.5">
      <svg width={s.icon} height={s.icon} viewBox="0 0 32 32" fill="none" aria-hidden="true">
        <defs>
          <linearGradient id="logo-grad" x1="0" y1="0" x2="32" y2="32">
            <stop offset="0%" stopColor="#2ec4b6" />
            <stop offset="100%" stopColor="#1ba39c" />
          </linearGradient>
        </defs>
        <rect width="32" height="32" rx="9" fill="url(#logo-grad)" />
        <rect width="32" height="32" rx="9" fill="url(#logo-grad)" opacity="0.3" style={{ filter: 'blur(2px)' }} />
        <path d="M16 8v16M10 13h12M10 19h12" stroke="white" strokeWidth="2" strokeLinecap="round" />
        <circle cx="16" cy="16" r="3" fill="white" fillOpacity="0.95" />
      </svg>
      {showText && (
        <span className={`${s.text} font-bold tracking-tight text-[var(--color-ink)]`}>
          Vizara
        </span>
      )}
    </div>
  );
}

export function LogoLink({ to = '/', size = 'md' }: { to?: string; size?: 'sm' | 'md' | 'lg' }) {
  return (
    <Link to={to} className="inline-flex hover:opacity-85 transition-opacity duration-200">
      <Logo size={size} />
    </Link>
  );
}
