import { Locale, SUPPORTED_LANGUAGES, LanguageMeta } from './types';

import en from '../locales/en.json';
import hi from '../locales/hi.json';
import bn from '../locales/bn.json';
import te from '../locales/te.json';
import mr from '../locales/mr.json';
import ta from '../locales/ta.json';
import gu from '../locales/gu.json';
import kn from '../locales/kn.json';
import ml from '../locales/ml.json';
import pa from '../locales/pa.json';
import or_lang from '../locales/or.json';
import as_lang from '../locales/as.json';
import ur from '../locales/ur.json';
import sa from '../locales/sa.json';
import kok from '../locales/kok.json';
import mai from '../locales/mai.json';
import ne from '../locales/ne.json';
import ks from '../locales/ks.json';
import mni from '../locales/mni.json';
import sd from '../locales/sd.json';
import doi from '../locales/doi.json';
import brx from '../locales/brx.json';
import sat from '../locales/sat.json';

export const TRANSLATIONS: Record<string, Record<string, string>> = {
  en,
  hi,
  bn,
  te,
  mr,
  ta,
  gu,
  kn,
  ml,
  pa,
  or: or_lang,
  as: as_lang,
  ur,
  sa,
  kok,
  mai,
  ne,
  ks,
  mni,
  sd,
  doi,
  brx,
  sat,
};

// Dynamic registry for extensible state/regional variants in future
const dynamicLanguageRegistry: Map<string, LanguageMeta> = new Map(
  SUPPORTED_LANGUAGES.map((lang) => [lang.code, lang])
);

/**
 * Allows external modules or state cooperatives to register additional
 * Indian language variants or dialects (e.g. bhojpuri, marwari, tulu) dynamically.
 */
export function registerLocale(
  code: string,
  bundle: Record<string, string>,
  meta?: LanguageMeta
) {
  TRANSLATIONS[code] = { ...TRANSLATIONS['hi'], ...bundle };
  if (meta) {
    dynamicLanguageRegistry.set(code, meta);
  }
}

/**
 * Returns metadata (native script name, English name, text direction) for a given locale.
 */
export function getLanguageInfo(locale: Locale | string): LanguageMeta {
  return (
    dynamicLanguageRegistry.get(locale) || {
      code: (locale as Locale) || 'hi',
      nativeName: locale,
      englishName: locale,
      direction: 'ltr',
    }
  );
}

/**
 * Translates a UI key with multi-tiered fallback:
 * 1. Target locale
 * 2. Hindi fallback
 * 3. English fallback
 * 4. Raw key
 * Supports optional parameter interpolation: t('key', locale, { name: 'Gauri' })
 */
export function t(
  key: string,
  locale: Locale | string = 'en',
  params?: Record<string, string | number>
): string {
  let str =
    TRANSLATIONS[locale]?.[key] ||
    TRANSLATIONS['hi']?.[key] ||
    TRANSLATIONS['en']?.[key] ||
    key;

  if (params && typeof str === 'string') {
    for (const [paramKey, paramVal] of Object.entries(params)) {
      str = str.replace(new RegExp('{' + paramKey + '}', 'g'), String(paramVal));
    }
  }

  return str;
}

/**
 * Returns the appropriate BCP-47 locale tag for standard Date/Number formatting
 * across all 23 official Indian languages (e.g., 'hi-IN', 'bn-IN', 'ta-IN', 'en-IN').
 */
export function getBcp47Locale(locale: Locale | string): string {
  if (locale === 'en') return 'en-IN';
  return `${locale}-IN`;
}

/**
 * Returns a localized display name for feed sample names,
 * translating default system names into the farmer's chosen language.
 */
