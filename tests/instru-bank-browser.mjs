import assert from 'node:assert/strict';
import {chromium} from 'playwright';
import {mkdir,readFile,writeFile} from 'node:fs/promises';
import {emptyProject} from '../dist/audio.js';
import {createContentTrack} from '../dist/content.js';
import {placeInsert} from '../dist/plugins.js';
import {INSTRU_PRESETS,instruValues} from '../dist/instru-presets.js';
const folder='artifacts/instru-bank';await mkdir(folder,{recursive:true});
const project=emptyProject(),track=createContentTrack('harp');track.id='harpqa';track.name='Harpe QA';track.volume=-12;
track.clips=[{id:'harpnotes',name:'Phrase conservée',start:0,length:2,patternSteps:32,notes:[{id:'harpnote',midi:60,step:0,len:8,velocity:.7,muted:false}]}];placeInsert(track,0,'glue');track.effects.glue.threshold=-22;project.tracks=[track];project.name='Instru QA';
const browser=await chromium.launch({headless:true});let page;const errors=[];
try{
 page=await browser.newPage({viewport:{width:1440,height:960}});page.on('pageerror',e=>errors.push(e.message));
 await page.goto('http://127.0.0.1:8765/');await page.locator('html[data-app-ready="true"]').waitFor({state:'attached'});
 await page.locator('#projectInput').setInputFiles({name:'instru.chayah',mimeType:'application/json',buffer:Buffer.from(JSON.stringify({format:'chayah-studio',project,masterVolume:-9,assets:[]}))});
 await page.waitForFunction(()=>document.querySelector('#projectName').value==='Instru QA');await page.locator('#modal').waitFor({state:'hidden'});
 const open=async()=>{await page.locator('#projectMenuBtn').click();await page.locator('#instruBank').click();await page.locator('.instru-bank-intro').waitFor();};
 const save=async()=>{await page.locator('#projectMenuBtn').click();const waiting=page.waitForEvent('download');await page.locator('#saveProject').click();return JSON.parse(await readFile(await(await waiting).path(),'utf8'));};
 await open();assert.equal(await page.locator('.instru-sound-card').count(),12);assert.equal(await page.locator('#bankResults').textContent(),INSTRU_PRESETS.length+' / '+INSTRU_PRESETS.length+' sons');
 await page.locator('[data-instru-page="next"]').click();assert.match(await page.locator('.instru-bank-pager').textContent(),/Page 2/);
 await page.locator('#bankSearch').fill('harpe');
 assert.equal(await page.locator('[data-instru-preview="harp-1"]').count(),1);
 await page.locator('[data-instru-preview="harp-1"]').click();await page.waitForFunction(()=>document.querySelector('.instru-bank-status').textContent.startsWith('Écoute ·'));
 await page.getByRole('button',{name:'■ Arrêter l’écoute'}).click();assert.equal(await page.locator('.instru-bank-status').textContent(),'Écoute arrêtée.');
 await page.locator('[data-instru-apply="harp-1"]').click();let saved=await save();assert.deepEqual(saved.project.tracks[0].instrument,instruValues('harp-1'));assert.deepEqual(saved.project.tracks[0].clips[0].notes,track.clips[0].notes);assert.equal(saved.project.tracks[0].effects.glue.threshold,-22);
 await page.locator('#undo').click();saved=await save();assert.deepEqual(saved.project.tracks[0].instrument,track.instrument);
 await page.locator('#redo').click();saved=await save();assert.deepEqual(saved.project.tracks[0].instrument,instruValues('harp-1'));
 await open();await page.locator('#bankSearch').fill('flûte');assert.equal(await page.locator('[data-instru-apply="flute-1"]').isDisabled(),true);
 await page.locator('[data-instru-add="flute-1"]').click();saved=await save();assert.equal(saved.project.tracks.length,2);assert.deepEqual(saved.project.tracks[1].instrument,instruValues('flute-1'));assert.equal(saved.project.tracks[1].clips[0].notes.length,6);
 await open();await page.locator('#bankSearch').fill('wl vanguard');assert.equal(await page.locator('.instru-sound-card').count(),12);assert.equal(await page.locator('#bankResults').textContent(),'12 / '+INSTRU_PRESETS.length+' sons');
 await page.locator('[data-instru-add="wlvirtual-1"]').click();saved=await save();assert.deepEqual(saved.project.tracks[2].instrument,instruValues('wlvirtual-1'));
 // All sound states survive the actual archive importer and a cold local reload.
 await page.locator('#projectInput').setInputFiles({name:'sounds.chayah',mimeType:'application/json',buffer:Buffer.from(JSON.stringify(saved))});await page.waitForFunction(()=>document.querySelector('#toast').textContent==='Projet importé et sauvegardé.');
 await page.reload();await page.locator('[data-session-tab="open"]').click();await page.locator('[data-project-open]').first().click();await page.locator('#modal').waitFor({state:'hidden'});
 const reopened=await save();assert.deepEqual(reopened.project.tracks.map(t=>t.instrument),saved.project.tracks.map(t=>t.instrument));
 await open();await page.locator('#bankSearch').fill('wl vanguard');
 for(const card of await page.locator('.instru-sound-card').all())assert.ok(await card.evaluate(n=>n.scrollHeight<=n.clientHeight+2),'card must show every action without internal clipping');
 await page.screenshot({path:folder+'/vanguard-desktop.png',fullPage:true});
 await page.setViewportSize({width:390,height:844});await page.locator('#bankSearch').fill('harpe');
 // The responsive bank rerenders cards on resize and search. Read a live DOM
 // snapshot instead of retaining Playwright handles that may detach.
 await page.waitForFunction(()=>{
  const search=document.querySelector('#bankSearch');
  const result=document.querySelector('#bankResults');
  const cards=[...document.querySelectorAll('.instru-sound-card')];
  const total=Number(result?.textContent?.split('/')[0]?.trim());
  // Search matches names, tags and descriptions: 'harpe' need not mean exactly 8 cards.
  return innerWidth===390&&search?.value==='harpe'&&Number.isInteger(total)&&total>=8&&
   cards.length===Math.min(12,total)&&cards.every(n=>n.isConnected&&n.getBoundingClientRect().width>0);
 });
 const mobileCards=await page.locator('.instru-sound-card').evaluateAll(cards=>cards.map(n=>{
  const b=n.getBoundingClientRect();
  return {x:b.x,right:b.right,width:b.width,clipped:n.scrollHeight>n.clientHeight+2};
 }));
 const visibleCount=Math.min(12,Number((await page.locator('#bankResults').textContent()).split('/')[0].trim()));
 assert.equal(mobileCards.length,visibleCount,'all visible search results remain rendered on mobile');
 for(const card of mobileCards){
  assert.ok(card.x>=-1&&card.right<=391&&card.width>0,'mobile card overflow');
  assert.equal(card.clipped,false,'mobile card clips its actions');
 }
 await page.screenshot({path:folder+'/harp-mobile.png',fullPage:true});
 // Render every new sound through the real engines and decode representative WAVs.
 const report=await page.evaluate(async()=>{
  const {INSTRU_PRESETS,instruValues}=await import('./instru-presets.js');const {AudioEngine}=await import('./audio.js');const {encodeWav}=await import('./wav.js');
  const renderer=new AudioEngine(()=>({tracks:[],masterVolume:0}),()=>new Map()),results=[],examples=[];const sampleRate=44100;
  for(const p of INSTRU_PRESETS){
   const ctx=new OfflineAudioContext(2,sampleRate*4,sampleRate),params=instruValues(p.id);
   const {ACOUSTIC_INSTRUMENTS}=await import('./acoustic.js');if(ACOUSTIC_INSTRUMENTS[p.type])await renderer.prepareBank(ctx,p.type);
   if(p.type==='drums'){for(const [i,v]of ['kick','clap','hat','tom','perc'].entries())renderer.drum(ctx,ctx.destination,v,.03+i*.35,false,params);}
   else renderer.synth(ctx,ctx.destination,p.type,p.category==='Basses'?36:60,.03,1.1,false,params,.7);
   const b=await ctx.startRendering();let peak=0,energy=0;for(let c=0;c<2;c++)for(const v of b.getChannelData(c)){if(!Number.isFinite(v))throw Error(p.id+' nonfinite signal');peak=Math.max(peak,Math.abs(v));energy+=v*v;}
   const result={id:p.id,type:p.type,peak,rms:Math.sqrt(energy/(b.length*2))};if(peak<.0001||peak>=1||result.rms<.00001)throw Error(p.id+' silent or clipped '+JSON.stringify(result));results.push(result);
   if(['harp-1','harp-3','flute-1','flute-2','wlvirtual-1','wlvirtual-2','wlvirtual-3','wlclean-1','wlrompler-3','wlspectral-5'].includes(p.id)){
    const wav=encodeWav(b,{bits:24});const decoder=new OfflineAudioContext(2,1,sampleRate);const decoded=await decoder.decodeAudioData(wav.slice(0));if(decoded.length!==b.length)throw Error('WAV frame loss');
    let text='';const bytes=new Uint8Array(wav);for(let i=0;i<bytes.length;i+=32768)text+=String.fromCharCode(...bytes.subarray(i,i+32768));examples.push({id:p.id,data:btoa(text)});
   }
  }
  return {results,examples};
 });
 assert.equal(report.results.length,INSTRU_PRESETS.length);for(const example of report.examples)await writeFile(folder+'/'+example.id+'.wav',Buffer.from(example.data,'base64'));
 await writeFile(folder+'/audio-report.json',JSON.stringify(report.results,null,2)+'\n');
 await writeFile(folder+'/listen.html','<!doctype html><meta charset="utf-8"><title>Banque Instru · écoutes sèches</title><h1>Sons Instru · écoutes sèches</h1><p>Une note, sans FX ni mastering. Les registres et le jeu changent le résultat musical.</p>'+report.examples.map(e=>'<p>'+e.id+' <audio controls src="'+e.id+'.wav"></audio></p>').join(''));
 assert.deepEqual(errors,[]);console.log('PASS: '+INSTRU_PRESETS.length+' new sounds rendered, no silence/clipping, 24-bit WAV; bank pagination, harp/flute/Vanguard audition, apply, undo/redo, add, mobile, export/import and cold reload');
}catch(error){await page?.screenshot({path:folder+'/failure.png',fullPage:true}).catch(()=>{});console.error('Page errors',errors);throw error;}finally{await browser.close();}
