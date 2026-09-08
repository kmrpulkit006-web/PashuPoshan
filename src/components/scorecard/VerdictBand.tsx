import React from 'react';
import { CheckCircle2, AlertTriangle, AlertOctagon } from 'lucide-react';
import { FeedSample, Locale } from '../../lib/types';

interface VerdictBandProps {
  sample: FeedSample;
  locale: Locale;
}

export const VerdictBand: React.FC<VerdictBandProps> = ({ sample, locale }) => {
  const isTierA = sample.overallGrade.includes('Tier A');
  const isTierC = sample.overallGrade.includes('Tier C');

  const plainVerdicts: Partial<Record<Locale, { safe: string; caution: string; danger: string }>> = {
    hi: {
      safe: 'पशुओं को खिलाने के लिए पूरी तरह सुरक्षित',
      caution: 'सावधानी से खिलाएं — अतिरिक्त प्रोटीन मिलाएं',
      danger: 'खतरा! पशुओं को बिल्कुल न खिलाएं',
    },
    en: {
      safe: 'Safe to feed to dairy cattle',
      caution: 'Feed with caution — supplementary protein needed',
      danger: 'DO NOT FEED — CRITICAL HAZARD',
    },
    mr: {
      safe: 'जनावरांना खाऊ घालण्यासाठी सुरक्षित',
      caution: 'सावधगिरीने खाऊ घाला — अतिरिक्त प्रथिने आवश्यक',
      danger: 'धोका! जनावरांना अजिबात खाऊ घालू नका',
    },
    gu: {
      safe: 'પશુઓને ખવડાવવા માટે સંપૂર્ણ સલામત',
      caution: 'સાવધાનીપૂર્વક ખવડાવો — પૂરક પ્રોટીન જરૂરી',
      danger: 'જોખમ! પશુઓને બિલકુલ ન ખવડાવો',
    },
    pa: {
      safe: 'ਪਸ਼ੂਆਂ ਨੂੰ ਖੁਆਉਣ ਲਈ ਬਿਲਕੁਲ ਸੁਰੱਖਿਅਤ',
      caution: 'ਸਾਵਧਾਨੀ ਨਾਲ ਖੁਆਓ — ਵਾਧੂ ਪ੍ਰੋਟੀਨ ਦੀ ਲੋੜ',
      danger: 'ਖ਼ਤਰਾ! ਪਸ਼ੂਆਂ ਨੂੰ ਬਿਲਕੁਲ ਨਾ ਖੁਆਓ',
    },
  };

  const texts = plainVerdicts[locale] || plainVerdicts.hi || plainVerdicts.en!;

  if (sample.isNonFeedSample) {
    return (
      <div className="rounded-3xl p-5 bg-[#B3261E] text-white shadow-2xl border-4 border-amber-400 space-y-2 text-center animate-pulse-slow">
        <div className="w-16 h-16 rounded-full bg-white/20 flex items-center justify-center mx-auto shadow-inner">
          <AlertOctagon className="w-11 h-11 text-white" />
        </div>
        <div>
          <span className="text-xs font-black uppercase tracking-wider px-3 py-0.5 rounded-full bg-black/40 text-amber-200">
            {locale === 'hi' ? 'अमान्य तस्वीर' : 'Not Cattle Feed'}
          </span>
          <h2 className="text-xl sm:text-2xl font-black mt-1 leading-tight text-white uppercase tracking-tight">
            {locale === 'hi' ? 'चारे की साफ फोटो लें' : 'Please Take a Clear Photo of Cattle Feed'}
          </h2>
          <p className="text-xs text-rose-100 font-bold mt-1 max-w-sm mx-auto leading-relaxed">
            {sample.visualAnalysis?.rejectionMessage ||
              (locale === 'hi'
                ? 'यह फोटो चारे या साइलेज की नहीं लग रही है। कृपया अच्छी रोशनी में चारे की फोटो लें।'
                : 'The uploaded photo does not appear to be cattle feed, silage, or fodder. Please retake a clear photo.')}
          </p>
        </div>
      </div>
    );
  }

  if (isTierA) {
    return (
      <div className="rounded-3xl p-5 bg-[#1F5D3B] text-white shadow-xl border-2 border-emerald-400/40 space-y-2 text-center">
        <div className="w-16 h-16 rounded-full bg-white/20 flex items-center justify-center mx-auto shadow-inner">
          <CheckCircle2 className="w-10 h-10 text-white" />
        </div>
        <div>
          <span className="text-xs font-black uppercase tracking-wider px-3 py-0.5 rounded-full bg-black/25 text-emerald-100">
            🟢 {locale === 'hi' ? 'उत्तम चारा • खिलाने के लिए सुरक्षित' : 'Top Quality • Safe to Feed'}
          </span>
          <h2 className="text-xl sm:text-2xl font-black mt-1 leading-tight text-white">
            {texts.safe}
          </h2>
          <p className="text-xs text-emerald-100/90 mt-1 font-semibold">
            {sample.name} {locale === 'hi' ? 'शुद्ध, पौष्टिक और दूध बढ़ाने के लिए उत्तम है।' : 'is clean, healthy, and good for milk yield.'}
          </p>
        </div>
      </div>
    );
  }

  if (isTierC) {
    return (
      <div className="rounded-3xl p-5 bg-[#B3261E] text-white shadow-2xl border-4 border-rose-300 space-y-2 text-center animate-pulse-slow">
        <div className="w-16 h-16 rounded-full bg-white/20 flex items-center justify-center mx-auto shadow-inner">
          <AlertOctagon className="w-11 h-11 text-white" />
        </div>
        <div>
          <span className="text-xs font-black uppercase tracking-wider px-3 py-0.5 rounded-full bg-black/30 text-rose-100">
            🔴 {locale === 'hi' ? 'खतरा • पशुओं को बिल्कुल न खिलाएं' : 'Danger • Do Not Feed to Cattle'}
          </span>
          <h2 className="text-xl sm:text-2xl font-black mt-1 leading-tight text-white uppercase tracking-tight">
            {texts.danger}
          </h2>
          <p className="text-xs text-rose-100 font-bold mt-1">
            {sample.name} {locale === 'hi' ? 'में फफूंद या यूरिया मिलावट का खतरा है। इससे पशु बीमार हो सकते हैं।' : 'has severe mold or chemical risk. Feeding this can make cattle sick.'}
          </p>
        </div>
      </div>
    );
  }

  // Tier B
  return (
    <div className="rounded-3xl p-5 bg-[#C2703D] text-white shadow-xl border-2 border-amber-300/50 space-y-2 text-center">
      <div className="w-16 h-16 rounded-full bg-white/20 flex items-center justify-center mx-auto shadow-inner">
        <AlertTriangle className="w-10 h-10 text-white" />
      </div>
      <div>
        <span className="text-xs font-black uppercase tracking-wider px-3 py-0.5 rounded-full bg-black/25 text-amber-100">
          🟡 {locale === 'hi' ? 'सामान्य चारा • अतिरिक्त पोषण जरूरी' : 'Fair Quality • Supplement Needed'}
        </span>
        <h2 className="text-xl sm:text-2xl font-black mt-1 leading-tight text-white">
          {texts.caution}
        </h2>
        <p className="text-xs text-amber-100 font-semibold mt-1">
          {sample.name} {locale === 'hi' ? 'खिलाने में सुरक्षित है, लेकिन अच्छे दूध के लिए खल या दाना जरूर मिलाएं।' : 'is safe to feed, but add extra khal or cake for good milk yield.'}
        </p>
      </div>
    </div>
  );
};
