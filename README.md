# Comfort Base

Premium, responsive hospitality website for Comfort Base, including property discovery, clean SEO-friendly routes, external booking-link configuration, and a Virtual Concierge experience.

## Local development

Requires Node.js 18 or newer. No package installation is required.

```bash
npm run dev
```

Open <http://localhost:4173/comfortbase/>.

## Validation

```bash
npm run build
npm test
```

## Property booking links

Add each verified third-party booking URL to the corresponding `externalBookingUrl` value in [`config/properties.js`](config/properties.js). Empty values produce a safe “Booking link coming soon” state.

## GitHub Pages and clean routes

`npm run build` generates physical clean-route folders for GitHub Pages, including the individual property pages, sitemap and robots file. The project uses `/comfortbase/` as its GitHub Pages base path.

The included Node preview server also provides clean routes and permanent redirects from legacy `.html` URLs. For a different repository name or custom domain, update the `<base>` value in the source pages and `siteOrigin` in `scripts/build-pages.mjs` before rebuilding.

## Content note

Property listings and generated images are temporary concept content pending verified client property data and photography.
