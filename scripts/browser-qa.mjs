import { spawn } from 'node:child_process';
import { setTimeout as delay } from 'node:timers/promises';
import fs from 'node:fs';
import path from 'node:path';

const chrome = process.argv[2];
if (!chrome || !fs.existsSync(chrome)) throw new Error('Pass the installed Chrome executable path.');
const root = path.resolve(import.meta.dirname, '..');
const profile = path.join(root, '.chrome-cdp-qa');
const port = 9333;
const browser = spawn(chrome, ['--headless=new', '--no-sandbox', '--disable-gpu', `--remote-debugging-port=${port}`, '--remote-allow-origins=*', `--user-data-dir=${profile}`, 'about:blank'], { stdio: 'ignore' });

let socket;
let send;
let id = 0;
const pending = new Map();
const exceptions = [];
try {
  let targets;
  for (let attempt = 0; attempt < 30; attempt++) {
    try { targets = await (await fetch(`http://127.0.0.1:${port}/json/list`)).json(); break; } catch { await delay(200); }
  }
  const target = targets?.find(item => item.type === 'page');
  if (!target) throw new Error('Chrome DevTools target unavailable.');
  socket = new WebSocket(target.webSocketDebuggerUrl);
  await new Promise((resolve, reject) => { socket.addEventListener('open', resolve, { once: true }); socket.addEventListener('error', reject, { once: true }); });
  socket.addEventListener('message', event => {
    const message = JSON.parse(event.data);
    if (message.id && pending.has(message.id)) { const { resolve, reject } = pending.get(message.id); pending.delete(message.id); message.error ? reject(new Error(message.error.message)) : resolve(message.result); }
    if (message.method === 'Runtime.exceptionThrown') exceptions.push(message.params.exceptionDetails.text);
  });
  send = (method, params = {}) => new Promise((resolve, reject) => { const requestId = ++id; pending.set(requestId, { resolve, reject }); socket.send(JSON.stringify({ id: requestId, method, params })); });
  await send('Runtime.enable'); await send('Page.enable');
  const checks = [
    ...[320,375,390,430,768,1440].map(width => ({ route: '/', width, height: width < 700 ? 844 : 1000 })),
    ...['/our-bases','/stays/the-parkside-base','/virtual-concierge','/about','/extended-stays'].map(route => ({ route, width: 390, height: 844 }))
  ];
  const failures = [];
  for (const check of checks) {
    await send('Emulation.setDeviceMetricsOverride', { width: check.width, height: check.height, deviceScaleFactor: 1, mobile: check.width < 700 });
    await send('Page.navigate', { url: `http://127.0.0.1:4173${check.route}` });
    await delay(550);
    const result = await send('Runtime.evaluate', { expression: `({title:document.title,h1:document.querySelector('h1')?.innerText,innerWidth,scrollWidth:document.documentElement.scrollWidth,h1Right:Math.round(document.querySelector('h1')?.getBoundingClientRect().right||0),menuDisplay:getComputedStyle(document.querySelector('.menu-toggle')).display,images:[...document.images].filter(i=>i.complete&&i.naturalWidth===0).length})`, returnByValue: true });
    const value = result.result.value;
    const overflow = value.scrollWidth > value.innerWidth + 1;
    if (overflow || value.h1Right > value.innerWidth || !value.title || !value.h1 || value.images) failures.push({ ...check, ...value, overflow });
    console.log(`${check.width}px ${check.route} — ${overflow ? 'OVERFLOW' : 'fit'}; images:${value.images}; menu:${value.menuDisplay}`);
  }
  await send('Emulation.setDeviceMetricsOverride', { width: 390, height: 844, deviceScaleFactor: 1, mobile: true });
  await send('Page.navigate', { url: 'http://127.0.0.1:4173/' }); await delay(450);
  const menuTest = await send('Runtime.evaluate', { expression: `document.querySelector('.menu-toggle').click();({open:document.body.classList.contains('menu-open'),expanded:document.querySelector('.menu-toggle').getAttribute('aria-expanded')})`, returnByValue: true });
  if (!menuTest.result.value.open || menuTest.result.value.expanded !== 'true') failures.push({ interaction: 'mobile menu', result: menuTest.result.value });

  await send('Page.navigate', { url: 'http://127.0.0.1:4173/virtual-concierge' }); await delay(450);
  const conciergeTest = await send('Runtime.evaluate', { expression: `(()=>{document.querySelector('[data-service="dining"]').click();document.querySelector('#name').value='Test Guest';document.querySelector('#email').value='guest@example.com';document.querySelector('#details').value='Airport transfer';document.querySelector('#concierge-form').requestSubmit();document.querySelector('.faq-question').click();return {service:document.querySelector('[data-service="dining"]').classList.contains('active'),status:document.querySelector('.form-status').textContent,faq:document.querySelector('.faq-item').classList.contains('open')}})()`, returnByValue: true });
  const concierge = conciergeTest.result.value;
  if (!concierge.service || !concierge.status.includes('Demo mode') || !concierge.faq) failures.push({ interaction: 'concierge controls', result: concierge });

  for (const [propertySlug, expectedTitle] of [['the-parkside-base','The Parkside Base'],['the-riverside-base','The Riverside Base'],['the-garden-base','The Garden Base'],['the-executive-base','The Executive Base']]) {
    await send('Page.navigate', { url: `http://127.0.0.1:4173/stays/${propertySlug}` }); await delay(350);
    const propertyTest = await send('Runtime.evaluate', { expression: `({title:document.querySelector('[data-property-title]').textContent,dates:document.querySelectorAll('.booking-panel input[type="date"]').length,booking:[...document.querySelectorAll('[data-booking-link]')].map(a=>({href:a.getAttribute('href'),disabled:a.getAttribute('aria-disabled'),text:a.textContent.trim()}))})`, returnByValue: true });
    const propertyResult = propertyTest.result.value;
    if (propertyResult.title !== expectedTitle || propertyResult.dates !== 0 || propertyResult.booking.some(link => link.href || link.disabled !== 'true' || !link.text.toLowerCase().includes('coming soon'))) failures.push({ interaction: `property booking ${propertySlug}`, result: propertyResult });
  }
  await send('Page.navigate', { url: 'http://127.0.0.1:4173/stays/the-parkside-base' }); await delay(350);
  const galleryTest = await send('Runtime.evaluate', { expression: `document.querySelector('[data-gallery]').click();({open:document.querySelector('.modal').classList.contains('open'),hidden:document.querySelector('.modal').getAttribute('aria-hidden')})`, returnByValue: true });
  if (!galleryTest.result.value.open || galleryTest.result.value.hidden !== 'false') failures.push({ interaction: 'property gallery', result: galleryTest.result.value });
  console.log('Interaction checks: mobile menu, concierge selector/form/FAQ, four property booking states, and property gallery completed.');
  if (exceptions.length) failures.push({ exceptions });
  if (failures.length) { console.error(JSON.stringify(failures, null, 2)); process.exitCode = 1; }
  else console.log(`Browser QA passed ${checks.length} responsive route/viewport checks with no runtime exceptions.`);
} finally {
  try { await send?.('Browser.close'); await delay(300); } catch {}
  try { socket?.close(); } catch {}
  if (!browser.killed) browser.kill();
}
