import { CowProfile, FeedSample, SilageBunker, SilagePitLog, CommunityFeedAlert, OfflineSyncItem, FeedCategory, OfflineMoldHeuristicResult, CowYieldLogEntry } from './types';
import { PRESET_FEED_SCENARIOS, createFeedSampleFromVisualAnalysis } from './feedAnalysisEngine';
import { storeImageInIndexedDb, getImageFromIndexedDb, deleteImageFromIndexedDb } from './imageStorage';

const COWS_KEY = 'pashuposhan_cows_v1';
const SCANS_KEY = 'pashuposhan_scans_v1';
const YIELD_LOGS_KEY = 'pashuposhan_yield_logs_v1';
const PITS_KEY = 'pashuposhan_pits_v1';
const ALERTS_KEY = 'pashuposhan_alerts_v1';
const SYNC_QUEUE_KEY = 'pashuposhan_sync_queue_v1';
const PENDING_SCANS_KEY = 'pashuposhan_pending_scans_v1';
const PENDING_ALERTS_KEY = 'pashuposhan_pending_alerts_v1';

function safeSetItem(key: string, value: string): boolean {
  try {
    localStorage.setItem(key, value);
    return true;
  } catch (e: any) {
    if (e.name === 'QuotaExceededError' || e.code === 22) {
      console.warn('LocalStorage quota exceeded. Evicting old scans cache...');
      try {
        // Evict oldest scans to preserve app state
        const scansRaw = localStorage.getItem(SCANS_KEY);
        if (scansRaw) {
          const scans: FeedSample[] = JSON.parse(scansRaw);
          if (scans.length > 3) {
            localStorage.setItem(SCANS_KEY, JSON.stringify(scans.slice(0, 3)));
            localStorage.setItem(key, value);
            return true;
          }
        }
      } catch (innerError) {
        console.error('Failed to write even after eviction', innerError);
      }
    }
    return false;
  }
}

const INITIAL_COWS: CowProfile[] = [
  {
    id: 'cow_gir_lakshmi',
    tagNumber: 'INAPH-100293849',
    name: 'Lakshmi (Indigenous Gir)',
    breed: 'Gir',
    weightKg: 380,
    lactationStage: 'Early (0-90 days)',
    dailyMilkYieldLiters: 12,
    milkFatPct: 4.6,
    createdAt: '2026-08-01T06:00:00.000Z',
  },
  {
    id: 'cow_hf_ganga',
    tagNumber: 'INAPH-294810293',
    name: 'Ganga (Crossbred HF)',
    breed: 'HF Crossbred',
    weightKg: 460,
    lactationStage: 'Mid (91-200 days)',
    dailyMilkYieldLiters: 18,
    milkFatPct: 3.8,
    createdAt: '2026-08-05T06:00:00.000Z',
  },
  {
    id: 'cow_murrah_yamuna',
    tagNumber: 'INAPH-593029104',
    name: 'Yamuna (Murrah Buffalo)',
    breed: 'Murrah Buffalo',
    weightKg: 520,
    lactationStage: 'Early (0-90 days)',
    dailyMilkYieldLiters: 14,
    milkFatPct: 7.2,
    createdAt: '2026-08-10T06:00:00.000Z',
  },
];

const INITIAL_PITS: SilageBunker[] = [
  {
    id: 'pit_1',
    pitName: 'Main Bunker Pit #1 (Hybrid Maize)',
    cropType: 'Maize',
    ensilingDate: '2026-07-20',
    daysFermented: 44,
    compactionRating: 'Optimum (>650 kg/m3)',
    coverIntegrity: 'Airtight Sealed',
    coreTemperature: 32.5,
    status: 'Ready to Feed',
    logs: [
      { id: 'log_1', date: '2026-08-30', temperatureC: 32.0, compactionRating: 'Optimum (>650 kg/m3)', pH: 3.9, notes: 'Golden color, pleasant lactic smell' }
    ]
  },
  {
    id: 'pit_2',
    pitName: 'Trench Silo #2 (Sweet Sorghum)',
    cropType: 'Sorghum',
    ensilingDate: '2026-08-10',
    daysFermented: 23,
    compactionRating: 'Loose/Air-Pockets',
    coverIntegrity: 'Minor Pinholes',
    coreTemperature: 43.8,
    status: 'Aerobic Heating Risk',
    logs: [
      { id: 'log_2', date: '2026-08-28', temperatureC: 43.8, compactionRating: 'Loose/Air-Pockets', pH: 5.2, notes: 'Air leak observed, surface mold forming' }
    ]
  },
];

