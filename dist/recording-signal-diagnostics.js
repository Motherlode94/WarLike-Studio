// Lightweight PCM integrity hints; clipping/silence are not proof of missing hardware samples.
export function createRecordingSignalDiagnostics({sampleRate,channels,clipThreshold=0.999,silenceThreshold=0.0005}={}){
 if(!Number.isFinite(sampleRate)||sampleRate<=0||!Number.isInteger(channels)||channels<1||channels>2)
   throw Error('Configuration PCM invalide.');
 const stats=Array.from({length:channels},()=>({frames:0,peak:0,clippedFrames:0,silentFrames:0,silentRun:0,longestSilentRun:0,sumSquares:0,invalidSamples:0}));
 let invalidBlocks=0;
 function add(chunk){
   if(!Array.isArray(chunk)||chunk.length!==channels||!chunk[0]?.length||chunk.some(c=>!c||c.length!==chunk[0].length)){
     invalidBlocks++;return false;
   }
   const frames=chunk[0].length;
   for(let c=0;c<channels;c++){
     const item=stats[c],data=chunk[c];
     for(let i=0;i<frames;i++){
       const value=data[i];
       if(!Number.isFinite(value)){item.invalidSamples++;item.silentRun=0;continue;}
       const magnitude=Math.abs(value);
       item.peak=Math.max(item.peak,magnitude);
       item.sumSquares+=value*value;
       if(magnitude>=clipThreshold)item.clippedFrames++;
       if(magnitude<=silenceThreshold){
         item.silentFrames++;item.silentRun++;
         if(item.silentRun>item.longestSilentRun)item.longestSilentRun=item.silentRun;
       }else item.silentRun=0;
     }
     item.frames+=frames;
   }
   return true;
 }
 function snapshot(){
   return {sampleRate,channels,invalidBlocks,channelStats:stats.map((item,index)=>({
     channel:index+1,frames:item.frames,durationSeconds:item.frames/sampleRate,
     peak:item.peak,peakDbfs:item.peak>0?20*Math.log10(item.peak):null,
     rmsDbfs:item.frames&&item.sumSquares>0?10*Math.log10(item.sumSquares/item.frames):null,
     clippedFrames:item.clippedFrames,clipPercent:item.frames?item.clippedFrames/item.frames*100:0,
     longestSilenceSeconds:item.longestSilentRun/sampleRate,
     silencePercent:item.frames?item.silentFrames/item.frames*100:0,
     invalidSamples:item.invalidSamples
   }))};
 }
 return {add,snapshot};
}
