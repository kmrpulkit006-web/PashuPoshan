import { describe, it, expect, beforeEach, afterEach } from 'vitest';

const VALID_TABS = ['scan', 'scorecard', 'ration', 'silage', 'alerts'];

function parseTabFromUrl(pathname: string, hash: string): string {
  const path = pathname.replace(/^\/+/, '').split('/')[0].toLowerCase();
  if (VALID_TABS.includes(path)) {
    return path;
  }
  const cleanHash = hash.replace(/^#[/]?/, '').split('/')[0].toLowerCase();
  if (VALID_TABS.includes(cleanHash)) {
    return cleanHash;
  }
  return 'scan';
}

describe('PWA Routing & URL Synchronization', () => {
  it('parses pathname routes directly', () => {
    expect(parseTabFromUrl('/scan', '')).toBe('scan');
    expect(parseTabFromUrl('/scorecard', '')).toBe('scorecard');
    expect(parseTabFromUrl('/ration', '')).toBe('ration');
    expect(parseTabFromUrl('/silage', '')).toBe('silage');
    expect(parseTabFromUrl('/alerts', '')).toBe('alerts');
  });

  it('parses hash routes for static fallback compatibility', () => {
    expect(parseTabFromUrl('/', '#/scorecard')).toBe('scorecard');
    expect(parseTabFromUrl('/', '#ration')).toBe('ration');
    expect(parseTabFromUrl('/', '#/alerts')).toBe('alerts');
  });

  it('falls back to scan on root or invalid route', () => {
    expect(parseTabFromUrl('/', '')).toBe('scan');
    expect(parseTabFromUrl('/unknown-route', '')).toBe('scan');
    expect(parseTabFromUrl('/', '#/invalid')).toBe('scan');
  });
});
