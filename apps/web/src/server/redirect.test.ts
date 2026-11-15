import { describe, expect, it } from 'vitest';
import { safeNextPath } from './redirect';

describe('safeNextPath', () => {
  it('allows same-site paths', () => {
    expect(safeNextPath('/app/journey')).toBe('/app/journey');
    expect(safeNextPath('/app?x=1')).toBe('/app?x=1');
  });
  it('blocks open redirects and header injection', () => {
    for (const bad of ['https://evil.com', '//evil.com', '/\\evil.com', 'javascript:alert(1)', 'evil.com', '/ok\r\nSet-Cookie: x=1', '', null, undefined]) expect(safeNextPath(bad as string)).toBe('/app');
  });
});
