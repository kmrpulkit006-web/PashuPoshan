import React from 'react';
import { QrCode, X, ShieldCheck, RefreshCw } from 'lucide-react';

interface QrScannerModalProps {
  showQrScanner: boolean;
  qrVerifiedData: string | null;
  onClose: () => void;
}

export const QrScannerModal: React.FC<QrScannerModalProps> = ({
  showQrScanner,
  qrVerifiedData,
  onClose,
}) => {
  if (!showQrScanner) return null;

  return (
    <div className="fixed inset-0 bg-black/75 z-50 flex items-center justify-center p-4">
      <div className="bg-[#FBF8F1] dark:bg-slate-900 border-2 border-[#DCD3BF] dark:border-slate-700 rounded-3xl p-5 w-full max-w-sm space-y-4 shadow-2xl text-[#1A1A1A] dark:text-white max-h-[85vh] overflow-y-auto">
        <div className="flex items-center justify-between border-b border-[#DCD3BF] dark:border-slate-800 pb-2.5">
          <h3 className="text-sm font-black flex items-center space-x-2">
            <QrCode className="w-5 h-5 text-[#1F5D3B] dark:text-emerald-400" />
            <span>Feed Bag QR Verification</span>
          </h3>
          <button
            onClick={onClose}
            className="text-slate-500 hover:text-slate-900 dark:hover:text-white p-1"
            aria-label="Close QR scanner"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="aspect-video bg-black rounded-2xl border-2 border-dashed border-[#1F5D3B] flex items-center justify-center text-center p-4">
          {qrVerifiedData ? (
            <div className="text-emerald-300 space-y-1.5">
              <ShieldCheck className="w-9 h-9 mx-auto text-emerald-400 animate-bounce" />
              <div className="text-xs font-black text-emerald-300">BIS License Verified</div>
              <div className="text-[11px] text-slate-200 leading-tight">{qrVerifiedData}</div>
            </div>
          ) : (
            <div className="space-y-2">
              <RefreshCw className="w-7 h-7 text-emerald-400 animate-spin mx-auto" />
              <p className="text-xs text-slate-300 font-bold">Scanning BIS QR Barcode...</p>
            </div>
          )}
        </div>

        <button
          onClick={onClose}
          className="w-full py-3.5 bg-[#1F5D3B] hover:bg-[#194a30] text-white font-black text-sm rounded-2xl shadow-lg min-h-[52px] transition-all"
        >
          Done (पूर्ण)
        </button>
      </div>
    </div>
  );
};
