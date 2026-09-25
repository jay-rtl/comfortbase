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

## Local visual redesign

The shared hospitality theme lives in `styles.css`: warm ivory `#F7F5F0`, sand `#EEEAE2`, charcoal-green `#18221D`, sage `#53634E`, and light sage `#E5E8DF`. Header/footer wordmarks use `assets/brand-mark.svg`, a navy and warm-gold CB monogram that also serves as the favicon.

Photography remains local in `assets/images/`; the redesign reuses the existing concept images. Replace these files with approved photography (and update alt text where needed). Property image assignments remain in `config/properties.js`. Edit the root HTML templates, then run the build to refresh clean routes.

Responsive browser QA covers all nine routes at 390, 768, 1024 and 1440 pixels, plus existing interactive controls:

```powershell
node scripts/browser-qa.mjs "C:\Program Files\Google\Chrome\Application\chrome.exe"
```

This uses an isolated local browser profile and produces ignored `qa-*.png` screenshots. Concierge requests remain demo-only, booking URLs remain unconfigured, and the existing placeholder contact number still needs client confirmation.
