
async function sessionTab(page,tab){const button=page.locator('[data-session-tab="'+tab+'"]');await button.waitFor({state:'visible'});await button.click();}
import assert from 'node:assert/strict';
import { chromium } from 'playwright';
const browser=await chromium.launch({headless:true});
try {
 const page=await browser.newPage({viewport:{width:1440,height:900}});
 const errors=[];page.on('pageerror',e=>errors.push(e.message));
 await page.goto('http://127.0.0.1:8765/',{waitUntil:'load'});
 for(const id of ['play','stop','record','bpm','projectName','projectMenuBtn','sessionTrackList','exportWav']) {
  assert.ok(await page.locator('#'+id).count(),id+' must exist');
 }
 // First launch must show a deliberate project choice instead of restoring 'current'.
 await sessionTab(page,'create');await page.locator('#libraryNew').waitFor({state:'visible'});
 assert.ok(await page.locator('#projectHomeCreate').count(),'project creation form is available');
 assert.ok(await page.locator('#libraryImport').isVisible(),'portable project import is available');
 await sessionTab(page,'open');assert.ok(await page.locator('.project-home-banner').isVisible(),'local storage warning is shown');
 assert.ok(await page.locator('#modal').isVisible(),'project library should open on first launch');
 await sessionTab(page,'create');
 const activeProjectStyle=await page.evaluate(()=>({
   cssHref:[...document.querySelectorAll('link[rel="stylesheet"]')].map(el=>el.href).find(h=>h.includes('studio.css')),
   contentWidth:document.querySelector('.project-home')?.getBoundingClientRect().width,
   parentWidth:document.querySelector('#modalBody')?.getBoundingClientRect().width,
   createButtonRight:document.querySelector('#libraryNew')?.getBoundingClientRect().right,
   dialogRight:document.querySelector('#modal')?.getBoundingClientRect().right
 }));
 assert.ok(activeProjectStyle.cssHref?.includes('0.14.2-project-home'),'browser must load fresh Studio CSS');
 assert.ok(activeProjectStyle.contentWidth<=activeProjectStyle.parentWidth+1,'project home must fit modal body');
 assert.ok(activeProjectStyle.createButtonRight<=activeProjectStyle.dialogRight+1,'create action must be visible within modal');

 // Project-home UI must never exceed the dialog or viewport (especially cloud actions).
 for(const width of [1104,768,390]){
   await page.setViewportSize({width,height:900});
   const bounds=await page.evaluate(()=>{
     const dialog=document.querySelector('#modal'),body=document.querySelector('.project-home');
     const input=document.querySelector('#libraryName'),button=document.querySelector('#libraryNew');
     const cloud=document.querySelector('#studioCloudSave');
     const d=dialog.getBoundingClientRect(),b=body.getBoundingClientRect();
     const a=[input,button,cloud].filter(el=>el.getClientRects().length).map(el=>el.getBoundingClientRect());
     return {vw:innerWidth,dialog:[d.left,d.right],body:[b.left,b.right],elements:a.map(x=>[x.left,x.right]),scroll:body.scrollWidth,client:body.clientWidth};
   });
   assert.ok(bounds.dialog[0]>=-1&&bounds.dialog[1]<=width+1,'dialog exceeds viewport '+width+': '+JSON.stringify(bounds));
   assert.ok(bounds.body[0]>=bounds.dialog[0]-1&&bounds.body[1]<=bounds.dialog[1]+1,'project home exceeds dialog '+width);
   assert.ok(bounds.scroll<=bounds.client+2,'horizontal scrolling in project home '+width+': '+JSON.stringify(bounds));
   for(const [left,right] of bounds.elements)assert.ok(left>=bounds.dialog[0]-1&&right<=bounds.dialog[1]+1,'project action clipped '+width);
 }
 await page.setViewportSize({width:1440,height:900});
 await sessionTab(page,'create');await page.locator('#libraryName').fill('QA Session A');
 await sessionTab(page,'create');await page.locator('#libraryNew').click();
 await page.locator('#modal').waitFor({state:'hidden'});
 assert.equal(await page.locator('#projectName').inputValue(),'QA Session A');
 // Modify and wait for a real persisted save before changing project.
 await page.locator('#bpm').fill('117');
 // A resize redraw must not replace an uncommitted tempo input.
 await page.evaluate(()=>window.dispatchEvent(new Event('resize')));
 await page.waitForTimeout(180);
 assert.equal(await page.locator('#bpm').inputValue(),'117','redraw must preserve focused tempo edit');
 await page.locator('#bpm').press('Tab');
 await page.locator('#saveStatus').getByText('Enregistré sur cet appareil').waitFor({state:'visible'});
 // Project A persists across explicit project switches; B starts blank.
 await page.locator('#projectMenuBtn').click();
 await page.locator('#myProjects').click();
 await sessionTab(page,'create');await page.locator('#libraryName').fill('QA Session B');
 await sessionTab(page,'create');await page.locator('#libraryNew').click();
 await page.locator('#modal').waitFor({state:'hidden'});
 assert.equal(await page.locator('#projectName').inputValue(),'QA Session B');
 assert.equal(await page.locator('#bpm').inputValue(),'120','new projects must not inherit the tempo of project A');
 await page.locator('#projectMenuBtn').click();
 await page.locator('#myProjects').click();
 await sessionTab(page,'open');await page.locator('[data-project-open]').nth(1).click();
 await page.locator('#modal').waitFor({state:'hidden'});
 assert.equal(await page.locator('#projectName').inputValue(),'QA Session A');
 assert.equal(await page.locator('#bpm').inputValue(),'117','project A must restore its own tempo');
 // Cold boot: projects must be listed, not silently restored from a shared current key.
 await page.reload({waitUntil:'load'});
 await sessionTab(page,'create');await page.locator('#libraryNew').waitFor({state:'visible'});
 assert.ok(await page.locator('[data-project-open]').count()===2,'both projects survive page reload');
 await sessionTab(page,'open');await page.locator('[data-project-open]').nth(1).click();
 await page.locator('#modal').waitFor({state:'hidden'});
 assert.equal(await page.locator('#projectName').inputValue(),'QA Session A');
 assert.equal(await page.locator('#bpm').inputValue(),'117','saved settings must survive a cold reload');
 
 await page.locator('#fileMenuBtn').click();
 assert.equal(await page.locator('#fileMenuBtn').getAttribute('aria-expanded'),'true');
 await page.locator('#fileMenuBtnPopup').waitFor({state:'visible'});
 assert.equal(await page.locator('#fileMenuBtn').getAttribute('aria-controls'),'fileMenuBtnPopup');
 await page.keyboard.press('ArrowRight');
 await page.locator('#fileMenuBtnPopup-level-1').waitFor({state:'visible'});
 assert.ok(await page.locator('#fileMenuBtnPopup-level-1').getByRole('menuitem',{name:/Nouvelle session/}).isVisible());
 await page.keyboard.press('ArrowLeft');
 await page.locator('#fileMenuBtnPopup-level-1').waitFor({state:'hidden'});
 await page.keyboard.press('Escape');
 assert.equal(await page.locator('#fileMenuBtn').getAttribute('aria-expanded'),'false');
 assert.ok(await page.locator('#fileMenuBtnPopup').isHidden());
 assert.equal(await page.locator('.app-cascade-menu').count(),0);
 await page.locator('#editMenuBtn').click();
 assert.equal(await page.locator('#editMenuBtn').getAttribute('aria-expanded'),'true');
 await page.locator('#fileMenuBtn').click();
 assert.equal(await page.locator('#editMenuBtn').getAttribute('aria-expanded'),'false');
 assert.equal(await page.locator('#fileMenuBtn').getAttribute('aria-expanded'),'true');
 await page.locator('#projectName').click();
 assert.equal(await page.locator('#fileMenuBtn').getAttribute('aria-expanded'),'false');
 await page.locator('#projectMenuBtn').click();
 await page.locator('#projectMenu').waitFor({state:'visible'});
 assert.ok(await page.locator('#saveProject').isVisible(),'project export should be available in menu');
 await page.locator('#projectMenuBtn').click();
 await page.locator('#bpm').fill('120');
 await page.locator('#bpm').press('Tab');
 assert.equal(await page.locator('#bpm').inputValue(),'120');
 await page.locator('[data-view="mixer"]').click();
 await page.locator('#mixerView').waitFor({state:'visible'});
 assert.ok(await page.locator('#mixerView .mixer-channel:not(.mixer-master) [data-add-insert-track]').count()>0,'Each mixer track needs a plugin picker');
 await page.locator('#mixerView .mixer-master [data-add-insert-track="master"]').click();
 await page.locator('#modal').waitFor({state:'visible'});
 assert.ok(await page.locator('#pluginPickerResults [data-picker-load]').count()>=20,'Master must expose existing effects');
 await page.locator('#pluginSearch').fill('NOTCH');
 await page.locator('[data-picker-load="notch"]').click();
 await page.locator('#modal').waitFor({state:'hidden'});
 await page.locator('[data-master-power="notch"]').waitFor({state:'visible'});
 await page.locator('[data-view="mixer"]').click();
 await page.locator('#mixerView .mixer-master [data-insert-open="notch"]').waitFor({state:'visible'});
 await page.locator('#mixerView .mixer-master [data-add-insert-track="master"]').click();
 assert.ok(await page.locator('[data-picker-load="notch"]').isDisabled(),'Master should block duplicate inserts');
 await page.locator('#closeModal').click();
 await page.locator('#openMastering').click();
 await page.locator('[data-master-power="notch"]').waitFor({state:'visible'});
 assert.ok(await page.locator('#masteringView [data-add-insert-track="master"]').isVisible(),'Mastering needs an add-plugin control');
 // REAPER RPP must not import silently without media; supplied WAV restores the clip.
 const reaperText='<REAPER_PROJECT 0.1 "7.5" 1700000000\n TEMPO 120 4 4\n <TRACK {AAA}\n NAME "VOICE"\n <ITEM\n POSITION 0\n LENGTH 0.1\n <SOURCE WAVE\n FILE "Voice.wav"\n >\n >\n >\n>';
 const wav=Buffer.alloc(44+8820);
 wav.write('RIFF',0);wav.writeUInt32LE(wav.length-8,4);wav.write('WAVE',8);
 wav.write('fmt ',12);wav.writeUInt32LE(16,16);wav.writeUInt16LE(1,20);wav.writeUInt16LE(1,22);
 wav.writeUInt32LE(44100,24);wav.writeUInt32LE(88200,28);wav.writeUInt16LE(2,32);wav.writeUInt16LE(16,34);
 wav.write('data',36);wav.writeUInt32LE(8820,40);
 await page.locator('#reaperInput').setInputFiles([{name:'REAPER QA.rpp',mimeType:'text/plain',buffer:Buffer.from(reaperText)}]);
 await page.locator('#confirmReaper').waitFor({state:'visible'});
 assert.ok(await page.locator('#confirmReaper').isDisabled(),'RPP media should not be silently omitted');
 await page.locator('#reaperMediaFiles').setInputFiles([{name:'Voice.wav',mimeType:'audio/wav',buffer:wav}]);
 await page.locator('#confirmReaper').waitFor({state:'visible'});
 assert.equal(await page.locator('#confirmReaper').isDisabled(),false,'audio source must be resolved');
 await page.locator('#confirmReaper').click();
 await page.locator('#modal').waitFor({state:'hidden'});
 assert.equal(await page.locator('#projectName').inputValue(),'REAPER QA');
 // Public vocal demo must open as a real local project with audible guide WAV
 // and native WarLike insert chains on its vocal lanes.
 await page.locator('#studioMoreMenu>summary').click();
 await page.locator('[data-public-demo="vox-trap"]').click();
 await page.waitForFunction(()=>document.getElementById('projectName').value==='WARLIKE · Trap VOX Mix',null,{timeout:20000});
 assert.equal(await page.locator('#projectName').inputValue(),'WARLIKE · Trap VOX Mix');
 assert.ok(await page.locator('#trackRows').getByText('LEAD · TRAP VOX').count(),'lead vocal lane missing');
 await page.locator('[data-view="mixer"]').click();
 assert.ok(await page.locator('#mixerView').getByText('LEAD · TRAP VOX').count(),'mixed vocal lane missing from mixer');
 await page.locator('#saveStatus').getByText('Enregistré sur cet appareil').waitFor({state:'visible',timeout:15000});
 await page.reload({waitUntil:'load'});
 await sessionTab(page,'open');await page.locator('[data-project-open]').first().click();
 await page.locator('#modal').waitFor({state:'hidden'});
 assert.equal(await page.locator('#projectName').inputValue(),'WARLIKE · Trap VOX Mix','voice demo must persist with WAV media assets');
 assert.deepEqual(errors,[],'studio boot raised JavaScript errors');
 const mobile=await browser.newPage({viewport:{width:390,height:844},isMobile:true,hasTouch:true});
 await mobile.goto('http://127.0.0.1:8765/',{waitUntil:'load'});
 for(const id of ['projectMenuBtn','play','stop','bpm']) {
  const el=mobile.locator('#'+id);
  assert.ok(await el.count(),'missing mobile control '+id);
  const rect=await el.boundingBox();assert.ok(rect&&rect.width>0&&rect.height>0,'hidden mobile control '+id);
 }
 await sessionTab(mobile,'create');await mobile.locator('#libraryNew').waitFor({state:'visible'});
 await sessionTab(mobile,'create');await mobile.locator('#libraryNew').click();
 await mobile.locator('#modal').waitFor({state:'hidden'});
 assert.equal(await mobile.locator('body').evaluate(el=>el.classList.contains('mobile-compact')),true,'mobile compact mode must activate at 390px');
 const switches=mobile.locator('.mobile-compact-switches [data-mobile-panel]');
 assert.equal(await switches.count(),4,'mobile must offer four accessible panel switches');
 await mobile.locator('.mobile-compact-switches [data-mobile-panel="sidebar"]').click();
 assert.equal(await mobile.locator('body').getAttribute('data-mobile-panel'),'sidebar');
 assert.equal(await mobile.locator('.mobile-compact-switches [data-mobile-panel="sidebar"]').getAttribute('aria-expanded'),'true');
 await mobile.locator('.mobile-compact-switches [data-mobile-panel="sidebar"]').click();
 assert.equal(await mobile.locator('body').getAttribute('data-mobile-panel'),'none');
 await mobile.locator('.mobile-compact-switches [data-mobile-panel="windows"]').click();
 assert.equal(await mobile.locator('body').getAttribute('data-mobile-panel'),'windows');
 await mobile.close();
 await page.goto('http://127.0.0.1:8765/_storage-qa.html',{waitUntil:'load'});
 await page.locator('#run').click();
 await page.waitForFunction(()=>/TOUS LES CONTRÔLES|FAIL/.test(document.querySelector('#results').textContent));
 assert.match(await page.locator('#results').textContent(),/TOUS LES CONTRÔLES SAUVEGARDES ONT RÉUSSI/);
 console.log('PASS: Studio desktop transport, project menu, tempo and mobile essentials');
} finally { await browser.close(); }
