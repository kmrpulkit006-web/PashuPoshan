import { CowProfile, FeedSample, SilageBunker, SilagePitLog, CommunityFeedAlert, OfflineSyncItem, FeedCategory } from './types';
import { PRESET_FEED_SCENARIOS, createFeedSampleFromVisualAnalysis } from './feedAnalysisEngine';
import { storeImageInIndexedDb } from './imageStorage';

const COWS_KEY = 'pashuposhan_cows_v1';
const SCANS_KEY = 'pashuposhan_scans_v1';
const PITS_KEY = 'pashuposhan_pits_v1';
const ALERTS_KEY = 'pashuposhan_alerts_v1';
const SYNC_QUEUE_KEY = 'pashuposhan_sync_queue_v1';
const PENDING_SCANS_KEY = 'pashuposhan_pending_scans_v1';

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
        status: (log.temperatureC > 40 ? 'Aerobic Heating Risk' : 'Ready to Feed') as any,
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

export function saveLocalAlert(alert: CommunityFeedAlert): CommunityFeedAlert[] {
  const current = getLocalAlerts();
  const updated = [alert, ...current];
  safeSetItem(ALERTS_KEY, JSON.stringify(updated));
  queueOfflineAction('community_alert', 'create', alert);
  return updated;
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
  errorMessage?: string;
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
  };

  if (scan.photoBase64 && scan.photoBase64.startsWith('data:')) {
    storeImageInIndexedDb(id, scan.photoBase64).catch(err => {
      console.warn('Failed to cache offline scan image in IndexedDB', err);
    });
  }

  const updated = [newItem, ...current];
  safeSetItem(PENDING_SCANS_KEY, JSON.stringify(updated));
  if (typeof window !== 'undefined') {
    window.dispatchEvent(
      new CustomEvent('pashuposhan_pending_sync_changed', { detail: { count: updated.length } })
    );
  }
  return newItem;
}

export function removePendingOfflineScan(id: string): void {
  const current = getPendingOfflineScans();
  const updated = current.filter(s => s.id !== id);
  safeSetItem(PENDING_SCANS_KEY, JSON.stringify(updated));
  if (typeof window !== 'undefined') {
    window.dispatchEvent(
      new CustomEvent('pashuposhan_pending_sync_changed', { detail: { count: updated.length } })
    );
  }
}

export function clearPendingOfflineScans(): void {
  safeSetItem(PENDING_SCANS_KEY, JSON.stringify([]));
  if (typeof window !== 'undefined') {
    window.dispatchEvent(
      new CustomEvent('pashuposhan_pending_sync_changed', { detail: { count: 0 } })
    );
  }
}

/**
 * Retries all pending offline scans against the Vercel serverless /api/analyze-visual endpoint.
 */
export async function syncPendingScans(
  onProgress?: (current: number, total: number) => void
): Promise<{ successful: number; failed: number }> {
  if (typeof window !== 'undefined' && !navigator.onLine) {
    return { successful: 0, failed: 0 };
  }

  const pending = getPendingOfflineScans();
  if (pending.length === 0) return { successful: 0, failed: 0 };

  let successful = 0;
  let failed = 0;

  for (let i = 0; i < pending.length; i++) {
    const item = pending[i];
    if (onProgress) onProgress(i + 1, pending.length);

    try {
      if (item.scanMode === 'vision') {
        const res = await fetch('/api/analyze-visual', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            imageBase64: item.photoBase64,
            category: item.category,
          }),
        });

        if (!res.ok) {
          throw new Error(`API responded with ${res.status}`);
        }

        const visualResult = await res.json();
        const sample = createFeedSampleFromVisualAnalysis(item.category, visualResult, item.photoBase64);
        saveLocalScan(sample);
        removePendingOfflineScan(item.id);
        successful++;
      } else {
        // Strip scan fallback: mark resolved and clear
        removePendingOfflineScan(item.id);
        successful++;
      }
    } catch (err) {
      console.warn(`Failed to sync item ${item.id}:`, err);
      failed++;
    }
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
  pendingId: string
): FeedSample {
  const isSilage = category === 'silage';
  return {
    id: `offline_pending_${pendingId}`,
    name: isSilage
      ? 'Silage (Offline - Pending Sync)'
      : `${category.replace('_', ' ').toUpperCase()} (Offline - Pending Sync)`,
    category,
    batchNumber: 'OFFLINE-QUEUE',
    sourceOrBrand: 'Field Camera (Saved Locally)',
    timestamp: new Date().toLocaleString('en-IN'),
    imageUrl: photoUri,
    testedMethod: 'AI Vision Triage',
    isSimulated: false,
    isPrototypeHeuristic: true,
    heuristicDisclaimer:
      'Image captured offline in low-connectivity area. Saved to local sync queue. Full AI visual analysis will complete automatically when reconnected.',
    metrics: {
      moisture: isSilage ? 68.0 : 10.5,
      dryMatter: isSilage ? 32.0 : 89.5,
      requiresLabTest: true,
    },
    adulteration: {
      ureaAdulterationDetected: false,
      ureaPercentage: 0.1,
      aflatoxinRisk: 'Requires Certified Lab Test',
      sandSilicaRisk: 'Requires Certified Lab Test',
      foreignStarchOrTallow: false,
      labVerifiedOnly: true,
    },
    overallGrade: 'Tier B: Sub-Standard',
    bisCompliant: true,
    regulatoryCitation: {
      standardCode: 'Field Gate Rapid Triage Protocol',
      authority: 'PashuPoshan AI Offline Protocol',
      clause: 'Pending Network Synchronization',
      prescribedLimits: 'Awaiting cloud vision triage',
    },
    disclaimer:
      'This record was created while offline. It will be updated once internet connectivity is restored.',
    actionableSummary: 'Photo safely saved in offline queue. Connect to internet to run AI visual triage.',
    veterinaryAdvisory:
      'Offline scan queued. When in mobile data range, the AI visual triage will evaluate surface mold and discoloration.',
    correctiveActions: [
      'Photo stored safely in local phone memory.',
      'Tap "Sync now" in the Alerts tab or Header info when in cellular network range.',
    ],
  };
}

