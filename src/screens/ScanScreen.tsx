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
  } = useScanEngine({ onScanComplete });

  return (
    <div className="p-4 space-y-4 pb-28 print:hidden text-[#1A1A1A] dark:text-white">
      {/* Prominent On-Farm Screening & Heuristic Notice */}
      <div
        className="rounded-3xl p-4 flex items-start space-x-3 shadow-sm border-2 transition-colors"
        style={{
          backgroundColor: isDark ? 'rgba(69, 26, 3, 0.85)' : '#fdf8f4',
          borderColor: isDark ? 'rgba(245, 158, 11, 0.5)' : '#C2703D',
          color: isDark ? '#fef3c7' : '#1A1A1A',
        }}
        role="note"
      >
        <div className="w-8 h-8 rounded-xl bg-[#f3d6c4] dark:bg-amber-500/20 border border-[#C2703D] dark:border-amber-400/40 flex items-center justify-center shrink-0 mt-0.5">
          <AlertTriangle className="w-5 h-5 text-[#C2703D] dark:text-amber-400" />
        </div>
        <div className="text-xs leading-relaxed font-semibold">
          <span className="font-black text-[#C2703D] dark:text-amber-300 block text-xs uppercase tracking-wide">
            Rapid Field Screening (खेत पर त्वरित जांच):
          </span>
          Instant optical and strip screening for quick on-farm guidance. For official dispute resolution or laboratory certification, confirmatory wet-chemistry analysis is advised.
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
          <button
            onClick={handleSimulateQrScan}
            className="flex items-center space-x-1.5 text-xs font-black text-[#1F5D3B] dark:text-emerald-300 bg-[#edf7f0] dark:bg-emerald-950/80 border border-[#b0dec0] dark:border-emerald-500/40 px-3 py-2 rounded-xl hover:bg-[#d6eddc] transition-all min-h-[44px]"
            aria-label="Scan Feed Bag QR (Demo)"
          >
            <QrCode className="w-4 h-4" />
            <span>{t('scan.qrScan', locale)}</span>
          </button>
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
        <div className="flex items-center space-x-2 overflow-x-auto py-1 pr-4 text-xs">
          <span className="text-xs font-bold whitespace-nowrap shrink-0 opacity-80">
            {t('scan.feedType', locale)}
          </span>
          {(['silage', 'concentrate', 'green_fodder', 'dry_fodder'] as FeedCategory[]).map((cat) => {
            const isSelected = category === cat;
            return (
              <button
                key={cat}
                type="button"
                onClick={() => setCategory(cat)}
                className="px-3 py-2 rounded-xl font-black capitalize whitespace-nowrap text-xs border-2 transition-all min-h-[44px] shrink-0 shadow-xs"
                style={{
                  backgroundColor: isSelected ? (isDark ? '#022c22' : '#edf7f0') : (isDark ? '#0f172a' : '#ffffff'),
                  borderColor: isSelected ? (isDark ? '#34d399' : '#1F5D3B') : (isDark ? '#334155' : '#DCD3BF'),
                  color: isSelected ? (isDark ? '#ffffff' : '#1F5D3B') : (isDark ? '#94a3b8' : '#5A5243'),
                }}
              >
                {cat.replace('_', ' ')}
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
              <span className="bg-[#1F5D3B]/90 backdrop-blur-xs text-white text-xs font-black px-3 py-1 rounded-full border border-emerald-400/50 flex items-center space-x-1.5 shadow-md">
                <span className="w-2 h-2 rounded-full bg-emerald-300 animate-pulse" />
                <span>Sample Photo Ready</span>
              </span>

              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="bg-black/70 hover:bg-black/90 backdrop-blur-xs text-white text-xs font-bold px-3 py-1.5 rounded-full border border-white/30 flex items-center space-x-1 shadow-md active:scale-95 transition-all"
                title="Retake or choose another photo"
              >
                <RefreshCw className="w-3.5 h-3.5 text-emerald-300" />
                <span>Retake</span>
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
                    : 'Place strip next to reference card inside the box'}
                </p>
                <p className="text-[11px] text-slate-300 mt-1 font-semibold">
                  {scanMode === 'vision'
                    ? t('scan.lightingTip', locale)
                    : 'स्ट्रिप को बॉक्स के अंदर संदर्भ कार्ड (सफेद पेपर) के पास रखें'}
                </p>
              </div>

              {/* Strip Mode Dual Box Guidance */}
              {scanMode === 'strip' ? (
                <div className="grid grid-cols-2 gap-2 pt-1">
                  <div className="border-2 border-dashed border-white/60 bg-white/10 rounded-xl p-1.5 text-[10px] text-white font-bold">
                    <span>⬜ Reference Card</span>
                    <span className="block text-[8px] text-emerald-200">सफ़ेद संदर्भ कार्ड</span>
                  </div>
                  <div className="border-2 border-dashed border-amber-300/80 bg-amber-500/10 rounded-xl p-1.5 text-[10px] text-amber-200 font-bold">
                    <span>🧪 Test Strip</span>
                    <span className="block text-[8px] text-amber-300">pH / यूरिया स्ट्रिप</span>
                  </div>
                </div>
              ) : (
                <div className="inline-flex items-center space-x-1 px-2.5 py-0.5 rounded-full bg-emerald-500/15 border border-emerald-400/30 text-[10px] text-emerald-300 font-mono font-bold uppercase tracking-wider">
                  <span>Align sample inside frame</span>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Processing laser overlay */}
        {isProcessing && (
          <div className="absolute inset-0 bg-black/85 backdrop-blur-xs flex flex-col items-center justify-center z-20 px-4 text-center">
            <div className="w-full h-1.5 bg-emerald-400 shadow-[0_0_20px_#10b981] absolute top-0 animate-[bounce_2s_infinite]" />
            <RefreshCw className="w-10 h-10 text-emerald-400 animate-spin mb-3" />
            <p className="text-sm font-black text-white animate-pulse">
              {processingMessage || t('scan.analyzing', locale)}
            </p>
            <p className="text-xs text-emerald-300 mt-1.5 font-semibold max-w-xs">
              {scanMode === 'strip'
                ? 'Reference Card Gain Normalization & CIEDE2000 Matching...'
                : 'Physical condition, mold coverage, & foreign matter triage...'}
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
      />
    </div>
  );
};
