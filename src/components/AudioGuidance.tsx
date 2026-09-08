import React, { useState, useEffect } from 'react';
import { Volume2, VolumeX, Sparkles, Play, Square } from 'lucide-react';
import { Locale } from '../lib/types';
import { t } from '../lib/i18n';

interface AudioGuidanceProps {
  textToSpeak: string;
  locale: Locale;
  isHazardous?: boolean;
}

export const AudioGuidance: React.FC<AudioGuidanceProps> = ({
  textToSpeak,
  locale,
  isHazardous = false,
}) => {
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

      // Select appropriate BCP-47 language tag for Indian regional languages
      const langMap: Record<Locale, string> = {
        hi: 'hi-IN',
        en: 'en-IN',
        bn: 'bn-IN',
        te: 'te-IN',
        mr: 'mr-IN',
        ta: 'ta-IN',
        gu: 'gu-IN',
        kn: 'kn-IN',
        ml: 'ml-IN',
        pa: 'pa-IN',
        or: 'or-IN',
        as: 'as-IN',
        ur: 'ur-IN',
        sa: 'sa-IN',
        kok: 'kok-IN',
        mai: 'mai-IN',
        ne: 'ne-NP',
        ks: 'ks-IN',
        mni: 'mni-IN',
        sd: 'sd-IN',
        doi: 'doi-IN',
        brx: 'brx-IN',
        sat: 'sat-IN',
      };
      utterance.lang = langMap[locale] || 'en-IN';
      utterance.rate = 0.92; // Slower cadence for clarity in rural cowsheds

      utterance.onend = () => setIsPlaying(false);
      utterance.onerror = () => setIsPlaying(false);

      window.speechSynthesis.speak(utterance);
      setIsPlaying(true);
    }
  };

  if (!supported) return null;

  const playLabel = t('audio.play', locale);
  const stopLabel = t('audio.stop', locale);
  const hintLabel = isHazardous
    ? t('audio.hintHazardous', locale)
    : t('audio.hint', locale);

  return (
    <div
      className={`rounded-2xl p-3 border-2 transition-all shadow-md ${
        isHazardous
          ? 'bg-red-50 dark:bg-red-950/60 border-[#B3261E] dark:border-rose-600 animate-pulse'
          : 'bg-[#F3EEE1] dark:bg-slate-800 border-[#1F5D3B] dark:border-emerald-600'
      }`}
    >
      <button
        onClick={handleTogglePlay}
        className={`w-full py-4 px-4 rounded-xl font-black text-sm sm:text-base flex items-center justify-center space-x-3 shadow-lg transition-all min-h-[56px] ${
          isPlaying
            ? 'bg-[#B3261E] text-white hover:bg-red-700'
            : isHazardous
            ? 'bg-[#B3261E] hover:bg-red-700 text-white'
            : 'bg-[#1F5D3B] hover:bg-[#194a30] text-white'
        }`}
        aria-label={isPlaying ? stopLabel : playLabel}
      >
        <div className="w-8 h-8 rounded-full bg-white/20 flex items-center justify-center shrink-0">
          {isPlaying ? <Square className="w-4 h-4 fill-white" /> : <Volume2 className="w-5 h-5" />}
        </div>
        <span className="leading-snug">{isPlaying ? stopLabel : playLabel}</span>
      </button>

      <div className="mt-2 text-center text-xs font-semibold text-[#5A5243] dark:text-slate-300">
        {hintLabel}
      </div>
    </div>
  );
};
