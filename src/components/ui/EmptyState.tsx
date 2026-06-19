import type { LucideIcon } from 'lucide-react';
import type { ReactNode } from 'react';

interface EmptyStateProps {
  icon: LucideIcon;
  title: string;
  description?: string;
  action?: ReactNode;
}

export function EmptyState({ icon: Icon, title, description, action }: EmptyStateProps) {
  return (
    <div className="empty-state">
      <div className="empty-state-icon">
        <Icon className="w-7 h-7" style={{ color: 'var(--brand)' }} />
      </div>
      <p className="font-semibold mb-1">{title}</p>
      {description && <p className="text-sm text-secondary mb-5 max-w-xs mx-auto">{description}</p>}
      {action}
    </div>
  );
}
