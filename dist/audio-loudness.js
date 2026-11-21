// BS.1770 K weighting and gated stereo loudness; windowed-sinc 4x peak estimate.
// Reference-vector conformance is required before claiming normative certification.
const mean=a=>a.reduce((s,x)=>s+x,0)/a.length;
const lufs=x=>x>0?-0.691+10*Math.log10(x):-Infinity;
function filter(x,b,a){let x1=0,x2=0,y1=0,y2=0;return Float64Array.from(x,v=>{const y=b[0]*v+b[1]*x1+b[2]*x2-a[1]*y1-a[2]*y2;x2=x1;x1=v;y2=y1;y1=y;return y;});}
function weighted(x,fs){
 let k=Math.tan(Math.PI*1681.974450955533/fs),q=.7071752369554196,vh=10**(3.999843853973347/20),vb=vh**.4996667741545416,d=1+k/q+k*k;
 const y=filter(x,[(vh+vb*k/q+k*k)/d,2*(k*k-vh)/d,(vh-vb*k/q+k*k)/d],[1,2*(k*k-1)/d,(1-k/q+k*k)/d]);
 k=Math.tan(Math.PI*38.13547087602444/fs);q=.5003270373238773;d=1+k/q+k*k;
 return filter(y,[1,-2,1],[1,2*(k*k-1)/d,(1-k/q+k*k)/d]);
}
const sinc=x=>Math.abs(x)<1e-12?1:Math.sin(Math.PI*x)/(Math.PI*x);
const kernels=[.25,.5,.75].map(f=>Array.from({length:24},(_,i)=>{const x=i-11-f;return sinc(x)*(.5+.5*Math.cos(Math.PI*x/12));}));
export function measureLoudness(buffer){
 const fs=buffer.sampleRate,n=buffer.length;if(![1,2].includes(buffer.numberOfChannels)||fs<32000||!n)throw Error('Analyse loudness mono/stéréo uniquement, 32 kHz minimum.');
 const energy=new Float64Array(n+1);let peak=0;
 for(let c=0;c<buffer.numberOfChannels;c++){const x=buffer.getChannelData(c);if(x.some(v=>!Number.isFinite(v)))throw Error('Signal non fini');const y=weighted(x,fs);
 for(let i=0;i<n;i++){energy[i+1]+=y[i]*y[i];peak=Math.max(peak,Math.abs(x[i]));for(const kernel of kernels){let v=0;for(let j=0;j<24;j++)v+=(x[i+j-11]||0)*kernel[j];peak=Math.max(peak,Math.abs(v));}}}
 for(let i=1;i<=n;i++)energy[i]+=energy[i-1];
 const blocks=(seconds,hop)=>{let a=[],w=Math.round(seconds*fs),h=Math.round(hop*fs);for(let i=0;i+w<=n;i+=h)a.push((energy[i+w]-energy[i])/w);return a;};
 const m=blocks(.4,.1),s=blocks(3,.1),absolute=m.filter(x=>lufs(x)>=-70),relative=absolute.length?mean(absolute)/10:Infinity,gated=absolute.filter(x=>x>=relative);
 return {integrated:lufs(gated.length?mean(gated):0),momentaryMax:lufs(m.reduce((a,b)=>Math.max(a,b),0)),shortTermMax:lufs(s.reduce((a,b)=>Math.max(a,b),0)),truePeakDb:peak?20*Math.log10(peak):-Infinity};
}
