// Stereo BS.1770 K-weighting at 48 kHz; 400 ms windows and two-stage gating.
// Peak interpolation is an estimate, not a certified true-peak measurement.
const loudness=e=>e>0?-.691+10*Math.log10(e):-Infinity,energy=l=>10**((l+.691)/10);
export function measureLoudness(channels,rate=48000){
  if(rate!==48000)throw Error('L’analyse doit être calculée à 48 kHz.');const n=channels[0]?.length||0,hop=4800,blocks=[],states=channels.map(()=>({x1:0,x2:0,y1:0,y2:0,u1:0,u2:0,v1:0,v2:0}));let sum=0,count=0,peak=0,interpolatedPeak=0;
  for(let i=0;i<n;i++){let power=0;for(let c=0;c<channels.length;c++){const x=channels[c][i]||0,s=states[c];peak=Math.max(peak,Math.abs(x));
      const y=1.53512485958697*x-2.69169618940638*s.x1+1.19839281085285*s.x2+1.69065929318241*s.y1-.73248077421585*s.y2;s.x2=s.x1;s.x1=x;s.y2=s.y1;s.y1=y;
      const z=y-2*s.u1+s.u2+1.99004745483398*s.v1-.99007225036621*s.v2;s.u2=s.u1;s.u1=y;s.v2=s.v1;s.v1=z;power+=z*z;
      if(i>0&&i<n-2){const a=channels[c][i-1],b=x,d=channels[c][i+1],e=channels[c][i+2];for(const t of [.25,.5,.75]){const v=.5*((2*b)+(-a+d)*t+(2*a-5*b+4*d-e)*t*t+(-a+3*b-3*d+e)*t*t*t);interpolatedPeak=Math.max(interpolatedPeak,Math.abs(v));}}
    }sum+=power;count++;if(count===hop){blocks.push(sum/count);sum=0;count=0;}}
  const windows=[];let shortMax=-Infinity;for(let i=3;i<blocks.length;i++)windows.push((blocks[i]+blocks[i-1]+blocks[i-2]+blocks[i-3])/4);for(let i=29;i<blocks.length;i++){let e=0;for(let j=0;j<30;j++)e+=blocks[i-j];shortMax=Math.max(shortMax,loudness(e/30));}
  const absolute=windows.filter(e=>loudness(e)>=-70),mean=values=>values.length?values.reduce((a,b)=>a+b,0)/values.length:0,relative=loudness(mean(absolute))-10,gated=absolute.filter(e=>loudness(e)>=relative),integrated=loudness(mean(gated));
  return {integrated,shortMax,samplePeak:peak>0?20*Math.log10(peak):-Infinity,estimatedPeak:Math.max(peak,interpolatedPeak)>0?20*Math.log10(Math.max(peak,interpolatedPeak)):-Infinity,duration:n/rate,windows:windows.length};
}
