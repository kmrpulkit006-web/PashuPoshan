import { FliegGrade } from './types';

/**
 * Standard Flieg's Score Calculation for Silage Quality:
 * Flieg Score = 220 + (2 * DryMatter% - 15) - 40 * pH
 * 
 * Flieg Score ranges:
 * 81 - 100: Excellent (Lactic dominant, sweet pleasant aroma, pH < 4.2)
 * 61 - 80:  Good (Normal fermentation, low butyric acid)
 * 41 - 60:  Medium (Fair fermentation, some nutrient loss)
 * 21 - 40:  Poor (High butyric acid, unpalatable to cows, secondary fermentation)
 * 0 - 20:   Very Bad (Spoiled, putrid smell, lethal clostridial risk)
 */
export function calculateFliegScore(pH: number, dryMatterPct: number): {
  score: number;
  grade: FliegGrade;
  lacticAcidPct: number;
  butyricAcidRisk: string;
  description: string;
} {
  // Constrain parameters to realistic boundaries
  const clampedPh = Math.max(3.2, Math.min(6.5, pH));
  const clampedDm = Math.max(15, Math.min(50, dryMatterPct));

  let score = 220 + (2 * clampedDm - 15) - (40 * clampedPh);
  score = Math.max(0, Math.min(100, Math.round(score)));

  let grade: FliegGrade = 'Medium';
  let lacticAcidPct = 5.5;
  let butyricAcidRisk = 'Negligible (<0.1%)';
  let description = '';

  if (score >= 81) {
    grade = 'Excellent';
    lacticAcidPct = 7.5;
    butyricAcidRisk = 'None detected (Pure lactic fermentation)';
    description = 'Superior quality silage. Optimal pH preserves all digestible energy and crude protein with zero mould risk.';
  } else if (score >= 61) {
    grade = 'Good';
    lacticAcidPct = 5.2;
    butyricAcidRisk = 'Very low (<0.2%)';
    description = 'Good fermentation. Stable for feeding, cows will consume eagerly with high dry matter intake.';
  } else if (score >= 41) {
    grade = 'Medium';
    lacticAcidPct = 3.5;
    butyricAcidRisk = 'Moderate (0.3% - 0.5%)';
    description = 'Average silage. Slight ammonia smell detected. Ensure gradual feeding and check for bunker heating.';
  } else if (score >= 21) {
    grade = 'Poor';
    lacticAcidPct = 1.8;
    butyricAcidRisk = 'High (>0.8% - Butyric Clostridia active)';
    description = 'Poor fermentation caused by wet crop or loose packing. Stems smell rancid. Limit intake to avoid bovine ketosis.';
  } else {
    grade = 'Very Bad';
    lacticAcidPct = 0.5;
    butyricAcidRisk = 'Severe (>1.5% - Toxic Putrefaction)';
    description = 'Completely spoiled. High mycotoxin, fungal mold, and listeria hazard. DO NOT feed to pregnant or high-yielding cattle.';
  }

  return {
    score,
    grade,
    lacticAcidPct,
    butyricAcidRisk,
    description,
  };
}
