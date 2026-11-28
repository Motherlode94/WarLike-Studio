import assert from 'node:assert/strict';import {createRequire} from 'node:module';import {createServer} from 'node:http';import {readFile,mkdir,writeFile} from 'node:fs/promises';import path from 'node:path';
const {chromium}=createRequire(import.meta.url)('playwright'),root=path.resolve(import.meta.dirname,'../dist'),folder='artifacts/compressor-dsp';await mkdir(folder,{recursive:true});
const server=createServer(async(req,res)=>{try{const file=path.resolve(root,'.'+new URL(req.url,'http://localhost').pathname);if(!file.startsWith(root+path.sep))throw Error();res.setHeader('content-type',file.endsWith('.js')?'text/javascript':'text/html');res.end(await readFile(file));}catch{res.writeHead(404).end();}});await new Promise(r=>server.listen(0,'127.0.0.1',r));
const browser=await chromium.launch({headless:true,...(process.env.STUDIO_TEST_CHROMIUM_PATH?{executablePath:process.env.STUDIO_TEST_CHROMIUM_PATH}:{}),args:['--no-sandbox']});
try{
 const page=await browser.newPage();await page.goto('http://127.0.0.1:'+server.address().port+'/mastering.js');
 const result=await page.evaluate(async()=>{
  const {prepareStudioContext,createStudioEffects,syncStudioEffect}=await import('/studio-pack-audio.js');
  const {createCompressor}=await import('/compressor-audio.js');
  const {AudioEngine,emptyProject}=await import('/audio.js');
  const {compressorCurve}=await import('/compressor-dsp.js');
  const {MASTER_MODULES,masteringSettings,exportMasterRack,importMasterRack,syncMasterChain}=await import('/mastering.js');
  const {insertRackSplit,placeRackModule}=await import('/master-rack-model.js');
  const {encodeWav}=await import('/wav.js');
  const checks=[],evidence=[];const check=(name,ok,details={})=>{if(!ok)throw Error(name+' '+JSON.stringify(details));checks.push({name,...details});};
  const defaults={enabled:true,threshold:-24,ratio:4,knee:0,attack:1,release:100,mix:1,output:0,makeup:0,peakThreshold:-12,levelThreshold:-24};
  async function render(id,rate,{level=-6,values={},signal='dc',seconds=1,automate=false,masterEffect=false,bypass=false}={}){
   const length=Math.round(seconds*rate),ctx=new OfflineAudioContext(2,length,rate);await prepareStudioContext(ctx);
   const scope={nodes:[],oscillators:[],cleanups:[],node:(kind,...args)=>ctx[kind](...args)},state={...defaults,...values},source=ctx.createBufferSource(),input=ctx.createBuffer(2,length,rate),amplitude=10**(level/20);
   let graph,engine,stage,p;
   if(['glue','press'].includes(id)||masterEffect){
    p=emptyProject();p.masterVolume=0;p.tracks[0].volume=0;
    if(id==='press'||masterEffect)p.mastering={inserts:[id],[id]:state};else{p.tracks[0].inserts=[id];p.tracks[0].effects[id]=state;}
    if(bypass){if(id==='press'||masterEffect)p.mastering[id].enabled=false;else p.tracks[0].effects[id].enabled=false;}
    engine=new AudioEngine(()=>p,()=>new Map());graph=engine.buildGraph(ctx);
    source.connect(id==='press'||masterEffect?graph.master:graph.channels.get(p.tracks[0].id).input);
    stage=id==='press'?{comp:graph.mastering.press}:masterEffect?graph.mastering.effects.get(id).channel.stages[id]:{comp:graph.channels.get(p.tracks[0].id).compressor};
   }else{stage=createStudioEffects(ctx,scope,[id])[id];syncStudioEffect(ctx,id,stage,state,120,0,true,2);source.connect(stage.input);stage.output.connect(ctx.destination);}
   for(let i=0;i<length;i++){
    let x=amplitude;if(signal==='sine')x*=Math.sin(2*Math.PI*1000*i/rate);
    if(signal==='release'&&i>=rate)x=.001;
    if(signal==='impulse')x=i===100?amplitude:0;
    input.getChannelData(0)[i]=x;input.getChannelData(1)[i]=x/4;
   }
   if(automate){const threshold=stage.comp.threshold;threshold.setValueAtTime(0,0);threshold.setValueAtTime(-36,.5);}
   source.buffer=input;source.start();const output=await ctx.startRendering(),a=output.getChannelData(0),b=output.getChannelData(1);let ratioError=0,invalid=0;
   for(let i=0;i<a.length;i++){if(!Number.isFinite(a[i])||!Number.isFinite(b[i]))invalid++;ratioError=Math.max(ratioError,Math.abs(a[i]/4-b[i]));}
   const latency=Math.ceil(rate*.006)*(id==='voxlevel'?2:1),dc=a.slice(-Math.round(rate*.1)).reduce((s,x)=>s+x,0)/Math.round(rate*.1),metrics={dc,outputDb:20*Math.log10(Math.abs(dc)),ratioError,invalid,first:a.findIndex(x=>Math.abs(x)>1e-10),a,input,output,latency};
   scope.cleanups.forEach(fn=>fn());if(graph){for(const ch of graph.channels.values())engine.disposeChannel(ch);for(const s of graph.mastering.effects.values())s.dispose();graph.mastering.press?.dispose();graph.mastering.peakProcessor?.dispose();}
   return metrics;
  }
  for(const rate of [44100,48000,96000])for(const id of ['vectorcomp','circuitbus','glue','press','voxlevel']){
   const quiet=await render(id,rate,{level:-60}),delay=Math.ceil(rate*.006)*(id==='voxlevel'?2:1);
   check(id+' unity and latency '+rate,quiet.invalid===0&&Math.abs(quiet.dc-.001)<1e-10&&quiet.first===delay,{dc:quiet.dc,first:quiet.first,delay});
   const active=await render(id,rate);
   const inputDb=20*Math.log10(active.input.getChannelData(0)[0]);
   const expected=id==='voxlevel'?compressorCurve(compressorCurve(inputDb,-12,6,3),-24,4,12):compressorCurve(inputDb,-24,4,id==='press'?6:0);
   check(id+' actual PCM matches transfer '+rate,active.invalid===0&&Math.abs(active.outputDb-expected)<.002,{outputDb:active.outputDb,expected});
   check(id+' stereo linking '+rate,active.ratioError<1e-8,{error:active.ratioError});
   const gain=await render(id,rate,{values:{output:6,makeup:6}});
   check(id+' explicit output gain '+rate,Math.abs(gain.outputDb-active.outputDb-6)<.002,{gainDb:gain.outputDb-active.outputDb});
   if(rate===48000&&id==='vectorcomp')evidence.push({name:'vector-comp-dc.wav',bytes:Array.from(new Uint8Array(encodeWav(active.output,{bits:32})))});
  }
  for(const id of ['vectorcomp','circuitbus','glue'])for(const [level,ratio,knee,mix] of [[-24,4,12,1],[-24,4,24,.5],[-6,1,12,.37],[-6,8,0,.25]]){
   const measured=await render(id,48000,{level,values:{ratio,knee,mix}}),input=measured.input.getChannelData(0)[0],wet=10**(compressorCurve(20*Math.log10(input),-24,ratio,knee)/20),expected=20*Math.log10(input*(1-mix)+wet*mix);
   check(id+' ratio/knee/mix '+[ratio,knee,mix].join('/'),Math.abs(measured.outputDb-expected)<.002,{outputDb:measured.outputDb,expected});
  }
  for(const [peakThreshold,levelThreshold] of [[0,-24],[-12,0]]){
   const measured=await render('voxlevel',48000,{values:{peakThreshold,levelThreshold}}),inputDb=20*Math.log10(measured.input.getChannelData(0)[0]),expected=compressorCurve(compressorCurve(inputDb,peakThreshold,6,3),levelThreshold,4,12);
   check('VOX LEVEL independent thresholds '+peakThreshold+'/'+levelThreshold,Math.abs(measured.outputDb-expected)<.002,{outputDb:measured.outputDb,expected});
  }
  const attack=await render('vectorcomp',48000,{level:0,values:{attack:20}}),frame=960-1,expectedGain=10**(-18*(1-Math.exp(-1))/20);
  check('20 ms attack constant in real AudioWorklet',Math.abs(attack.a[frame]-expectedGain)<1e-6,{sample:attack.a[frame],expectedGain});
  const release=await render('vectorcomp',48000,{level:0,signal:'release',seconds:1.3,values:{attack:5,release:100}}),a=Math.exp(-1/(48000*.005)),r=Math.exp(-1/(48000*.1)),n=9601;
  const expectedRelease=18*(a**n+(1-a)*r*(a**n-r**n)/(a-r)),actualRelease=-20*Math.log10(release.a[48000+9600]/.001);
  check('release trajectory in real AudioWorklet',Math.abs(expectedRelease-actualRelease)<1e-5,{actualRelease,expectedRelease});
  const sinusoid=await render('vectorcomp',48000,{level:0,signal:'sine',values:{attack:10,release:150}});let energy=0,sin=0,cos=0,count=0;
  for(let i=24000;i<48000;i++){const t=2*Math.PI*1000*i/48000,x=sinusoid.a[i];energy+=x*x;sin+=x*Math.sin(t);cos+=x*Math.cos(t);count++;}
  const fundamental=2*(sin*sin+cos*cos)/(count*count),residualDb=10*Math.log10(Math.max(1e-16,energy/count-fundamental)/fundamental);
  check('steady 1 kHz compression residual below -60 dB',residualDb< -60,{residualDb});
  const automated=await render('vectorcomp',48000,{values:{attack:1},automate:true});
  check('threshold automation changes the processed samples',automated.a[20000]>.49&&automated.a[47000]<.05&&automated.invalid===0,{before:automated.a[20000],after:automated.a[47000]});
  for(const id of ['vectorcomp','circuitbus','voxlevel','glue']){
   const dry=await render(id,44100,{level:-30,signal:'sine',values:{mix:0}}),mixed=await render(id,44100,{level:-60,signal:'sine',values:{mix:.37}});
   let dryError=0,mixError=0;for(let i=dry.latency;i<dry.a.length;i++)dryError=Math.max(dryError,Math.abs(dry.a[i]-dry.input.getChannelData(0)[i-dry.latency]));
   for(let i=mixed.latency;i<mixed.a.length;i++)mixError=Math.max(mixError,Math.abs(mixed.a[i]-mixed.input.getChannelData(0)[i-mixed.latency]));
   check(id+' dry-wet alignment at 44.1 kHz',dryError<1e-7&&mixError<1e-7,{dryError,mixError});
  }
  for(const id of ['glue','press']){const bypass=await render(id,44100,{bypass:true});check(id+' host bypass remains direct',bypass.first===0&&Math.abs(bypass.dc-10**(-6/20))<1e-7,{first:bypass.first,dc:bypass.dc});}
  for(const id of ['vectorcomp','circuitbus','voxlevel']){const master=await render(id,48000,{masterEffect:true}),track=await render(id,48000);let difference=0;for(let i=0;i<master.a.length;i++)difference=Math.max(difference,Math.abs(master.a[i]-track.a[i]));check(id+' master uses identical DSP',difference<1e-7,{difference});}
  const ctx=new OfflineAudioContext(2,44100,44100);await prepareStudioContext(ctx);const p=emptyProject();p.masterVolume=0;p.mastering=masteringSettings();const split=insertRackSplit(p.mastering,0),branches=p.mastering.splits[split].branches;
  const first=placeRackModule(p.mastering,{splitId:split,branchId:branches[0].id,index:0},'vectorcomp',MASTER_MODULES),second=placeRackModule(p.mastering,{splitId:split,branchId:branches[1].id,index:0},'vectorcomp',MASTER_MODULES);
  p.mastering[first].threshold=-40;p.mastering[second].ratio=1;p.mastering.mix=.37;
  const restored={};importMasterRack(restored,JSON.parse(JSON.stringify(exportMasterRack(p))));check('rack preserves independent instance parameters',restored.mastering[first].threshold===-40&&restored.mastering[second].ratio===1);
  const engine=new AudioEngine(()=>p,()=>new Map()),graph=engine.buildGraph(ctx);check('independent AudioWorklet instances',graph.mastering.effects.get(first).channel.stages.vectorcomp.comp!==graph.mastering.effects.get(second).channel.stages.vectorcomp.comp);
  const buffer=ctx.createBuffer(2,44100,44100),source=ctx.createBufferSource();for(let c=0;c<2;c++)for(let i=0;i<44100;i++)buffer.getChannelData(c)[i]=.001*Math.sin(i*.035);source.buffer=buffer;source.connect(graph.master);source.start();
  const output=await ctx.startRendering(),delay=Math.ceil(44100*.006);let alignment=0;for(let i=delay;i<output.length;i++)alignment=Math.max(alignment,Math.abs(output.getChannelData(0)[i]-buffer.getChannelData(0)[i-delay]));
  check('repeated parallel processors retain alignment',alignment<1e-7,{alignment});
  for(const stage of graph.mastering.effects.values())stage.dispose();for(const split of graph.mastering.splitNodes.values())split.dispose();
  const clock=new AudioContext(),tone=clock.createOscillator(),mute=clock.createGain();await prepareStudioContext(clock);await clock.resume();const live=createCompressor(clock);live.threshold.value=-24;live.ratio.value=4;live.knee.value=0;live.attack.value=.001;tone.connect(live);mute.gain.value=0;live.connect(mute);mute.connect(clock.destination);tone.start();await new Promise(r=>setTimeout(r,350));check('actual gain reduction reaches the UI meter',live.reduction< -10,{reduction:live.reduction});tone.stop();live.dispose();live.dispose();
  const nativeProject=emptyProject();nativeProject.masterVolume=0;nativeProject.tracks[0].inserts=['glue'];Object.assign(nativeProject.tracks[0].effects.glue,defaults);nativeProject.mastering={inserts:['press'],press:{...defaults}};
  const nativeEngine=new AudioEngine(()=>nativeProject,()=>new Map()),nativeGraph=nativeEngine.buildGraph(clock),channel=nativeGraph.channels.get(nativeProject.tracks[0].id);
  check('GLUE and PRESS load AudioWorklet processors',channel.compressor instanceof AudioWorkletNode&&nativeGraph.mastering.press instanceof AudioWorkletNode);
  nativeProject.tracks[0].inserts=[];nativeProject.tracks[0].effects.glue.enabled=false;nativeEngine.syncEffects(channel,nativeProject.tracks[0],clock.currentTime);syncMasterChain(nativeGraph.mastering,masteringSettings(),clock.currentTime);
  check('removing GLUE and PRESS releases their processors',channel.compressor===null&&nativeGraph.mastering.press===null);nativeEngine.disposeChannel(channel);await clock.close();
  const automatedProject=emptyProject();automatedProject.bpm=240;automatedProject.bars=1;automatedProject.masterVolume=0;const tr=automatedProject.tracks[0];tr.volume=0;tr.inserts=['glue'];Object.assign(tr.effects.glue,defaults,{threshold:0});tr.automation={mode:'read',curves:{'glue:threshold':[{bar:0,value:0},{bar:1,value:-36}]}};
  tr.clips=[{id:'dc',audioId:'dc',start:0,length:1}];const dcContext=new OfflineAudioContext(1,48000,48000),dc=dcContext.createBuffer(1,48000,48000);dc.getChannelData(0).fill(1);
  const automatedEngine=new AudioEngine(()=>automatedProject,()=>new Map([['dc',{buffer:dc}]])),automatedOutput=await automatedEngine.renderRange({sampleRate:48000,tail:false}),samples=automatedOutput.getChannelData(0);
  check('GLUE automation uses the host export bindings',samples[4800]>.5&&samples[38400]<.15,{before:samples[4800],after:samples[38400]});

  async function monoPath(withGlue){const q=structuredClone(automatedProject);q.tracks[0].automation={mode:'off',curves:{}};q.tracks[0].inserts=withGlue?['glue']:[];q.tracks[0].effects.glue={...defaults,threshold:0,ratio:1};return new AudioEngine(()=>q,()=>new Map([['dc',{buffer:dc}]] )).renderRange({sampleRate:48000,tail:false});}
  const monoDry=await monoPath(false),monoWet=await monoPath(true);let monoError=0;for(let i=288;i<monoWet.length;i++)monoError=Math.max(monoError,Math.abs(monoWet.getChannelData(0)[i]-monoDry.getChannelData(0)[i-288]));
  check('mono GLUE preserves the host pan law without a 3 dB boost',monoError<1e-7,{monoError});
  const decode=new AudioContext({sampleRate:48000}),decoded=await decode.decodeAudioData(Uint8Array.from(evidence[0].bytes).buffer);const reference=await render('vectorcomp',48000);let error=0;for(let i=0;i<decoded.length;i++)error=Math.max(error,Math.abs(decoded.getChannelData(0)[i]-reference.a[i]));check('float WAV preserves compressor PCM',error<1e-7,{error});await decode.close();
  return {checks,evidence};
 });
 await writeFile(folder+'/measurements.json',JSON.stringify(result.checks,null,2));for(const item of result.evidence)await writeFile(folder+'/'+item.name,Buffer.from(item.bytes));console.log('PASS: '+result.checks.length+' real compressor DSP checks',result.checks);
}finally{await browser.close();await new Promise(r=>server.close(r));}
