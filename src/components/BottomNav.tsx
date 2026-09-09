import React, { useState, useEffect } from 'react';
import { Locale } from '../lib/types';
import { t } from '../lib/i18n';
import { getLocalAlerts } from '../lib/storage';
import { ScanLine, History, Award, Scale, Layers, AlertTriangle } from 'lucide-react';

export type ActiveTab = 'scan' | 'history' | 'scorecard' | 'ration' | 'silage' | 'alerts';

interface BottomNavProps {
  activeTab: ActiveTab;
  setActiveTab: (tab: ActiveTab) => void;
  locale: Locale;
  hasScanResult: boolean;
  activeGrade?: string;
  theme?: 'light' | 'dark';
  pendingScansCount?: number;
  alertsCount?: number;
}

export const BottomNav: React.FC<BottomNavProps> = ({
  activeTab,
  setActiveTab,
  locale,
  hasScanResult,
  activeGrade,
  theme = 'light',
  pendingScansCount = 0,
  alertsCount,
}) => {
  const isDark = theme === 'dark';
  const [localAlertCount, setLocalAlertCount] = useState<number>(() => {
    try {
      return getLocalAlerts().length;
    } catch {
      return 0;
    }
  });

  useEffect(() => {
    const handleAlertsChanged = () => {
      try {
        setLocalAlertCount(getLocalAlerts().length);
      } catch {}
    };
    window.addEventListener('pashuposhan_pending_alerts_changed', handleAlertsChanged);
    return () => window.removeEventListener('pashuposhan_pending_alerts_changed', handleAlertsChanged);
  }, []);

  const effectiveAlerts = alertsCount !== undefined ? alertsCount : localAlertCount;

  const tabs: { id: ActiveTab; labelKey: string; icon: React.ReactNode; badge?: string }[] = [
    {
      id: 'scan',
      labelKey: 'nav.scan',
      icon: <ScanLine className="w-6 h-6" strokeWidth={2.4} aria-hidden="true" />,
      badge: pendingScansCount > 0 ? `${pendingScansCount}` : undefined,
    },
    {
      id: 'history',
      labelKey: 'nav.history',
      icon: <History className="w-6 h-6" strokeWidth={2.4} aria-hidden="true" />,
    },
    {
      id: 'scorecard',
      labelKey: 'nav.scorecard',
      icon: <Award className="w-6 h-6" strokeWidth={2.4} aria-hidden="true" />,
      badge: activeGrade
        ? (activeGrade.includes('Tier A') ? 'A' : '!')
        : (hasScanResult ? '✓' : undefined),
    },
    {
      id: 'ration',
      labelKey: 'nav.ration',
      icon: <Scale className="w-6 h-6" strokeWidth={2.4} aria-hidden="true" />,
    },
    {
      id: 'silage',
      labelKey: 'nav.silage',
      icon: <Layers className="w-6 h-6" strokeWidth={2.4} aria-hidden="true" />,
    },
    {
      id: 'alerts',
      labelKey: 'nav.alerts',
      icon: <AlertTriangle className="w-6 h-6" strokeWidth={2.4} aria-hidden="true" />,
      badge: effectiveAlerts > 0 ? `${effectiveAlerts}` : undefined,
    },
  ];

  return (
    <nav
      aria-label="Main navigation"
      className="fixed bottom-0 left-0 right-0 max-w-md mx-auto z-40 border-t px-1 pt-1.5 shadow-[0_-8px_24px_rgba(26,26,26,0.12)] transition-colors select-none"
      style={{
        backgroundColor: isDark ? '#0f172a' : '#F3EEE1',
        borderColor: isDark ? '#1e293b' : '#DCD3BF',
        paddingBottom: 'max(0.4rem, env(safe-area-inset-bottom))',
      }}
    >
      <div className="grid grid-cols-6 gap-0.5" role="tablist">
        {tabs.map((tab) => {
          const isActive = activeTab === tab.id;
          const isPrimary = tab.id === 'scan';
          return (
            <button
              key={tab.id}
              type="button"
              role="tab"
              onClick={() => setActiveTab(tab.id)}
              aria-label={t(tab.labelKey, locale)}
              aria-selected={isActive}
              aria-current={isActive ? 'page' : undefined}
              className="relative flex flex-col items-center justify-center py-1 px-0.5 rounded-2xl transition-all min-h-[68px] border"
              style={{
                backgroundColor: isActive
                  ? '#1F5D3B'
                  : isPrimary
                  ? (isDark ? '#022c22' : '#edf7f0')
                  : 'transparent',
                borderColor: isActive
                  ? '#194a30'
                  : isPrimary
                  ? (isDark ? '#34d399' : '#1F5D3B')
                  : 'transparent',
                color: isActive
                  ? '#ffffff'
                  : isPrimary
                  ? (isDark ? '#6ee7b7' : '#1F5D3B')
                  : (isDark ? '#cbd5e1' : '#3f3a32'),
              }}
            >
              <div className="relative">
                {tab.icon}
                {tab.badge && (
                  <span
                    className={`absolute -top-1.5 -right-2 min-w-[16px] text-[10px] font-black px-1 py-0.5 rounded-full text-white shadow ${
                      tab.badge === 'A'
                        ? 'bg-emerald-700'
                        : tab.badge === '!'
                        ? 'bg-[#B3261E] animate-pulse'
                        : 'bg-[#C2703D]'
                    }`}
                  >
                    {tab.badge}
                  </span>
                )}
              </div>
              <span className="text-[10px] mt-0.5 font-extrabold leading-tight text-center w-full px-0.5 line-clamp-2">
                {t(tab.labelKey, locale)}
              </span>
            </button>
          );
        })}
      </div>
    </nav>
  );
};
