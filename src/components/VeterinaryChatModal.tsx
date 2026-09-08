import React, { useState, useRef, useEffect } from 'react';
import { X, Send, Bot, Sparkles, Volume2, VolumeX, AlertCircle, CheckCircle2, RotateCcw } from 'lucide-react';
import { Locale } from '../lib/types';
import { t } from '../lib/i18n';

interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: string;
  isFallback?: boolean;
}

interface VeterinaryChatModalProps {
  isOpen: boolean;
  onClose: () => void;
  locale: Locale;
  initialQuery?: string;
}

const PRESET_PROMPTS: Record<string, string[]> = {
  en: [
    'Silage pH is 5.2 — is it safe for lactating cows?',
    'Emergency first aid if feed has suspected urea adulteration',
    'How to balance dry bhusa & green fodder for Murrah buffalo?',
    'How to prevent subacute ruminal acidosis (SARA) with high concentrate?',
  ],
  hi: [
    'साइलेज का pH 5.2 है — क्या यह दुधारू गाय के लिए सुरक्षित है?',
    'यदि चारे में यूरिया मिलावट का संदेह हो तो आपातकालीन प्राथमिक उपचार क्या है?',
    'मुर्रा भैंस के लिए सूखा भूसा और हरा चारा कैसे संतुलित करें?',
    'अधिक दाना खिलाने पर एसिडोसिस (SARA) से कैसे बचें?',
  ],
  mr: [
    'सायलेजचा pH 5.2 आहे — हे दुभत्या गाईसाठी सुरक्षित आहे का?',
    'चाऱ्यात युरिया भेसळीचा संशय असल्यास प्रथमोपचार काय करावे?',
    'मुर्रा म्हशीसाठी सुका भुसा व हिरवा चारा कसा संतुलित करावा?',
  ],
  gu: [
    'સાયલેજનો pH 5.2 છે — શું તે દૂધ આપતી ગાય માટે સુરક્ષિત છે?',
    'ખાણમાં યુરિયા ભેળસેળની શંકા હોય તો પ્રાથમિક સારવાર શું કરવી?',
    'મુરાહ ભેંસ માટે સૂકો ભુસો અને લીલો ચારો કેવી રીતે સંતુલિત કરવો?',
  ],
  pa: [
    'ਸਾਈਲੇਜ ਦਾ pH 5.2 ਹੈ — ਕੀ ਇਹ ਦੁਧਾਰੂ ਗਾਂ ਲਈ ਸੁਰੱਖਿਅਤ ਹੈ?',
    'ਜੇਕਰ ਫੀਡ ਵਿੱਚ ਯੂਰੀਆ ਮਿਲਾਵਟ ਦਾ ਸ਼ੱਕ ਹੋਵੇ ਤਾਂ ਮੁੱਢਲੀ ਸਹਾਇਤਾ ਕੀ ਹੈ?',
    'ਮੁੱਰਾ ਮੱਝ ਲਈ ਸੁੱਕਾ ਤੂੜੀ ਅਤੇ ਹਰਾ ਚਾਰਾ ਕਿਵੇਂ ਸੰਤੁਲਿਤ ਕਰੀਏ?',
  ],
};

