import {RECORDING_TELEMETRY_EVENT,createRecordingTelemetrySummary} from './recording-telemetry.js';
// On-device Recording Pro acceptance report. The browser cannot certify a physical
// microphone or independent headphone output; those require human confirmation.
const startButton=document.getElementById('recordWorkspaceValidate');
if(startButton){
  const dialog=document.createElement('dialog');
  dialog.className='recording-validation-dialog';
  dialog.setAttribute('aria-label','Validation réelle Recording Pro');
  const article=document.createElement('section');
  article.className='recording-validation-body';
  dialog.append(article);
  document.body.append(dialog);
  const checks=[
    ['mic1','Micro IN 1 audible sur la piste 1, sans saturation'],
    ['mic2','Micro IN 2 audible sur la piste 2, sans saturation'],
    ['isolation','Pistes séparées : pas d’inversion ni de duplication de micro'],
    ['headphones','Retour casque stable, sans larsen, craquement ni décrochage'],
    ['latency','Latence mesurée par bouclage, puis vérifiée à l’écoute'],
    ['saved','Prises retrouvées après sauvegarde et rechargement du projet']
  ];
  let start=0,elapsed=0,recorded=0,lastTime=0,lastRecording=false,refreshInterval=null,interruptions=0,telemetry=createRecordingTelemetrySummary(),syncMeasurement=null,loopbackMeasurement=null;
  const el=(tag,text)=>{const node=document.createElement(tag);if(text!==undefined)node.textContent=text;return node;};
  function isRecording(){return document.getElementById('record')?.classList.contains('recording')===true;}
  function getAudioStatus(){return document.getElementById('audioStatus')?.textContent?.trim()||'inconnu';}
  function state(){
    const measured=telemetry.snapshot();
    return {pcmEvidence:measured,syncMeasurement,loopbackMeasurement,startedAt:start?new Date(start).toISOString():null,endedAt:new Date().toISOString(),
      elapsedSeconds:Math.floor(elapsed/1000),recordingSeconds:Math.floor(recorded/1000),
      targetMinutes:Number(article.querySelector('#validationTarget')?.value)||30,
      recordings:interruptions,checks:Object.fromEntries(checks.map(([key])=>[key,article.querySelector('[data-validation-check="'+key+'"]')?.checked||false])),
      audioStatus:getAudioStatus(),microphonesPhysicallyVerified:false};
  }
  function update(){
    if(!start||!dialog.open)return;
    const now=Date.now(),delta=Math.min(2000,Math.max(0,now-lastTime));
    elapsed+=delta;
    const recording=isRecording();
    if(recording)recorded+=delta;
    if(recording&&!lastRecording)interruptions++;
    lastRecording=recording;lastTime=now;
    const t=article.querySelector('#validationDuration');
    if(t)t.textContent='Durée de séance : '+Math.floor(elapsed/60000)+' min · capture active observée : '+Math.floor(recorded/60000)+' min · démarrages REC : '+interruptions;
    const target=Number(article.querySelector('#validationTarget')?.value)||30;
    const measured=telemetry.snapshot();
    const evidence=article.querySelector('#validationPcmEvidence');
    if(evidence)evidence.textContent='PCM reçu : '+measured.capturedSeconds.toFixed(1)+' s · PCM sauvegardé : '+measured.finalizedSeconds.toFixed(1)+' s · prises confirmées : '+measured.finalizedCount+'/'+measured.startedCount+' · erreurs : '+measured.errors.length;
    const quality=article.querySelector('#validationSignalQuality');
    if(quality){
      const latest=measured.takes.filter(t=>t.signal?.channelStats?.length).at(-1);
      quality.textContent=latest?'Signal PCM : '+latest.signal.channelStats.map(ch=>
        'IN '+ch.channel+' : pic '+(ch.peakDbfs===null?'—':ch.peakDbfs.toFixed(1)+' dBFS')+
        ', saturation '+ch.clippedFrames+' échant., silence max '+ch.longestSilenceSeconds.toFixed(1)+' s'
      ).join(' · '):'Signal PCM : aucune prise mesurée';
    }
    const hardware=article.querySelector('#validationHardwareEvidence');
    if(hardware)hardware.textContent='Sync IN 1/2 : '+(syncMeasurement?syncMeasurement.offsetMs.toFixed(2)+' ms (corr. '+syncMeasurement.correlation.toFixed(2)+')':'non mesurée')+
      ' · Bouclage câblé : '+(loopbackMeasurement?loopbackMeasurement.latencyMs.toFixed(2)+' ms (variation '+loopbackMeasurement.spreadMs.toFixed(2)+' ms)':'non mesuré')+
      ' · Latence casque à sens unique : non mesurée';
    const targetStatus=article.querySelector('#validationTargetStatus');
    if(targetStatus)targetStatus.textContent=measured.finalizedSeconds>=target*60?'Objectif d’échantillons sauvegardés atteint — vérifier les prises à l’écoute.':'Objectif de '+target+' minutes PCM sauvegardées non atteint.';
  }
  function report(){
    update();
    return {...state(),note:'PCM : nombre de frames reçues par le navigateur ; prises confirmées après persistance locale du projet. Cela ne prouve ni l’absence de trous avant le navigateur, ni les deux microphones physiques, ni la latence casque réelle. Chaque prise reste limitée par le moteur de Studio.'};
  }
  function exportJson(){
    const data=JSON.stringify(report(),null,2);
    const url=URL.createObjectURL(new Blob([data],{type:'application/json'}));
    const link=el('a');link.href=url;link.download='WarLike-Recording-validation-'+new Date().toISOString().slice(0,10)+'.json';
    document.body.append(link);link.click();link.remove();
    setTimeout(()=>URL.revokeObjectURL(url),60000);
  }
  function draw(){
    article.replaceChildren();
    article.append(el('h2','Validation matérielle / endurance'));
    article.append(el('p','Pour 30–60 minutes, enregistre plusieurs prises (20 minutes maximum chacune). La durée PCM comptabilise les échantillons reçus ; seule la durée des prises sauvegardées compte vers l’objectif.'));
    article.append(el('p','Les silences et saturations sont des indices de qualité audio, pas une preuve de perte de paquets ou de panne de microphone.'));
    const selector=el('label','Objectif de capture cumulée : ');
    const select=el('select');select.id='validationTarget';
    for(const minutes of [30,60]){const option=el('option',minutes+' minutes');option.value=minutes;select.append(option);}
    selector.append(select);article.append(selector);
    const counter=el('p','Durée de séance : 0 min · capture active observée : 0 min');counter.id='validationDuration';article.append(counter);
    const evidence=el('p','PCM reçu : 0 s · PCM sauvegardé : 0 s');evidence.id='validationPcmEvidence';article.append(evidence);
    const quality=el('p','Signal PCM : aucune prise mesurée');quality.id='validationSignalQuality';article.append(quality);
    const progress=el('p','Objectif de 30 minutes PCM sauvegardées non atteint.');progress.id='validationTargetStatus';article.append(progress);
    for(const [key,label] of checks){
      const line=el('label');line.className='recording-validation-check';
      const input=el('input');input.type='checkbox';input.dataset.validationCheck=key;
      line.append(input,document.createTextNode(' '+label));article.append(line);
    }
    const live=el('p','Mesures matérielles : aucune.');live.id='validationHardwareEvidence';article.append(live);
    const note=el('p','Calibration : Recording → Entrée / Monitoring → Mesurer par bouclage. Utilise un câble ligne, coupe le monitoring pendant cette mesure et vérifie le résultat à l’écoute.');
    article.append(note);
    const controls=el('div');controls.className='recording-validation-actions';
    const stop=el('button','Terminer et télécharger le rapport');stop.type='button';stop.addEventListener('click',()=>{exportJson();dialog.close();});
    const close=el('button','Fermer sans rapport');close.type='button';close.addEventListener('click',()=>dialog.close());
    controls.append(stop,close);article.append(controls);
  }
  window.addEventListener('warlike:recording-sync-measurement',event=>{if(start&&dialog.open){syncMeasurement=event.detail;update();}});
  window.addEventListener('warlike:recording-loopback-measurement',event=>{if(start&&dialog.open){loopbackMeasurement=event.detail;update();}});
  window.addEventListener(RECORDING_TELEMETRY_EVENT,event=>{if(start&&dialog.open){telemetry.add(event.detail);update();}});
  startButton.addEventListener('click',()=>{
    if(dialog.open)return;
    elapsed=0;recorded=0;interruptions=0;lastRecording=false;telemetry=createRecordingTelemetrySummary();syncMeasurement=null;loopbackMeasurement=null;
    draw();start=Date.now();lastTime=start;dialog.show();
    refreshInterval=setInterval(update,1000);
  });
  dialog.addEventListener('close',()=>{clearInterval(refreshInterval);refreshInterval=null;start=0;});
}
