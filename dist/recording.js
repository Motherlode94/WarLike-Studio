export const CLIP_GAIN_MIN_DB=-24;
export const CLIP_GAIN_MAX_DB=36;
export const AUTO_LEVEL_TARGET_DB=-6;
const finite=(value,fallback=0)=>Number.isFinite(Number(value))?Number(value):fallback;
const clamp=(value,min,max)=>Math.max(min,Math.min(max,value));
export const clampClipGain=value=>clamp(finite(value),CLIP_GAIN_MIN_DB,CLIP_GAIN_MAX_DB);

export function recordingSettings(value={}) {
  return {gainDb:clamp(finite(value?.gainDb),0,24),autoLevel:value?.autoLevel!==false};
}
export function measureChannels(channels) {
  let peak=0,squares=0,samples=0;
  for(const channel of channels)for(const value of channel){if(!Number.isFinite(value))continue;peak=Math.max(peak,Math.abs(value));squares+=value*value;samples++;}
  const rms=samples?Math.sqrt(squares/samples):0;
  return {peak,rms,peakDb:peak>0?20*Math.log10(peak):-Infinity,rmsDb:rms>0?20*Math.log10(rms):-Infinity};
}
export function measureBuffer(buffer) {
  return measureChannels(Array.from({length:buffer.numberOfChannels},(_,c)=>buffer.getChannelData(c)));
}
export function normalisationGain(levels,targetDb=AUTO_LEVEL_TARGET_DB) {
  // Never turn silence / near-silence into a loud noise floor.
  if(!Number.isFinite(levels.peakDb)||levels.peakDb< -65)return {gainDb:0,silent:true,limited:false};
  const requested=targetDb-levels.peakDb,gainDb=clamp(requested,CLIP_GAIN_MIN_DB,30);
  return {gainDb,silent:false,limited:gainDb!==requested};
}
export function createRecordingGraph(ctx,stream,gainDb=0) {
  const source=ctx.createMediaStreamSource(stream),gain=ctx.createGain(),analyser=ctx.createAnalyser(),destination=ctx.createMediaStreamDestination();
  gain.gain.value=Math.pow(10,recordingSettings({gainDb}).gainDb/20);
  analyser.fftSize=2048;destination.channelCount=1;
  source.connect(gain);gain.connect(analyser);analyser.connect(destination);
  // The microphone only feeds the recorder. There is no speaker connection.
  // An independent, attenuated monitor path protects the listener from the
  // recorder's adjustable digital gain. It is never part of captured PCM.
  const monitorGain=ctx.createGain();monitorGain.gain.value=0;
  let monitoredTarget=null,disposed=false;
  return {stream:destination.stream,analyser,inputNode:gain,
    monitor(target,{levelDb=-12}={}){
      if(disposed||!target||typeof target.connect!=='function')throw Error('Monitoring indisponible.');
      if(monitoredTarget){monitorGain.disconnect();source.disconnect(monitorGain);}
      monitoredTarget=target;source.connect(monitorGain);monitorGain.connect(target);
      const safeDb=Math.max(-36,Math.min(-6,Number.isFinite(levelDb)?levelDb:-12));
      monitorGain.gain.setTargetAtTime(Math.pow(10,safeDb/20),ctx.currentTime,.02);
    },
    stopMonitor(){monitorGain.gain.setValueAtTime(0,ctx.currentTime);monitorGain.disconnect();if(monitoredTarget)source.disconnect(monitorGain);monitoredTarget=null;},
    setGain(db){gain.gain.setTargetAtTime(Math.pow(10,recordingSettings({gainDb:db}).gainDb/20),ctx.currentTime,.01);},
    dispose(){if(disposed)return;disposed=true;monitorGain.gain.value=0;monitorGain.disconnect();source.disconnect();gain.disconnect();analyser.disconnect();destination.disconnect();stream.getTracks().forEach(t=>t.stop());destination.stream.getTracks().forEach(t=>t.stop());}
  };
}

/** A shared stereo capture is the only clock for both mono tracks. */
export function armedRecordingTracks(project) {
  const armed=(project?.tracks||[]).filter(t=>t.type==='audio'&&t.recordArm===true);
  if(armed.length>2)throw Error('Cette version accepte deux pistes armées maximum.');
  const selected=new Set();
  return armed.map(t=>{
    const channel=t.recordInput==='2'?'2':'1';
    if(selected.has(channel))throw Error('Affecte une entrée distincte à chaque piste armée (1 ou 2).');
    selected.add(channel);
    return {track:t,channel};
  });
}
export function captureChannelMode(assignments,fallback='1') {
  if(!assignments.length)return fallback;
  return assignments.length>1?'stereo':assignments[0].channel;
}
export function extractRecordedChannel(ctx,buffer,channel) {
  const index=channel==='2'?1:0;
  if(index>=buffer.numberOfChannels)throw Error('Entrée audio '+channel+' indisponible dans la prise.');
  const mono=ctx.createBuffer(1,buffer.length,buffer.sampleRate);
  mono.getChannelData(0).set(buffer.getChannelData(index));
  return mono;
}