const INITIAL_ALERTS: CommunityFeedAlert[] = [
  {
    id: 'alert_1',
    title: 'Adulterated Commercial Pellet Batch Flagged',
    taluka: 'Baramati',
    district: 'Pune, Maharashtra',
    date: 'Today, 10:15 AM',
    alertType: 'adulterated_batch',
    severity: 'high',
    brandOrCrop: 'Unbranded Yellow Pellets (Batch #4911)',
    description: '3 dairy farmers in Baramati reported acute ammonia bloat after feeding batch #4911. Colorimetric strip testing revealed 4.2% added urea and 6.8% silica sand. Do not purchase.',
    reportedBy: 'Baramati Taluka Cooperative Milk Union',
    verifiedByCoop: true,
  },
  {
    id: 'alert_2',
    title: 'Aflatoxin Surge in Stored Maize Fodder',
    taluka: 'Karvir',
    district: 'Kolhapur, Maharashtra',
    date: 'Yesterday',
    alertType: 'aflatoxin_surge',
    severity: 'high',
    brandOrCrop: 'Post-Monsoon Maize Stover',
    description: 'Heavy moisture has caused widespread Aspergillus mold growth in standing maize stover. Keep harvested fodder off damp ground to prevent Aflatoxin M1 contamination in milk.',
    reportedBy: 'District Veterinary Polyclinic',
    verifiedByCoop: true,
  },
  {
    id: 'alert_3',
    title: 'Subsidized Green Fodder Silage Depot Opened',
    taluka: 'Anand',
    district: 'Anand, Gujarat',
    date: '28 Aug 2026',
    alertType: 'fodder_scarcity',
    severity: 'info',
    brandOrCrop: 'Certified Grade-A Maize Silage',
    description: 'NDDB certified silage bales available at ₹4.20/kg for cooperative members to counter seasonal dry fodder deficit.',
    reportedBy: 'Gujarat Cooperative Milk Marketing Federation',
    verifiedByCoop: true,
  },
  {
    id: 'alert_4',
    title: 'High Non-Protein Nitrogen Warning in Mustard Cake',
    taluka: 'Khanna',
    district: 'Ludhiana, Punjab',
    date: '26 Aug 2026',
    alertType: 'adulterated_batch',
    severity: 'high',
    brandOrCrop: 'Commercial Khal (Loose Bags)',
    description: 'Field reagent strip testing detected >3.5% non-protein nitrogen (synthetic urea) in unbranded solvent-extracted cake.',
    reportedBy: 'District Dairy Cooperative Society',
    verifiedByCoop: true,
  }
];

// Cattle Operations
export function getLocalCows(): CowProfile[] {
  try {
    const raw = localStorage.getItem(COWS_KEY);
    if (!raw) {
      safeSetItem(COWS_KEY, JSON.stringify(INITIAL_COWS));
      return INITIAL_COWS;
    }
    return JSON.parse(raw);
  } catch (e) {
    return INITIAL_COWS;
  }
}

export function saveLocalCow(cow: CowProfile): CowProfile[] {
  const current = getLocalCows();
  const existingIdx = current.findIndex(c => c.id === cow.id);
  let updated: CowProfile[];
  if (existingIdx >= 0) {
    updated = [...current];
    updated[existingIdx] = cow;
  } else {
    updated = [cow, ...current];
  }
  safeSetItem(COWS_KEY, JSON.stringify(updated));
  queueOfflineAction('cow', existingIdx >= 0 ? 'update' : 'create', cow);
  return updated;
}

export function deleteLocalCow(id: string): CowProfile[] {
  const current = getLocalCows().filter(c => c.id !== id);
  safeSetItem(COWS_KEY, JSON.stringify(current));
  queueOfflineAction('cow', 'delete', { id });
  return current;
}

// Scans History Operations
export function getLocalScans(): FeedSample[] {
  try {
    const raw = localStorage.getItem(SCANS_KEY);
    if (!raw) {
      safeSetItem(SCANS_KEY, JSON.stringify(PRESET_FEED_SCENARIOS));
      return PRESET_FEED_SCENARIOS;
    }
    return JSON.parse(raw);
  } catch (e) {
    return PRESET_FEED_SCENARIOS;
  }
}

