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
  let start=0,elapsed=0,recorded=0,lastTime=0,lastRecording=false,refreshInterval=null,samples=0,interruptions=0,previousAudioFrames=0;
  const el=(tag,text)=>{const node=document.createElement(tag);if(text!==undefined)node.textContent=text;return node;};
  function isRecording(){return document.getElementById('record')?.classList.contains('recording')===true;}
  function getAudioStatus(){return document.getElementById('audioStatus')?.textContent?.trim()||'inconnu';}
  function state(){
    return {startedAt:start?new Date(start).toISOString():null,endedAt:new Date().toISOString(),
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
    lastRecording=recording;lastTime=now;samples++;
    const t=article.querySelector('#validationDuration');
    if(t)t.textContent='Durée de séance : '+Math.floor(elapsed/60000)+' min · capture active observée : '+Math.floor(recorded/60000)+' min · démarrages REC : '+interruptions;
    const target=Number(article.querySelector('#validationTarget')?.value)||30;
    const targetStatus=article.querySelector('#validationTargetStatus');
    if(targetStatus)targetStatus.textContent=recorded>=target*60000?'Objectif de temps atteint — vérifier les prises enregistrées.':'Objectif de '+target+' minutes de capture non atteint.';
  }
  function report(){
    update();
    return {...state(),note:'Durée déduite de l’état REC visible tant que ce panneau est ouvert. Le rapport ne prouve pas la continuité des échantillons, les deux micros physiques ni la latence réelle. Chaque prise reste limitée par la durée autorisée dans Studio.'};
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
    article.append(el('p','Pour les 30–60 minutes, réalise plusieurs prises : Studio limite actuellement une prise à 20 minutes. Le chronométrage mesure le temps REC observé, pas un audit échantillon par échantillon.'));
    const selector=el('label','Objectif de capture cumulée : ');
    const select=el('select');select.id='validationTarget';
    for(const minutes of [30,60]){const option=el('option',minutes+' minutes');option.value=minutes;select.append(option);}
    selector.append(select);article.append(selector);
    const counter=el('p','Durée de séance : 0 min · capture active observée : 0 min');counter.id='validationDuration';article.append(counter);
    const progress=el('p','Objectif de 30 minutes de capture non atteint.');progress.id='validationTargetStatus';article.append(progress);
    for(const [key,label] of checks){
      const line=el('label');line.className='recording-validation-check';
      const input=el('input');input.type='checkbox';input.dataset.validationCheck=key;
      line.append(input,document.createTextNode(' '+label));article.append(line);
    }
    const note=el('p','Calibration : Recording → Entrée / Monitoring → Mesurer par bouclage. Utilise un câble ligne, coupe le monitoring pendant cette mesure et vérifie le résultat à l’écoute.');
    article.append(note);
    const controls=el('div');controls.className='recording-validation-actions';
    const stop=el('button','Terminer et télécharger le rapport');stop.type='button';stop.addEventListener('click',()=>{exportJson();dialog.close();});
    const close=el('button','Fermer sans rapport');close.type='button';close.addEventListener('click',()=>dialog.close());
    controls.append(stop,close);article.append(controls);
  }
  startButton.addEventListener('click',()=>{
    if(dialog.open)return;
    elapsed=0;recorded=0;samples=0;interruptions=0;lastRecording=false;previousAudioFrames=0;
    draw();start=Date.now();lastTime=start;dialog.showModal();
    refreshInterval=setInterval(update,1000);
  });
  dialog.addEventListener('close',()=>{clearInterval(refreshInterval);refreshInterval=null;start=0;});
}
