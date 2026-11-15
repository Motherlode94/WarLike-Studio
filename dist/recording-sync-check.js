import {recordingInputConstraints} from './recording.js?v=0.14.0';
import {createPcmCapture} from './pcm-capture.js?v=0.14.0';
import {estimateStereoTransientOffset,summarizeStereoSyncTrials} from './recording-stereo-sync.js';

const button=document.getElementById('recordWorkspaceSyncCheck');
const output=document.getElementById('recordWorkspaceSyncResult');
const originalLabel=button?.textContent||'Mesurer synchro IN 1/2';
let active=null;
const cancelled=()=>new DOMException('Mesure interrompue.','AbortError');
function assertActive(signal){if(signal.aborted)throw cancelled();}
function pause(ms,signal){
  assertActive(signal);
  return new Promise((resolve,reject)=>{
    const stop=()=>{clearTimeout(timer);reject(cancelled());};
    const timer=setTimeout(()=>{signal.removeEventListener('abort',stop);resolve();},ms);
    signal.addEventListener('abort',stop,{once:true});
  });
}
function abortSync(){active?.abort();}
button?.addEventListener('click',async()=>{
  if(active){abortSync();return;}
  if(document.getElementById('record')?.classList.contains('recording')){
    if(output)output.textContent='Arrête l’enregistrement avant la mesure.';
    return;
  }
  if(!navigator.mediaDevices?.getUserMedia){
    if(output)output.textContent='Microphone indisponible : HTTPS et autorisation nécessaires.';
    return;
  }
  const controller=new AbortController();
  active=controller;
  const {signal}=controller;
  button.textContent='Annuler la mesure';
  let stream,ctx,source,capture;
  try{
    if(output)output.textContent='Autorise les deux entrées de l’interface. Tu peux annuler à tout moment.';
    const deviceId=document.getElementById('recordWorkspaceBar')?.dataset.deviceId||
      document.getElementById('inputDevice')?.value||'';
    stream=await navigator.mediaDevices.getUserMedia(recordingInputConstraints({deviceId,channel:'stereo'},[]));
    assertActive(signal);
    const track=stream.getAudioTracks()[0];
    if((track?.getSettings?.().channelCount||1)<2)
      throw Error('Entrée stéréo indisponible. Sélectionne une interface audio à deux canaux.');
    track.addEventListener('ended',abortSync,{once:true});
    ctx=new AudioContext();
    if(ctx.state==='suspended')await ctx.resume();
    assertActive(signal);
    source=ctx.createMediaStreamSource(stream);
    const trials=[];
    for(let i=0;i<3;i++){
      assertActive(signal);
      if(output)output.textContent='Essai '+(i+1)+'/3 : prépare-toi, claquement dans 1 seconde.';
      await pause(1100,signal);
      capture=await createPcmCapture(ctx,source,{channel:'stereo'});
      assertActive(signal);
      if(output)output.textContent='Essai '+(i+1)+'/3 : claque UNE fois des mains entre les deux micros maintenant.';
      capture.start(ctx.currentTime+.05);
      await pause(2000,signal);
      const recorded=await capture.stop();
      capture=null;
      assertActive(signal);
      if(recorded.numberOfChannels<2)throw Error('Le navigateur n’a pas fourni deux canaux PCM.');
      const trial=estimateStereoTransientOffset(recorded.getChannelData(0),recorded.getChannelData(1),ctx.sampleRate);
      if(!trial.ok)throw Error('Essai '+(i+1)+'/3 : '+trial.reason);
      trials.push(trial);
    }
    const result=summarizeStereoSyncTrials(trials);
    if(!result.ok)throw Error(result.reason);
    assertActive(signal);
    const sign=result.offsetMs>=0?'+':'';
    if(output)output.textContent='IN 2 − IN 1 : '+sign+result.offsetMs.toFixed(2)+' ms (3 essais), variation '+result.spreadMs.toFixed(2)+' ms, corrélation min. '+result.correlation.toFixed(2)+'. Arrivée acoustique, pas latence casque.';
    window.dispatchEvent(new CustomEvent('warlike:recording-sync-measurement',{detail:{...result,sampleRate:ctx.sampleRate,at:Date.now()}}));
  }catch(error){
    if(output)output.textContent=error?.name==='AbortError'?'Mesure annulée. Aucun résultat validé.':'Mesure non concluante : '+error.message;
  }finally{
    try{capture?.dispose();}catch{}
    try{source?.disconnect();}catch{}
    stream?.getTracks().forEach(track=>track.stop());
    try{await ctx?.close();}catch{}
    if(active===controller)active=null;
    button.textContent=originalLabel;
  }
});
document.addEventListener('visibilitychange',()=>{if(document.hidden)abortSync();});
window.addEventListener('pagehide',abortSync);
document.getElementById('recordWorkspaceStart')?.addEventListener('click',abortSync,{capture:true});
document.getElementById('record')?.addEventListener('click',abortSync,{capture:true});