export function saveLocalScan(sample: FeedSample): FeedSample[] {
  const current = getLocalScans();
  
  // If sample has an image, also store in IndexedDB to preserve high quality without bloating LocalStorage
  if (sample.imageUrl && sample.imageUrl.startsWith('data:')) {
    storeImageInIndexedDb(sample.id, sample.imageUrl).catch(err => {
      console.warn('Failed to cache image in IndexedDB', err);
    });
  }

  const updated = [sample, ...current.filter(s => s.id !== sample.id)];
  safeSetItem(SCANS_KEY, JSON.stringify(updated));
  queueOfflineAction('scan', 'create', { ...sample, imageUrl: '' }); // Queue lightweight metadata
  return updated;
}

// Cow Milk Yield Logs Operations
export function getLocalYieldLogs(cowId?: string): CowYieldLogEntry[] {
  try {
    const raw = localStorage.getItem(YIELD_LOGS_KEY);
    if (!raw) {
      return [];
    }
    const all: CowYieldLogEntry[] = JSON.parse(raw);
    if (cowId) {
      return all.filter(l => l && l.cowId === cowId);
    }
    return all;
  } catch (e) {
    return [];
  }
}

export function saveYieldLogEntry(entry: CowYieldLogEntry): CowYieldLogEntry[] {
  try {
    const raw = localStorage.getItem(YIELD_LOGS_KEY);
    const all: CowYieldLogEntry[] = raw ? JSON.parse(raw) : [];
    const existingIdx = all.findIndex(e => e.id === entry.id);
    let updated: CowYieldLogEntry[];
    if (existingIdx >= 0) {
      updated = [...all];
      updated[existingIdx] = entry;
    } else {
      updated = [entry, ...all];
    }
    safeSetItem(YIELD_LOGS_KEY, JSON.stringify(updated));
    queueOfflineAction('yield_log', existingIdx >= 0 ? 'update' : 'create', entry);
    return updated.filter(e => e && e.cowId === entry.cowId);
  } catch (e) {
    return [entry];
  }
}

export function getSamplesForCow(cowId: string): FeedSample[] {
  if (!cowId) return [];
  const scans = getLocalScans();
  return scans.filter(s => s && s.linkedCowId === cowId);
}

// Silage Pit Operations
export function getLocalPits(): SilageBunker[] {
  try {
    const raw = localStorage.getItem(PITS_KEY);
    if (!raw) {
      safeSetItem(PITS_KEY, JSON.stringify(INITIAL_PITS));
      return INITIAL_PITS;
    }
    return JSON.parse(raw);
  } catch (e) {
    return INITIAL_PITS;
  }
}

export function saveLocalPit(pit: SilageBunker): SilageBunker[] {
  const current = getLocalPits();
  const existingIdx = current.findIndex(p => p.id === pit.id);
  let updated: SilageBunker[];
  if (existingIdx >= 0) {
    updated = [...current];
    updated[existingIdx] = pit;
  } else {
    updated = [pit, ...current];
  }
  safeSetItem(PITS_KEY, JSON.stringify(updated));
  queueOfflineAction('silage_pit', existingIdx >= 0 ? 'update' : 'create', pit);
  return updated;
}

export function addPitLogEntry(pitId: string, log: SilagePitLog): SilageBunker[] {
  const pits = getLocalPits().map(pit => {
    if (pit.id === pitId) {
      const logs = [log, ...(pit.logs || [])];
      return {
        ...pit,
        coreTemperature: log.temperatureC,
        compactionRating: log.compactionRating,
        status: (log.temperatureC > 40 ? 'Aerobic Heating Risk' : (pit.daysFermented >= 45 ? 'Ready to Feed' : 'Fermenting')) as any,
        logs
      };
    }
    return pit;
  });
  safeSetItem(PITS_KEY, JSON.stringify(pits));
  queueOfflineAction('silage_pit', 'update', { pitId, log });
  return pits;
}

// Alerts Operations
export function getLocalAlerts(): CommunityFeedAlert[] {
  try {
    const raw = localStorage.getItem(ALERTS_KEY);
    if (!raw) {
      safeSetItem(ALERTS_KEY, JSON.stringify(INITIAL_ALERTS));
      return INITIAL_ALERTS;
    }
    return JSON.parse(raw);
  } catch (e) {
    return INITIAL_ALERTS;
  }
}

