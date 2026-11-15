# SEO and social sharing

Everything is generated from code, so there are no image files to maintain.

| What | Where |
|---|---|
| Titles, descriptions, keywords, author, robots, Open Graph, X/Twitter card | `apps/web/src/app/layout.tsx` (site-wide) and each page's `metadata` (canonical URL, title) |
| Share image (1200×630 PNG, used for Open Graph **and** X/Twitter) | `apps/web/src/app/opengraph-image.tsx`, re-exported by `twitter-image.tsx` |
| App icons: iOS home screen, installable PNGs 192/512 (maskable-safe) | `apple-icon.tsx`, `app/icons/[size]/route.tsx`, `manifest.ts` |
| `robots.txt` and `sitemap.xml` | `app/robots.ts`, `app/sitemap.ts` (private areas `/app`, `/login`, `/auth/` are disallowed; `/login` is also `noindex`) |
| Structured data (schema.org WebSite, WebApplication, SoftwareSourceCode, Person) | `lib/seo.ts`, injected in `app/page.tsx` (public information only) |
| Site constants (URL, repo, portfolio, description) | `lib/site.ts` |

## Configure
- The canonical site URL defaults to `https://life-quest-io.vercel.app`. If you add a custom domain, set `NEXT_PUBLIC_SITE_URL=https://your-domain` in Vercel and redeploy; canonical URLs, share images, sitemap and structured data all follow it.
- Edit the share card text in `opengraph-image.tsx` and the description/keywords in `lib/site.ts`.

## Validate after each deploy
1. **Link previews:** paste the URL into the [Facebook Sharing Debugger](https://developers.facebook.com/tools/debug/) (also refreshes the cache for WhatsApp/Instagram) and the [LinkedIn Post Inspector](https://www.linkedin.com/post-inspector/). For X, Slack or Discord just paste the link in a post/message.
2. **Rich results:** run the home page through Google's [Rich Results Test](https://search.google.com/test/rich-results).
3. **Indexing:** add the site to [Google Search Console](https://search.google.com/search-console) (verify with the DNS record, or the HTML-tag method via `metadata.verification`) and submit `https://life-quest-io.vercel.app/sitemap.xml`. Do the same in Bing Webmaster Tools.
4. **Quality:** Lighthouse (SEO, Accessibility, Best Practices) should score 90+.

Social networks cache previews: after changing the image or text, use the debuggers above to force a re-scrape.
