import React, { useState, useEffect, useCallback } from 'react';
import { Locale, FeedSample, isSupportedLocale } from './lib/types';
import { getLanguageInfo } from './lib/i18n';
import { getLocalScans, getPendingOfflineScans, syncPendingScans } from './lib/storage';
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

  const [locale, setLocale] = useState<Locale>(() => {
    if (typeof window !== 'undefined') {
      try {
        const saved = localStorage.getItem('pashuposhan_locale');
        if (isSupportedLocale(saved)) return saved;
      } catch (e) {}
    }
    return 'hi';
  });

  useEffect(() => {
    try {
      localStorage.setItem('pashuposhan_locale', locale);
    } catch (e) {}
    if (typeof document !== 'undefined') {
      const info = getLanguageInfo(locale);
      document.documentElement.lang = locale;
      document.documentElement.dir = info.direction || 'ltr';
    }
  }, [locale]);
  const [activeTab, setActiveTab] = useState<ActiveTab>(parseTabFromUrl);
  const [activeSample, setActiveSample] = useState<FeedSample>(() => {
    const loaded = getLocalScans();
    return loaded[0];
  });
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [pendingScansCount, setPendingScansCount] = useState<number>(() => {
    return typeof window !== 'undefined' ? getPendingOfflineScans().length : 0;
  });

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
    const handleOnline = () => {
      setIsOnline(true);
      // Auto-retry pending offline scans when connectivity returns
      syncPendingScans().then(result => {
        if (result.successful > 0) {
          const freshScans = getLocalScans();
          if (freshScans.length > 0) {
            setActiveSample(freshScans[0]);
          }
        }
      }).catch(err => console.warn('Background auto sync notice:', err));
    };

    const handleOffline = () => setIsOnline(false);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    // Track changes to offline sync queue
    const handleSyncChanged = (e: any) => {
      setPendingScansCount(e.detail?.count ?? getPendingOfflineScans().length);
    };
    window.addEventListener('pashuposhan_pending_sync_changed', handleSyncChanged);

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
      window.removeEventListener('pashuposhan_pending_sync_changed', handleSyncChanged);
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
          className="min-h-dvh flex items-center justify-center p-0 sm:p-4 transition-colors"
          style={{ backgroundColor: isDark ? '#020617' : '#EDE8DC' }}
        >
          {/* Mobile Shell Frame */}
          <div
            className="w-full sm:max-w-md h-dvh min-h-dvh max-h-dvh sm:h-auto sm:min-h-[844px] sm:max-h-[92vh] sm:rounded-[36px] sm:border-[8px] shadow-2xl flex flex-col relative overflow-hidden transition-colors"
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
              pendingScansCount={pendingScansCount}
            />

            {/* Dynamic Screen Content */}
            <main
              className="flex-1 min-h-0 overflow-y-auto overscroll-contain transition-colors touch-pan-y"
              style={{
                backgroundColor: isDark ? '#0f172a' : '#FBF8F1',
                color: isDark ? '#ffffff' : '#1A1A1A',
                paddingBottom: 'calc(80px + env(safe-area-inset-bottom))',
                touchAction: 'pan-y',
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
              pendingScansCount={pendingScansCount}
            />
          </div>
        </div>
      </div>
    </ErrorBoundary>
  );
};

export default App;
