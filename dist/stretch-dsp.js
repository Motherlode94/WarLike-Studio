// WSOLA: time scale audio while keeping its pitch. One shared alignment for stereo.
export function stretchAudio(channels,sampleRate,ratio,onProgress=()=>{}){
  if(!Number.isFinite(ratio)||ratio<.5||ratio>2)throw Error('Étirement compris entre 50 % et 200 %.');const n=channels[0]?.length||0;if(!n||n/sampleRate>300)throw Error('Sélectionne un clip de moins de cinq minutes.');if(Math.abs(ratio-1)<1e-8)return channels.map(c=>c.slice());
  const outLength=Math.max(1,Math.round(n*ratio)),window=Math.min(n,Math.round(sampleRate*.04)),hop=Math.max(1,Math.floor(window/4)),search=Math.round(sampleRate*.012),out=channels.map(()=>new Float32Array(outLength+window)),weights=new Float32Array(outLength+window);let reference=0,bestEnergy=-1;for(let c=0;c<channels.length;c++){let sum=0;for(let i=0;i<n;i+=31)sum+=channels[c][i]**2;if(sum>bestEnergy){bestEnergy=sum;reference=c;}}const mono=channels[reference];
  for(let target=0,step=0;target<outLength;target+=hop,step++){
    const predicted=Math.round(target/ratio);let source=Math.max(0,Math.min(n-window,predicted)),best=-Infinity;
    if(target&&n>window){for(let candidate=Math.max(0,predicted-search);candidate<=Math.min(n-window,predicted+search);candidate+=8){let xy=0,xx=0,yy=0;for(let j=0;j<window-hop&&target+j<outLength;j+=8){const a=weights[target+j]>1e-6?out[reference][target+j]/weights[target+j]:0,b=mono[candidate+j];xy+=a*b;xx+=a*a;yy+=b*b;}const score=xy/Math.sqrt(xx*yy+1e-20)-Math.abs(candidate-predicted)*1e-7;if(score>best){best=score;source=candidate;}}}
    for(let j=0;j<window&&source+j<n&&target+j<out[0].length;j++){const w=Math.sin(Math.PI*(j+.5)/window)**2;weights[target+j]+=w;for(let c=0;c<channels.length;c++)out[c][target+j]+=channels[c][source+j]*w;}
    if(step%50===0)onProgress(Math.round(target/outLength*100));
  }
  return out.map(a=>Float32Array.from({length:outLength},(_,i)=>weights[i]>1e-9?a[i]/weights[i]:0));
}
export function transposeAudio(channels,semitones){const rate=2**(semitones/12);return channels.map(input=>Float32Array.from({length:Math.max(1,Math.round(input.length/rate))},(_,i)=>{const x=Math.min(input.length-1,i*rate),lo=Math.floor(x),fraction=x-lo;return input[lo]*(1-fraction)+(input[Math.min(input.length-1,lo+1)]||0)*fraction;}));}
