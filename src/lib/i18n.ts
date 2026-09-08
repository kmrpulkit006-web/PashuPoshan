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
  if (name.includes('(Visual Triage)')) {
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
  return actionText;
}
