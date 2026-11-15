import { AUTHOR, DESCRIPTION, GITHUB_PROFILE, PORTFOLIO, REPO, SITE_NAME, SITE_URL } from './site';

/** schema.org structured data for the landing page (public information only). */
export function jsonLd() {
  const author = { '@id': `${SITE_URL}/#author` };
  return {
    '@context': 'https://schema.org',
    '@graph': [
      { '@type': 'WebSite', '@id': `${SITE_URL}/#website`, url: SITE_URL, name: SITE_NAME, description: DESCRIPTION, inLanguage: 'en', publisher: author },
      {
        '@type': 'WebApplication', '@id': `${SITE_URL}/#app`, name: SITE_NAME, url: SITE_URL, description: DESCRIPTION,
        applicationCategory: 'LifestyleApplication', operatingSystem: 'Any (web browser)', browserRequirements: 'Requires JavaScript',
        isAccessibleForFree: true, offers: { '@type': 'Offer', price: '0', priceCurrency: 'USD' },
        license: 'https://opensource.org/licenses/MIT', author, image: `${SITE_URL}/opengraph-image`,
      },
      { '@type': 'SoftwareSourceCode', '@id': `${SITE_URL}/#source`, name: SITE_NAME, codeRepository: REPO, programmingLanguage: 'TypeScript', license: 'https://opensource.org/licenses/MIT', author },
      { '@type': 'Person', '@id': `${SITE_URL}/#author`, name: AUTHOR, url: PORTFOLIO, sameAs: [GITHUB_PROFILE, PORTFOLIO] },
    ],
  };
}

/** Safe to embed in a <script type="application/ld+json"> (prevents </script> breakouts). */
export const jsonLdString = () => JSON.stringify(jsonLd()).replace(/</g, '\\u003c');
