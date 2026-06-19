import { useState } from 'react';
import { Sparkles, Loader2 } from 'lucide-react';
import { useI18n } from '../../lib/i18n-context';
import { useToast } from '../../lib/toast-context';
import { api } from '../../lib/api';

export type AiGenerateTask =
  | 'hotspot'
  | 'tour_description'
  | 'scene_description'
  | 'experience'
  | 'organization'
  | 'improve_text'
  | 'marketing';

interface AiGenerateButtonProps {
  task: AiGenerateTask;
  context: Record<string, unknown>;
  onResult: (result: Record<string, string>) => void;
  label?: string;
  className?: string;
}

export function AiGenerateButton({
  task,
  context,
  onResult,
  label,
  className = '',
}: AiGenerateButtonProps) {
  const { t, locale } = useI18n();
  const { showToast } = useToast();
  const [loading, setLoading] = useState(false);

  const generate = async () => {
    setLoading(true);
    try {
      const { result } = await api.aiGenerate({ task, context, locale });
      onResult(result);
      showToast(t('ai.generated'), 'success');
    } catch (err) {
      showToast(err instanceof Error ? err.message : t('ai.error'), 'error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <button
      type="button"
      onClick={generate}
      disabled={loading}
      className={`ai-gen-btn ${className}`}
      title={label || t('ai.generate')}
    >
      {loading ? (
        <Loader2 className="w-3.5 h-3.5 animate-spin" />
      ) : (
        <Sparkles className="w-3.5 h-3.5" />
      )}
      <span>{loading ? t('ai.generating') : (label || t('ai.generate'))}</span>
    </button>
  );
}

interface AiLabelRowProps {
  label: string;
  task?: AiGenerateTask;
  context?: Record<string, unknown>;
  onResult?: (result: Record<string, string>) => void;
  improveField?: string;
  improveValue?: string;
}

export function AiLabelRow({
  label,
  task,
  context,
  onResult,
  improveField,
  improveValue,
}: AiLabelRowProps) {
  const improveContext = improveField && improveValue
    ? { text: improveValue, field: improveField, ...context }
    : context;

  const improveTask = improveField ? 'improve_text' as const : task;

  if (!improveTask || !improveContext || !onResult) {
    return <label className="label">{label}</label>;
  }

  return (
    <div className="flex items-center justify-between gap-2 mb-1">
      <label className="label mb-0">{label}</label>
      <AiGenerateButton
        task={improveTask}
        context={improveContext}
        onResult={onResult}
        label={improveField ? undefined : undefined}
        className="!py-1 !px-2 text-xs"
      />
    </div>
  );
}
