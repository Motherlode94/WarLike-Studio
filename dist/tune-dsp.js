// Original CHAYAH TUNE prototype: YIN analysis + pitch-synchronous overlap-add.
// Algorithm references: de Cheveigné & Kawahara (2002), doi:10.1121/1.1458024;
// DAFX, Time-segment processing: https://www.dafx.de/DAFX_Book_Page_2nd_edition/chapter6.html
// Designed for isolated monophonic voices, not polyphonic mixes.
export const SCALES={minor:[0,2,3,5,7,8,10],major:[0,2,4,5,7,9,11],chromatic:[0,1,2,3,4,5,6,7,8,9,10,11]};
export function targetNote(midi,key=9,scale='minor'){
  const allowed=SCALES[scale]||SCALES.minor;let result=Math.round(midi),distance=Infinity;
  for(let n=Math.floor(midi)-3;n<=Math.ceil(midi)+3;n++){if(!allowed.includes(((n-key)%12+12)%12))continue;const d=Math.abs(n-midi);if(d<distance){distance=d;result=n;}}
  return result;
}
export function detectPitch(frame,sampleRate){
  const count=frame.length,half=Math.floor(count/2),maxLag=Math.min(half-1,Math.ceil(sampleRate/65)),minLag=Math.max(2,Math.floor(sampleRate/1000));
  let energy=0;for(let i=0;i<count;i++)energy+=frame[i]*frame[i];if(Math.sqrt(energy/count)<.006)return null;
  const d=new Float64Array(maxLag+1);d[0]=1;let running=0;
  for(let tau=1;tau<=maxLag;tau++){let sum=0;for(let j=0;j<half;j++){const diff=frame[j]-frame[j+tau];sum+=diff*diff;}running+=sum;d[tau]=running?sum*tau/running:1;}
  let lag=0;for(let tau=minLag;tau<maxLag;tau++){if(d[tau]<.14){while(tau+1<maxLag&&d[tau+1]<d[tau])tau++;lag=tau;break;}}
  if(!lag)return null;
  const left=d[lag-1],center=d[lag],right=d[lag+1]??center,den=left-2*center+right,refined=lag+(Math.abs(den)>.00001?.5*(left-right)/den:0),frequency=sampleRate/refined;
  return frequency>=65&&frequency<=1000?{frequency,confidence:1-center}:null;
}

