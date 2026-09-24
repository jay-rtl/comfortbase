# Comfort Base

Premium, responsive hospitality website for Comfort Base, including property discovery, clean SEO-friendly routes, external booking-link configuration, and a Virtual Concierge experience.

## Local development

Requires Node.js 18 or newer. No package installation is required.

```bash
npm run dev
```

Open <http://localhost:4173>.

## Validation

```bash
npm run build
npm test
```

## Property booking links

Add each verified third-party booking URL to the corresponding `externalBookingUrl` value in [`config/properties.js`](config/properties.js). Empty values produce a safe “Booking link coming soon” state.

## Clean routes

The included Node preview server provides clean public routes and permanent redirects from legacy `.html` URLs. A production host must run `server.js` or reproduce its rewrite rules. Set `SITE_URL` in production when proxy headers do not expose the public origin; it is used for the dynamic sitemap and robots response.

## Content note

Property listings and generated images are temporary concept content pending verified client property data and photography.
