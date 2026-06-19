import { useState, useRef, useEffect, type KeyboardEvent } from 'react';
import { Sparkles, X, Send, Loader2 } from 'lucide-react';
import { useI18n } from '../../lib/i18n-context';
import { api } from '../../lib/api';

interface ChatMessage {
  role: 'user' | 'assistant';
  content: string;
}

interface TourAiGuideProps {
  orgSlug: string;
  tourSlug: string;
  tourName: string;
  currentSceneId: string;
  brandColor?: string;
}

export function TourAiGuide({
  orgSlug,
  tourSlug,
  tourName,
  currentSceneId,
  brandColor = '#6366f1',
}: TourAiGuideProps) {
  const { t, locale } = useI18n();
  const [open, setOpen] = useState(false);
  const [enabled, setEnabled] = useState<boolean | null>(null);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const listRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    api.aiStatus()
      .then((s) => setEnabled(s.enabled))
      .catch(() => setEnabled(false));
  }, []);

  useEffect(() => {
    if (open && listRef.current) {
      listRef.current.scrollTop = listRef.current.scrollHeight;
    }
  }, [messages, open, loading]);

  useEffect(() => {
    if (open) inputRef.current?.focus();
  }, [open]);

  if (enabled === false) return null;

  const send = async () => {
    const text = input.trim();
    if (!text || loading) return;

    const nextMessages: ChatMessage[] = [...messages, { role: 'user', content: text }];
    setMessages(nextMessages);
    setInput('');
    setLoading(true);

    try {
      const { reply } = await api.aiTourChat({
        orgSlug,
        tourSlug,
        messages: nextMessages,
        locale,
        currentSceneId,
      });
      setMessages([...nextMessages, { role: 'assistant', content: reply }]);
    } catch (err) {
      setInput(text);
      setMessages([
        ...nextMessages,
        {
          role: 'assistant',
          content: err instanceof Error ? err.message : t('tours.aiError'),
        },
      ]);
    } finally {
      setLoading(false);
    }
  };

  const handleKeyDown = (e: KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      send();
    }
  };

  return (
    <>
      <button
        type="button"
        className="tour-ai-fab"
        onClick={() => setOpen((v) => !v)}
        style={{ background: `linear-gradient(135deg, ${brandColor}, #6366f1)` }}
        aria-label={t('tours.aiGuide')}
        title={t('tours.aiGuide')}
      >
        {open ? <X className="w-5 h-5" /> : <Sparkles className="w-5 h-5" />}
      </button>

      {open && (
        <div className="tour-ai-panel" role="dialog" aria-label={t('tours.aiGuide')}>
          <div className="tour-ai-panel-header">
            <div className="flex items-center gap-2 min-w-0">
              <Sparkles className="w-4 h-4 shrink-0" style={{ color: brandColor }} />
              <div className="min-w-0">
                <p className="font-semibold text-sm truncate text-white">{t('tours.aiGuide')}</p>
                <p className="text-[11px] text-white/55 truncate">{tourName}</p>
              </div>
            </div>
            <button type="button" className="tour-ai-close" onClick={() => setOpen(false)} aria-label={t('common.close')}>
              <X className="w-4 h-4" />
            </button>
          </div>

          <div ref={listRef} className="tour-ai-messages">
            {messages.length === 0 && (
              <div className="tour-ai-welcome">
                <p className="text-sm text-white/90 mb-2">{t('tours.aiWelcome')}</p>
                <div className="space-y-1.5">
                  {[t('tours.aiSuggest1'), t('tours.aiSuggest2'), t('tours.aiSuggest3')].map((s) => (
                    <button
                      key={s}
                      type="button"
                      className="tour-ai-suggest"
                      onClick={() => { setInput(s); inputRef.current?.focus(); }}
                    >
                      {s}
                    </button>
                  ))}
                </div>
              </div>
            )}
            {messages.map((m, i) => (
              <div key={i} className={`tour-ai-msg tour-ai-msg--${m.role}`}>
                {m.content}
              </div>
            ))}
            {loading && (
              <div className="tour-ai-msg tour-ai-msg--assistant flex items-center gap-2">
                <Loader2 className="w-4 h-4 animate-spin" />
                {t('tours.aiThinking')}
              </div>
            )}
          </div>

          <div className="tour-ai-input-row">
            <textarea
              ref={inputRef}
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder={t('tours.aiPlaceholder')}
              rows={2}
              className="tour-ai-input"
              disabled={loading}
            />
            <button
              type="button"
              onClick={send}
              disabled={loading || !input.trim()}
              className="tour-ai-send"
              style={{ backgroundColor: brandColor }}
              aria-label={t('tours.aiSend')}
            >
              <Send className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}
    </>
  );
}
