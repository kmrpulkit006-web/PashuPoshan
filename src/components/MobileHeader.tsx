import React, { useState, useEffect } from 'react';
import { Locale } from '../lib/types';
import { t } from '../lib/i18n';
import { Sparkles, Globe, Wifi, WifiOff, DownloadCloud, RefreshCw, Layers } from 'lucide-react';
import { getPendingSyncQueue, getSyncStatus, clearDemoQueue } from '../lib/storage';

interface MobileHeaderProps {
  locale: Locale;
  setLocale: (l: Locale) => void;
  isOnline: boolean;
}

export const MobileHeader: React.FC<MobileHeaderProps> = ({ locale, setLocale, isOnline }) => {
  const [pendingCount, setPendingCount] = useState(0);
  const [installPrompt, setInstallPrompt] = useState<any>(null);
  const [isSyncing, setIsSyncing] = useState(false);

  useEffect(() => {
    const checkQueue = () => {
      const queue = getPendingSyncQueue();
      setPendingCount(queue.length);
    };
    checkQueue();
    const interval = setInterval(checkQueue, 3000);

    const handleBeforeInstall = (e: Event) => {
      e.preventDefault();
      setInstallPrompt(e);
    };
    window.addEventListener('beforeinstallprompt', handleBeforeInstall);

    return () => {
      clearInterval(interval);
      window.removeEventListener('beforeinstallprompt', handleBeforeInstall);
    };
  }, []);

  const handleInstallClick = async () => {
    if (!installPrompt) {
      alert('PashuPoshan AI can be installed directly by tapping "Add to Home Screen" in your mobile browser settings.');
      return;
    }
    installPrompt.prompt();
    const { outcome } = await installPrompt.userChoice;
    if (outcome === 'accepted') {
      setInstallPrompt(null);
    }
  };

  const handleQueueStatusClick = () => {
    const status = getSyncStatus();
    if (status.pendingCount === 0) {
      alert('Local sync queue is empty. All new offline scans, herd edits, and alerts will be queued locally.');
      return;
    }

    const clearConfirm = window.confirm(
      `Local Demo Queue (${status.pendingCount} pending records):\n\n` +
      `Items are safely preserved in browser storage. In production, an authenticated API endpoint will ingest these records.\n\n` +
      `Would you like to clear this demo queue now?`
    );

    if (clearConfirm) {
      clearDemoQueue();
      setPendingCount(0);
    }
  };

  return (
    <header className="sticky top-0 z-40 bg-gradient-to-r from-emerald-950 via-emerald-900 to-teal-950 text-white px-4 py-2.5 shadow-lg border-b border-emerald-800/40 print:hidden">
      <div className="flex items-center justify-between">
        {/* Left: Brand & Problem Statement */}
        <div className="flex items-center space-x-2.5">
          <div className="w-9 h-9 rounded-xl bg-emerald-500/20 border border-emerald-400/30 flex items-center justify-center shadow-inner text-xl" aria-hidden="true">
            🌾
          </div>
          <div>
            <div className="flex items-center space-x-1.5">
              <h1 className="text-sm font-extrabold tracking-tight text-white leading-tight">
                {t('app.name', locale)}
              </h1>
              <span className="text-[9px] font-bold uppercase px-1.5 py-0.5 rounded bg-emerald-800 text-emerald-200 border border-emerald-500/40">
                SIH 26111
              </span>
            </div>
            <p className="text-[10px] text-emerald-300/80 line-clamp-1">
              {t('app.subtitle', locale)}
            </p>
          </div>
        </div>

        {/* Right: Actions (Install, Sync, Language) */}
        <div className="flex items-center space-x-1.5">
          {/* PWA Install Button */}
          <button
            onClick={handleInstallClick}
            title={t('app.installPwa', locale)}
            className="flex items-center space-x-1 px-2 py-1 rounded-lg bg-emerald-800/60 hover:bg-emerald-700/80 border border-emerald-500/30 text-[10px] font-bold text-emerald-200 transition-all min-h-[36px]"
            aria-label="Install App"
          >
            <DownloadCloud className="w-3.5 h-3.5 text-emerald-400" />
            <span className="hidden xs:inline">App</span>
          </button>

          {/* Honest Demo Queue Status Button */}
          <button
            onClick={handleQueueStatusClick}
            title={isOnline ? `${pendingCount} records in local demo queue` : 'Offline Mode (Local Storage)'}
            className={`flex items-center space-x-1 px-2 py-1 rounded-lg text-[10px] font-semibold border transition-all min-h-[36px] ${
              isOnline
                ? (pendingCount > 0 
                    ? 'bg-amber-950/80 border-amber-500/50 text-amber-300' 
                    : 'bg-emerald-950/80 border-emerald-500/50 text-emerald-300')
                : 'bg-slate-900/80 border-slate-700 text-slate-400'
            }`}
            aria-label="Demo queue status"
          >
            {isOnline ? <Wifi className="w-3 h-3 text-emerald-400" /> : <WifiOff className="w-3 h-3 text-amber-400" />}
            <span className="text-[10px]">
              {pendingCount > 0 ? `Queue: ${pendingCount}` : (isOnline ? 'Local' : 'Offline')}
            </span>
          </button>

          {/* Language Switcher */}
          <div className="relative flex items-center bg-slate-900/80 border border-emerald-500/40 rounded-lg px-2 py-1 min-h-[36px]">
            <Globe className="w-3.5 h-3.5 text-emerald-300 mr-1" aria-hidden="true" />
            <select
              value={locale}
              onChange={(e) => setLocale(e.target.value as Locale)}
              className="bg-transparent text-xs font-bold text-white focus:outline-none cursor-pointer pr-1"
              aria-label="Select Application Language"
            >
              <option value="hi" className="text-slate-900">HI (हिंदी)</option>
              <option value="en" className="text-slate-900">EN (Eng)</option>
              <option value="mr" className="text-slate-900">MR (मराठी)</option>
              <option value="gu" className="text-slate-900">GU (ગુજરાતી)</option>
              <option value="pa" className="text-slate-900">PA (ਪੰਜਾਬੀ)</option>
            </select>
          </div>
        </div>
      </div>
    </header>
  );
};
