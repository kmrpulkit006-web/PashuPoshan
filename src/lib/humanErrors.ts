import { Locale } from './types';

/**
 * Maps technical errors, HTTP status codes, API payloads, and exceptions
 * into empathetic, farmer-friendly human language.
 *
 * Examples:
 * BAD:  "HTTP 500: Internal Server Error"
 * GOOD: "Something went wrong. Please try again."
 *
 * BAD:  "Invalid image payload"
 * GOOD: "We couldn't read this photo. Please take another clear photo."
 */
export function toHumanErrorMessage(error: unknown, locale: Locale = 'en'): string {
  const isHindi = locale === 'hi';
  
  if (!error) {
    return isHindi
      ? 'कुछ गलत हो गया। कृपया पुनः प्रयास करें।'
      : 'Something went wrong. Please try again.';
  }

  const rawMsg = (
    typeof error === 'string'
      ? error
      : (error as any)?.message || (error as any)?.error || String(error)
  ).trim();

  const lower = rawMsg.toLowerCase();

  // 1. Image and photo reading issues
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
    return isHindi
      ? 'हम इस फोटो को पढ़ नहीं सके। कृपया चारे की दूसरी साफ फोटो लें।'
      : "We couldn't read this photo. Please take another clear photo.";
  }

  // 2. Camera access and permissions
  if (
    lower.includes('permission') ||
    lower.includes('notallowederror') ||
    lower.includes('denied')
  ) {
    return isHindi
      ? 'चारे की फोटो खींचने के लिए कैमरे की अनुमति आवश्यक है। कृपया कैमरा चालू करें।'
      : 'Camera permission is needed to take a photo of your feed. Please allow camera access.';
  }

  if (
    lower.includes('notfounderror') ||
    lower.includes('devicesnotfound') ||
    lower.includes('no camera')
  ) {
    return isHindi
      ? 'फोन का कैमरा नहीं मिला। आप गैलरी से भी फोटो चुन सकते हैं।'
      : 'No camera found on this device. You can select a photo from your gallery.';
  }

  if (lower.includes('notreadableerror') || lower.includes('busy')) {
    return isHindi
      ? 'कैमरा किसी अन्य ऐप में व्यस्त है। कृपया बाकी ऐप बंद करके पुनः प्रयास करें।'
      : 'Camera is currently busy in another app. Please close other apps and try again.';
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
    return isHindi
      ? 'इंटरनेट धीमा है या बंद है। आपकी जांच फ़ोन में सुरक्षित सहेज ली गई है।'
      : 'Internet connection is weak or unavailable. Your test has been saved safely on your phone.';
  }

  // 4. Rate limiting / Too many requests
  if (lower.includes('rate limit') || lower.includes('429') || lower.includes('too many requests')) {
    return isHindi
      ? 'कृपया कुछ पल रुककर दोबारा कोशिश करें।'
      : 'Please wait a moment and try again.';
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
    return isHindi
      ? 'कुछ गलत हो गया। कृपया पुनः प्रयास करें।'
      : 'Something went wrong. Please try again.';
  }

  // Default friendly fallback
  return isHindi
    ? 'कुछ गलत हो गया। कृपया पुनः प्रयास करें।'
    : 'Something went wrong. Please try again.';
}