export function tuneAudio(channels,sampleRate,options={},progress=()=>{}){
  const length=channels[0].length,hop=1024,frameSize=2048,downsample=4,smallSize=frameSize/downsample;
  const mono=new Float32Array(length);for(const c of channels)for(let i=0;i<length;i++)mono[i]+=c[i]/channels.length;
  // Analysis uses a bounded boost for quiet takes. Synthesis keeps the original
  // samples, so the DAW's non-destructive clip gain remains the only output gain.
  let analysisPeak=0;for(const value of mono)analysisPeak=Math.max(analysisPeak,Math.abs(value));
  if(analysisPeak>Math.pow(10,-65/20)&&analysisPeak<.25){const gain=Math.min(Math.pow(10,30/20),.25/analysisPeak);for(let i=0;i<mono.length;i++)mono[i]*=gain;}
  const frames=[],frame=new Float32Array(smallSize),amount=Math.max(0,Math.min(1,options.amount??1));
  let smooth=0;const alpha=1-Math.exp(-hop/sampleRate/Math.max(.0001,(options.speed??35)/1000));
  for(let center=0;center<length;center+=hop){
    for(let j=0;j<smallSize;j++){const start=center-frameSize/2+j*downsample;let sum=0;for(let k=0;k<downsample;k++)sum+=mono[start+k]||0;frame[j]=sum/downsample;}
    const pitch=detectPitch(frame,sampleRate/downsample);
    if(pitch){const midi=69+12*Math.log2(pitch.frequency/440),target=targetNote(midi,options.key??9,options.scale??'minor'),delta=(target-midi)*amount;smooth+=alpha*(delta-smooth);frames.push({sample:center,f0:pitch.frequency,midi,target,corrected:midi+smooth,ratio:Math.pow(2,smooth/12)});}
    else{smooth*=.7;frames.push({sample:center,f0:0,midi:0,target:0,corrected:0,ratio:1});}
    if(center%(hop*20)===0)progress(Math.round(center/length*45));
  }
  const wet=channels.map(()=>new Float32Array(length)),weights=new Float32Array(length);
  const getFrame=sample=>frames[Math.max(0,Math.min(frames.length-1,Math.round(sample/hop)))];
  let index=0,voiced=0;
  while(index<frames.length){
    while(index<frames.length&&!frames[index].f0)index++;
    const first=index;while(index<frames.length&&frames[index].f0)index++;const last=index-1;
    if(last-first<2)continue;
    const start=Math.max(0,frames[first].sample-hop/2),end=Math.min(length,frames[last].sample+hop/2),marks=[];
    let cursor=start+sampleRate/frames[first].f0;
    // Locate positive waveform peaks around predicted pitch periods.
    while(cursor<end){const f=getFrame(cursor);if(!f.f0)break;const period=sampleRate/f.f0,radius=period*.27;let peak=Math.round(cursor),value=-Infinity;
      for(let j=Math.max(Math.floor(cursor-radius),Math.ceil(start));j<=Math.min(length-1,Math.ceil(cursor+radius));j++){if(mono[j]>value){value=mono[j];peak=j;}}
      if(marks.length&&peak<=marks.at(-1)+period*.45)peak=Math.round(cursor);
      marks.push(peak);cursor=peak+period;
    }
    if(marks.length<3)continue;
    let output=marks[0],sourceIndex=0;
    while(output<end){
      while(sourceIndex+1<marks.length&&Math.abs(marks[sourceIndex+1]-output)<Math.abs(marks[sourceIndex]-output))sourceIndex++;
      const source=marks[sourceIndex],f=getFrame(source);if(!f.f0)break;
      const period=Math.max(12,Math.min(1200,sampleRate/f.f0)),half=Math.ceil(period),outCenter=Math.round(output);
      for(let k=-half;k<=half;k++){const at=outCenter+k,from=source+k;if(at<0||at>=length||from<0||from>=length)continue;const w=.5+.5*Math.cos(Math.PI*k/half);weights[at]+=w;for(let c=0;c<channels.length;c++)wet[c][at]+=channels[c][from]*w;}
      output+=sampleRate/(f.f0*f.ratio);voiced++;
    }
    progress(45+Math.round(index/frames.length*45));
  }
  const mix=Math.max(0,Math.min(1,options.mix??1));
  const output=channels.map((input,c)=>{const out=new Float32Array(length);let envelope=0;const smoothing=1-Math.exp(-1/(sampleRate*.006));for(let i=0;i<length;i++){const f=getFrame(i),voicedHere=f.f0&&weights[i]>.08?1:0;envelope+=smoothing*(voicedHere-envelope);const corrected=weights[i]>.001?wet[c][i]/weights[i]:input[i];out[i]=input[i]+(corrected-input[i])*mix*envelope;}return out;});
  const rows=frames.filter((_,i)=>i%3===0).map(f=>({time:f.sample/sampleRate,input:f.midi,output:f.corrected,target:f.target}));
  const good=frames.filter(f=>f.f0),before=good.length?good.reduce((s,f)=>s+Math.abs(f.target-f.midi)*100,0)/good.length:0,after=good.length?good.reduce((s,f)=>s+Math.abs(f.target-f.corrected)*100,0)/good.length:0;
  progress(100);return {channels:output,report:{frames:rows,voicedFrames:good.length,totalFrames:frames.length,before,after,duration:length/sampleRate,grainCount:voiced}};
}
