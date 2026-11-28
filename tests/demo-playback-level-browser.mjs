import {createRequire} from 'node:module';import {createServer} from 'node:http';import {readFile,mkdir,writeFile} from 'node:fs/promises';import path from 'node:path';
const {chromium}=createRequire(import.meta.url)('playwright'),root=path.resolve(import.meta.dirname,'../dist'),folder='artifacts/demo-levels';await mkdir(folder,{recursive:true});
const server=createServer(async(req,res)=>{try{const file=path.resolve(root,'.'+new URL(req.url,'http://localhost').pathname);if(!file.startsWith(root+path.sep))throw Error();res.setHeader('content-type',file.endsWith('.js')?'text/javascript':'application/octet-stream');res.end(await readFile(file));}catch{res.writeHead(404).end();}});await new Promise(r=>server.listen(0,'127.0.0.1',r));
const browser=await chromium.launch({headless:true,...(process.env.STUDIO_TEST_CHROMIUM_PATH?{executablePath:process.env.STUDIO_TEST_CHROMIUM_PATH}:{}),args:['--no-sandbox']});
try{const page=await browser.newPage();page.on('console',m=>{if(m.type()==='log')console.log(m.text());});await page.goto('http://127.0.0.1:'+server.address().port+'/mastering.js');
const result=await page.evaluate(async selected=>{
const {createFactorySession,SESSION_TEMPLATES}=await import('/content.js'),{createBeatDemoSession,BEAT_DEMOS}=await import('/beat-demo-sessions.js'),{createGenreDemoSession,NEW_GENRE_DEMOS}=await import('/genre-demo-sessions.js'),{createVocalDemoSession,VOCAL_DEMOS}=await import('/vocal-demo-sessions.js'),{AudioEngine}=await import('/audio.js'),{measureLoudness}=await import('/loudness.js');
const {createRecordedVocalDemoMedia}=await import('/recorded-vocal-audio.js'),{extendPublicDemoArrangement}=await import('/public-demo-arrangements.js'),{completePublicDemoVocals}=await import('/public-demo-completion.js'),{balancePublicDemo}=await import('/demo-gain-staging.js'),{mixPublicDemoInstruments}=await import('/demo-instrument-mix.js'),{routePublicDemoGroups}=await import('/demo-group-buses.js'),{routeVocalSubgroups}=await import('/demo-vocal-buses.js'),{routeVocalFX}=await import('/demo-vocal-fx.js'),{masterPublicDemo}=await import('/demo-mastering.js');
const {setDemoPlaybackLevel}=await import('/demo-playback-level.js');
const cases=[...SESSION_TEMPLATES.map(x=>['factory',x.id]),...Object.keys(BEAT_DEMOS).map(x=>['public',x]),...Object.keys(NEW_GENRE_DEMOS).map(x=>['public',x]),...['trap','afro','rnb',...Object.keys(VOCAL_DEMOS)].map(x=>['public',x])],rows=[];for(const [family,id] of cases.filter(([family,id])=>!selected.length||selected.includes(family+':'+id))){
const p=family==='factory'?createFactorySession(id,true):BEAT_DEMOS[id]?createBeatDemoSession(id):NEW_GENRE_DEMOS[id]?createGenreDemoSession(id):createVocalDemoSession(VOCAL_DEMOS[id]?id:'vox-'+id);let assets=new Map();
if(family==='public'){p.publicDemo=true;if(p.vocalDemo){const ctx=new OfflineAudioContext(2,48000,48000),media=await createRecordedVocalDemoMedia(p);for(const m of media)assets.set(m.id,{buffer:await ctx.decodeAudioData(m.data)});}if(['trap','trap808'].includes(id))extendPublicDemoArrangement(p,id);completePublicDemoVocals(p);balancePublicDemo(p);mixPublicDemoInstruments(p);routePublicDemoGroups(p);routeVocalSubgroups(p);routeVocalFX(p);masterPublicDemo(p,id);setDemoPlaybackLevel(p,id,'public');}
if(p.masterVolume!==0||p.demoLevelProfile!==family+':'+id)throw Error('Demo playback profile missing '+family+':'+id);
const start=p.sections?.find(s=>s.name.startsWith('REFRAIN'))?.start??12;
const engine=new AudioEngine(()=>p,()=>assets),buffer=await engine.renderRange({sampleRate:48000,startBar:start,endBar:start+4,tail:false});
for(let c=0;c<2;c++)if(buffer.getChannelData(c).some(x=>!Number.isFinite(x)))throw Error('Invalid PCM '+id);
const metrics=measureLoudness([buffer.getChannelData(0),buffer.getChannelData(1)]);
if(metrics.integrated< -20||metrics.integrated> -12||metrics.samplePeak> -1.499)throw Error('Demo level outside the listening range '+id+' '+JSON.stringify(metrics));
const vocalBalance={};
if(family==='public'&&p.vocalDemo){
 const rms=buffer=>{let sum=0;for(let c=0;c<buffer.numberOfChannels;c++)for(const x of buffer.getChannelData(c))sum+=x*x;return Math.sqrt(sum/(buffer.length*buffer.numberOfChannels));};
 const lead=p.tracks.find(t=>t.type==='audio'&&/^LEAD\b/i.test(t.name));if(!lead)throw Error('Missing lead '+id);
 const leadProject=structuredClone(p);for(const t of leadProject.tracks)if(t.type!=='bus'&&t.id!==lead.id)t.mute=true;
 const backingProject=structuredClone(p);for(const t of backingProject.tracks)if(t.type==='audio')t.mute=true;
 const options={sampleRate:48000,startBar:start,endBar:start+4,tail:false};
 vocalBalance.leadRms=rms(await new AudioEngine(()=>leadProject,()=>assets).renderRange(options));
 vocalBalance.backingRms=rms(await new AudioEngine(()=>backingProject,()=>assets).renderRange(options));
 vocalBalance.leadToBacking=vocalBalance.leadRms/vocalBalance.backingRms;
 if(vocalBalance.leadToBacking<.35||vocalBalance.leadRms<.01)throw Error('Lead buried in full public mix '+id+' '+JSON.stringify(vocalBalance));
}
rows.push({family,id,masterVolume:p.masterVolume,drive:p.mastering.peak.drive,start,...metrics,...vocalBalance});console.log(JSON.stringify(rows.at(-1)));}return rows;
},(process.env.STUDIO_DEMO_LEVEL_IDS||'').split(',').filter(Boolean));
await writeFile(folder+'/rendered-levels.json',JSON.stringify(result,null,2));console.log('PASS: measured playback levels and finite, bounded stereo output for '+result.length+' factory/public demos');
}finally{await browser.close();await new Promise(r=>server.close(r));}
