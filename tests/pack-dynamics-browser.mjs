import {createRequire} from 'node:module';import {createServer} from 'node:http';import {readFile,mkdir,writeFile} from 'node:fs/promises';import path from 'node:path';
const {chromium}=createRequire(import.meta.url)('playwright'),root=path.resolve(import.meta.dirname,'../dist'),folder='artifacts/pack-dynamics';await mkdir(folder,{recursive:true});
const server=createServer(async(req,res)=>{try{const file=path.resolve(root,'.'+new URL(req.url,'http://localhost').pathname);if(!file.startsWith(root+path.sep))throw Error();res.setHeader('content-type',file.endsWith('.js')?'text/javascript':'text/html');res.end(await readFile(file));}catch{res.writeHead(404).end();}});await new Promise(r=>server.listen(0,'127.0.0.1',r));
const browser=await chromium.launch({headless:true,...(process.env.STUDIO_TEST_CHROMIUM_PATH?{executablePath:process.env.STUDIO_TEST_CHROMIUM_PATH}:{}),args:['--no-sandbox']});
try{
 const page=await browser.newPage();await page.goto('http://127.0.0.1:'+server.address().port+'/mastering.js');
 const result=await page.evaluate(async()=>{
  const {prepareStudioContext}=await import('/studio-pack-audio.js'),{createPackProcessors,syncPackProcessors}=await import('/pack-audio.js'),{EFFECTS}=await import('/plugins.js');
  const {AudioEngine,emptyProject}=await import('/audio.js'),{compressorCurve}=await import('/compressor-dsp.js'),{encodeWav}=await import('/wav.js');
  const {bindings}=await import('/automation.js'),{effectLatency}=await import('/dynamics-timing.js');
  const {masteringSettings,exportMasterRack,importMasterRack}=await import('/mastering.js'),{insertRackSplit,placeRackModule}=await import('/master-rack-model.js');
  const ids=['exostrip','hardibus','hardivocalcomp','hardideess','elianaembrace','elianaguard'],checks=[],evidence=[];
  const check=(name,ok,details={})=>{if(!ok)throw Error(name+' '+JSON.stringify(details));checks.push({name,...details});};
  const state=(id,values={})=>({enabled:true,...Object.fromEntries(EFFECTS[id].controls.map(c=>[c.key,c.default])),highpass:20,body:0,presence:0,air:0,output:0,threshold:-24,ratio:4,attack:1,release:100,mix:1,ceiling:-1,...values});
  async function render(id,rate,{values={},frequency=1000,amplitude=.5,kind='sine',channels=2,automate=null}={}){
   const ctx=new OfflineAudioContext(channels,rate,rate);await prepareStudioContext(ctx);
   const rack=createPackProcessors(ctx,ctx.createGain(),ctx.createGain(),{detached:true,types:[id]}),m=rack.modules[id],s=state(id,values);
   rack.inputChannels=channels;syncPackProcessors(rack,{[id]:s},120,0,true);
   if(automate)automate(m,ctx);
   const input=ctx.createBuffer(channels,rate,rate),source=ctx.createBufferSource();
   for(let c=0;c<channels;c++)for(let i=0;i<rate;i++){
    const x=kind==='dc'?amplitude:kind==='impulse'?(i===100?amplitude:0):amplitude*Math.sin(2*Math.PI*frequency*i/rate)+(kind==='two-tone'?.2*Math.sin(2*Math.PI*200*i/rate):0);
    input.getChannelData(c)[i]=x*(c?.25:1);
   }
   source.buffer=input;source.connect(m.input);m.output.connect(ctx.destination);source.start();const output=await ctx.startRendering(),a=output.getChannelData(0);
   let peak=0,energy=0,ratioError=0,invalid=0,dc=0;for(let i=0;i<rate;i++){const x=a[i];if(!Number.isFinite(x))invalid++;peak=Math.max(peak,Math.abs(x));if(i>=rate/2){energy+=x*x;dc+=x;}if(channels===2)ratioError=Math.max(ratioError,Math.abs(x/4-output.getChannelData(1)[i]));}
   rack.dispose();return {a,output,input,peak,rms:Math.sqrt(energy/(rate/2)),dc:dc/(rate/2),ratioError,invalid,first:a.findIndex(x=>Math.abs(x)>1e-10)};
  }
  for(const rate of [44100,48000,96000])for(const id of ids){
   const delay=Math.round(effectLatency(id,rate)*rate),dry=await render(id,rate,{values:{mix:0},amplitude:.01,kind:'impulse'});
   check(id+' sample-rounded dry latency '+rate,dry.first===100+delay&&dry.invalid===0,{first:dry.first,expected:100+delay});
   const quiet=await render(id,rate,{amplitude:.001}),reference=await render(id,rate,{amplitude:.001,values:{mix:0}});
   const quietDb=20*Math.log10(quiet.rms/reference.rms);
   check(id+' quiet unity without implicit makeup '+rate,Math.abs(quietDb)<(id==='exostrip'?.01:.001)&&quiet.invalid===0,{quietDb});
   check(id+' stereo linkage '+rate,quiet.ratioError<1e-7,{ratioError:quiet.ratioError});
   const mixed=await render(id,rate,{amplitude:.001,values:{mix:.37}});let error=0;
   for(let i=0;i<rate;i++)error=Math.max(error,Math.abs(mixed.a[i]-(reference.a[i]*.63+quiet.a[i]*.37)));
   check(id+' parallel sum alignment '+rate,error<1e-7,{error});
  }
  for(const id of ['hardibus','hardivocalcomp','elianaembrace']){
   const measured=await render(id,48000,{kind:'dc'}),db=20*Math.log10(measured.dc),expected=compressorCurve(20*Math.log10(.5),-24,4,id==='elianaembrace'?8:6);
   check(id+' measured transfer',Math.abs(db-expected)<.002,{db,expected});
   const gain=await render(id,48000,{kind:'dc',values:{output:6}});
   check(id+' explicit six dB gain',Math.abs(20*Math.log10(gain.dc/measured.dc)-6)<.002);
  }
  const stripWet=await render('exostrip',48000),stripDry=await render('exostrip',48000,{values:{ratio:1}});
  check('EXO STRIP compression reduces actual PCM',stripWet.rms<stripDry.rms*.5,{wet:stripWet.rms,dry:stripDry.rms});
  const stripGain=await render('exostrip',48000,{values:{output:6}});check('EXO STRIP explicit output gain',Math.abs(20*Math.log10(stripGain.rms/stripWet.rms)-6)<.002);
  for(const rate of [44100,48000,96000]){
   for(const f of [200,3500,6500,12000]){
    const wet=await render('hardideess',rate,{frequency:f,values:{ratio:1}}),dry=await render('hardideess',rate,{frequency:f,values:{mix:0}});let error=0;
    for(let i=0;i<rate;i++)error=Math.max(error,Math.abs(wet.a[i]-dry.a[i]));
    check('DEESS complementary reconstruction '+f+' Hz / '+rate,error<1e-7,{error});
   }
   const bass=await render('hardideess',rate,{frequency:200,values:{ratio:8}}),high=await render('hardideess',rate,{frequency:12000,values:{ratio:8}});
   const bassDb=20*Math.log10(bass.rms/(.5/Math.sqrt(2))),highDb=20*Math.log10(high.rms/(.5/Math.sqrt(2)));
   check('DEESS preserves lows and attenuates sibilance '+rate,bassDb>-.1&&highDb<-5,{bassDb,highDb});
   for(const mix of [0,.5,1])for(const ceiling of [-.1,-1,-6]){
    const guarded=await render('elianaguard',rate,{amplitude:3,frequency:12000,values:{threshold:-1,ratio:2,attack:15,mix,ceiling}});
    check('GUARD ceiling '+ceiling+' mix '+mix+' / '+rate,guarded.peak<=10**(ceiling/20)+1e-7&&guarded.invalid===0&&guarded.ratioError<1e-7,{peak:guarded.peak,ratioError:guarded.ratioError});
    if(rate===48000&&mix===0&&ceiling===-6)evidence.push({name:'guard-mix-zero.wav',bytes:Array.from(new Uint8Array(encodeWav(guarded.output,{bits:32})))});
   }
  }
  const twoTone=await render('hardideess',48000,{kind:'two-tone',frequency:12000,values:{ratio:8}});
  function fundamental(samples,f){let sin=0,cos=0;for(let i=24000;i<48000;i++){const t=2*Math.PI*f*i/48000;sin+=samples[i]*Math.sin(t);cos+=samples[i]*Math.cos(t);}return 2*Math.hypot(sin,cos)/24000;}
  const simultaneousBassDb=20*Math.log10(fundamental(twoTone.a,200)/.2),simultaneousHighDb=20*Math.log10(fundamental(twoTone.a,12000)/.5);
  check('DEESS retains simultaneous bass while sibilance is compressed',Math.abs(simultaneousBassDb)<.05&&simultaneousHighDb<-5,{simultaneousBassDb,simultaneousHighDb});
  const thresholdOpen=await render('hardideess',48000,{frequency:12000,values:{threshold:-6}}),thresholdClosed=await render('hardideess',48000,{frequency:12000,values:{threshold:-40}});
  check('DEESS threshold changes high-band reduction',thresholdClosed.rms<thresholdOpen.rms*.5,{open:thresholdOpen.rms,closed:thresholdClosed.rms});
  const cutoffLow=await render('hardideess',48000,{frequency:7000,values:{frequency:3500}}),cutoffHigh=await render('hardideess',48000,{frequency:7000,values:{frequency:10500}});
  check('DEESS frequency moves the processed band',cutoffHigh.rms>cutoffLow.rms*1.3,{low:cutoffLow.rms,high:cutoffHigh.rms});
  const moving=await render('hardideess',48000,{values:{ratio:1},automate:m=>{m.comp.frequency.setValueAtTime(3500,0);m.comp.frequency.linearRampToValueAtTime(10500,1);}}),ref=await render('hardideess',48000,{values:{mix:0}});let movingError=0;for(let i=0;i<48000;i++)movingError=Math.max(movingError,Math.abs(moving.a[i]-ref.a[i]));
  check('DEESS cutoff automation retains complementary unity',movingError<1e-7,{movingError});
  const falling=await render('elianaguard',48000,{amplitude:2,values:{mix:0},automate:m=>{m.limiter.processor.parameters.get('ceiling').setValueAtTime(-6,.5);}});let latePeak=0;for(let i=24000;i<48000;i++)latePeak=Math.max(latePeak,Math.abs(falling.a[i]));check('GUARD automated ceiling bounds delayed samples immediately',latePeak<=10**(-6/20)+1e-7,{latePeak});
  async function host(id,{bypass=false,master=false,mono=false,automate=false}={}){
   const ctx=new OfflineAudioContext(2,48000,48000);await prepareStudioContext(ctx);const p=emptyProject();p.masterVolume=0;p.tracks[0].volume=0;p.tracks[0].type=mono?'audio':'bus';
   const s=state(id,{enabled:!bypass,threshold:0,ratio:automate?4:1});
   if(master)p.mastering={inserts:[id],[id]:s};else{p.tracks[0].inserts=[id];p.tracks[0].effects[id]=s;}
   const engine=new AudioEngine(()=>p,()=>new Map()),graph=engine.buildGraph(ctx),ch=graph.channels.get(p.tracks[0].id),stage=master?graph.mastering.effects.get(id)?.channel?.stages[id]:ch.stages[id];
   if(automate){const b=bindings(ch,p.tracks[0],EFFECTS).get(id+':threshold');check(id+' host automation target exists',b?.targets.length>0);b.targets[0].param.setValueAtTime(-36,.5);}
   const buffer=ctx.createBuffer(mono?1:2,48000,48000);for(let c=0;c<buffer.numberOfChannels;c++)for(let i=0;i<48000;i++)buffer.getChannelData(c)[i]=(automate?.2:.02)*Math.sin(2*Math.PI*1000*i/48000)*(c?.25:1);
   const source=ctx.createBufferSource();source.buffer=buffer;source.connect(master?graph.master:ch.input);source.start();const out=await ctx.startRendering(),a=out.getChannelData(0).slice();
   for(const c of graph.channels.values())engine.disposeChannel(c);for(const s of graph.mastering.effects.values())s.dispose();return {a,stage};
  }
  for(const id of ids){
   const track=await host(id),master=await host(id,{master:true}),dry=await host(id,{bypass:true});let same=0;
   for(let i=0;i<48000;i++)same=Math.max(same,Math.abs(track.a[i]-master.a[i]));
   check(id+' identical track/master processing',same<1e-7,{same});
   check(id+' host bypass removes processing delay',dry.a.findIndex(x=>Math.abs(x)>1e-8)===1);
   const mono=await host(id,{mono:true}),monoDry=await host(id,{mono:true,bypass:true}),delay=Math.round(effectLatency(id)*48000);let monoError=0,monoGainDb=0;
   // EXO retains its explicit 20 Hz high-pass; other neutral processors are exact.
   if(id!=='exostrip')for(let i=delay;i<48000;i++)monoError=Math.max(monoError,Math.abs(mono.a[i]-monoDry.a[i-delay]));
   else{let wet=0,dry=0;for(let i=24000;i<48000;i++){wet+=mono.a[i]**2;dry+=monoDry.a[i]**2;}monoGainDb=10*Math.log10(wet/dry);}
   check(id+' mono path avoids hidden pan-law boost',monoError<1e-7&&Math.abs(monoGainDb)<.01,{monoError,monoGainDb});
   check(id+' uses custom worklet',track.stage.comp instanceof AudioWorkletNode&&!(track.stage.comp instanceof DynamicsCompressorNode));
   if(['hardibus','hardivocalcomp','elianaembrace'].includes(id)){const changed=await host(id,{automate:true});let before=0,after=0;for(let i=12000;i<18000;i++)before+=changed.a[i]**2;for(let i=42000;i<48000;i++)after+=changed.a[i]**2;check(id+' host automation changes PCM',after<before*.5,{ratio:after/before});}
  }
  const ctx=new OfflineAudioContext(2,44100,44100);await prepareStudioContext(ctx);const p=emptyProject();p.masterVolume=0;p.mastering=masteringSettings();
  const {MASTER_MODULES}=await import('/mastering.js'),split=insertRackSplit(p.mastering,0),branches=p.mastering.splits[split].branches;
  const one=placeRackModule(p.mastering,{splitId:split,branchId:branches[0].id,index:0},'hardibus',MASTER_MODULES),two=placeRackModule(p.mastering,{splitId:split,branchId:branches[1].id,index:0},'elianaguard',MASTER_MODULES);
  Object.assign(p.mastering[one],state('hardibus',{threshold:0,ratio:1}));Object.assign(p.mastering[two],state('elianaguard',{threshold:-1,ratio:2}));p.mastering.mix=.37;
  const restored={};importMasterRack(restored,JSON.parse(JSON.stringify(exportMasterRack(p))));check('new dynamics preserve rack state',restored.mastering[two].ceiling===-1&&restored.mastering[one].ratio===1);
  const engine=new AudioEngine(()=>p,()=>new Map()),graph=engine.buildGraph(ctx),buffer=ctx.createBuffer(2,44100,44100),source=ctx.createBufferSource();for(let c=0;c<2;c++)for(let i=0;i<44100;i++)buffer.getChannelData(c)[i]=.001*Math.sin(i*.035);source.buffer=buffer;source.connect(graph.master);source.start();const out=await ctx.startRendering(),delay=2*Math.ceil(44100*.006);let rackError=0;for(let i=delay;i<44100;i++)rackError=Math.max(rackError,Math.abs(out.getChannelData(0)[i]-buffer.getChannelData(0)[i-delay]));check('mixed single/double-delay parallel rack aligns global dry path',rackError<1e-7,{rackError});for(const s of graph.mastering.effects.values())s.dispose();for(const s of graph.mastering.splitNodes.values())s.dispose();
  const live=new AudioContext();await prepareStudioContext(live);await live.resume();const project=emptyProject();project.masterVolume=0;
  const template=project.tracks[0];project.tracks=ids.map(id=>({...structuredClone(template),id:'live-'+id,inserts:[id],effects:{[id]:state(id,{threshold:-40})}}));
  const liveEngine=new AudioEngine(()=>project,()=>new Map()),liveGraph=liveEngine.buildGraph(live),osc=live.createOscillator();liveGraph.monitor.gain.value=0;osc.frequency.value=10000;
  for(const ch of liveGraph.channels.values())osc.connect(ch.input);osc.start();await new Promise(r=>setTimeout(r,400));
  for(const id of ids){const ch=liveGraph.channels.get('live-'+id),stage=ch.stages[id];check(id+' measured gain reduction telemetry',stage.comp.reduction<-.1,{reduction:stage.comp.reduction});
   const tr=project.tracks.find(t=>t.id==='live-'+id);tr.inserts=[];liveEngine.syncEffects(ch,tr,live.currentTime);
   check(id+' removal closes worklet telemetry ports',!ch.stages[id]&&stage.comp.port.onmessage===null&&(!stage.limiter||stage.limiter.processor.port.onmessage===null));liveEngine.disposeChannel(ch);
  }
  osc.stop();await live.close();
  return {checks,evidence};
 });
 await writeFile(folder+'/measurements.json',JSON.stringify(result.checks,null,2));for(const item of result.evidence)await writeFile(folder+'/'+item.name,Buffer.from(item.bytes));console.log('PASS: '+result.checks.length+' pack dynamics checks',result.checks);
}finally{await browser.close();await new Promise(r=>server.close(r));}
