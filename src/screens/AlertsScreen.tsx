import React, { useState, useEffect } from 'react';
import { Locale, CommunityFeedAlert } from '../lib/types';
import { t } from '../lib/i18n';
import {
  getLocalAlerts,
  saveLocalAlert,
  getPendingOfflineScans,
  syncPendingScans,
  PendingOfflineScan,
  fetchRemoteAlerts,
  postRemoteAlert,
  queueOfflineAlert,
  syncPendingAlerts,
} from '../lib/storage';
import { AlertTriangle, ShieldCheck, MapPin, Send, QrCode, CheckCircle2, Clock, Plus, X, RefreshCw, Cloud, Layers } from 'lucide-react';

interface AlertsScreenProps {
  locale: Locale;
}

export const AlertsScreen: React.FC<AlertsScreenProps> = ({ locale }) => {
  const [alerts, setAlerts] = useState<CommunityFeedAlert[]>([]);
  const [showReportModal, setShowReportModal] = useState(false);
  const [batchNo, setBatchNo] = useState('');
  const [brand, setBrand] = useState('');
  const [district, setDistrict] = useState('Pune District');
  const [taluka, setTaluka] = useState('Baramati');
  const [issue, setIssue] = useState('');
  const [submitted, setSubmitted] = useState(false);
  const [submitStatus, setSubmitStatus] = useState<'online' | 'offline'>('online');
  const [pendingScans, setPendingScans] = useState<PendingOfflineScan[]>([]);
  const [isSyncing, setIsSyncing] = useState(false);
  const [syncStatusMsg, setSyncStatusMsg] = useState<string>('');

  const refreshPending = () => {
    setPendingScans(getPendingOfflineScans());
  };

  useEffect(() => {
    // 1. Show immediate local cache
    setAlerts(getLocalAlerts());
    refreshPending();

    // 2. Fetch live remote crowd-sourced alerts
    fetchRemoteAlerts()
      .then((remoteAlerts) => {
        setAlerts(remoteAlerts);
      })
      .catch((err) => {
        console.warn('Could not fetch remote alerts on mount:', err);
      });

    // 3. Sync any queued offline alerts if online
    if (typeof navigator !== 'undefined' && navigator.onLine) {
      syncPendingAlerts().catch(() => {});
    }

    const handleSyncChange = () => refreshPending();
    const handleAlertsChange = () => setAlerts(getLocalAlerts());
    const handleOnline = () => {
      syncPendingAlerts()
        .then(() => fetchRemoteAlerts().then(setAlerts))
        .catch(() => {});
    };

    window.addEventListener('pashuposhan_pending_sync_changed', handleSyncChange);
    window.addEventListener('pashuposhan_pending_alerts_changed', handleAlertsChange);
    window.addEventListener('online', handleOnline);

    return () => {
      window.removeEventListener('pashuposhan_pending_sync_changed', handleSyncChange);
      window.removeEventListener('pashuposhan_pending_alerts_changed', handleAlertsChange);
      window.removeEventListener('online', handleOnline);
    };
  }, []);

  const handleManualSync = async () => {
    if (typeof navigator !== 'undefined' && !navigator.onLine) {
      alert('You are currently offline. Please connect to Wi-Fi or mobile cellular data to sync pending scans.');
      return;
    }

    setIsSyncing(true);
    setSyncStatusMsg('Connecting to AI Vision Triage service...');

    try {
      const { successful, failed } = await syncPendingScans((current, total) => {
        setSyncStatusMsg(`Syncing scan ${current} of ${total}...`);
      });

      // Also sync queued alerts
      await syncPendingAlerts();
      const updatedAlerts = await fetchRemoteAlerts();
      setAlerts(updatedAlerts);

      refreshPending();
      setIsSyncing(false);
      if (successful > 0) {
        alert(`Sync Complete (सिंक संपन्न): Successfully processed ${successful} offline scan(s).`);
      } else if (failed > 0) {
        alert(`Sync notice: ${failed} scan(s) could not be synchronized. Please check network connection.`);
      }
    } catch (err: any) {
      setIsSyncing(false);
      alert('Sync failed: ' + (err.message || 'Network error'));
    }
  };

  const handleSubmitReport = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!batchNo || !brand) return;

    const newAlert: CommunityFeedAlert = {
      id: `alert_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
      title: `Suspected Adulteration: ${brand}`,
      taluka: taluka.trim() || 'Baramati / Indapur',
      district: district.trim() || 'Pune District',
      date: 'Just now',
      alertType: 'adulterated_batch',
      severity: 'high',
      brandOrCrop: `${brand} (Batch #${batchNo})`,
      feedType: 'Compound Cattle Feed',
      contaminant: 'Suspected Adulterant / Abnormal Residue',
      description: issue || 'Farmer reported abnormal physical consistency, sharp chemical odor, and refusal by herd.',
      advisory: 'Isolate batch and arrange certified laboratory analysis.',
      reportedBy: 'Local Dairy Farmer (PashuPoshan Crowd Radar)',
      verifiedByCoop: false,
      syncPending: false,
    };

    try {
      if (typeof navigator !== 'undefined' && !navigator.onLine) {
        throw new Error('Offline');
      }
      const posted = await postRemoteAlert(newAlert);
      const updated = saveLocalAlert(posted || newAlert);
      setAlerts(updated);
      setSubmitStatus('online');
    } catch {
      // Offline fallback: queue offline
      queueOfflineAlert(newAlert);
      setAlerts(getLocalAlerts());
      setSubmitStatus('offline');
    }

    setSubmitted(true);
    setTimeout(() => {
      setSubmitted(false);
      setShowReportModal(false);
      setBatchNo('');
      setBrand('');
      setIssue('');
    }, 1800);
  };

  const handleSimulateQrVerification = () => {
    alert(
      'DEMO SIMULATION:\n\n' +
      'Simulated BIS / NDDB Feed Bag QR Scan.\n\n' +
      'License: BIS/CM/L-7819202 (Compliant Type II Compound Cattle Feed).\n' +
      'Manufacturer: Anand Regional Cooperative Milk Producers Union.\n' +
      'Validity: Up to 12/2026.\n\n' +
      '(Note: In production, this directly queries the BIS Manakonline verification portal).'
    );
  };

  return (
    <div className="p-4 space-y-4 pb-28 print:hidden">
      {/* Offline Pending Scans Sync Manager Card */}
      {pendingScans.length > 0 && (
        <div className="bg-[#fdf8f4] dark:bg-amber-950/70 border-2 border-[#C2703D] dark:border-amber-500 rounded-2xl p-4 shadow-md space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <div className="w-8 h-8 rounded-xl bg-amber-200 dark:bg-amber-500/20 text-[#C2703D] dark:text-amber-400 flex items-center justify-center font-black">
                <Cloud className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-xs sm:text-sm font-black text-[#1A1A1A] dark:text-white">
                  Offline Scans Pending Sync ({pendingScans.length})
                </h3>
                <span className="text-[10px] text-[#5A5243] dark:text-amber-200 block">
                  ऑफ़लाइन स्कैन अपलोड कतार
                </span>
              </div>
            </div>
            <span className="text-[10px] font-black px-2 py-0.5 rounded-full bg-[#C2703D] text-white animate-pulse">
              Waiting for network
            </span>
          </div>

          <div className="space-y-1.5 max-h-36 overflow-y-auto">
            {pendingScans.map((scan) => (
              <div
                key={scan.id}
                className="flex items-center justify-between p-2 rounded-xl bg-white/80 dark:bg-slate-900 border border-[#DCD3BF] dark:border-slate-800 text-xs"
              >
                <div className="flex items-center space-x-2 min-w-0">
                  <span className="text-base shrink-0">
                    {scan.category === 'silage' ? '🌾' : '🌽'}
                  </span>
                  <div className="min-w-0">
                    <span className="font-bold capitalize truncate block text-[#1A1A1A] dark:text-white">
                      {scan.category.replace('_', ' ')}
                    </span>
                    <span className="text-[9px] text-[#5A5243] dark:text-slate-400">
                      {new Date(scan.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </span>
                  </div>
                </div>
                <span className="text-[10px] font-bold text-[#C2703D] dark:text-amber-400">
                  Ready to sync
                </span>
              </div>
            ))}
          </div>

          <button
            type="button"
            disabled={isSyncing}
            onClick={handleManualSync}
            className="w-full py-3 px-4 bg-[#1F5D3B] hover:bg-[#194a30] text-white font-black text-xs sm:text-sm rounded-xl shadow-md active:scale-98 transition-all flex items-center justify-center space-x-2 min-h-[56px] disabled:opacity-50"
          >
            <RefreshCw className={`w-4 h-4 ${isSyncing ? 'animate-spin' : ''}`} />
            <span>{isSyncing ? syncStatusMsg : 'Sync Now (अभी सिंक करें)'}</span>
          </button>
        </div>
      )}

      {/* Title */}
      <div className="bg-field-surface dark:bg-slate-900 border border-field-border dark:border-slate-800 rounded-2xl p-4 shadow-sm space-y-3">
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-start space-x-3">
            <div className="w-10 h-10 rounded-xl bg-danger-500/15 text-danger-700 dark:text-danger-400 flex items-center justify-center shrink-0 mt-0.5">
              <AlertTriangle className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-field-text dark:text-white">
                {t('alert.title', locale)}
              </h2>
              <p className="text-xs text-field-text/70 dark:text-slate-300 mt-0.5">
                {t('alert.subtitle', locale)}
              </p>
            </div>
          </div>
        </div>

        <button
          onClick={() => setShowReportModal(true)}
          className="w-full py-3 px-4 bg-danger-600 hover:bg-danger-700 text-white font-bold text-sm rounded-xl shadow-sm active:scale-98 transition-all flex items-center justify-center space-x-2 min-h-[56px]"
        >
          <Plus className="w-5 h-5" />
          <span>{t('alert.reportBatch', locale)}</span>
        </button>
      </div>

      {/* Feed Authenticity QR Scanner Banner */}
      <div className="bg-gradient-to-r from-brand-50 to-emerald-50 dark:from-emerald-950/60 dark:to-teal-950/60 border border-brand-300 dark:border-emerald-500/40 rounded-2xl p-4 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex items-center space-x-3">
          <div className="w-12 h-12 rounded-xl bg-brand-500/15 dark:bg-emerald-500/20 border border-brand-500/30 dark:border-emerald-400/40 flex items-center justify-center text-brand-700 dark:text-emerald-300 shrink-0">
            <QrCode className="w-6 h-6" />
          </div>
          <div>
            <div className="text-sm font-bold text-field-text dark:text-white">{t('alert.qrTitle', locale)}</div>
            <div className="text-xs text-field-text/70 dark:text-slate-300">{t('alert.qrSubtitle', locale)} (Demo)</div>
          </div>
        </div>
        <button
          onClick={handleSimulateQrVerification}
          className="w-full sm:w-auto px-4 py-3 bg-brand-600 hover:bg-brand-700 text-white font-bold text-sm rounded-xl shadow-sm whitespace-nowrap min-h-[56px] flex items-center justify-center"
        >
          {t('alert.qrVerifyBtn', locale)} (Demo)
        </button>
      </div>

      {/* Alerts Feed */}
      <div className="space-y-4">
        {alerts.map((alert) => {
          const isHigh = alert.severity === 'high';

          // Plain-Language Summary & Themed Styling Derivation
          const alertConfig = (() => {
            switch (alert.alertType) {
              case 'adulterated_batch':
                return {
                  plainHeadline:
                    locale === 'hi'
                      ? 'आसपास खराब / मिलावटी आहार की सूचना'
                      : locale === 'mr'
                      ? 'जवळपास भेसळयुक्त खाद्याची तक्रार'
                      : locale === 'gu'
                      ? 'નજીકમાં ભેળસેળવાળા ખાણની ચેતવણી'
                      : locale === 'pa'
                      ? 'ਨੇੜੇ ਖ਼ਰਾਬ ਫੀਡ ਬੈਚ ਦੀ ਚੇਤਾਵਨੀ'
                      : 'Bad feed batch reported nearby',
                  tag: 'Adulteration Hazard',
                  badgeClass: 'bg-[#B3261E] text-white border-red-400',
                  iconContainer: 'bg-[#FDECEA] dark:bg-rose-950/60 border-2 border-[#B3261E]/40 text-[#B3261E] dark:text-rose-400',
                  cardBorder: 'border-2 border-[#B3261E]/40 dark:border-rose-500/40',
                  cardBg: 'bg-white dark:bg-slate-800',
                  icon: <AlertTriangle className="w-6 h-6 shrink-0" />,
                };
              case 'aflatoxin_surge':
                return {
                  plainHeadline:
                    locale === 'hi'
                      ? 'भंडारित चारे में फफूंद व जहर का खतरा'
                      : locale === 'mr'
                      ? 'साठवलेल्या चाऱ्यात बुरशीचा धोका'
                      : locale === 'gu'
                      ? 'સંગ્રહિત ઘાસચારામાં ફૂગનો ખતરો'
                      : locale === 'pa'
                      ? 'ਸਟੋਰ ਕੀਤੇ ਚਾਰੇ ਵਿੱਚ ਉੱਲੀ ਦਾ ਖ਼ਤਰਾ'
                      : 'High mold & fungus risk in stored fodder',
                  tag: 'Toxin / Mold Warning',
                  badgeClass: 'bg-[#C2703D] text-white border-amber-400',
                  iconContainer: 'bg-[#fdf8f4] dark:bg-amber-950/60 border-2 border-[#C2703D]/40 text-[#C2703D] dark:text-amber-400',
                  cardBorder: 'border-2 border-[#C2703D]/40 dark:border-amber-500/40',
                  cardBg: 'bg-white dark:bg-slate-800',
                  icon: <AlertTriangle className="w-6 h-6 shrink-0" />,
                };
              case 'fodder_scarcity':
                return {
                  plainHeadline:
                    locale === 'hi'
                      ? 'सस्ते सहकारी चारे व साइलेज की उपलब्धता'
                      : locale === 'mr'
                      ? 'सवलतीच्या दरात सायलेज डेपो सुरू'
                      : locale === 'gu'
                      ? 'સબસિડીવાળા ઘાસચારા/સાયલેજનો ડેપો શરૂ'
                      : locale === 'pa'
                      ? 'ਸਬਸਿਡੀ ਵਾਲੇ ਚਾਰੇ ਦਾ ਡੀਪੂ ਖੁੱਲ੍ਹਿਆ'
                      : 'Subsidized fodder & silage depot open',
                  tag: 'Co-op Fodder Depot',
                  badgeClass: 'bg-[#1F5D3B] text-white border-emerald-400',
                  iconContainer: 'bg-[#edf7f0] dark:bg-emerald-950/60 border-2 border-[#1F5D3B]/40 text-[#1F5D3B] dark:text-emerald-400',
                  cardBorder: 'border-2 border-[#1F5D3B]/40 dark:border-emerald-500/40',
                  cardBg: 'bg-white dark:bg-slate-800',
                  icon: <ShieldCheck className="w-6 h-6 shrink-0" />,
                };
              default:
                return {
                  plainHeadline:
                    locale === 'hi'
                      ? 'पशु आहार की बाजार कीमतों में बदलाव'
                      : 'Market feed price alert',
                  tag: 'Market Price Notice',
                  badgeClass: 'bg-[#C2703D] text-white border-amber-400',
                  iconContainer: 'bg-[#fdf8f4] dark:bg-amber-950/60 border-2 border-[#C2703D]/40 text-[#C2703D] dark:text-amber-400',
                  cardBorder: 'border-2 border-[#DCD3BF] dark:border-slate-700',
                  cardBg: 'bg-white dark:bg-slate-800',
                  icon: <Clock className="w-6 h-6 shrink-0" />,
                };
            }
          })();

          return (
            <div
              key={alert.id}
              className={`${alertConfig.cardBg} ${alertConfig.cardBorder} rounded-3xl p-4 sm:p-5 shadow-sm space-y-3.5`}
            >
              {/* 1. Large Leading Icon + One-Line Plain Summary */}
              <div className="flex items-start space-x-3.5">
                <div
                  className={`w-12 h-12 sm:w-14 sm:h-14 rounded-2xl flex items-center justify-center shrink-0 shadow-xs ${alertConfig.iconContainer}`}
                >
                  {alertConfig.icon}
                </div>

                <div className="min-w-0 flex-1">
                  <div className="flex items-center justify-between gap-2 mb-1">
                    <span
                      className={`text-[10px] font-black uppercase px-2.5 py-0.5 rounded-full border tracking-wide shadow-xs ${alertConfig.badgeClass}`}
                    >
                      {alertConfig.tag}
                    </span>
                    <span className="text-xs text-[#5A5243] dark:text-slate-400 font-bold flex items-center space-x-1 shrink-0">
                      <Clock className="w-3.5 h-3.5" />
                      <span>{alert.date}</span>
                    </span>
                  </div>

                  <h3 className="text-base sm:text-lg font-black text-[#1A1A1A] dark:text-white leading-tight">
                    {alertConfig.plainHeadline}
                  </h3>
                </div>
              </div>

              {/* Farmer-Friendly Advisory Explanation */}
              <p className="text-xs sm:text-sm text-[#1A1A1A] dark:text-slate-200 font-medium leading-relaxed pl-0.5">
                {alert.description}
              </p>

              {/* 2. Subordinate Technical, Batch & Location Metadata */}
              <div className="bg-[#F3EEE1] dark:bg-slate-900/80 rounded-2xl p-3 border border-[#DCD3BF] dark:border-slate-700 space-y-2 text-xs">
                <div className="flex flex-wrap items-center justify-between gap-1.5 border-b border-[#DCD3BF]/60 dark:border-slate-800 pb-2">
                  <span className="font-black text-[#1A1A1A] dark:text-slate-200">
                    Sample / Batch:
                  </span>
                  <span className="font-bold text-[#C2703D] dark:text-amber-400 bg-white/80 dark:bg-slate-800 px-2 py-0.5 rounded-lg border border-[#DCD3BF] dark:border-slate-700">
                    {alert.brandOrCrop}
                  </span>
                </div>

                <div className="flex items-center justify-between pt-0.5 text-xs text-[#5A5243] dark:text-slate-400">
                  <span className="flex items-center space-x-1.5 font-bold">
                    <MapPin className="w-3.5 h-3.5 text-[#1F5D3B] dark:text-emerald-400 shrink-0" />
                    <span>{alert.taluka}, {alert.district}</span>
                  </span>

                  {alert.verifiedByCoop ? (
                    <span className="text-[#1F5D3B] dark:text-emerald-400 font-black flex items-center space-x-1">
                      <ShieldCheck className="w-4 h-4" />
                      <span>{t('alert.verified', locale)}</span>
                    </span>
                  ) : alert.syncPending ? (
                    <span className="text-amber-600 dark:text-amber-400 font-bold flex items-center space-x-1 text-[11px]">
                      <Clock className="w-3.5 h-3.5 animate-spin" />
                      <span>Saved Locally (Pending Sync)</span>
                    </span>
                  ) : (
                    <span className="text-[#C2703D] dark:text-amber-400 font-bold italic text-[11px]">
                      Pending Verification
                    </span>
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Report Modal */}
      {showReportModal && (
        <div className="fixed inset-0 bg-black/75 z-50 flex items-center justify-center p-4">
          <div className="bg-field-surface dark:bg-slate-900 border border-field-border dark:border-slate-700 rounded-3xl p-5 w-full max-w-sm space-y-4 shadow-2xl max-h-[85vh] overflow-y-auto">
            <div className="flex items-center justify-between">
              <h3 className="text-base font-bold text-field-text dark:text-white">Report Suspicious Feed Batch</h3>
              <button
                onClick={() => setShowReportModal(false)}
                className="w-9 h-9 rounded-full bg-field-base dark:bg-slate-800 text-field-text/70 dark:text-slate-400 hover:text-field-text dark:hover:text-white flex items-center justify-center"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <p className="text-xs text-field-text/70 dark:text-slate-300">
              Submit details to alert dairy cooperative members and livestock officers in your taluka.
            </p>

            {submitted ? (
              <div className="py-8 text-center text-brand-700 dark:text-emerald-400 space-y-2">
                <CheckCircle2 className="w-12 h-12 mx-auto animate-bounce" />
                <div className="text-sm font-bold">
                  {submitStatus === 'online' ? 'Report Published to Live Radar!' : 'Saved locally. Will sync when online.'}
                </div>
                <div className="text-xs text-field-text/70 dark:text-slate-300">
                  {submitStatus === 'online'
                    ? 'Shared across regional dairy cooperative network'
                    : 'Queued for automatic community broadcast'}
                </div>
              </div>
            ) : (
              <form onSubmit={handleSubmitReport} className="space-y-3 text-sm">
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="text-field-text dark:text-slate-300 font-bold block mb-1 text-xs">District:</label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. Pune"
                      value={district}
                      onChange={(e) => setDistrict(e.target.value)}
                      className="w-full bg-field-base dark:bg-slate-800 border border-field-border dark:border-slate-700 rounded-xl p-3 text-field-text dark:text-white focus:outline-none focus:border-brand-500 text-sm min-h-[48px]"
                    />
                  </div>
                  <div>
                    <label className="text-field-text dark:text-slate-300 font-bold block mb-1 text-xs">Taluka:</label>
                    <input
                      type="text"
                      placeholder="e.g. Baramati"
                      value={taluka}
                      onChange={(e) => setTaluka(e.target.value)}
                      className="w-full bg-field-base dark:bg-slate-800 border border-field-border dark:border-slate-700 rounded-xl p-3 text-field-text dark:text-white focus:outline-none focus:border-brand-500 text-sm min-h-[48px]"
                    />
                  </div>
                </div>

                <div>
                  <label className="text-field-text dark:text-slate-300 font-bold block mb-1">Feed Brand / Supplier:</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Kisan Super Pellets"
                    value={brand}
                    onChange={(e) => setBrand(e.target.value)}
                    className="w-full bg-field-base dark:bg-slate-800 border border-field-border dark:border-slate-700 rounded-xl p-3 text-field-text dark:text-white focus:outline-none focus:border-brand-500 text-sm min-h-[48px]"
                  />
                </div>

                <div>
                  <label className="text-field-text dark:text-slate-300 font-bold block mb-1">Batch Number:</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. BATCH-8891"
                    value={batchNo}
                    onChange={(e) => setBatchNo(e.target.value)}
                    className="w-full bg-field-base dark:bg-slate-800 border border-field-border dark:border-slate-700 rounded-xl p-3 text-field-text dark:text-white focus:outline-none focus:border-brand-500 text-sm min-h-[48px]"
                  />
                </div>

                <div>
                  <label className="text-field-text dark:text-slate-300 font-bold block mb-1">Observed Issue / Adulteration:</label>
                  <textarea
                    rows={3}
                    placeholder="e.g. Heavy sand settling in trough, ammoniacal odor, cows refusing feed."
                    value={issue}
                    onChange={(e) => setIssue(e.target.value)}
                    className="w-full bg-field-base dark:bg-slate-800 border border-field-border dark:border-slate-700 rounded-xl p-3 text-field-text dark:text-white focus:outline-none focus:border-brand-500 text-sm"
                  />
                </div>

                <div className="flex space-x-3 pt-2">
                  <button
                    type="button"
                    onClick={() => setShowReportModal(false)}
                    className="flex-1 py-3 bg-field-base dark:bg-slate-800 text-field-text dark:text-slate-300 font-bold rounded-xl border border-field-border dark:border-slate-700 min-h-[56px]"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="flex-1 py-3 bg-danger-600 hover:bg-danger-700 text-white font-bold rounded-xl shadow min-h-[56px]"
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
