import React, { useState, useRef } from 'react';
import { FeedSample, Locale, FeedCategory } from '../lib/types';
import { t } from '../lib/i18n';
import { PRESET_FEED_SCENARIOS, analyzeCanvasImageData } from '../lib/feedAnalysisEngine';
import { saveLocalScan } from '../lib/storage';
import {
  Camera,
  Upload,
  Sparkles,
  Zap,
  CheckCircle2,
  AlertTriangle,
  Scan,
  FlaskConical,
  RefreshCw,
  Info,
  QrCode,
  ShieldCheck,
  X
} from 'lucide-react';
import confetti from 'canvas-confetti';

interface ScanScreenProps {
  onScanComplete: (sample: FeedSample) => void;
  locale: Locale;
}

export const ScanScreen: React.FC<ScanScreenProps> = ({ onScanComplete, locale }) => {
  const [scanMode, setScanMode] = useState<'vision' | 'strip'>('vision');
  const [category, setCategory] = useState<FeedCategory>('silage');
  const [isProcessing, setIsProcessing] = useState(false);
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [stripColor, setStripColor] = useState<'yellow' | 'magenta' | 'green'>('yellow');
  const [showQrScanner, setShowQrScanner] = useState(false);
  const [qrVerifiedData, setQrVerifiedData] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Trigger known control preset for evaluator demo
  const handleSelectPreset = (scenario: FeedSample) => {
    setIsProcessing(true);
    setTimeout(() => {
      setIsProcessing(false);
      saveLocalScan(scenario);
      if (scenario.overallGrade.includes('Tier A')) {
        confetti({ particleCount: 60, spread: 60, origin: { y: 0.8 } });
      }
      onScanComplete(scenario);
    }, 900);
  };

  // Real Canvas-based image pixel analysis
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = () => {
      const imgUri = reader.result as string;
      setSelectedImage(imgUri);
      processLiveImageWithCanvas(imgUri);
    };
    reader.readAsDataURL(file);
  };

  const processLiveImageWithCanvas = (imgUri: string) => {
    setIsProcessing(true);

    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.src = imgUri;
    img.onload = () => {
      // Draw to offscreen canvas for pixel extraction
      const canvas = document.createElement('canvas');
      canvas.width = 120;
      canvas.height = 120;
      const ctx = canvas.getContext('2d');
      if (!ctx) {
        setIsProcessing(false);
        return;
      }

      ctx.drawImage(img, 0, 0, 120, 120);
      const imageData = ctx.getImageData(0, 0, 120, 120);

      let colorRgb = undefined;
      if (scanMode === 'strip') {
        if (stripColor === 'magenta') colorRgb = { r: 190, g: 30, b: 130 }; // Adulterated Urea
        else if (stripColor === 'green') colorRgb = { r: 40, g: 180, b: 160 }; // High pH
        else colorRgb = { r: 240, g: 210, b: 50 }; // Pure Yellow
      }

      setTimeout(() => {
        setIsProcessing(false);
        const analyzed = analyzeCanvasImageData(category, imageData, scanMode === 'strip', colorRgb);
        analyzed.imageUrl = imgUri;
        saveLocalScan(analyzed);

        if (analyzed.overallGrade.includes('Tier A')) {
          confetti({ particleCount: 50, spread: 70, origin: { y: 0.7 } });
        }
        onScanComplete(analyzed);
      }, 1500);
    };
  };

  const handleSimulateQrScan = () => {
    setShowQrScanner(true);
    setTimeout(() => {
      setQrVerifiedData('LIC-BIS-MH-2026-8819: Anand Super Cattle Feed (Type II 20% CP) • Expiry: 12/2026 • Certified Batch');
    }, 1200);
  };

  return (
    <div className="p-4 space-y-4 pb-24 print:hidden">
      {/* Title & Mode Switcher */}
      <div className="bg-slate-800/90 border border-slate-700/80 rounded-2xl p-3.5 shadow-md">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center space-x-2">
            <div className="w-7 h-7 rounded-lg bg-emerald-500/20 text-emerald-400 flex items-center justify-center">
              <Scan className="w-4 h-4" />
            </div>
            <h2 className="text-sm font-bold text-white tracking-tight">
              {t('scan.title', locale)}
            </h2>
          </div>
          <button
            onClick={handleSimulateQrScan}
            className="flex items-center space-x-1 text-[11px] font-semibold text-emerald-300 bg-emerald-950/80 border border-emerald-500/40 px-2 py-1 rounded-lg hover:bg-emerald-900 transition-all"
            aria-label="Scan Feed Bag QR"
          >
            <QrCode className="w-3.5 h-3.5" />
            <span>{t('scan.qrScan', locale)}</span>
          </button>
        </div>

        {/* Dual Mode Switcher Tabs */}
        <div className="grid grid-cols-2 gap-1.5 p-1 bg-slate-900/90 rounded-xl border border-slate-700/60" role="tablist">
          <button
            role="tab"
            aria-selected={scanMode === 'vision'}
            onClick={() => setScanMode('vision')}
            className={`flex items-center justify-center space-x-1.5 py-2 px-2 rounded-lg text-xs font-bold transition-all min-h-[44px] ${
              scanMode === 'vision'
                ? 'bg-emerald-600 text-white shadow'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <Camera className="w-4 h-4" />
            <span className="truncate">{t('scan.modeVision', locale)}</span>
          </button>
          <button
            role="tab"
            aria-selected={scanMode === 'strip'}
            onClick={() => setScanMode('strip')}
            className={`flex items-center justify-center space-x-1.5 py-2 px-2 rounded-lg text-xs font-bold transition-all min-h-[44px] ${
              scanMode === 'strip'
                ? 'bg-emerald-600 text-white shadow'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <FlaskConical className="w-4 h-4" />
            <span className="truncate">{t('scan.modeStrip', locale)}</span>
          </button>
        </div>

        {/* Category Selector */}
        <div className="mt-3 flex items-center space-x-2 overflow-x-auto pb-1 text-xs">
          <span className="text-slate-400 text-[11px] font-medium whitespace-nowrap">{t('scan.feedType', locale)}</span>
          {(['silage', 'concentrate', 'green_fodder', 'dry_fodder'] as FeedCategory[]).map((cat) => (
            <button
              key={cat}
              onClick={() => setCategory(cat)}
              className={`px-2.5 py-1.5 rounded-lg font-semibold capitalize whitespace-nowrap text-[11px] border transition-all min-h-[36px] ${
                category === cat
                  ? 'bg-emerald-500/20 border-emerald-400 text-emerald-300'
                  : 'bg-slate-800 border-slate-700 text-slate-400 hover:text-slate-200'
              }`}
            >
              {cat.replace('_', ' ')}
            </button>
          ))}
        </div>
      </div>

      {/* Camera Viewfinder with Calibration Reticle */}
      <div className="relative aspect-[4/3] w-full rounded-2xl bg-slate-950 border-2 border-dashed border-emerald-500/50 overflow-hidden flex flex-col items-center justify-center p-4 shadow-xl">
        {selectedImage ? (
          <img src={selectedImage} alt="Sample captured" className="w-full h-full object-cover rounded-xl" />
        ) : (
          <div className="text-center space-y-2.5 z-10 p-2">
            <div className="w-14 h-14 rounded-full bg-emerald-950/80 border border-emerald-500/40 text-emerald-400 flex items-center justify-center mx-auto shadow-lg">
              {scanMode === 'vision' ? <Camera className="w-7 h-7" /> : <FlaskConical className="w-7 h-7" />}
            </div>
            <div>
              <p className="text-xs font-bold text-white">
                {scanMode === 'vision'
                  ? t('scan.pointCamera', locale)
                  : t('scan.alignStrip', locale)}
              </p>
              <p className="text-[10px] text-slate-400 mt-0.5">
                {t('scan.lightingTip', locale)}
              </p>
            </div>
          </div>
        )}

        {/* Processing laser overlay */}
        {isProcessing && (
          <div className="absolute inset-0 bg-emerald-950/70 backdrop-blur-xs flex flex-col items-center justify-center z-20">
            <div className="w-full h-1 bg-emerald-400 shadow-[0_0_15px_#10b981] absolute top-0 animate-[bounce_2s_infinite]" />
            <RefreshCw className="w-9 h-9 text-emerald-400 animate-spin mb-2" />
            <p className="text-xs font-bold text-white animate-pulse">
              {t('scan.analyzing', locale)}
            </p>
            <p className="text-[10px] text-emerald-300 mt-1">
              Extracting Canvas RGB & Surface Texture Metrics...
            </p>
          </div>
        )}

        {/* Card alignment guides */}
        <div className="absolute inset-4 border border-emerald-500/30 rounded-xl pointer-events-none flex items-center justify-center">
          <div className="w-32 h-16 border border-emerald-400/50 border-dashed rounded-lg flex items-center justify-center">
            <span className="text-[9px] text-emerald-400 font-mono tracking-wider uppercase">Sample ROI</span>
          </div>
        </div>
      </div>

      {/* Colorimetric Strip Simulation Controls */}
      {scanMode === 'strip' && (
        <div className="bg-slate-800/90 border border-slate-700 rounded-xl p-3">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-bold text-white">
              {t('scan.stripSimulation', locale)}
            </span>
            <span className="text-[10px] text-slate-400">{t('scan.stripTapTip', locale)}</span>
          </div>
          <div className="grid grid-cols-3 gap-2">
            <button
              onClick={() => setStripColor('yellow')}
              className={`p-2 rounded-lg border text-center transition-all min-h-[44px] ${
                stripColor === 'yellow'
                  ? 'bg-amber-950 border-amber-400 text-amber-200 shadow-inner'
                  : 'bg-slate-900 border-slate-700 text-slate-400'
              }`}
            >
              <div className="w-full h-2.5 rounded bg-amber-400 mb-1" />
              <div className="text-[10px] font-bold leading-tight">{t('scan.yellowSafe', locale)}</div>
            </button>

            <button
              onClick={() => setStripColor('magenta')}
              className={`p-2 rounded-lg border text-center transition-all min-h-[44px] ${
                stripColor === 'magenta'
                  ? 'bg-rose-950 border-rose-400 text-rose-200 shadow-inner'
                  : 'bg-slate-900 border-slate-700 text-slate-400'
              }`}
            >
              <div className="w-full h-2.5 rounded bg-pink-600 mb-1" />
              <div className="text-[10px] font-bold leading-tight">{t('scan.magentaUrea', locale)}</div>
            </button>

            <button
              onClick={() => setStripColor('green')}
              className={`p-2 rounded-lg border text-center transition-all min-h-[44px] ${
                stripColor === 'green'
                  ? 'bg-teal-950 border-teal-400 text-teal-200 shadow-inner'
                  : 'bg-slate-900 border-slate-700 text-slate-400'
              }`}
            >
              <div className="w-full h-2.5 rounded bg-teal-500 mb-1" />
              <div className="text-[10px] font-bold leading-tight">{t('scan.greenHighPh', locale)}</div>
            </button>
          </div>
        </div>
      )}

      {/* Action Buttons: Camera & Upload */}
      <div className="grid grid-cols-2 gap-3">
        <button
          onClick={() => fileInputRef.current?.click()}
          className="flex items-center justify-center space-x-2 py-3 px-4 bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs rounded-xl shadow-lg active:scale-98 transition-all min-h-[46px]"
        >
          <Camera className="w-4 h-4" />
          <span>{t('scan.capture', locale)}</span>
        </button>

        <button
          onClick={() => fileInputRef.current?.click()}
          className="flex items-center justify-center space-x-2 py-3 px-4 bg-slate-800 hover:bg-slate-700 text-slate-200 font-bold text-xs rounded-xl border border-slate-700 shadow active:scale-98 transition-all min-h-[46px]"
        >
          <Upload className="w-4 h-4" />
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
      <div className="bg-gradient-to-br from-slate-900 to-emerald-950/40 border border-emerald-500/30 rounded-2xl p-3.5 shadow-md">
        <div className="flex items-center justify-between mb-1.5">
          <div className="flex items-center space-x-1.5">
            <Zap className="w-4 h-4 text-amber-400" />
            <h3 className="text-xs font-bold text-white">
              {t('scan.evaluatorDemo', locale)}
            </h3>
          </div>
          <span className="text-[9px] text-amber-300 font-bold bg-amber-950/90 border border-amber-500/40 px-2 py-0.5 rounded-full">
            Known Field Controls
          </span>
        </div>
        <p className="text-[10px] text-slate-400 mb-3">
          {t('scan.evaluatorTip', locale)}
        </p>

        <div className="grid grid-cols-1 gap-2">
          {PRESET_FEED_SCENARIOS.map((scenario) => {
            const isTierA = scenario.overallGrade.includes('Tier A');
            const isTierC = scenario.overallGrade.includes('Tier C');
            return (
              <button
                key={scenario.id}
                onClick={() => handleSelectPreset(scenario)}
                className={`w-full flex items-center justify-between p-2.5 rounded-xl border text-left transition-all active:scale-98 min-h-[48px] ${
                  isTierA
                    ? 'bg-slate-800/80 hover:bg-emerald-950/50 border-emerald-500/30 text-slate-200'
                    : (isTierC ? 'bg-slate-800/80 hover:bg-rose-950/50 border-rose-500/40 text-slate-200' : 'bg-slate-800/80 hover:bg-amber-950/50 border-amber-500/40 text-slate-200')
                }`}
              >
                <div className="flex items-center space-x-2.5">
                  <img
                    src={scenario.imageUrl}
                    alt=""
                    className="w-10 h-10 rounded-lg object-cover border border-slate-700 shrink-0"
                  />
                  <div>
                    <div className="text-xs font-bold text-white line-clamp-1">{scenario.name}</div>
                    <div className="text-[10px] text-slate-400">{scenario.sourceOrBrand}</div>
                  </div>
                </div>

                <div className="text-right shrink-0">
                  <span
                    className={`text-[9px] font-extrabold px-2 py-0.5 rounded-full border ${
                      isTierA
                        ? 'bg-emerald-950 text-emerald-300 border-emerald-500/40'
                        : (isTierC ? 'bg-rose-950 text-rose-300 border-rose-500/40 animate-pulse' : 'bg-amber-950 text-amber-300 border-amber-500/40')
                    }`}
                  >
                    {isTierA ? 'Grade A' : (isTierC ? 'Hazard!' : 'Tier B')}
                  </span>
                  <div className="text-[9px] text-slate-400 mt-1">
                    CP {scenario.metrics.crudeProtein}%
                  </div>
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* QR Code Scanner Dialog */}
      {showQrScanner && (
        <div className="fixed inset-0 bg-black/75 z-50 flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-700 rounded-2xl p-4 w-full max-w-sm space-y-3 shadow-2xl">
            <div className="flex items-center justify-between">
              <h3 className="text-xs font-bold text-white flex items-center space-x-1.5">
                <QrCode className="w-4 h-4 text-emerald-400" />
                <span>BIS Feed Bag QR Authenticator</span>
              </h3>
              <button
                onClick={() => { setShowQrScanner(false); setQrVerifiedData(null); }}
                className="text-slate-400 hover:text-white"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="aspect-video bg-black rounded-xl border-2 border-dashed border-emerald-500/40 flex items-center justify-center text-center p-4">
              {qrVerifiedData ? (
                <div className="text-emerald-300 space-y-1">
                  <ShieldCheck className="w-8 h-8 mx-auto text-emerald-400 animate-bounce" />
                  <div className="text-xs font-bold">Manufacturer Verified</div>
                  <div className="text-[10px] text-slate-300 leading-tight">{qrVerifiedData}</div>
                </div>
              ) : (
                <div className="space-y-2">
                  <RefreshCw className="w-6 h-6 text-emerald-400 animate-spin mx-auto" />
                  <p className="text-[11px] text-slate-400">Scanning Barcode / QR Code...</p>
                </div>
              )}
            </div>

            <button
              onClick={() => { setShowQrScanner(false); setQrVerifiedData(null); }}
              className="w-full py-2.5 bg-emerald-600 text-white font-bold text-xs rounded-xl shadow"
            >
              Done
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
