const http = require('node:http');
const fs = require('node:fs');
const path = require('node:path');

const root = __dirname;
const port = Number(process.env.PORT || 4173);
const basePath = '/comfortbase';
const types = { '.html': 'text/html; charset=utf-8', '.css': 'text/css; charset=utf-8', '.js': 'text/javascript; charset=utf-8', '.mjs': 'text/javascript; charset=utf-8', '.webp': 'image/webp', '.xml': 'application/xml; charset=utf-8', '.txt': 'text/plain; charset=utf-8', '.svg': 'image/svg+xml' };
const cleanRoutes = new Map([
  ['/', 'index.html'],
  ['/our-bases', 'bases.html'],
  ['/virtual-concierge', 'concierge.html'],
  ['/extended-stays', 'extended-stays.html'],
  ['/about', 'about.html'],
  ['/stays/the-parkside-base', 'property.html'],
  ['/stays/the-riverside-base', 'property.html'],
  ['/stays/the-garden-base', 'property.html'],
  ['/stays/the-executive-base', 'property.html']
]);
const legacyRoutes = new Map([
  ['/index.html', '/'],
  ['/bases.html', '/our-bases'],
  ['/concierge.html', '/virtual-concierge'],
  ['/extended-stays.html', '/extended-stays'],
  ['/about.html', '/about']
]);
const propertySlugs = { parkside: 'the-parkside-base', riverside: 'the-riverside-base', garden: 'the-garden-base', executive: 'the-executive-base' };

http.createServer((req, res) => {
  const requestUrl = new URL(req.url, `http://${req.headers.host}`);
  const forwardedProto = String(req.headers['x-forwarded-proto'] || '').split(',')[0].trim();
  const forwardedHost = String(req.headers['x-forwarded-host'] || '').split(',')[0].trim();
  const publicOrigin = String(process.env.SITE_URL || `${forwardedProto || 'http'}://${forwardedHost || req.headers.host}`).replace(/\/$/, '');
  const rawPathname = decodeURIComponent(requestUrl.pathname).replace(/\/$/, '') || '/';
  const pathname = rawPathname === basePath ? '/' : rawPathname.startsWith(`${basePath}/`) ? rawPathname.slice(basePath.length) : rawPathname;
  if (pathname === '/robots.txt') {
    res.writeHead(200, { 'Content-Type': 'text/plain; charset=utf-8', 'Cache-Control': 'no-cache' });
    return res.end(`User-agent: *\nAllow: /\n\nSitemap: ${publicOrigin}${basePath}/sitemap.xml\n`);
  }
  if (pathname === '/sitemap.xml') {
    const urls = [...cleanRoutes.keys()].map(route => `  <url><loc>${publicOrigin}${basePath}${route}</loc></url>`).join('\n');
    res.writeHead(200, { 'Content-Type': 'application/xml; charset=utf-8', 'Cache-Control': 'no-cache' });
    return res.end(`<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${urls}\n</urlset>\n`);
  }
  if (legacyRoutes.has(pathname)) {
    res.writeHead(301, { Location: `${basePath}${legacyRoutes.get(pathname)}`, 'Cache-Control': 'no-cache' });
    return res.end();
  }
  if (pathname === '/property.html') {
    const id = requestUrl.searchParams.get('property') || 'parkside';
    res.writeHead(301, { Location: `${basePath}/stays/${propertySlugs[id] || propertySlugs.parkside}`, 'Cache-Control': 'no-cache' });
    return res.end();
  }
  const relative = cleanRoutes.get(pathname) || pathname.replace(/^\/+/, '');
  let target = path.resolve(root, relative);
  if (!target.startsWith(root)) return end(403, 'Forbidden');
  if (fs.existsSync(target) && fs.statSync(target).isDirectory()) target = path.join(target, 'index.html');
  if (!fs.existsSync(target) && !path.extname(target)) target += '.html';
  if (!fs.existsSync(target)) return end(404, 'Not found');
  res.writeHead(200, { 'Content-Type': types[path.extname(target)] || 'application/octet-stream', 'Cache-Control': 'no-cache' });
  fs.createReadStream(target).pipe(res);
  function end(code, body) { res.writeHead(code, { 'Content-Type': 'text/plain; charset=utf-8' }); res.end(body); }
}).listen(port, () => console.log(`Comfort Base preview: http://localhost:${port}`));
