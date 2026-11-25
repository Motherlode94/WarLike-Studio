import assert from 'node:assert/strict';
import {mkdir,readFile,writeFile} from 'node:fs/promises';
import {chromium} from 'playwright';
import {emptyProject} from '../dist/audio.js';
import {createContentTrack,SESSION_TEMPLATES} from '../dist/content.js';
import {fullSongBars} from '../dist/full-song.js';
import {encodeWav} from '../dist/wav.js';
import {resizeStudio} from './browser-viewport.mjs';
const folder='artifacts/project-compositions';await mkdir(folder,{recursive:true});
const browser=await chromium.launch({headless:true});let page,phase='boot';const errors=[];
try{
 page=await browser.newPage({viewport:{width:1116,height:715}});page.on('pageerror',e=>errors.push(e.message));
 await page.goto('http://127.0.0.1:8765/');await page.locator('html[data-app-ready=true]').waitFor({state:'attached'});
 const project=emptyProject();project.name='Mon morceau conservé';project.bpm=99;project.masterVolume=-18;
 const track=createContentTrack('wltitan');track.clips=[{id:'mine',name:'Mon MIDI',start:0,length:1,notes:[{midi:60,step:0,len:8,velocity:.7}]}];project.tracks.push(track);
 const pcm=Float32Array.from({length:4000},(_,i)=>.1*Math.sin(i*2*Math.PI*220/8000));const wav=Buffer.from(encodeWav({numberOfChannels:1,length:pcm.length,sampleRate:8000,getChannelData:()=>pcm}));
 project.tracks[0].clips=[{id:'audiomine',name:'Ma prise',start:0,length:1,audioId:'mine-wav'}];
 phase='fixture import';
 await page.locator('#projectInput').setInputFiles({name:'mine.chayah',mimeType:'application/json',buffer:Buffer.from(JSON.stringify({format:'chayah-studio',project,masterVolume:-18,assets:[{id:'mine-wav',name:'mine.wav',data:wav.toString('base64')}]}))});
 await page.waitForFunction(()=>/Projet importé et sauvegardé|Ouverture impossible/.test(document.querySelector('#toast').textContent));assert.equal(await page.locator('#toast').textContent(),'Projet importé et sauvegardé.');
 assert.equal(await page.locator('#projectName').inputValue(),'Mon morceau conservé');await page.locator('#modal').waitFor({state:'hidden'});
 const save=async()=>{await page.locator('#projectMenuBtn').click();const pending=page.waitForEvent('download');await page.locator('#saveProject').click();return JSON.parse(await readFile(await(await pending).path(),'utf8'));};
 const home=async()=>{await page.locator('#projectMenuBtn').click();await page.locator('#myProjects').click();};
 const demos=async()=>{await page.locator('[data-session-tab=demos]').click();};
 const root=page.locator('.project-home-compositions');
 const playing=async name=>page.waitForFunction(name=>document.querySelector('.project-home-compositions .session-preview-panel')?.dataset.state==='playing'&&document.querySelector('.project-home-compositions [data-session-preview-status]').textContent.includes(name),name,{timeout:60000});
 const idle=async()=>page.waitForFunction(()=>document.querySelector('.project-home-compositions .session-preview-panel')?.dataset.state==='idle');
 const ids=async()=>root.locator('[data-composition]').evaluateAll(nodes=>nodes.map(n=>n.dataset.composition));
 const jumpTo=async id=>{
  const index=SESSION_TEMPLATES.findIndex(t=>t.id===id);
  assert.ok(index>=0,'Missing composition '+id);
  const target=Math.floor(index/3);
  for(let attempt=0;attempt<Math.ceil(SESSION_TEMPLATES.length/3)+1;attempt++){
   const visible=await ids();if(visible.includes(id))return;
   const label=await root.locator('[data-composition-page-status]').textContent();
   const current=Number(label?.match(/Page (\\d+)/)?.[1]||0)-1;
   if(current<0)throw Error('Composition pager state missing');
   await root.locator('[data-composition-page='+(current<target?'next':'previous')+']').click();
  }
  throw Error('Composition '+id+' unreachable through pagination');
 };
 const before=await save();await home();await demos();
 assert.equal(await page.locator('.project-demo-catalogs').count(),0,'main demo catalog must not be split into separate menus');
 assert.equal(await page.locator('.project-short-demos [data-public-demo]').count(),13);
 assert.equal(await page.locator('.project-home-compositions').isVisible(),true);
 assert.equal(await page.locator('.project-short-demos').isVisible(),true);
 const found=[];
 const pageCount=Math.ceil(SESSION_TEMPLATES.length/3);
 for(let p=0;p<pageCount;p++){
  phase='catalog page '+p;const current=await ids();assert.equal(current.length,Math.min(3,SESSION_TEMPLATES.length-p*3));found.push(...current);
  for(const id of current){const t=SESSION_TEMPLATES.find(t=>t.id===id),row=root.locator('[data-composition='+id+']');assert.match(await row.textContent(),new RegExp(t.bpm+' BPM'));assert.match(await row.textContent(),new RegExp((t.bars||fullSongBars(t.bpm))+' mesures'));}
  if(p<pageCount-1)await root.locator('[data-composition-page=next]').click();
 }
 assert.deepEqual(found,SESSION_TEMPLATES.map(t=>t.id));assert.equal(await root.locator('[data-composition-page=next]').isDisabled(),true);
 phase='modal auditions';await jumpTo('kin');await root.locator('[data-session-preview=kin]').press('Enter');await playing('Kin après minuit');
 await page.waitForFunction(()=>document.querySelector('.project-home-compositions progress').value>0);
 await root.locator('[data-session-preview=kin]').press('Space');await idle();
 await jumpTo('lumiere');await root.locator('[data-session-preview=lumiere]').click();await playing('Lumière en ville');
 await jumpTo('rives');await idle();
 await root.locator('[data-session-preview=rives]').click();await playing('Rives de Kin');
 assert.equal(await page.locator('.project-short-demos').isVisible(),true,'demos remain visible while auditioning full compositions');
 assert.equal(await page.locator('.project-short-demos [data-public-demo]').count(),13);
 await page.locator('[data-session-tab=open]').click();await idle();await demos();
 await root.locator('[data-session-preview=rives]').click();await playing('Rives de Kin');await page.locator('#closeModal').click();
 await page.waitForFunction(()=>!document.querySelector('#audioStatus').textContent.includes('Préécoute'));assert.equal(await page.locator('.project-home-compositions').count(),0);
 const after=await save();assert.deepEqual(after.project,before.project);assert.deepEqual(after.assets,before.assets);assert.equal(after.masterVolume,-18);
 phase='responsive themes';
 for(const theme of ['forest','graphite','slate','light']){
  await resizeStudio(page,{width:1116,height:715});await page.locator('.top-actions [data-studio-theme]').selectOption(theme);await home();await demos();
  await page.screenshot({path:folder+'/desktop-'+theme+'.png'});
  await resizeStudio(page,{width:390,height:844});
  for(const button of await root.locator('button').all()){
   if(await button.isDisabled())continue;await button.scrollIntoViewIfNeeded();const r=await button.boundingBox();assert.ok(r&&r.x>=0&&r.x+r.width<=391&&r.y>=0&&r.y+r.height<=845,'modal action must remain reachable');
  }
  await jumpTo('nocturne');await root.locator('[data-session-preview=nocturne]').scrollIntoViewIfNeeded();await page.screenshot({path:folder+'/mobile-'+theme+'.png'});await page.locator('#closeModal').click();
 }
 await resizeStudio(page,{width:1116,height:715});
 phase='independent full copies';
 for(let copy=0;copy<2;copy++){
  await home();await demos();await jumpTo('kin');
  await root.locator('[data-factory-project-open=kin]').click();await page.locator('#modal').waitFor({state:'hidden'});assert.equal(await page.locator('#projectName').inputValue(),'Kin après minuit');
  const song=await save();assert.equal(song.project.bars,96);assert.equal(song.project.tracks.length,9);assert.equal(song.masterVolume,-1);assert.equal(song.assets.length,0);
 }
 const index=await page.evaluate(()=>new Promise((resolve,reject)=>{const request=indexedDB.open('chayah-studio');request.onsuccess=()=>{const db=request.result,r=db.transaction('sessions').objectStore('sessions').get('project-index');r.onsuccess=()=>{resolve(r.result);db.close();};r.onerror=()=>reject(r.error);};request.onerror=()=>reject(request.error);}));
 const copies=index.filter(p=>p.name==='Kin après minuit');assert.equal(copies.length,2);assert.notEqual(copies[0].id,copies[1].id);
 const original=index.find(p=>p.name==='Mon morceau conservé');assert.ok(original);
 await home();await page.locator('[data-session-tab=open]').click();
 while(await page.locator('[data-project-open="'+original.id+'"]').count()===0)await page.locator('.project-home-section .session-dashboard-pager [data-page="1"]').click();
 await page.locator('[data-project-open="'+original.id+'"]').click();await page.locator('#modal').waitFor({state:'hidden'});
 const restored=await save();assert.deepEqual(restored.project,before.project);assert.deepEqual(restored.assets,before.assets);assert.equal(restored.masterVolume,-18);
 await writeFile(folder+'/report.json',JSON.stringify({catalog:found,independentCopies:copies.length,preservedAudio:true,themes:4},null,2));assert.deepEqual(errors,[]);
 console.log('PASS: project dialog exposes all '+SESSION_TEMPLATES.length+' full compositions, musical previews, modal cancellation, 13 short demos, four responsive themes, independent copies and preserved user MIDI/audio/master');
}catch(error){console.error('Project compositions failed at',phase,errors);await page?.screenshot({path:folder+'/failure.png',fullPage:true}).catch(()=>{});throw error;}finally{await browser.close();}
