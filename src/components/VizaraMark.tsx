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
  const width = (height * 529) / 308;

  return (
    <span
      className={`vizara-icon-wrap ${animated ? 'vizara-icon-wrap--animated' : ''} ${className}`.trim()}
      style={{ height, width }}
      aria-hidden="true"
    >
      <img
        src="/vizara-icon.png"
        alt=""
        width={width}
        height={height}
        className={`vizara-icon-img ${variant === 'light' ? 'vizara-icon-img--light' : ''} ${animated ? 'vizara-icon-img--animated' : ''}`}
        draggable={false}
      />
      {animated && <span className="vizara-icon-glow" aria-hidden="true" />}
    </span>
  );
}
