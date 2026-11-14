import {recordingInputConstraints} from './recording.js?v=0.14.0';
import {createPcmCapture} from './pcm-capture.js?v=0.14.0';
import {estimateStereoTransientOffset,summarizeStereoSyncTrials} from './recording-stereo-sync.js';

const button=document.getElementById('recordWorkspaceSyncCheck');
const output=document.getElementById('recordWorkspaceSyncResult');
let busy=false;
button?.addEventListener('click',async()=>{
  if(busy)return;
  if(document.getElementById('record')?.classList.contains('recording')){
    if(output)output.textContent='Arrête l’enregistrement avant la mesure.';
    return;
  }
  if(!navigator.mediaDevices?.getUserMedia){if(output)output.textContent='Microphone indisponible : HTTPS et autorisation nécessaires.';return;}
  busy=true;button.disabled=true;
  let stream,ctx,source,capture;
  try{
    if(output)output.textContent='Préparation du test : fais un claquement net, audible sur les deux micros dès que le compte à rebours se termine.';
    const deviceId=document.getElementById('recordWorkspaceBar')?.dataset.deviceId||'';
    stream=await navigator.mediaDevices.getUserMedia(recordingInputConstraints({deviceId,channel:'stereo'},[]));
    const track=stream.getAudioTracks()[0];
    if((track?.getSettings?.().channelCount||1)<2)throw Error('Entrée stéréo indisponible. Sélectionne une interface audio à deux canaux.');
    ctx=new AudioContext();
    if(ctx.state==='suspended')await ctx.resume();
    source=ctx.createMediaStreamSource(stream);
    const trials=[];
    for(let i=0;i<3;i++){
      // Each trial starts a fresh, bounded PCM capture and retains no prior audio.
      capture=await createPcmCapture(ctx,source,{channel:'stereo'});
      if(output)output.textContent='Essai '+(i+1)+'/3 : fais UN claquement bref et net, audible sur les deux micros.';
      capture.start(ctx.currentTime+.05);
      await new Promise(resolve=>setTimeout(resolve,2200));
      const recorded=await capture.stop();
      capture=null;
      if(recorded.numberOfChannels<2)throw Error('Le navigateur n’a pas fourni deux canaux PCM.');
      const trial=estimateStereoTransientOffset(recorded.getChannelData(0),recorded.getChannelData(1),ctx.sampleRate);
      if(!trial.ok)throw Error('Essai '+(i+1)+'/3 : '+trial.reason);
      trials.push(trial);
      if(i<2&&output)output.textContent='Essai '+(i+1)+'/3 enregistré. Prépare le claquement suivant.';
    }
    const result=summarizeStereoSyncTrials(trials);
    if(!result.ok)throw Error(result.reason);
    const sign=result.offsetMs>=0?'+':'';
    if(output)output.textContent='IN 2 − IN 1 : '+sign+result.offsetMs.toFixed(2)+' ms (médiane sur 3 essais), variation '+result.spreadMs.toFixed(2)+' ms, corrélation min. '+result.correlation.toFixed(2)+'. Mesure acoustique, pas la latence casque.';
    window.dispatchEvent(new CustomEvent('warlike:recording-sync-measurement',{detail:{...result,sampleRate:ctx.sampleRate,at:Date.now()}}));
  }catch(error){if(output)output.textContent='Mesure non concluante : '+error.message;}
  finally{
    try{capture?.dispose();}catch{}
    try{source?.disconnect();}catch{}
    stream?.getTracks().forEach(track=>track.stop());
    try{await ctx?.close();}catch{}
    busy=false;button.disabled=false;
  }
});
