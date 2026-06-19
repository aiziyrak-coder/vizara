import type { ReactNode } from 'react';

interface PageHeaderProps {
  title: string;
  description?: string;
  action?: ReactNode;
}

export function PageHeader({ title, description, action }: PageHeaderProps) {
  return (
    <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between mb-5 sm:mb-6">
      <div className="min-w-0 flex-1">
        <h1 className="page-title break-words">{title}</h1>
        {description && <p className="page-desc break-words">{description}</p>}
      </div>
      {action && <div className="shrink-0 w-full sm:w-auto [&_.btn]:w-full sm:[&_.btn]:w-auto">{action}</div>}
    </div>
  );
}
