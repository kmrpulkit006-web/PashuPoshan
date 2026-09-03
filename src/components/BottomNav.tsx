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
}

export const BottomNav: React.FC<BottomNavProps> = ({
  activeTab,
  setActiveTab,
  locale,
  hasScanResult,
  activeGrade
}) => {
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
      badge: activeGrade ? (activeGrade.includes('Tier A') ? 'Tier A' : 'Alert') : undefined
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
    <nav className="fixed bottom-0 left-0 right-0 max-w-md mx-auto z-40 bg-slate-900/95 backdrop-blur-md border-t border-slate-800 px-2 py-1.5 shadow-2xl">
      <div className="grid grid-cols-5 gap-1">
        {tabs.map((tab) => {
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`relative flex flex-col items-center justify-center py-1 rounded-xl transition-all ${
                isActive
                  ? 'text-emerald-400 font-bold bg-emerald-950/60 shadow-inner'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <div className="relative">
                {tab.icon}
                {tab.badge && (
                  <span className={`absolute -top-1.5 -right-3 text-[9px] font-extrabold px-1 rounded-full text-white shadow ${
                    tab.badge === 'Tier A' 
                      ? 'bg-emerald-600' 
                      : (tab.badge === 'Alert' ? 'bg-rose-600 animate-pulse' : 'bg-amber-600')
                  }`}>
                    {tab.badge}
                  </span>
                )}
              </div>
              <span className="text-[10px] mt-0.5 tracking-tight leading-none text-center">
                {t(tab.labelKey, locale)}
              </span>
            </button>
          );
        })}
      </div>
    </nav>
  );
};
