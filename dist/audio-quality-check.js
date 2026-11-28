import {prepareStudioContext} from './studio-pack-audio.js?v=0.14.0';
import {createPackProcessors,syncPackProcessors} from './pack-audio.js?v=0.14.0';
import {pluginDefaults} from './plugins.js?v=0.14.0';

const output=document.querySelector('#results');
const button=document.querySelector('#run');
const sampleRate=48000,seconds=0.5;
function row(name,ok,detail){
 const tr=document.createElement('tr');
 for(const value of [ok?'PASS':'FAIL',name,detail]){const td=document.createElement('td');td.textContent=value;tr.append(td);}
 tr.className=ok?'pass':'fail';output.append(tr);
 return ok;
}
function rms(data,start=0){let sum=0,n=0;for(let i=Math.floor(start*sampleRate);i<data.length;i++){sum+=data[i]**2;n++;}return Math.sqrt(sum/Math.max(1,n));}
async function render({id,frequency=1000,amplitude=.1,values={},enabled=true}){
 const ctx=new OfflineAudioContext(1,Math.round(seconds*sampleRate),sampleRate);
 await prepareStudioContext(ctx);
 const source=ctx.createBufferSource(),buffer=ctx.createBuffer(1,ctx.length,sampleRate),data=buffer.getChannelData(0);
 for(let i=0;i<data.length;i++)data[i]=amplitude*Math.sin(2*Math.PI*frequency*i/sampleRate);
 source.buffer=buffer;
 const graph=createPackProcessors(ctx,source,source,{detached:true,types:[id]});
 const module=graph.modules[id];
 if(!module)throw Error('Module absent: '+id);
 source.connect(module.input);module.output.connect(ctx.destination);
 const effects=pluginDefaults('keys').effects;
 effects[id]={...effects[id],...values,enabled};
syncPackProcessors(
  {modules: graph.modules, inputChannels: 1},
  effects,
  120,
  0,
  true
);
try {
  source.start(0);
  const rendered = await ctx.startRendering();
  return rms(rendered.getChannelData(0), .15);
} finally {
  graph.dispose();
}
}
async function run(){
 button.disabled=true;output.replaceChildren();let pass=0,total=0;
 const check=async(name,fn)=>{total++;try{const detail=await fn();pass+=Number(row(name,true,detail));}catch(error){row(name,false,error.message);}};
 await check('TILT EQ: low and high shelves respond differently',async()=>{
  const low=await render({id:'tilteq',frequency:150,values:{tilt:6,pivot:1000,mix:1}});
  const high=await render({id:'tilteq',frequency:8000,values:{tilt:6,pivot:1000,mix:1}});
  if(!(high>low*1.8))throw Error('Insufficient spectral tilt: '+(high/low).toFixed(2));
  return 'High / low RMS = '+(high/low).toFixed(2);
 });
 await check('TILT EQ: output trim -6 dB',async()=>{
  const normal=await render({id:'tilteq',frequency:8000,values:{tilt:4,mix:1,output:0}});
  const trimmed=await render({id:'tilteq',frequency:8000,values:{tilt:4,mix:1,output:-6}});
  const ratio=trimmed/normal;if(Math.abs(ratio-10**(-6/20))>.06)throw Error('Trim ratio '+ratio.toFixed(3));
  return 'Trim ratio = '+ratio.toFixed(3);
 });
 await check('TILT EQ: bypass preserves dry signal',async()=>{
  const bypass=await render({id:'tilteq',frequency:1000,enabled:false,values:{tilt:12,mix:1}});
  const reference=.1/Math.sqrt(2);
  if(Math.abs(bypass/reference-1)>.02)throw Error('Bypass ratio '+(bypass/reference).toFixed(3));
  return 'Bypass / source = '+(bypass/reference).toFixed(3);
 });
 await check('VECTOR EQ: 1 kHz gain boosts actual rendered audio',async()=>{
  const neutral=await render({id:'vectoreq',frequency:1000,values:{f2:1000,g2:0,q2:2}});
  const boosted=await render({id:'vectoreq',frequency:1000,values:{f2:1000,g2:6,q2:2}});
  const ratio=boosted/neutral;if(ratio<1.65)throw Error('Gain ratio '+ratio.toFixed(3));
  return 'Boost ratio = '+ratio.toFixed(3);
 });
 await check('VECTOR COMP: higher ratio reduces sustained loud signal',async()=>{
  const base={threshold:-30,attack:1,release:80,knee:0,mix:1,output:0};
  const soft=await render({id:'vectorcomp',amplitude:.7,values:{...base,ratio:1}});
  const hard=await render({id:'vectorcomp',amplitude:.7,values:{...base,ratio:12}});
  const ratio=hard/soft;if(!(ratio<.7))throw Error('Compression not measurable: '+ratio.toFixed(3));
  return 'Compressed / uncompressed RMS = '+ratio.toFixed(3);
 });
 await check('VECTOR COMP: parallel mix=0 preserves the original',async()=>{
  const dry=await render({id:'vectorcomp',amplitude:.2,values:{threshold:-40,ratio:12,attack:1,release:100,knee:0,mix:0,output:0}});
  const ratio=dry/(.2/Math.sqrt(2));if(Math.abs(ratio-1)>.035)throw Error('Dry ratio '+ratio.toFixed(3));
  return 'Dry / source RMS = '+ratio.toFixed(3);
 });
 await check('VECTOR LIMIT: lower ceiling reduces loud-signal level',async()=>{
  const loud=await render({id:'vectorlimit',amplitude:.8,values:{drive:0,ceiling:-.1,release:100}});
  const limited=await render({id:'vectorlimit',amplitude:.8,values:{drive:0,ceiling:-9,release:100}});
  const ratio=limited/loud;if(!(ratio<.8))throw Error('Ceiling ineffective: '+ratio.toFixed(3));
  return 'Lower / higher ceiling RMS = '+ratio.toFixed(3);
 });
 document.querySelector('#summary').textContent=pass+'/'+total+' tests audio réussis. Rendu OfflineAudioContext, '+sampleRate+' Hz.';
 button.disabled=false;
}
button.addEventListener('click',()=>run().catch(error=>{document.querySelector('#summary').textContent=error.message;button.disabled=false;}));
