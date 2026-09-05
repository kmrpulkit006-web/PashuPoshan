import React, { useState, useEffect, useCallback } from 'react';
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

const VALID_TABS: ActiveTab[] = ['scan', 'scorecard', 'ration', 'silage', 'alerts'];

function parseTabFromUrl(): ActiveTab {
  if (typeof window === 'undefined') return 'scan';

  // 1. Check path (e.g. /scorecard)
  const path = window.location.pathname.replace(/^\/+/, '').split('/')[0].toLowerCase();
  if (VALID_TABS.includes(path as ActiveTab)) {
    return path as ActiveTab;
  }

  // 2. Check hash (e.g. #/scorecard or #scorecard)
  const hash = window.location.hash.replace(/^#[/]?/, '').split('/')[0].toLowerCase();
  if (VALID_TABS.includes(hash as ActiveTab)) {
    return hash as ActiveTab;
  }

  return 'scan';
}

export const App: React.FC = () => {
  const [theme, setTheme] = useState<'light' | 'dark'>(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('pashuposhan_theme');
      if (saved === 'dark' || saved === 'light') return saved;
    }
    return 'light'; // Default to light Field Mode
  });

  const [locale, setLocale] = useState<Locale>('hi');
  const [activeTab, setActiveTab] = useState<ActiveTab>(parseTabFromUrl);
  const [activeSample, setActiveSample] = useState<FeedSample>(() => {
    const loaded = getLocalScans();
    return loaded[0];
  });
  const [isOnline, setIsOnline] = useState(navigator.onLine);

  useEffect(() => {
    const isDark = theme === 'dark';
    document.documentElement.classList.toggle('dark', isDark);
    document.body.classList.toggle('dark', isDark);
    try {
      localStorage.setItem('pashuposhan_theme', theme);
    } catch (e) {}
  }, [theme]);

  const navigateTo = useCallback((tab: ActiveTab, pushState = true) => {
    setActiveTab(tab);
    if (pushState && typeof window !== 'undefined') {
      const targetPath = `/${tab}`;
      if (window.location.pathname !== targetPath) {
        window.history.pushState({ tab }, '', targetPath);
      }
    }
  }, []);

  useEffect(() => {
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    // Browser History (Back/Forward) & Hash Routing support
    const handlePopState = (e: PopStateEvent) => {
      const targetTab = e.state?.tab || parseTabFromUrl();
      setActiveTab(targetTab);
    };

    const handleHashChange = () => {
      setActiveTab(parseTabFromUrl());
    };

    window.addEventListener('popstate', handlePopState);
    window.addEventListener('hashchange', handleHashChange);

    // Ensure current URL reflects the initial active tab
    const currentTab = parseTabFromUrl();
    if (window.location.pathname === '/' || window.location.pathname === '') {
      window.history.replaceState({ tab: currentTab }, '', `/${currentTab}`);
    }

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
      window.removeEventListener('popstate', handlePopState);
      window.removeEventListener('hashchange', handleHashChange);
    };
  }, []);

  const handleScanComplete = (sample: FeedSample) => {
    setActiveSample(sample);
    navigateTo('scorecard');
  };

  const isDark = theme === 'dark';

  return (
    <ErrorBoundary>
      <div className={`${isDark ? 'dark' : ''}`}>
        <div
          className="min-h-screen flex items-center justify-center p-0 sm:p-4 transition-colors"
          style={{ backgroundColor: isDark ? '#020617' : '#EDE8DC' }}
        >
          {/* Mobile Shell Frame */}
          <div
            className="w-full sm:max-w-md min-h-screen sm:min-h-[844px] sm:max-h-[92vh] sm:rounded-[36px] sm:border-[8px] shadow-2xl flex flex-col relative overflow-hidden transition-colors"
            style={{
              backgroundColor: isDark ? '#0f172a' : '#FBF8F1',
              color: isDark ? '#ffffff' : '#1A1A1A',
              borderColor: isDark ? '#1e293b' : '#DCD3BF',
            }}
          >
            {/* Mobile Header with Theme Toggle */}
            <MobileHeader
              locale={locale}
              setLocale={setLocale}
              isOnline={isOnline}
              theme={theme}
              setTheme={setTheme}
            />

            {/* Dynamic Screen Content */}
            <main
              className="flex-1 overflow-y-auto overscroll-contain transition-colors"
              style={{
                backgroundColor: isDark ? '#0f172a' : '#FBF8F1',
                color: isDark ? '#ffffff' : '#1A1A1A',
              }}
            >
              {activeTab === 'scan' && (
                <ScanScreen onScanComplete={handleScanComplete} locale={locale} theme={theme} />
              )}

              {activeTab === 'scorecard' && (
                <ScorecardScreen
                  sample={activeSample}
                  locale={locale}
                  onNavigateToRation={() => navigateTo('ration')}
                  onRetest={() => navigateTo('scan')}
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
              setActiveTab={navigateTo}
              locale={locale}
              hasScanResult={Boolean(activeSample)}
              activeGrade={activeSample?.overallGrade}
              theme={theme}
            />
          </div>
        </div>
      </div>
    </ErrorBoundary>
  );
};

export default App;
