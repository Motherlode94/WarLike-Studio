import {countInBars} from './recording-count-in.js';
import {recordingRange} from './recording-range.js';
export const CLIP_GAIN_MIN_DB=-24;
export const CLIP_GAIN_MAX_DB=36;
export const AUTO_LEVEL_TARGET_DB=-6;
const finite=(value,fallback=0)=>Number.isFinite(Number(value))?Number(value):fallback;
const clamp=(value,min,max)=>Math.max(min,Math.min(max,value));
export const clampClipGain=value=>clamp(finite(value),CLIP_GAIN_MIN_DB,CLIP_GAIN_MAX_DB);

export function recordingSettings(value={}) {
  const settings={gainDb:clamp(finite(value?.gainDb),0,24),autoLevel:value?.autoLevel!==false,countInBars:countInBars(value?.countInBars)};
  if(value?.range!=null)settings.range=recordingRange(value.range);
  return settings;
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
  let monitorSplitter=null,monitorGains=[],disposed=false;
  const stopMonitor=()=>{
    for(const g of monitorGains){g.gain.value=0;g.disconnect();}
    monitorGains=[];
    if(monitorSplitter){
      monitorSplitter.disconnect();
      source.disconnect(monitorSplitter);
      monitorSplitter=null;
    }
  };
  const monitorMany=(routes,{levelDb=-18}={})=>{
    if(disposed)throw Error('Monitoring indisponible : capture terminée.');
    if(!Array.isArray(routes)||!routes.length||routes.length>2)throw Error('Monitoring : une ou deux pistes sont nécessaires.');
    for(const route of routes)if(!route.target||typeof route.target.connect!=='function'||!['1','2'].includes(route.channel))throw Error('Routage du monitoring invalide.');
    stopMonitor();
    monitorSplitter=ctx.createChannelSplitter(2);
    source.connect(monitorSplitter);
    for(const route of routes){
      const volume=ctx.createGain();volume.gain.value=0;
      const amount=Number.isFinite(route.levelDb)?route.levelDb:levelDb;
      const safeDb=Math.max(-36,Math.min(-6,Number.isFinite(amount)?amount:-18));
      monitorSplitter.connect(volume,route.channel==='2'?1:0);
      volume.connect(route.target);
      volume.gain.setTargetAtTime(Math.pow(10,safeDb/20),ctx.currentTime,.02);
      monitorGains.push(volume);
    }
  };
  return {stream:destination.stream,analyser,inputNode:gain,
    monitor(target,{levelDb=-18,channel='1'}={}){monitorMany([{target,levelDb,channel}]);},
    monitorMany,
    stopMonitor,
    setGain(db){gain.gain.setTargetAtTime(Math.pow(10,recordingSettings({gainDb:db}).gainDb/20),ctx.currentTime,.01);},
    dispose(){if(disposed)return;disposed=true;stopMonitor();source.disconnect();gain.disconnect();analyser.disconnect();destination.disconnect();stream.getTracks().forEach(t=>t.stop());destination.stream.getTracks().forEach(t=>t.stop());}
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
  if(!['1','2'].includes(channel))throw Error('Entrée audio invalide.');
  const index=channel==='2'?1:0;
  if(!buffer||!Number.isInteger(buffer.numberOfChannels)||index>=buffer.numberOfChannels)throw Error('Entrée audio '+channel+' indisponible dans la prise.');
  if(!Number.isInteger(buffer.length)||buffer.length<1||!Number.isFinite(buffer.sampleRate)||buffer.sampleRate<=0)throw Error('Format de prise invalide.');
  const data=buffer.getChannelData(index);
  if(!data||data.length!==buffer.length)throw Error('Canal PCM incomplet.');
  const mono=ctx.createBuffer(1,buffer.length,buffer.sampleRate);
  mono.getChannelData(0).set(data);
  return mono;
}

/** Use identical device/channel constraints for input metering and recording. */
export function recordingInputConstraints(audioSetup={},assignments=[]) {
  const configured=audioSetup.channel||'1';
  const wantsStereo=assignments.length>1||assignments.some(a=>a.channel==='2')||configured==='stereo'||(!assignments.length&&configured==='2');
  const id=audioSetup.deviceId;
  return {audio:{...(id?{deviceId:{exact:id}}:{}),
    channelCount:{ideal:wantsStereo?2:1},
    echoCancellation:false,noiseSuppression:false,autoGainControl:false}};
}
export function validateRecordingInputChannels(settings={},assignments=[],fallback='1') {
  const mode=captureChannelMode(assignments,fallback);
  const needsSecond=mode==='2'||mode==='stereo';
  const count=Number(settings.channelCount)||0;
  if(needsSecond&&count<2)throw Error('Entrée 2 indisponible : sélectionner une interface stéréo exposant 2 canaux dans le navigateur.');
  return mode;
}

/**
 * Bounded QA probe for a recorded AudioBuffer before committing a take.
 * This inspection is advisory on clipping and silence. An invalid buffer or
 * sampled non-finite PCM is rejected before WAV encoding or project mutation.
 */
export function inspectRecordedTake(buffer,{maxScanPerChannel=120000}={}){
  if(!buffer||!Number.isInteger(buffer.numberOfChannels)||buffer.numberOfChannels<1||buffer.numberOfChannels>2||
    !Number.isInteger(buffer.length)||buffer.length<1||
    !Number.isFinite(buffer.sampleRate)||buffer.sampleRate<8000||buffer.sampleRate>192000||
    typeof buffer.getChannelData!=='function')
    throw Error('Prise audio invalide : format, fréquence ou nombre de canaux non pris en charge.');
  const duration=buffer.length/buffer.sampleRate;
  if(!Number.isFinite(duration)||duration<=0||duration>21*60)
    throw Error('Durée de prise incohérente ou supérieure à la limite de sécurité.');
  const count=Math.max(1,Math.min(120000,Math.floor(Number(maxScanPerChannel)||120000)));
  // Respect the 120k-samples/channel QA budget on long takes.
  // Inspect the first and last 1024 samples at full resolution so short
  // glitches at capture boundaries cannot be skipped by the sparse scan.
  const fullScan=buffer.length<=count;
  let peak=0,sum=0,sampled=0,clipped=0;
  for(let channel=0;channel<buffer.numberOfChannels;channel++){
    const data=buffer.getChannelData(channel);
    if(!data||data.length!==buffer.length)
      throw Error('Prise audio incomplète : canal '+(channel+1)+' incorrect.');
    const edge=fullScan?0:Math.min(1024,Math.floor(count/8));
    const sample=value=>{
      if(!Number.isFinite(value))throw Error('Échantillon audio corrompu dans la prise (NaN/Inf).');
      const abs=Math.abs(value);peak=Math.max(peak,abs);sum+=value*value;sampled++;
      if(abs>=.999)clipped++;
    };
    if(fullScan){for(let i=0;i<data.length;i++)sample(data[i]);}
    else{
      for(let i=0;i<edge;i++)sample(data[i]);
      const midStart=edge,midEnd=data.length-edge,remaining=count-2*edge;
      const stride=Math.max(1,Math.ceil((midEnd-midStart)/remaining));
      for(let i=midStart;i<midEnd;i+=stride)sample(data[i]);
      for(let i=midEnd;i<data.length;i++)sample(data[i]);
    }
  }
  const rms=Math.sqrt(sum/Math.max(1,sampled)),clippedFraction=clipped/Math.max(1,sampled);
  const warnings=[];
  if(peak<.0006)warnings.push('signal presque silencieux : vérifie le microphone et le routage');
  if(clippedFraction>.001||peak>=.999)warnings.push('écrêtage détecté : réduis le gain d’entrée');
  if(peak>1.001)warnings.push('amplitude hors plage PCM normale');
  if(!fullScan)warnings.push('prise longue : diagnostic effectué par échantillonnage ; de brefs pics peuvent passer inaperçus');
  return {valid:true,duration,channels:buffer.numberOfChannels,sampleRate:buffer.sampleRate,peak,rms,clippedFraction,examinedSamples:sampled,sampled:!fullScan,warnings};
}
