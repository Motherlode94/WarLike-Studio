import assert from 'node:assert/strict';
import {createRequire} from 'node:module';
import {createServer} from 'node:http';
import {readFile} from 'node:fs/promises';
import path from 'node:path';
import {tmpdir} from 'node:os';
const {chromium}=createRequire(import.meta.url)('playwright');
const root=path.resolve(import.meta.dirname,'../dist');
const server=createServer(async(req,res)=>{
 try{
  const pathname=decodeURIComponent(new URL(req.url,'http://localhost').pathname),file=path.resolve(root,'.'+(pathname==='/'?'/index.html':pathname));
  if(!file.startsWith(root+path.sep)){res.writeHead(403).end();return;}
  const bytes=await readFile(file);res.setHeader('content-type',file.endsWith('.js')?'text/javascript':file.endsWith('.css')?'text/css':file.endsWith('.html')?'text/html':file.endsWith('.json')?'application/json':'application/octet-stream');res.end(bytes);
 }catch{res.writeHead(404).end();}
});
await new Promise(resolve=>server.listen(0,'127.0.0.1',resolve));
const origin='http://127.0.0.1:'+server.address().port;
const browser=await chromium.launch({headless:true,...(process.env.STUDIO_TEST_CHROMIUM_PATH?{executablePath:process.env.STUDIO_TEST_CHROMIUM_PATH}:{}),args:['--no-sandbox','--autoplay-policy=no-user-gesture-required']});
try{
 const page=await browser.newPage({viewport:{width:1440,height:1000}}),errors=[];
 page.on('pageerror',e=>errors.push(e.message));page.on('dialog',dialog=>dialog.accept());
 await page.route('**/*',route=>new URL(route.request().url()).origin!==origin?route.abort():route.continue());
 await page.goto(origin);await page.locator('[data-session-tab="create"]').click();await page.locator('#libraryNew').click();await page.locator('#modal').waitFor({state:'hidden'});
 const fixture=await page.evaluate(async()=>{
  const {emptyProject}=await import('/audio.js'),{createContentTrack}=await import('/content.js'),{placeInsert}=await import('/plugins.js');
  const project=emptyProject();project.name='Rack recovery QA';project.bars=4;
  const track=createContentTrack('bass');track.id='rackbass';track.name='WAR 808 QA';track.volume=-12;placeInsert(track,0,'glue');
  project.tracks=[track];return {format:'chayah-studio',project,masterVolume:-12,assets:[]};
 });
 await page.locator('#projectInput').setInputFiles({name:'rack.chayah',mimeType:'application/json',buffer:Buffer.from(JSON.stringify(fixture))});
 await page.waitForFunction(()=>document.getElementById('projectName').value==='Rack recovery QA'||document.getElementById('toast').textContent.startsWith('Ouverture impossible'));assert.equal(await page.locator('#projectName').inputValue(),'Rack recovery QA',await page.locator('#toast').textContent());await page.locator('#modal').waitFor({state:'hidden'});
 await page.locator('[data-view="mixer"]').click();await page.locator('[data-war-rack-track="rackbass"]').click();
 await page.locator('#warRackHost [data-source]').selectOption('808');
 await page.locator('#warRackHost [data-query]').fill('Dark Atlanta');assert.equal(await page.locator('#warRackHost [data-list] button').count(),1);
 await page.locator('#warRackHost [data-apply]').click();await page.locator('#modal').waitFor({state:'hidden'});
 const save=async()=>{
  await page.locator('#projectMenuBtn').click();const pending=page.waitForEvent('download');await page.locator('#saveProject').click();const download=await pending;
  const stream=await download.createReadStream(),chunks=[];for await(const chunk of stream)chunks.push(chunk);return JSON.parse(Buffer.concat(chunks));
 };
 const applied=await save();assert.equal(applied.project.tracks[0].inserts.filter(Boolean).length,4);assert.deepEqual(applied.project.tracks[0].clips,fixture.project.tracks[0].clips);
 assert.equal(applied.project.tracks[0].volume,-12);assert.equal(applied.project.tracks[0].pan,fixture.project.tracks[0].pan);
 await page.locator('#undo').click();const undone=await save();assert.deepEqual(undone.project.tracks[0].inserts,fixture.project.tracks[0].inserts);
 // Reimport the saved project through the real importer and verify persistence of inserts.
 await page.locator('#projectInput').setInputFiles({name:'applied.chayah',mimeType:'application/json',buffer:Buffer.from(JSON.stringify({...applied,project:{...applied.project,name:'Rack reopened QA'}}))});
 await page.waitForFunction(()=>document.getElementById('projectName').value==='Rack reopened QA');await page.locator('#modal').waitFor({state:'hidden'});
 const reopened=await save();assert.deepEqual(reopened.project.tracks[0].inserts,applied.project.tracks[0].inserts);
 // Browser-side contract, measurement race, real offline DSP and WAV round-trip.
 const result=await page.evaluate(async()=>{
  const {mountRackBrowser}=await import('/war-rack-browser.js'),{WAR_RACKS}=await import('/war-rack-catalog.js'),{applyRack}=await import('/war-rack-core.js');
  const {AudioEngine,emptyProject}=await import('/audio.js'),{createContentTrack}=await import('/content.js'),{captureRack,parseRack,serializeRack}=await import('/war-rack10.js');
  const host=document.createElement('div');host.id='rackAsyncQA';document.body.append(host);
  let resolve,applies=0;const project=emptyProject(),track=createContentTrack('bass');
  mountRackBrowser(host,{track,project,apply:()=>{applies++;},measureSource:()=>new Promise(r=>resolve=r)});
  const select=(q,v)=>{const el=host.querySelector(q);el.value=v;el.onchange();};
  select('[data-stage]','premix');select('[data-source]','808');
  const pending=host.querySelector('[data-measure]').onclick();if(!host.querySelector('[data-apply]').disabled)throw Error('Apply enabled during measurement');
  select('[data-stage]','mix');
  const ctx=new OfflineAudioContext(1,44100,44100),source=ctx.createBuffer(1,44100,44100);source.getChannelData(0).fill(.25);resolve(source);await pending;
  if(host.querySelector('[role=status]').textContent.includes('trim proposé'))throw Error('Stale measurement changed another selection');
  if(applies)throw Error('Measurement applied an insert without confirmation');host.remove();
  project.bars=1;project.bpm=120;
  const audio=project.tracks[0];audio.volume=-12;audio.clips=[{id:'tone',audioId:'source',name:'Tone',start:0,length:1}];
  const tone=ctx.createBuffer(1,88200,44100);for(let i=0;i<tone.length;i++)tone.getChannelData(0)[i]=.12*Math.sin(i*2*Math.PI*80/44100);
  const rack=WAR_RACKS.find(r=>r.id==='war808-0');applyRack(rack,{track:audio});
  const portable=parseRack(serializeRack(captureRack({track:audio,name:'Roundtrip 808',source:'808',stage:'mix'})));
  const restored=structuredClone(audio);applyRack(portable,{track:restored});
  if(JSON.stringify(restored.inserts)!==JSON.stringify(audio.inserts))throw Error('Portable rack order changed');
  const engine=new AudioEngine(()=>project,()=>new Map([['source',{buffer:tone}]]));
  const wet=await engine.renderRange({project,tail:false,sampleRate:44100}),dry=await engine.renderRange({project,tail:false,sampleRate:44100,clean:true});
  let peak=0,delta=0;const channel=wet.getChannelData(0),clean=dry.getChannelData(0);
  for(let i=0;i<channel.length;i++){if(!Number.isFinite(channel[i]))throw Error('Non-finite processed PCM');peak=Math.max(peak,Math.abs(channel[i]));delta+=Math.abs(channel[i]-clean[i]);}
  if(peak<.0001||delta<.001)throw Error('Rack was silent or DSP did not change PCM');
  let inspected=false;const wav=await engine.exportWav({project,tail:false,bits:24,sampleRate:44100,inspectRender:()=>{inspected=true;}});
  if(!inspected)throw Error('Export quality hook did not run');
  const decoder=new AudioContext(),decoded=await decoder.decodeAudioData(wav.slice(0));await decoder.close();
  if(decoded.length!==wet.length)throw Error('WAV duration differs');
  return {rackCount:WAR_RACKS.length,peak,delta,frames:decoded.length,sampleRate:decoded.sampleRate};
 });
 await page.locator('[data-war-rack-track="rackbass"]').click();
 await page.setViewportSize({width:390,height:844});await page.waitForTimeout(250);
 const bounds=await page.locator('#warRackHost').evaluate(el=>({scroll:el.scrollWidth,width:el.clientWidth}));assert.ok(bounds.scroll<=bounds.width+2,JSON.stringify(bounds));
 await page.screenshot({path:path.join(tmpdir(),'studio-rack-mobile.png'),fullPage:true});assert.deepEqual(errors,[]);
 console.log(JSON.stringify({status:'passed',checks:['actual mixer entry','apply and undo','save and reopen','stale measurement rejected','portable rack roundtrip','real offline DSP','WAV export hook','mobile bounds'],...result}));
}finally{await browser.close();await new Promise(resolve=>server.close(resolve));}
