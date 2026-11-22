import assert from 'node:assert/strict';
import {chromium} from 'playwright';
import {emptyProject} from '../dist/audio.js';
import {createContentTrack} from '../dist/content.js';
import {placeInsert} from '../dist/plugins.js';
import {mkdir} from 'node:fs/promises';

await mkdir('artifacts/plugin-command-bar',{recursive:true});
const browser=await chromium.launch({headless:true});
try{
 const page=await browser.newPage({viewport:{width:1440,height:960}}),errors=[];
 page.on('pageerror',error=>errors.push(error.message));
 await page.goto('http://127.0.0.1:8765/');
 await page.locator('[data-session-tab="create"]').click();await page.locator('#libraryNew').click();
 await page.locator('#modal').waitFor({state:'hidden'});
 const project=emptyProject();project.name='Plugin windows QA';
 project.tracks=['lead','keys'].map((type,index)=>{const t=createContentTrack(type);t.id='windowtrack'+index;t.name='Window '+index;placeInsert(t,0,'glue');return t;});
 let uploads=0;
 const upload=async()=>{
  const name=project.name+' '+(++uploads);
  await page.locator('#projectInput').setInputFiles({name:'windows.chayah',mimeType:'application/json',buffer:Buffer.from(JSON.stringify({format:'chayah-studio',project:{...project,name},masterVolume:-12,assets:[]}))});
  await page.waitForFunction(name=>document.querySelector('#projectName').value===name||document.querySelector('#toast').textContent.startsWith('Ouverture impossible :'),name);
  assert.equal(await page.locator('#toast').textContent(),'Projet importé et sauvegardé.','Window fixture must pass the real project importer');
  assert.equal(await page.locator('#projectName').inputValue(),name);
  await page.locator('#modal').waitFor({state:'hidden'});
 };
 await upload();
 await page.locator('[data-view="mixer"]').click();
 const strip=id=>page.locator('#mixerView [data-mixer-track="'+id+'"]');
 const open=async(id,plugin)=>strip(id).locator('[data-plugin-open="'+plugin+'"],[data-insert-open="'+plugin+'"]').first().click({force:true});
 const win=(id,plugin)=>page.locator('.floating-plugin').filter({has:page.locator('[data-plugin-control="suiteTrack"] option[value="'+id+'"][selected]')}).filter({has:page.locator(plugin==='instrument'?'[data-param^="instrument."]':'[data-param^="'+plugin+'."]')});
 await open('windowtrack0','instrument');await open('windowtrack0','glue');await open('windowtrack1','glue');
 const windows=page.locator('.floating-plugin');assert.equal(await windows.count(),3);
 assert.equal(await page.locator('.plugin-rack-drawer').count(),3);
 assert.equal(await page.locator('.plugin-rack-drawer[open]').count(),0,'Racks must start collapsed in individual plugin windows');
 assert.equal(await page.locator('.floating-plugin .track-rack-catalog:visible').count(),0,'No permanent rack behind plugin controls');
 const a=win('windowtrack0','glue'),b=win('windowtrack1','glue'),instrument=win('windowtrack0','instrument');
 await a.waitFor();await b.waitFor();await instrument.waitFor();
 const set=async(root,value)=>root.locator('[data-param="glue.threshold"]').evaluate((el,value)=>{el.value=String(value);el.dispatchEvent(new Event('input',{bubbles:true}));},value);
 const value=root=>root.locator('[data-param="glue.threshold"]').inputValue();
 await set(a,-12);await set(b,-28);assert.equal(await value(a),'-12');assert.equal(await value(b),'-28');
 // Track selection opens another view while the source continues to identify its own owner.
 await a.locator('[data-plugin-control="suiteTrack"]').selectOption('windowtrack1');
 assert.equal(await a.locator('[data-plugin-control="suiteTrack"]').inputValue(),'windowtrack0');
 assert.equal(await b.locator('[data-plugin-control="suiteTrack"]').inputValue(),'windowtrack1');
 assert.equal(await windows.count(),3);assert.equal(await value(a),'-12');assert.equal(await value(b),'-28');
 // Reopening focuses the same view, retains state, and expands only that view.
 await b.locator('[data-float-minimize]').click();assert.equal(await b.locator('[data-float-minimize]').getAttribute('aria-expanded'),'false');
 await open('windowtrack0','glue');assert.equal(await windows.count(),3);assert.equal(await a.getAttribute('data-active'),'true');
 assert.equal(await b.locator('[data-float-minimize]').getAttribute('aria-expanded'),'false');
 await open('windowtrack1','glue');assert.equal(await b.locator('[data-float-minimize]').getAttribute('aria-expanded'),'true');
 // A preset on one track does not alter the second copy of the same processor.
 await a.locator('[data-plugin-control="suitePreset"]').selectOption('0');assert.equal(await value(b),'-28');
 await set(a,-12);
 const oldBox=await a.boundingBox();
 await a.locator('[data-float-resize]').focus();await page.keyboard.press('ArrowLeft');
 const sized=await a.boundingBox();assert.ok(sized.width<oldBox.width);
 await a.locator('[data-float-close]').click();assert.equal(await windows.count(),2);
 await open('windowtrack0','glue');assert.equal(await windows.count(),3);assert.equal(await value(a),'-12');
 const reopened=await a.boundingBox();assert.ok(Math.abs(reopened.width-sized.width)<2,'each plugin retains its geometry');
 assert.equal(await value(b),'-28','closing a view keeps the other track untouched');
 // Automatic fitting on a smaller desktop viewport must not replace the user's saved geometry.
 const geometry=()=>page.evaluate(()=>JSON.parse(localStorage.getItem('warlike.window.geometry.v1')).pt['plugin:'+JSON.stringify(['windowtrack0','glue'])]);
 const saved=await geometry();
 await page.setViewportSize({width:800,height:960});
 await page.waitForFunction(()=>document.querySelector('#pluginFloat').getBoundingClientRect().width<=784);
 await a.locator('[data-float-minimize]').click();await a.locator('[data-float-minimize]').click();
 await a.locator('[data-float-close]').click();assert.deepEqual(await geometry(),saved);
 await page.setViewportSize({width:1440,height:960});await open('windowtrack0','glue');
 assert.ok(Math.abs((await a.boundingBox()).width-sized.width)<2,'desktop dimensions survive an automatic fit, minimize and close');
 // Namespaced controls and accessible title references remain unique during focus changes.
 assert.deepEqual(await page.evaluate(()=>{const seen=new Set();return [...document.querySelectorAll('[id]')].map(e=>e.id).filter(id=>seen.has(id)||!seen.add(id));}),[]);
 await page.keyboard.press('Escape');assert.equal(await windows.count(),2,'Escape closes only the active plugin');
 // Removing an insert closes that view, while unrelated instrument windows survive.
 await b.locator('.plugin-rack-drawer > summary').click();
 assert.equal(await b.locator('.plugin-rack-drawer').getAttribute('open'),'');
 await b.locator('[data-insert-slot="0"]').click();await page.locator('#removeCurrentInsert').click();
 assert.equal(await windows.count(),1);assert.equal(await instrument.count(),1);
 // Importing a project disposes every old view and managed-window registration.
 await upload();await page.waitForFunction(()=>!document.querySelector('.floating-plugin'));
 assert.deepEqual(await page.evaluate(async()=>{const {openManagedWindows}=await import('/windows.js');return openManagedWindows().filter(id=>id.startsWith('plugin:'));}),[]);
 await open('windowtrack0','instrument');await open('windowtrack0','glue');
 // Common chrome keeps the original presets, bypass and A/B callbacks local.
 await open('windowtrack1','glue');
 const fx=win('windowtrack0','glue'),other=win('windowtrack1','glue');
 const bar=root=>root.locator('.plugin-command-bar');
 assert.equal(await page.locator('.plugin-command-bar').count(),3);
 assert.match(await bar(fx).locator('.plugin-command-owner').textContent(),/Window 0 · Insert A/);
 assert.equal(await fx.locator('.suite-processor .suite-preset-bar').count(),0,'Preset chrome is above the individual hardware skin');
 assert.equal(await fx.locator('[data-plugin-history="undo"]').isDisabled(),true,'New project starts with no transient plugin history');
 await fx.locator('[data-param="glue.threshold"]').press('End');assert.equal(await value(fx),'0');
 await other.locator('[data-param="glue.threshold"]').press('Home');assert.equal(await value(other),'-60');
 await fx.focus();
 await bar(fx).locator('[data-plugin-history="undo"]').click();
 assert.equal(await value(fx),String(project.tracks[0].effects.glue.threshold));assert.equal(await value(other),'-60');
 await bar(fx).locator('[data-plugin-history="redo"]').click();
 assert.equal(await value(fx),'0');assert.equal(await value(other),'-60');
 await bar(fx).locator('[data-plugin-control="pluginCompareB"]').click();
 await fx.locator('[data-param="glue.threshold"]').press('Home');
 await bar(fx).locator('[data-plugin-control="pluginCompareA"]').click();
 assert.equal(await value(fx),'0');assert.equal(await value(other),'-60');
 await bar(fx).locator('[data-power="glue"]').click();
 assert.equal(await bar(fx).locator('[data-power="glue"]').getAttribute('aria-pressed'),'false');
 await bar(fx).locator('.plugin-command-more > summary').click();
 await bar(fx).locator('[data-plugin-control="resetPlugin"]').click();
 assert.equal(await value(fx),String(project.tracks[0].effects.glue.threshold));
 assert.equal(await bar(fx).locator('[data-power="glue"]').getAttribute('aria-pressed'),'false','Reset does not reactivate the bypassed insert');
 await bar(fx).locator('[data-plugin-history="undo"]').click();assert.equal(await value(fx),'0');
 assert.equal(await value(other),'-60','Local undo never restores an unrelated track');
 await bar(fx).locator('[data-plugin-control="pluginPresetNext"]').click();
 assert.ok(Number(await bar(fx).locator('[data-plugin-control="suitePreset"]').inputValue())>=0);
 assert.equal(await value(other),'-60');
 await bar(fx).locator('.plugin-command-more > summary').click();
 await page.keyboard.press('Escape');assert.equal(await windows.count(),3,'Escape closes the menu before the plugin');
 assert.equal(await bar(fx).locator('.plugin-command-more').getAttribute('open'),null);
 await bar(fx).locator('.plugin-command-more > summary').click();
 await bar(fx).getByRole('button',{name:'Mes presets et racks',exact:true}).click();
 assert.equal(await fx.locator('.plugin-preset-library').getAttribute('open'),'');
 assert.equal(await fx.locator('[data-plugin-control="userPluginSave"]').isVisible(),true);
 await fx.locator('.plugin-preset-library > summary').click();
 await page.screenshot({path:'artifacts/plugin-command-bar/desktop.png'});
 await page.setViewportSize({width:390,height:844});
 for(const root of await windows.all()){const r=await root.boundingBox();assert.ok(r.x>=0&&r.x+r.width<=391,'plugin fits mobile width');}
 const controls=await bar(fx).locator('button,select,summary').evaluateAll(nodes=>nodes.filter(n=>n.getClientRects().length).map(n=>({left:n.getBoundingClientRect().left,right:n.getBoundingClientRect().right})));
 assert.ok(controls.every(r=>r.left>=0&&r.right<=391),'Common commands fit the mobile viewport');
 await page.screenshot({path:'artifacts/plugin-command-bar/mobile.png'});
 assert.deepEqual(errors,[]);
 console.log('PASS: independent plugins, track ownership, presets, focus, collapse, geometry, insert removal, project disposal and mobile viewport');
 console.log('PASS: common commands, scoped undo/redo, bypass, A/B, reset, factory presets, secondary menus and mobile width');
}finally{await browser.close();}
