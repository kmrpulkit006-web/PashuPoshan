import React, { useEffect } from 'react';
import { QrCode, X, ShieldCheck, RefreshCw } from 'lucide-react';
import { Locale } from '../../lib/types';
import { t } from '../../lib/i18n';

interface QrScannerModalProps {
  showQrScanner: boolean;
  qrVerifiedData: string | null;
  onClose: () => void;
  locale: Locale;
}

export const QrScannerModal: React.FC<QrScannerModalProps> = ({
  showQrScanner,
  qrVerifiedData,
  onClose,
  locale,
}) => {
  useEffect(() => {
    if (!showQrScanner) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [showQrScanner, onClose]);

  if (!showQrScanner) return null;

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="qr-modal-title"
      className="fixed inset-0 bg-black/75 z-50 flex items-center justify-center p-4 animate-fade-in"
      onClick={onClose}
    >
      <div
        className="bg-[#FBF8F1] dark:bg-slate-900 border-2 border-[#DCD3BF] dark:border-slate-700 rounded-3xl p-5 w-full max-w-sm space-y-4 shadow-2xl text-[#1A1A1A] dark:text-white max-h-[85vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between border-b border-[#DCD3BF] dark:border-slate-800 pb-2.5">
          <h3 id="qr-modal-title" className="text-sm font-black flex items-center space-x-2">
            <QrCode className="w-5 h-5 text-[#1F5D3B] dark:text-emerald-400" />
            <span>{t('qr.modalTitle', locale)}</span>
          </h3>
          <button
            type="button"
            onClick={onClose}
            className="text-slate-500 hover:text-slate-900 dark:hover:text-white w-11 h-11 min-h-[44px] min-w-[44px] flex items-center justify-center rounded-2xl hover:bg-black/5 dark:hover:bg-white/10"
            aria-label={t('common.close', locale)}
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="aspect-video bg-black rounded-2xl border-2 border-dashed border-[#1F5D3B] flex items-center justify-center text-center p-4">
          {qrVerifiedData ? (
            <div className="text-emerald-300 space-y-1.5">
              <ShieldCheck className="w-9 h-9 mx-auto text-emerald-400 animate-bounce" />
              <div className="text-xs font-black text-emerald-300">{t('qr.verified', locale)}</div>
              <div className="text-[11px] text-slate-200 leading-tight">{qrVerifiedData}</div>
            </div>
          ) : (
            <div className="space-y-2">
              <RefreshCw className="w-7 h-7 text-emerald-400 animate-spin mx-auto" />
              <p className="text-xs text-slate-300 font-bold">{t('qr.scanning', locale)}</p>
            </div>
          )}
        </div>

        <button
          type="button"
          onClick={onClose}
          className="w-full py-3.5 bg-[#1F5D3B] hover:bg-[#194a30] text-white font-black text-sm rounded-2xl shadow-lg min-h-[52px] transition-all"
        >
          {t('common.done', locale)}
        </button>
      </div>
    </div>
  );
};
