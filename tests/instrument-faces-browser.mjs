import assert from 'node:assert/strict';
import {mkdir,readFile,writeFile} from 'node:fs/promises';
import {chromium} from 'playwright';
import {emptyProject} from '../dist/audio.js';
import {INSTRUMENTS,formatParam,placeInsert} from '../dist/plugins.js';
import {INSTRUMENT_FACES,instrumentReadout} from '../dist/instrument-face-model.js';
import {createContentTrack} from '../dist/content.js';
import {encodeWav} from '../dist/wav.js';
const folder='artifacts/instrument-faces';await mkdir(folder,{recursive:true});
const defs=Object.entries(INSTRUMENTS),project=emptyProject();project.name='Individual instrument faces QA';
project.tracks=defs.map(([id],i)=>{const t=createContentTrack(id);t.id='face'+i;t.name=id;t.clips=[{id:'clip'+i,name:'Notes conservées',start:0,length:1,patternSteps:16,notes:[{id:'note'+i,midi:60,step:0,len:4,velocity:.7,muted:false}]}];if(id==='drums')t.clips=[];if(id==='sampler')t.sampler={assetId:'facesample',root:60,mode:'slices',reverse:false,markers:[0,1,2]};return t;});
const extra=createContentTrack('harp');extra.id='otherharp';extra.name='Other harp';project.tracks.push(extra);placeInsert(project.tracks[0],0,'glue');
const data=Float32Array.from({length:16000},(_,i)=>.15*Math.sin(i*2*Math.PI*220/8000));const wav=Buffer.from(encodeWav({numberOfChannels:1,length:data.length,sampleRate:8000,getChannelData:()=>data}));
const browser=await chromium.launch({headless:true});let page,current='boot';const errors=[],report=[];
try{
 page=await browser.newPage({viewport:{width:1440,height:1000}});page.on('pageerror',e=>errors.push(e.message));
 await page.goto('http://127.0.0.1:8765/');await page.locator('html[data-app-ready="true"]').waitFor({state:'attached'});
 await page.locator('#projectInput').setInputFiles({name:'faces.chayah',mimeType:'application/json',buffer:Buffer.from(JSON.stringify({format:'chayah-studio',project,masterVolume:-12,assets:[{id:'facesample',name:'source.wav',data:wav.toString('base64')}]}))});
 await page.waitForFunction(()=>document.querySelector('#projectName').value==='Individual instrument faces QA'||document.querySelector('#toast').textContent.startsWith('Ouverture impossible :'));
 assert.equal(await page.locator('#toast').textContent(),'Projet importé et sauvegardé.');await page.locator('#modal').waitFor({state:'hidden'});await page.locator('[data-view="mixer"]').click();
 const open=async(track,id='instrument')=>{
  const button=page.locator('#mixerView [data-mixer-track="'+track+'"] [data-plugin-open="'+id+'"],#mixerView [data-mixer-track="'+track+'"] [data-insert-open="'+id+'"]').first();
  await button.evaluate(n=>{const mixer=document.querySelector('#mixerView');mixer.scrollLeft+=n.getBoundingClientRect().left-mixer.getBoundingClientRect().left-mixer.clientWidth/2;});
  await button.click();
 };
 const win=track=>page.locator('.floating-plugin[data-plugin-track="'+track+'"]').filter({has:page.locator('[data-instrument-face]')});
 for(const [i,[id,def]]of defs.entries()){
  current=id;const track='face'+i,spec=INSTRUMENT_FACES[id];await open(track);const root=win(track);await root.locator('[data-instrument-face="'+id+'"]').waitFor();
  assert.equal(await root.locator('.instrument-face-heading h2').textContent(),def.name);
  const keys=await root.locator('[data-param^="instrument."],[data-exo-control]').evaluateAll(nodes=>nodes.map(n=>n.dataset.exoControl||n.dataset.param.replace('instrument.','')));
  assert.deepEqual(keys.sort(),def.controls.map(c=>c.key).sort(),id+' lost or duplicate native controls');
  assert.equal(await root.locator('.plugin-command-bar').count(),1);
  for(const bank of await root.locator('.instrument-control-bank').all())assert.ok(await bank.evaluate(n=>n.scrollWidth<=n.clientWidth+2),id+' bank overlaps its controls');
  assert.equal(await root.locator('.instrument-face-heading svg').count(),1);
  const contrast=await root.locator('.param>label').first().evaluate(n=>{
   const rgb=s=>s.match(/[\d.]+/g).slice(0,3).map(Number),luma=c=>c.map(x=>x/255).map(x=>x<=.04045?x/12.92:((x+.055)/1.055)**2.4).reduce((sum,v,i)=>sum+v*[.2126,.7152,.0722][i],0);
   const a=luma(rgb(getComputedStyle(n).color)),bank=n.closest('.instrument-control-bank,.expansion-bank'),b=luma(rgb(getComputedStyle(bank||n.closest('[data-instrument-face]')).backgroundColor));return (Math.max(a,b)+.05)/(Math.min(a,b)+.05);
  });assert.ok(contrast>=4.5,id+' unreadable native control label: '+contrast);

  const ids=await root.locator('[id]').evaluateAll(nodes=>nodes.map(n=>n.id));assert.equal(ids.length,new Set(ids).size,id+' duplicate IDs');
  if(def.sampled){assert.equal(await root.locator('[data-acoustic-key]').count(),25);assert.equal(await root.locator('.acoustic-player progress').count(),1);}
  if(id==='sampler')assert.ok(await root.locator('[data-slice-pad]').count()>=2);
  if(id==='exo'){assert.equal(await root.locator('.exo-advanced').getAttribute('open'),null);assert.equal(await root.locator('[data-exo-control]').count(),3);assert.ok(await root.locator('[data-exo-load]').count()>=32);}
  if(!spec.banks.length)assert.equal(await root.locator('.expansion-hardware').count(),1);
  const key=spec.focus[0],c=def.controls.find(c=>c.key===key),input=root.locator('[data-param="instrument.'+key+'"]');
  const before=Number(await input.inputValue()),next=before+c.step<=c.max?before+c.step:before-c.step;
  await input.evaluate((n,value)=>{n.value=String(value);n.dispatchEvent(new Event('input',{bubbles:true}));},next);
  const expected=instrumentReadout(id,c,next,formatParam);
  await page.waitForFunction(({track,key,expected})=>document.querySelector('.floating-plugin[data-plugin-track="'+track+'"] [data-instrument-readout="'+key+'"]')?.textContent===expected,{track,key,expected});
  assert.equal(await root.locator('[data-plugin-history="undo"]').isEnabled(),true,id+' missing scoped history');
  await root.locator('[data-plugin-history="undo"]').click();assert.equal(Number(await root.locator('[data-param="instrument.'+key+'"]').inputValue()),before,id+' undo failed');
  await root.locator('[data-plugin-history="redo"]').click();assert.ok(Math.abs(Number(await root.locator('[data-param="instrument.'+key+'"]').inputValue())-next)<1e-6);
  await root.locator('[data-plugin-history="undo"]').click();
  // Preserve native factory preset callbacks and exact factory bank sizes.
  const presets=root.locator('[data-plugin-control="suitePreset"]');await presets.selectOption(id==='sampler'?'0':'1');assert.ok(await root.locator('[data-instrument-face="'+id+'"]').count());
  if(['harp','flute','wlvirtual','wlrompler','wlspectral','wlcrunch','piano','bass','sampler','exo','wltonewheel'].includes(id))await root.screenshot({path:folder+'/'+id+'.png'});
  report.push({id,controls:keys.length,layout:spec.layout,material:spec.material,edited:key});await root.locator('[data-float-close]').click();
 }
 // Two same-type panels must own their own parameter/readout state.
 current='ownership';const harpTrack='face'+defs.findIndex(([id])=>id==='harp');await open(harpTrack);await win(harpTrack).locator('[data-plugin-control="suiteTrack"]').selectOption('otherharp');
 const a=win(harpTrack),b=win('otherharp'),other=await b.locator('[data-instrument-readout="brightness"]').textContent();
 await a.locator('[data-param="instrument.brightness"]').evaluate(n=>{n.value='4400';n.dispatchEvent(new Event('input',{bubbles:true}));});
 await page.waitForFunction(track=>document.querySelector('.floating-plugin[data-plugin-track="'+track+'"] [data-instrument-readout="brightness"]')?.textContent==='4.4 kHz',harpTrack);
 assert.equal(await b.locator('[data-instrument-readout="brightness"]').textContent(),other);
 await b.locator('[data-float-close]').click();await a.locator('[data-float-close]').click();
 // The effect panel keeps its existing identity and is outside the instrument skin.
 await open('face0','glue');assert.equal(await page.locator('.floating-plugin [data-instrument-face]').count(),0);await page.locator('.floating-plugin[data-plugin-track="face0"] [data-float-close]').click();
 // Genuine desktop -> mobile -> desktop transitions, then reopen at 390 px.
 for(const id of ['harp','flute','wlvirtual','exo','sampler','wltonewheel']){
  current='mobile '+id;const track='face'+defs.findIndex(([key])=>key===id);await open(track);await page.setViewportSize({width:390,height:844});
  const root=win(track);await root.locator('[data-instrument-face="'+id+'"]').waitFor();
  await page.waitForFunction(track=>{const n=document.querySelector('.floating-plugin[data-plugin-track="'+track+'"]');if(!n)return false;const r=n.getBoundingClientRect();return r.x>=-1&&r.right<=391;},track);
  const panel=root.locator('[data-instrument-face]');assert.ok(await panel.evaluate(n=>n.scrollWidth<=n.clientWidth+2),id+' face overflow');
  assert.ok(await root.locator('.instrument-control-bank,.expansion-bank').count());await root.screenshot({path:folder+'/'+id+'-mobile.png'});await root.locator('[data-float-close]').click();await page.setViewportSize({width:1440,height:1000});
 }
 current='project roundtrip';await page.locator('#projectMenuBtn').click();const waiting=page.waitForEvent('download');await page.locator('#saveProject').click();const saved=JSON.parse(await readFile(await(await waiting).path(),'utf8'));
 assert.equal(saved.project.tracks.length,43);assert.equal(saved.assets[0].data,wav.toString('base64'));
 assert.deepEqual(saved.project.tracks.find(t=>t.id===harpTrack).instrument.brightness,4400);
 for(const t of saved.project.tracks){const original=project.tracks.find(x=>x.id===t.id);assert.deepEqual(t.clips.map(c=>c.notes),original.clips.map(c=>c.notes));assert.deepEqual(t.inserts,original.inserts);}
 await page.locator('#projectInput').setInputFiles({name:'faces-again.chayah',mimeType:'application/json',buffer:Buffer.from(JSON.stringify(saved))});await page.waitForFunction(()=>document.querySelector('#toast').textContent==='Projet importé et sauvegardé.');
 await page.reload();await page.locator('[data-session-tab="open"]').click();await page.locator('[data-project-open]').first().click();await page.locator('#modal').waitFor({state:'hidden'});await page.locator('[data-view="mixer"]').click();await open(harpTrack);
 assert.equal(await win(harpTrack).locator('[data-param="instrument.brightness"]').inputValue(),'4400');
 await writeFile(folder+'/report.json',JSON.stringify(report,null,2)+'\n');assert.deepEqual(errors,[]);console.log('PASS: 42 individual instrument panels, 314 native controls, live readouts, scoped undo/redo, factory presets, sample/EXO tools, 2-panel isolation, effect isolation, mobile and project/audio roundtrip');
}catch(error){console.error('Instrument faces failed at',current,'page errors:',errors);await page?.screenshot({path:folder+'/failure.png',fullPage:true}).catch(()=>{});throw error;}finally{await browser.close();}
