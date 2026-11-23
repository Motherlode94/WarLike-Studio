
async function sessionTab(page,tab){const button=page.locator('[data-session-tab="'+tab+'"]');await button.waitFor({state:'visible'});await button.click();if(tab==='demos')await page.locator('[data-demo-catalog="short"]').click();}
import assert from 'node:assert/strict';
import {chromium} from 'playwright';
import {mkdir,readFile,writeFile} from 'node:fs/promises';
const output='artifacts/vocal-demos';await mkdir(output,{recursive:true});
const browser=await chromium.launch({headless:true});
try{
 const page=await browser.newPage({viewport:{width:1280,height:800}}),errors=[];
 page.on('pageerror',e=>errors.push(e.message));
 await page.goto('http://127.0.0.1:8765/',{waitUntil:'load'});
 const details=await page.evaluate(async()=>{
  const {AudioEngine}=await import('./audio.js');const {createVocalDemoSession}=await import('./vocal-demo-sessions.js');const {createRecordedVocalDemoMedia}=await import('./recorded-vocal-audio.js');
  const context=new AudioContext(),result=[];
  const stats=buffer=>{let peak=0,energy=0;for(let ch=0;ch<buffer.numberOfChannels;ch++)for(const x of buffer.getChannelData(ch)){if(!Number.isFinite(x))throw Error('Non-finite vocal audio');peak=Math.max(peak,Math.abs(x));energy+=x*x}return {peak,rms:Math.sqrt(energy/(buffer.length*buffer.numberOfChannels)),seconds:buffer.duration}};
  for(const kind of ['vox-trap','vox-afro','vox-rnb']){
   const project=createVocalDemoSession(kind),sources=await createRecordedVocalDemoMedia(project),assets=new Map(),input=[];
   for(const source of sources){const buffer=await context.decodeAudioData(source.data.slice(0));assets.set(source.id,{...source,buffer});input.push(stats(buffer));}
   const onlyVoice=structuredClone(project);onlyVoice.tracks=onlyVoice.tracks.filter(t=>t.type==='audio'&&t.name.startsWith('LEAD'));onlyVoice.masterVolume=0;
   const renderer=new AudioEngine(()=>onlyVoice,()=>assets),verse=stats(await renderer.renderRange({sampleRate:44100,startBar:4,endBar:5,tail:false})),chorus=stats(await renderer.renderRange({sampleRate:44100,startBar:12,endBar:13,tail:false}));
   const fullProject=structuredClone(project),full=new AudioEngine(()=>fullProject,()=>assets),mix=stats(await full.renderRange({sampleRate:44100,startBar:4,endBar:5,tail:false}));
   const instrumental=structuredClone(project);instrumental.tracks=instrumental.tracks.filter(t=>t.type!=='audio');instrumental.masterVolume=0;
   const backing=stats(await new AudioEngine(()=>instrumental,()=>assets).renderRange({sampleRate:44100,startBar:4,endBar:5,tail:false}));
   result.push({kind,assets:assets.size,input,verse,chorus,mix,backing,vocalToBacking:verse.rms/backing.rms});
  }
  await context.close();return result;
 });
 for(const r of details){
  assert.equal(r.assets,3);assert.ok(r.input.every(s=>s.rms>.02&&s.peak<.95),r.kind+' silent/clipped recording');
  assert.ok(r.verse.rms>.006&&r.chorus.rms>.006,r.kind+' inaudible verse/chorus through WarLike FX');
  assert.ok(r.mix.peak<1&&r.mix.rms>.006,r.kind+' clipped/silent full mix');
  assert.ok(r.vocalToBacking>.15,r.kind+' lead buried below instruments: '+r.vocalToBacking);
 }
 await writeFile(output+'/audio-measurements.json',JSON.stringify({details},null,2));
 // Exercise the real public buttons (including the ordinary non-VOX demos),
 // persistence, portable export/reimport, and cold reload without source fetches.
 await sessionTab(page,'create');await page.locator('#libraryNew').waitFor({state:'visible'});
 for(const kind of ['trap','afro','rnb','vox-trap','vox-afro','vox-rnb']){
  await sessionTab(page,'demos');await sessionTab(page,'demos');await page.locator('.project-public-demos [data-public-demo="'+kind+'"]').click();
  await page.locator('#modal').waitFor({state:'hidden'});
  await page.waitForFunction(()=>/voix humaines en anglais|vraies voix enregistrées/.test(document.getElementById('toast')?.textContent||''));
  assert.match(await page.locator('#toast').textContent(),/anglais/);
  const pending=page.waitForEvent('download');await page.locator('#projectMenuBtn').click();await page.locator('#saveProject').click();const download=await pending,file=output+'/'+kind+'.chayah';await download.saveAs(file);
  const saved=JSON.parse(await readFile(file,'utf8'));assert.equal(saved.assets.length,3);assert.equal(saved.project.vocalDemoInfo.hasRecordedVoice,true);assert.equal(saved.project.vocalDemoInfo.credits[0].license,'CC BY 3.0');
  const lead=saved.project.tracks.find(t=>t.type==='audio'),starts=lead.clips.map(c=>c.start);
  if(kind==='trap'){
   assert.equal(saved.project.bars,96,'Full Trap song must have 96 bars');
   assert.equal(saved.project.fullSong,true);
   assert(starts.length>3,'Full Trap requires multiple editable vocal sections');
   assert(starts.includes(8),'First recorded verse must begin on bar 9');
   assert(starts.some(start=>start>=24&&start<32),'Chorus must reuse its licensed recording');
   assert(starts.every(start=>start>=8&&start<92),'No vocals during intro/outro');
   assert(lead.clips.every(c=>c.derivedRepeat&&c.gainDb<=-7&&c.fadeIn>=.035&&c.fadeOut>=.055),'Vocal repeats need gain staging and smooth fades');
  }else assert.deepEqual(starts,[4,8,12]);
  // Downloaded projects contain actual media, rather than hosted URL references.
  assert.ok(saved.assets.every(a=>Buffer.from(a.data,'base64').length>4096));
  if(kind==='vox-rnb'){
   await page.locator('#projectInput').setInputFiles(file);await page.waitForFunction(()=>document.getElementById('toast')?.textContent.includes('Projet importé et sauvegardé.'));
   await page.route('**/samples/vocals/**',r=>r.abort());await page.reload({waitUntil:'load'});await sessionTab(page,'open');await page.locator('[data-project-open]').first().click();await page.locator('#modal').waitFor({state:'hidden'});
   await page.locator('#play').click();await page.waitForFunction(()=>document.getElementById('play').getAttribute('aria-label')==='Pause');await page.locator('#stop').click();await page.screenshot({path:output+'/rnb-restored.png',fullPage:true});
   const second=page.waitForEvent('download');await page.locator('#projectMenuBtn').click();await page.locator('#saveProject').click();const finalDownload=await second;await finalDownload.saveAs(output+'/restored.chayah');const restored=JSON.parse(await readFile(output+'/restored.chayah','utf8'));assert.equal(restored.assets.length,3);assert.deepEqual(restored.project.vocalDemoInfo.credits,saved.project.vocalDemoInfo.credits);
  }
  if(kind!=='vox-rnb'){await page.locator('#projectMenuBtn').click();await page.locator('#myProjects').click();await sessionTab(page,'create');await page.locator('#libraryNew').waitFor({state:'visible'});}
 }
 assert.deepEqual(errors,[]);await writeFile(output+'/report.json',JSON.stringify({result:'PASS',details},null,2));
 console.log('PASS: real human vocals, verse/chorus through FX, audibility versus backing, six launch buttons, portable media and cold reload',JSON.stringify(details));
}finally{await browser.close();}
