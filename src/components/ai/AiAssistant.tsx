import { useState, useRef, useEffect, type KeyboardEvent } from 'react';
import { Sparkles, X, Send, Loader2 } from 'lucide-react';
import { useLocation } from 'react-router-dom';
import { useAuth } from '../../lib/auth-context';
import { useI18n } from '../../lib/i18n-context';
import { useToast } from '../../lib/toast-context';
import { api } from '../../lib/api';

interface ChatMessage {
  role: 'user' | 'assistant';
  content: string;
}

export function AiAssistant() {
  const { currentOrg } = useAuth();
  const { t, locale } = useI18n();
  const { showToast } = useToast();
  const location = useLocation();
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

  const pageContext = `${location.pathname}${currentOrg ? ` | ${currentOrg.name}` : ''}`;

  const send = async () => {
    const text = input.trim();
    if (!text || loading) return;

    const nextMessages: ChatMessage[] = [...messages, { role: 'user', content: text }];
    setMessages(nextMessages);
    setInput('');
    setLoading(true);

    try {
      const { reply } = await api.aiChat({
        messages: nextMessages,
        locale,
        orgId: currentOrg?.id,
        pageContext,
      });
      setMessages([...nextMessages, { role: 'assistant', content: reply }]);
    } catch (err) {
      showToast(err instanceof Error ? err.message : t('ai.error'), 'error');
      setMessages(messages);
      setInput(text);
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
        className="ai-fab"
        onClick={() => setOpen((v) => !v)}
        aria-label={t('ai.assistant')}
        title={t('ai.assistant')}
      >
        {open ? <X className="w-5 h-5" /> : <Sparkles className="w-5 h-5" />}
      </button>

      {open && (
        <div className="ai-panel" role="dialog" aria-label={t('ai.assistant')}>
          <div className="ai-panel-header">
            <div className="flex items-center gap-2 min-w-0">
              <Sparkles className="w-4 h-4 text-[var(--brand)] shrink-0" />
              <div className="min-w-0">
                <p className="font-semibold text-sm truncate">{t('ai.assistant')}</p>
                <p className="text-[11px] text-secondary truncate">{t('ai.assistantDesc')}</p>
              </div>
            </div>
            <button type="button" className="icon-btn shrink-0" onClick={() => setOpen(false)} aria-label={t('common.close')}>
              <X className="w-4 h-4" />
            </button>
          </div>

          <div ref={listRef} className="ai-panel-messages">
            {messages.length === 0 && (
              <div className="ai-welcome">
                <p className="text-sm font-medium mb-2">{t('ai.welcome')}</p>
                <div className="space-y-1.5">
                  {[t('ai.suggest1'), t('ai.suggest2'), t('ai.suggest3')].map((s) => (
                    <button
                      key={s}
                      type="button"
                      className="ai-suggest-chip"
                      onClick={() => { setInput(s); inputRef.current?.focus(); }}
                    >
                      {s}
                    </button>
                  ))}
                </div>
              </div>
            )}
            {messages.map((m, i) => (
              <div key={i} className={`ai-msg ai-msg--${m.role}`}>
                {m.content}
              </div>
            ))}
            {loading && (
              <div className="ai-msg ai-msg--assistant flex items-center gap-2">
                <Loader2 className="w-4 h-4 animate-spin" />
                {t('ai.thinking')}
              </div>
            )}
          </div>

          <div className="ai-panel-input">
            <textarea
              ref={inputRef}
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder={t('ai.placeholder')}
              rows={2}
              className="ai-input"
              disabled={loading}
            />
            <button
              type="button"
              onClick={send}
              disabled={loading || !input.trim()}
              className="ai-send-btn"
              aria-label={t('ai.send')}
            >
              <Send className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}
    </>
  );
}
