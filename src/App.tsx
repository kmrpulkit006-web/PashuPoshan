import React, { useState, useEffect } from 'react';
import { Locale, FeedSample } from './lib/types';
import { getLocalScans } from './lib/storage';
import { MobileHeader } from './components/MobileHeader';
import { BottomNav, ActiveTab } from './components/BottomNav';
import { ScanScreen } from './screens/ScanScreen';
import { ScorecardScreen } from './screens/ScorecardScreen';
import { RationScreen } from './screens/RationScreen';
import { SilageScreen } from './screens/SilageScreen';
import { AlertsScreen } from './screens/AlertsScreen';
import { ErrorBoundary } from './components/ErrorBoundary';

export const App: React.FC = () => {
  const [locale, setLocale] = useState<Locale>('hi');
  const [activeTab, setActiveTab] = useState<ActiveTab>('scan');
  const [activeSample, setActiveSample] = useState<FeedSample>(() => {
    const loaded = getLocalScans();
    return loaded[0];
  });
  const [isOnline, setIsOnline] = useState(navigator.onLine);

  useEffect(() => {
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  const handleScanComplete = (sample: FeedSample) => {
    setActiveSample(sample);
    setActiveTab('scorecard');
  };

  return (
    <ErrorBoundary>
      <div className="min-h-screen bg-slate-950 flex items-center justify-center p-0 sm:p-4">
        {/* Mobile Shell Frame */}
        <div className="w-full sm:max-w-md bg-slate-900 min-h-screen sm:min-h-[844px] sm:max-h-[92vh] sm:rounded-[36px] sm:border-[8px] sm:border-slate-800 shadow-2xl flex flex-col relative overflow-hidden">
          {/* Mobile Header */}
          <MobileHeader locale={locale} setLocale={setLocale} isOnline={isOnline} />

          {/* Dynamic Screen Content */}
          <main className="flex-1 overflow-y-auto overscroll-contain">
            {activeTab === 'scan' && (
              <ScanScreen onScanComplete={handleScanComplete} locale={locale} />
            )}

            {activeTab === 'scorecard' && (
              <ScorecardScreen
                sample={activeSample}
                locale={locale}
                onNavigateToRation={() => setActiveTab('ration')}
                onRetest={() => setActiveTab('scan')}
              />
            )}

            {activeTab === 'ration' && (
              <RationScreen activeSample={activeSample} locale={locale} />
            )}

            {activeTab === 'silage' && (
              <SilageScreen locale={locale} />
            )}

            {activeTab === 'alerts' && (
              <AlertsScreen locale={locale} />
            )}
          </main>

          {/* Bottom Navigation */}
          <BottomNav
            activeTab={activeTab}
            setActiveTab={setActiveTab}
            locale={locale}
            hasScanResult={Boolean(activeSample)}
            activeGrade={activeSample?.overallGrade}
          />
        </div>
      </div>
    </ErrorBoundary>
  );
};

export default App;
