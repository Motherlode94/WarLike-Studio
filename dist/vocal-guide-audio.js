// Original, locally generated vowel-like guide audio for vocal FX demos.
// Not a human singer, spoken words, sampled music or an AI voice clone.
// Keeps demo audio < ~1 MB per session; no downloads or external assets.
import {encodeWav} from './wav.js?v=0.14.0';
const id=()=>Math.random().toString(36).slice(2,12);
const FORMANTS=[
  [660,1150,2500], // ah
  [400,1700,2550], // eh
  [310,900,2300]   // oo
];
export function synthVocalGuide({duration=6,sampleRate=22050,voice=0,bpm=100}={}){
  if(!Number.isFinite(duration)||duration<=0||duration>12)throw Error('Durée guide vocale invalide.');
  if(!Number.isFinite(sampleRate)||sampleRate<16000||sampleRate>48000)throw Error('Fréquence audio guide invalide.');
  const length=Math.floor(duration*sampleRate),data=new Float32Array(length),formants=FORMANTS[voice%FORMANTS.length];
  const beat=60/bpm;
  const notes=[0,3,5,7,5,3,0,-2],base=[196,164.81,130.81][voice%3];
  let phase=0;
  for(let i=0;i<length;i++){
    const t=i/sampleRate,step=Math.floor(t/beat*2),note=notes[step%notes.length],p=step*beat/2;
    const local=t-p,vowelGate=Math.min(1,local/.045)*Math.min(1,Math.max(0,(beat/2-local)/.075));
    const pitch=base*Math.pow(2,note/12)*(1+.006*Math.sin(t*5.4*2*Math.PI));
    phase+=2*Math.PI*pitch/sampleRate;
    const harmonicCount=Math.min(40,Math.floor(8000/pitch));
    let sample=0;
    for(let h=1;h<=harmonicCount;h++){
      const freq=pitch*h;
      const spectrum=formants.reduce((sum,center,index)=>sum+Math.exp(-.5*Math.pow((freq-center)/([130,180,300][index]),2))*([1,.75,.5][index]),0);
      sample+=Math.sin(phase*h)*spectrum/h;
    }
    const fade=Math.min(1,t/.07,(duration-t)/.08);
    data[i]=Math.max(-.78,Math.min(.78,sample*.72*vowelGate*Math.max(0,fade)));
  }
  return {length,numberOfChannels:1,sampleRate,getChannelData:c=>c===0?data:undefined};
}
export function createVocalDemoMedia(project,{sampleRate=22050}={}){
  if(!project?.vocalDemo) return [];
  const vocals=project.tracks.filter(t=>t.type==='audio');
  if(vocals.length!==3)throw Error('Mix vocal incomplet.');
  const secondsPerBar=240/project.bpm,available=4*secondsPerBar-.25;
  const duration=Math.min(7,available);
  const media=[];
  vocals.forEach((track,index)=>{
    const buffer=synthVocalGuide({duration,sampleRate,voice:index,bpm:project.bpm});
    const data=encodeWav(buffer,{bits:16});
    const audioId=id();
    const name='WarLike_VocalGuide_'+(index+1)+'.wav';
    track.clips.push({id:id(),name:'GUIDE SYNTHÉTIQUE · '+track.name,start:12,length:duration/secondsPerBar,audioId});
    media.push({id:audioId,name,data});
  });
  project.vocalDemoInfo.hasSyntheticGuides=true;
  return media;
}
