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

      // Select appropriate language tag
      const langMap: Record<Locale, string> = {
        en: 'en-IN',
        hi: 'hi-IN',
        mr: 'mr-IN',
        gu: 'gu-IN',
        pa: 'pa-IN',
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

  const audioLabels: Record<Locale, { play: string; stop: string; hint: string }> = {
    hi: {
      play: 'आवाज़ में सलाह सुनें (ऑडियो गाइड)',
      stop: 'ऑडियो रोकें (Stop)',
      hint: isHazardous ? '⚠️ महत्वपूर्ण: तुरंत ऑडियो सलाह सुनें!' : 'अपनी भाषा में पूरी सलाह सुनें',
    },
    en: {
      play: 'Listen to Audio Advisory (Voice)',
      stop: 'Stop Audio Advisory',
      hint: isHazardous ? '⚠️ Critical Warning: Listen to voice instructions now!' : 'Listen to full advisory in spoken language',
    },
    mr: {
      play: 'ऑडिओ सल्ला ऐका (स्थानिक भाषेत)',
      stop: 'ऑडिओ थांबवा',
      hint: isHazardous ? '⚠️ तातडीचा इशारा: कृपया ऑडिओ सल्ला ऐका!' : 'आपल्या भाषेत संपूर्ण सल्ला ऐका',
    },
    gu: {
      play: 'ઓડિયો માર્ગદર્શન સાંભળો (સ્થાનિક ભાષા)',
      stop: 'ઓડિયો બંધ કરો',
      hint: isHazardous ? '⚠️ અગત્યની ચેતવણી: હમણાં જ સાંભળો!' : 'તમારી ભાષામાં સાંભળો',
    },
    pa: {
      play: 'ਆਵਾਜ਼ ਵਿੱਚ ਸਲਾਹ ਸੁਣੋ (ਆਡੀਓ ਗਾਈਡ)',
      stop: 'ਆਡੀਓ ਰੋਕੋ',
      hint: isHazardous ? '⚠️ ਜ਼ਰੂਰੀ ਚੇਤਾਵਨੀ: ਹੁਣੇ ਆਡੀਓ ਸੁਣੋ!' : 'ਆਪਣੀ ਬੋਲੀ ਵਿੱਚ ਸਲਾਹ ਸੁਣੋ',
    },
  };

  const labels = audioLabels[locale] || audioLabels.en;

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
        aria-label={isPlaying ? labels.stop : labels.play}
      >
        <div className="w-8 h-8 rounded-full bg-white/20 flex items-center justify-center shrink-0">
          {isPlaying ? <Square className="w-4 h-4 fill-white" /> : <Volume2 className="w-5 h-5" />}
        </div>
        <span className="leading-snug">{isPlaying ? labels.stop : labels.play}</span>
      </button>

      <div className="mt-2 text-center text-xs font-semibold text-[#5A5243] dark:text-slate-300">
        {labels.hint}
      </div>
    </div>
  );
};
