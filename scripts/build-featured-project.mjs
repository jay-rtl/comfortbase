import fs from 'node:fs';
import path from 'node:path';

const root = path.resolve(import.meta.dirname, '..');
const project = JSON.parse(fs.readFileSync(path.join(root, 'config/project-151-harris-st-pyrmont.json'), 'utf8'));
const films = JSON.parse(fs.readFileSync(path.join(root, 'config/project-151-harris-st-pyrmont-videos.json'), 'utf8')).videos;
const route = 'stays/the-sydney-base/';
const origin = 'https://jay-rtl.github.io/comfortbase/';
const images = new Map(project.images.map(image => [image.id, image]));
const escape = value => String(value).replaceAll('&', '&amp;').replaceAll('"', '&quot;').replaceAll('<', '&lt;').replaceAll('>', '&gt;');
const image = (id, { eager = false, sizes = '(max-width: 700px) calc(100vw - 40px), (max-width: 1000px) 46vw, 30vw', className = '' } = {}) => {
  const item = images.get(id);
  if (!item) throw new Error(`Unknown photograph ${id}`);
  const img = `<img class="${className}" src="${item.variants[1].src}" srcset="${item.variants.map(v => `${v.src} ${v.width}w`).join(', ')}" sizes="${sizes}" width="${item.variants[1].width}" height="${item.variants[1].height}" alt="${escape(item.alt)}" ${eager ? 'fetchpriority="high"' : 'loading="lazy"'} decoding="async">`;
  return item.avif ? `<picture><source type="image/avif" srcset="${item.avif.map(v => `${v.src} ${v.width}w`).join(', ')}" sizes="${sizes}">${img}</picture>` : img;
};

// The photography belongs to the existing Sydney listing, not a separate homepage feature.
for (const filename of ['index.html', 'bases.html']) {
  const file = path.join(root, filename);
  let html = fs.readFileSync(file, 'utf8');
  html = html.replace(/<!-- featured-project:start -->[\s\S]*?<!-- featured-project:end -->\s*/, '');
  html = html.replace('<link rel="stylesheet" href="assets/projects/151-harris-st-pyrmont/project.css">', '');
  html = html.replace(/<article class="property-card"[^>]*>[\s\S]*?<\/article>/g, article => {
    if (!article.includes('href="stays/the-sydney-base/"')) return article;
    return article
      .replace(/<picture>[\s\S]*?<\/picture>|<img[^>]*>/, image('living-to-dining', { sizes: '(max-width: 700px) calc(100vw - 40px), (max-width: 1000px) 46vw, 30vw' }))
      .replace('Photos coming soon', 'Pyrmont, Sydney')
      .replace('Sydney · New South Wales', '151 Harris St · Pyrmont')
      .replace('Property details to be confirmed', 'Explore the property photographs');
  });
  html = html.replace('Details and original photography for The Sydney Base are coming soon.', 'Explore the photographs of 151 Harris St, Pyrmont, inside The Sydney Base.')
    .replace('All listings and imagery are temporary concept content pending client property data.', 'The Sydney Base features client-provided photographs. Other listings and images remain concept content.')
    .replace('Concept listings and generated imagery shown for design demonstration only.', 'The Sydney Base features client-provided photographs. Other listings and images are concepts.')
    .replace('Concept imagery is labeled. Featured project photographs are client-provided.', 'The Sydney Base photographs are client-provided. Other concept imagery is labeled.');
  fs.writeFileSync(file, html);
}

const about = fs.readFileSync(path.join(root, 'about.html'), 'utf8');
const header = about.match(/<header[\s\S]*?<\/header><nav class="mobile-panel"[\s\S]*?<\/nav>/)[0]
  .replaceAll(' class="nav-link active"', ' class="nav-link"').replaceAll(' aria-current="page"', '')
  .replace('class="nav-link" href="our-bases/"', 'class="nav-link active" href="our-bases/" aria-current="page"')
  .replace('<a href="our-bases/">', '<a href="our-bases/" aria-current="page">')
  .replace(/<a class="btn header-cta"[^>]*>[\s\S]*?<\/a>/, `<a class="btn header-cta disabled" data-booking-link data-missing-label="Booking coming soon" aria-disabled="true" tabindex="-1">Booking coming soon</a>`);
