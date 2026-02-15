import { useState, useEffect, useRef } from 'react';
import { MessageCircle, X, Send, User, Calendar, Phone } from 'lucide-react';

const CALENDLY_BASE = 'https://calendly.com/dawinisti/30min';
// a1 = Zusammenfassung für Calendly-Frage "Wie stellst du dir deine Küche vor?"
const QUALIFICATION_REGEX = /QUALIFICATION:a1=([^\n]+)/;

function safeDecode(s: string): string {
  try {
    return decodeURIComponent(s.trim());
  } catch {
    return s.trim();
  }
}

function parseQualification(content: string): { cleanContent: string; a1?: string; a2?: string } {
  const match = content.match(QUALIFICATION_REGEX);
  if (!match) return { cleanContent: content.trim() };
  const cleanContent = content.replace(/\n?QUALIFICATION:a1=[^\n]+/, '').trim();
  return { cleanContent, a1: safeDecode(match[1]) };
}

function buildCalendlyEmbedUrl(a1?: string, a2?: string): string {
  const params = new URLSearchParams();
  if (typeof window !== 'undefined') params.set('embed_domain', window.location.hostname);
  params.set('embed_type', 'Inline');
  if (a1) params.set('a1', a1);
  if (a2) params.set('a2', a2);
  const q = params.toString();
  return `${CALENDLY_BASE}${q ? `?${q}` : ''}`;
}

/** Einfaches Rendering von **fett** und *kursiv*; Rest wird escaped. */
function renderMessageText(text: string): string {
  const escape = (s: string) =>
    s
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;');
  const escaped = escape(text);
  return escaped
    .replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
    .replace(/\*(.+?)\*/g, '<em>$1</em>')
    .replace(/\n/g, '<br />');
}

const CTA_TEXTS = [
  'Hast du Fragen, oder buchst du einen Termin?',
  'Lass uns über deine Traumküche sprechen.',
  'Beratungstermin vereinbaren? Hier entlang.',
];

function TypingCta({ texts = CTA_TEXTS, intervalMs = 4000 }: { texts?: string[]; intervalMs?: number }) {
  const [index, setIndex] = useState(0);
  const [display, setDisplay] = useState('');
  const [phase, setPhase] = useState<'typing' | 'hold' | 'deleting'>('typing');
  const full = texts[index % texts.length];

  useEffect(() => {
    if (phase === 'typing') {
      if (display.length < full.length) {
        const t = setTimeout(() => setDisplay(full.slice(0, display.length + 1)), 40);
        return () => clearTimeout(t);
      }
      setPhase('hold');
      return;
    }
    if (phase === 'hold') {
      const t = setTimeout(() => setPhase('deleting'), intervalMs);
      return () => clearTimeout(t);
    }
    if (phase === 'deleting') {
      if (display.length > 0) {
        const t = setTimeout(() => setDisplay(display.slice(0, -1)), 25);
        return () => clearTimeout(t);
      }
      setIndex((i) => i + 1);
      setPhase('typing');
    }
  }, [phase, display, full, intervalMs]);

  return (
    <span className="inline-block min-h-[1.25em]">
      {display}
      <span className="animate-pulse">|</span>
    </span>
  );
}

type ChatMessage = { role: 'user' | 'assistant'; content: string };

const TYPEWRITER_MS = 18;

