export function LoadingSpinner({ label }: { label?: string }) {
  return (
    <div className="flex flex-col items-center justify-center py-16 gap-3">
      <div className="glass-spinner" />
      {label && <p className="text-sm text-secondary">{label}</p>}
    </div>
  );
}
