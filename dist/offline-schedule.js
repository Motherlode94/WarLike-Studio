// Schedule finite batches ahead of the offline audio clock, without restarting
// its DSP graph or splicing independent render buffers. All event times remain absolute.
export function offlineBatches(start,end,stepSeconds,{batchSteps=128,leadSteps=4,offset=.01}={}){
 const first=Math.floor(start),batches=[];
 if(!Number.isFinite(start)||!Number.isFinite(end)||end<=start||!(stepSeconds>0)||!Number.isInteger(batchSteps)||batchSteps<=leadSteps||leadSteps<1)throw Error('Invalid offline schedule');
 for(let from=first;from<end;from+=batchSteps){
  batches.push({from,to:Math.min(end,from+batchSteps),suspendAt:from===first?null:offset+(from-start-leadSteps)*stepSeconds});
 }
 return batches;
}
export async function renderScheduled(ctx,{start,end,stepSeconds,schedule,signal,batchSteps=128}){
 const batches=offlineBatches(start,end,stepSeconds,{batchSteps});
 signal?.throwIfAborted();
 const emit=({from,to})=>{for(let i=from;i<to;i++)schedule(i);};
 emit(batches[0]);
 // Short renders retain the original scheduling path.
 if(batches.length===1)return ctx.startRendering();
 // Register the first suspension before starting the offline clock.
 let paused=ctx.suspend(batches[1].suspendAt);
 const rendering=ctx.startRendering();
 // Attach rejection handling immediately; later awaits still surface errors.
 rendering.catch(()=>{});
 try{
  for(let i=1;i<batches.length;i++){
   await Promise.race([paused,rendering.then(()=>{throw Error('Offline render ended before all events were scheduled');})]);
   signal?.throwIfAborted();
   emit(batches[i]);
   if(i+1<batches.length)paused=ctx.suspend(batches[i+1].suspendAt);
   await ctx.resume();
  }
  const result=await rendering;signal?.throwIfAborted();return result;
 }catch(error){
  // Never leave a suspended OfflineAudioContext hanging on abort or scheduling error.
  if(ctx.state==='suspended')await ctx.resume().catch(()=>{});
  await rendering.catch(()=>{});
  throw error;
 }
}
