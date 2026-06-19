interface MarqueeBandProps {
  items: string[];
}

export function MarqueeBand({ items }: MarqueeBandProps) {
  const row = [...items, ...items];

  return (
    <div className="landing-marquee" aria-hidden="true">
      <div className="landing-marquee-track">
        {row.map((item, i) => (
          <span key={`${item}-${i}`} className="landing-marquee-item">
            <span className="landing-marquee-dot" />
            {item}
          </span>
        ))}
      </div>
    </div>
  );
}
