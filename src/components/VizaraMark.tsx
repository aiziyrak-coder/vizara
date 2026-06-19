import { useId } from 'react';

const NAVY = '#003B73';
const TEAL = '#00A8B5';

export type VizaraMarkVariant = 'default' | 'light';

interface VizaraMarkProps {
  height?: number;
  variant?: VizaraMarkVariant;
  animated?: boolean;
  className?: string;
}

export function VizaraMark({
  height = 40,
  variant = 'default',
  animated = false,
  className = '',
}: VizaraMarkProps) {
  const uid = useId().replace(/:/g, '');
  const stroke = variant === 'light' ? '#ffffff' : NAVY;
  const accent = variant === 'light' ? '#7ee8df' : TEAL;
  const width = (height * 120) / 90;

  return (
    <svg
      width={width}
      height={height}
      viewBox="0 0 120 90"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden="true"
      className={`vizara-mark ${animated ? 'vizara-mark--animated' : ''} ${className}`.trim()}
    >
      <defs>
        <marker
          id={`arrow-${uid}`}
          markerWidth="6"
          markerHeight="6"
          refX="5"
          refY="3"
          orient="auto"
        >
          <path d="M0 0 L6 3 L0 6 Z" fill={accent} />
        </marker>
      </defs>

      <path
        d="M28 18 L58 78 L88 18"
        stroke={stroke}
        strokeWidth="7"
        strokeLinecap="square"
        strokeLinejoin="miter"
      />

      <g transform="translate(46, 20)">
        <g className="vizara-cube">
          <path
            d="M14 2 L26 9 L26 21 L14 28 L2 21 L2 9 Z"
            stroke={stroke}
            strokeWidth="1.8"
            strokeLinejoin="round"
          />
          <path d="M14 2 L14 28" stroke={stroke} strokeWidth="1.8" />
          <path d="M2 9 L14 16 L26 9" stroke={stroke} strokeWidth="1.8" />
          <path d="M14 16 L14 28" stroke={stroke} strokeWidth="1.8" />
        </g>
      </g>

      <g className="vizara-orbit" style={{ transformOrigin: '60px 48px' }}>
        <path
          d="M16 50 C16 32 36 30 58 40 C80 50 104 48 104 50"
          stroke={accent}
          strokeWidth="4"
          strokeLinecap="round"
          markerEnd={`url(#arrow-${uid})`}
        />
      </g>
    </svg>
  );
}
