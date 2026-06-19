import { Logo } from '../Logo';

export function LoadingSpinner({ label }: { label?: string }) {
  return (
    <div className="flex flex-col items-center justify-center py-16 gap-4">
      <Logo size="lg" showText animated stacked />
      {label && <p className="text-sm text-secondary">{label}</p>}
    </div>
  );
}
