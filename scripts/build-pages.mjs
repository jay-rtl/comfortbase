import fs from 'node:fs';
import path from 'node:path';
import vm from 'node:vm';

const root = path.resolve(import.meta.dirname, '..');
const siteOrigin = 'https://jay-rtl.github.io/comfortbase';
const pageCopies = {
  'bases.html': 'our-bases/index.html',
  'concierge.html': 'virtual-concierge/index.html',
  'extended-stays.html': 'extended-stays/index.html',
  'about.html': 'about/index.html'
};

for (const [sourceName, outputName] of Object.entries(pageCopies)) {
  const output = path.join(root, outputName);
  fs.mkdirSync(path.dirname(output), { recursive: true });
  fs.writeFileSync(output, fs.readFileSync(path.join(root, sourceName), 'utf8'), 'utf8');
}

const propertyContext = { window: {} };
vm.runInNewContext(fs.readFileSync(path.join(root, 'config', 'properties.js'), 'utf8'), propertyContext);
const properties = propertyContext.window.COMFORT_BASE_PROPERTIES;
const template = fs.readFileSync(path.join(root, 'property.html'), 'utf8');
const escapeHtml = value => String(value).replaceAll('&', '&amp;').replaceAll('"', '&quot;').replaceAll('<', '&lt;').replaceAll('>', '&gt;');
const replaceText = (html, attribute, value) => html.replace(new RegExp(`(<[^>]+${attribute}[^>]*>)[^<]*(<\\/)`, 'g'), `$1${escapeHtml(value)}$2`);

for (const property of Object.values(properties)) {
  let html = template
    .replace(/<title>[^<]+<\/title>/, `<title>${escapeHtml(property.title)} | Comfort Base</title>`)
    .replace(/<meta name="description" content="[^"]*">/, `<meta name="description" content="${escapeHtml(`${property.title} in ${property.location}. ${property.description}`)}">`)
    .replace(/<meta property="og:title" content="[^"]*">/, `<meta property="og:title" content="${escapeHtml(property.title)} | Comfort Base">`)
    .replace(/<meta property="og:description" content="[^"]*">/, `<meta property="og:description" content="${escapeHtml(property.description)}">`)
    .replace(/<meta property="og:image" content="[^"]*">/, `<meta property="og:image" content="${property.images[0]}">`)
    .replace(/<meta property="og:image:alt" content="[^"]*">/, `<meta property="og:image:alt" content="${escapeHtml(property.imageAlts[0])}">`)
    .replace(/<link rel="canonical" href="[^"]*">/, `<link rel="canonical" href="stays/${property.slug}/">`);
  html = replaceText(html, 'data-property-title', property.title);
  html = replaceText(html, 'data-property-location', property.location);
  html = replaceText(html, 'data-property-short-location', property.location.split(' · ')[0]);
  html = replaceText(html, 'data-property-guests', property.guests == null ? 'Guests: to be confirmed' : `${property.guests} guest${property.guests === 1 ? '' : 's'}`);
  html = replaceText(html, 'data-property-bedrooms', property.bedrooms == null ? 'Bedrooms: to be confirmed' : `${property.bedrooms} bedroom${property.bedrooms === 1 ? '' : 's'}`);
  html = replaceText(html, 'data-property-bathrooms', property.bathrooms == null ? 'Bathrooms: to be confirmed' : `${property.bathrooms} bathroom${property.bathrooms === 1 ? '' : 's'}`);
  html = replaceText(html, 'data-property-description', property.description);
  html = replaceText(html, 'data-property-parking', property.parking);
  html = replaceText(html, 'data-property-nearby', property.nearby);
  property.images.forEach((image, index) => {
    html = html.replace(new RegExp(`(<img data-property-image="${index}" )src="[^"]*" alt="[^"]*"`), `$1src="${image}" alt="${escapeHtml(property.imageAlts[index])}"`);
  });
  if (property.detailsPending) {
    html = replaceText(html, 'data-property-intro', 'Your next Sydney base.');
    html = html.replace(/<div class="detail-section" data-property-amenities>[\s\S]*?<\/div>/, '<div class="detail-section" data-property-amenities><h2>Amenities</h2><p>To be confirmed. Full amenities will be added with the property details.</p></div>');
    html = html.replace(/<div class="detail-section" data-property-stay>[\s\S]*?<\/div>/, '<div class="detail-section" data-property-stay><h2>Stay information</h2><p>Check-in, check-out, parking and house rules are to be confirmed.</p></div>');
    html = html.replace(/<button data-gallery><img data-property-image="[12]"[^>]*><\/button>/g, '').replace('class="gallery"', 'class="gallery gallery-single"').replace('View gallery · 3 images', 'View concept image');
    html = html.replace('Check live availability, select your dates and securely complete your reservation with our booking partner.', 'Booking details are coming soon. Contact us to enquire about this property.');
    html = html.replace('Availability and reservations are managed through our booking partner.', '<a href="mailto:admin@comfortbase.com.au?subject=The%20Sydney%20Base%20enquiry">Enquire about The Sydney Base</a>');
  }
  if (property.mapUrl) {
    html = html.replace('<div class="detail-section" data-property-map hidden></div>', '<div class="detail-section" data-property-map><h2>Location</h2><p>Map pin for the supplied location. Exact property address to be confirmed.</p><iframe class="property-map" title="The Sydney Base location map" src="' + escapeHtml(property.mapEmbedUrl) + '" loading="lazy" referrerpolicy="no-referrer-when-downgrade" allowfullscreen></iframe><div class="map-links"><a class="text-link" href="' + escapeHtml(property.mapUrl) + '" target="_blank" rel="noopener noreferrer">Open Google Maps ↗</a></div></div>');
  }
  const output = path.join(root, 'stays', property.slug, 'index.html');
  fs.mkdirSync(path.dirname(output), { recursive: true });
  fs.writeFileSync(output, html, 'utf8');
}

const routes = ['/', '/our-bases/', '/virtual-concierge/', '/extended-stays/', '/about/', ...Object.values(properties).map(property => `/stays/${property.slug}/`)];
const sitemap = `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${routes.map(route => `  <url><loc>${siteOrigin}${route}</loc></url>`).join('\n')}\n</urlset>\n`;
fs.writeFileSync(path.join(root, 'sitemap.xml'), sitemap, 'utf8');
fs.writeFileSync(path.join(root, 'robots.txt'), `User-agent: *\nAllow: /\n\nSitemap: ${siteOrigin}/sitemap.xml\n`, 'utf8');
fs.writeFileSync(path.join(root, '.nojekyll'), '', 'utf8');
console.log(`Generated ${Object.keys(pageCopies).length + Object.keys(properties).length} GitHub Pages routes and sitemap.xml.`);
