import { useState, useEffect, useMemo, useCallback } from 'react';
import { CowProfile, FeedSample, Locale } from '../lib/types';
import { calculatePrecisionRation } from '../lib/rationBalancing';
import { getLocalCows, saveLocalCow, deleteLocalCow } from '../lib/storage';
import { t, getCowDisplayName } from '../lib/i18n';

export interface RationNotice {
  title: string;
  message: string;
  isConfirm?: boolean;
  onConfirm?: () => void;
  onCancel?: () => void;
}

interface UseRationManagerProps {
  activeSample?: FeedSample;
  locale?: Locale;
}

export function useRationManager({ activeSample, locale }: UseRationManagerProps) {
  const [cows, setCows] = useState<CowProfile[]>([]);
  const [selectedCowId, setSelectedCowId] = useState<string>('');
  const [dailyYield, setDailyYield] = useState<number>(12);
  const [cowWeight, setCowWeight] = useState<number>(380);
  const [rationNotice, setRationNotice] = useState<RationNotice | null>(null);

  // Custom ingredient fresh weights
  const [greenFreshKg, setGreenFreshKg] = useState<number | undefined>(undefined);
  const [dryFreshKg, setDryFreshKg] = useState<number | undefined>(undefined);
  const [concFreshKg, setConcFreshKg] = useState<number | undefined>(undefined);

  useEffect(() => {
    const loaded = getLocalCows();
    setCows(loaded);
    if (loaded.length > 0) {
      setSelectedCowId(loaded[0].id);
      setDailyYield(loaded[0].dailyMilkYieldLiters);
      setCowWeight(loaded[0].weightKg);
    }
  }, []);

  const activeCow = cows.find((c) => c.id === selectedCowId) || cows[0];

  const currentCowProfile: CowProfile = useMemo(() => {
    return activeCow
      ? {
          ...activeCow,
          weightKg: cowWeight,
          dailyMilkYieldLiters: dailyYield,
        }
      : {
          id: 'default_cow',
          tagNumber: 'INAPH-0000',
          name: 'Sample Cow',
          breed: 'Gir',
          weightKg: cowWeight,
          lactationStage: 'Early (0-90 days)',
          dailyMilkYieldLiters: dailyYield,
          milkFatPct: 4.5,
        };
  }, [activeCow, cowWeight, dailyYield]);

  const rationPlan = useMemo(() => {
    return calculatePrecisionRation(currentCowProfile, {
      greenFreshKg,
      dryFreshKg,
      concFreshKg,
      activeSample,
    });
  }, [currentCowProfile, greenFreshKg, dryFreshKg, concFreshKg, activeSample]);

  const handleSelectCow = useCallback((cow: CowProfile) => {
    setSelectedCowId(cow.id);
    setDailyYield(cow.dailyMilkYieldLiters);
    setCowWeight(cow.weightKg);
  }, []);

  const handleSaveCow = useCallback((newCow: CowProfile) => {
    const updated = saveLocalCow(newCow);
    setCows(updated);
    setSelectedCowId(newCow.id);
    setDailyYield(newCow.dailyMilkYieldLiters);
    setCowWeight(newCow.weightKg);
  }, []);

  const confirmDelete = useCallback((id: string) => {
    const updated = deleteLocalCow(id);
    setCows(updated);
    if (selectedCowId === id && updated.length > 0) {
      setSelectedCowId(updated[0].id);
      setDailyYield(updated[0].dailyMilkYieldLiters);
      setCowWeight(updated[0].weightKg);
    }
    setRationNotice(null);
  }, [selectedCowId]);

  const handleDeleteCow = useCallback((id: string, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    const loc = locale || 'hi';
    if (cows.length <= 1) {
      setRationNotice({
        title: t('common.notice', loc) || 'Notice',
        message: t('ration.minOneCowNotice', loc) || 'You must have at least one cattle profile in your herd.',
      });
      return;
    }
    const targetCow = cows.find(c => c.id === id);
    const cowName = targetCow ? getCowDisplayName(targetCow, loc) : 'this cattle';
    setRationNotice({
      title: t('history.deleteConfirmTitle', loc) || 'Remove Cattle Profile',
      message: t('history.deleteConfirmMsg', loc, { name: cowName }) || `Are you sure you want to remove ${cowName} from your herd?`,
      isConfirm: true,
      onConfirm: () => confirmDelete(id),
      onCancel: () => setRationNotice(null),
    });
  }, [cows, confirmDelete, locale]);

  return {
    cows,
    selectedCowId,
    dailyYield,
    setDailyYield,
    cowWeight,
    setCowWeight,
    greenFreshKg,
    setGreenFreshKg,
    dryFreshKg,
    setDryFreshKg,
    concFreshKg,
    setConcFreshKg,
    currentCowProfile,
    rationPlan,
    rationNotice,
    setRationNotice,
    handleSelectCow,
    handleSaveCow,
    handleDeleteCow,
  };
}