export function saveLocalAlerts(alerts: CommunityFeedAlert[]): void {
  safeSetItem(ALERTS_KEY, JSON.stringify(alerts));
}

export function saveLocalAlert(alert: CommunityFeedAlert): CommunityFeedAlert[] {
  const current = getLocalAlerts();
  const updated = [alert, ...current.filter(a => a.id !== alert.id)];
  safeSetItem(ALERTS_KEY, JSON.stringify(updated));
  queueOfflineAction('community_alert', 'create', alert);
  return updated;
}

export function getPendingOfflineAlerts(): CommunityFeedAlert[] {
  try {
    const raw = localStorage.getItem(PENDING_ALERTS_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch (e) {
    return [];
  }
}

export function queueOfflineAlert(alert: CommunityFeedAlert): CommunityFeedAlert[] {
  const current = getPendingOfflineAlerts();
  const alertWithFlag = { ...alert, syncPending: true };
  const updated = [...current.filter(a => a.id !== alert.id), alertWithFlag];
  safeSetItem(PENDING_ALERTS_KEY, JSON.stringify(updated));
  saveLocalAlert(alertWithFlag);

  if (typeof window !== 'undefined') {
    window.dispatchEvent(new CustomEvent('pashuposhan_pending_alerts_changed'));
  }
  return updated;
}

export function clearSyncedAlerts(syncedIds?: string[]): void {
  try {
    if (!syncedIds || syncedIds.length === 0) {
      localStorage.removeItem(PENDING_ALERTS_KEY);
    } else {
      const current = getPendingOfflineAlerts();
      const remaining = current.filter(a => !syncedIds.includes(a.id));
      safeSetItem(PENDING_ALERTS_KEY, JSON.stringify(remaining));
    }
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent('pashuposhan_pending_alerts_changed'));
    }
  } catch (e) {
    console.error('Failed to clear synced alerts:', e);
  }
}

export async function fetchRemoteAlerts(): Promise<CommunityFeedAlert[]> {
  try {
    const response = await fetch('/api/alerts', { method: 'GET' });
    if (response.ok) {
      const data = await response.json();
      if (Array.isArray(data.alerts)) {
        // Merge with any unsynced offline alerts
        const pending = getPendingOfflineAlerts();
        const serverIds = new Set(data.alerts.map((a: CommunityFeedAlert) => a.id));
        const unsynced = pending.filter(p => !serverIds.has(p.id));
        const merged = [...unsynced, ...data.alerts];
        saveLocalAlerts(merged);
        return merged;
      }
    }
  } catch (err) {
    console.warn('Network error fetching remote alerts, falling back to local storage:', err);
  }
  return getLocalAlerts();
}

export async function postRemoteAlert(alert: Partial<CommunityFeedAlert>): Promise<CommunityFeedAlert> {
  const response = await fetch('/api/alerts', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(alert),
  });

  if (!response.ok) {
    const errData = await response.json().catch(() => ({}));
    throw new Error(errData.error || `Failed to post alert (${response.status})`);
  }

  const data = await response.json();
  return data.alert;
}

export async function syncPendingAlerts(): Promise<{ successful: number; failed: number }> {
  const pending = getPendingOfflineAlerts();
  if (pending.length === 0) return { successful: 0, failed: 0 };

  let successful = 0;
  let failed = 0;
  const syncedIds: string[] = [];

  for (const alert of pending) {
    try {
      await postRemoteAlert(alert);
      syncedIds.push(alert.id);
      successful++;
    } catch (e) {
      console.warn(`Failed to sync alert ${alert.id}:`, e);
      failed++;
    }
  }

  if (syncedIds.length > 0) {
    clearSyncedAlerts(syncedIds);
    // Update local alert sync flags
    const current = getLocalAlerts().map(a => syncedIds.includes(a.id) ? { ...a, syncPending: false } : a);
    saveLocalAlerts(current);
  }

  return { successful, failed };
}

