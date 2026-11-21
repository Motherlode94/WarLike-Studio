import assert from 'node:assert/strict';
import {mkdir,writeFile,readFile} from 'node:fs/promises';
import {createHash} from 'node:crypto';
import {chromium} from 'playwright';
const dir='artifacts/r05-certification';await mkdir(dir,{recursive:true});
const report={status:'running',checks:[]};
const record=async(name,details={})=>{report.checks.push({name,...details});console.log('PASS',name,JSON.stringify(details));await writeFile(dir+'/report.json',JSON.stringify(report,null,2));};
const wav=Buffer.alloc(44+44100*2*2);wav.write('RIFF');wav.writeUInt32LE(wav.length-8,4);wav.write('WAVEfmt ',8);wav.writeUInt32LE(16,16);wav.writeUInt16LE(1,20);wav.writeUInt16LE(1,22);wav.writeUInt32LE(44100,24);wav.writeUInt32LE(88200,28);wav.writeUInt16LE(2,32);wav.writeUInt16LE(16,34);wav.write('data',36);wav.writeUInt32LE(wav.length-44,40);
for(let i=0;i<88200;i++){const fade=Math.min(1,i/441,(88199-i)/441);wav.writeInt16LE(Math.round(6000*fade*Math.sin(2*Math.PI*440*i/44100)),44+i*2);}
const digest=b=>createHash('sha256').update(b).digest('hex');
const browser=await chromium.launch({headless:true});
const context=await browser.newContext({viewport:{width:1440,height:960},acceptDownloads:true});
const page=await context.newPage(),errors=[];page.on('pageerror',e=>errors.push(e.message));page.setDefaultTimeout(30000);
const tab=async name=>page.locator('[data-session-tab="'+name+'"]').click();
const download=async(selector,path)=>{const pending=page.waitForEvent('download');await page.locator(selector).click();await (await pending).saveAs(path);return readFile(path);};
const save=async name=>{await page.locator('#projectMenuBtn').click();return JSON.parse(await download('#saveProject',dir+'/'+name+'.chayah'));};
const score=p=>({name:p.name,bpm:p.bpm,bars:p.bars,tracks:p.tracks.map(t=>({id:t.id,type:t.type,name:t.name,volume:t.volume,pan:t.pan,mute:t.mute,solo:t.solo,inserts:t.inserts,clips:t.clips.map(c=>({id:c.id,audioId:c.audioId,start:c.start,length:c.length,name:c.name}))}))});
const bus=async name=>{
 await page.locator('#exportWav').click();await page.locator('#exportStart').fill('1');await page.locator('#exportEnd').fill('3');await page.locator('#exportRate').selectOption('44100');await page.locator('#exportBits').selectOption('24');await page.locator('#exportTail').uncheck();
 await page.locator('#runExport').click();await page.locator('#exportProgress').getByText(/fichier\(s\) prêt\(s\)/).waitFor({timeout:60000});
 const data=await download('#downloadRendered',dir+'/'+name+'.wav');await page.locator('#closeModal').click();
 assert.equal(data.toString('ascii',0,4),'RIFF');assert.equal(data.readUInt16LE(22),2);assert.equal(data.readUInt32LE(24),44100);assert.equal(data.readUInt16LE(34),24);
 const size=data.readUInt32LE(40),frames=size/6;assert.ok(Math.abs(frames/44100-4)<.03);
 let peak=0,energy=0;for(let i=44;i<44+size;i+=3){const x=data.readIntLE(i,3)/8388608;peak=Math.max(peak,Math.abs(x));energy+=x*x;}
 const rms=Math.sqrt(energy/(frames*2));assert.ok(peak>.01&&peak<.999);assert.ok(rms>.002);return {data,metrics:{frames,rms,peak,sha256:digest(data)}};
};
try{
 await page.goto('http://127.0.0.1:8765/',{waitUntil:'load'});await tab('create');await page.locator('#libraryName').fill('R05 Integrated QA');await page.locator('#libraryNew').click();await page.locator('#modal').waitFor({state:'hidden'});
 await page.locator('#audioInput').setInputFiles({name:'reference-440.wav',mimeType:'audio/wav',buffer:wav});
 const clips=page.locator('#trackRows [data-clip]');await clips.first().waitFor();assert.equal(await clips.count(),1);
 const clip=clips.first();await clip.click({button:'right'});await page.locator('[data-context-action="clip-edit"]').hover();await page.locator('[data-context-action="clip-duplicate"]').click();assert.equal(await clips.count(),2);
 await page.locator('#undo').click();assert.equal(await clips.count(),1);
 await clips.first().click({button:'right'});await page.locator('[data-context-action="clip-edit"]').hover();await page.locator('[data-context-action="clip-duplicate"]').click();assert.equal(await clips.count(),2);
 await record('Audio import, contextual duplicate and undo',{sourceSha256:digest(wav),clips:2});
 await page.locator('[data-view="mixer"]').click();const channel=page.locator('#mixerView [data-mixer-track]').first();await channel.locator('[data-add-insert-track]').click();
 await page.locator('#pluginSearch').fill('NOTCH');await page.locator('[data-picker-load="notch"]').click();await page.locator('#modal').waitFor({state:'hidden'});await page.locator('#pluginFloat').waitFor({state:'visible'});
 assert.ok(await page.locator('#pluginFloat [data-param^="notch."]').count()>0);
 const controls=page.locator('#pluginFloat #suitePreset option');if(await controls.count()>1)await page.locator('#pluginFloat #suitePreset').selectOption({index:1});
 const plugin=page.locator('#pluginFloat');await plugin.locator('[data-float-close]').click();
 await page.locator('[data-view="arrange"]').click();
 for(const theme of ['forest','graphite','slate','light']){
   await page.locator('.top-actions [data-studio-theme]').selectOption(theme);
   assert.equal(await page.locator('html').getAttribute('data-warlike-theme'),theme);
   await page.screenshot({path:dir+'/theme-'+theme+'.png'});
 }
 await record('Effect insert, controls and four actual themes');
 await page.locator('#modeSong').click();await page.locator('#play').click();await page.waitForFunction(()=>document.getElementById('play').getAttribute('aria-label')==='Pause');const position=await page.locator('#secondsDisplay').textContent();await page.waitForFunction(pos=>document.getElementById('secondsDisplay').textContent!==pos,position);await page.locator('#stop').click();
 await record('Live transport advances');
 await page.waitForFunction(()=>document.getElementById('saveStatus').textContent==='Enregistré sur cet appareil');
 const first=await save('before');assert.ok(first.project.tracks[0].inserts.includes('notch'));assert.equal(first.assets.length,1);assert.equal(digest(Buffer.from(first.assets[0].data,'base64')),digest(wav));
 const initial=await bus('before');await record('Production UI WAV render',initial.metrics);
 await page.reload({waitUntil:'load'});await tab('open');await page.locator('[data-project-open]').first().click();await page.locator('#modal').waitFor({state:'hidden'});
 const restored=await save('after');assert.deepEqual(score(restored.project),score(first.project));assert.deepEqual(restored.project.tracks[0].effects.notch,first.project.tracks[0].effects.notch);assert.equal(restored.masterVolume,first.masterVolume);assert.deepEqual(restored.assets,first.assets);
 assert.equal(await page.locator('html').getAttribute('data-warlike-theme'),'light');const after=await bus('after');
 assert.equal(after.metrics.frames,initial.metrics.frames);assert.ok(Math.abs(after.metrics.rms-initial.metrics.rms)<.0001);assert.ok(Math.abs(after.metrics.peak-initial.metrics.peak)<.0001);
 let maxDelta=0;for(let i=44;i<initial.data.length;i+=3)maxDelta=Math.max(maxDelta,Math.abs(initial.data.readIntLE(i,3)-after.data.readIntLE(i,3))/8388608);
 assert.ok(maxDelta<.0001,'Restored session altered its deterministic PCM: '+maxDelta);
 await record('Cold reopen preserves audio bytes, clips, inserts, theme and actual PCM',{...after.metrics,maxDelta});
 // Re-open the same portable file via actual UI as a separate path.
 await page.locator('#projectInput').setInputFiles(dir+'/before.chayah');await page.waitForFunction(()=>document.getElementById('toast').textContent.includes('Projet importé et sauvegardé.'));
 const imported=await save('portable');assert.deepEqual(score(imported.project),score(first.project));assert.deepEqual(imported.assets,first.assets);
 await record('Portable project round trip');
 // The existing dedicated workflows cover long native arrangements, windows, DSP,
 // recording and cloud; this job intentionally uses a deterministic fixture.
 await page.setViewportSize({width:390,height:844});await page.locator('[data-view="arrange"]').click();
 assert.ok(await page.locator('#play').isVisible());assert.ok(await page.locator('#projectMenuBtn').isVisible());
 await page.screenshot({path:dir+'/mobile.png'});assert.deepEqual(errors,[]);
 await record('Mobile transport and zero uncaught browser errors');
 report.status='passed';await writeFile(dir+'/report.json',JSON.stringify(report,null,2));
}catch(e){report.status='failed';report.error=String(e.stack||e);report.browserErrors=errors;await writeFile(dir+'/report.json',JSON.stringify(report,null,2));await page.screenshot({path:dir+'/failure.png'}).catch(()=>{});throw e;}
finally{await browser.close();}
