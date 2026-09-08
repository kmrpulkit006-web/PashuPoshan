import { Locale } from './types';
import { t } from './i18n';

/**
 * Maps technical errors, HTTP status codes, API payloads, and exceptions
 * into empathetic, farmer-friendly human language across all 23 supported Indian languages.
 *
 * Examples:
 * BAD:  "HTTP 500: Internal Server Error"
 * GOOD: "Something went wrong. Please try again."
 *
 * BAD:  "Invalid image payload"
 * GOOD: "We couldn't read this photo. Please take another clear photo."
 */
export function toHumanErrorMessage(error: unknown, locale: Locale = 'en'): string {
  if (!error) {
    return t('error.somethingWrong', locale);
  }

  const rawMsg = (
    typeof error === 'string'
      ? error
      : (error as any)?.message || (error as any)?.error || String(error)
  ).trim();

  const lower = rawMsg.toLowerCase();

  // 1. File size & invalid file type
  if (lower.includes('file too large') || lower.includes('too large') || lower.includes('15mb')) {
    return t('error.fileTooLarge', locale);
  }
  if (lower.includes('invalid_image_type') || lower.includes('not an image') || lower.includes('invalid image file')) {
    return t('error.invalidImageFile', locale);
  }

  // 2. Image and photo reading issues
  if (
    lower.includes('payload') ||
    lower.includes('invalid image') ||
    lower.includes('truncated') ||
    lower.includes('too small') ||
    lower.includes('decode failed') ||
    lower.includes('unable to read selected file') ||
    lower.includes('cannot read') ||
    lower.includes('corrupt') ||
    lower.includes('unreadable') ||
    lower.includes('missing or invalid "imagebase64"') ||
    lower.includes('not_feed_or_fodder')
  ) {
    return t('error.photoUnclear', locale);
  }

  // 2. Camera access and permissions
  if (
    lower.includes('permission') ||
    lower.includes('notallowederror') ||
    lower.includes('denied')
  ) {
    return t('error.cameraPermission', locale);
  }

  if (
    lower.includes('notfounderror') ||
    lower.includes('devicesnotfound') ||
    lower.includes('no camera')
  ) {
    return t('error.noCamera', locale);
  }

  if (lower.includes('notreadableerror') || lower.includes('busy')) {
    return t('error.cameraPermission', locale);
  }

  // 3. Network and offline connectivity
  if (
    lower.includes('offline') ||
    lower.includes('network') ||
    lower.includes('failed to fetch') ||
    lower.includes('internet') ||
    lower.includes('enotfound') ||
    lower.includes('econnrefused') ||
    lower.includes('timed out') ||
    lower.includes('timeout')
  ) {
    return t('error.networkOffline', locale);
  }

  // 4. Rate limiting / Too many requests
  if (lower.includes('rate limit') || lower.includes('429') || lower.includes('too many requests')) {
    return t('error.serverBusy', locale);
  }

  // 5. Server errors (500, 502, 503, Internal Server Error, etc.)
  if (
    lower.includes('500') ||
    lower.includes('502') ||
    lower.includes('503') ||
    lower.includes('internal server error') ||
    lower.includes('server error') ||
    lower.includes('bad gateway') ||
    lower.includes('service unavailable') ||
    lower.includes('malformed') ||
    lower.includes('json') ||
    lower.includes('syntaxerror')
  ) {
    return t('error.somethingWrong', locale);
  }

  // Default friendly fallback
  return t('error.somethingWrong', locale);
}
