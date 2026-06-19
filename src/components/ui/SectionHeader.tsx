interface SectionHeaderProps {
  eyebrow?: string;
  title: string;
  description?: string;
  align?: 'left' | 'center';
  className?: string;
}

export function SectionHeader({ eyebrow, title, description, align = 'left', className = '' }: SectionHeaderProps) {
  const alignClass = align === 'center' ? 'text-center mx-auto' : '';
  return (
    <div className={`mb-10 max-w-2xl ${alignClass} ${className}`}>
      {eyebrow && <p className="eyebrow mb-2">{eyebrow}</p>}
      <h2 className="section-title">{title}</h2>
      {description && <p className="section-desc mt-2">{description}</p>}
    </div>
  );
}
