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

151 Harris St, Pyrmont uses client-provided photographs of 151 Harris St, Pyrmont. Its capacity, amenities and booking details remain unconfirmed. Other property listings and generated images remain concept content pending verified client data and photography.

## Local visual redesign

The shared hospitality theme lives in `styles.css`: warm ivory `#F7F5F0`, sand `#EEEAE2`, charcoal-green `#18221D`, sage `#53634E`, and light sage `#E5E8DF`. Header/footer wordmarks use `assets/brand-mark.svg`, a navy and warm-gold CB monogram. `assets/favicon.svg` adapts the mark for small sizes, and `assets/brand-lockup.svg` provides a standalone horizontal logo. The live wordmark uses the site's Manrope font; the standalone SVG falls back to Arial where Manrope is unavailable.

Photography remains local in `assets/images/`; `arrival-editorial.jpg` is a new homepage concept image with quiet space for the headline. Its generation prompt and provenance are recorded in `assets/images/CONCEPT-IMAGERY.md`. Other pages reuse the existing concept images with distinct hero subjects. Replace these files with approved photography (and update alt text where needed). Property image assignments remain in `config/properties.js`. Edit the root HTML templates, then run the build to refresh clean routes.

Responsive browser QA covers all nine routes at 390, 768, 1024 and 1440 pixels, plus existing interactive controls:

```powershell
node scripts/browser-qa.mjs "C:\Program Files\Google\Chrome\Application\chrome.exe"
```

This uses an isolated local browser profile and produces ignored `qa-*.png` screenshots. Concierge requests remain demo-only, booking URLs remain unconfigured, and the existing placeholder contact number still needs client confirmation.

## Featured project photography

The 151 Harris St, Pyrmont photographs belong to **151 Harris St, Pyrmont**, at `/comfortbase/stays/the-sydney-base/`. Its cards on the homepage and Our Bases use the real property photograph. The full gallery and comparisons are inside that existing listing; there is no separate homepage project feature. The former `/comfortbase/projects/151-harris-st-pyrmont/` URL redirects to 151 Harris St, Pyrmont and is excluded from the sitemap. Capacity, amenities and booking details remain unconfirmed.

`config/project-151-harris-st-pyrmont.json` catalogs all 33 completed-property photographs and five before photographs, including exact supplied filenames, original SHA-256 hashes, dimensions, alt text and responsive display copies. The source archive's bedroom filename is `Bed .jpg` (including the space), rather than `Bed.jpg`.

Unmodified originals are retained under `.local/source-assets/151-harris-st-pyrmont/{completed,before}/`. `.local/` is ignored by Git and excluded from the GitHub Pages artifact. Retain the original supplied ZIP archives as the master backup. The public display copies live in `assets/projects/151-harris-st-pyrmont/`, grouped by exterior, living, dining, kitchen, bedroom, bathroom, outdoor, details, composites and before. Display copies contain no EXIF metadata. Composite photographs are cataloged but omitted from the curated gallery.

The living comparison pairs `A7R03319.jpg` with `Living 2.jpg`, using the timber mantel, arched fireplace and kitchen doorway as references. The dining comparison pairs `A7R03329.jpg` with `Dining 2.jpg`, using the staircase, fireplace and kitchen doorway. The exterior comparison pairs `A7R03310.jpg` with `Front.jpg`, using the front gate, balcony ironwork and neighbouring facades. Camera positions differ, so all comparisons use labeled side-by-side photographs rather than an overlaid slider. Before images receive only proportional resizing and compression, without cropping, retouching or tonal changes.

To regenerate display assets, make Pillow available to Python and run `python scripts/prepare-project-images.py` with the originals in place. Normal builds use the manifest and display copies; Pillow and the source archives are not required for deployment. `scripts/build-featured-project.mjs` generates 151 Harris St, Pyrmont photography page and updates its listing cards. Project styling and interactions are isolated in `assets/projects/151-harris-st-pyrmont/project.css` and `project.js`.

Both supplied films are included in 151 Harris St, Pyrmont at `#property-videos`, with a direct link near the page heading. Originals are preserved in `.local/source-assets/151-harris-st-pyrmont/video/`. Optimized 1280x720 H.264/AAC MP4 copies and posters live in `assets/projects/151-harris-st-pyrmont/video/`; `config/project-151-harris-st-pyrmont-videos.json` records provenance, hashes and file details. To regenerate, make imageio-ffmpeg available on PYTHONPATH and run `python scripts/prepare-project-videos.py`. Videos use native controls, playsinline, preload="none" and no autoplay. The preview server supports video byte ranges for seeking. The desktop booking rail now spans the entire Sydney content area and stops before the footer; below 981px it yields to the existing mobile layout and inline enquiry link.

Run the existing browser regression suite and the additional project suite:

```powershell
node scripts/browser-qa.mjs "C:\Program Files\Google\Chrome\Application\chrome.exe"
node scripts/project-browser-qa.mjs "C:\Program Files\Google\Chrome\Application\chrome.exe" "path\to\axe-core\axe.min.js"
```

The second argument to the project suite is optional; supply a local axe-core bundle to include automated accessibility checks. Project evidence is written to `audit/project-qa.json`, with ignored `qa-project-*.png` screenshots.
