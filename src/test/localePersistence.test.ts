import { describe, it, expect } from 'vitest';
import { SUPPORTED_LOCALES, isSupportedLocale, Locale } from '../lib/types';
import { t, getLanguageInfo, registerLocale } from '../lib/i18n';

describe('Locale Persistence & Validation', () => {
  it('contains all 23 official Eighth Schedule and English supported locales', () => {
    expect(SUPPORTED_LOCALES.length).toBe(23);
    const expectedLocales: Locale[] = [
      'hi', 'en', 'bn', 'te', 'mr', 'ta', 'gu', 'kn', 'ml', 'pa',
      'or', 'as', 'ur', 'sa', 'kok', 'mai', 'ne', 'ks', 'mni', 'sd',
      'doi', 'brx', 'sat',
    ];
    expect(SUPPORTED_LOCALES).toEqual(expectedLocales);
  });

  it('validates all 23 major Indian regional languages are recognized as supported locales', () => {
    const testLocales: Locale[] = [
      'hi', 'en', 'bn', 'te', 'mr', 'ta', 'gu', 'kn', 'ml', 'pa',
      'or', 'as', 'ur', 'sa', 'kok', 'mai', 'ne', 'ks', 'mni', 'sd',
      'doi', 'brx', 'sat',
    ];
    for (const loc of testLocales) {
      expect(isSupportedLocale(loc)).toBe(true);
    }
  });

  it('rejects unsupported languages and non-string values', () => {
    expect(isSupportedLocale('fr')).toBe(false);
    expect(isSupportedLocale('de')).toBe(false);
    expect(isSupportedLocale('es')).toBe(false);
    expect(isSupportedLocale('')).toBe(false);
    expect(isSupportedLocale(null)).toBe(false);
    expect(isSupportedLocale(undefined)).toBe(false);
    expect(isSupportedLocale(123)).toBe(false);
  });

  it('correctly retrieves saved regional languages from simulated localStorage', () => {
    function resolveInitialLocale(storedValue: string | null): Locale {
      if (isSupportedLocale(storedValue)) {
        return storedValue;
      }
      return 'hi';
    }

    // Regional language user reload tests
    expect(resolveInitialLocale('mr')).toBe('mr');
    expect(resolveInitialLocale('gu')).toBe('gu');
    expect(resolveInitialLocale('bn')).toBe('bn');
    expect(resolveInitialLocale('te')).toBe('te');
    expect(resolveInitialLocale('ta')).toBe('ta');
    expect(resolveInitialLocale('kn')).toBe('kn');
    expect(resolveInitialLocale('ml')).toBe('ml');
    expect(resolveInitialLocale('pa')).toBe('pa');
    expect(resolveInitialLocale('or')).toBe('or');
    expect(resolveInitialLocale('as')).toBe('as');
    expect(resolveInitialLocale('ur')).toBe('ur');
    expect(resolveInitialLocale('sa')).toBe('sa');
    expect(resolveInitialLocale('sat')).toBe('sat');

    // Invalid or missing values fallback to Hindi default
    expect(resolveInitialLocale('invalid_lang')).toBe('hi');
    expect(resolveInitialLocale(null)).toBe('hi');
  });

  it('verifies RTL direction metadata for Urdu, Kashmiri, and Sindhi', () => {
    expect(getLanguageInfo('ur').direction).toBe('rtl');
    expect(getLanguageInfo('ks').direction).toBe('rtl');
    expect(getLanguageInfo('sd').direction).toBe('rtl');

    expect(getLanguageInfo('hi').direction).toBe('ltr');
    expect(getLanguageInfo('en').direction).toBe('ltr');
    expect(getLanguageInfo('bn').direction).toBe('ltr');
    expect(getLanguageInfo('ta').direction).toBe('ltr');
  });

  it('translates strings across multiple Indian regional languages using centralized engine', () => {
    expect(t('app.name', 'hi')).toBe('पशुपोषण');
    expect(t('app.name', 'en')).toBe('PashuPoshan');
    expect(t('app.name', 'mr')).toBe('पशुपोषण');
    expect(t('app.name', 'bn')).toBe('পশুপোষণ');
    expect(t('app.name', 'ta')).toBe('பசுபோஷன்');
    expect(t('app.name', 'te')).toBe('పశుపోషణ్');

    expect(t('nav.scan', 'hi')).toBe('चारा जांचें');
    expect(t('nav.scan', 'en')).toBe('Check Feed');
    expect(t('nav.scan', 'pa')).toBe('ਚਾਰਾ ਪਰਖੋ');
    expect(t('nav.scan', 'gu')).toBe('ઘાસચારો તપાસો');
  });

  it('supports runtime dynamic registration of regional dialects and variants', () => {
    // Register Bhojpuri regional dialect variant
    registerLocale(
      'bho',
      {
        'app.name': 'पशुपोषण (भोजपुरी)',
        'nav.scan': 'जांच करीं',
      },
      {
        code: 'bho',
        englishName: 'Bhojpuri',
        nativeName: 'भोजपुरी',
        direction: 'ltr',
      }
    );

    expect(t('app.name', 'bho' as any)).toBe('पशुपोषण (भोजपुरी)');
    expect(t('nav.scan', 'bho' as any)).toBe('जांच करीं');
    // Cascading fallback to Hindi for untranslated keys
    expect(t('score.disclaimerTitle', 'bho' as any)).toBe('जरूरी किसान सूचना');
    expect(getLanguageInfo('bho' as any).nativeName).toBe('भोजपुरी');
  });
});
