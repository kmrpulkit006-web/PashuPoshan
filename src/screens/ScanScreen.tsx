import React from 'react';
import { FeedSample, Locale, FeedCategory } from '../lib/types';
import { t } from '../lib/i18n';
import { useScanEngine } from '../hooks/useScanEngine';
import { StripColorSelector } from '../components/scan/StripColorSelector';
import { PresetScenarioList } from '../components/scan/PresetScenarioList';
import { QrScannerModal } from '../components/scan/QrScannerModal';
import {
  Camera,
  Upload,
  Scan,
  FlaskConical,
  RefreshCw,
  QrCode,
  AlertTriangle,
  Clock,
  X,
} from 'lucide-react';

interface ScanScreenProps {
  onScanComplete: (sample: FeedSample) => void;
  locale: Locale;
  theme?: 'light' | 'dark';
}

export const ScanScreen: React.FC<ScanScreenProps> = ({ onScanComplete, locale, theme = 'light' }) => {
  const isDark = theme === 'dark';
  const {
    scanMode,
    setScanMode,
    category,
    setCategory,
    isProcessing,
    processingMessage,
    selectedImage,
    stripColor,
    setStripColor,
    showQrScanner,
    qrVerifiedData,
    fileInputRef,
    handleSelectPreset,
    handleFileUpload,
    handleSimulateQrScan,
    closeQrScanner,
    scanNotice,
    closeScanNotice,
  } = useScanEngine({ onScanComplete, locale });

  React.useEffect(() => {
    if (!scanNotice) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') closeScanNotice();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [scanNotice, closeScanNotice]);

  const getCategoryLabel = (cat: FeedCategory): string => {
    switch (cat) {
      case 'silage':
        return `🌾 ${t('history.silage', locale)}`;
      case 'concentrate':
        return `🥣 ${t('history.concentrate', locale)}`;
      case 'green_fodder':
        return `🌱 ${t('history.greenFodder', locale)}`;
      case 'dry_fodder':
        return `🌾 ${t('history.dryFodder', locale)}`;
      default:
        return cat;
    }
  };

  return (
    <div className="p-4 space-y-4 pb-28 print:hidden text-[#1A1A1A] dark:text-white">
      {/* 5-Second Clarity Hero Card: Friendly, Rural & Crystal Clear */}
      <div
        className="rounded-3xl p-4 shadow-sm border-2 transition-colors relative overflow-hidden"
        style={{
          backgroundColor: isDark ? 'rgba(6, 78, 59, 0.85)' : '#edf7f0',
          borderColor: isDark ? '#059669' : '#a7f3d0',
        }}
      >
        <div className="flex items-start space-x-3">
          <div className="w-12 h-12 rounded-2xl bg-[#1F5D3B] text-white flex items-center justify-center shrink-0 shadow-md text-2xl">
            🐄
          </div>
          <div className="min-w-0 flex-1">
            <h2 className="text-base sm:text-lg font-black text-[#1F5D3B] dark:text-emerald-300 leading-tight">
              {locale === 'hi' ? 'चारे की शुद्धता व गुणवत्ता जांचें' : t('scan.title', locale)}
            </h2>
            <p className="text-xs text-[#2c533c] dark:text-emerald-100 font-semibold mt-1 leading-relaxed">
              {locale === 'hi'
                ? 'फोटो खींचकर या टेस्ट स्ट्रिप से आसानी से पता करें कि चारा आपके पशुओं के लिए सुरक्षित व पौष्टिक है या नहीं।'
                : 'Take a photo or use a test strip to check if your cattle feed is safe and healthy for milk yield.'}
            </p>
          </div>
        </div>

        {/* 3 Simple Visual Steps (Understood in 5 seconds) */}
        <div className="grid grid-cols-3 gap-2 mt-3 pt-3 border-t border-emerald-200/80 dark:border-emerald-800 text-center">
          <div className="bg-white/80 dark:bg-slate-900/70 rounded-xl p-2 text-[11px] font-bold text-[#1F5D3B] dark:text-emerald-200 shadow-xs">
            <span className="block text-sm">1️⃣</span>
            <span>{locale === 'hi' ? 'चारा चुनें' : '1. Pick Feed'}</span>
          </div>
          <div className="bg-white/80 dark:bg-slate-900/70 rounded-xl p-2 text-[11px] font-bold text-[#1F5D3B] dark:text-emerald-200 shadow-xs">
            <span className="block text-sm">2️⃣</span>
            <span>{locale === 'hi' ? 'फोटो लें' : '2. Take Photo'}</span>
          </div>
          <div className="bg-white/80 dark:bg-slate-900/70 rounded-xl p-2 text-[11px] font-bold text-[#1F5D3B] dark:text-emerald-200 shadow-xs">
            <span className="block text-sm">3️⃣</span>
            <span>{locale === 'hi' ? 'कार्ड पाएं' : '3. Get Result'}</span>
          </div>
        </div>
      </div>

      {/* Title & Mode Switcher */}
      <div
        className="rounded-3xl p-4 shadow-sm space-y-3 border-2 transition-colors"
        style={{
          backgroundColor: isDark ? '#1e293b' : '#F3EEE1',
          borderColor: isDark ? '#334155' : '#DCD3BF',
          color: isDark ? '#ffffff' : '#1A1A1A',
        }}
      >
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <div className="w-9 h-9 rounded-2xl bg-[#1F5D3B]/15 text-[#1F5D3B] dark:text-emerald-400 flex items-center justify-center">
              <Scan className="w-5 h-5" />
            </div>
            <h2 className="text-base font-black tracking-tight">
              {t('scan.title', locale)}
            </h2>
          </div>
          <div className="flex items-center space-x-1.5">
            <button
              onClick={() => {
                if (typeof window !== 'undefined') {
                  window.history.pushState({ tab: 'history' }, '', '/history');
                  window.dispatchEvent(new PopStateEvent('popstate', { state: { tab: 'history' } }));
                }
              }}
              className="flex items-center space-x-1 text-xs font-black text-slate-700 dark:text-slate-200 bg-white dark:bg-slate-800 border border-[#DCD3BF] dark:border-slate-700 px-2.5 py-2 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-700 transition-all min-h-[44px]"
              aria-label="View Past Tests"
            >
              <Clock className="w-4 h-4 text-[#1F5D3B] dark:text-emerald-400" />
              <span className="hidden xs:inline">{locale === 'hi' ? 'पिछली जांचें' : 'Past Tests'}</span>
            </button>
            <button
              onClick={handleSimulateQrScan}
              className="flex items-center space-x-1.5 text-xs font-black text-[#1F5D3B] dark:text-emerald-300 bg-[#edf7f0] dark:bg-emerald-950/80 border border-[#b0dec0] dark:border-emerald-500/40 px-3 py-2 rounded-xl hover:bg-[#d6eddc] transition-all min-h-[44px]"
              aria-label="Scan Feed Bag QR (Demo)"
            >
              <QrCode className="w-4 h-4" />
              <span>{t('scan.qrScan', locale)}</span>
            </button>
          </div>
        </div>

        {/* Dual Mode Switcher Tabs */}
        <div
          className="grid grid-cols-2 gap-2 p-1.5 rounded-2xl border-2 transition-colors"
          style={{
            backgroundColor: isDark ? '#0f172a' : '#ffffff',
            borderColor: isDark ? '#334155' : '#DCD3BF',
          }}
          role="tablist"
        >
          <button
            role="tab"
            aria-selected={scanMode === 'vision'}
            onClick={() => setScanMode('vision')}
            className={`flex items-center justify-center space-x-1.5 py-2.5 px-2 rounded-xl text-xs sm:text-sm font-black transition-all min-h-[50px] ${
              scanMode === 'vision'
                ? 'bg-[#1F5D3B] text-white shadow-md'
                : 'text-[#5A5243] dark:text-slate-400 hover:text-[#1A1A1A]'
            }`}
          >
            <Camera className="w-4 h-4 shrink-0" />
            <span className="text-center leading-tight">{t('scan.modeVision', locale)}</span>
          </button>
          <button
            role="tab"
            aria-selected={scanMode === 'strip'}
            onClick={() => setScanMode('strip')}
            className={`flex items-center justify-center space-x-1.5 py-2.5 px-2 rounded-xl text-xs sm:text-sm font-black transition-all min-h-[50px] ${
              scanMode === 'strip'
                ? 'bg-[#1F5D3B] text-white shadow-md'
                : 'text-[#5A5243] dark:text-slate-400 hover:text-[#1A1A1A]'
            }`}
          >
            <FlaskConical className="w-4 h-4 shrink-0" />
            <span className="text-center leading-tight">{t('scan.modeStrip', locale)}</span>
          </button>
        </div>

        {/* Category Selector with Large Touch Targets */}
        <div
          className="flex items-center space-x-2 overflow-x-auto py-1 pr-4 text-xs"
          role="tablist"
          aria-label="Feed category selection"
        >
          <span className="text-xs font-bold whitespace-nowrap shrink-0 opacity-80">
            {t('scan.feedType', locale)}
          </span>
          {(['silage', 'concentrate', 'green_fodder', 'dry_fodder'] as FeedCategory[]).map((cat) => {
            const isSelected = category === cat;
            return (
              <button
                key={cat}
                role="tab"
                aria-selected={isSelected}
                type="button"
                onClick={() => setCategory(cat)}
                className="px-3.5 py-2.5 rounded-2xl font-black whitespace-nowrap text-xs sm:text-sm border-2 transition-all min-h-[46px] shrink-0 shadow-xs"
                style={{
                  backgroundColor: isSelected ? (isDark ? '#022c22' : '#edf7f0') : (isDark ? '#0f172a' : '#ffffff'),
                  borderColor: isSelected ? (isDark ? '#34d399' : '#1F5D3B') : (isDark ? '#334155' : '#DCD3BF'),
                  color: isSelected ? (isDark ? '#ffffff' : '#1F5D3B') : (isDark ? '#94a3b8' : '#5A5243'),
                }}
              >
                {getCategoryLabel(cat)}
              </button>
            );
          })}
        </div>
      </div>

      {/* Camera Viewfinder with Clean Calibration Guide (No Overlapping Elements) */}
      <div className="relative aspect-[4/3] w-full rounded-3xl bg-slate-950 border-4 border-[#1F5D3B]/70 overflow-hidden flex flex-col items-center justify-center p-4 shadow-xl">
        {selectedImage ? (
          <>
            <img src={selectedImage} alt="Sample captured" className="w-full h-full object-cover rounded-2xl" />
            
            {/* Captured Image Header Overlay Bar */}
            <div className="absolute top-3 left-3 right-3 flex items-center justify-between z-10 pointer-events-auto">
              <span className="bg-[#1F5D3B]/90 backdrop-blur-xs text-white text-xs font-black px-3 py-1.5 rounded-full border border-emerald-400/50 flex items-center space-x-1.5 shadow-md">
                <span className="w-2 h-2 rounded-full bg-emerald-300 animate-pulse" />
                <span>{t('app.synced', locale)}</span>
              </span>

              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="bg-black/70 hover:bg-black/90 backdrop-blur-xs text-white text-xs font-bold px-3.5 py-2 rounded-full border border-white/30 flex items-center space-x-1.5 shadow-md active:scale-95 transition-all min-h-[44px]"
                title={t('scan.retake', locale)}
                aria-label={t('scan.retake', locale)}
              >
                <RefreshCw className="w-3.5 h-3.5 text-emerald-300" />
                <span>{t('scan.retake', locale)}</span>
              </button>
            </div>
          </>
        ) : (
          <div className="relative w-full h-full flex flex-col items-center justify-center p-4">
            {/* Viewfinder Corner Framing Guide */}
            <div className="absolute inset-3 border border-emerald-400/30 rounded-2xl pointer-events-none" />

            {/* Instruction Content Stack */}
            <div className="text-center space-y-2 z-10 p-2 max-w-xs">
              <div className="w-14 h-14 rounded-full bg-[#1F5D3B]/40 border-2 border-emerald-400 text-emerald-300 flex items-center justify-center mx-auto shadow-xl">
                {scanMode === 'vision' ? <Camera className="w-7 h-7" /> : <FlaskConical className="w-7 h-7" />}
              </div>
              <div>
                <p className="text-sm font-black text-white leading-snug">
                  {scanMode === 'vision'
                    ? t('scan.pointCamera', locale)
                    : (locale === 'hi' ? 'स्ट्रिप को बॉक्स में सफेद पेपर के पास रखें' : 'Place strip in box next to white paper')}
                </p>
                <p className="text-[11px] text-slate-300 mt-1 font-semibold">
                  {scanMode === 'vision'
                    ? t('scan.lightingTip', locale)
                    : (locale === 'hi' ? 'अच्छी रोशनी में 15-20 सेमी दूरी से फोटो लें' : 'Hold steady in good light (15-20cm away)')}
                </p>
              </div>

              {/* Strip Mode Dual Box Guidance */}
              {scanMode === 'strip' ? (
                <div className="grid grid-cols-2 gap-2 pt-1">
                  <div className="border-2 border-dashed border-white/60 bg-white/10 rounded-xl p-1.5 text-[11px] text-white font-bold">
                    <span>⬜ {locale === 'hi' ? 'सफेद पेपर' : 'White Card'}</span>
                    <span className="block text-[9px] text-emerald-200">{locale === 'hi' ? 'सफेद पृष्ठभूमि' : 'Paper / Card'}</span>
                  </div>
                  <div className="border-2 border-dashed border-amber-300/80 bg-amber-500/10 rounded-xl p-1.5 text-[11px] text-amber-200 font-bold">
                    <span>🧪 {locale === 'hi' ? 'टेस्ट स्ट्रिप' : 'Test Strip'}</span>
                    <span className="block text-[9px] text-amber-300">{locale === 'hi' ? 'यूरिया / pH स्ट्रिप' : 'Chemical Strip'}</span>
                  </div>
                </div>
              ) : (
                <div className="inline-flex items-center space-x-1 px-3 py-1 rounded-full bg-emerald-500/20 border border-emerald-400/35 text-xs text-emerald-200 font-bold">
                  <span>{locale === 'hi' ? 'चारे को फ्रेम के बीच में रखें' : 'Keep feed centered inside frame'}</span>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Processing overlay */}
        {isProcessing && (
          <div className="absolute inset-0 bg-black/85 backdrop-blur-xs flex flex-col items-center justify-center z-20 px-4 text-center">
            <div className="w-full h-1.5 bg-emerald-400 shadow-[0_0_20px_#10b981] absolute top-0 animate-[bounce_2s_infinite]" />
            <RefreshCw className="w-10 h-10 text-emerald-400 animate-spin mb-3" />
            <p className="text-sm font-black text-white animate-pulse">
              {processingMessage || t('scan.analyzing', locale)}
            </p>
            <p className="text-xs text-emerald-300 mt-1.5 font-semibold max-w-xs">
              {scanMode === 'strip'
                ? (locale === 'hi' ? 'स्ट्रिप के रंग की जांच हो रही है...' : 'Matching test strip colors...')
                : (locale === 'hi' ? 'चारे की शुद्धता, फफूंद व सुरक्षा की जांच हो रही है...' : 'Checking freshness, cleanliness, and safety...')}
            </p>
          </div>
        )}
      </div>

      {/* Colorimetric Strip Simulation Controls */}
      {scanMode === 'strip' && (
        <StripColorSelector
          stripColor={stripColor}
          setStripColor={setStripColor}
          locale={locale}
        />
      )}

      {/* Action Buttons: Camera & Upload (Minimum 56px Touch Target) */}
      <div className="grid grid-cols-2 gap-3">
        <button
          type="button"
          onClick={() => fileInputRef.current?.click()}
          className="flex items-center justify-center space-x-2 py-4 px-4 bg-[#1F5D3B] hover:bg-[#194a30] text-white font-black text-sm sm:text-base rounded-2xl shadow-xl active:scale-98 transition-all min-h-[56px]"
        >
          <Camera className="w-5 h-5" />
          <span>{t('scan.capture', locale)}</span>
        </button>

        <button
          type="button"
          onClick={() => fileInputRef.current?.click()}
          className="flex items-center justify-center space-x-2 py-4 px-4 font-black text-sm sm:text-base rounded-2xl border-2 shadow-md active:scale-98 transition-all min-h-[56px]"
          style={{
            backgroundColor: isDark ? '#1e293b' : '#ffffff',
            borderColor: isDark ? '#334155' : '#DCD3BF',
            color: isDark ? '#ffffff' : '#1A1A1A',
          }}
        >
          <Upload className="w-5 h-5 text-[#1F5D3B] dark:text-emerald-400" />
          <span>{t('scan.gallery', locale)}</span>
        </button>

        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          capture="environment"
          onChange={handleFileUpload}
          className="hidden"
        />
      </div>

      {/* SIH Evaluator Simulation Presets */}
      <PresetScenarioList
        onSelectPreset={handleSelectPreset}
        locale={locale}
      />

      {/* Simulated QR Code Scanner Dialog */}
      <QrScannerModal
        showQrScanner={showQrScanner}
        qrVerifiedData={qrVerifiedData}
        onClose={closeQrScanner}
        locale={locale}
      />

      {/* In-app Scan Notice Modal */}
      {scanNotice && (
        <div
          role="dialog"
          aria-modal="true"
          aria-labelledby="scan-notice-title"
          className="fixed inset-0 bg-black/75 z-50 flex items-center justify-center p-4 animate-fade-in"
          onClick={closeScanNotice}
        >
          <div
            className="bg-[#FBF8F1] dark:bg-slate-900 border-2 border-[#DCD3BF] dark:border-slate-700 rounded-3xl p-5 w-full max-w-sm space-y-4 shadow-2xl text-[#1A1A1A] dark:text-white"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between border-b border-[#DCD3BF] dark:border-slate-800 pb-2.5">
              <h3 id="scan-notice-title" className="text-sm font-black flex items-center space-x-2">
                <AlertTriangle className="w-5 h-5 text-amber-500 shrink-0" />
                <span>{scanNotice.title}</span>
              </h3>
              <button
                type="button"
                onClick={closeScanNotice}
                className="text-slate-500 hover:text-slate-900 dark:hover:text-white w-11 h-11 min-h-[44px] min-w-[44px] flex items-center justify-center rounded-2xl hover:bg-black/5 dark:hover:bg-white/10"
                aria-label={t('common.close', locale)}
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <p className="text-xs text-slate-700 dark:text-slate-200 whitespace-pre-line leading-relaxed">
              {scanNotice.message}
            </p>
            <div className="flex space-x-2 pt-1">
              {scanNotice.isConfirm && (
                <button
                  type="button"
                  onClick={() => {
                    if (scanNotice.onCancel) scanNotice.onCancel();
                    closeScanNotice();
                  }}
                  className="flex-1 py-3 border-2 border-[#DCD3BF] dark:border-slate-700 rounded-2xl font-bold text-xs min-h-[48px] text-[#1A1A1A] dark:text-white"
                >
                  {t('common.cancel', locale)}
                </button>
              )}
              <button
                type="button"
                onClick={() => {
                  if (scanNotice.onConfirm) scanNotice.onConfirm();
                  closeScanNotice();
                }}
                className="flex-1 py-3 bg-[#1F5D3B] hover:bg-[#194a30] text-white font-black text-xs rounded-2xl shadow-lg min-h-[48px] transition-all"
              >
                {scanNotice.isConfirm ? t('common.confirm', locale) : t('common.understood', locale)}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
