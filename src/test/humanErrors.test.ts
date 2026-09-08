import { describe, it, expect } from 'vitest';
import { toHumanErrorMessage } from '../lib/humanErrors';

describe('Human Error Translator', () => {
  it('translates HTTP 500 and internal server error into human language', () => {
    expect(toHumanErrorMessage('HTTP 500: Internal Server Error')).toBe(
      'Something went wrong. Please try again.'
    );
    expect(toHumanErrorMessage('Server responded with 500')).toBe(
      'Something went wrong. Please try again.'
    );
    expect(toHumanErrorMessage(new Error('Internal server error during visual analysis.'))).toBe(
      'Something went wrong. Please try again.'
    );
    expect(toHumanErrorMessage('503 Service Unavailable')).toBe(
      'Something went wrong. Please try again.'
    );
  });

  it('translates image payload and unreadable photo errors into human language', () => {
    expect(toHumanErrorMessage('Invalid image payload')).toBe(
      "We couldn't read this photo. Please take another clear photo."
    );
    expect(toHumanErrorMessage('Image payload is too small or truncated.')).toBe(
      "We couldn't read this photo. Please take another clear photo."
    );
    expect(toHumanErrorMessage('Failed to decode image data. Please ensure the file is not corrupt.')).toBe(
      "We couldn't read this photo. Please take another clear photo."
    );
    expect(toHumanErrorMessage('Unable to read selected file.')).toBe(
      "We couldn't read this photo. Please take another clear photo."
    );
  });

  it('translates camera permission issues into helpful guidance', () => {
    expect(toHumanErrorMessage('NotAllowedError: Permission denied')).toBe(
      'Camera permission is needed to take a photo of your feed. Please allow camera access.'
    );
    expect(toHumanErrorMessage('NotFoundError: DevicesNotFoundError')).toBe(
      'No camera found on this device. You can select a photo from your gallery.'
    );
  });

  it('translates network disconnects into friendly offline status', () => {
    expect(toHumanErrorMessage('Failed to fetch')).toBe(
      'Internet connection is weak or unavailable. Your test has been saved safely on your phone.'
    );
    expect(toHumanErrorMessage('NetworkError when attempting to fetch resource.')).toBe(
      'Internet connection is weak or unavailable. Your test has been saved safely on your phone.'
    );
  });

  it('provides Hindi humanized messages when locale is hi', () => {
    expect(toHumanErrorMessage('HTTP 500: Internal Server Error', 'hi')).toBe(
      'कुछ गलत हो गया। कृपया पुनः प्रयास करें।'
    );
    expect(toHumanErrorMessage('Invalid image payload', 'hi')).toBe(
      'हम इस फोटो को पढ़ नहीं सके। कृपया चारे की दूसरी साफ फोटो लें।'
    );
    expect(toHumanErrorMessage('NotAllowedError', 'hi')).toBe(
      'चारे की फोटो खींचने के लिए कैमरे की अनुमति आवश्यक है। कृपया कैमरा चालू करें।'
    );
  });
});
