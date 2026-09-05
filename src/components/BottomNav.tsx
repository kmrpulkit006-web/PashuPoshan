import React from 'react';
import { Locale } from '../lib/types';
import { t } from '../lib/i18n';
import { ScanLine, Award, Scale, Layers, AlertTriangle } from 'lucide-react';

export type ActiveTab = 'scan' | 'scorecard' | 'ration' | 'silage' | 'alerts';

interface BottomNavProps {
  activeTab: ActiveTab;
  setActiveTab: (tab: ActiveTab) => void;
  locale: Locale;
  hasScanResult: boolean;
  activeGrade?: string;
  theme?: 'light' | 'dark';
}

export const BottomNav: React.FC<BottomNavProps> = ({
  activeTab,
  setActiveTab,
  locale,
  hasScanResult,
  activeGrade,
  theme = 'light',
}) => {
  const isDark = theme === 'dark';
  const tabs: { id: ActiveTab; labelKey: string; icon: React.ReactNode; badge?: string }[] = [
    {
      id: 'scan',
      labelKey: 'nav.scan',
      icon: <ScanLine className="w-5 h-5" />,
    },
    {
      id: 'scorecard',
      labelKey: 'nav.scorecard',
      icon: <Award className="w-5 h-5" />,
      badge: activeGrade ? (activeGrade.includes('Tier A') ? 'Tier A' : 'Alert') : undefined,
    },
    {
      id: 'ration',
      labelKey: 'nav.ration',
      icon: <Scale className="w-5 h-5" />,
    },
    {
      id: 'silage',
      labelKey: 'nav.silage',
      icon: <Layers className="w-5 h-5" />,
    },
    {
      id: 'alerts',
      labelKey: 'nav.alerts',
      icon: <AlertTriangle className="w-5 h-5" />,
      badge: '3',
    },
  ];

  return (
    <nav
      className="fixed bottom-0 left-0 right-0 max-w-md mx-auto z-40 backdrop-blur-md border-t px-2 py-2 shadow-2xl transition-colors"
      style={{
        backgroundColor: isDark ? 'rgba(15, 23, 42, 0.95)' : 'rgba(243, 238, 225, 0.95)',
        borderColor: isDark ? '#1e293b' : '#DCD3BF',
        paddingBottom: 'max(0.5rem, env(safe-area-inset-bottom))',
      }}
    >
      <div className="grid grid-cols-5 gap-1.5">
        {tabs.map((tab) => {
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className="relative flex flex-col items-center justify-center py-1.5 px-1 rounded-2xl transition-all min-h-[56px] border"
              style={{
                backgroundColor: isActive ? (isDark ? '#022c22' : '#edf7f0') : 'transparent',
                borderColor: isActive ? (isDark ? '#34d399' : '#b0dec0') : 'transparent',
                color: isActive ? (isDark ? '#34d399' : '#1F5D3B') : (isDark ? '#94a3b8' : '#5A5243'),
              }}
            >
              <div className="relative">
                {tab.icon}
                {tab.badge && (
                  <span
                    className={`absolute -top-1.5 -right-2 text-[8px] sm:text-[9px] font-black px-1.5 py-0.5 rounded-full text-white shadow ${
                      tab.badge === 'Tier A'
                        ? 'bg-[#1F5D3B]'
                        : tab.badge === 'Alert'
                        ? 'bg-[#B3261E] animate-pulse'
                        : 'bg-[#C2703D]'
                    }`}
                  >
                    {tab.badge}
                  </span>
                )}
              </div>
              <span className="text-[10px] mt-1 tracking-tight font-bold leading-tight text-center w-full truncate px-0.5">
                {t(tab.labelKey, locale)}
              </span>
            </button>
          );
        })}
      </div>
    </nav>
  );
};