export const VeterinaryChatModal: React.FC<VeterinaryChatModalProps> = ({
  isOpen,
  onClose,
  locale,
  initialQuery,
}) => {
  const [messages, setMessages] = useState<Message[]>([
    {
      id: 'welcome_1',
      role: 'assistant',
      content: `Namaste! I am your **PashuPoshan Doctor & Feed Nutrition Assistant**, ready to help with livestock care based on **ICAR-NDRI** guidelines.

How can I help you with your cattle's feed, milk yield, or health today?`,
      timestamp: 'Just now',
    },
  ]);
  const [inputQuery, setInputQuery] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [speakingId, setSpeakingId] = useState<string | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const quickPrompts = PRESET_PROMPTS[locale] || PRESET_PROMPTS['hi'] || PRESET_PROMPTS['en'];

  useEffect(() => {
    return () => {
      if (typeof window !== 'undefined' && window.speechSynthesis) {
        window.speechSynthesis.cancel();
      }
    };
  }, []);

  useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        if (typeof window !== 'undefined' && window.speechSynthesis) {
          window.speechSynthesis.cancel();
        }
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  useEffect(() => {
    if (initialQuery && isOpen) {
      handleSend(initialQuery);
    }
  }, [initialQuery, isOpen]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isLoading]);

  const handleSend = async (queryText?: string) => {
    const textToSend = (queryText || inputQuery).trim();
    if (!textToSend || isLoading) return;

    const userMsg: Message = {
      id: `user_${Date.now()}`,
      role: 'user',
      content: textToSend,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    };

    setMessages((prev) => [...prev, userMsg]);
    setInputQuery('');
    setIsLoading(true);

    try {
      // Build previous message history for multi-turn context
      const chatHistory = messages
        .filter((m) => m.id !== 'welcome_1')
        .concat(userMsg)
        .map((m) => ({ role: m.role, content: m.content }));

      const res = await fetch('/api/veterinary-expert', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          mode: 'chat',
          messages: chatHistory,
        }),
      });

      if (!res.ok) {
        throw new Error(`Consultant API responded with ${res.status}`);
      }

      const data = await res.json();
      const assistantMsg: Message = {
        id: `assistant_${Date.now()}`,
        role: 'assistant',
        content: data.advice || 'Thank you for your question. Please monitor your herd closely and call 1962 if symptoms worsen.',
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        isFallback: data.isFallback,
      };

      setMessages((prev) => [...prev, assistantMsg]);
    } catch (err: any) {
      const fallbackMsg: Message = {
        id: `fallback_${Date.now()}`,
        role: 'assistant',
        content: `### Offline Advisory Notice
Currently offline or live doctor service is unreachable.

**Standard Field Guidelines (ICAR-NDRI)**:
- For cattle showing symptoms of acute bloat or feed toxicity, withdraw the suspected feed batch immediately.
- Administer sweet soda (sodium bicarbonate, 60-80g in drinking water) if mild rumen acidosis is suspected.
- Contact your nearest Veterinary Dispensary or call the National Animal Disease Helpline at **1962**.`,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        isFallback: true,
      };
      setMessages((prev) => [...prev, fallbackMsg]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSpeak = (msgId: string, text: string) => {
    if (typeof window === 'undefined' || !window.speechSynthesis) return;

    if (speakingId === msgId) {
      window.speechSynthesis.cancel();
      setSpeakingId(null);
      return;
    }

    window.speechSynthesis.cancel();
    // Clean markdown stars/hashtags for cleaner audio readout
    const plainText = text.replace(/[*#_`]/g, '').replace(/\[.*?\]/g, '');
    const utterance = new SpeechSynthesisUtterance(plainText);
    utterance.lang = locale === 'en' ? 'en-IN' : `${locale}-IN`;
    utterance.rate = 0.95;

    utterance.onend = () => setSpeakingId(null);
    utterance.onerror = () => setSpeakingId(null);

    setSpeakingId(msgId);
    window.speechSynthesis.speak(utterance);
  };

  const handleResetChat = () => {
    if (window.speechSynthesis) window.speechSynthesis.cancel();
    setSpeakingId(null);
    setMessages([
      {
        id: 'welcome_1',
        role: 'assistant',
        content: `Namaste! I am your **PashuPoshan Doctor & Feed Nutrition Assistant**, ready to help with livestock care based on **ICAR-NDRI** guidelines.

How can I help you with your cattle's feed, milk yield, or health today?`,
        timestamp: 'Just now',
      },
    ]);
  };

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-2 sm:p-4 animate-fadeIn"
      role="dialog"
      aria-modal="true"
      aria-labelledby="vet-modal-title"
    >
      <div className="bg-white dark:bg-slate-900 w-full max-w-2xl h-[90vh] sm:h-[80vh] rounded-2xl shadow-2xl flex flex-col overflow-hidden border border-emerald-800/30 dark:border-slate-800">
        {/* Header */}
        <div className="bg-gradient-to-r from-[#1F5D3B] via-[#164E63] to-[#0F172A] text-white px-4 py-3 flex items-center justify-between shadow-md">
          <div className="flex items-center space-x-2.5">
            <div className="w-10 h-10 rounded-xl bg-white/15 border border-white/20 flex items-center justify-center text-lg shadow-inner">
              <Bot className="w-5 h-5 text-emerald-300" />
            </div>
            <div>
              <div className="flex items-center space-x-1.5">
                <h2 id="vet-modal-title" className="text-sm sm:text-base font-bold text-white leading-tight">
                  {t('chat.title', locale)}
                </h2>
              </div>
              <p className="text-[11px] text-emerald-100/80 leading-tight">
                {t('chat.subtitle', locale)}
              </p>
            </div>
          </div>

          <div className="flex items-center space-x-1">
            <button
              onClick={handleResetChat}
              className="w-11 h-11 min-h-[44px] min-w-[44px] text-emerald-100 hover:text-white rounded-xl hover:bg-white/10 flex items-center justify-center transition-colors"
              title={t('chat.clear', locale)}
              aria-label={t('chat.clear', locale)}
            >
              <RotateCcw className="w-4 h-4" />
            </button>
            <button
              onClick={() => {
                if (window.speechSynthesis) window.speechSynthesis.cancel();
                onClose();
              }}
              className="w-11 h-11 min-h-[44px] min-w-[44px] text-emerald-100 hover:text-white rounded-xl hover:bg-white/10 flex items-center justify-center transition-colors"
              title={t('common.close', locale)}
              aria-label={t('common.close', locale)}
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Message Log */}
        <div className="flex-1 overflow-y-auto p-3 sm:p-4 space-y-3 bg-slate-50 dark:bg-slate-950/60">
          {messages.map((msg) => (
            <div
              key={msg.id}
              className={`flex flex-col ${msg.role === 'user' ? 'items-end' : 'items-start'}`}
            >
              <div
                className={`max-w-[88%] sm:max-w-[82%] rounded-2xl p-3 sm:p-3.5 text-xs sm:text-sm leading-relaxed shadow-sm ${
                  msg.role === 'user'
                    ? 'bg-[#1F5D3B] text-white rounded-br-none'
                    : 'bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-100 border border-slate-200 dark:border-slate-800 rounded-bl-none'
                }`}
              >
                {/* Assistant Label */}
                {msg.role === 'assistant' && (
                  <div className="flex items-center justify-between mb-1.5 pb-1 border-b border-slate-100 dark:border-slate-800">
                    <span className="text-[10px] font-bold text-emerald-700 dark:text-emerald-400 flex items-center gap-1">
                      <Sparkles className="w-3 h-3" />
                      {msg.isFallback ? 'ICAR-NDRI Guidelines' : "Doctor's Advice (विशेषज्ञ सलाह)"}
                    </span>
                    <button
                      onClick={() => handleSpeak(msg.id, msg.content)}
                      className="p-1 text-slate-400 hover:text-emerald-600 dark:hover:text-emerald-400 rounded transition-colors"
                      title={speakingId === msg.id ? 'Stop Speaking' : 'Read Aloud'}
                    >
                      {speakingId === msg.id ? (
                        <VolumeX className="w-3.5 h-3.5 text-amber-500 animate-pulse" />
                      ) : (
                        <Volume2 className="w-3.5 h-3.5" />
                      )}
                    </button>
                  </div>
                )}

                {/* Body with lightweight Markdown rendering */}
                <div className="whitespace-pre-wrap space-y-1">
                  {msg.content.split('\n').map((line, idx) => {
                    if (line.startsWith('### ')) {
                      return <h3 key={idx} className="font-bold text-sm text-emerald-800 dark:text-emerald-400 mt-1 mb-0.5">{line.replace('### ', '')}</h3>;
                    }
                    if (line.startsWith('**') && line.endsWith('**')) {
                      return <p key={idx} className="font-bold">{line.replace(/\*\*/g, '')}</p>;
                    }
                    if (line.startsWith('- ') || line.startsWith('* ')) {
                      return <p key={idx} className="pl-2 border-l-2 border-emerald-500/40 my-0.5">{line.substring(2)}</p>;
                    }
                    return <p key={idx}>{line}</p>;
                  })}
                </div>

                <div
                  className={`text-[9px] mt-1.5 text-right ${
                    msg.role === 'user' ? 'text-emerald-100/70' : 'text-slate-400'
                  }`}
                >
                  {msg.timestamp}
                </div>
              </div>
            </div>
          ))}

          {isLoading && (
            <div className="flex items-center space-x-2 text-xs text-emerald-700 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/40 p-2.5 rounded-xl border border-emerald-200 dark:border-emerald-800/40 w-fit">
              <Bot className="w-4 h-4 animate-bounce" />
              <span>Getting advice from livestock doctor...</span>
            </div>
          )}
          <div ref={messagesEndRef} />
        </div>

        {/* Quick Prompts */}
        <div className="bg-white dark:bg-slate-900 border-t border-slate-200 dark:border-slate-800 px-3 py-2 flex items-center gap-1.5 overflow-x-auto no-scrollbar shrink-0">
          <span className="text-[10px] uppercase font-bold text-slate-400 shrink-0">💡</span>
          {quickPrompts.map((prompt, idx) => (
            <button
              key={idx}
              onClick={() => handleSend(prompt)}
              disabled={isLoading}
              className="text-xs whitespace-nowrap bg-emerald-50 dark:bg-slate-800 text-emerald-900 dark:text-emerald-300 hover:bg-emerald-100 dark:hover:bg-slate-700 px-3 py-2 min-h-[38px] rounded-full border border-emerald-200/80 dark:border-slate-700 transition-colors shrink-0 disabled:opacity-50 inline-flex items-center"
            >
              {prompt}
            </button>
          ))}
        </div>

        {/* Input Bar */}
        <div className="p-3 bg-white dark:bg-slate-900 border-t border-slate-200 dark:border-slate-800 flex items-center space-x-2 shrink-0">
          <input
            type="text"
            value={inputQuery}
            onChange={(e) => setInputQuery(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') handleSend();
            }}
            placeholder={t('chat.placeholder', locale)}
            disabled={isLoading}
            className="flex-1 text-xs sm:text-sm min-h-[44px] bg-slate-100 dark:bg-slate-800 text-slate-900 dark:text-white px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 focus:outline-none focus:ring-2 focus:ring-emerald-500 disabled:opacity-60"
          />
          <button
            onClick={() => handleSend()}
            disabled={!inputQuery.trim() || isLoading}
            className="bg-[#1F5D3B] hover:bg-[#184a2f] text-white px-4 py-2.5 min-h-[44px] rounded-xl font-bold text-xs sm:text-sm flex items-center space-x-1.5 transition-all active:scale-95 disabled:opacity-40 disabled:pointer-events-none"
            aria-label={t('chat.send', locale)}
          >
            <Send className="w-4 h-4" />
            <span className="hidden sm:inline">{t('chat.send', locale)}</span>
          </button>
        </div>

        {/* Bottom Disclaimer */}
        <div className="bg-slate-100 dark:bg-slate-950 px-3 py-2 text-[11px] text-[#5A5243] dark:text-slate-400 text-center border-t border-slate-200 dark:border-slate-800 font-medium">
          {t('chat.disclaimer', locale)}
        </div>
      </div>
    </div>
  );
};
