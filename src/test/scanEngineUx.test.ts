import { describe, it, expect, beforeEach } from 'vitest';
import {
  getOnDeviceClassificationMessage,
  resetFirstOnDeviceClassification,
  getIsFirstOnDeviceClassification,
} from '../hooks/useScanEngine';

describe('Scan Engine UX & On-Device Vision Polish (useScanEngine.ts)', () => {
  beforeEach(() => {
    resetFirstOnDeviceClassification();
  });

  it('starts with isFirstOnDeviceClassification = true', () => {
    expect(getIsFirstOnDeviceClassification()).toBe(true);
  });

  it('returns distinct "Loading AI assistant" message on first session call, then generic message afterward', () => {
    // 1st call: Should indicate one-time download
    const msg1 = getOnDeviceClassificationMessage();
    expect(msg1).toBe('Loading AI assistant (one-time download, ~15-20 seconds on slow networks)...');
    expect(getIsFirstOnDeviceClassification()).toBe(false);

    // 2nd call: Should revert to standard device checking message
    const msg2 = getOnDeviceClassificationMessage();
    expect(msg2).toBe('Checking image on device (डिवाइस पर छवि जांच हो रही है)...');
    expect(getIsFirstOnDeviceClassification()).toBe(false);

    // 3rd call: Continues to show standard device checking message
    const msg3 = getOnDeviceClassificationMessage();
    expect(msg3).toBe('Checking image on device (डिवाइस पर छवि जांच हो रही है)...');
  });

  it('resets back to first-time message when resetFirstOnDeviceClassification() is called', () => {
    getOnDeviceClassificationMessage(); // call 1
    expect(getIsFirstOnDeviceClassification()).toBe(false);

    resetFirstOnDeviceClassification();
    expect(getIsFirstOnDeviceClassification()).toBe(true);

    const msg = getOnDeviceClassificationMessage();
    expect(msg).toBe('Loading AI assistant (one-time download, ~15-20 seconds on slow networks)...');
  });
});
