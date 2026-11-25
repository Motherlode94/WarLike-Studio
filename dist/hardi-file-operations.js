// HARDI non-destructive PCM editing: original decoded buffer stays untouched.
// Works with mono/stereo and arbitrary sample rates; output remains finite and bounded.
const clamp=(x,a,b)=>Math.max(a,Math.min(b,x));
const read=buffer=>Array.from({length:buffer.numberOfChannels},(_,i)=>buffer.getChannelData(i).slice());
export function editHardiAudio(buffer,{start=0,end=buffer.duration,reverse=false,invert=false,removeDC=false,normalizeDb=null,fadeIn=0,fadeOut=0,rate=1}={}){
 if(!buffer||!Number.isFinite(buffer.sampleRate)||buffer.sampleRate<=0||!Number.isInteger(buffer.numberOfChannels)||buffer.numberOfChannels<1||buffer.numberOfChannels>8)throw Error('Fichier audio incompatible.');
 if(!Number.isFinite(start)||!Number.isFinite(end)||start<0||end<=start||end>buffer.duration+1/buffer.sampleRate)throw Error('Plage de découpe invalide.');
 if(!Number.isFinite(rate)||rate<.5||rate>2)throw Error('Vitesse de lecture hors limite (0,5 à 2).');
 if(!Number.isFinite(fadeIn)||!Number.isFinite(fadeOut)||fadeIn<0||fadeOut<0)throw Error('Fondus invalides.');
 if(normalizeDb!==null&&(!Number.isFinite(normalizeDb)||normalizeDb>0||normalizeDb< -24))throw Error('Normalisation hors limite.');
 const a=Math.floor(start*buffer.sampleRate),b=Math.min(buffer.length,Math.ceil(end*buffer.sampleRate)),frames=b-a;
 if(frames<2)throw Error('Sélection audio trop courte.');
 const channels=read(buffer).map(src=>src.subarray(a,b));
 const count=Math.max(2,Math.floor(frames/rate));if(count>buffer.sampleRate*60*60)throw Error('Audio trop long.');
 const output=channels.map(src=>{
  const data=new Float32Array(count);
  for(let i=0;i<count;i++){
   const t=Math.min(frames-1,i*rate),lo=Math.floor(t),hi=Math.min(frames-1,lo+1),p=t-lo;
   data[i]=src[lo]*(1-p)+src[hi]*p;
  }
  if(reverse)data.reverse();
  if(removeDC){let mean=0;for(const x of data)mean+=x;mean/=data.length;for(let i=0;i<data.length;i++)data[i]-=mean;}
  if(invert)for(let i=0;i<data.length;i++)data[i]=-data[i];
  return data;
 });
 let peak=0;for(const data of output)for(const v of data)peak=Math.max(peak,Math.abs(v));
 const gain=normalizeDb===null||peak<1e-9?1:10**(normalizeDb/20)/peak;
 const inFrames=fadeIn>0?Math.max(1,Math.ceil(fadeIn*buffer.sampleRate)):0,outFrames=fadeOut>0?Math.max(1,Math.ceil(fadeOut*buffer.sampleRate)):0;
 for(const data of output)for(let i=0;i<count;i++){
  const a=inFrames?clamp(i/Math.max(1,inFrames),0,1):1;
  const b=outFrames?clamp((count-1-i)/Math.max(1,outFrames),0,1):1;
  data[i]=clamp(data[i]*gain*Math.min(a,b),-1,1);
 }
 return {sampleRate:buffer.sampleRate,numberOfChannels:output.length,length:count,duration:count/buffer.sampleRate,getChannelData:i=>output[i].slice(),channels:output};
}
