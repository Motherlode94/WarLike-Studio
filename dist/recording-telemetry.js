// Recording telemetry is local-only. Frame counters describe received PCM,
// not microphone identity, audible quality or a gap-free hardware clock.
export const RECORDING_TELEMETRY_EVENT='warlike:recording-telemetry';
export function emitRecordingTelemetry(type,payload={}){
  if(typeof window==='undefined'||typeof CustomEvent==='undefined')return;
  window.dispatchEvent(new CustomEvent(RECORDING_TELEMETRY_EVENT,{
    detail:{type,at:Date.now(),...payload}
  }));
}
export function createRecordingTelemetrySummary(){
  const takes=new Map(),errors=[];
  return {
    add(event){
      if(!event||!['start','progress','finalized','error'].includes(event.type))return;
      if(event.type==='error'){
        errors.push({takeId:event.takeId||null,message:String(event.message||'Erreur de capture').slice(0,300),at:event.at||Date.now()});
        return;
      }
      if(!event.takeId)return;
      const previous=takes.get(event.takeId)||{takeId:event.takeId,frames:0,sampleRate:0,channels:0,status:'started',startedAt:event.at||null,errors:0};
      const frames=Math.max(previous.frames,Number.isSafeInteger(event.frames)&&event.frames>=0?event.frames:0);
      const sampleRate=Number.isFinite(event.sampleRate)&&event.sampleRate>0?event.sampleRate:previous.sampleRate;
      const channels=Number.isInteger(event.channels)&&event.channels>0?event.channels:previous.channels;
      const status=event.type==='finalized'?'finalized':event.type==='start'?'started':'recording';
      takes.set(event.takeId,{...previous,frames,sampleRate,channels,status,at:event.at||Date.now()});
    },
    snapshot(){
      const items=[...takes.values()];
      const capturedSeconds=items.reduce((sum,t)=>sum+(t.sampleRate>0?t.frames/t.sampleRate:0),0);
      return {
        capturedSeconds,
        finalizedSeconds:items.filter(t=>t.status==='finalized').reduce((sum,t)=>sum+(t.sampleRate>0?t.frames/t.sampleRate:0),0),
        takes:items.map(t=>({...t,seconds:t.sampleRate?t.frames/t.sampleRate:0})),
        errors:[...errors],
        startedCount:items.length,
        finalizedCount:items.filter(t=>t.status==='finalized').length
      };
    }
  };
}
