import React, { useState, useEffect } from 'react';
import { Locale, CommunityFeedAlert } from '../lib/types';
import { t } from '../lib/i18n';
import { getLocalAlerts, saveLocalAlert } from '../lib/storage';
import { AlertTriangle, ShieldCheck, MapPin, Send, QrCode, CheckCircle2, Clock, Plus, X } from 'lucide-react';

interface AlertsScreenProps {
  locale: Locale;
}

export const AlertsScreen: React.FC<AlertsScreenProps> = ({ locale }) => {
  const [alerts, setAlerts] = useState<CommunityFeedAlert[]>([]);
  const [showReportModal, setShowReportModal] = useState(false);
  const [batchNo, setBatchNo] = useState('');
  const [brand, setBrand] = useState('');
  const [issue, setIssue] = useState('');
  const [submitted, setSubmitted] = useState(false);

  useEffect(() => {
    setAlerts(getLocalAlerts());
  }, []);

  const handleSubmitReport = (e: React.FormEvent) => {
    e.preventDefault();
    if (!batchNo || !brand) return;

    const newAlert: CommunityFeedAlert = {
      id: `alert_${Date.now()}`,
      title: `Suspected Adulteration: ${brand}`,
      taluka: 'Baramati / Indapur',
      district: 'Pune District',
      date: 'Just now',
      alertType: 'adulterated_batch',
      severity: 'high',
      brandOrCrop: `${brand} (Batch #${batchNo})`,
      description: issue || 'Farmer reported abnormal physical consistency, sharp chemical odor, and refusal by herd.',
      reportedBy: 'Local Dairy Farmer (PashuPoshan App)',
      verifiedByCoop: false,
      syncPending: true,
    };

    const updated = saveLocalAlert(newAlert);
    setAlerts(updated);
    setSubmitted(true);
    setTimeout(() => {
      setSubmitted(false);
      setShowReportModal(false);
      setBatchNo('');
      setBrand('');
      setIssue('');
    }, 1400);
  };

  return (
    <div className="p-4 space-y-4 pb-28 print:hidden">
      {/* Title */}
      <div className="bg-slate-800/90 border border-slate-700 rounded-2xl p-3.5 shadow-md flex items-center justify-between">
        <div>
          <div className="flex items-center space-x-2">
            <div className="w-7 h-7 rounded-lg bg-rose-500/20 text-rose-400 flex items-center justify-center">
              <AlertTriangle className="w-4 h-4" />
            </div>
            <h2 className="text-sm font-bold text-white">
              {t('alert.title', locale)}
            </h2>
          </div>
          <p className="text-[11px] text-slate-300 mt-0.5">
            {t('alert.subtitle', locale)}
          </p>
        </div>

        <button
          onClick={() => setShowReportModal(true)}
          className="px-2.5 py-1.5 bg-rose-600 hover:bg-rose-500 text-white font-bold text-xs rounded-xl shadow active:scale-98 transition-all shrink-0 flex items-center space-x-1"
        >
          <Plus className="w-3.5 h-3.5" />
          <span>{t('alert.reportBatch', locale)}</span>
        </button>
      </div>

      {/* Feed Authenticity QR Scanner Banner */}
      <div className="bg-gradient-to-r from-emerald-950 to-teal-950 border border-emerald-500/40 rounded-2xl p-3 flex items-center justify-between">
        <div className="flex items-center space-x-2.5">
          <div className="w-10 h-10 rounded-xl bg-emerald-500/20 border border-emerald-400/40 flex items-center justify-center text-emerald-300">
            <QrCode className="w-5 h-5" />
          </div>
          <div>
            <div className="text-xs font-bold text-white">{t('alert.qrTitle', locale)}</div>
            <div className="text-[10px] text-slate-300">{t('alert.qrSubtitle', locale)}</div>
          </div>
        </div>
        <button
          onClick={() => alert('Scanning BIS QR Code on Cattle Feed Bag... License: BIS/CM/L-7819202 (Compliant Type II Compound Feed). Valid up to 12/2026.')}
          className="px-2.5 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-[11px] rounded-lg shadow whitespace-nowrap"
        >
          {t('alert.qrVerifyBtn', locale)}
        </button>
      </div>

      {/* Alerts Feed */}
      <div className="space-y-3">
        {alerts.map((alert) => {
          const isHigh = alert.severity === 'high';
          return (
            <div
              key={alert.id}
              className={`rounded-2xl p-3.5 border shadow-md ${
                isHigh ? 'bg-slate-800/90 border-rose-500/50' : 'bg-slate-800/90 border-slate-700'
              }`}
            >
              <div className="flex items-center justify-between mb-1">
                <span className={`text-[9px] font-bold px-2 py-0.5 rounded-full border ${
                  isHigh ? 'bg-rose-950 text-rose-300 border-rose-400' : 'bg-slate-900 text-slate-300 border-slate-700'
                }`}>
                  {alert.alertType.replace('_', ' ').toUpperCase()}
                </span>
                <span className="text-[10px] text-slate-400 flex items-center space-x-1">
                  <Clock className="w-3 h-3" />
                  <span>{alert.date}</span>
                </span>
              </div>

              <h3 className="text-xs font-bold text-white mt-1">{alert.title}</h3>
              <p className="text-[11px] font-semibold text-amber-300 mt-0.5">{alert.brandOrCrop}</p>
              <p className="text-[11px] text-slate-300 mt-1.5 leading-relaxed">{alert.description}</p>

              <div className="mt-2.5 pt-2 border-t border-slate-700/60 flex items-center justify-between text-[10px] text-slate-400">
                <span className="flex items-center space-x-1">
                  <MapPin className="w-3 h-3 text-emerald-400" />
                  <span>{alert.taluka}, {alert.district}</span>
                </span>
                {alert.verifiedByCoop ? (
                  <span className="text-emerald-400 font-bold flex items-center space-x-0.5">
                    <ShieldCheck className="w-3 h-3" />
                    <span>{t('alert.verified', locale)}</span>
                  </span>
                ) : (
                  <span className="text-amber-400 font-semibold italic">Pending Union Verification</span>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Report Modal */}
      {showReportModal && (
        <div className="fixed inset-0 bg-black/75 z-50 flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-700 rounded-2xl p-4 w-full max-w-sm space-y-3 shadow-2xl">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-bold text-white">Report Suspicious Feed Batch</h3>
              <button onClick={() => setShowReportModal(false)} className="text-slate-400 hover:text-white">
                <X className="w-4 h-4" />
              </button>
            </div>
            <p className="text-xs text-slate-300">
              Submit details to alert dairy cooperative members and livestock officers in your taluka.
            </p>

            {submitted ? (
              <div className="py-6 text-center text-emerald-400 space-y-2">
                <CheckCircle2 className="w-10 h-10 mx-auto animate-bounce" />
                <div className="text-xs font-bold">Report Filed Successfully!</div>
                <div className="text-[10px] text-slate-300">Saved locally and queued for Cooperative Sync</div>
              </div>
            ) : (
              <form onSubmit={handleSubmitReport} className="space-y-2.5 text-xs">
                <div>
                  <label className="text-slate-300 font-semibold block mb-1">Feed Brand / Supplier:</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Kisan Super Pellets"
                    value={brand}
                    onChange={(e) => setBrand(e.target.value)}
                    className="w-full bg-slate-800 border border-slate-700 rounded-lg p-2 text-white focus:outline-none focus:border-emerald-500"
                  />
                </div>

                <div>
                  <label className="text-slate-300 font-semibold block mb-1">Batch Number:</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. BATCH-8891"
                    value={batchNo}
                    onChange={(e) => setBatchNo(e.target.value)}
                    className="w-full bg-slate-800 border border-slate-700 rounded-lg p-2 text-white focus:outline-none focus:border-emerald-500"
                  />
                </div>

                <div>
                  <label className="text-slate-300 font-semibold block mb-1">Observed Issue / Adulteration:</label>
                  <textarea
                    rows={2}
                    placeholder="e.g. Heavy sand settling in trough, ammoniacal odor, cows refusing feed."
                    value={issue}
                    onChange={(e) => setIssue(e.target.value)}
                    className="w-full bg-slate-800 border border-slate-700 rounded-lg p-2 text-white focus:outline-none focus:border-emerald-500"
                  />
                </div>

                <div className="flex space-x-2 pt-2">
                  <button
                    type="button"
                    onClick={() => setShowReportModal(false)}
                    className="flex-1 py-2 bg-slate-800 text-slate-300 font-bold rounded-lg"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="flex-1 py-2 bg-rose-600 text-white font-bold rounded-lg shadow"
                  >
                    Submit Alert
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
