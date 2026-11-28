// Real recorded acoustic kit (Pearl Master Studio Pack 1 by enoe).
// License: Creative Commons Attribution 3.0; attribution must be retained.
// https://oramics.github.io/sampled/DRUMS/pearl-master-studio/
// The audio files are fetched, decoded, and actually played using AudioBufferSourceNode.
// No fake claim that PULSE's original synthesized drums are acoustic recordings.
// The nine files used by Studio are bundled in samples/drums/pearl-master-studio/
// so demos play offline and do not depend on a third-party host. The original
// site stays as a fallback for an older deployment without the bundled files.
const LOCAL_BASE=new URL('./samples/drums/pearl-master-studio/',import.meta.url).href;
const BASE='https://oramics.github.io/sampled/DRUMS/pearl-master-studio/samples/';
export const DRUM_SAMPLE_SOURCES=Object.freeze([LOCAL_BASE,BASE]);
export const ACOUSTIC_DRUM_LICENSE=Object.freeze({
 artist:'enoe',title:'Pearl Master Studio Pack 1',license:'CC BY 3.0',
 url:'https://oramics.github.io/sampled/DRUMS/pearl-master-studio/',
 licenseUrl:'https://creativecommons.org/licenses/by/3.0/'
});
export const DRUM_KIT_NAMES=Object.freeze(['PULSE Synth','Studio Rock','Warm Pop','Rumba Acoustic','Baile · Synth Toms & Congas']);
export const DRUM_SAMPLE_FILES=Object.freeze({
 kick:['kick-01.wav'],clap:['snare-01.wav','snare-02.wav','snare-03.wav'],
 hat:['hihat-closed.wav'],open:['hihat-open.wav'],tom:['tom-01.wav','tom-02.wav','tom-03.wav'],
 rim:['snare-02.wav'],shaker:['hihat-closed.wav'],perc:['tom-02.wav']
});
const buffers=new Map(),decoders=new WeakMap();
export function drumKitName(value){return DRUM_KIT_NAMES[Math.round(value)]||DRUM_KIT_NAMES[0];}
export function requiredDrumFiles(){
 return [...new Set(Object.values(DRUM_SAMPLE_FILES).flat())];
}
export async function loadRecordedDrumKit(ctx,{fetcher=fetch,onProgress=()=>{}}={}){
 let decoded=decoders.get(ctx);
 if(decoded)return decoded;
 // Keep a promise per context to ensure concurrent calls do not fetch/decode twice.
 const task=(async()=>{
  const result={};
  const files=requiredDrumFiles();
  let done=0;
  for(const file of files){
   let promise=buffers.get(file);
   if(!promise){
    promise=(async()=>{
     let lastError=null;
     for(const base of DRUM_SAMPLE_SOURCES){
      try{
       const response=await fetcher(base+file);
       if(response?.ok)return response.arrayBuffer();
       lastError=Error('HTTP '+(response?.status??'inconnu')+' : '+file);
      }catch(error){lastError=error;}
     }
     throw lastError||Error('Fichier introuvable : '+file);
    })();
    buffers.set(file,promise);
   }
   try{
    // decodeAudioData may detach its input ArrayBuffer: always provide a copy.
    result[file]=await ctx.decodeAudioData((await promise).slice(0));
   }catch(error){
    buffers.delete(file);
    throw Error('Batterie acoustique indisponible ('+file+'). Vérifie le réseau et les droits CORS. '+(error?.message||error));
   }
   onProgress(++done,files.length);
  }
  return result;
 })();
 decoders.set(ctx,task);
 try{return await task;}catch(error){decoders.delete(ctx);throw error;}
}
const clamp=(v,a,b)=>Math.max(a,Math.min(b,v));
export function playRecordedDrum(ctx,out,voice,t,params={},velocity=1,decoded,scope,remember){
 if(!decoded||!DRUM_SAMPLE_FILES[voice])return false;
 const options=DRUM_SAMPLE_FILES[voice];
 const choice=voice==='clap'?Math.min(options.length-1,Math.floor(clamp(velocity,0,1)*options.length)):
  voice==='tom'?Math.floor((t*7)%options.length):0;
 const buffer=decoded[options[choice]];
 if(!buffer)throw Error('Sample de batterie absent : '+voice);
 const kit=Math.round(params.kit||0);
 const soft=kit===2,rumba=kit===3;
 const v=clamp(velocity,0,1);
 if(v===0)return true;
 const source=scope.node('createBufferSource'),gain=scope.node('createGain'),tone=scope.node('createBiquadFilter');
 source.buffer=buffer;
 const variation=1+(.015*Math.sin(t*34.9+v*7.1));
 source.playbackRate.value=clamp(variation*(rumba?.97:1),.8,1.2);
 tone.type='lowpass';
 tone.frequency.value=kit===1?16500:soft?10500:7900;
 tone.Q.value=.6;
 // Velocity changes the *envelope and brightness*, not only the output gain.
 const level=Math.pow(v,soft?.85:1.08)*(rumba?.66:soft?.8:.93);
 gain.gain.setValueAtTime(.0001,t);
 gain.gain.linearRampToValueAtTime(Math.max(.0001,level),t+.0025);
 const duration=Math.min(buffer.duration,voice==='open'?.85:voice==='kick'?.7:voice==='tom'?.6:.5);
 gain.gain.setValueAtTime(Math.max(.0001,level),t+Math.max(.004,duration-.024));
 gain.gain.exponentialRampToValueAtTime(.0001,t+duration);
 source.connect(tone);tone.connect(gain);gain.connect(out);
 scope.watch(source);remember?.(source);
 source.start(t);source.stop(t+duration+.012);
 return true;
}
