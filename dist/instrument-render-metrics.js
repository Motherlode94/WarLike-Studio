// Sample-domain measurements. Not true peak, LUFS, or a real-time CPU benchmark.
export function measureInstrumentRender(buffer){
 const channels=buffer?.numberOfChannels,frames=buffer?.length,rate=buffer?.sampleRate;
 if(!Number.isInteger(channels)||channels<1||!Number.isInteger(frames)||frames<1||!Number.isFinite(rate)||rate<=0)throw Error('Invalid render');
 let peak=0,energy=0,clipped=0,nonFinite=0,tailEnergy=0,tailCount=0,stereoEnergy=0;const dc=[];
 const tailStart=Math.max(0,frames-Math.round(rate*.1));
 const data=Array.from({length:channels},(_,i)=>buffer.getChannelData(i));
 if(data.some(x=>x.length!==frames))throw Error('Invalid channel length');
 for(const samples of data){let sum=0;for(let i=0;i<frames;i++){const x=samples[i];if(!Number.isFinite(x)){nonFinite++;continue;}const abs=Math.abs(x);peak=Math.max(peak,abs);energy+=x*x;sum+=x;if(abs>=1)clipped++;if(i>=tailStart){tailEnergy+=x*x;tailCount++;}}dc.push(sum/frames);}
 if(channels===2)for(let i=0;i<frames;i++){const a=data[0][i],b=data[1][i];if(Number.isFinite(a)&&Number.isFinite(b))stereoEnergy+=(a-b)**2;}
 return {channels,frames,sampleRate:rate,finite:nonFinite===0,nonFinite,peak,rms:Math.sqrt(energy/(channels*frames)),clipped,dc,tailRms:Math.sqrt(tailEnergy/Math.max(1,tailCount)),stereoRms:Math.sqrt(stereoEnergy/frames)};
}
// A fixed, reproducible schedule with explicit conservative bus headroom.
// No changes to instrument presets or user project levels.
export function expansionStressScore(phrase){
 const root=phrase==='bass'?36:60;
 return Array.from({length:8},(_,bar)=>Array.from({length:4},(_,i)=>({midi:root+[0,3,7,10][i]+[0,5,3,7][bar%4],time:.05+bar*.32+i*.012,length:.45,velocity:[.45,.65,.85,.95][i]}))).flat();
}