export function ChatWidget() {
  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      role: 'assistant',
      content: 'Hey! Wie kann ich dir helfen, deine Traumküche wahr werden zu lassen? Schreib einfach los – oder sag Bescheid, wenn du einen Beratungstermin möchtest.',
    },
  ]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [calendlyOpen, setCalendlyOpen] = useState(false);
  const [qualificationData, setQualificationData] = useState<{ a1?: string; a2?: string }>({});
  const [typewriterIndex, setTypewriterIndex] = useState<number | null>(null);
  const [typewriterLen, setTypewriterLen] = useState(0);
  const listRef = useRef<HTMLDivElement>(null);
  const lastTypewriterDoneRef = useRef(-1);
  const [panelHeightPx, setPanelHeightPx] = useState<number | null>(null);
  const [panelWidthPx, setPanelWidthPx] = useState<number | null>(null);
  const lastAssistant = messages.filter((m) => m.role === 'assistant').pop();
  // CTA nur anzeigen, wenn der Bot aktiv einen Termin anbietet (nicht schon bei Fragen wie "Möchtest du einen Termin?")
  const showCalendlyCta =
    lastAssistant &&
    lastAssistant.content.includes('Hier kannst du dir einen Termin buchen');

  // Wenn eine neue Assistenten-Nachricht dazukommt, Typewriter dafür starten (nach loading → false)
  useEffect(() => {
    if (messages.length === 0 || loading) return;
    const lastIdx = messages.length - 1;
    const lastMsg = messages[lastIdx];
    if (lastMsg?.role !== 'assistant' || lastIdx <= lastTypewriterDoneRef.current) return;
    lastTypewriterDoneRef.current = lastIdx;
    setTypewriterIndex(lastIdx);
    setTypewriterLen(0);
  }, [messages, loading]);

  // Typewriter: Zeichen für Zeichen weiterschalten
  useEffect(() => {
    if (typewriterIndex == null || typewriterIndex >= messages.length) return;
    const msg = messages[typewriterIndex];
    if (msg?.role !== 'assistant') return;
    const total = msg.content.length;
    if (typewriterLen >= total) {
      setTypewriterIndex(null);
      return;
    }
    const t = setTimeout(() => setTypewriterLen((n) => n + 1), TYPEWRITER_MS);
    return () => clearTimeout(t);
  }, [typewriterIndex, typewriterLen, messages]);

  // Panel-Größe einmal beim Öffnen festlegen und für die ganze Session beibehalten (Breite + Höhe)
  useEffect(() => {
    if (open && panelHeightPx == null && typeof window !== 'undefined') {
      setPanelHeightPx(Math.max(420, Math.round(window.innerHeight * 0.7)));
      const w = Math.min(448, Math.max(320, window.innerWidth - 48));
      setPanelWidthPx(w);
    }
    if (!open) {
      setPanelHeightPx(null);
      setPanelWidthPx(null);
    }
  }, [open, panelHeightPx]);

  // Auto-Scroll bei neuer Nachricht und während Typewriter
  useEffect(() => {
    if (listRef.current) listRef.current.scrollTop = listRef.current.scrollHeight;
  }, [messages, typewriterLen]);

  const send = async () => {
    const text = input.trim();
    if (!text || loading) return;
    setInput('');
    setMessages((m) => [...m, { role: 'user', content: text }]);
    setLoading(true);
    const fullMessages = [...messages, { role: 'user' as const, content: text }];
    try {
      const res = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          messages: fullMessages.map((m) => ({ role: m.role, content: m.content })),
        }),
      });
      const raw = await res.text();
      let data: { message?: string; error?: string };
      try {
        data = raw ? JSON.parse(raw) : {};
      } catch {
        data = { error: res.ok ? 'Ungültige Antwort.' : `Fehler ${res.status}` };
      }
      if (!res.ok) {
        const errMsg = data?.error || res.statusText || 'Unbekannter Fehler';
        setMessages((m) => [
          ...m,
          { role: 'assistant', content: `Leider ist ein Fehler aufgetreten: ${errMsg}. Bitte später nochmal versuchen oder anrufen: 0521 77253396.` },
        ]);
        return;
      }
      const rawContent = data.message || 'Keine Antwort.';
      const { cleanContent, a1, a2 } = parseQualification(rawContent);
      if (a1 != null || a2 != null) setQualificationData((q) => ({ ...q, ...(a1 != null && { a1 }), ...(a2 != null && { a2 }) }));
      setMessages((m) => [...m, { role: 'assistant', content: cleanContent }]);
    } catch (e) {
      const err = e instanceof Error ? e.message : 'Netzwerkfehler';
      setMessages((m) => [
        ...m,
        { role: 'assistant', content: `Verbindung fehlgeschlagen (${err}). Ist der Server aktiv? Bitte „npm run server“ starten und erneut versuchen – oder anrufen: 0521 77253396.` },
      ]);
    } finally {
      setLoading(false);
    }
  };

  const glassBlack = 'bg-black/70 backdrop-blur-xl border border-white/20';
  // Glas-Morphismus: weniger Deckkraft, starker Blur
  const chatPanelOuter = 'backdrop-blur-2xl bg-white/50 border border-gray-200/90 shadow-[0_8px_32px_rgba(0,0,0,0.08),0_2px_12px_rgba(0,0,0,0.06),inset_0_1px_0_rgba(255,255,255,0.9)]';
  const chatAreaBg = 'bg-white/35 backdrop-blur-2xl border-t border-gray-200/50';
  const chatBubbleAssistant = 'bg-white/55 backdrop-blur-xl border border-white/80 text-gray-900 shadow-[inset_0_1px_0_0_rgba(255,255,255,0.9)]';
  const chatBubbleLoading = 'bg-white/50 backdrop-blur-xl border border-white/70 text-gray-600 shadow-[inset_0_1px_0_0_rgba(255,255,255,0.85)]';

  return (
    <div className="fixed bottom-6 right-6 z-[9998] flex flex-col items-end gap-2">
      {/* Panel – leicht transparent, glasig */}
      {open && (
        <div
          className={`rounded-2xl ${chatPanelOuter} overflow-hidden flex flex-col`}
          style={{
            width: panelWidthPx ?? Math.min(448, typeof window !== 'undefined' ? window.innerWidth - 48 : 448),
            minWidth: panelWidthPx ?? Math.min(448, typeof window !== 'undefined' ? window.innerWidth - 48 : 448),
            maxWidth: panelWidthPx ?? Math.min(448, typeof window !== 'undefined' ? window.innerWidth - 48 : 448),
            height: panelHeightPx ?? Math.max(420, typeof window !== 'undefined' ? window.innerHeight * 0.7 : 420),
            minHeight: panelHeightPx ?? Math.max(420, typeof window !== 'undefined' ? window.innerHeight * 0.7 : 420),
            maxHeight: panelHeightPx ?? Math.max(420, typeof window !== 'undefined' ? window.innerHeight * 0.7 : 420),
            flexShrink: 0,
            flexGrow: 0,
          }}
        >
          {/* Header: Weiß, schwarze Schrift; Schließen-Button mit grau-schwarzer Outline */}
          <div className="flex shrink-0 items-center justify-between gap-3 px-4 py-3 bg-white/95 backdrop-blur-xl border-b border-gray-200/80">
            <div className="flex items-center gap-3 min-w-0">
              <div className="flex-shrink-0 w-9 h-9 rounded-full overflow-hidden ring-2 ring-gray-200 bg-gray-100">
                <img
                  src="https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=96&h=96&fit=crop&crop=face"
                  alt="Jens Peter Landwehr"
                  className="w-full h-full object-cover"
                  onError={(e) => {
                    e.currentTarget.style.display = 'none';
                    const fallback = e.currentTarget.nextElementSibling as HTMLElement;
                    if (fallback) fallback.classList.remove('hidden');
                  }}
                />
                <div className="hidden w-full h-full flex items-center justify-center text-gray-500" aria-hidden>
                  <User className="w-5 h-5" />
                </div>
              </div>
              <div className="min-w-0">
                <p className="font-semibold text-sm truncate text-black">Jens Peter Landwehr</p>
                <p className="text-xs text-gray-700 truncate">architektenküchen · Chat</p>
              </div>
            </div>
            <button
              type="button"
              onClick={() => setOpen(false)}
              className="p-1.5 rounded-full bg-white border border-gray-300/90 shadow-sm hover:bg-gray-50 transition-colors flex-shrink-0 outline-none ring-1 ring-gray-200/80"
              aria-label="Chat schließen"
            >
              <X className="w-5 h-5 text-gray-800" />
            </button>
          </div>
          <div
            ref={listRef}
            className={`flex-1 min-h-0 overflow-y-auto overflow-x-hidden p-4 space-y-3 text-sm ${chatAreaBg} flex flex-col shrink min-h-0`}
          >
            {messages.length === 0 && !loading && (
              <p className="text-gray-500">
                Schreib deine Frage oder sag, dass du einen Termin buchen möchtest. Ich führe dich gern zu unserem Buchungslink.
              </p>
            )}
            {messages.map((m, i) => {
              const isAssistant = m.role === 'assistant';
              const showTypewriter = isAssistant && typewriterIndex === i;
              const displayContent = showTypewriter ? m.content.slice(0, typewriterLen) : m.content;
              const showCursor = showTypewriter && typewriterLen < m.content.length;
              return (
                <div
                  key={i}
                  className={`flex flex-shrink-0 ${m.role === 'user' ? 'justify-end' : 'justify-start'}`}
                >
                  <div
                    className={`max-w-[85%] rounded-2xl px-4 py-2 ${
                      m.role === 'user'
                        ? `${glassBlack} text-white rounded-br-md`
                        : `${chatBubbleAssistant} rounded-bl-md`
                    }`}
                  >
                    {m.role === 'user' ? (
                      m.content
                    ) : (
                      <>
                        <span
                          className="break-words [&_strong]:font-semibold [&_em]:italic"
                          dangerouslySetInnerHTML={{ __html: renderMessageText(displayContent) }}
                        />
                        {showCursor && <span className="animate-pulse">|</span>}
                      </>
                    )}
                  </div>
                </div>
              );
            })}
            {showCalendlyCta && (
              <div className="flex justify-start">
                <div className="max-w-[85%] rounded-2xl px-4 py-3 bg-black/75 backdrop-blur-md border border-gray-300/40 text-white text-sm space-y-2 shadow-sm">
                  <p>Hier kannst du dir einen Termin buchen – oder ruf mich persönlich an.</p>
                  <div className="flex flex-wrap gap-2">
                    <button
                      type="button"
                      onClick={() => setCalendlyOpen(true)}
                      className="inline-flex items-center gap-1.5 rounded-lg bg-white/20 hover:bg-white/30 px-3 py-1.5 text-xs font-medium transition-colors"
                    >
                      <Calendar className="w-4 h-4" />
                      Termin buchen
                    </button>
                    <a
                      href="tel:+4952177253396"
                      className="inline-flex items-center gap-1.5 rounded-lg bg-white/20 hover:bg-white/30 px-3 py-1.5 text-xs font-medium transition-colors"
                    >
                      <Phone className="w-4 h-4" />
                      0521 77253396
                    </a>
                  </div>
                </div>
              </div>
            )}
            {loading && (
              <div className="flex flex-shrink-0 justify-start">
                <div className={`${chatBubbleLoading} rounded-2xl rounded-bl-md px-4 py-2`}>
                  …
                </div>
              </div>
            )}
          </div>
          <form
            className="shrink-0 p-3 flex gap-2 bg-white/95 backdrop-blur-xl border-t border-gray-200/80"
            onSubmit={(e) => {
              e.preventDefault();
              send();
            }}
          >
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Nachricht eingeben…"
              className="flex-1 rounded-xl bg-gray-50/80 border border-gray-200 px-4 py-2 text-sm text-gray-900 placeholder:text-gray-500 focus:outline-none focus:ring-2 focus:ring-gray-300/50 focus:border-gray-300"
              disabled={loading}
            />
            <button
              type="submit"
              disabled={loading || !input.trim()}
              className="rounded-xl bg-white border border-gray-300/90 shadow-sm text-gray-800 p-2 disabled:opacity-50 hover:bg-gray-50 transition-colors ring-1 ring-gray-200/80"
              aria-label="Senden"
            >
              <Send className="w-5 h-5" />
            </button>
          </form>
        </div>
      )}

      {/* Calendly-Modal (über dem ganzen Fenster) */}
      {calendlyOpen && (
        <div
          className="fixed inset-0 z-[9999] bg-black/60 backdrop-blur-sm flex flex-col items-center justify-center p-4"
          role="dialog"
          aria-modal="true"
          aria-label="Termin buchen"
        >
          <button
            type="button"
            onClick={() => setCalendlyOpen(false)}
            className="absolute top-4 right-4 z-10 rounded-full bg-white/90 text-black p-2 hover:bg-white shadow-lg"
            aria-label="Schließen"
          >
            <X className="w-5 h-5" />
          </button>
          <div className="w-full max-w-2xl h-[80vh] min-h-[400px] rounded-2xl overflow-hidden bg-white shadow-2xl">
            <iframe
              title="Termin buchen"
              src={buildCalendlyEmbedUrl(qualificationData.a1, qualificationData.a2)}
              className="w-full h-full min-h-[400px]"
              allowFullScreen
            />
          </div>
        </div>
      )}

      {/* Floating CTA Button – leicht transparent, glasig */}
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        className={`flex items-center gap-3 ${glassBlack} text-white rounded-full pl-4 pr-5 py-3 shadow-lg hover:bg-black/85 transition-colors text-left max-w-[min(320px,90vw)]`}
        aria-label={open ? 'Chat schließen' : 'Chat öffnen'}
      >
        <MessageCircle className="w-6 h-6 shrink-0" />
        <span className="text-sm leading-tight">
          {open ? 'Chat schließen' : <TypingCta />}
        </span>
      </button>
    </div>
  );
}
