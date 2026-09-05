import { useState, useEffect } from 'react';
import { CowProfile, FeedSample } from '../lib/types';
import { calculatePrecisionRation } from '../lib/rationBalancing';
import { getLocalCows, saveLocalCow, deleteLocalCow } from '../lib/storage';

interface UseRationManagerProps {
  activeSample?: FeedSample;
}

export function useRationManager({ activeSample }: UseRationManagerProps) {
  const [cows, setCows] = useState<CowProfile[]>([]);
  const [selectedCowId, setSelectedCowId] = useState<string>('');
  const [dailyYield, setDailyYield] = useState<number>(12);
  const [cowWeight, setCowWeight] = useState<number>(380);

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

  const currentCowProfile: CowProfile = activeCow
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

  const rationPlan = calculatePrecisionRation(currentCowProfile, {
    greenFreshKg,
    dryFreshKg,
    concFreshKg,
    activeSample,
  });

  const handleSelectCow = (cow: CowProfile) => {
    setSelectedCowId(cow.id);
    setDailyYield(cow.dailyMilkYieldLiters);
    setCowWeight(cow.weightKg);
  };

  const handleSaveCow = (newCow: CowProfile) => {
    const updated = saveLocalCow(newCow);
    setCows(updated);
    setSelectedCowId(newCow.id);
    setDailyYield(newCow.dailyMilkYieldLiters);
    setCowWeight(newCow.weightKg);
  };

  const handleDeleteCow = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (cows.length <= 1) {
      alert('You must have at least one cattle profile in your herd.');
      return;
    }
    const updated = deleteLocalCow(id);
    setCows(updated);
    if (selectedCowId === id) {
      setSelectedCowId(updated[0].id);
      setDailyYield(updated[0].dailyMilkYieldLiters);
      setCowWeight(updated[0].weightKg);
    }
  };

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
    handleSelectCow,
    handleSaveCow,
    handleDeleteCow,
  };
}
