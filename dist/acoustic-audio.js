import {ACOUSTIC_BANKS,ACOUSTIC_INSTRUMENTS,sampleSettings,sampleZones} from './acoustic.js?v=0.13.0';
const banks=new Map(),pools=new WeakMap();let cachedBytes=0;const MAX_CACHE=256*1024*1024;
export async function loadAcousticBank(ctx,type,onProgress=()=>{}){
 const def=ACOUSTIC_BANKS[type];if(!def)throw Error('Banque inconnue.');const key=ctx.sampleRate+':'+type;
 if(banks.has(key)){const entry=banks.get(key);banks.delete(key);banks.set(key,entry);const value=await entry.promise;onProgress(def.samples.length,def.samples.length);return value;}
 const entry={bytes:0};entry.promise=(async()=>{const result=new Map();let next=0,done=0;onProgress(0,def.samples.length);
  await Promise.all(Array.from({length:Math.min(4,def.samples.length)},async()=>{while(next<def.samples.length){const zone=def.samples[next++],controller=new AbortController(),timeout=setTimeout(()=>controller.abort(),30000);try{const response=await fetch(new URL('./samples/'+zone.file,import.meta.url),{signal:controller.signal});if(!response.ok)throw Error('HTTP '+response.status);const data=await response.arrayBuffer(),buffer=await ctx.decodeAudioData(data);result.set(zone.file,buffer);entry.bytes+=buffer.length*buffer.numberOfChannels*4;onProgress(++done,def.samples.length);}finally{clearTimeout(timeout);}}}));
  cachedBytes+=entry.bytes;for(const [old,value] of banks){if(cachedBytes<=MAX_CACHE)break;if(old!==key&&value.ready){banks.delete(old);cachedBytes-=value.bytes;}}entry.ready=true;return result;
 })().catch(error=>{banks.delete(key);throw Error('Chargement de '+ACOUSTIC_INSTRUMENTS[type].name+' impossible. Réessaie avec une connexion disponible. '+error.message);});banks.set(key,entry);return entry.promise;
}
export function acousticVoice(ctx,out,type,midi,t,duration,params,velocity,bank,remember){
 if(!bank)throw Error('Les enregistrements de '+type+' ne sont pas chargés.');const p=sampleSettings(type,params),zones=sampleZones(type,midi,velocity,p),nodes=[],sources=[],node=method=>{const n=ctx[method]();nodes.push(n);return n;};
 t=Math.max(t,ctx.currentTime);duration=Math.max(.01,duration);const end=t+duration+p.release+.02,env=node('createGain'),filter=node('createBiquadFilter'),tone=node('createBiquadFilter');
 filter.type='lowpass';filter.Q.value=.45;filter.frequency.value=Math.min(ctx.sampleRate*.45,p.brightness*(1-p.dynamics*.5*(1-velocity)));tone.type='highshelf';tone.frequency.value=2600;tone.gain.value=p.tone;filter.connect(tone);tone.connect(env);env.connect(out);
 const gain=.23*10**(p.output/20)*Math.max(0,Math.min(1,velocity))**(.5+p.dynamics);env.gain.setValueAtTime(0,t);env.gain.linearRampToValueAtTime(gain,t+Math.min(p.attack,duration));env.gain.setValueAtTime(gain,t+duration);env.gain.exponentialRampToValueAtTime(Math.max(1e-6,gain*.0001),end);
 for(const zone of zones){const source=node('createBufferSource'),level=node('createGain');source.buffer=bank.get(zone.file);if(!source.buffer)throw Error('Échantillon manquant : '+zone.file);source.playbackRate.value=zone.rate;level.gain.value=zone.weight;source.connect(level);
  if(p.width<.999&&source.buffer.numberOfChannels===2){const split=ctx.createChannelSplitter(2),merge=ctx.createChannelMerger(2);nodes.push(split,merge);level.connect(split);for(let c=0;c<2;c++)for(let dest=0;dest<2;dest++){const g=node('createGain');g.gain.value=(1+(c===dest?1:-1)*p.width)/2;split.connect(g,c);g.connect(merge,0,dest);}merge.connect(filter);}else level.connect(filter);
  if(zone.loopStart!==undefined){source.loop=true;source.loopStart=zone.loopStart;source.loopEnd=zone.loopEnd;}source.start(t);source.stop(end);sources.push(source);remember?.(source);
 }
 let pool=pools.get(ctx);if(!pool)pools.set(ctx,pool=[]);const voice={start:t,end,stop(at){env.gain.cancelScheduledValues(Math.max(t,at-.008));env.gain.setTargetAtTime(.000001,Math.max(t,at-.008),.002);for(const source of sources)try{source.stop(at);}catch{}}};
 const active=pool.filter(v=>v.start<=t&&v.end>t);if(active.length>=48){active[0].stop(t+.008);active[0].end=t+.008;}pool.push(voice);
 let left=sources.length;for(const source of sources)source.addEventListener('ended',()=>{if(--left===0){for(const n of nodes)try{n.disconnect();}catch{}const i=pool.indexOf(voice);if(i>=0)pool.splice(i,1);}});return voice;
}