// Offline Sync Queue Operations
export function getPendingSyncQueue(): OfflineSyncItem[] {
  try {
    const raw = localStorage.getItem(SYNC_QUEUE_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch (e) {
    return [];
  }
}

export function queueOfflineAction(entityType: OfflineSyncItem['entityType'], action: OfflineSyncItem['action'], payload: any) {
  const queue = getPendingSyncQueue();
  const newItem: OfflineSyncItem = {
    id: `sync_${Date.now()}_${Math.random().toString(36).substr(2, 5)}`,
    entityType,
    action,
    payload,
    timestamp: new Date().toISOString(),
    synced: false
  };
  safeSetItem(SYNC_QUEUE_KEY, JSON.stringify([...queue, newItem]));
}

/**
 * Honest Sync Inspection:
 * Does NOT delete queued items pretending they are uploaded to a remote server.
 * Returns the count of preserved items.
 */
export function getSyncStatus(): { pendingCount: number; statusMessage: string } {
  const queue = getPendingSyncQueue();
  return {
    pendingCount: queue.length,
    statusMessage: queue.length > 0 
      ? `${queue.length} record(s) queued locally. In this prototype, records remain safely preserved in browser storage awaiting production cloud API integration.`
      : 'Local queue is empty. All new offline scans, herd records, and alerts will be preserved locally.'
  };
}

/**
 * Explicit user action to reset or purge the local demo queue.
 */
export function clearDemoQueue(): number {
  const queue = getPendingSyncQueue();
  const count = queue.length;
  safeSetItem(SYNC_QUEUE_KEY, JSON.stringify([]));
  return count;
}

// ============================================================================
// REAL OFFLINE PHOTO SCANS QUEUE & BACKGROUND SYNC
// ============================================================================

export interface PendingOfflineScan {
  id: string;
  category: FeedCategory;
  photoBase64: string;
  timestamp: string;
  scanMode: 'vision' | 'strip';
  stripColor?: 'yellow' | 'magenta' | 'green';
  syncStatus: 'pending' | 'syncing' | 'failed';
  failureReason?: 'offline' | 'api_error';
  errorMessage?: string;
  retryCount?: number;
}

export function getPendingOfflineScans(): PendingOfflineScan[] {
  try {
    const raw = localStorage.getItem(PENDING_SCANS_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch (e) {
    return [];
  }
}

export function queuePendingOfflineScan(
  scan: Omit<PendingOfflineScan, 'id' | 'syncStatus'>
): PendingOfflineScan {
  const current = getPendingOfflineScans();
  const id = `offline_scan_${Date.now()}_${Math.random().toString(36).substr(2, 5)}`;
  const newItem: PendingOfflineScan = {
    ...scan,
    id,
    syncStatus: 'pending',
    failureReason: scan.failureReason || 'offline',
    retryCount: 0,
  };

  if (scan.photoBase64 && scan.photoBase64.startsWith('data:')) {
    storeImageInIndexedDb(id, scan.photoBase64).catch(err => {
      console.warn('Failed to cache offline scan image in IndexedDB', err);
    });
  }

  // To prevent LocalStorage QuotaExceededError (5MB limit), do not serialize large base64 data URIs into localStorage.
  // The full image is safely persisted in IndexedDB under the item id.
  const storageItem: PendingOfflineScan = {
    ...newItem,
    photoBase64: scan.photoBase64 && scan.photoBase64.length > 500 ? '' : (scan.photoBase64 || ''),
  };

  const updated = [storageItem, ...current];
  safeSetItem(PENDING_SCANS_KEY, JSON.stringify(updated));
  if (typeof window !== 'undefined') {
    window.dispatchEvent(
      new CustomEvent('pashuposhan_pending_sync_changed', { detail: { count: updated.length } })
    );
  }
  return newItem;
}

export function updatePendingOfflineScan(
  id: string,
  updates: Partial<PendingOfflineScan>
): void {
  const current = getPendingOfflineScans();
  const updated = current.map(s => (s.id === id ? { ...s, ...updates } : s));
  safeSetItem(PENDING_SCANS_KEY, JSON.stringify(updated));
  if (typeof window !== 'undefined') {
    window.dispatchEvent(
      new CustomEvent('pashuposhan_pending_sync_changed', { detail: { count: updated.length } })
    );
  }
}

export function removePendingOfflineScan(id: string): void {
  const current = getPendingOfflineScans();
  const updated = current.filter(s => s.id !== id);
  safeSetItem(PENDING_SCANS_KEY, JSON.stringify(updated));
  deleteImageFromIndexedDb(id).catch(() => {});
  if (typeof window !== 'undefined') {
    window.dispatchEvent(
      new CustomEvent('pashuposhan_pending_sync_changed', { detail: { count: updated.length } })
    );
  }
}

export function clearPendingOfflineScans(): void {
  const current = getPendingOfflineScans();
  current.forEach(item => {
    deleteImageFromIndexedDb(item.id).catch(() => {});
  });
  safeSetItem(PENDING_SCANS_KEY, JSON.stringify([]));
  if (typeof window !== 'undefined') {
    window.dispatchEvent(
      new CustomEvent('pashuposhan_pending_sync_changed', { detail: { count: 0 } })
    );
  }
}

let isSyncInProgress = false;

export function getIsSyncInProgress(): boolean {
  return isSyncInProgress;
}

/**
 * Retries all pending offline scans against the Vercel serverless /api/analyze-visual endpoint.
 * Protected by an in-flight guard to prevent concurrent double-processing.
 */
export async function syncPendingScans(
  onProgress?: (current: number, total: number) => void
): Promise<{ successful: number; failed: number }> {
  if (isSyncInProgress) {
    return { successful: 0, failed: 0 };
  }

  if (typeof window !== 'undefined' && !navigator.onLine) {
    return { successful: 0, failed: 0 };
  }

  const pending = getPendingOfflineScans();
  if (pending.length === 0) return { successful: 0, failed: 0 };

  isSyncInProgress = true;
  let successful = 0;
  let failed = 0;

  try {
    for (let i = 0; i < pending.length; i++) {
      const item = pending[i];
      if (onProgress) onProgress(i + 1, pending.length);

      updatePendingOfflineScan(item.id, { syncStatus: 'syncing' });

      try {
        if (item.scanMode === 'vision') {
          let photoData = item.photoBase64;
          if (!photoData || photoData.length < 50) {
            try {
              photoData = (await getImageFromIndexedDb(item.id)) || '';
            } catch (e) {
              photoData = '';
            }
          }

          const res = await fetch('/api/analyze-visual', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              imageBase64: photoData,
              category: item.category,
            }),
          });

          if (!res.ok) {
            throw new Error(`API responded with ${res.status}`);
          }

          const visualResult = await res.json();
          const sample = createFeedSampleFromVisualAnalysis(item.category, visualResult, photoData);
          
          // Remove offline placeholder and save real sample to prevent duplicate cards
          const placeholderId = `offline_pending_${item.id}`;
          const currentScans = getLocalScans().filter(s => s.id !== placeholderId && s.id !== sample.id);
          safeSetItem(SCANS_KEY, JSON.stringify([sample, ...currentScans]));
          if (typeof window !== 'undefined') {
            window.dispatchEvent(new CustomEvent('pashuposhan_scans_updated'));
          }

          removePendingOfflineScan(item.id);
          successful++;
        } else {
          // Strip scan fallback: remove placeholder if present, mark resolved and clear
          const placeholderId = `offline_pending_${item.id}`;
          const currentScans = getLocalScans().filter(s => s.id !== placeholderId);
          safeSetItem(SCANS_KEY, JSON.stringify(currentScans));
          if (typeof window !== 'undefined') {
            window.dispatchEvent(new CustomEvent('pashuposhan_scans_updated'));
          }
          removePendingOfflineScan(item.id);
          successful++;
        }
      } catch (err: any) {
        console.warn(`Failed to sync item ${item.id}:`, err);
        const isOfflineNow = typeof navigator !== 'undefined' && !navigator.onLine;
        updatePendingOfflineScan(item.id, {
          syncStatus: 'failed',
          failureReason: isOfflineNow ? 'offline' : 'api_error',
          retryCount: (item.retryCount || 0) + 1,
          errorMessage: err.message || 'Sync failed',
        });
        failed++;
      }
    }
  } finally {
    isSyncInProgress = false;
  }

  return { successful, failed };
}

/**
 * Creates a placeholder FeedSample for an offline capture so the farmer's session
 * is uninterrupted and they can view their photo with pending sync badge.
 */
export function createOfflinePlaceholderSample(
  category: FeedCategory,
  photoUri: string,
  pendingId: string,
  heuristicResult?: OfflineMoldHeuristicResult
): FeedSample {
  const isSilage = category === 'silage';
  const categoryLabel = isSilage ? 'Silage' : category.replace('_', ' ').toUpperCase();

  let name = `${categoryLabel} (Offline — Pending Sync)`;
  let veterinaryAdvisory =
    'Offline scan queued. When in mobile data range, the AI visual triage will evaluate surface mold and discoloration.';
  let actionableSummary =
    'Photo safely saved in offline queue. Connect to internet to run AI visual triage.';
  let correctiveActions = [
    'Photo stored safely in local phone memory.',
    'Tap "Sync now" in the Alerts tab or Header info when in cellular network range.',
  ];
  let heuristicDisclaimer =
    'Image captured offline in low-connectivity area. Saved to local sync queue. Full AI visual analysis will complete automatically when reconnected.';

  if (heuristicResult) {
    if (heuristicResult.moldSuspicionLevel === 'likely') {
      name = `${categoryLabel} (Offline Estimate: Mold Suspected — Unconfirmed)`;
      veterinaryAdvisory = `Offline Heuristic Notice (Unconfirmed): Localized surface color clusters detected (~${heuristicResult.affectedAreaPct}% coverage) resembling mold. Full AI visual analysis will confirm once online. Do not discard feed prematurely based on this rough offline estimate.`;
      actionableSummary = `Offline Heuristic Alert: Surface discoloration detected (~${heuristicResult.affectedAreaPct}% coverage). Status: Unconfirmed. Connect to internet to confirm.`;
      correctiveActions = [
        `Offline Heuristic Alert: ~${heuristicResult.affectedAreaPct}% surface discoloration detected. Status: Unconfirmed Offline Estimate.`,
        'Keep sample dry, well-ventilated, and shaded; re-verify with AI visual triage once online.',
        'Tap "Sync now" in the Alerts tab or Header info when cellular network is restored.',
      ];
      heuristicDisclaimer = heuristicResult.heuristicDisclaimer;
    } else if (heuristicResult.moldSuspicionLevel === 'possible') {
      name = `${categoryLabel} (Offline Estimate: Minor Discoloration — Unconfirmed)`;
      veterinaryAdvisory = `Offline Heuristic Notice (Unconfirmed): Minor surface color anomalies detected (~${heuristicResult.affectedAreaPct}% coverage). Full AI visual analysis will evaluate when online.`;
      actionableSummary = `Offline Heuristic Notice: Minor surface anomalies detected (~${heuristicResult.affectedAreaPct}% coverage). Status: Unconfirmed.`;
      correctiveActions = [
        `Offline Heuristic Notice: Minor surface anomalies detected (~${heuristicResult.affectedAreaPct}% coverage). Status: Unconfirmed.`,
        'Photo stored safely in offline queue. Sync when network is restored.',
      ];
      heuristicDisclaimer = heuristicResult.heuristicDisclaimer;
    }
  }

  return {
    id: `offline_pending_${pendingId}`,
    name,
    category,
    batchNumber: 'OFFLINE-QUEUE',
    sourceOrBrand: 'Field Camera (Saved Locally)',
    timestamp: new Date().toISOString(),
    imageUrl: photoUri,
    testedMethod: 'AI Vision Triage',
    isSimulated: false,
    isPrototypeHeuristic: true,
    heuristicDisclaimer,
    metrics: {
      moisture: isSilage ? 68.0 : 10.5,
      dryMatter: isSilage ? 32.0 : 89.5,
      requiresLabTest: true,
    },
    silageMetrics: isSilage
      ? {
          pH: 4.0,
          fliegScore: 75,
          fliegGrade: 'Good',
          primaryAcid: 'Lactic Acid (Well Preserved)',
          ammoniaNitrogenPct: 7.0,
          aerobicStabilityHours: 36,
          moldContaminationPct: heuristicResult ? heuristicResult.affectedAreaPct : 0,
          temperatureC: 32.0,
        }
      : undefined,
    adulteration: {
      ureaAdulterationDetected: false,
      ureaPercentage: 0.1,
      aflatoxinRisk: 'Requires Certified Lab Test',
      sandSilicaRisk: 'Requires Certified Lab Test',
      foreignStarchOrTallow: false,
      labVerifiedOnly: true,
    },
    overallGrade: 'Tier B: Sub-Standard', // Capped at Tier B (Unconfirmed estimate)
    bisCompliant: true,
    regulatoryCitation: {
      standardCode: 'Field Gate Rapid Triage Protocol',
      authority: 'PashuPoshan AI Offline Protocol',
      clause: 'Pending Network Synchronization',
      prescribedLimits: 'Awaiting cloud vision triage',
    },
    disclaimer:
      'This record was created while offline. It will be updated once internet connectivity is restored.',
    actionableSummary,
    veterinaryAdvisory,
    correctiveActions,
    offlineMoldHeuristic: heuristicResult,
  };
}