export function getSampleDisplayName(
  sample: { id?: string; name?: string; category?: string },
  locale: Locale | string
): string {
  const name = sample.name || '';
  const id = sample.id || '';

  if (id === 'sample_maize_silage_optimum' || name.includes('Hybrid Maize Silage')) {
    return t('sample.hybridMaizeSilage', locale);
  }
  if (id === 'sample_urea_adulterated_pellet' || name.includes('Commercial Dairy Pellet') || name.includes('Urea-Spiked')) {
    return t('sample.ureaAdulteratedPellet', locale);
  }
  if (id === 'sample_moldy_sorghum_silage' || name.includes('Sorghum Silage') || name.includes('Rain-Damaged')) {
    return t('sample.moldySorghumSilage', locale);
  }
  if (id === 'sample_borderline_concentrate' || name.includes('Compound Cattle Feed')) {
    return t('sample.borderlineConcentrate', locale);
  }
  if (name.includes('Unrecognized Sample') || sample.category === 'invalid') {
    return t('sample.unrecognized', locale);
  }

  // Triage naming patterns
  if (name.toLowerCase().includes('visual triage') || name.toLowerCase().includes('(visual triage)')) {
    if (sample.category === 'silage' || name.toLowerCase().includes('silage')) {
      return t('sample.silageVisual', locale);
    }
    if (sample.category === 'concentrate' || name.toLowerCase().includes('concentrate') || name.toLowerCase().includes('pellet')) {
      return t('sample.concentrateVisual', locale);
    }
    if (sample.category === 'green_fodder' || name.toLowerCase().includes('green')) {
      return t('sample.greenFodderVisual', locale);
    }
    if (sample.category === 'dry_fodder' || name.toLowerCase().includes('dry') || name.toLowerCase().includes('bhusa') || name.toLowerCase().includes('straw')) {
      return t('sample.dryFodderVisual', locale);
    }
  }

  return name;
}

/**
 * Translates actionable guidance bullet items from standard templates to the farmer's locale.
 */
export function getActionableAdviceText(actionText: string, locale: Locale | string): string {
  if (actionText.includes('Store fodder off damp floors')) {
    return t('score.actionStoreVentilated', locale);
  }
  if (actionText.includes('Verify nutritional adequacy') || actionText.includes('certified laboratory testing')) {
    return t('score.actionVerifyLab', locale);
  }
  if (actionText.includes('Discard mold-infested portions')) {
    return t('score.actionDiscardMold', locale);
  }
  if (actionText.includes('Take a composite sample') && actionText.includes('aflatoxin')) {
    return t('score.actionAflatoxinLab', locale);
  }
  if (actionText.includes('Inspect pit compaction')) {
    return t('score.actionInspectCompaction', locale);
  }
  if (actionText.includes('Visual screening appears sound')) {
    return t('score.advisoryVisualSound', locale);
  }
  if (actionText.includes('DO NOT FEED TO CATTLE') && actionText.includes('Visible fungal mold')) {
    return t('score.advisoryMoldHazard', locale);
  }
  if (actionText.includes('18-22 kg/day fresh weight')) {
    return t('score.actMaizeIntake', locale);
  }
  if (actionText.includes('Feed promptly after removal from pit face')) {
    return t('score.actMaizePromptFeed', locale);
  }
  if (actionText.includes('Combine with 1.5 - 2.0 kg wheat bhusa')) {
    return t('score.actMaizeScratchFactor', locale);
  }
  if (actionText.includes('bovine ammonia toxicity') || (actionText.includes('DO NOT FEED TO CATTLE') && actionText.includes('Spiked urea'))) {
    return t('score.actUreaToxicity', locale);
  }
  if (actionText.includes('High silica content') || actionText.includes('damages dental enamel')) {
    return t('score.actSilicaImpaction', locale);
  }
  if (actionText.includes('Dairy Cooperative Society (DCS) secretary')) {
    return t('score.actDcsAlert', locale);
  }
  if (actionText.includes('Discard the top 30-45 cm mold-infested crust')) {
    return t('score.actDiscardCrust', locale);
  }
  if (actionText.includes('High butyric acid induces ketosis')) {
    return t('score.actButyricKetosis', locale);
  }
  if (actionText.includes('Re-seal unaffected layers airtight')) {
    return t('score.actResealAirtight', locale);
  }
  if (actionText.includes('Feed is safe to consume but requires supplementary protein')) {
    return t('score.actProteinDeficit', locale);
  }
  if (actionText.includes('mustard cake (sarson khal)')) {
    return t('score.actMustardCakeBalance', locale);
  }
  if (actionText.includes('Request batch compliance certificate from feed merchant')) {
    return t('score.actMerchantCompliance', locale);
  }
  if (actionText.includes('Preserves optimal rumen environment without metabolic disruption')) {
    return t('score.advRumenSafe', locale);
  }
  if (actionText.includes('Aflatoxin B1 passes into cow milk as Aflatoxin M1')) {
    return t('score.advAflatoxinM1Hazard', locale);
  }
  if (actionText.includes('The crude protein content is 19.8%')) {
    return t('score.advSuboptimalProtein', locale);
  }
  if (actionText.includes('National Animal Disease Emergency Helpline: 1962') || actionText.includes('acute cattle illness')) {
    return t('score.advEmergencyHelpline', locale);
  }
  return actionText;
}

