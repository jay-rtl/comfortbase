import { spawn } from 'node:child_process';
import { setTimeout as delay } from 'node:timers/promises';
import fs from 'node:fs';
import path from 'node:path';

const chrome = process.argv[2];
if (!chrome || !fs.existsSync(chrome)) throw new Error('Pass the installed Chrome executable path.');
const root = path.resolve(import.meta.dirname, '..');
const profile = path.join(root, '.chrome-redesign-qa');
const port = 9347;
const browser = spawn(chrome, ['--headless=new', '--no-first-run', '--disable-extensions', '--disable-gpu', `--remote-debugging-port=${port}`, '--remote-allow-origins=*', `--user-data-dir=${profile}`, 'about:blank'], { stdio: 'ignore' });

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
  send = (method, params = {}) => new Promise((resolve, reject) => { const requestId = ++id; const timer = setTimeout(() => reject(new Error(`Timeout: ${method}`)), 20000); pending.set(requestId, { resolve: value => { clearTimeout(timer); resolve(value); }, reject: error => { clearTimeout(timer); reject(error); } }); socket.send(JSON.stringify({ id: requestId, method, params })); });
  await send('Runtime.enable'); await send('Page.enable');
  const navigate = async url => {
    await send('Page.navigate', {url});
    const pathname = new URL(url).pathname.replace(/\/$/,'');
    for(let attempt=0;attempt<100;attempt++) {
      await delay(100);
      try {
        const ready=await send('Runtime.evaluate',{expression:`document.readyState==='complete' && location.pathname.replace(/\\/$/,'')===${JSON.stringify(pathname)}`,returnByValue:true});
        if(ready.result?.value) return;
      } catch {}
    }
    throw new Error(`Page did not finish loading: ${url}`);
  };
  const basePath = '/comfortbase';
  const checks = [
    ...['/','/our-bases/','/stays/the-parkside-base/','/stays/the-riverside-base/','/stays/the-garden-base/','/stays/the-executive-base/','/virtual-concierge/','/about/','/extended-stays/'].flatMap(route => [390,768,1024,1440].map(width => ({ route: `${basePath}${route}`, width, height: width < 700 ? 844 : 1000 })))
  ];
  const failures = [];
  let checkedViewports = 0;
  for (const check of checks) {
    if (process.argv.includes('--home-only') && check.route !== `${basePath}/`) continue;
    if (process.argv.includes('--final-pass') && ![`${basePath}/`,`${basePath}/our-bases/`,`${basePath}/about/`,`${basePath}/extended-stays/`].includes(check.route)) continue;
    checkedViewports++;
    await send('Emulation.setDeviceMetricsOverride', { width: check.width, height: check.height, deviceScaleFactor: 1, mobile: check.width < 700 });
    await navigate(`http://127.0.0.1:4173${check.route}`);
    await delay(550);
    await send('Runtime.evaluate', { expression: `(async()=>{for(let y=0;y<document.body.scrollHeight;y+=700){scrollTo({top:y,behavior:'instant'});await new Promise(r=>setTimeout(r,60))}scrollTo({top:0,behavior:'instant'});await Promise.race([Promise.all([document.fonts.ready,...[...document.images].map(i=>i.decode().catch(()=>{}))]),new Promise(r=>setTimeout(r,1000))])})()`, awaitPromise: true });
    await delay(900);
    if ([390,1440].includes(check.width)) {
      const screenshot = await send('Page.captureScreenshot', { format: 'png', captureBeyondViewport: true });
      fs.writeFileSync(path.join(root, `qa-${check.route.split('/').filter(Boolean).at(-1)}-${check.width}.png`), Buffer.from(screenshot.data,'base64'));
      const heroShot = await send('Page.captureScreenshot', { format:'png', clip:{x:0,y:0,width:check.width,height:check.height,scale:1} });
      fs.writeFileSync(path.join(root, `qa-hero-${check.route.split('/').filter(Boolean).at(-1)}-${check.width}.png`), Buffer.from(heroShot.data,'base64'));
    }
    const result = await send('Runtime.evaluate', { expression: `({title:document.title,h1:document.querySelector('h1')?.innerText,innerWidth,scrollWidth:document.documentElement.scrollWidth,h1Right:Math.round(document.querySelector('h1')?.getBoundingClientRect().right||0),menuDisplay:getComputedStyle(document.querySelector('.menu-toggle')).display,images:[...document.images].filter(i=>i.complete&&i.naturalWidth===0).length})`, returnByValue: true });
    const value = result.result.value;
    const headerResult = await send('Runtime.evaluate', { expression: `(()=>{const h=document.querySelector('.site-header'),brand=h.querySelector('.brand').getBoundingClientRect(),nav=h.querySelector('.desktop-nav'),cta=h.querySelector('.header-cta'),menu=h.querySelector('.menu-toggle');const mobile=getComputedStyle(menu).display!=='none';return {overlap:mobile?brand.right+8>menu.getBoundingClientRect().left:brand.right+8>nav.getBoundingClientRect().left||nav.getBoundingClientRect().right+8>cta.getBoundingClientRect().left,current:nav.querySelectorAll('[aria-current="page"]').length,hiddenMenu:document.querySelector('.mobile-panel').inert}})()`,returnByValue:true });
    if (headerResult.result.value.overlap || headerResult.result.value.current !== 1 || !headerResult.result.value.hiddenMenu) failures.push({ ...check, header:headerResult.result.value });
    if(check.width===390) {
      await send('Runtime.evaluate', {expression:`document.querySelector('.menu-toggle').click()`});
      await delay(600);
      const menuState = await send('Runtime.evaluate', {expression:`({focused:document.activeElement===document.querySelector('.mobile-panel > a'),background:document.querySelector('main').inert,current:document.querySelectorAll('.mobile-panel > a[aria-current="page"]').length})`,returnByValue:true});
      if(!menuState.result.value.focused||!menuState.result.value.background||menuState.result.value.current!==1) {
        const details=await send('Runtime.evaluate',{expression:`({active:document.activeElement.outerHTML.slice(0,250),visibility:getComputedStyle(document.querySelector('.mobile-panel')).visibility,inert:document.querySelector('.mobile-panel').inert})`,returnByValue:true});
        failures.push({...check,menu:menuState.result.value,details:details.result.value});
      }
      if(check.route===`${basePath}/`) { const shot=await send('Page.captureScreenshot',{format:'png',clip:{x:0,y:0,width:390,height:844,scale:1}});fs.writeFileSync(path.join(root,'qa-mobile-menu.png'),Buffer.from(shot.data,'base64')); }
      await send('Input.dispatchKeyEvent',{type:'keyDown',key:'Escape',code:'Escape',windowsVirtualKeyCode:27});
      const closed=await send('Runtime.evaluate',{expression:`({focused:document.activeElement===document.querySelector('.menu-toggle'),inert:document.querySelector('.mobile-panel').inert,background:document.querySelector('main').inert})`,returnByValue:true});
      if(!closed.result.value.focused||!closed.result.value.inert||closed.result.value.background) failures.push({...check,closedMenu:closed.result.value});
    }
    const overflow = value.scrollWidth > value.innerWidth + 1;
    if (overflow || value.h1Right > value.innerWidth || !value.title || !value.h1 || value.images) failures.push({ ...check, ...value, overflow });
    console.log(`${check.width}px ${check.route} â€” ${overflow ? 'OVERFLOW' : 'fit'}; images:${value.images}; menu:${value.menuDisplay}`);
  }
  await send('Emulation.setDeviceMetricsOverride', { width: 390, height: 844, deviceScaleFactor: 1, mobile: true });
  await navigate(`http://127.0.0.1:4173${basePath}/`); await delay(450);
  const menuTest = await send('Runtime.evaluate', { expression: `document.querySelector('.menu-toggle').click();({open:document.body.classList.contains('menu-open'),expanded:document.querySelector('.menu-toggle').getAttribute('aria-expanded')})`, returnByValue: true });
  if (!menuTest.result.value.open || menuTest.result.value.expanded !== 'true') failures.push({ interaction: 'mobile menu', result: menuTest.result.value });
  await delay(650);
  await send('Runtime.evaluate',{expression:`document.querySelector('.menu-toggle').focus()`});
  await send('Input.dispatchKeyEvent',{type:'keyDown',key:'Tab',code:'Tab',windowsVirtualKeyCode:9,modifiers:8});
  const backwardTab=await send('Runtime.evaluate',{expression:`document.activeElement===[...document.querySelectorAll('.mobile-panel a[href]')].at(-1)`,returnByValue:true});
  await send('Input.dispatchKeyEvent',{type:'keyDown',key:'Tab',code:'Tab',windowsVirtualKeyCode:9});
  const forwardTab=await send('Runtime.evaluate',{expression:`document.activeElement===document.querySelector('.menu-toggle')`,returnByValue:true});
  if(!backwardTab.result.value||!forwardTab.result.value) failures.push({interaction:'mobile keyboard focus loop',backward:backwardTab.result.value,forward:forwardTab.result.value});
  await send('Emulation.setDeviceMetricsOverride',{width:1024,height:1000,deviceScaleFactor:1,mobile:false});
  await delay(100);
  const resized=await send('Runtime.evaluate',{expression:`!document.body.classList.contains('menu-open')&&!document.querySelector('main').inert&&document.querySelector('.mobile-panel').inert`,returnByValue:true});
  if(!resized.result.value) failures.push({interaction:'menu closes on desktop resize'});
  await send('Emulation.setDeviceMetricsOverride',{width:390,height:844,deviceScaleFactor:1,mobile:true});
  await navigate(`http://127.0.0.1:4173${basePath}/our-bases/`); await delay(450);
  const filterTest = await send('Runtime.evaluate', { expression: `document.querySelector('[data-filter="city"]').click();({visible:[...document.querySelectorAll('[data-type]')].filter(e=>getComputedStyle(e).display!=='none').length})`, returnByValue: true });
  if (filterTest.result.value.visible !== 2) failures.push({ interaction:'listing filter', result:filterTest.result.value });

  await navigate(`http://127.0.0.1:4173${basePath}/virtual-concierge`); await delay(450);
  const conciergeTest = await send('Runtime.evaluate', { expression: `(()=>{document.querySelector('[data-service="dining"]').click();document.querySelector('#name').value='Test Guest';document.querySelector('#email').value='guest@example.com';document.querySelector('#details').value='Airport transfer';document.querySelector('#concierge-form').requestSubmit();document.querySelector('.faq-question').click();return {service:document.querySelector('[data-service="dining"]').classList.contains('active'),status:document.querySelector('.form-status').textContent,faq:document.querySelector('.faq-item').classList.contains('open')}})()`, returnByValue: true });
  const concierge = conciergeTest.result.value;
  if (!concierge.service || !concierge.status.includes('Demo mode') || !concierge.faq) failures.push({ interaction: 'concierge controls', result: concierge });

  for (const [propertySlug, expectedTitle] of [['the-parkside-base','The Parkside Base'],['the-riverside-base','The Riverside Base'],['the-garden-base','The Garden Base'],['the-executive-base','The Executive Base']]) {
    await navigate(`http://127.0.0.1:4173${basePath}/stays/${propertySlug}`); await delay(350);
    const propertyTest = await send('Runtime.evaluate', { expression: `({title:document.querySelector('[data-property-title]').textContent,dates:document.querySelectorAll('.booking-panel input[type="date"]').length,booking:[...document.querySelectorAll('[data-booking-link]')].map(a=>({href:a.getAttribute('href'),disabled:a.getAttribute('aria-disabled'),text:a.textContent.trim()}))})`, returnByValue: true });
    const propertyResult = propertyTest.result.value;
    if (propertyResult.title !== expectedTitle || propertyResult.dates !== 0 || propertyResult.booking.some(link => link.href || link.disabled !== 'true' || !link.text.toLowerCase().includes('coming soon'))) failures.push({ interaction: `property booking ${propertySlug}`, result: propertyResult });
  }
  await navigate(`http://127.0.0.1:4173${basePath}/stays/the-parkside-base`); await delay(350);
  const galleryTest = await send('Runtime.evaluate', { expression: `document.querySelector('[data-gallery]').click();({open:document.querySelector('.modal').classList.contains('open'),hidden:document.querySelector('.modal').getAttribute('aria-hidden')})`, returnByValue: true });
  if (!galleryTest.result.value.open || galleryTest.result.value.hidden !== 'false') failures.push({ interaction: 'property gallery', result: galleryTest.result.value });
  console.log('Interaction checks: mobile menu, concierge selector/form/FAQ, four property booking states, and property gallery completed.');
  if (exceptions.length) failures.push({ exceptions });
  if (failures.length) { console.error(JSON.stringify(failures, null, 2)); process.exitCode = 1; }
  else console.log(`Browser QA passed ${checkedViewports} responsive route/viewport checks with no runtime exceptions.`);
} finally {
  try { await send?.('Browser.close'); await delay(300); } catch {}
  try { socket?.close(); } catch {}
  if (!browser.killed) browser.kill();
}
