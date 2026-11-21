import assert from 'node:assert/strict';
import {chromium} from 'playwright';
const browser=await chromium.launch({headless:true});
try{
 const page=await browser.newPage({viewport:{width:1440,height:960}});
 const errors=[];page.on('pageerror',e=>errors.push(e.message));
 await page.goto('http://127.0.0.1:8765/',{waitUntil:'load'});
 await page.locator('[data-session-tab="create"]').click();
 await page.locator('#libraryNew').click();await page.locator('#modal').waitFor({state:'hidden'});
 const p=await page.evaluate(async()=>{const {createFactorySession}=await import('/content.js');return createFactorySession('nocturne');});
 await page.locator('#projectInput').setInputFiles({name:'context.chayah',mimeType:'application/json',buffer:Buffer.from(JSON.stringify({format:'chayah-studio',project:p,masterVolume:-9,assets:[]}))});
 await page.waitForFunction(()=>document.getElementById('toast').textContent.includes('Projet importé et sauvegardé.'));
 const clips=page.locator('#trackRows [data-clip]'),count=await clips.count();assert.ok(count>0);
 const first=clips.first();
 await first.click({button:'right'});await page.locator('.studio-context-menu[role=menu]').first().waitFor({state:'visible'});
 assert.equal(await clips.count(),count,'right-click must not edit clips');
 await page.keyboard.press('Escape');assert.equal(await page.locator('.studio-context-menu').count(),0);
 await first.click({button:'right'});await page.locator('[data-context-action="clip-edit"]').hover();await page.locator('[data-context-action="clip-duplicate"]').click();
 assert.equal(await clips.count(),count+1);
 await page.locator('#undo').click();assert.equal(await clips.count(),count);
 const track=page.locator('#trackRows [data-select-track]').first();
 await track.click({button:'right'});await page.locator('[data-context-action="track-mix"]').hover();await page.locator('[data-context-action="track-mute"]').click();
 assert.equal(await page.locator('#trackRows [data-track]').first().locator('[data-action="mute"]').getAttribute('aria-pressed'),'true');
 const slot=page.locator('#trackRows .insert-slot button[data-insert-slot]').first();
 await slot.click({button:'right'});assert.ok(await page.locator('[data-context-action="insert-choose"]').isVisible());
 await page.keyboard.press('Escape');
 // Keyboard navigation and viewport clamping in the shared menu.
 await page.evaluate(async()=>{const {openContextMenu,action,group}=await import('/context-menus.js');openContextMenu(new MouseEvent('contextmenu',{clientX:1439,clientY:959}), 'QA',[group('qa-group','Group',[action('qa-leaf','Action',()=>document.body.dataset.qaContext='yes')])]);});
 await page.keyboard.press('ArrowRight');await page.keyboard.press('Enter');
 assert.equal(await page.locator('body').getAttribute('data-qa-context'),'yes');
 assert.deepEqual(errors,[]);
 console.log('PASS: contextual clip duplication and undo, track mute, insert menu, keyboard navigation');
}finally{await browser.close();}
