import type { Metadata } from 'next';
import { Landing } from '../features/landing/Landing';
import { jsonLdString } from '../lib/seo';
import { DESCRIPTION, TITLE } from '../lib/site';

export const metadata: Metadata = {
  title: { absolute: TITLE },
  alternates: { canonical: '/' },
  openGraph: { url: '/', title: TITLE, description: DESCRIPTION },
};

export default function HomePage() {
  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: jsonLdString() }} />
      <Landing />
    </>
  );
}
