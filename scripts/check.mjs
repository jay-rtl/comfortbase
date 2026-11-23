import fs from 'node:fs';
import path from 'node:path';
import vm from 'node:vm';

const root = path.resolve(import.meta.dirname, '..');
const pages = ['index.html', 'bases.html', 'property.html', 'concierge.html', 'about.html', 'extended-stays.html', 'our-bases/index.html', 'virtual-concierge/index.html', 'extended-stays/index.html', 'about/index.html', 'stays/the-sydney-base/index.html', 'stays/the-riverside-base/index.html', 'stays/the-garden-base/index.html', 'stays/the-executive-base/index.html'];
const cleanRoutes = new Set(['/', '/our-bases', '/virtual-concierge', '/extended-stays', '/about']);
const errors = [];

for (const page of pages) {
  const file = path.join(root, page);
  if (!fs.existsSync(file)) { errors.push(`Missing ${page}`); continue; }
  const html = fs.readFileSync(file, 'utf8');
  for (const attr of html.matchAll(/(?:src|href)="(?!https?:|mailto:|tel:|#)([^"]+)"/g)) {
    const clean = attr[1].split('#')[0].split('?')[0];
    if (!clean || clean.startsWith('/')) continue;
    if (!fs.existsSync(path.resolve(root, clean))) errors.push(`${page}: missing ${clean}`);
  }
  if (!/<title>[^<]+<\/title>/.test(html)) errors.push(`${page}: missing title`);
  if (!/<base href="\/comfortbase\/">/.test(html)) errors.push(`${page}: missing GitHub Pages base path`);
  if (!/<meta name="description"/.test(html)) errors.push(`${page}: missing description`);
  if (!/<meta name="robots" content="index,follow,max-image-preview:large"/.test(html)) errors.push(`${page}: missing indexable robots directive`);
  if (!/<meta property="og:image"/.test(html)) errors.push(`${page}: missing Open Graph image`);
  if (!/<meta name="twitter:card"/.test(html)) errors.push(`${page}: missing Twitter card metadata`);
  const canonical = html.match(/<link rel="canonical" href="([^"]+)"/i)?.[1];
  if (!canonical || canonical.includes('.html') || canonical.includes('?')) errors.push(`${page}: canonical URL is not clean`);
  for (const href of html.matchAll(/href="([^"]+)"/g)) {
    if (/\.html(?:[?#]|$)/.test(href[1])) errors.push(`${page}: public link exposes .html: ${href[1]}`);
  }
  if (!/<h1[\s>]/.test(html)) errors.push(`${page}: missing h1`);
}
const propertySource = fs.readFileSync(path.join(root, 'config', 'properties.js'), 'utf8');
const sandbox = { window: {} };
vm.runInNewContext(propertySource, sandbox);
const properties = sandbox.window.COMFORT_BASE_PROPERTIES;
if (!properties || !Object.keys(properties).length) errors.push('Property configuration is empty');
for (const [id, property] of Object.entries(properties || {})) {
  if (typeof property.externalBookingUrl !== 'string') errors.push(`${id}: externalBookingUrl must be a string`);
  if (!property.title || !property.slug || !property.location || !property.images?.length) errors.push(`${id}: incomplete property data`);
  cleanRoutes.add(`/stays/${property.slug}`);
}
const cardMarkup = `${fs.readFileSync(path.join(root, 'index.html'), 'utf8')}\n${fs.readFileSync(path.join(root, 'bases.html'), 'utf8')}`;
for (const match of cardMarkup.matchAll(/href="(\/stays\/[a-z0-9-]+)"/g)) {
  if (!cleanRoutes.has(match[1])) errors.push(`Property card references unknown clean route: ${match[1]}`);
}
const detailMarkup = fs.readFileSync(path.join(root, 'property.html'), 'utf8');
if (/class="booking-panel"[\s\S]*?type="date"/.test(detailMarkup)) errors.push('Property booking panel contains a misleading date input');
if ((detailMarkup.match(/data-booking-link/g) || []).length < 3) errors.push('Property detail page is missing booking CTA bindings');
const clientScript = fs.readFileSync(path.join(root, 'script.js'), 'utf8');
if (!clientScript.includes("rel = 'noopener noreferrer'")) errors.push('External booking links are missing safe rel handling');
const firstListing = properties.sydney;
const firstPage = fs.readFileSync(path.join(root, 'stays/the-sydney-base/index.html'), 'utf8');
if (!firstListing?.detailsPending || [firstListing.guests, firstListing.bedrooms, firstListing.bathrooms].some(value => value !== null)) errors.push('Sydney listing must not invent unconfirmed capacity');
if (!firstPage.includes('q=-33.8700073,151.194134') || !firstPage.includes('data-property-map><h2>Location')) errors.push('Sydney listing is missing the supplied map location');
if ((firstPage.match(/data-project-photo /g) || []).length !== 17 || firstPage.includes('sydney-base-placeholder')) errors.push('Sydney listing must contain the real property gallery');
if (!firstPage.includes('data-property-title>The Sydney Base</h1>') || (firstPage.match(/data-booking-link/g) || []).length !== 3) errors.push('Sydney listing must retain its identity and safe booking controls');
if (!firstListing.location.includes('151 Harris St') || !firstListing.images[0].includes('151-harris-st-pyrmont')) errors.push('Harris St photography must be assigned to the Sydney listing');
if (!firstPage.includes('sydney-booking-rail') || !firstPage.includes('sydney-content-layout')) errors.push('Sydney booking panel must span the full content layout');
const films = JSON.parse(fs.readFileSync(path.join(root, 'config/project-151-harris-st-pyrmont-videos.json'), 'utf8')).videos;
if (films.length !== 2 || (firstPage.match(/<video controls playsinline preload="none"/g) || []).length !== 2 || /<video[^>]*autoplay/.test(firstPage)) errors.push('Sydney must include two controlled, on-demand videos');
for (const film of films) for (const asset of [film.src, film.poster]) if (!fs.existsSync(path.join(root, asset))) errors.push(`Sydney video asset missing: ${asset}`);
if (fs.readFileSync(path.join(root, 'sitemap.xml'), 'utf8').includes('/projects/151-harris-st-pyrmont/')) errors.push('Standalone project route must not remain in the sitemap');
if (fs.readFileSync(path.join(root, 'index.html'), 'utf8').includes('id="featured-project"')) errors.push('Photography must live inside the Sydney Base, not a homepage feature');
if (/Secure parking|Fast Wi-Fi|From 3:00 pm|South Yarra/.test(firstPage)) errors.push('Sydney listing still contains dummy property facts');
if (!firstPage.includes('stays/the-sydney-base/')) errors.push('Sydney canonical route is missing');
const project = JSON.parse(fs.readFileSync(path.join(root, 'config/project-151-harris-st-pyrmont.json'), 'utf8'));
if (project.images.length !== 38 || project.images.filter(image => image.category === 'before').length !== 5) errors.push('Featured project must preserve the 33 completed and 5 before image records');
for (const image of project.images) {
  if (!image.alt || !image.originalSha256 || image.variants.length !== 4) errors.push(`Featured project: incomplete image record ${image.id}`);
  for (const variant of [...image.variants, ...(image.avif || [])]) {
    if (!fs.existsSync(path.join(root, variant.src))) errors.push(`Featured project: missing responsive image ${variant.src}`);
  }
}
const projectPage = firstPage;
if ((projectPage.match(/data-project-photo /g) || []).length !== 17) errors.push('Featured project must have 17 curated gallery links');
if (properties.sydney.externalBookingUrl || /available for (rent|sale)/i.test(projectPage)) errors.push('Sydney booking availability is not confirmed');
for (const href of projectPage.matchAll(/href="([^"]*#[^"]+)"/g)) {
  if (href[1].startsWith('#')) errors.push('Featured project contains a fragment-only link affected by the shared base path');
}
if (errors.length) { console.error(errors.join('\n')); process.exit(1); }
console.log(`Checked ${pages.length} pages, ${Object.keys(properties || {}).length} property records and ${project.images.length} featured-project photographs: markup, metadata and local assets OK.`);
