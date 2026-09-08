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
