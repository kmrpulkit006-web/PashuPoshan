import React from 'react';
import { FeedSample, Locale, FeedCategory } from '../lib/types';
import { t } from '../lib/i18n';
import { useScanEngine } from '../hooks/useScanEngine';
import { StripColorSelector } from '../components/scan/StripColorSelector';
import { PresetScenarioList } from '../components/scan/PresetScenarioList';
import { QrScannerModal } from '../components/scan/QrScannerModal';
import { NirScannerModal } from '../components/scan/NirScannerModal';
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
  Radio,
  Cpu,
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

  const [showNirModal, setShowNirModal] = React.useState(false);

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
        return t('scan.catSilage', locale);
      case 'concentrate':
        return t('scan.catConcentrate', locale);
      case 'green_fodder':
        return t('scan.catGreenFodder', locale);
      case 'dry_fodder':
        return t('scan.catDryFodder', locale);
      default:
        return cat;
    }
  };

  return (
    <div className="p-4 space-y-4 pb-24 max-w-lg mx-auto">
      {/* 1. HERO INSTRUCTIONAL BANNER */}
      <div className="bg-gradient-to-br from-[#edf7f0] to-[#d6eddc] dark:from-emerald-950/80 dark:to-teal-950/80 border-2 border-[#b0dec0] dark:border-emerald-700/60 rounded-3xl p-4 shadow-sm text-slate-800 dark:text-slate-100">
        <div className="flex items-start space-x-3">
          <div className="w-12 h-12 rounded-2xl bg-[#1F5D3B] text-white flex items-center justify-center shrink-0 shadow-md">
            <Scan className="w-6 h-6" />
          </div>
          <div className="min-w-0 flex-1">
            <span className="text-[10px] font-black uppercase px-2 py-0.5 rounded-full bg-[#1F5D3B]/15 text-[#1F5D3B] dark:text-emerald-300 dark:bg-emerald-500/20 border border-[#1F5D3B]/20 dark:border-emerald-500/30 tracking-wider">
              {t('scan.badgeGuide', locale)}
            </span>
            <h2 className="text-base sm:text-lg font-black text-[#1A1A1A] dark:text-white mt-1 leading-tight">
              {t('scan.heroTitle', locale)}
            </h2>
            <p className="text-sm text-[#2c533c] dark:text-emerald-100 font-semibold mt-1 leading-relaxed">
              {t('scan.heroSubtitle', locale)}
            </p>
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
        <div className="flex items-center justify-between flex-wrap gap-2">
          <div className="flex items-center space-x-2">
            <div className="w-9 h-9 rounded-2xl bg-[#1F5D3B]/15 text-[#1F5D3B] dark:text-emerald-400 flex items-center justify-center">
              <Scan className="w-5 h-5" />
            </div>
            <h2 className="text-base font-black tracking-tight">
              {t('scan.title', locale)}
            </h2>
          </div>
          <div className="flex items-center space-x-1.5 flex-wrap gap-1">
            <button
              onClick={() => setShowNirModal(true)}
              className="flex items-center space-x-1 text-xs font-black text-emerald-800 dark:text-emerald-300 bg-emerald-100/90 dark:bg-emerald-950/90 border border-emerald-400 dark:border-emerald-500/60 px-2.5 py-2 rounded-xl hover:bg-emerald-200 transition-all min-h-[44px]"
              aria-label="Connect IoT NIR Scanner (BLE)"
            >
              <Radio className="w-4 h-4 text-emerald-600 dark:text-emerald-400 animate-pulse" />
              <span>IoT Scanner</span>
            </button>
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
              <span className="hidden xs:inline">{t('scan.pastTests', locale)}</span>
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
            className={`flex items-center justify-center space-x-1.5 py-3 px-2 rounded-xl text-sm font-extrabold transition-all min-h-[56px] ${
              scanMode === 'vision'
                ? 'bg-[#1F5D3B] text-white shadow-md'
                : 'text-[#5A5243] dark:text-slate-400 hover:text-[#1A1A1A]'
            }`}
          >
            <Camera className="w-5 h-5 shrink-0" />
            <span className="text-center leading-tight">{t('scan.modeVision', locale)}</span>
          </button>
          <button
            role="tab"
            aria-selected={scanMode === 'strip'}
            onClick={() => setScanMode('strip')}
            className={`flex items-center justify-center space-x-1.5 py-3 px-2 rounded-xl text-sm font-extrabold transition-all min-h-[56px] ${
              scanMode === 'strip'
                ? 'bg-[#1F5D3B] text-white shadow-md'
                : 'text-[#5A5243] dark:text-slate-400 hover:text-[#1A1A1A]'
            }`}
          >
            <FlaskConical className="w-5 h-5 shrink-0" />
            <span className="text-center leading-tight">{t('scan.modeStrip', locale)}</span>
          </button>
        </div>

        {/* Category Selector as large 2x2 tiles (no hidden off-screen chips) */}
        <div>
          <span className="text-sm font-extrabold block mb-2">
            {t('scan.feedType', locale)}
          </span>
          <div
            className="grid grid-cols-2 gap-2"
            role="tablist"
            aria-label="Feed category selection"
          >
          {(['silage', 'concentrate', 'green_fodder', 'dry_fodder'] as FeedCategory[]).map((cat) => {
            const isSelected = category === cat;
            return (
              <button
                key={cat}
                role="tab"
                aria-selected={isSelected}
                type="button"
                onClick={() => setCategory(cat)}
                className="px-3 py-3 rounded-2xl font-extrabold text-sm border-2 transition-all min-h-[56px] shadow-xs text-center leading-tight"
                style={{
                  backgroundColor: isSelected ? (isDark ? '#022c22' : '#edf7f0') : (isDark ? '#0f172a' : '#ffffff'),
                  borderColor: isSelected ? (isDark ? '#34d399' : '#1F5D3B') : (isDark ? '#334155' : '#DCD3BF'),
                  color: isSelected ? (isDark ? '#ffffff' : '#1F5D3B') : (isDark ? '#cbd5e1' : '#3f3a32'),
                }}
              >
                {getCategoryLabel(cat)}
              </button>
            );
          })}
          </div>
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
                    : t('scan.alignStripDetail', locale)}
                </p>
                <p className="text-[11px] text-slate-300 mt-1 font-semibold">
                  {scanMode === 'vision'
                    ? t('scan.lightingTip', locale)
                    : t('scan.lightingTipDetail', locale)}
                </p>
              </div>

              {/* Strip Mode Dual Box Guidance */}
              {scanMode === 'strip' ? (
                <div className="grid grid-cols-2 gap-2 pt-1">
                  <div className="border-2 border-dashed border-white/60 bg-white/10 rounded-xl p-1.5 text-[11px] text-white font-bold">
                    <span>⬜ {t('scan.whiteCard', locale)}</span>
                    <span className="block text-[9px] text-emerald-200">{t('scan.whiteBg', locale)}</span>
                  </div>
                  <div className="border-2 border-dashed border-amber-300/80 bg-amber-500/10 rounded-xl p-1.5 text-[11px] text-amber-200 font-bold">
                    <span>🧪 {t('scan.testStrip', locale)}</span>
                    <span className="block text-[9px] text-amber-300">{t('scan.chemicalStrip', locale)}</span>
                  </div>
                </div>
              ) : (
                <div className="inline-flex items-center space-x-1 px-3 py-1 rounded-full bg-emerald-500/20 border border-emerald-400/35 text-xs text-emerald-200 font-bold">
                  <span>{t('scan.keepCentered', locale)}</span>
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
                ? t('scan.stripMatching', locale)
                : t('scan.visionChecking', locale)}
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
      {/* One big photo button first — the action farmers use most */}
      <div className="space-y-2.5">
        <button
          type="button"
          onClick={() => fileInputRef.current?.click()}
          className="farmer-cta w-full flex items-center justify-center space-x-2 py-4 px-4 bg-[#1F5D3B] hover:bg-[#194a30] text-white rounded-2xl shadow-xl active:scale-98 transition-all"
        >
          <Camera className="w-7 h-7" />
          <span>{t('scan.capture', locale)}</span>
        </button>

        <button
          type="button"
          onClick={() => fileInputRef.current?.click()}
          className="w-full flex items-center justify-center space-x-2 py-3.5 px-4 font-extrabold text-sm rounded-2xl border-2 shadow-md active:scale-98 transition-all min-h-[52px]"
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

      {/* IoT Multi-Spectral NIR Hardware Testing Card */}
      <div className="bg-gradient-to-br from-[#0a2315] via-[#0e311d] to-[#0a2315] border-2 border-emerald-500/60 rounded-3xl p-4 shadow-lg text-white space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-2xl bg-emerald-500/20 border border-emerald-400/50 flex items-center justify-center text-emerald-400 shadow-[0_0_15px_rgba(16,185,129,0.3)] shrink-0">
              <Cpu className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <h3 className="text-sm font-black tracking-tight text-white">
                  IoT Multi-Spectral NIR Scanner
                </h3>
                <span className="text-[9px] font-black uppercase px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-400/40">
                  BLE 5.0
                </span>
              </div>
              <p className="text-[11px] text-emerald-200/80 font-medium">
                AS7265x 18-Channel Hardware • 1D-CNN Model (Zero API)
              </p>
            </div>
          </div>
        </div>

        <button
          type="button"
          onClick={() => setShowNirModal(true)}
          className="w-full py-3.5 px-4 bg-emerald-400 hover:bg-emerald-300 text-slate-950 font-black text-xs sm:text-sm rounded-2xl shadow-md active:scale-98 transition-all flex items-center justify-center space-x-2 min-h-[48px]"
        >
          <Radio className="w-4 h-4 text-slate-950 animate-pulse" />
          <span>Connect & Acquire via IoT NIR Scanner</span>
        </button>
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

      {/* IoT NIR Multi-Spectral Hardware Scanner Modal */}
      <NirScannerModal
        isOpen={showNirModal}
        onClose={() => setShowNirModal(false)}
        onScanComplete={onScanComplete}
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
