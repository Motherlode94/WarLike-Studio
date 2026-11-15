import assert from 'node:assert/strict';
import {mkdir} from 'node:fs/promises';
import {chromium} from 'playwright';
const browser=await chromium.launch({headless:true});
try{
 const page=await browser.newPage({viewport:{width:1440,height:900}}),errors=[];page.on('pageerror',e=>errors.push(e.message));
 await page.goto('http://127.0.0.1:8765/');await page.locator('#modal [data-public-demo="trap"]').click();await page.locator('#modal').waitFor({state:'hidden'});
 await page.locator('[data-view="arrange"]').click();
 const edit=await page.evaluate(()=>{const rect=s=>{const r=document.querySelector(s).getBoundingClientRect();return {x:r.x,y:r.y,width:r.width,height:r.height,right:r.right,bottom:r.bottom};};return {timeline:rect('#timelineView'),nav:rect('.signature-workspaces'),bottom:rect('.detail-panel'),track:rect('.track-select'),body:document.body.scrollWidth,vh:innerHeight,vw:innerWidth};});
 assert.ok(edit.timeline.height>edit.vh*.65,'Edit must give the timeline most of the window: '+JSON.stringify(edit));assert.equal(edit.bottom.height,0);assert.ok(edit.nav.height<=35);assert.ok(edit.body<=edit.vw+1);assert.ok(edit.track.width>180,'track names must remain readable');
 await mkdir('artifacts/reference-workspaces',{recursive:true});await page.screenshot({path:'artifacts/reference-workspaces/studio-edit.png'});
 await page.locator('[data-view="mixer"]').click();await page.locator('#mixerView').waitFor({state:'visible'});
 const mix=await page.evaluate(()=>{const strips=[...document.querySelectorAll('#mixerView .mixer-channel')].map(n=>{const r=n.getBoundingClientRect();return {x:r.x,width:r.width,height:r.height};});const faders=[...document.querySelectorAll('.mixer-fader')].map(n=>n.getBoundingClientRect());const fader=faders[0];return {strips,faderHeight:fader.height,faderTops:faders.map(r=>r.top)};});
 assert.ok(mix.faderHeight>200,'Mix needs usable vertical faders: '+JSON.stringify(mix));assert.ok(Math.max(...mix.faderTops)-Math.min(...mix.faderTops)<2,'all console faders must align');assert.ok(Math.abs(mix.strips[1].x-mix.strips[0].x-mix.strips[0].width)<2,'console strips should be contiguous');await page.screenshot({path:'artifacts/reference-workspaces/studio-mix.png'});
 await page.locator('[data-view="arrange"]').click();await page.locator('#trackRows .track-row').nth(3).locator('[data-clip]').first().dblclick();await page.locator('#prNotes [data-pr-note]').first().waitFor({state:'visible'});
 const notes=await page.locator('#prNotes [data-pr-note]').count();const piano=await page.evaluate(()=>({surface:document.body.dataset.studioSurface,height:document.querySelector('.fl-piano').getBoundingClientRect().height,velocity:document.querySelector('#prVelocityScroll').getBoundingClientRect().height,vh:innerHeight}));assert.equal(piano.surface,'piano');assert.ok(piano.height>piano.vh*.7);assert.ok(piano.velocity>=60);
 await page.locator('#prInstrument').selectOption('keys');assert.equal(await page.locator('#prNotes [data-pr-note]').count(),notes,'changing timbre must retain existing notes');await page.screenshot({path:'artifacts/reference-workspaces/studio-piano.png'});
 await page.locator('#prExpand').click();assert.equal(await page.locator('body').getAttribute('data-studio-surface'),'playlist');
 await page.locator('[data-view="library"]').click();await page.locator('#compareInstruments').click();await page.locator('#auditionA').selectOption('pad');await page.locator('#auditionPlayA').click();await page.locator('#auditionStatus').filter({hasText:'A · HALO'}).waitFor();await page.locator('#auditionStop').click();await page.locator('#closeModal').click();
 await page.setViewportSize({width:390,height:844});await page.locator('[data-view="arrange"]').click();await page.locator('[data-mobile-panel="windows"]').click();assert.ok(await page.locator('.reference-window-menu[open] [data-ws="piano"]').isVisible());assert.ok(await page.locator('#play').isVisible());assert.ok(await page.locator('#projectMenuBtn').isVisible());
 assert.deepEqual(errors,[]);console.log('PASS: Edit/Mix/Piano geometry, existing MIDI notes, audible A/B workflow and mobile window access',edit,piano);
}finally{await browser.close();}
