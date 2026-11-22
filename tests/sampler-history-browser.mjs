import assert from 'node:assert/strict';
import {chromium} from 'playwright';
import {mkdir,readFile} from 'node:fs/promises';
import {emptyProject} from '../dist/audio.js';
import {createContentTrack} from '../dist/content.js';
import {placeInsert} from '../dist/plugins.js';
import {sliceSettings} from '../dist/sampler.js';
import {encodeWav} from '../dist/wav.js';

await mkdir('artifacts/plugin-command-bar',{recursive:true});
const wav=seconds=>{
 const sampleRate=8000,data=Float32Array.from({length:sampleRate*seconds},(_,i)=>.2*Math.sin(i*2*Math.PI*220/sampleRate)*(i%2000<800?1:.2));
 return Buffer.from(encodeWav({numberOfChannels:1,length:data.length,sampleRate,getChannelData:()=>data}));
};
const original=wav(2),replacement=wav(1),project=emptyProject();project.name='Sampler history QA';
project.tracks=['samplerone','samplertwo'].map((id,i)=>{
 const track=createContentTrack('sampler');track.id=id;track.name='Sampler '+(i+1);
 track.sampler=sliceSettings({assetId:'sampleoriginal',markers:[0,1,2]},2);
 track.clips=[{id:'notes'+i,name:'Sampler notes',start:0,length:1,patternSteps:16,notes:[{id:'note'+i,step:0,midi:60,len:4,velocity:.8,muted:false}]}];
 if(!i)placeInsert(track,0,'glue');return track;
});
const archive={format:'chayah-studio',project,masterVolume:-12,assets:[{id:'sampleoriginal',name:'source.wav',data:original.toString('base64')}]};
const browser=await chromium.launch({headless:true});let page;const errors=[];let stage='import';
try{
 page=await browser.newPage({viewport:{width:1440,height:960}});page.on('pageerror',error=>errors.push(error.message));
 await page.goto('http://127.0.0.1:8765/');await page.locator('html[data-app-ready="true"]').waitFor({state:'attached'});
 await page.locator('#projectInput').setInputFiles({name:'samplers.chayah',mimeType:'application/json',buffer:Buffer.from(JSON.stringify(archive))});
 await page.waitForFunction(()=>document.querySelector('#projectName').value==='Sampler history QA'||document.querySelector('#toast').textContent.startsWith('Ouverture impossible :'));
 assert.equal(await page.locator('#toast').textContent(),'Projet importé et sauvegardé.');
 await page.locator('#modal').waitFor({state:'hidden'});await page.locator('[data-view="mixer"]').click();
 const open=(id,plugin)=>page.locator('#mixerView [data-mixer-track="'+id+'"] [data-plugin-open="'+plugin+'"],#mixerView [data-mixer-track="'+id+'"] [data-insert-open="'+plugin+'"]').first().click({force:true});
 await open('samplerone','instrument');await open('samplertwo','instrument');await open('samplerone','glue');
 const sampler=id=>page.locator('.floating-plugin[data-plugin-track="'+id+'"]').filter({has:page.locator('.slice-player')});
 const a=sampler('samplerone'),b=sampler('samplertwo');
 const fx=page.locator('.floating-plugin[data-plugin-track="samplerone"]').filter({has:page.locator('[data-param="glue.threshold"]')});
 const control=(root,name)=>root.locator('[data-plugin-control="'+name+'"]');
 const state=async root=>({reverse:await control(root,'sliceReverse').isChecked(),root:await control(root,'sliceRoot').inputValue(),mode:await control(root,'sliceMode').inputValue(),pads:await root.locator('[data-slice-pad]').count(),transpose:await root.locator('[data-param="instrument.transpose"]').inputValue()});
 const undo=()=>a.locator('[data-plugin-history="undo"]').click(),redo=()=>a.locator('[data-plugin-history="redo"]').click();
 await a.focus();assert.equal(await a.locator('[data-plugin-history="undo"]').isDisabled(),true,'Opening and normalizing a sample must not create an edit');
 const baseline=await state(a);
 stage='owned settings';
 await a.locator('[data-param="instrument.transpose"]').press('ArrowUp');
 await control(a,'sliceReverse').check();
 await control(a,'sliceRoot').fill('48');await control(a,'sliceRoot').press('Tab');
 await control(a,'sliceMode').selectOption('chromatic');
 await b.focus();await control(b,'sliceRoot').fill('55');await control(b,'sliceRoot').press('Tab');
 await fx.focus();await fx.locator('[data-param="glue.threshold"]').press('End');
 const other=await state(b);await a.focus();
 await control(a,'sliceCount').selectOption('4');await control(a,'sliceEven').click();assert.equal((await state(a)).pads,4);
 await control(a,'sliceClear').click();assert.equal((await state(a)).pads,1);
 await undo();assert.equal((await state(a)).pads,4);
 await redo();assert.equal((await state(a)).pads,1);
 await undo();assert.equal((await state(a)).pads,4);
 const expected=[
  {...baseline,transpose:'1',reverse:true,root:'48',mode:'chromatic'},
  {...baseline,transpose:'1',reverse:true,root:'48'},
  {...baseline,transpose:'1',reverse:true},
  {...baseline,transpose:'1'},baseline
 ];
 for(const value of expected){await undo();assert.deepEqual(await state(a),value);assert.deepEqual(await state(b),other);assert.equal(await fx.locator('[data-param="glue.threshold"]').inputValue(),'0');}
 assert.equal(await a.locator('[data-plugin-history="undo"]').isDisabled(),true,'Every real edit is undone, without normalization steps');
 stage='sample replacement';
 await control(a,'sliceFile').setInputFiles({name:'replacement.wav',mimeType:'audio/wav',buffer:replacement});
 await a.locator('.slice-player > strong').filter({hasText:'replacement.wav'}).waitFor();
 await undo();assert.equal(await a.locator('.slice-player > strong').textContent(),'source.wav');assert.deepEqual(await state(a),baseline);
 await redo();assert.equal(await a.locator('.slice-player > strong').textContent(),'replacement.wav');
 assert.deepEqual(await state(b),other);assert.equal(await fx.locator('[data-param="glue.threshold"]').inputValue(),'0');
 stage='project export';
 // Closing views retains the actual sampler parameters and both audio assets.
 for(const root of [fx,b,a]){await root.focus();await root.locator('[data-float-close]').click();}
 await page.locator('#projectMenuBtn').click();const downloaded=page.waitForEvent('download');await page.locator('#saveProject').click();
 const saved=JSON.parse(await readFile(await(await downloaded).path(),'utf8'));
 const first=saved.project.tracks.find(t=>t.id==='samplerone'),second=saved.project.tracks.find(t=>t.id==='samplertwo');
 assert.notEqual(first.sampler.assetId,'sampleoriginal');assert.equal(second.sampler.assetId,'sampleoriginal');assert.equal(second.sampler.root,55);
 assert.deepEqual(first.clips[0].notes,project.tracks[0].clips[0].notes);assert.deepEqual(second.clips[0].notes,project.tracks[1].clips[0].notes);assert.equal(first.effects.glue.threshold,0);
 assert.equal(saved.assets.length,2);assert.equal(saved.assets.find(a=>a.id==='sampleoriginal').data,original.toString('base64'));
 assert.equal(saved.assets.find(a=>a.id===first.sampler.assetId).data,replacement.toString('base64'));
 await open('samplerone','instrument');await page.screenshot({path:'artifacts/plugin-command-bar/sampler-history.png'});
 assert.deepEqual(errors,[]);
 console.log('PASS: sampler knobs, Reverse, root, mode, cuts and asset replacement undo/redo; other sampler, insert, notes and exported audio bytes preserved');
}catch(error){console.error('Sampler history failed at',stage,'page errors:',errors);await page?.screenshot({path:'artifacts/plugin-command-bar/sampler-history-failure.png'}).catch(()=>{});throw error}
finally{await browser.close();}
