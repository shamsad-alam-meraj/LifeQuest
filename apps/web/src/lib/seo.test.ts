import { describe, expect, it } from 'vitest';
import robots from '../app/robots';
import sitemap from '../app/sitemap';
import manifest from '../app/manifest';
import { jsonLd, jsonLdString } from './seo';
import { DESCRIPTION, PORTFOLIO, REPO, SITE_URL } from './site';

describe('seo', () => {
  it('description fits search result snippets', () => { expect(DESCRIPTION.length).toBeLessThanOrEqual(160); });
  it('structured data links the app, source, author and is free', () => {
    const g = jsonLd()['@graph'];
    const app = g.find((n) => n['@type'] === 'WebApplication') as Record<string, any>;
    expect(app.offers.price).toBe('0'); expect(app.url).toBe(SITE_URL); expect(app.isAccessibleForFree).toBe(true);
    expect(g.find((n) => n['@type'] === 'SoftwareSourceCode')).toMatchObject({ codeRepository: REPO });
    expect(g.find((n) => n['@type'] === 'Person')).toMatchObject({ url: PORTFOLIO });
  });
  it('contains no private contact data and cannot break out of its script tag', () => {
    const s = jsonLdString();
    expect(s).not.toMatch(/@gmail|@outlook|mailto:|\+880|telephone/i);
    expect(jsonLdString()).not.toContain('</script');
    expect(JSON.parse(s)['@context']).toBe('https://schema.org');
  });
  it('robots keeps private areas out and points to the sitemap', () => {
    const r = robots();
    expect(JSON.stringify(r.rules)).toContain('/app'); expect(JSON.stringify(r.rules)).toContain('/auth/'); expect(JSON.stringify(r.rules)).toContain('/login');
    expect(r.sitemap).toBe(`${SITE_URL}/sitemap.xml`);
  });
  it('sitemap lists only public pages', () => {
    const urls = sitemap().map((e) => e.url);
    expect(urls).toEqual([`${SITE_URL}/`, `${SITE_URL}/privacy`]);
  });
  it('manifest has installable PNG icons (192 + 512 + maskable)', () => {
    const icons = manifest().icons!;
    expect(icons.some((i) => i.sizes === '192x192' && i.type === 'image/png')).toBe(true);
    expect(icons.some((i) => i.sizes === '512x512' && i.purpose === 'maskable')).toBe(true);
    expect(manifest().start_url).toBe('/app');
  });
});
