import { describe, it, expect } from 'vitest';
import { SUPPORTED_LOCALES, isSupportedLocale, Locale } from '../lib/types';

describe('Locale Persistence & Validation', () => {
  it('contains all 5 official supported regional locales', () => {
    expect(SUPPORTED_LOCALES).toEqual(['en', 'hi', 'mr', 'gu', 'pa']);
  });

  it('validates that Marathi (mr) and Gujarati (gu) are recognized as supported locales', () => {
    expect(isSupportedLocale('mr')).toBe(true);
    expect(isSupportedLocale('gu')).toBe(true);
    expect(isSupportedLocale('hi')).toBe(true);
    expect(isSupportedLocale('en')).toBe(true);
    expect(isSupportedLocale('pa')).toBe(true);
  });

  it('rejects unsupported languages and non-string values', () => {
    expect(isSupportedLocale('fr')).toBe(false);
    expect(isSupportedLocale('de')).toBe(false);
    expect(isSupportedLocale('')).toBe(false);
    expect(isSupportedLocale(null)).toBe(false);
    expect(isSupportedLocale(undefined)).toBe(false);
    expect(isSupportedLocale(123)).toBe(false);
  });

  it('correctly retrieves saved Marathi (mr) and Gujarati (gu) from simulated localStorage', () => {
    function resolveInitialLocale(storedValue: string | null): Locale {
      if (isSupportedLocale(storedValue)) {
        return storedValue;
      }
      return 'hi';
    }

    // Marathi user reload
    expect(resolveInitialLocale('mr')).toBe('mr');

    // Gujarati user reload
    expect(resolveInitialLocale('gu')).toBe('gu');

    // Hindi, English, Punjabi user reload
    expect(resolveInitialLocale('hi')).toBe('hi');
    expect(resolveInitialLocale('en')).toBe('en');
    expect(resolveInitialLocale('pa')).toBe('pa');

    // Invalid or missing values fallback to Hindi default
    expect(resolveInitialLocale('invalid_lang')).toBe('hi');
    expect(resolveInitialLocale(null)).toBe('hi');
  });
});
