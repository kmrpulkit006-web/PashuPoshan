import React, { useState, useEffect } from 'react';
import { Locale, SUPPORTED_LANGUAGES } from '../lib/types';
import { t, getLanguageInfo } from '../lib/i18n';
import { Globe, Sun, Moon, Info, X, DownloadCloud, Layers, Trash2, RefreshCw, Bot, AlertTriangle } from 'lucide-react';
import { getPendingSyncQueue, getPendingOfflineScans, syncPendingScans, clearDemoQueue, clearPendingOfflineScans } from '../lib/storage';
import { VeterinaryChatModal } from './VeterinaryChatModal';
import { toHumanErrorMessage } from '../lib/humanErrors';

interface MobileHeaderProps {
  locale: Locale;
  setLocale: (l: Locale) => void;
  isOnline: boolean;
  theme: 'light' | 'dark';
  setTheme: (theme: 'light' | 'dark') => void;
  pendingScansCount?: number;
}

interface HeaderNotice {
  title?: string;
  message: string;
  isConfirm?: boolean;
  confirmLabel?: string;
  cancelLabel?: string;
  onConfirm?: () => void;
}

export const MobileHeader: React.FC<MobileHeaderProps> = ({
  locale,
  setLocale,
  isOnline,
  theme,
  setTheme,
  pendingScansCount = 0,
}) => {
  const [showInfoModal, setShowInfoModal] = useState(false);
  const [showChatModal, setShowChatModal] = useState(false);
  const [pendingCount, setPendingCount] = useState(pendingScansCount);
  const [isSyncing, setIsSyncing] = useState(false);
  const [installPrompt, setInstallPrompt] = useState<any>(null);
  const [headerNotice, setHeaderNotice] = useState<HeaderNotice | null>(null);

  useEffect(() => {
    if (!showInfoModal && !headerNotice) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setShowInfoModal(false);
        setHeaderNotice(null);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [showInfoModal, headerNotice]);

  useEffect(() => {
    const checkQueue = () => {
      const q1 = getPendingSyncQueue();
      const q2 = getPendingOfflineScans();
      setPendingCount(q1.length + q2.length);
    };
    checkQueue();

    const handleBeforeInstall = (e: Event) => {
      e.preventDefault();
      setInstallPrompt(e);
    };
    window.addEventListener('beforeinstallprompt', handleBeforeInstall);

    const handleSyncChange = () => checkQueue();
    window.addEventListener('pashuposhan_pending_sync_changed', handleSyncChange);

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstall);
      window.removeEventListener('pashuposhan_pending_sync_changed', handleSyncChange);
    };
  }, []);

  const handleManualSync = async () => {
    if (!isOnline) {
      setHeaderNotice({
        title: t('header.offlineTitle', locale),
        message: t('header.offlineNotice', locale),
      });
      return;
    }
    setIsSyncing(true);
    try {
      const { successful } = await syncPendingScans();
      setIsSyncing(false);
      const q1 = getPendingSyncQueue();
      const q2 = getPendingOfflineScans();
      setPendingCount(q1.length + q2.length);
      setHeaderNotice({
        title: t('sync.complete', locale),
        message: t('header.syncSuccess', locale, { count: successful }),
      });
    } catch (e: any) {
      setIsSyncing(false);
      setHeaderNotice({
        title: t('sync.failedRetry', locale),
        message: toHumanErrorMessage(e, locale),
      });
    }
  };

  const handleInstallClick = async () => {
    if (!installPrompt) {
      setHeaderNotice({
        title: t('app.installPwa', locale),
        message:
          'PashuPoshan AI can be installed directly by tapping "Add to Home Screen" in your mobile browser settings.',
      });
      return;
    }
    installPrompt.prompt();
    const { outcome } = await installPrompt.userChoice;
    if (outcome === 'accepted') {
      setInstallPrompt(null);
    }
  };

  const handleClearQueue = () => {
    setHeaderNotice({
      title: t('header.clearQueueTitle', locale),
      message: t('header.clearQueueConfirm', locale),
      isConfirm: true,
      confirmLabel: t('header.clearQueueBtn', locale),
      cancelLabel: t('common.cancel', locale),
      onConfirm: () => {
        clearDemoQueue();
        clearPendingOfflineScans();
        setPendingCount(0);
      },
    });
  };

  const toggleTheme = () => {
    const nextTheme = theme === 'light' ? 'dark' : 'light';
    setTheme(nextTheme);
    localStorage.setItem('pashuposhan_theme', nextTheme);
    document.documentElement.classList.toggle('dark', nextTheme === 'dark');
    document.body.classList.toggle('dark', nextTheme === 'dark');
  };

  return (
    <>
      <header
        className="sticky top-0 z-40 bg-[#1F5D3B] dark:bg-slate-900 text-white px-3 py-2 shadow-md border-b border-[#194a30] dark:border-slate-800 print:hidden transition-colors select-none"
        style={{ paddingTop: 'max(0.5rem, env(safe-area-inset-top))' }}
      >
        <div className="flex items-center justify-between gap-2 max-w-full">
          {/* Left: App Logo & Name with Simple Connectivity Dot */}
          <div className="flex items-center space-x-2 min-w-0 flex-1">
            <div
              className="w-8 h-8 sm:w-9 sm:h-9 rounded-xl bg-white/15 border border-white/20 flex items-center justify-center text-lg sm:text-xl shrink-0 shadow-inner"
              aria-hidden="true"
            >
              🌾
            </div>
            <div className="min-w-0">
              <div className="flex items-center space-x-1.5">
                <h1 className="text-sm sm:text-base font-black tracking-tight text-white truncate leading-none">
                  {t('app.name', locale)}
                </h1>
                {/* Minimal connectivity dot with accessible tooltip */}
                <div
                  className="flex items-center shrink-0"
                  title={isOnline ? 'Online - Internet Connected' : 'Offline Mode (Local Storage)'}
                  aria-label={isOnline ? 'Online' : 'Offline'}
                >
                  <span
                    className={`w-2 h-2 rounded-full ${
                      isOnline ? 'bg-emerald-300 shadow-[0_0_6px_#6ee7b7]' : 'bg-amber-400'
                    }`}
                  />
                </div>
              </div>
              <p className="text-[10px] text-emerald-100/80 font-medium truncate leading-tight hidden xs:block mt-0.5">
                {t('app.subtitle', locale)}
              </p>
            </div>
          </div>

          {/* Right: Language Switcher, AI Chat & Info Modal Trigger */}
          <div className="flex items-center space-x-1.5 shrink-0">
            {/* Prominent Language Switcher (Displays native script like 🌐 हिंदी ▾) */}
            <div className="relative flex items-center justify-between bg-black/25 dark:bg-slate-800/90 hover:bg-black/35 border border-white/25 dark:border-slate-700 rounded-xl px-2.5 py-1.5 min-h-[44px] max-w-[105px] sm:max-w-[135px] shrink-0 transition-colors shadow-sm">
              <div className="flex items-center space-x-1 pointer-events-none min-w-0 pr-1">
                <Globe className="w-3.5 h-3.5 text-emerald-200 shrink-0" aria-hidden="true" />
                <span className="text-xs font-bold text-white truncate">
                  {getLanguageInfo(locale).nativeName}
                </span>
              </div>
              <span className="text-[10px] text-white/70 pointer-events-none shrink-0">▾</span>
              <select
                value={locale}
                onChange={(e) => setLocale(e.target.value as Locale)}
                className="absolute inset-0 w-full h-full opacity-0 cursor-pointer text-slate-900"
                aria-label="Select Application Language"
              >
                {SUPPORTED_LANGUAGES.map((lang) => (
                  <option
                    key={lang.code}
                    value={lang.code}
                    className="text-slate-900 bg-white dark:bg-slate-800 dark:text-white"
                  >
                    {lang.nativeName} ({lang.englishName})
                  </option>
                ))}
              </select>
            </div>

            {/* Pashu Seva AI / Veterinary Expert Chat Trigger */}
            <button
              onClick={() => setShowChatModal(true)}
              className="w-11 h-11 min-h-[44px] min-w-[44px] rounded-xl bg-black/20 hover:bg-black/30 dark:bg-slate-800 border border-emerald-400/40 dark:border-emerald-500/40 flex items-center justify-center text-white transition-all shrink-0 active:scale-95 shadow-inner"
              title="Pashu Seva AI (Veterinary Expert Chat)"
              aria-label="Pashu Seva AI Chat"
            >
              <Bot className="w-4 h-4 text-emerald-300" />
            </button>

            {/* Secondary Info / Status Icon Button */}
            <button
              onClick={() => setShowInfoModal(true)}
              className="w-11 h-11 min-h-[44px] min-w-[44px] rounded-xl bg-black/20 hover:bg-black/30 dark:bg-slate-800 border border-white/20 dark:border-slate-700 flex items-center justify-center text-white transition-all shrink-0 active:scale-95"
              title="System Information & Offline Sync"
              aria-label="App info and sync status"
            >
              <Info className="w-4 h-4 text-emerald-200" />
            </button>
          </div>
        </div>
      </header>

      {/* Secondary Info & Offline Status Modal (Keeps Header Clean) */}
      {showInfoModal && (
        <div
          className="fixed inset-0 bg-black/75 z-50 flex items-center justify-center p-4 animate-in fade-in duration-200"
          role="dialog"
          aria-modal="true"
          aria-labelledby="info-modal-title"
        >
          <div className="bg-[#FBF8F1] dark:bg-slate-900 border-2 border-[#DCD3BF] dark:border-slate-700 rounded-3xl p-5 w-full max-w-sm space-y-4 shadow-2xl text-[#1A1A1A] dark:text-white max-h-[85vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-[#DCD3BF] dark:border-slate-800 pb-3">
              <div className="flex items-center space-x-2">
                <span className="text-xl">🌾</span>
                <h3 id="info-modal-title" className="text-base font-black">System Info & Sync</h3>
              </div>
              <button
                onClick={() => setShowInfoModal(false)}
                className="w-11 h-11 min-h-[44px] min-w-[44px] rounded-xl text-slate-500 hover:text-slate-900 dark:hover:text-white flex items-center justify-center transition-colors"
                aria-label={t('common.close', locale)}
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Theme Switcher inside Modal */}
            <div className="bg-[#F3EEE1] dark:bg-slate-800 border border-[#DCD3BF] dark:border-slate-700 rounded-2xl p-3 space-y-2 text-xs">
              <div className="font-bold flex items-center justify-between">
                <span>Display Theme</span>
                <span className="text-[10px] font-extrabold uppercase px-2 py-0.5 rounded-full bg-black/10 dark:bg-white/10">
                  {theme === 'light' ? '☀️ Field (Day)' : '🌙 Night (Dark)'}
                </span>
              </div>
              <div className="grid grid-cols-2 gap-2 pt-1">
                <button
                  type="button"
                  onClick={() => {
                    setTheme('light');
                    localStorage.setItem('pashuposhan_theme', 'light');
                    document.documentElement.classList.remove('dark');
                    document.body.classList.remove('dark');
                  }}
                  className={`py-2 px-3 rounded-xl font-bold flex items-center justify-center space-x-1.5 transition-all min-h-[44px] ${
                    theme === 'light'
                      ? 'bg-[#1F5D3B] text-white shadow-md'
                      : 'bg-white dark:bg-slate-700 border border-[#DCD3BF] dark:border-slate-600 text-[#1A1A1A] dark:text-white'
                  }`}
                >
                  <Sun className="w-4 h-4 text-amber-300" />
                  <span>Field (Day)</span>
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setTheme('dark');
                    localStorage.setItem('pashuposhan_theme', 'dark');
                    document.documentElement.classList.add('dark');
                    document.body.classList.add('dark');
                  }}
                  className={`py-2 px-3 rounded-xl font-bold flex items-center justify-center space-x-1.5 transition-all min-h-[44px] ${
                    theme === 'dark'
                      ? 'bg-[#1F5D3B] text-white shadow-md'
                      : 'bg-white dark:bg-slate-700 border border-[#DCD3BF] dark:border-slate-600 text-[#1A1A1A] dark:text-white'
                  }`}
                >
                  <Moon className="w-4 h-4 text-amber-200" />
                  <span>Night (Dark)</span>
                </button>
              </div>
            </div>

            {/* Hackathon Badge */}
            <div className="bg-[#F3EEE1] dark:bg-slate-800 border border-[#DCD3BF] dark:border-slate-700 rounded-2xl p-3 space-y-1 text-xs">
              <div className="flex items-center justify-between">
                <span className="font-bold text-[#1F5D3B] dark:text-emerald-400 uppercase tracking-wide text-[10px]">
                  Smart India Hackathon 2026
                </span>
                <span className="text-[9px] font-extrabold px-2 py-0.5 rounded-full bg-[#1F5D3B] text-white">
                  PS 26111
                </span>
              </div>
              <p className="text-[11px] text-slate-600 dark:text-slate-300 leading-snug">
                Ministry of Fisheries, Animal Husbandry & Dairying (DAHD). AI Rapid Silage & Feed Quality System.
              </p>
            </div>

            {/* Offline Local Queue Status */}
            <div className="bg-[#F3EEE1] dark:bg-slate-800 border border-[#DCD3BF] dark:border-slate-700 rounded-2xl p-3 space-y-2 text-xs">
              <div className="flex items-center justify-between font-bold">
                <span className="flex items-center space-x-1.5">
                  <Layers className="w-4 h-4 text-[#1F5D3B] dark:text-emerald-400" />
                  <span>Offline Storage Queue</span>
                </span>
                <span
                  className={`px-2 py-0.5 rounded-full text-[10px] font-extrabold ${
                    pendingCount > 0 ? 'bg-amber-100 text-amber-900' : 'bg-emerald-100 text-emerald-900'
                  }`}
                >
                  {pendingCount} records
                </span>
              </div>
              <p className="text-[11px] text-slate-600 dark:text-slate-300 leading-relaxed">
                All scans, animal ration records, and alerts are safely saved on this device. When cloud API integration is active, they sync automatically.
              </p>
              {pendingCount > 0 && (
                <div className="space-y-1.5 pt-1">
                  <button
                    type="button"
                    disabled={isSyncing}
                    onClick={handleManualSync}
                    className="w-full py-2.5 px-3 bg-[#1F5D3B] hover:bg-[#194a30] text-white text-xs font-black rounded-xl shadow-sm flex items-center justify-center space-x-1.5 transition-all min-h-[44px] disabled:opacity-50"
                  >
                    <RefreshCw className={`w-3.5 h-3.5 ${isSyncing ? 'animate-spin' : ''}`} />
                    <span>{isSyncing ? 'Syncing...' : 'Sync Now (अभी सिंक करें)'}</span>
                  </button>

                  <button
                    onClick={handleClearQueue}
                    className="w-full py-2.5 px-3 bg-rose-100 hover:bg-rose-200 dark:bg-rose-950 dark:hover:bg-rose-900 text-[#B3261E] dark:text-rose-200 text-xs font-bold rounded-xl border border-rose-300 dark:border-rose-800 flex items-center justify-center space-x-1.5 transition-all min-h-[44px]"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                    <span>Clear Local Queue</span>
                  </button>
                </div>
              )}
            </div>

            {/* PWA Install Button */}
            <button
              onClick={handleInstallClick}
              className="w-full py-3.5 px-4 bg-[#1F5D3B] hover:bg-[#194a30] text-white font-extrabold text-sm rounded-2xl shadow-lg flex items-center justify-center space-x-2 transition-all min-h-[52px]"
            >
              <DownloadCloud className="w-5 h-5 text-emerald-200" />
              <span>Install App to Home Screen</span>
            </button>
          </div>
        </div>
      )}

      {/* Pashu Seva AI Veterinary Chat Modal */}
      <VeterinaryChatModal
        isOpen={showChatModal}
        onClose={() => setShowChatModal(false)}
        locale={locale}
      />

      {/* In-app Notice / Confirm Modal */}
      {headerNotice && (
        <div
          className="fixed inset-0 bg-black/75 z-50 flex items-center justify-center p-4 animate-in fade-in duration-200"
          role="dialog"
          aria-modal="true"
        >
          <div className="bg-[#FBF8F1] dark:bg-slate-900 border-2 border-[#DCD3BF] dark:border-slate-700 rounded-3xl p-5 w-full max-w-sm space-y-4 shadow-2xl text-[#1A1A1A] dark:text-white">
            <div className="flex items-center justify-between border-b border-[#DCD3BF] dark:border-slate-800 pb-2.5">
              <h3 className="text-sm font-black flex items-center space-x-2">
                <AlertTriangle className="w-5 h-5 text-amber-500 shrink-0" />
                <span>{headerNotice.title || 'Notice'}</span>
              </h3>
              <button
                onClick={() => setHeaderNotice(null)}
                className="w-11 h-11 min-h-[44px] min-w-[44px] rounded-full text-slate-500 hover:text-slate-900 dark:hover:text-white flex items-center justify-center transition-colors"
                aria-label={t('common.close', locale)}
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <p className="text-xs text-slate-700 dark:text-slate-200 whitespace-pre-line leading-relaxed">
              {headerNotice.message}
            </p>
            <div className="flex space-x-2 pt-1">
              {headerNotice.isConfirm && (
                <button
                  type="button"
                  onClick={() => setHeaderNotice(null)}
                  className="flex-1 py-3 border-2 border-[#DCD3BF] dark:border-slate-700 rounded-2xl font-bold text-xs min-h-[48px] text-[#1A1A1A] dark:text-white"
                >
                  {headerNotice.cancelLabel || t('common.cancel', locale)}
                </button>
              )}
              <button
                type="button"
                onClick={() => {
                  if (headerNotice.onConfirm) headerNotice.onConfirm();
                  setHeaderNotice(null);
                }}
                className={`flex-1 py-3 text-white font-black text-xs rounded-2xl shadow-lg min-h-[48px] transition-all ${
                  headerNotice.isConfirm
                    ? 'bg-rose-600 hover:bg-rose-700'
                    : 'bg-[#1F5D3B] hover:bg-[#194a30]'
                }`}
              >
                {headerNotice.isConfirm ? (headerNotice.confirmLabel || t('common.confirm', locale)) : t('common.understood', locale)}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};