const footer = about.match(/<footer[\s\S]*?<\/footer>/)[0].replace('No unverified company statistics are shown.', '151 Harris St photography supplied by the client.');
const gallery = [
  ['living-fireplace', 'living-dining', 'The living room'], ['dining-staircase', 'living-dining', 'Around the table'], ['dining-to-living', 'living-dining', 'Connected spaces'],
  ['kitchen-overview', 'kitchen', 'Timber and light'], ['kitchen-sink', 'kitchen', 'Everyday details'],
  ['bedroom-balcony', 'bedroom', 'Bedroom to balcony'], ['bedroom-window-detail', 'bedroom', 'A quieter corner'], ['bedroom-window', 'bedroom', 'The bedroom'],
  ['bathroom-overview', 'bathroom', 'The bathroom'], ['bathroom-vanity', 'bathroom', 'A closer look'],
  ['courtyard-seating', 'outdoor', 'The courtyard'], ['balcony-ironwork', 'outdoor', 'Above Harris Street'], ['courtyard-tree', 'outdoor', 'Under the jacaranda'],
  ['street-frontage', 'details', 'The terrace frontage'], ['fireplace-armchair', 'details', 'The timber mantel'], ['dining-mantel', 'details', 'Light and proportion'], ['jacaranda-detail', 'details', 'Pyrmont in bloom']
];
const categories = [['all','All photographs'], ['living-dining','Living & Dining'], ['kitchen','Kitchen'], ['bedroom','Bedroom'], ['bathroom','Bathroom'], ['outdoor','Outdoor'], ['details','Architectural Details']];
const galleryMarkup = gallery.map(([id, category, caption]) => `<figure class="project-gallery-item" data-project-category="${category}"><a class="project-photo-link" href="${images.get(id).variants.at(-1).src}" data-project-photo aria-label="Open photograph: ${escape(caption)}">${image(id)}<span class="project-photo-open" aria-hidden="true">↗</span></a><figcaption><span>${escape(caption)}</span><span>${escape(categories.find(c=>c[0]===category)[1])}</span></figcaption></figure>`).join('\n');
const comparisons = [
  { id: 'living', title: 'Living room', before: 'before-living', after: 'living-to-dining', note: 'The timber mantel and arched fireplace, with the doorway through to the kitchen, identify the same living space. The camera positions differ.' },
  { id: 'dining', title: 'Dining room', before: 'before-dining', after: 'dining-staircase', note: 'The staircase, timber mantel and kitchen doorway identify the same dining space. The camera positions differ.' },
  { id: 'exterior', title: 'Street frontage', before: 'before-street-front', after: 'street-frontage', note: 'The balcony ironwork, front gate and neighbouring facades identify the same frontage. The camera positions differ.' }
];
const comparisonMarkup = comparisons.map((pair, index) => `<section class="project-comparison-pair" id="comparison-${pair.id}" aria-labelledby="comparison-${pair.id}-title" data-comparison-panel="${pair.id}"${index ? '' : ' data-default-comparison'}><h3 class="subheading" id="comparison-${pair.id}-title">${pair.title}</h3><div class="project-comparison-images"><figure><figcaption>Before</figcaption>${image(pair.before, { sizes: '(max-width: 700px) calc(100vw - 40px), 46vw' })}</figure><figure><figcaption>After</figcaption>${image(pair.after, { sizes: '(max-width: 700px) calc(100vw - 40px), 46vw' })}</figure></div><p class="project-comparison-note">${pair.note}</p></section>`).join('\n');

