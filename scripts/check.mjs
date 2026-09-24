import fs from 'node:fs';
import path from 'node:path';
import vm from 'node:vm';

const root = path.resolve(import.meta.dirname, '..');
const pages = ['index.html', 'bases.html', 'property.html', 'concierge.html', 'about.html', 'extended-stays.html'];
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
if (errors.length) { console.error(errors.join('\n')); process.exit(1); }
console.log(`Checked ${pages.length} pages and ${Object.keys(properties || {}).length} property records: markup, booking configuration, metadata and local asset references OK.`);
