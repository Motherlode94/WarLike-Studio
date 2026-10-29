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
  let disposed=false;
  return {stream:destination.stream,analyser,inputNode:gain,monitor(target){gain.connect(target);},
    setGain(db){gain.gain.setTargetAtTime(Math.pow(10,recordingSettings({gainDb:db}).gainDb/20),ctx.currentTime,.01);},
    dispose(){if(disposed)return;disposed=true;source.disconnect();gain.disconnect();analyser.disconnect();destination.disconnect();stream.getTracks().forEach(t=>t.stop());destination.stream.getTracks().forEach(t=>t.stop());}
  };
}
