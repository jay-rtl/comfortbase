import { spawn } from 'node:child_process';
import { setTimeout as delay } from 'node:timers/promises';
import fs from 'node:fs';
import path from 'node:path';
import os from 'node:os';

const root = path.resolve(import.meta.dirname, '..');
const chrome = process.argv[2];
const axePath = process.argv[3];
const profile = fs.mkdtempSync(path.join(os.tmpdir(), 'comfortbase-project-qa-'));
const browser = spawn(chrome, ['--headless=new', '--no-first-run', '--disable-extensions', '--remote-debugging-address=127.0.0.1', '--remote-debugging-port=9353', `--user-data-dir=${profile}`, 'about:blank'], { stdio: 'ignore', windowsHide: true });
const base = process.argv[4] || 'http://127.0.0.1:4173/comfortbase/';
const route = 'stays/the-sydney-base/';
const report = { viewports: [], interactions: [], exceptions: [], a11y: [], failures: [], videoRequests: [] };
let socket, sequence = 0;
const pending = new Map();
const check = (name, value, details) => { console.log(`${value ? 'PASS' : 'FAIL'} ${name}`); report.interactions.push({ name, passed: Boolean(value), details }); if (!value) report.failures.push({ name, details }); };
try {
  let targets;
  for (let i=0; i<50; i++) { try { targets = await (await fetch('http://127.0.0.1:9353/json/list')).json(); break; } catch { await delay(200); } }
  socket = new WebSocket(targets.find(t=>t.type==='page').webSocketDebuggerUrl);
  await new Promise((resolve,reject)=>{socket.addEventListener('open',resolve,{once:true});socket.addEventListener('error',reject,{once:true});});
  socket.addEventListener('message',event=>{
    const m=JSON.parse(event.data);
    if(m.id&&pending.has(m.id)){const p=pending.get(m.id);pending.delete(m.id);clearTimeout(p.timer);m.error?p.reject(new Error(m.error.message)):p.resolve(m.result);}
    if(m.method==='Runtime.exceptionThrown')report.exceptions.push(m.params.exceptionDetails.text);
    if(m.method==='Network.requestWillBeSent'&&m.params.request.url.includes('.mp4'))report.videoRequests.push(m.params.request.url);
  });
  const send=(method,params={})=>new Promise((resolve,reject)=>{const id=++sequence;const timer=setTimeout(()=>reject(new Error(`Timeout ${method}`)),25000);pending.set(id,{resolve,reject,timer});socket.send(JSON.stringify({id,method,params}));});
  const evaluate=async(expression,awaitPromise=false)=>{const r=await send('Runtime.evaluate',{expression,returnByValue:true,awaitPromise});if(r.exceptionDetails)throw new Error(JSON.stringify(r.exceptionDetails));return r.result.value;};
  const navigate=async(relative)=>{const url=new URL(relative,base);if(process.env.QA_RELEASE)url.searchParams.set('release',process.env.QA_RELEASE);await send('Page.navigate',{url:url.href});for(let i=0;i<100;i++){await delay(100);try{if(await evaluate(`document.readyState==='complete'&&location.pathname===${JSON.stringify(url.pathname)}`))return;}catch{}}throw new Error('Navigation timeout');};
  const ready=async()=>{await evaluate(`document.querySelectorAll('img').forEach(i=>i.loading='eager')`);for(let i=0;i<80;i++){if(await evaluate(`[...document.images].every(i=>i.complete)&&document.fonts.status==='loaded'`))return;await delay(100);}throw new Error('Images or fonts did not settle');};
  const shot=async(name)=>{await delay(250);const s=await send('Page.captureScreenshot',{format:'png'});fs.writeFileSync(path.join(root,`qa-project-${name}.png`),Buffer.from(s.data,'base64'));};
  await send('Page.enable');await send('Runtime.enable');await send('Network.enable');
  report.browser=(await send('Browser.getVersion')).product;
  for(const width of [320,390,768,1024,1440]){
    await send('Emulation.setDeviceMetricsOverride',{width,height:width<700?844:1000,deviceScaleFactor:1,mobile:width<700});
    await navigate(route);await ready();
    const v=await evaluate(`({width:innerWidth,scrollWidth:document.documentElement.scrollWidth,h1Right:document.querySelector('h1').getBoundingClientRect().right,brokenImages:[...document.images].filter(i=>i.naturalWidth===0).map(i=>i.src),galleryImages:document.querySelectorAll('[data-project-photo]').length})`);
    report.viewports.push(v);check(`Layout and images ${width}px`,v.scrollWidth<=v.width&&v.h1Right<=v.width&&v.brokenImages.length===0,v);
    if(width===390){
      await send('Emulation.setTouchEmulationEnabled',{enabled:true,maxTouchPoints:1});
      const point=await evaluate(`(()=>{const b=document.querySelector('[data-project-filter="kitchen"]');b.scrollIntoView({behavior:'instant',block:'center'});const r=b.getBoundingClientRect();return {x:r.left+r.width/2,y:r.top+r.height/2}})()`);
      await send('Input.dispatchTouchEvent',{type:'touchStart',touchPoints:[point]});
      await send('Input.dispatchTouchEvent',{type:'touchEnd',touchPoints:[]});await delay(100);
      check('Mobile touch filter',await evaluate(`document.querySelector('[data-project-filter="kitchen"]').getAttribute('aria-pressed')==='true'&&[...document.querySelectorAll('[data-project-category]')].filter(i=>!i.hidden).length===2`));
      await evaluate(`document.querySelector('[data-project-filter="all"]').click();scrollTo({top:0,behavior:'instant'})`);
      await send('Emulation.setTouchEmulationEnabled',{enabled:false});
    }
    if([390,768,1440].includes(width)){
      await shot(`${width}-opening`);
      await evaluate(`document.querySelector('#before-after').scrollIntoView({behavior:'instant'});`);await shot(`${width}-comparison`);
      await evaluate(`document.querySelector('#project-gallery').scrollIntoView({behavior:'instant'});`);await shot(`${width}-gallery`);
      await evaluate(`document.querySelector('#property-videos').scrollIntoView({behavior:'instant'});`);await shot(`${width}-videos`);
    }
  }
  check('Videos do not download before playback',report.videoRequests.length===0,report.videoRequests);
  const videoDefaults=await evaluate(`({videos:[...document.querySelectorAll('video')].map(v=>({controls:v.controls,preload:v.preload,paused:v.paused,playsInline:v.playsInline,autoplay:v.autoplay})),jump:document.querySelector('.sydney-video-jump').href.endsWith('/stays/the-sydney-base/#property-videos')})`);
  check('Two accessible on-demand video players',videoDefaults.videos.length===2&&videoDefaults.jump&&videoDefaults.videos.every(v=>v.controls&&v.preload==='none'&&v.paused&&v.playsInline&&!v.autoplay),videoDefaults);
  await evaluate(`document.querySelector('#property-videos').scrollIntoView({behavior:'instant'})`);
  await shot('1440-videos-sticky');
  const sticky=await evaluate(`(()=>{const p=document.querySelector('.booking-panel').getBoundingClientRect();return {top:p.top,bottom:p.bottom,position:getComputedStyle(document.querySelector('.booking-panel')).position}})()`);
  check('Booking panel follows to videos',sticky.position==='sticky'&&sticky.top>=90&&sticky.top<=125,sticky);
  await evaluate(`document.querySelector('.project-gallery-grid').scrollIntoView({behavior:'instant',block:'end'})`);
  const lateSticky=await evaluate(`(()=>{const p=document.querySelector('.booking-panel').getBoundingClientRect();return {top:p.top,bottom:p.bottom,footerTop:document.querySelector('.site-footer').getBoundingClientRect().top}})()`);
  check('Booking panel follows through gallery and clears footer',lateSticky.top>=90&&lateSticky.top<=125&&lateSticky.bottom<=lateSticky.footerTop,lateSticky);
  await evaluate(`scrollTo({top:document.body.scrollHeight,behavior:'instant'})`);
  check('Booking panel stops before footer',await evaluate(`document.querySelector('.booking-panel').getBoundingClientRect().bottom<=document.querySelector('.site-footer').getBoundingClientRect().top`));
  await evaluate(`document.querySelector('video').muted=true;document.querySelector('video').play().then(()=>true)`,true);
  await delay(600);
  const playing=await evaluate(`({time:document.querySelector('video').currentTime,duration:document.querySelector('video').duration,ready:document.querySelector('video').readyState,paused:document.querySelector('video').paused,error:document.querySelector('video').error?.message})`);
  check('Walkthrough video plays',playing.time>0&&playing.ready>=2&&!playing.paused&&!playing.error,playing);
  await evaluate(`document.querySelector('video').currentTime=25`);await delay(700);
  check('Walkthrough video seeks',await evaluate(`document.querySelector('video').currentTime>=25&&!document.querySelector('video').seeking`));
  await evaluate(`document.querySelectorAll('video')[1].muted=true;document.querySelectorAll('video')[1].play().then(()=>true)`,true);await delay(600);
  const second=await evaluate(`({firstPaused:document.querySelector('video').paused,secondTime:document.querySelectorAll('video')[1].currentTime,duration:document.querySelectorAll('video')[1].duration,error:document.querySelectorAll('video')[1].error?.message})`);
  check('Before-after video plays and pauses other player',second.firstPaused&&second.secondTime>0&&!second.error,second);
  await evaluate(`document.querySelectorAll('video')[1].currentTime=55`);await delay(700);
  check('Before-after video seeks',await evaluate(`document.querySelectorAll('video')[1].currentTime>=55&&!document.querySelectorAll('video')[1].seeking`));
  await evaluate(`document.querySelectorAll('video').forEach(v=>v.pause())`);
  for(const [category,expected] of [['all',17],['living-dining',3],['kitchen',2],['bedroom',3],['bathroom',2],['outdoor',3],['details',4]]){
    const result=await evaluate(`document.querySelector('[data-project-filter="${category}"]').click();({count:[...document.querySelectorAll('[data-project-category]')].filter(i=>!i.hidden).length,pressed:document.querySelectorAll('[data-project-filter][aria-pressed="true"]').length,status:document.querySelector('[data-project-count]').textContent})`);
    check(`Filter ${category}`,result.count===expected&&result.pressed===1,result);
  }
  for(const id of ['living','dining','exterior']){
    const result=await evaluate(`document.querySelector('[data-comparison="${id}"]').click();({visible:[...document.querySelectorAll('[data-comparison-panel]')].filter(i=>!i.hidden).map(i=>i.dataset.comparisonPanel),pressed:document.querySelector('[data-comparison="${id}"]').getAttribute('aria-pressed')})`);
    check(`Comparison ${id}`,result.visible.length===1&&result.visible[0]===id&&result.pressed==='true',result);
  }
  await evaluate(`document.querySelector('[data-project-filter="kitchen"]').click();document.querySelector('[data-project-category]:not([hidden]) [data-project-photo]').click();`);
  const initial=await evaluate(`({open:document.querySelector('dialog').open,counter:document.querySelector('[data-project-counter]').textContent,caption:document.querySelector('#project-dialog-caption').textContent,focus:document.activeElement.hasAttribute('data-project-close')})`);
  check('Lightbox opens with filtered images',initial.open&&initial.counter==='1 / 2'&&initial.focus,initial);
  await shot('1440-lightbox');
  await send('Input.dispatchKeyEvent',{type:'keyDown',key:'ArrowRight',code:'ArrowRight',windowsVirtualKeyCode:39});
  check('Lightbox keyboard next',await evaluate(`document.querySelector('[data-project-counter]').textContent==='2 / 2'`));
  await evaluate(`document.querySelector('[data-project-next]').focus()`);
  await send('Input.dispatchKeyEvent',{type:'keyDown',key:'Tab',code:'Tab',windowsVirtualKeyCode:9});
  check('Lightbox contains forward focus',await evaluate(`document.querySelector('dialog').contains(document.activeElement)`));
  await evaluate(`document.querySelector('[data-project-close]').focus()`);
  await send('Input.dispatchKeyEvent',{type:'keyDown',key:'Tab',code:'Tab',windowsVirtualKeyCode:9,modifiers:8});
  check('Lightbox contains reverse focus',await evaluate(`document.querySelector('dialog').contains(document.activeElement)`));
  await evaluate(`document.querySelector('[data-project-prev]').click()`);
  check('Lightbox previous button',await evaluate(`document.querySelector('[data-project-counter]').textContent==='1 / 2'`));
  await send('Input.dispatchKeyEvent',{type:'keyDown',key:'Escape',code:'Escape',windowsVirtualKeyCode:27});
  await delay(100);
  check('Escape closes and restores focus',await evaluate(`!document.querySelector('dialog').open&&document.activeElement.hasAttribute('data-project-photo')`));
  await evaluate(`document.querySelector('[data-project-filter="all"]').click()`);
  if(axePath){
    await evaluate(fs.readFileSync(axePath,'utf8'));
    for(const target of ['.project-opening','.project-story','.project-comparison','.project-films','.project-gallery-section']){
      const result=await evaluate(`axe.run(${JSON.stringify(target)},{runOnly:{type:'tag',values:['wcag2a','wcag2aa','wcag21aa','wcag22aa']}}).then(r=>({target:${JSON.stringify(target)},violations:r.violations.map(v=>({id:v.id,impact:v.impact,nodes:v.nodes.map(n=>({target:n.target,summary:n.failureSummary}))})),incomplete:r.incomplete.map(v=>v.id)}))`,true);
      report.a11y.push(result);check(`Axe ${target}`,result.violations.length===0,result);
    }
  }
  await send('Emulation.setEmulatedMedia',{features:[{name:'prefers-reduced-motion',value:'reduce'}]});await navigate(route);await ready();
  const reduced=await evaluate(`({reduced:matchMedia('(prefers-reduced-motion: reduce)').matches,animations:[...document.querySelectorAll('.project-motion')].map(i=>getComputedStyle(i).animationName),visible:[...document.querySelectorAll('.project-motion')].every(i=>getComputedStyle(i).opacity!=='0')})`);
  check('Reduced motion',reduced.reduced&&reduced.visible&&reduced.animations.every(a=>a==='none'),reduced);
  await send('Emulation.setScriptExecutionDisabled',{value:true});await navigate(route);await ready();
  const fallback=await evaluate(`({photos:document.querySelectorAll('[data-project-photo][href]').length,pairs:[...document.querySelectorAll('[data-comparison-panel]')].filter(p=>!p.hidden).length,filtersHidden:document.querySelector('.project-gallery-filters').hidden,hiddenContent:[...document.querySelectorAll('main h1,main h2,.project-motion')].filter(e=>getComputedStyle(e).opacity==='0').length})`);
  check('No JavaScript gallery and comparisons',fallback.photos===17&&fallback.pairs===3&&fallback.filtersHidden&&fallback.hiddenContent===0,fallback);
  await send('Emulation.setScriptExecutionDisabled',{value:false});await send('Emulation.setEmulatedMedia',{features:[]});
  await navigate('./');await ready();
  await evaluate(`document.querySelector('a[href="stays/the-sydney-base/"]').scrollIntoView({behavior:'instant',block:'center'})`);await shot('1440-sydney-card');
  check('Sydney card uses real photograph',await evaluate(`(()=>{const a=document.querySelector('a[href="stays/the-sydney-base/"]');return a.querySelector('img').currentSrc.includes('151-harris-st-pyrmont')&&!a.textContent.includes('Photos coming soon')})()`));
  check('Standalone homepage feature removed',await evaluate(`!document.querySelector('#featured-project')`));
  check('No runtime exceptions',report.exceptions.length===0,report.exceptions);
  fs.mkdirSync(path.join(root,'audit'),{recursive:true});fs.writeFileSync(path.join(root,'audit/project-qa.json'),JSON.stringify(report,null,2));
  console.log(JSON.stringify({browser:report.browser,viewports:report.viewports.length,checks:report.interactions.length,failures:report.failures},null,2));
  if(report.failures.length)process.exitCode=1;
  await send('Browser.close');
}finally{socket?.close();browser.kill();}