/**
 * Localizes preset Silage bunker / pit names.
 */
export function getSilagePitDisplayName(pitName: string, locale: Locale | string): string {
  if (pitName.includes('Main Bunker Pit #1') || pitName.includes('Hybrid Maize')) {
    return `${t('silage.bunkerName', locale)} #1 (${t('score.cropMaize', locale)})`;
  }
  if (pitName.includes('Trench Silo #2') || pitName.includes('Sweet Sorghum')) {
    return `${t('silage.bunkerName', locale)} #2 (${t('score.cropSorghum', locale)})`;
  }
  return pitName;
}

/**
 * Localizes silage status labels.
 */
export function getSilageStatusText(status: string, locale: Locale | string): string {
  if (status === 'Ready to Feed') return t('silage.status.ready', locale);
  if (status === 'Fermenting') return t('silage.status.fermenting', locale);
  if (status === 'Aerobic Heating Risk') return t('silage.status.heatingRisk', locale);
  if (status === 'Spoiled Pit') return t('silage.status.spoiled', locale);
  return status;
}

/**
 * Localizes compaction rating labels.
 */
export function getCompactionRatingText(rating: string, locale: Locale | string): string {
  if (rating.includes('Optimum')) return t('silage.compaction.optimum', locale);
  if (rating.includes('Moderate')) return t('silage.compaction.moderate', locale);
  if (rating.includes('Loose') || rating.includes('Air-Pockets')) return t('silage.compaction.loose', locale);
  return rating;
}

/**
 * Localizes Flieg score grades.
 */
export function getFliegGradeText(grade: string, locale: Locale | string): string {
  if (grade === 'Excellent') return t('score.gradeExcellent', locale);
  if (grade === 'Good') return t('score.gradeGood', locale);
  if (grade === 'Fair') return t('score.gradeFair', locale);
  if (grade === 'Poor') return t('score.gradePoor', locale);
  if (grade === 'Very Poor') return t('score.gradeVeryPoor', locale);
  return grade;
}

/**
 * Localizes silage fermentation acid types.
 */
export function getSilageAcidText(acid: string, locale: Locale | string): string {
  if (acid.includes('Lactic')) return t('score.acidLactic', locale);
  if (acid.includes('Acetic')) return t('score.acidAcetic', locale);
  if (acid.includes('Butyric')) return t('score.acidButyric', locale);
  return acid;
}

/**
 * Localizes crop types.
 */
export function getCropDisplayName(crop: string, locale: Locale | string): string {
  if (crop === 'Maize') return t('score.cropMaize', locale);
  if (crop === 'Sorghum') return t('score.cropSorghum', locale);
  if (crop.includes('Bajra') || crop.includes('Pearl Millet')) return t('score.cropBajra', locale);
  if (crop === 'Oats') return t('score.cropOats', locale);
  return crop;
}

