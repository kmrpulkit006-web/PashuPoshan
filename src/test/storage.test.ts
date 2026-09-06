import { describe, it, expect, beforeEach, vi } from 'vitest';

// Provide browser globals mock before importing storage
const mockStore = new Map<string, string>();
const mockLocalStorage = {
  getItem: vi.fn((key: string) => mockStore.get(key) ?? null),
  setItem: vi.fn((key: string, val: string) => {
    mockStore.set(key, String(val));
    return true;
  }),
  removeItem: vi.fn((key: string) => mockStore.delete(key)),
  clear: vi.fn(() => mockStore.clear()),
  get length() {
    return mockStore.size;
  },
  key: vi.fn((i: number) => Array.from(mockStore.keys())[i] ?? null),
};

Object.defineProperty(globalThis, 'localStorage', {
  value: mockLocalStorage,
  writable: true,
});

if (!globalThis.window) {
  Object.defineProperty(globalThis, 'window', {
    value: {
      dispatchEvent: vi.fn(),
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
    },
    writable: true,
  });
}

if (!globalThis.navigator) {
  Object.defineProperty(globalThis, 'navigator', {
    value: { onLine: true },
    writable: true,
  });
}

import {
  syncPendingScans,
  queuePendingOfflineScan,
  getPendingOfflineScans,
  getLocalScans,
  getLocalAlerts,
  saveLocalAlert,
  getPendingOfflineAlerts,
  queueOfflineAlert,
  fetchRemoteAlerts,
  syncPendingAlerts,
} from '../lib/storage';

describe('Storage Operations & Offline Syncing (storage.ts)', () => {
  beforeEach(() => {
    mockStore.clear();
    vi.clearAllMocks();
    (globalThis.navigator as any).onLine = true;
  });

  describe('syncPendingScans() with mocked fetch', () => {
    it('removes pending scan and adds to local scans when server returns 200 with valid analysis', async () => {
      queuePendingOfflineScan({
        category: 'silage',
        photoBase64: 'data:image/jpeg;base64,mockValidBase64',
        timestamp: '2026-09-06 12:00',
        scanMode: 'vision',
      });

      expect(getPendingOfflineScans().length).toBe(1);

      const mockVisualResult = {
        isFeedSample: true,
        moldCoverageEstimate: 'none',
        colorDescription: 'Golden maize silage',
        foreignMatterVisible: false,
        foreignMatterDescription: '',
        overallVisualCondition: 'good',
      };

      globalThis.fetch = vi.fn().mockResolvedValue({
        ok: true,
        status: 200,
        json: async () => mockVisualResult,
      });

      const { successful, failed } = await syncPendingScans();

      expect(successful).toBe(1);
      expect(failed).toBe(0);
      expect(getPendingOfflineScans().length).toBe(0);

      const localScans = getLocalScans();
      expect(localScans.length).toBeGreaterThan(0);
      expect(localScans[0].category).toBe('silage');
    });

    it('keeps scan in pending queue and increments retryCount when server returns 4xx/5xx', async () => {
      queuePendingOfflineScan({
        category: 'concentrate',
        photoBase64: 'data:image/jpeg;base64,mockErrBase64',
        timestamp: '2026-09-06 12:05',
        scanMode: 'vision',
      });

      expect(getPendingOfflineScans().length).toBe(1);
      expect(getPendingOfflineScans()[0].retryCount).toBe(0);

      globalThis.fetch = vi.fn().mockResolvedValue({
        ok: false,
        status: 500,
        json: async () => ({ error: 'Internal Server Error' }),
      });

      const { successful, failed } = await syncPendingScans();

      expect(successful).toBe(0);
      expect(failed).toBe(1);

      const remaining = getPendingOfflineScans();
      expect(remaining.length).toBe(1);
      expect(remaining[0].syncStatus).toBe('failed');
      expect(remaining[0].retryCount).toBe(1);
    });

    it('keeps scan in queue and does not crash when network throws TypeError (offline)', async () => {
      queuePendingOfflineScan({
        category: 'green_fodder',
        photoBase64: 'data:image/jpeg;base64,mockOfflineBase64',
        timestamp: '2026-09-06 12:10',
        scanMode: 'vision',
      });

      globalThis.fetch = vi.fn().mockRejectedValue(new TypeError('Failed to fetch'));

      const { successful, failed } = await syncPendingScans();

      expect(successful).toBe(0);
      expect(failed).toBe(1);

      const remaining = getPendingOfflineScans();
      expect(remaining.length).toBe(1);
      expect(remaining[0].syncStatus).toBe('failed');
      expect(remaining[0].retryCount).toBe(1);
    });
  });

  describe('Crowd-Sourced Alerts & Offline Queue', () => {
    it('retrieves default seed alerts when storage is empty', () => {
      const alerts = getLocalAlerts();
      expect(alerts.length).toBeGreaterThanOrEqual(3);
    });

    it('saves a new alert to local storage and prepends it', () => {
      const newAlert = {
        id: 'test_alert_1',
        title: 'High Urea Alert',
        taluka: 'Baramati',
        district: 'Pune',
        date: 'Just now',
        alertType: 'adulterated_batch' as const,
        severity: 'high' as const,
        brandOrCrop: 'Sample Feed',
        description: 'High ammonia detected',
        reportedBy: 'Farmer Ramesh',
        verifiedByCoop: false,
      };

      const updated = saveLocalAlert(newAlert);
      expect(updated[0].id).toBe('test_alert_1');
      expect(getLocalAlerts()[0].id).toBe('test_alert_1');
    });

    it('queues offline alerts and clears them upon successful sync', async () => {
      const offlineAlert = {
        id: 'offline_alert_99',
        title: 'Offline Batch Report',
        taluka: 'Indapur',
        district: 'Pune',
        date: 'Just now',
        alertType: 'adulterated_batch' as const,
        severity: 'high' as const,
        brandOrCrop: 'Local Feed',
        description: 'Off-color pellets',
        reportedBy: 'Field Worker',
        verifiedByCoop: false,
      };

      queueOfflineAlert(offlineAlert);
      expect(getPendingOfflineAlerts().length).toBe(1);
      expect(getPendingOfflineAlerts()[0].id).toBe('offline_alert_99');
      expect(getPendingOfflineAlerts()[0].syncPending).toBe(true);

      // Mock POST /api/alerts success
      globalThis.fetch = vi.fn().mockResolvedValue({
        ok: true,
        status: 201,
        json: async () => ({ success: true, alert: offlineAlert }),
      });

      const { successful, failed } = await syncPendingAlerts();
      expect(successful).toBe(1);
      expect(failed).toBe(0);
      expect(getPendingOfflineAlerts().length).toBe(0);
    });

    it('fetches remote alerts and merges them into local storage', async () => {
      const remoteAlerts = [
        {
          id: 'server_alert_1',
          title: 'Aflatoxin Alert in Stored Hay',
          taluka: 'Karvir',
          district: 'Kolhapur',
          date: 'Yesterday',
          alertType: 'aflatoxin_surge' as const,
          severity: 'high' as const,
          brandOrCrop: 'Hay Stover',
          description: 'Mold outbreak',
          reportedBy: 'Veterinary Officer',
          verifiedByCoop: true,
        },
      ];

      globalThis.fetch = vi.fn().mockResolvedValue({
        ok: true,
        status: 200,
        json: async () => ({ alerts: remoteAlerts, total: 1 }),
      });

      const result = await fetchRemoteAlerts();
      expect(result.some(a => a.id === 'server_alert_1')).toBe(true);
    });
  });
});
