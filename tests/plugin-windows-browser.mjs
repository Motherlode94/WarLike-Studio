import assert from 'node:assert/strict';
import {chromium} from 'playwright';
import {emptyProject} from '../dist/audio.js';
import {createContentTrack} from '../dist/content.js';
import {placeInsert} from '../dist/plugins.js';

const browser=await chromium.launch({headless:true});
try{
 const page=await browser.newPage({viewport:{width:1440,height:960}}),errors=[];
 page.on('pageerror',error=>errors.push(error.message));
 await page.goto('http://127.0.0.1:8765/');
 await page.locator('[data-session-tab="create"]').click();await page.locator('#libraryNew').click();
 const project=emptyProject();project.name='Plugin windows QA';
 project.tracks=['lead','keys'].map((type,index)=>{const t=createContentTrack(type);t.id='window-track-'+index;t.name='Window '+index;placeInsert(t,0,'glue');return t;});
 const upload=()=>page.locator('#projectInput').setInputFiles({name:'windows.chayah',mimeType:'application/json',buffer:Buffer.from(JSON.stringify({format:'chayah-studio',project,masterVolume:-12,assets:[]}))});
 await upload();await page.waitForFunction(()=>document.querySelector('#projectName').value==='Plugin windows QA');
 await page.locator('[data-view="mixer"]').click();
 const strip=id=>page.locator('#mixerView [data-mixer-track="'+id+'"]');
 const open=async(id,plugin)=>strip(id).locator('[data-plugin-open="'+plugin+'"],[data-insert-open="'+plugin+'"]').first().click({force:true});
 const win=(id,plugin)=>page.locator('.floating-plugin').filter({has:page.locator('[data-plugin-control="suiteTrack"] option[value="'+id+'"][selected]')}).filter({has:page.locator(plugin==='instrument'?'[data-param^="instrument."]':'[data-param^="'+plugin+'."]')});
 await open('window-track-0','instrument');await open('window-track-0','glue');await open('window-track-1','glue');
 const windows=page.locator('.floating-plugin');assert.equal(await windows.count(),3);
 const a=win('window-track-0','glue'),b=win('window-track-1','glue'),instrument=win('window-track-0','instrument');
 await a.waitFor();await b.waitFor();await instrument.waitFor();
 const set=async(root,value)=>root.locator('[data-param="glue.threshold"]').evaluate((el,value)=>{el.value=String(value);el.dispatchEvent(new Event('input',{bubbles:true}));},value);
 const value=root=>root.locator('[data-param="glue.threshold"]').inputValue();
 await set(a,-12);await set(b,-28);assert.equal(await value(a),'-12');assert.equal(await value(b),'-28');
 // Track selection opens another view while the source continues to identify its own owner.
 await a.locator('[data-plugin-control="suiteTrack"]').selectOption('window-track-1');
 assert.equal(await a.locator('[data-plugin-control="suiteTrack"]').inputValue(),'window-track-0');
 assert.equal(await b.locator('[data-plugin-control="suiteTrack"]').inputValue(),'window-track-1');
 assert.equal(await windows.count(),3);assert.equal(await value(a),'-12');assert.equal(await value(b),'-28');
 // Reopening focuses the same view, retains state, and expands only that view.
 await b.locator('[data-float-minimize]').click();assert.equal(await b.locator('[data-float-minimize]').getAttribute('aria-expanded'),'false');
 await open('window-track-0','glue');assert.equal(await windows.count(),3);assert.equal(await a.getAttribute('data-active'),'true');
 assert.equal(await b.locator('[data-float-minimize]').getAttribute('aria-expanded'),'false');
 await open('window-track-1','glue');assert.equal(await b.locator('[data-float-minimize]').getAttribute('aria-expanded'),'true');
 // A preset on one track does not alter the second copy of the same processor.
 await a.locator('[data-plugin-control="suitePreset"]').selectOption('0');assert.equal(await value(b),'-28');
 await set(a,-12);
 const oldBox=await a.boundingBox();
 await a.locator('[data-float-resize]').focus();await page.keyboard.press('ArrowLeft');
 const sized=await a.boundingBox();assert.ok(sized.width<oldBox.width);
 await a.locator('[data-float-close]').click();assert.equal(await windows.count(),2);
 await open('window-track-0','glue');assert.equal(await windows.count(),3);assert.equal(await value(a),'-12');
 const reopened=await a.boundingBox();assert.ok(Math.abs(reopened.width-sized.width)<2,'each plugin retains its geometry');
 assert.equal(await value(b),'-28','closing a view keeps the other track untouched');
 // Automatic fitting on a smaller desktop viewport must not replace the user's saved geometry.
 const geometry=()=>page.evaluate(()=>JSON.parse(localStorage.getItem('warlike.window.geometry.v1')).pt['plugin:'+JSON.stringify(['window-track-0','glue'])]);
 const saved=await geometry();
 await page.setViewportSize({width:800,height:960});
 await page.waitForFunction(()=>document.querySelector('#pluginFloat').getBoundingClientRect().width<=784);
 await a.locator('[data-float-minimize]').click();await a.locator('[data-float-minimize]').click();
 await a.locator('[data-float-close]').click();assert.deepEqual(await geometry(),saved);
 await page.setViewportSize({width:1440,height:960});await open('window-track-0','glue');
 assert.ok(Math.abs((await a.boundingBox()).width-sized.width)<2,'desktop dimensions survive an automatic fit, minimize and close');
 // Namespaced controls and accessible title references remain unique during focus changes.
 assert.deepEqual(await page.evaluate(()=>{const seen=new Set();return [...document.querySelectorAll('[id]')].map(e=>e.id).filter(id=>seen.has(id)||!seen.add(id));}),[]);
 await page.keyboard.press('Escape');assert.equal(await windows.count(),2,'Escape closes only the active plugin');
 // Removing an insert closes that view, while unrelated instrument windows survive.
 await b.locator('[data-insert-slot="0"]').click({force:true});await page.locator('#removeCurrentInsert').click();
 assert.equal(await windows.count(),1);assert.equal(await instrument.count(),1);
 // Importing a project disposes every old view and managed-window registration.
 await upload();await page.waitForFunction(()=>!document.querySelector('.floating-plugin'));
 assert.deepEqual(await page.evaluate(async()=>{const {openManagedWindows}=await import('/windows.js');return openManagedWindows().filter(id=>id.startsWith('plugin:'));}),[]);
 await open('window-track-0','instrument');await open('window-track-0','glue');
 await page.setViewportSize({width:390,height:844});
 for(const root of await windows.all()){const r=await root.boundingBox();assert.ok(r.x>=0&&r.x+r.width<=391,'plugin fits mobile width');}
 assert.deepEqual(errors,[]);
 console.log('PASS: independent plugins, track ownership, presets, focus, collapse, geometry, insert removal, project disposal and mobile viewport');
}finally{await browser.close();}