/**
 * Localizes overall Tier classification grades.
 */
export function getTierClassificationText(grade: string, locale: Locale | string): string {
  if (grade.includes('Tier A')) return t('score.tierASafe', locale);
  if (grade.includes('Tier B')) return t('score.tierBFair', locale);
  if (grade.includes('Tier C')) return t('score.tierCDanger', locale);
  return grade;
}

/**
 * Localizes sand & silica risk messages.
 */
export function getSandRiskText(risk: string | undefined, locale: Locale | string): string {
  if (!risk) return '';
  if (risk.includes('Critical')) return t('score.riskSandCritical', locale);
  if (risk.includes('Within') || risk.includes('Safe')) return t('score.riskSandLow', locale);
  return risk;
}

/**
 * Localizes aflatoxin / mycotoxin risk messages.
 */
export function getAflatoxinRiskText(risk: string | undefined, locale: Locale | string): string {
  if (!risk) return '';
  if (risk.includes('Hazardous')) return t('score.riskAflatoxinHazardous', locale);
  if (risk.includes('Moderate')) return t('score.riskAflatoxinModerate', locale);
  if (risk.includes('Safe')) return t('score.riskAflatoxinSafe', locale);
  return risk;
}

/**
 * Localizes cattle names (e.g. Lakshmi, Ganga, Yamuna).
 */
export function getCowDisplayName(
  cowOrName: string | { name?: string; id?: string } | undefined | null,
  locale: Locale | string
): string {
  if (!cowOrName) return '';
  const rawName = typeof cowOrName === 'string' ? cowOrName : (cowOrName.name || '');
  if (!rawName) return '';

  const clean = rawName.split(' ')[0].toLowerCase().trim();
  if (clean.includes('lakshmi') || clean.includes('laxmi')) {
    return t('cattle.lakshmi', locale);
  }
  if (clean.includes('ganga')) {
    return t('cattle.ganga', locale);
  }
  if (clean.includes('yamuna')) {
    return t('cattle.yamuna', locale);
  }
  return rawName.split(' ')[0];
}

/**
 * Localizes cattle breeds (e.g. Gir, Sahiwal, Red Sindhi, HF Crossbred, Murrah Buffalo).
 */
export function getCowBreedDisplayName(breed: string | undefined | null, locale: Locale | string): string {
  if (!breed) return '';
  const b = breed.toLowerCase().trim();
  if (b.includes('gir') || b.includes('गीर')) {
    return t('cattle.gir', locale);
  }
  if (b.includes('sahiwal') || b.includes('साहीवाल')) {
    return t('cattle.sahiwal', locale);
  }
  if (b.includes('red sindhi') || b.includes('सिंधी')) {
    return t('cattle.redSindhi', locale);
  }
  if (b.includes('hf') || b.includes('holstein') || b.includes('crossbred') || b.includes('संकर')) {
    return t('cattle.hfCrossbred', locale);
  }
  if (b.includes('jersey') || b.includes('जर्सी')) {
    return t('cattle.jerseyCross', locale);
  }
  if (b.includes('murrah') || b.includes('buffalo') || b.includes('मुर्रा') || b.includes('भैंस')) {
    return t('cattle.murrahBuffalo', locale);
  }
  return breed;
}

/**
 * Localizes feed categories.
 */
export function getFeedCategoryDisplayName(category: string | undefined | null, locale: Locale | string): string {
  if (!category) return '';
  const c = category.toLowerCase().replace(/[\s_-]+/g, '_');
  if (c.includes('silage')) return t('category.silage', locale);
  if (c.includes('concentrate') || c.includes('pellet')) return t('category.concentrate', locale);
  if (c.includes('green')) return t('category.green_fodder', locale);
  if (c.includes('dry') || c.includes('bhusa') || c.includes('straw')) return t('category.dry_fodder', locale);
  return category;
}