let html = `<!doctype html>
<html lang="en-AU"><head><base href="/comfortbase/"><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<title>The Sydney Base | 151 Harris St, Pyrmont | Comfort Base</title><meta name="description" content="Explore client-provided photographs of 151 Harris St, Pyrmont: before-and-after views, finished living spaces, and architectural details."><meta name="robots" content="index,follow,max-image-preview:large"><meta name="theme-color" content="#f7f5f0">
<link rel="canonical" href="${origin}${route}"><meta property="og:url" content="${origin}${route}"><meta property="og:title" content="The Sydney Base | 151 Harris St, Pyrmont"><meta property="og:description" content="A Fresh Perspective on Urban Living. Explore the spaces, transformation and details."><meta property="og:type" content="website"><meta property="og:image" content="${origin}${images.get('living-to-dining').variants.at(-1).src}"><meta property="og:image:alt" content="${escape(images.get('living-to-dining').alt)}"><meta name="twitter:card" content="summary_large_image">
<link rel="preconnect" href="https://fonts.googleapis.com"><link rel="preconnect" href="https://fonts.gstatic.com" crossorigin><link rel="preload" as="image" type="image/avif" fetchpriority="high" imagesrcset="${images.get('living-to-dining').avif.map(v=>`${v.src} ${v.width}w`).join(', ')}" imagesizes="100vw"><link rel="icon" href="assets/favicon.svg" type="image/svg+xml"><link rel="stylesheet" href="styles.css"><link rel="stylesheet" href="assets/projects/151-harris-st-pyrmont/project.css">
</head><body class="page-project"><a class="skip-link" href="${route}#main">Skip to content</a><div class="progress" aria-hidden="true"></div>${header}
<main id="main" tabindex="-1">
  <section class="project-opening"><div class="container"><a class="project-back" href="our-bases/">← Back to Our Bases</a><div class="project-opening-grid"><div><p class="eyebrow" data-property-location>151 Harris St · Pyrmont, Sydney</p><h1 class="display" data-property-title>The Sydney Base</h1></div><div class="project-opening-copy"><p class="project-subtitle">151 Harris St, Pyrmont</p><p>A photographic look inside a Sydney terrace, from its living spaces to the details that give it character.</p><a class="text-link" href="${route}#project-gallery">Discover the photographs <span aria-hidden="true">↓</span></a></div></div></div>
  <figure class="project-lead-photo">${image('living-to-dining', { eager: true, sizes: '100vw' })}<figcaption class="container"><span>151 Harris St · Pyrmont, Sydney, Australia</span><span>Completed property · Client-provided photography</span></figcaption></figure></section>
  <section class="section sydney-stay-information"><div class="container detail-layout"><div><p class="eyebrow">151 Harris St, Pyrmont</p><h2 class="heading">Your Sydney base.</h2><p class="lede" data-property-description>Explore the living spaces, outdoor areas and architectural details of 151 Harris St, Pyrmont, through client-provided photography.</p><div class="card-meta sydney-capacity"><span data-property-guests>Guests: to be confirmed</span><span data-property-bedrooms>Bedrooms: to be confirmed</span><span data-property-bathrooms>Bathrooms: to be confirmed</span></div><p class="muted">Guest capacity, amenities, check-in information and booking details are to be confirmed.</p><div class="detail-section" data-property-map><h2>Location</h2><p>151 Harris St, Pyrmont, Sydney, Australia.</p><iframe class="property-map" title="The Sydney Base location map" src="https://www.google.com/maps?q=-33.8700073,151.194134&amp;z=17&amp;output=embed" loading="lazy" referrerpolicy="no-referrer-when-downgrade" allowfullscreen></iframe><a class="text-link" href="https://www.google.com/maps?q=-33.8700073,151.194134" target="_blank" rel="noopener noreferrer">Open Google Maps &nearr;</a></div></div><aside class="booking-panel"><p class="overline">The Sydney Base</p><h2 class="subheading">151 Harris St, Pyrmont</h2><p>Booking details are coming soon. Contact us to enquire about this property.</p><a class="btn disabled" data-booking-link data-missing-label="Booking link coming soon" aria-disabled="true" tabindex="-1">Booking link coming soon</a><p><a class="text-link" href="mailto:admin@comfortbase.com.au?subject=The%20Sydney%20Base%20enquiry">Enquire about The Sydney Base &nearr;</a></p></aside></div></section>
  <section class="section project-story"><div class="container"><div class="project-story-heading"><p class="eyebrow">A closer look</p><h2 class="heading">Thoughtfully Refreshed.<br>Beautifully Reimagined.</h2><p class="lede">Explore the transformation of 151 Harris St, Pyrmont, through a curated collection of before-and-after photographs and finished interior details.</p></div><div class="project-story-images"><figure class="project-motion">${image('street-frontage', { sizes: '(max-width: 700px) 65vw, 30vw' })}<figcaption>The Harris Street frontage</figcaption></figure><figure class="project-motion">${image('fireplace-armchair', { sizes: '(max-width: 700px) 85vw, 54vw' })}<figcaption>Timber, texture and the original fireplace</figcaption></figure></div><p class="project-context">A photographic record of the spaces, before and after.</p></div></section>
  <section class="section cream project-comparison" id="before-after" aria-labelledby="before-after-title"><div class="container"><div class="project-section-heading"><div><p class="eyebrow">Then & now</p><h2 class="heading" id="before-after-title">The same spaces.<br>A fresh perspective.</h2></div><p>Before and after, shown side by side. Different camera positions are kept visible so you can compare the spaces as photographed.</p></div><div class="project-comparison-controls" role="group" aria-label="Choose a space to compare" hidden>${comparisons.map((p,i)=>`<button type="button" data-comparison="${p.id}" aria-controls="comparison-${p.id}" aria-pressed="${i===0}">${p.title}</button>`).join('')}</div>${comparisonMarkup}</div></section>
  <section class="section project-gallery-section" id="project-gallery" aria-labelledby="project-gallery-title"><div class="container"><div class="project-section-heading"><div><p class="eyebrow">The finished spaces</p><h2 class="heading" id="project-gallery-title">Inside & out.</h2></div><p>A considered edit of the living spaces, outdoor moments and architectural details.</p></div><div class="project-gallery-filters" role="group" aria-label="Filter project photographs" hidden>${categories.map(([id,label],i)=>`<button type="button" data-project-filter="${id}" aria-pressed="${i===0}" aria-controls="project-gallery-grid">${escape(label)}</button>`).join('')}</div><p class="project-gallery-count" role="status" aria-live="polite" data-project-count>${gallery.length} photographs</p><div class="project-gallery-grid" id="project-gallery-grid">${galleryMarkup}</div><div class="project-end"><p>151 Harris St, Pyrmont</p><a class="text-link" href="our-bases/">Explore Our Bases <span aria-hidden="true">↗</span></a></div></div></section>
</main>
<dialog class="project-dialog" aria-labelledby="project-dialog-caption"><div class="project-dialog-toolbar"><span data-project-counter role="status" aria-live="polite"></span><button type="button" data-project-close aria-label="Close photograph">Close <span aria-hidden="true">×</span></button></div><div class="project-dialog-image"><img src="${images.get('living-fireplace').variants[0].src}" alt="" width="4134" height="2756"></div><div class="project-dialog-bottom"><button type="button" data-project-prev aria-label="Previous photograph">← Previous</button><p id="project-dialog-caption"></p><button type="button" data-project-next aria-label="Next photograph">Next →</button></div></dialog>
<div class="sticky-mobile"><span><strong>The Sydney Base</strong><br><small>Pyrmont, Sydney</small></span><a class="btn disabled" data-booking-link data-missing-label="Booking coming soon" aria-disabled="true" tabindex="-1">Booking coming soon</a></div>${footer}<script src="config/properties.js"></script><script src="script.js" defer></script><script src="assets/projects/151-harris-st-pyrmont/project.js" defer></script></body></html>`;
const bookingPanel = html.match(/<aside class="booking-panel">[\s\S]*?<\/aside>/)[0];
html = html.replace(bookingPanel, '').replace('class="container detail-layout"', 'class="container"');
html = html.replace('<section class="section sydney-stay-information">', '<div class="container sydney-content-layout"><div class="sydney-content"><section class="section sydney-stay-information">');
html = html.replace('</main>', `</div><div class="sydney-booking-rail">${bookingPanel}</div></div></main>`);
const videoSection = `<section class="section project-films" id="property-videos" aria-labelledby="property-videos-title"><div class="container"><p class="eyebrow">The Sydney Base · On film</p><h2 class="heading" id="property-videos-title">See the spaces in motion.</h2><p class="lede">Two client-provided films of 151 Harris St, Pyrmont.</p><div class="project-film-list">${films.map((film, index) => `<figure class="project-film"><figcaption><h3 class="subheading" id="film-${index}-title">${escape(film.title)}</h3><p id="film-${index}-description">${index === 0 ? 'A walkthrough of the terrace, its interiors and outdoor spaces.' : 'The property before and after, as recorded in the supplied film.'}</p></figcaption><video controls playsinline preload="none" poster="${film.poster}" width="${film.width}" height="${film.height}" aria-labelledby="film-${index}-title" aria-describedby="film-${index}-description"><source src="${film.src}" type="video/mp4"><a href="${film.src}">Open ${escape(film.title)}</a></video></figure>`).join('')}</div></div></section>`;
html = html.replace('<section class="section project-gallery-section"', `${videoSection}<section class="section project-gallery-section"`);
html = html.replace('Discover the photographs <span aria-hidden="true">↓</span></a>', 'Discover the photographs <span aria-hidden="true">↓</span></a><a class="text-link sydney-video-jump" href="' + route + '#property-videos">Watch the property films <span aria-hidden="true">↓</span></a>');
html = html.replace('<div class="card-meta sydney-capacity">', '<p><a class="text-link" href="mailto:admin@comfortbase.com.au?subject=The%20Sydney%20Base%20enquiry">Enquire about this stay ↗</a></p><div class="card-meta sydney-capacity">');
const directory = path.join(root, route);
fs.mkdirSync(directory, { recursive: true });
fs.writeFileSync(path.join(directory, 'index.html'), html);
const legacyDirectory = path.join(root, 'projects/151-harris-st-pyrmont');
fs.mkdirSync(legacyDirectory, { recursive: true });
fs.writeFileSync(path.join(legacyDirectory, 'index.html'), `<!doctype html><html lang="en"><head><meta charset="utf-8"><meta name="robots" content="noindex,follow"><meta http-equiv="refresh" content="0;url=/comfortbase/${route}"><link rel="canonical" href="${origin}${route}"><title>The Sydney Base | Comfort Base</title></head><body><p><a href="/comfortbase/${route}">Continue to The Sydney Base at 151 Harris St, Pyrmont</a></p></body></html>`);
console.log(`Generated Sydney Base photography: ${gallery.length} curated gallery images and ${comparisons.length} honest side-by-side comparisons.`);
