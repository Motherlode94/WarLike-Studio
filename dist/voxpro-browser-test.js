import {createPackProcessors,syncPackProcessors} from './pack-audio.js?v=0.14.0';
import {pluginDefaults} from './plugins.js?v=0.14.0';

const RATE=48000,DURATION=.6,START=.15;
const ids=['voxmicmodel','voxwarm','voxdoubler'];
const sine=(t,f)=>Math.sin(2*Math.PI*f*t);
function sourceData(kind,n){
 const a=new Float32Array(n);
 for(let i=0;i<n;i++){const t=i/RATE;
  a[i]=kind==='warm'?.16*sine(t,1000):kind==='mic'?.12*sine(t,160)+.09*sine(t,3200):.11*sine(t,220)+.08*sine(t,440)+.05*sine(t,700);
 }return a;
}
function stats(a){
 let energy=0,peak=0,finite=true;
 for(let i=Math.floor(START*RATE);i<a.length;i++){const x=a[i];finite&&=Number.isFinite(x);energy+=x*x;peak=Math.max(peak,Math.abs(x));}
 return {rms:Math.sqrt(energy/Math.max(1,a.length-Math.floor(START*RATE))),peak,finite};
}
function mse(a,b){let sum=0,n=0;for(let i=Math.floor(START*RATE);i<a.length;i++){const e=a[i]-b[i];sum+=e*e;n++;}return sum/n;}
async function render(id,{enabled,values={},kind,channels=1}){
 const ctx=new OfflineAudioContext(channels,Math.round(DURATION*RATE),RATE);
 const buffer=ctx.createBuffer(1,ctx.length,RATE);
 const input=sourceData(kind,ctx.length);buffer.copyToChannel(input,0);
 const source=ctx.createBufferSource();source.buffer=buffer;
 const graph=createPackProcessors(ctx,source,source,{detached:true,types:[id]});
 const m=graph.modules[id];if(!m)throw Error('No DSP node for '+id);
 source.connect(m.input);m.output.connect(ctx.destination);
 const states=pluginDefaults('keys').effects;
 states[id]={...states[id],...values,enabled};
 try{
  syncPackProcessors({modules:graph.modules,inputChannels:1},states,120,0,true);
  source.start(0);
  const data=await ctx.startRendering();
  return {input,output:Array.from({length:channels},(_,i)=>data.getChannelData(i).slice())};
 }finally{graph.dispose();source.disconnect();}
}
function check(ok,msg){if(!ok)throw Error(msg);}
const expected=(r)=>check(r.finite&&r.rms>.001&&r.peak<10,'invalid, silent or >10 sample');
async function validate(){
 const results=[];
 async function trial(name,fn){try{const detail=await fn();results.push({name,ok:true,detail});}catch(e){results.push({name,ok:false,detail:e.message});}}
 for(const [id,kind,values] of [
  ['voxmicmodel','mic',{source:0,target:1,proximity:5,presence:5,air:5,mix:1}],
  ['voxwarm','warm',{drive:15,bias:.2,mix:1,output:-2}],
  ['voxdoubler','double',{voices:2,detune:12,delay:22,width:.85,mix:.4}]
 ]){
  await trial(id+' / bypass null',async()=>{
   const off=await render(id,{enabled:false,values,kind});
   const d=mse(off.output[0],off.input);expected(stats(off.output[0]));check(d<1e-8,'bypass MSE='+d);
   return 'MSE '+d.toExponential(2);
  });
  await trial(id+' / effect audible and finite',async()=>{
   const active=await render(id,{enabled:true,values,kind});
   expected(stats(active.output[0]));
   const d=mse(active.output[0],active.input);check(d>1e-7,'no audible signal difference (MSE='+d+')');
   return 'MSE '+d.toExponential(2)+' RMS '+stats(active.output[0]).rms.toFixed(4);
  });
 }
 await trial('VOX MIC COLOR / controls change filtered energy',async()=>{
  const dry=await render('voxmicmodel',{enabled:true,kind:'mic',values:{source:0,target:0,proximity:0,presence:0,air:0,mix:1}});
  const boosted=await render('voxmicmodel',{enabled:true,kind:'mic',values:{source:0,target:0,proximity:8,presence:7,air:6,mix:1}});
  const d=mse(dry.output[0],boosted.output[0]);check(d>1e-6,'tone controls ineffective');return 'Parameter MSE '+d.toExponential(2);
 });
 await trial('VOX WARM / increased drive changes waveform',async()=>{
  const soft=await render('voxwarm',{enabled:true,kind:'warm',values:{mix:1,drive:0,bias:0,output:0}});
  const hot=await render('voxwarm',{enabled:true,kind:'warm',values:{mix:1,drive:18,bias:0,output:0}});
  const d=mse(soft.output[0],hot.output[0]);check(d>1e-6,'drive control ineffective');return 'Drive MSE '+d.toExponential(2);
 });
 await trial('VOX DOUBLER / stereo to mono fold-down',async()=>{
  const wet=await render('voxdoubler',{enabled:true,kind:'double',channels:2,values:{mix:.45,delay:23,detune:13,width:1,voices:2}});
  const L=wet.output[0],R=wet.output[1],mono=Float32Array.from(L,(v,i)=>(v+R[i])*.5);
  const left=stats(L),right=stats(R),fold=stats(mono);
  [left,right,fold].forEach(expected);
  const ratio=fold.rms/((left.rms+right.rms)/2);
  check(ratio>=.707,'mono fold-down cancellation '+(20*Math.log10(ratio)).toFixed(2)+' dB');
  return 'fold down '+(20*Math.log10(ratio)).toFixed(2)+' dB';
 });
 return results;
}
const run=document.getElementById('run'),body=document.getElementById('results'),summary=document.getElementById('summary');
run.onclick=async()=>{
 run.disabled=true;body.replaceChildren();summary.textContent='Rendering…';
 try{const results=await validate();
  for(const r of results){const tr=document.createElement('tr');tr.className=r.ok?'pass':'fail';for(const item of [r.ok?'PASS':'FAIL',r.name,r.detail]){const td=document.createElement('td');td.textContent=item;tr.append(td);}body.append(tr);}
  const passed=results.filter(r=>r.ok).length;summary.textContent=passed+'/'+results.length+' passed · Chromium OfflineAudioContext · 48 kHz';
  document.documentElement.dataset.status=passed===results.length?'pass':'fail';
 }catch(error){summary.textContent='Harness failed: '+error.message;document.documentElement.dataset.status='fail';}
 finally{run.disabled=false;}
};
if(new URLSearchParams(location.search).has('autorun'))run.click();
