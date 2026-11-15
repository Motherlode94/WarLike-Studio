// Original offline vocal-like synthesis: not speech, human performance or voice cloning.
// Each style has independently composed rhythm, pitch contour, vowel movement and tone.
import {encodeWav} from './wav.js?v=0.14.0';
const id=()=>Math.random().toString(36).slice(2,12);
const VOICES={
 'vox-trap':{
  root:146.83,phrases:[[0,.36,0],[.48,.22,0],[.75,.26,3],[1.45,.24,-2],[1.76,.23,0],[2.12,.38,5],[2.62,.19,3],[3.12,.36,0]],
  vowels:[[500,1300,2500],[680,1120,2450],[390,1750,2600]],brightness:1.7,vibrato:.0015,glide:.008,breath:.02,
  attack:.008,release:.045,period:4
 },
 'vox-afro':{
  root:220,phrases:[[0,.63,0],[.8,.42,4],[1.3,.55,7],[2.02,.36,5],[2.5,.48,4],[3.18,.61,2]],
  vowels:[[680,1250,2500],[380,1700,2450],[610,1100,2300],[420,1900,2600]],brightness:1.0,vibrato:.006,glide:.018,breath:.025,
  attack:.035,release:.10,period:4
 },
 'vox-rnb':{
  root:174.61,phrases:[[0,1.23,0],[1.3,.88,3],[2.25,.67,7],[3.02,.85,5]],
  vowels:[[420,1700,2450],[500,1150,2350],[330,950,2250]],brightness:.55,vibrato:.012,glide:.12,breath:.012,
  attack:.105,release:.22,period:4
 }
};
export const VOCAL_GUIDE_IDENTITIES=Object.freeze(Object.fromEntries(
 Object.entries(VOICES).map(([name,v])=>[name,{root:v.root,phrases:v.phrases.map(p=>[...p]),brightness:v.brightness}])
));
export function synthVocalGuide({duration=6,sampleRate=22050,voice=0,bpm=100,style='vox-trap'}={}){
 if(!Number.isFinite(duration)||duration<=0||duration>12)throw Error('Durée guide vocale invalide.');
 if(!Number.isFinite(sampleRate)||sampleRate<16000||sampleRate>48000)throw Error('Fréquence audio guide invalide.');
 if(!Number.isFinite(bpm)||bpm<50||bpm>220)throw Error('Tempo guide invalide.');
 const def=VOICES[style];
 if(!def)throw Error('Style vocal inconnu.');
 const length=Math.floor(duration*sampleRate),data=new Float32Array(length);
 const beat=60/bpm,period=def.period*beat,role=voice%3;
 let phase=0,previousEvent=-1;
 for(let i=0;i<length;i++){
  const t=i/sampleRate,loop=t%period,cycle=Math.floor(t/period);
  // Melody accents and slight offsets distinguish lead, backs and adlibs.
  const shift=role===1?-.08:role===2?.16:0;
  const localBeat=loop/beat;
  let event=null,eventIndex=-1;
  for(let n=0;n<def.phrases.length;n++){
   const candidate=def.phrases[n];
   const begin=Math.max(0,candidate[0]+shift),end=begin+candidate[1]*(role===2?.72:1);
   if(localBeat>=begin&&localBeat<end){event=candidate;eventIndex=n;break;}
  }
  if(!event){phase+=2*Math.PI*def.root/sampleRate;continue;}
  const eventBegin=Math.max(0,event[0]+shift)*beat;
  const local=t-(cycle*period+eventBegin);
  const noteLength=event[1]*beat*(role===2?.72:1);
  const gate=Math.min(1,local/def.attack)*Math.min(1,(noteLength-local)/def.release);
  if(gate<=0)continue;
  const semitone=event[2]+(role===1?-5:role===2?7:0);
  const approach=def.glide*Math.exp(-local/.12)*(eventIndex%2?1:-1);
  const note=def.root*Math.pow(2,(semitone+approach)/12);
  const pitch=note*(1+def.vibrato*Math.sin(t*2*Math.PI*(style==='vox-rnb'?5.2:6)));
  phase+=2*Math.PI*pitch/sampleRate;
  const vowel=def.vowels[(eventIndex+Math.floor(cycle)+role)%def.vowels.length];
  const harmonicCount=Math.min(36,Math.floor(6800/pitch));
  let sum=0;
  for(let h=1;h<=harmonicCount;h++){
   const frequency=pitch*h;
   const spectral=vowel.reduce((acc,center,k)=>acc+[1,.8,.55][k]*Math.exp(-.5*((frequency-center)/[170,220,310][k])**2),0);
   const presence=.17/(h**(style==='vox-trap'?.75:1.2));
   sum+=Math.sin(phase*h)*(spectral+presence)*def.brightness/h;
  }
  const breath=def.breath*Math.sin(phase*11.21)*Math.sin(phase*.63);
  const fade=Math.min(1,t/.05,(duration-t)/.09);
  const strength=role===0?.87:role===1?.54:.65;
  data[i]=Math.max(-.8,Math.min(.8,(sum+breath)*strength*Math.max(0,gate)*Math.max(0,fade)));
 }
 return {length,numberOfChannels:1,sampleRate,getChannelData:c=>c===0?data:undefined};
}
export function createVocalDemoMedia(project,{sampleRate=22050}={}){
 if(!project?.vocalDemo)return [];
 const vocals=project.tracks.filter(t=>t.type==='audio');
 if(vocals.length!==3)throw Error('Mix vocal incomplet.');
 const secondsPerBar=240/project.bpm,available=4*secondsPerBar-.25;
 const duration=Math.min(7,available);
 const media=[];
 vocals.forEach((track,index)=>{
  const buffer=synthVocalGuide({duration,sampleRate,voice:index,bpm:project.bpm,style:project.vocalDemoKind});
  const data=encodeWav(buffer,{bits:16});
  const audioId=id(),name='WarLike_'+project.vocalDemoKind+'_VocalGuide_'+(index+1)+'.wav';
  const addClip=(start,length,label,gainDb=0)=>{
    track.clips.push({id:id(),name:'GUIDE VOCAL SYNTHÉTIQUE · '+label,start,length,audioId,gainDb});
  };
  const fullLength=duration/secondsPerBar;
  if(index===0){
    addClip(4,fullLength,'LEAD · COUPLET A',3);
    addClip(8,fullLength,'LEAD · COUPLET B',3);
    addClip(12,fullLength,'LEAD · REFRAIN',3);
  }else if(index===1){
    addClip(4,fullLength,'HARMONIE · COUPLET A',1);
    addClip(8,fullLength,'HARMONIE · COUPLET B',1);
    addClip(12,fullLength,'HARMONIE · REFRAIN',1);
  }else{
    const shortLength=Math.min(fullLength,.72);
    for(const bar of [3,7,11,15])addClip(bar,shortLength,'ADLIB · RÉPONSE',2);
    addClip(12,Math.min(fullLength,1.2),'ADLIB · REFRAIN',2);
  }
  media.push({id:audioId,name,data});
 });
 project.vocalDemoInfo.hasSyntheticGuides=true;
 project.vocalDemoInfo.sonicIdentity=project.vocalDemoKind;
 return media;
}
