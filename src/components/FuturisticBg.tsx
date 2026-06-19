import { ReactNode } from 'react';

export function AppBackground() {
  return <div className="app-bg" aria-hidden="true" />;
}

export function PageShell({ children, className = '' }: { children: ReactNode; className?: string }) {
  return (
    <div className={`page ${className}`}>
      <AppBackground />
      <div className="page-inner">{children}</div>
    </div>
  );
}
