import {recordingInputConstraints} from './recording.js?v=0.14.0';
import {createPcmCapture} from './pcm-capture.js?v=0.14.0';
import {estimateStereoTransientOffset} from './recording-stereo-sync.js';

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
    capture=await createPcmCapture(ctx,source,{channel:'stereo'});
    if(output)output.textContent='Mesure démarrée : claque une fois des mains entre les deux micros.';
    capture.start(ctx.currentTime+.05);
    await new Promise(resolve=>setTimeout(resolve,2400));
    const recorded=await capture.stop();
    if(recorded.numberOfChannels<2)throw Error('Le navigateur n’a pas fourni deux canaux PCM.');
    const result=estimateStereoTransientOffset(recorded.getChannelData(0),recorded.getChannelData(1),ctx.sampleRate);
    if(!result.ok)throw Error(result.reason);
    const sign=result.offsetMs>=0?'+':'';
    if(output)output.textContent='Écart estimé IN 2 − IN 1 : '+sign+result.offsetMs.toFixed(2)+' ms ('+result.offsetSamples+' échant.) · corrélation '+result.correlation.toFixed(2)+'. Décalage acoustique mesuré ; ce n’est pas la latence casque.';
    window.dispatchEvent(new CustomEvent('warlike:recording-sync-measurement',{detail:{...result,sampleRate:ctx.sampleRate,at:Date.now(),kind:'acoustic-arrival'}}));
  }catch(error){if(output)output.textContent='Mesure non concluante : '+error.message;}
  finally{
    try{capture?.dispose();}catch{}
    try{source?.disconnect();}catch{}
    stream?.getTracks().forEach(track=>track.stop());
    try{await ctx?.close();}catch{}
    busy=false;button.disabled=false;
  }
});
