import React, { useState, useEffect } from 'react';
import { Volume2, VolumeX, Sparkles } from 'lucide-react';
import { Locale } from '../lib/types';
import { t } from '../lib/i18n';

interface AudioGuidanceProps {
  textToSpeak: string;
  locale: Locale;
}

export const AudioGuidance: React.FC<AudioGuidanceProps> = ({ textToSpeak, locale }) => {
  const [isPlaying, setIsPlaying] = useState(false);
  const [supported, setSupported] = useState(false);

  useEffect(() => {
    if ('speechSynthesis' in window) {
      setSupported(true);
    }
  }, []);

  const handleTogglePlay = () => {
    if (!supported) return;

    if (isPlaying) {
      window.speechSynthesis.cancel();
      setIsPlaying(false);
    } else {
      window.speechSynthesis.cancel(); // clear previous
      const utterance = new SpeechSynthesisUtterance(textToSpeak);
      
      // Select appropriate language tag
      const langMap: Record<Locale, string> = {
        en: 'en-IN',
        hi: 'hi-IN',
        mr: 'mr-IN',
        gu: 'gu-IN',
        pa: 'pa-IN',
      };
      utterance.lang = langMap[locale] || 'en-IN';
      utterance.rate = 0.92; // Slightly slower for clarity in rural cowshed playback

      utterance.onend = () => setIsPlaying(false);
      utterance.onerror = () => setIsPlaying(false);

      window.speechSynthesis.speak(utterance);
      setIsPlaying(true);
    }
  };

  if (!supported) return null;

  return (
    <div className="bg-gradient-to-r from-emerald-900/60 to-teal-900/60 border border-emerald-500/40 rounded-xl p-2.5 flex items-center justify-between text-white my-2 shadow-sm">
      <div className="flex items-center space-x-2">
        <div className={`w-8 h-8 rounded-full flex items-center justify-center ${isPlaying ? 'bg-emerald-500 text-white animate-pulse' : 'bg-emerald-800/80 text-emerald-200'}`}>
          <Volume2 className="w-4 h-4" />
        </div>
        <div>
          <h4 className="text-xs font-semibold text-emerald-200">
            {t('score.audioListen', locale)}
          </h4>
          <p className="text-[10px] text-slate-300">
            {isPlaying ? 'Speaking advisory...' : 'Tap speaker to hear voice advisory in local language'}
          </p>
        </div>
      </div>

      <button
        onClick={handleTogglePlay}
        className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all shadow ${
          isPlaying
            ? 'bg-rose-600 hover:bg-rose-700 text-white'
            : 'bg-emerald-600 hover:bg-emerald-500 text-white'
        }`}
      >
        {isPlaying ? 'Stop' : 'Play'}
      </button>
    </div>
  );
};
