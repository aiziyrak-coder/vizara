import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../lib/auth-context';
import type { ReactNode } from 'react';

export function GuestRoute({ children }: { children: ReactNode }) {
  const { user, isLoading } = useAuth();
  const location = useLocation();

  if (isLoading) {
    return (
      <div className="min-h-app flex items-center justify-center bg-[#f8fafc]">
        <div className="glass-spinner" />
      </div>
    );
  }

  if (user) return <Navigate to="/dashboard" replace state={{ from: location }} />;
  return <>{children}</>;
}
