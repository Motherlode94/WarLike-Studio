import assert from 'node:assert/strict';
import {createRequire} from 'node:module';
import {createServer} from 'node:http';
import {readFile,mkdir,writeFile} from 'node:fs/promises';
import path from 'node:path';
const {chromium}=createRequire(import.meta.url)('playwright'),root=path.resolve(import.meta.dirname,'../dist'),folder='artifacts/vector-limit';
await mkdir(folder,{recursive:true});
const server=createServer(async(req,res)=>{try{const file=path.resolve(root,'.'+new URL(req.url,'http://localhost').pathname);if(!file.startsWith(root+path.sep))throw Error();res.setHeader('content-type',file.endsWith('.js')?'text/javascript':'text/html');res.end(await readFile(file));}catch{res.writeHead(404).end();}});
await new Promise(r=>server.listen(0,'127.0.0.1',r));
const browser=await chromium.launch({headless:true,...(process.env.STUDIO_TEST_CHROMIUM_PATH?{executablePath:process.env.STUDIO_TEST_CHROMIUM_PATH}:{}),args:['--no-sandbox']});
try {
 const page=await browser.newPage();await page.goto('http://127.0.0.1:'+server.address().port+'/mastering.js');
 const result=await page.evaluate(async()=>{
  const {prepareStudioContext,createStudioEffects,syncStudioEffect}=await import('/studio-pack-audio.js');
  const {AudioEngine,emptyProject}=await import('/audio.js');
  const {masteringSettings,MASTER_MODULES}=await import('/mastering.js');
  const {insertRackSplit,placeRackModule}=await import('/master-rack-model.js');
  const {encodeWav}=await import('/wav.js');
  const results=[];let wav;
  const check=(name,ok,detail={})=>{if(!ok)throw Error(name+' '+JSON.stringify(detail));results.push({name,...detail});};
  async function render(rate,{amplitude=.1,drive=0,ceiling=-6,master=false,impulse=false,automated=false}={}) {
   const length=rate,ctx=new OfflineAudioContext(2,length,rate);await prepareStudioContext(ctx);
   const scope={nodes:[],oscillators:[],cleanups:[],node:(kind,...args)=>ctx[kind](...args)};
   let stage,graph,engine;
   if(master){const p=emptyProject();p.masterVolume=0;p.mastering={inserts:['peak'],peak:{enabled:true,drive,ceiling,release:100}};engine=new AudioEngine(()=>p,()=>new Map());graph=engine.buildGraph(ctx);stage={input:graph.master,output:graph.mastering.output};}
   else {stage=createStudioEffects(ctx,scope,['vectorlimit']).vectorlimit;syncStudioEffect(ctx,'vectorlimit',stage,{drive,ceiling,release:100},120,0,true,2);stage.output.connect(ctx.destination);}
   if(automated){const param=stage.limiter.processor.parameters.get('ceiling');param.setValueAtTime(-1,0);param.setValueAtTime(-12,.5);}
   const buffer=ctx.createBuffer(2,length,rate),left=buffer.getChannelData(0),right=buffer.getChannelData(1);
   for(let i=0;i<length;i++){left[i]=impulse?(i===100?amplitude:0):amplitude*Math.sin(2*Math.PI*1000*i/rate);right[i]=left[i]/4;}
   const source=ctx.createBufferSource();source.buffer=buffer;source.connect(stage.input);source.start();
   const out=await ctx.startRendering(),a=out.getChannelData(0),b=out.getChannelData(1),delay=Math.ceil(rate*.006);let peak=0,error=0,ratioError=0,energy=0,dotSin=0,dotCos=0,n=0;
   for(let i=0;i<length;i++){
    if(!Number.isFinite(a[i])||!Number.isFinite(b[i]))throw Error('Non-finite PCM');peak=Math.max(peak,Math.abs(a[i]));ratioError=Math.max(ratioError,Math.abs(a[i]/4-b[i]));
    if(i>=delay)error=Math.max(error,Math.abs(a[i]-left[i-delay]*10**(drive/20)));
    if(i>=rate/2&&!impulse){const t=(i-delay)*2*Math.PI*1000/rate;dotSin+=a[i]*Math.sin(t);dotCos+=a[i]*Math.cos(t);energy+=a[i]*a[i];n++;}
   }
   const fundamental=2*(dotSin*dotSin+dotCos*dotCos)/(n*n),rms=Math.sqrt(energy/Math.max(1,n)),residualDb=10*Math.log10(Math.max(1e-16,energy/Math.max(1,n)-fundamental)/Math.max(1e-16,fundamental));
   const impulseIndex=impulse?a.findIndex(x=>Math.abs(x)>1e-8):null;
   let automatedPeak=0;for(let i=rate/2;i<length;i++)automatedPeak=Math.max(automatedPeak,Math.abs(a[i]));
   if(master) {wav=Array.from(new Uint8Array(encodeWav(out,{bits:32})));graph.mastering.peakProcessor.dispose();}
   scope.cleanups.forEach(fn=>fn());
   return {peak,error,ratioError,rms,residualDb,impulseIndex,automatedPeak,a};
  }
  for(const rate of [44100,48000,96000]) {
   let r=await render(rate);check('unity below ceiling '+rate,r.error<2e-8,{error:r.error,rms:r.rms});
   r=await render(rate,{drive:6});check('drive adds the requested gain '+rate,r.error<5e-8,{error:r.error,rms:r.rms});
   r=await render(rate,{amplitude:2});check('overload stays under sample ceiling '+rate,r.peak<=10**(-6/20)+1e-7&&r.peak>.49,{peak:r.peak});
   check('linked stereo ratio '+rate,r.ratioError<1e-8,{error:r.ratioError});check('limited steady sine residual below -70 dB '+rate,r.residualDb<-70,{residualDb:r.residualDb});
   r=await render(rate,{amplitude:8,impulse:true});check('transient and exact anticipation '+rate,r.impulseIndex===100+Math.ceil(rate*.006)&&r.peak<=10**(-6/20)+1e-7,{frame:r.impulseIndex,peak:r.peak});
  }
  const effect=await render(48000,{amplitude:2}),master=await render(48000,{amplitude:2,master:true});
  let difference=0;for(let i=0;i<effect.a.length;i++)difference=Math.max(difference,Math.abs(effect.a[i]-master.a[i]));
  check('PEAK and VECTOR LIMIT use the same DSP',difference<1e-7,{difference});
  const r=await render(48000,{amplitude:2,automated:true});check('falling automated ceiling remains bounded',r.automatedPeak<=10**(-12/20)+1e-7,{peak:r.automatedPeak});
  // Decode the actual WAV written above and compare PCM with the master render.
  const decode=new AudioContext({sampleRate:48000}),decoded=await decode.decodeAudioData(Uint8Array.from(wav).buffer);let wavError=0;
  for(let i=0;i<decoded.length;i++)wavError=Math.max(wavError,Math.abs(decoded.getChannelData(0)[i]-master.a[i]));
  check('WAV retains rendered samples',wavError<1e-7,{wavError});await decode.close();
  // A quiet parallel dry lane must remain aligned with a limited lane at 44.1 kHz.
  const rate=44100,ctx=new OfflineAudioContext(2,rate,rate);await prepareStudioContext(ctx);
  const p=emptyProject();p.masterVolume=0;p.mastering=masteringSettings();
  const split=insertRackSplit(p.mastering,0),branch=p.mastering.splits[split].branches[0];
  placeRackModule(p.mastering,{splitId:split,branchId:branch.id,index:0},'vectorlimit',MASTER_MODULES);
  p.mastering.mix=.5;
  const engine=new AudioEngine(()=>p,()=>new Map()),graph=engine.buildGraph(ctx),source=ctx.createBufferSource(),buffer=ctx.createBuffer(2,rate,rate);
  for(let c=0;c<2;c++)for(let i=0;i<rate;i++)buffer.getChannelData(c)[i]=.1*Math.sin(i*.03);
  source.buffer=buffer;source.connect(graph.master);source.start();const aligned=await ctx.startRendering();let error=0;
  const delay=Math.ceil(rate*.006);for(let i=delay;i<rate;i++)error=Math.max(error,Math.abs(aligned.getChannelData(0)[i]-buffer.getChannelData(0)[i-delay]));
  check('parallel rack and dry-wet stay aligned at 44.1 kHz',error<2e-7,{error});
  for(const stage of graph.mastering.effects.values())stage.dispose();for(const split of graph.mastering.splitNodes.values())split.dispose();
  return {results,wav};
 });
 await writeFile(folder+'/limiter-dsp.json',JSON.stringify(result.results,null,2));await writeFile(folder+'/limited-tone.wav',Buffer.from(result.wav));
 console.log('PASS',result.results);
} finally {await browser.close();await new Promise(r=>server.close(r));}
