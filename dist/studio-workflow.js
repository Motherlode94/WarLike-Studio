import {transformAudioChannels} from './clip-tools.js?v=0.14.0';
import {STUDIO_EFFECTS} from './studio-packs.js?v=0.14.0';
import {mountAutomationEditor} from './curve-editor.js?v=0.14.0';
import {mountTakeLanes} from './take-lanes.js?v=0.14.0';
import {prepareComp,compContext,commitComp,canContinueComp} from './comp-preview.js';
import {MAX_BARS,fitSession,routeAllowed,addAuxSend,normaliseRouting,ensurePlaylists,saveActivePlaylist,switchPlaylist,newPlaylist,recordTake,compPlaylist,applyCrossfade,audioAssetIds} from './studio-model.js?v=0.14.0';
import {EFFECTS,effectDefinition,effectType,ensurePlugins} from './plugins.js?v=0.14.0';
import {normaliseCurve,putPoint,pointValue} from './automation.js?v=0.14.0';
import {createPcmCapture,recordingPlacement} from './pcm-capture.js?v=0.14.0';
import {emitRecordingTelemetry} from './recording-telemetry.js';
import {createRecordingSignalDiagnostics} from './recording-signal-diagnostics.js';
import {createRecordingCountIn} from './recording-count-in.js';
import {createRecordingPreRoll} from './recording-preroll.js';
import {createRecordingSeries} from './recording-series.js';
import {recordingWindow,rangePlacement} from './recording-range.js';
import {mountRecordingRange,recordingRangeIndicator} from './recording-range-ui.js';
import {evaluateLoopbackLatency} from './recording-loopback-analysis.js';
import {beginRecordingJournal} from './recording-recovery.js';
import {createRecordingGraph,recordingSettings,measureBuffer,normalisationGain,armedRecordingTracks,captureChannelMode,extractRecordedChannel,recordingInputConstraints,validateRecordingInputChannels,inspectRecordedTake} from './recording.js?v=0.14.0';
import {encodeWav} from './wav.js?v=0.14.0';
import {zipWavBlobs} from './wav-export.js';
const $=id=>document.getElementById(id),esc=s=>String(s).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c])),clone=v=>structuredClone(v),safe=s=>String(s).replace(/[^\p{L}\p{N}_-]/gu,'_').slice(0,70),uid=()=>Math.random().toString(36).slice(2,11);
const SUPPORTED={color:['mix','output'],sculpt:['cutoff','highpass'],prism:['low','mid','high','lowFreq','midFreq','highFreq','q'],glue:['threshold','ratio','attack','release','makeup','knee','mix'],echo:['mix','feedback'],aura:['mix'],hush:['threshold'],sibil:['threshold','frequency'],ember:['mix','tone','output'],orbit:['rate','depth','width','mix'],sway:['rate','depth','pan','mix'],relay:['feedback','tone','mix']};
export function automationParameters(track){const list=[{key:'volume',name:'Volume',min:-48,max:12,value:track.volume},{key:'pan',name:'Panoramique',min:-1,max:1,value:track.pan}];for(const s of track.sends||[])list.push({key:'send:'+s.id,name:'Envoi '+s.target,min:-60,max:12,value:s.level});for(const id of track.inserts||[])if(id){const d=effectDefinition(id);for(const c of d.controls)if(SUPPORTED[effectType(id)]?.includes(c.key)||STUDIO_EFFECTS[effectType(id)]&& !['drive','bias','duck','range','beats','peakThreshold','levelThreshold'].includes(c.key))list.push({key:id+':'+c.key,name:d.name+' · '+c.name,min:c.min,max:c.max,value:track.effects[id][c.key]});}return list;}
export function installStudioWorkflow(d){
  let pendingRecord=null,recordingSeries=null,takeLanesDispose=null;
  function cancelRecordingSeries(){recordingSeries?.cancel();}
  function cancelPendingRecording(){
    cancelRecordingSeries();
    if(!pendingRecord||!d.getRecordState().micPending)return false;
    pendingRecord.cancelled=true;pendingRecord.stream?.getTracks().forEach(t=>t.stop());engine().pause();if(pendingRecord.returnPosition!==undefined)engine().position=pendingRecord.returnPosition;if(pendingRecord.previousLoop!==undefined)engine().loop=pendingRecord.previousLoop;d.setFlags({micPending:false});d.updateTransport();d.toast('Préparation annulée. Aucune prise créée.');return true;
  }
  const p=d.getProject,engine=d.getEngine,assets=d.getAssets,track=()=>d.currentTrack(),clip=()=>d.currentClip();const sendEdits=new WeakSet();let testGraph=null,snapshotTimes=new Map(),stretchWorker=null,exporting=false,preparedExport=null,selectedCurve='volume',curveTrack=null,lastAnalysis=null,analysisProject=null,analysing=false;
  const setup=()=>p().audioSetup??={deviceId:'',channel:'1',monitor:false,latencyMs:0,keepTakes:true};
  const updateRangeIndicator=recordingRangeIndicator({getRange:()=>d.getRecordState().recording?.window||p().recording?.range,busy:()=>d.getRecordState().recording||d.getRecordState().recordFinalizing||d.getRecordState().micPending,open:()=>recordingModal()});
  function routingHTML(t){return `<div class="workflow-routing"><label>SORTIE<select data-route-output="${t.id}" aria-label="Sortie de ${esc(t.name)}"><option value="master">MASTER 1–2</option>${p().tracks.filter(b=>b.type==='bus'&&routeAllowed(p().tracks,t.id,b.id)).map(b=>`<option value="${b.id}" ${t.output===b.id?'selected':''}>${esc(b.name)}</option>`).join('')}</select></label><div class="workflow-label">ENVOIS AUXILIAIRES</div>${(t.sends||[]).map(s=>`<div class="aux-send"><div><strong>${esc(p().tracks.find(b=>b.id===s.target)?.name||'Bus')}</strong><button data-send-toggle="${t.id}:${s.id}" aria-label="Activer l’envoi" aria-pressed="${s.enabled}">${s.enabled?'ON':'OFF'}</button><button data-send-remove="${t.id}:${s.id}" aria-label="Retirer l’envoi">×</button></div><input data-send-level="${t.id}:${s.id}" type="range" min="-60" max="12" step=".5" value="${s.level}" aria-label="Niveau d’envoi ${esc(p().tracks.find(b=>b.id===s.target)?.name||'Bus')}"><label><span data-send-db="${s.id}">${s.level.toFixed(1)} dB</span><input type="number" min="-60" max="12" step="0.5" value="${s.level}" data-send-level="${t.id}:${s.id}" aria-label="Niveau précis en dB vers ${esc(p().tracks.find(b=>b.id===s.target)?.name||'Bus')}"><select data-send-position="${t.id}:${s.id}" aria-label="Position de l’envoi"><option value="post" ${!s.pre?'selected':''}>Post-fader</option><option value="pre" ${s.pre?'selected':''}>Pré-fader</option></select></label></div>`).join('')}<select data-send-add="${t.id}" aria-label="Ajouter un envoi" ${(t.sends||[]).length>=8?'disabled':''}><option value="">+ Envoi vers un bus…</option>${p().tracks.filter(b=>b.type==='bus'&&routeAllowed(p().tracks,t.id,b.id)&&!(t.sends||[]).some(s=>s.target===b.id)).map(b=>`<option value="${b.id}">${esc(b.name)}</option>`).join('')}</select><button class="outline-btn" data-create-bus>+ Créer un bus / auxiliaire</button></div>`;}
  function refreshRoutingPanel(){const root=$('routingPanel');if(!root||!$('modal').open)return;const t=p().tracks.find(t=>t.id===root.dataset.routingTrack);if(!t)return;root.innerHTML=routingHTML(t);}
  function routingChanged(){d.changed(true);refreshRoutingPanel();}
  function routingModal(id){const t=p().tracks.find(t=>t.id===id);if(!t)return;d.modal('Sortie et envois · '+t.name,`<div id="routingPanel" data-routing-track="${esc(t.id)}">${routingHTML(t)}</div>`,'WARLIKE / MIX');}
  function renderInspector(){const t=track();if(!t)return;const root=$('trackInspector');root.querySelector('.inspector-route')?.remove();root.querySelector('.workflow-inspector')?.remove();root.insertAdjacentHTML('beforeend',`<div class="workflow-inspector">${routingHTML(t)}<div class="workflow-label">AUTOMATION</div><button class="outline-btn" data-automation-track="${t.id}">${(t.automation?.mode||'off').toUpperCase()} · Éditer les courbes</button>${t.type==='audio'?`<div class="workflow-label">PRISES & MONTAGE</div><button class="outline-btn" data-playlists-track="${t.id}">Prises / comping ${t.playlists?.length?'('+t.playlists.length+')':''}</button>`:''}<button class="outline-btn" data-freeze-track="${t.id}">${t.frozenTrack?'Dégeler la piste':'Geler la piste en audio'}</button></div>`);}
  function renderMixer(){for(const t of p().tracks){const root=document.querySelector(`[data-mixer-track="${t.id}"] .channel-routing`);if(root)root.innerHTML=`<select data-route-output="${t.id}" aria-label="Sortie de ${esc(t.name)}"><option value="master">MASTER 1–2</option>${p().tracks.filter(b=>b.type==='bus'&&routeAllowed(p().tracks,t.id,b.id)).map(b=>`<option value="${b.id}" ${t.output===b.id?'selected':''}>${esc(b.name)}</option>`).join('')}</select><button class="channel-auto" data-routing-track="${t.id}" aria-label="Régler les envois de ${esc(t.name)}">ENVOIS · ${(t.sends||[]).length}</button><button class="channel-auto" data-automation-track="${t.id}">${(t.automation?.mode||'off').toUpperCase()}</button>`; const channel=root?.closest('.mixer-channel');if(channel){channel.querySelector('.pt-send-bank')?.remove();const sends=t.sends||[];root.querySelector('.pt-io-summary')?.remove();root.insertAdjacentHTML('afterbegin',`<span class="pt-io-summary" title="Destination principale">OUT · ${esc(p().tracks.find(b=>b.id===t.output)?.name||'MASTER 1–2')}</span>`);const input=channel.querySelector('.channel-input-slot');if(input){input.querySelector('.pt-io-summary')?.remove();const sources=p().tracks.filter(b=>b.id!==t.id&&(b.output===t.id||(b.sends||[]).some(s=>s.target===t.id&&s.enabled)));input.insertAdjacentHTML('beforeend',`<small class="pt-io-summary" title="${esc(sources.map(b=>b.name).join(', '))}">${t.type==='bus'?'IN · '+sources.length+' source(s)':'IN · Canal '+(t.recordInput==='2'?'2':'1')}</small>`);}root.insertAdjacentHTML('beforebegin',`<section class="pt-send-bank" aria-label="Envois de ${esc(t.name)}"><div>SENDS A–E</div>${Array.from({length:8},(_,i)=>{const s=sends[i],name=s?esc(p().tracks.find(b=>b.id===s.target)?.name||'Bus'):'—';return `${i===5?'<div>SENDS F–H</div>':''}<button type="button" class="pt-send-slot ${s&&!s.enabled?'send-off':''}" data-routing-track="${t.id}" aria-label="Envoi ${String.fromCharCode(65+i)} de ${esc(t.name)}" title="${name}"><span>${String.fromCharCode(65+i)} · ${name}</span><small>${s?(s.enabled?s.level.toFixed(1)+' dB':'OFF')+' '+(s.pre?'PRE':'POST'):'+'}</small></button>`;}).join('')}</section>`);} }renderFLRouting();}
  function renderFLRouting(){
    const root=document.querySelector('.fl-mixer-effects');if(!root)return;
    root.querySelector('.fl-routing-panel')?.remove();
    const owner=root.querySelector('[data-add-insert-track]')?.dataset.addInsertTrack;
    const t=p().tracks.find(track=>track.id===owner);
    const panel=document.createElement('section');panel.className='fl-routing-panel';
    if(!t){panel.innerHTML='<h3>ROUTAGE · MASTER</h3><p>Sortie stéréo 1–2</p>';root.append(panel);return;}
    const destination=p().tracks.find(track=>track.id===t.output)?.name||'MASTER';
    panel.innerHTML='<h3>ROUTAGE AUDIO</h3><div class="fl-route-diagram"><span>'+esc(t.name)+'</span><i aria-hidden="true"></i><span>'+esc(destination)+'</span></div>'+routingHTML(t);
    root.append(panel);
  }
  function renderAudioEditor(){const c=clip(),t=track();if(t?.type!=='audio'||!c)return;$('editorContent').insertAdjacentHTML('beforeend',`<div class="audio-edit-actions"><button class="outline-btn" data-audio-properties>Fondus / durée / hauteur</button><button class="outline-btn" data-playlists-track="${t.id}">Prises / comping</button><button class="outline-btn" data-crossfade>Fondu croisé</button><button class="outline-btn" data-group-clips>Grouper la sélection</button><button class="outline-btn" data-ungroup-clips>Dégrouper</button><button class="outline-btn" data-batch-gain>Gain de la sélection</button></div>`);}
  function renderTimeline(){for(const t of p().tracks){const row=document.querySelector(`[data-track="${t.id}"] .track-lane`);if(!row)continue;row.querySelector('.automation-lane')?.remove();const points=t.automation?.curves?.volume;if(points?.length&&t.automation.mode!=='off'){const line=points.map(a=>`${a.bar/p().bars*1000},${60-(a.value+48)}`).join(' ');row.insertAdjacentHTML('beforeend',`<svg class="automation-lane" viewBox="0 0 1000 60" preserveAspectRatio="none" aria-label="Automation de volume"><polyline points="${line}"/></svg>`);}}}
  function busModal(){d.modal('Créer un bus / auxiliaire',`<form class="workflow-form" id="busForm"><label>Nom du bus<input id="busName" value="VOX" maxlength="60"></label><p>Ce bus démarre sans plugin. Choisis ensuite les pistes qui doivent y sortir, ou crée un envoi pour un effet parallèle.</p><button type="submit" class="primary-btn">Créer le bus</button></form>`,'WARLIKE / ROUTAGE');$('busForm').onsubmit=e=>{e.preventDefault();const name=$('busName').value.trim()||'BUS',t=d.addTrack('bus');t.name=name;d.changed(true);$('modal').close();};}
  function audioProperties(){const c=clip();if(!c?.audioId){d.toast('Sélectionne un clip audio.');return;}const t=track(),duration=c.length*240/p().bpm;d.modal('Montage · '+c.name,`<div class="workflow-form"><div class="workflow-grid"><label>Fondu d’entrée (ms)<input id="fadeInMs" type="number" min="0" max="${duration*1000}" value="${Math.round((c.fadeIn??.005)*1000)}"></label><label>Fondu de sortie (ms)<input id="fadeOutMs" type="number" min="0" max="${duration*1000}" value="${Math.round((c.fadeOut??.005)*1000)}"></label></div><label>Courbe<select id="fadeShape"><option value="linear">Linéaire</option><option value="equalPower" ${c.fadeCurve==='equalPower'?'selected':''}>Puissance égale</option></select></label><button class="primary-btn" id="applyFades">Appliquer les fondus</button><hr><div class="workflow-grid"><label>Durée cible (mesures)<input id="stretchLength" type="number" min="${c.length*.5}" max="${c.length*2}" step=".001" value="${c.length}"></label><label>Transposition (demi-tons)<input id="transposeSemitones" type="number" min="-12" max="12" step="1" value="0"></label></div><p>Étirement WSOLA de 50 à 200 %, hauteur conservée. Pour une voix, TUNE reste disponible séparément. L’original est conservé ; les transitoires et les sons complexes peuvent demander un autre réglage.</p><button class="outline-btn" id="applyStretch">Calculer le nouvel audio</button><button class="text-btn" id="cancelStretch" hidden>Annuler le calcul</button>${c.editOriginal?'<button class="outline-btn" id="restoreEditSource">Restaurer l’audio avant étirement</button>':''}<output id="stretchProgress"></output></div>`,'WARLIKE / AUDIO');
    const tools=document.createElement('section');tools.className='clip-source-tools';tools.innerHTML='<h4>PROPRIÉTÉS DU CLIP AUDIO</h4><p>Crée une nouvelle version de cet extrait. Les autres clips utilisant le fichier restent inchangés.</p><div class="workflow-grid"><label><input type="checkbox" id="clipReverse"> Reverse</label><label><input type="checkbox" id="clipInvert"> Inverser la polarité</label><label><input type="checkbox" id="clipDc"> Retirer le continu</label><label><input type="checkbox" id="clipSwap"> Échanger gauche / droite</label><label><input type="checkbox" id="clipNormalize"> Normaliser à −6 dBFS et remettre le gain du clip à zéro</label></div><button class="outline-btn" id="applyClipTransform">Créer la version du clip</button>';$('modalBody').querySelector('.workflow-form').append(tools);
    $('applyClipTransform').onclick=async()=>{try{const a=assets().get(c.audioId);if(!a)return;await engine().init();const offset=Math.floor((c.sourceOffset||0)*a.buffer.sampleRate),frames=Math.min(a.buffer.length-offset,Math.round(c.length*240/p().bpm*a.buffer.sampleRate));if(frames<1)throw Error('Extrait audio vide.');const options={reverse:$('clipReverse').checked,invert:$('clipInvert').checked,dc:$('clipDc').checked,swap:$('clipSwap').checked,normalise:$('clipNormalize').checked};if(!Object.values(options).some(Boolean))return d.toast('Choisis une transformation.');const channels=Array.from({length:a.buffer.numberOfChannels},(_,i)=>a.buffer.getChannelData(i).slice(offset,offset+frames)),processed=transformAudioChannels(channels,options),buffer=engine().ctx.createBuffer(processed.length,frames,a.buffer.sampleRate);processed.forEach((data,i)=>buffer.copyToChannel(data,i));d.checkpoint();c.editOriginal=c.editOriginal||{audioId:c.audioId,sourceOffset:c.sourceOffset||0,length:c.length,start:c.start,gainDb:c.gainDb};const id=uid();assets().set(id,{name:a.name+' · version',buffer,data:encodeWav(buffer,{bits:32})});c.audioId=id;c.sourceOffset=0;if(options.normalise)c.gainDb=0;d.changed(true);$('modal').close();d.toast('Version audio créée. Le fichier original est conservé.');}catch(error){d.toast(error.message);}};
    $('applyFades').onclick=()=>{d.checkpoint();c.fadeIn=Math.max(0,Math.min(duration,Number($('fadeInMs').value)/1000||0));c.fadeOut=Math.max(0,Math.min(duration,Number($('fadeOutMs').value)/1000||0));c.fadeCurve=$('fadeShape').value;d.changed(true);$('modal').close();};
    if($('restoreEditSource'))$('restoreEditSource').onclick=()=>{d.checkpoint();const old=clone(c.editOriginal);Object.assign(c,old);delete c.editOriginal;d.changed(true);$('modal').close();};
    $('applyStretch').onclick=()=>{if(stretchWorker)return;const a=assets().get(c.audioId);if(!a)return;const newLength=Number($('stretchLength').value),ratio=newLength/c.length,semitones=Number($('transposeSemitones').value);if(!Number.isFinite(ratio)||ratio<.5||ratio>2||!Number.isFinite(semitones)||Math.abs(semitones)>12||duration>300){d.toast('Choisis une durée de 50 à 200 %, un clip de moins de cinq minutes et une transposition de −12 à +12.');return;}const n=Math.min(Math.round(duration*a.buffer.sampleRate),a.buffer.length-Math.round((c.sourceOffset||0)*a.buffer.sampleRate));if(n<1)return;const channels=Array.from({length:a.buffer.numberOfChannels},(_,i)=>a.buffer.getChannelData(i).slice(Math.round((c.sourceOffset||0)*a.buffer.sampleRate),Math.round((c.sourceOffset||0)*a.buffer.sampleRate)+n));
      stretchWorker=new Worker(new URL('./stretch-worker.js?v=0.14.0',import.meta.url),{type:'module'});$('applyStretch').disabled=true;$('cancelStretch').hidden=false;
      const done=()=>{stretchWorker?.terminate();stretchWorker=null;if($('applyStretch'))$('applyStretch').disabled=false;if($('cancelStretch'))$('cancelStretch').hidden=true;};
      $('cancelStretch').onclick=()=>{done();if($('stretchProgress'))$('stretchProgress').textContent='Calcul annulé.';};
      stretchWorker.onmessage=async({data})=>{if(data.progress!==undefined){if($('stretchProgress'))$('stretchProgress').textContent=data.progress+' %';return;}if(data.error){done();d.toast(data.error);return;}done();try{await engine().init();const buffer=engine().ctx.createBuffer(data.channels.length,data.channels[0].length,a.buffer.sampleRate);data.channels.forEach((ch,i)=>buffer.copyToChannel(ch,i));d.checkpoint();const original=c.editOriginal||clone(c),id=uid();assets().set(id,{name:c.name+' · montage',buffer,data:encodeWav(buffer,{bits:32})});c.editOriginal=original;c.audioId=id;c.sourceOffset=0;c.length=buffer.duration/(240/p().bpm);p().bars=fitSession(p().bars,c.start+c.length);d.changed(true);$('modal').close();d.toast('Nouvel audio calculé. L’original reste récupérable.');}catch(error){d.toast(error.message);}};
      stretchWorker.onerror=()=>{done();d.toast('Le calcul audio a échoué.');};stretchWorker.postMessage({channels,sampleRate:a.buffer.sampleRate,ratio,semitones},channels.map(c=>c.buffer));
    };
  }
  function playlistsModal(id,selection=null){if(d.getRecordState().recording||d.getRecordState().recordFinalizing||d.getRecordState().micPending){d.toast('Termine la prise avant de comparer les playlists.');return;}takeLanesDispose?.();takeLanesDispose=null;const t=p().tracks.find(t=>t.id===id);if(t?.type!=='audio')return;ensurePlaylists(t,uid);saveActivePlaylist(t);d.save();const continuing=canContinueComp(t),storedFade=t.playlists.find(l=>l.id===t.activePlaylist)?.comp?.fadeMs,fadeMs=Number.isFinite(storedFade)&&storedFade>=0&&storedFade<=50?storedFade:8;
    d.modal('Prises · '+t.name,`<div class="workflow-form"><label>Playlist active dans le montage<select id="activePlaylist" aria-label="Playlist active">${t.playlists.map(l=>`<option value="${l.id}" ${l.id===t.activePlaylist?'selected':''}>${esc(l.name)} · ${l.clips.length} clip(s)</option>`).join('')}</select></label><label>Nom<input id="playlistName" value="${esc(t.playlists.find(l=>l.id===t.activePlaylist).name)}" maxlength="60"></label><div class="workflow-row"><button class="outline-btn" id="renamePlaylist">Renommer</button><button class="outline-btn" id="copyPlaylist">Dupliquer la playlist</button><button class="outline-btn" id="emptyPlaylist">Nouvelle playlist vide</button></div><hr><strong>COMPING · Construire un montage</strong><label>Prise source<select id="compSource">${t.playlists.filter(l=>l.id!==t.activePlaylist).map(l=>`<option value="${l.id}">${esc(l.name)}</option>`).join('')}</select></label><div class="workflow-grid"><label>Début (mesure)<input id="compStart" type="number" step=".0625" min="1" value="${clip()?.start+1||engine().getPosition()/16+1}"></label><label>Fin (mesure)<input id="compEnd" type="number" step=".0625" min="1" value="${clip()?clip().start+clip().length+1:engine().getPosition()/16+2}"></label></div><label>Destination<select id="compDestination"><option value="new">Nouvelle playlist Montage</option>${continuing?'<option value="append" selected>Continuer ce montage</option>':''}</select></label><label>Fondus de raccord (ms)<input id="compFadeMs" type="number" min="0" max="50" step="0.5" value="${fadeMs}"></label><small>0 désactive les fondus des nouveaux raccords. Les clips courts limitent automatiquement leur durée ; les prises source restent intactes.</small><label>Ajustement de l’extrait (dB)<input id="compGainDb" type="number" min="-24" max="24" step="0.5" value="0"></label><small>Ajouté au gain de la prise source, seulement sur les nouveaux extraits. 0 conserve leur niveau ; le gain final doit rester entre −24 et +36 dB.</small><div class="workflow-row" role="group" aria-label="Comparer le montage"><button class="outline-btn" id="previewCompBefore" aria-pressed="false">A · Avant montage</button><button class="outline-btn" id="previewComp" aria-pressed="false">B · Après montage</button></div><small>A écoute le montage actuel ; B écoute le nouvel extrait avec son gain et ses fondus. Chaque écoute repart du même début, avec un temps avant et après les raccords. ${continuing?'Continue le montage actuel ou crée une nouvelle playlist.':'Crée une playlist Montage indépendante pour assembler tes extraits.'} Les prises d’origine restent conservées.</small><button class="primary-btn" id="applyComp" ${t.playlists.length<2?'disabled':''}>${continuing?'Ajouter l’extrait à ce montage':'Créer une playlist de montage'}</button><p>Les autres playlists restent intactes. Les découpes conservent leurs références audio ; de courts fondus sont ajoutés aux nouvelles coupes. Pendant une nouvelle prise superposée, une playlist est créée automatiquement si l’option est activée.</p></div>`,'WARLIKE / PLAYLISTS');
    if(selection){$('compStart').value=String(selection.range.start+1);$('compEnd').value=String(selection.range.end+1);$('compSource').value=selection.sourceId;}
    $('compDestination').onchange=()=>{$('applyComp').textContent=$('compDestination').value==='append'?'Ajouter l’extrait à ce montage':'Créer une playlist de montage';};
    const choose=id=>{takeLanesDispose?.();engine().pause();d.checkpoint();switchPlaylist(t,id);d.selectTrack(t.id,t.clips[0]?.id);d.changed(true);playlistsModal(t.id);};
    takeLanesDispose=mountTakeLanes({root:$('modalBody').querySelector('.workflow-form'),track:t,project:p(),engine:engine(),assets:assets(),toast:d.toast,updateTransport:d.updateTransport,esc,onChoose:choose,busy:()=>d.getRecordState().recording||d.getRecordState().recordFinalizing||d.getRecordState().micPending});
    $('activePlaylist').onchange=e=>choose(e.target.value);
    $('renamePlaylist').onclick=()=>{d.checkpoint();t.playlists.find(l=>l.id===t.activePlaylist).name=$('playlistName').value.trim()||'Prise';d.changed();playlistsModal(t.id);};
    for(const [id,empty] of [['copyPlaylist',false],['emptyPlaylist',true]])$(id).onclick=()=>{engine().pause();d.checkpoint();newPlaylist(t,uid,{empty,name:'Prise '+(t.playlists.length+1)});d.selectTrack(t.id,t.clips[0]?.id);d.changed(true);playlistsModal(t.id);};
    const prepare=()=>{if(d.getRecordState().recording||d.getRecordState().recordFinalizing||d.getRecordState().micPending)throw Error('Termine la prise avant ce montage.');const prepared=prepareComp(p(),t.id,$('compSource').value,{start:Number($('compStart').value)-1,end:Number($('compEnd').value)-1},uid,{mode:$('compDestination').value,fadeMs:$('compFadeMs').value.trim()===''?NaN:Number($('compFadeMs').value),gainOffsetDb:$('compGainDb').value.trim()===''?NaN:Number($('compGainDb').value)});for(const piece of prepared.clips)if(!assets().get(piece.audioId)?.buffer)throw Error('Audio source manquant pour ce montage.');return prepared;};
    $('previewCompBefore').onclick=async()=>{try{if(d.getRecordState().recording||d.getRecordState().recordFinalizing||d.getRecordState().micPending)throw Error('Termine la prise avant cette écoute.');const context=compContext({start:Number($('compStart').value)-1,end:Number($('compEnd').value)-1},p().bars);for(const c of t.clips)if(c.audioId&&c.start<context.end&&c.start+c.length>context.start&&!assets().get(c.audioId)?.buffer)throw Error('Audio manquant dans le montage actuel.');await takeLanesDispose.listenComp(t.clips,context,'before');}catch(error){d.toast(error.message);}};
    $('previewComp').onclick=async()=>{try{const prepared=prepare();await takeLanesDispose.listenComp(prepared.clips,compContext(prepared.range,p().bars));}catch(error){d.toast(error.message);}};
    $('applyComp').onclick=()=>{try{const prepared=prepare();takeLanesDispose?.();engine().pause();d.checkpoint();const playlist=commitComp(t,prepared,uid);d.selectTrack(t.id,prepared.pieces[0].id);d.changed(true);if(prepared.mode==='append')playlistsModal(t.id,prepared);else $('modal').close();d.toast(playlist.name+(prepared.mode==='append'?' mis à jour':' créé')+' ; les prises source sont conservées.');}catch(error){d.toast(error.message);}};
  }
  function automationModal(id,key='volume'){
    const t=p().tracks.find(t=>t.id===id);if(!t)return;t.automation??={mode:'off',curves:{}};t.automation.curves??={};curveTrack=id;const params=automationParameters(t),def=params.find(a=>a.key===key)||params[0];selectedCurve=def.key;const points=t.automation.curves[def.key]||[];
    d.modal('Automation · '+t.name,`<div class="workflow-form"><div class="workflow-grid"><label>Mode<select id="automationMode"><option value="off">OFF · Manuel</option><option value="read" ${t.automation.mode==='read'?'selected':''}>READ · Lire les courbes</option><option value="write" ${t.automation.mode==='write'?'selected':''}>WRITE · Enregistrer mes gestes</option></select></label><label>Paramètre<select id="automationTarget">${params.map(a=>`<option value="${a.key}" ${a.key===def.key?'selected':''}>${esc(a.name)}</option>`).join('')}</select></label></div><svg id="automationCurve" class="automation-editor" viewBox="0 0 800 180" preserveAspectRatio="none" aria-label="Courbe d’automation"><path d="M0 90H800M0 179H800"/><polyline points="${[{bar:0,value:pointValue(points,0,def.value)},...points,{bar:p().bars,value:pointValue(points,p().bars,def.value)}].map(a=>`${a.bar/p().bars*800},${180-(a.value-def.min)/(def.max-def.min)*180}`).join(' ')}"/>${points.map(a=>`<circle cx="${a.bar/p().bars*800}" cy="${180-(a.value-def.min)/(def.max-def.min)*180}" r="4"/>`).join('')}</svg><small>Clique pour ajouter un point, glisse pour le déplacer et clique droit pour l’effacer. La largeur correspond à toute la session (${p().bars} mesures).</small><div class="workflow-grid"><label>Mesure<input id="automationBar" type="number" min="1" max="${p().bars+1}" step=".0625" value="${(engine().getPosition()/16+1).toFixed(3)}"></label><label>Valeur (${def.min} à ${def.max})<input id="automationValue" type="number" min="${def.min}" max="${def.max}" step="any" value="${def.value}"></label></div><div class="workflow-row"><button class="primary-btn" id="addAutomationPoint">Ajouter / remplacer un point</button><button class="outline-btn" id="clearAutomation">Effacer cette courbe</button></div><div class="automation-points">${points.map((a,i)=>`<div><span>Mesure ${(a.bar+1).toFixed(3)}</span><strong>${a.value.toFixed(3)}</strong><button data-delete-auto-point="${i}">×</button></div>`).join('')||'<p>Aucun point.</p>'}</div><p>READ suit les courbes à la lecture et à l’export. WRITE enregistre les mouvements des faders, panoramiques, envois et paramètres proposés ici. Le calcul des courbes utilise l’horloge audio.</p></div>`,'WARLIKE / AUTOMATION');
    $('automationMode').onchange=e=>{d.checkpoint();t.automation.mode=e.target.value;d.changed(true);};$('automationTarget').onchange=e=>automationModal(id,e.target.value);
    const add=(bar,value)=>{if(!Number.isFinite(bar)||!Number.isFinite(value))return;d.checkpoint();putPoint(t,def.key,Math.max(0,Math.min(p().bars,bar)),Math.max(def.min,Math.min(def.max,value)),def.value);if(t.automation.mode==='off')t.automation.mode='read';d.changed(true);automationModal(id,def.key);};
    $('addAutomationPoint').onclick=()=>add(Number($('automationBar').value)-1,Number($('automationValue').value));
    $('modalBody').querySelector('.automation-points')?.remove();
    mountAutomationEditor({svg:$('automationCurve'),track:t,key:def.key,def,bars:p().bars,checkpoint:d.checkpoint,changed:()=>d.changed(),onValues:point=>{$('automationBar').value=(point.bar+1).toFixed(3);$('automationValue').value=point.value.toFixed(3);}});
    $('clearAutomation').onclick=()=>{d.checkpoint();delete t.automation.curves[def.key];d.changed(true);automationModal(id,def.key);};
    for(const b of document.querySelectorAll('[data-delete-auto-point]'))b.onclick=()=>{d.checkpoint();points.splice(Number(b.dataset.deleteAutoPoint),1);d.changed(true);automationModal(id,def.key);};
  }
  function controlAutomation(e){if(!engine().playing)return;const el=e.target;let t,key,value=Number(el.value);if(!Number.isFinite(value))return;
    if(el.dataset.volume||el.dataset.volumeNumber){t=p().tracks.find(t=>t.id===(el.dataset.volume||el.dataset.volumeNumber));key='volume';}else if(el.dataset.pan||el.dataset.panNumber){t=p().tracks.find(t=>t.id===(el.dataset.pan||el.dataset.panNumber));key='pan';if(el.dataset.panNumber){if(!String(el.value).trim())return;value=Math.max(-100,Math.min(100,value))/100;}}else if(el.dataset.sendLevel){const [id,sid]=el.dataset.sendLevel.split(':');t=p().tracks.find(t=>t.id===id);key='send:'+sid;}else if(el.dataset.param){const [target,param]=el.dataset.param.split('.');if(target==='instrument')return;const owner=el.closest('[data-plugin-track]');t=owner?p().tracks.find(t=>t.id===owner.dataset.pluginTrack):track();key=target+':'+param;}
    if(t?.automation?.mode==='write'&&key){const def=automationParameters(t).find(a=>a.key===key);if(def)putPoint(t,key,engine().getPosition()/16,value,def.value);}
  }
  document.addEventListener('input',controlAutomation,{capture:true});
  function exportModal(){if(exporting){d.toast('Un export est déjà en cours.');return;}d.modal('Exporter le morceau',`<div class="workflow-form"><div class="workflow-grid"><label>Destination<select id="exportMode"><option value="mix">Mix stéréo</option><option value="track">Piste / bus sélectionné</option><option value="stems">Toutes les pistes et bus · ZIP</option><option value="buses">Bus uniquement · ZIP</option></select></label><label>Traitements<select id="exportProcessing"><option value="wet">Avec les effets choisis</option><option value="clean">Sans les inserts</option></select></label><label>Fréquence<select id="exportRate"><option value="44100">44,1 kHz</option><option value="48000" selected>48 kHz</option><option value="96000">96 kHz</option></select></label><label>Résolution<select id="exportBits"><option value="16">16 bits PCM</option><option value="24" selected>24 bits PCM</option><option value="32">32 bits flottants</option></select></label><label>Début (mesure)<input id="exportStart" type="number" min="1" max="${p().bars}" value="1" step=".0625"></label><label>Fin exclue (mesure)<input id="exportEnd" type="number" min="1" max="${p().bars+1}" value="${p().bars+1}" step=".0625"></label></div><label class="workflow-check"><input id="exportTail" type="checkbox" checked> Inclure les queues d’effets</label><label class="workflow-check"><input id="exportDither" type="checkbox"> Dither TPDF pour le PCM 16 / 24 bits</label><p>Les fichiers d’un même export ont le même début et la même durée. Les stems de bus contiennent les pistes qui y sont routées. Le mix inclut le master ; les stems sont pris avant les inserts du master.</p>${typeof globalThis.showSaveFilePicker==='function'?'<label class="workflow-check"><input id="exportDirect" type="checkbox"> Enregistrer le mix ou la piste directement dans un fichier pour réduire la mémoire utilisée</label>':''}<button id="runExport" class="primary-btn">Lancer l’export</button><button id="cancelExport" class="text-btn" hidden>Arrêter l’export</button><a id="downloadRendered" class="primary-btn export-ready-link" hidden>Télécharger le rendu</a><output id="exportProgress"></output></div>`,'WARLIKE / BOUNCE');
    showExportLink();
    const direct=$('exportDirect'),modeControl=$('exportMode');
    if(direct)modeControl.onchange=()=>{direct.disabled=['stems','buses'].includes(modeControl.value);if(direct.disabled)direct.checked=false;};
    $('runExport').onclick=async()=>{
      if(exporting||d.getRecordState().recording||d.getRecordState().recordFinalizing||d.getRecordState().micPending)return;
      const project=clone(p()),exportEngine=engine(),exportName=safe(project.name),options={sampleRate:Number($('exportRate').value),bits:Number($('exportBits').value),startBar:Number($('exportStart').value)-1,endBar:Number($('exportEnd').value)-1,tail:$('exportTail').checked,dither:$('exportDither').checked,clean:$('exportProcessing').value==='clean',project,assets:new Map(assets())},mode=modeControl.value;
      if(![options.startBar,options.endBar].every(Number.isFinite)||options.startBar<0||options.endBar>project.bars||options.endBar<=options.startBar){d.toast('Choisis une plage valide.');return;}
      const selected=project.tracks.find(t=>t.id===track()?.id),destinations=mode==='mix'?[null]:mode==='track'?(selected?[selected]:[]):project.tracks.filter(t=>mode==='buses'?t.type==='bus':true);
      if(!destinations.length){d.toast(mode==='track'?'Sélectionne une piste à exporter.':'Crée au moins un bus à exporter.');return;}
      const archive=['stems','buses'].includes(mode),toFile=!archive&&direct?.checked,filename=exportName+'_'+safe(destinations[0]?.name||'Mix')+'.wav';
      const controller=new AbortController(),controls=[...$('modalBody').querySelectorAll('input,select,button')].filter(el=>el.id!=='cancelExport'),previous=controls.map(el=>el.disabled),files=[];
      const progress=text=>{if($('exportProgress'))$('exportProgress').textContent=text;};
      exporting=true;controls.forEach(el=>el.disabled=true);$('cancelExport').hidden=false;
      $('cancelExport').onclick=()=>{controller.abort();progress('Arrêt demandé. Si le mix est en cours de calcul, attendre la fin de cette passe.');};
      let writer;
      try{
        // The picker must open on the original click, before asynchronous rendering.
        if(toFile){
          const handle=await globalThis.showSaveFilePicker({suggestedName:filename,types:[{description:'Audio WAV',accept:{'audio/wav':['.wav']}}]});
          controller.signal.throwIfAborted();writer=await handle.createWritable();
        }
        for(let i=0;i<destinations.length;i++){
          controller.signal.throwIfAborted();const t=destinations[i],label=`${i+1}/${destinations.length} · ${t?.name||'Mix stéréo'}`;
          progress('Calcul du mix '+label+'…');
          const data=await exportEngine.exportWav({...options,captureId:t?.id||null,asBlob:true,writer,signal:controller.signal,onProgress:info=>progress(`Écriture ${label} · ${Math.floor(100*info.frames/info.totalFrames)} %`)});
          if(!writer)files.push({name:exportName+'_'+safe(t?.name||'Mix')+(archive?'_'+String(i+1).padStart(2,'0'):'')+'.wav',data});
        }
        controller.signal.throwIfAborted();
        if(writer){await writer.close();writer=null;progress('Fichier WAV enregistré.');d.toast('Mix enregistré dans le fichier choisi.');return;}
        const blob=archive?await zipWavBlobs(files,{signal:controller.signal,onProgress:info=>progress(`Préparation du ZIP · ${info.files}/${info.totalFiles}`)}):files[0].data;
        controller.signal.throwIfAborted();
        const next={url:URL.createObjectURL(blob),filename:archive?exportName+'_stems.zip':filename};
        if(preparedExport)URL.revokeObjectURL(preparedExport.url);preparedExport=next;showExportLink();
        progress(`${files.length} fichier(s) prêt(s) · ${options.sampleRate/1000} kHz / ${options.bits} bits`);d.toast('Rendu prêt à télécharger.');
      }catch(error){
        if(writer){try{await writer.abort();}catch{}}
        if(error.name==='AbortError'||controller.signal.aborted){progress('Export annulé. Le dernier rendu disponible est conservé.');d.toast('Export annulé.');}
        else{progress('Export impossible : '+error.message);d.toast('Export impossible : '+error.message);}
      }finally{exporting=false;controls.forEach((el,i)=>el.disabled=previous[i]);if($('cancelExport'))$('cancelExport').hidden=true;}
    };
  }

  function renderMastering(){if(analysisProject!==p()){lastAnalysis=null;analysisProject=p();}const root=$('masteringView');if(!root)return;root.querySelector('.loudness-analysis')?.remove();const fmt=n=>Number.isFinite(n)?n.toFixed(1):'−∞';root.insertAdjacentHTML('beforeend',`<section class="loudness-analysis"><div><strong>ANALYSE DU MIX</strong><small>LUFS intégrés · K-weighting et gating · stéréo</small></div><div class="loudness-values"><span>LUFS-I<strong>${lastAnalysis?fmt(lastAnalysis.integrated):'—'}</strong></span><span>LUFS-S MAX<strong>${lastAnalysis?fmt(lastAnalysis.shortMax):'—'}</strong></span><span>CRÊTE dBFS<strong>${lastAnalysis?fmt(lastAnalysis.samplePeak):'—'}</strong></span><span>CRÊTE 4× ESTIMÉE<strong>${lastAnalysis?fmt(lastAnalysis.estimatedPeak):'—'}</strong></span></div><div class="workflow-row"><button class="outline-btn" id="analyseMix" ${analysing?'disabled':''}>${analysing?'Analyse en cours…':'Analyser le mix complet'}</button><label>Cible LUFS<input id="loudnessTarget" type="number" min="-30" max="-6" step="1" value="-14"></label><button class="outline-btn" id="adjustLoudness" ${!lastAnalysis||!Number.isFinite(lastAnalysis.integrated)?'disabled':''}>Ajuster le gain avant chaîne</button></div><p>Réanalyse après modification du mix. La crête interpolée est une estimation et ne remplace pas un mesureur true-peak certifié. La cible reste ton choix ; aucun plugin n’est ajouté.</p><output id="analysisStatus"></output></section>`);
    $('analyseMix').onclick=async()=>{if(analysing)return;analysing=true;renderMastering();let worker;try{const buffer=await engine().renderRange({sampleRate:48000,tail:true});const channels=Array.from({length:buffer.numberOfChannels},(_,i)=>buffer.getChannelData(i).slice());worker=new Worker(new URL('./loudness-worker.js?v=0.14.0',import.meta.url),{type:'module'});const result=await new Promise((resolve,reject)=>{worker.onmessage=({data})=>data.error?reject(Error(data.error)):resolve(data.result);worker.onerror=()=>reject(Error('Analyse audio interrompue.'));worker.postMessage({channels,sampleRate:48000},channels.map(c=>c.buffer));});lastAnalysis=result;d.toast('Analyse du mix terminée.');}catch(error){d.toast(error.message);}finally{worker?.terminate();analysing=false;renderMastering();}};
    $('adjustLoudness').onclick=()=>{if(!lastAnalysis||!Number.isFinite(lastAnalysis.integrated))return;const requested=Number($('loudnessTarget').value)-lastAnalysis.integrated,headroom=-1-lastAnalysis.estimatedPeak,change=Math.min(requested,headroom);d.checkpoint();p().masterVolume=Math.max(-48,Math.min(3,engine().masterVolume+change));d.changed(true);if($('analysisStatus'))$('analysisStatus').textContent='Gain ajusté avec marge de crête estimée. Réanalyse le résultat, surtout si la chaîne master compresse le signal.';};
  }
  function showExportLink(){const a=$('downloadRendered');if(a&&preparedExport){a.hidden=false;a.href=preparedExport.url;a.download=preparedExport.filename;a.textContent='Télécharger '+preparedExport.filename;}}
  async function devices(){if(!navigator.mediaDevices?.enumerateDevices)return [];return (await navigator.mediaDevices.enumerateDevices()).filter(a=>a.kind==='audioinput');}
  async function recordingModal(){const settings=recordingSettings(p().recording),a=setup(),list=await devices().catch(()=>[]);d.modal('Enregistrement audio',`<div class="workflow-form"><label>Entrée audio<select id="inputDevice"><option value="">Entrée système par défaut</option>${list.filter(a=>a.deviceId!=='default').map((v,i)=>`<option value="${esc(v.deviceId)}" ${v.deviceId===a.deviceId?'selected':''}>${esc(v.label||'Entrée '+(i+1))}</option>`).join('')}</select></label><button class="outline-btn" id="refreshInputs">Autoriser le micro / actualiser les entrées</button><label>Canal<select id="inputChannel"><option value="1">Entrée 1 · mono</option><option value="2" ${a.channel==='2'?'selected':''}>Entrée 2 · mono</option><option value="stereo" ${a.channel==='stereo'?'selected':''}>Entrées 1–2 · stéréo</option></select></label><label>Décompte avant la prise<select id="workflowCountIn"><option value="0">Aucun</option><option value="1" ${settings.countInBars===1?'selected':''}>1 mesure</option><option value="2" ${settings.countInBars===2?'selected':''}>2 mesures</option></select></label><label>Gain numérique (dB)<input id="workflowMicGain" type="number" min="0" max="24" step=".5" value="${settings.gainDb}"></label><label class="workflow-check"><input id="inputMonitor" type="checkbox" ${a.monitor?'checked':''}> Écouter l’entrée à travers les inserts de la piste</label><label>Casque · IN 1 (dB)<input id="inputMonitorLevel" type="number" min="-36" max="-6" step="1" value="${a.monitorLevelDb??-18}"></label><label>Casque · IN 2 (dB)<input id="inputMonitorLevel2" type="number" min="-36" max="-6" step="1" value="${a.monitorLevel2Db??-18}"></label><small>Monitoring désactivé par défaut. Utilise un casque, jamais des enceintes proches des micros. L’enregistrement PCM conserve l’entrée avant les effets.</small><label class="workflow-check"><input id="knownCompensation" type="checkbox" ${p().delayCompensation!==false?'checked':''}> Compenser les délais connus des compresseurs dans le routage</label><label class="workflow-check"><input id="keepTakes" type="checkbox" ${a.keepTakes!==false?'checked':''}> Conserver les prises superposées dans des playlists</label><label class="workflow-check"><input id="workflowAutoLevel" type="checkbox" ${settings.autoLevel?'checked':''}> Ajuster le gain du clip après la prise</label><label>Compensation d’enregistrement (ms)<input id="recordLatency" type="number" min="-500" max="1000" step=".1" value="${a.latencyMs||0}"></label><small>Une valeur positive avance la prise. Latence de sortie annoncée par le navigateur : ${engine().ctx?(((engine().ctx.baseLatency||0)+(engine().ctx.outputLatency||0))*1000).toFixed(1)+' ms':'disponible après activation audio'}. La mesure d’entrée demande un bouclage réel.</small><button class="outline-btn" id="calibrateAudio">Mesurer par bouclage sortie → entrée</button><p>Pour la mesure, relie une sortie ligne de l’interface à l’entrée sélectionnée. Un signal bref sera envoyé à faible niveau. Coupe le monitoring direct matériel et le monitoring logiciel pendant ce test.</p><output id="calibrationResult"></output><button class="primary-btn" id="saveAudioSetup">Appliquer les réglages</button></div>`,'WARLIKE / RECORDING');
    const rangeForm=mountRecordingRange($('modalBody').querySelector('.workflow-form'),p(),engine().getPosition()/16,!!(d.getRecordState().recording||d.getRecordState().recordFinalizing||d.getRecordState().micPending));
    const collect=()=>({deviceId:$('inputDevice').value,channel:$('inputChannel').value,monitor:$('inputMonitor').checked,monitorLevelDb:Math.max(-36,Math.min(-6,Number($('inputMonitorLevel').value)||-18)),monitorLevel2Db:Math.max(-36,Math.min(-6,Number($('inputMonitorLevel2').value)||-18)),keepTakes:$('keepTakes').checked,latencyMs:Math.max(-500,Math.min(1000,Number($('recordLatency').value)||0))});
    $('saveAudioSetup').onclick=()=>{let range;try{range=rangeForm.read();}catch(error){d.toast(error.message);return;}d.checkpoint();p().audioSetup=collect();p().delayCompensation=$('knownCompensation').checked;p().recording=recordingSettings({gainDb:Number($('workflowMicGain').value),autoLevel:$('workflowAutoLevel').checked,countInBars:Number($('workflowCountIn').value),range});const rec=d.getRecordState().recording;if(rec)rec.graph.setGain(p().recording.gainDb);d.changed();d.updateTransport();$('modal').close();};
    $('refreshInputs').onclick=async()=>{try{const stream=await navigator.mediaDevices.getUserMedia({audio:true});stream.getTracks().forEach(t=>t.stop());p().audioSetup=collect();await recordingModal();}catch(error){d.toast('Entrée indisponible : '+error.message);}};
    $('calibrateAudio').onclick=async()=>{
      const button=$('calibrateAudio'),a=collect();
      if(d.getRecordState().recording||d.getRecordState().recordFinalizing){$('calibrationResult').textContent='Arrête la prise avant de calibrer.';return;}
      button.disabled=true;
      let stream,graph,capture;
      try{
        await engine().init();
        const ctx=engine().ctx;
        stream=await navigator.mediaDevices.getUserMedia(recordingInputConstraints(a));
        validateRecordingInputChannels(stream.getAudioTracks()[0]?.getSettings?.()||{},[],a.channel);
        graph=createRecordingGraph(ctx,stream,0);
        capture=await createPcmCapture(ctx,graph.inputNode,{channel:a.channel});
        const pulse=ctx.createBuffer(1,Math.round(ctx.sampleRate*.015),ctx.sampleRate);
        const data=pulse.getChannelData(0);
        for(let i=0;i<data.length;i++)data[i]=.08*Math.sin(2*Math.PI*(800+400*i/data.length)*i/ctx.sampleRate)*Math.sin(Math.PI*i/data.length)**2;
        const schedule=ctx.currentTime+.15;
        capture.start(schedule);
        // Separate one-shot sources; AudioBufferSourceNode may only be started once.
        const pulses=[];
        for(const delay of [.35,.7,1.05]){
          const shot=ctx.createBufferSource();shot.buffer=pulse;shot.connect(ctx.destination);shot.start(schedule+delay);pulses.push(shot);
        }
        $('calibrationResult').textContent='Trois impulsions envoyées : analyse du retour câblé…';
        await new Promise(resolve=>setTimeout(resolve,1700));
        const buffer=await capture.stop();capture=null;
        const result=evaluateLoopbackLatency(buffer.getChannelData(0),data,ctx.sampleRate,{expectedTimes:[.35,.7,1.05]});
        if(!result.ok)throw Error(result.reason);
        $('recordLatency').value=result.latencyMs.toFixed(1);
        $('calibrationResult').textContent='Bouclage câblé : '+result.latencyMs.toFixed(2)+' ms, variation '+result.spreadMs.toFixed(2)+' ms (3 mesures). Clique « Appliquer les réglages » pour enregistrer la compensation. Ce test ne mesure pas directement la latence du casque.';
        window.dispatchEvent(new CustomEvent('warlike:recording-loopback-measurement',{detail:{...result,at:Date.now()}}));
      }catch(error){$('calibrationResult').textContent='Calibration non validée : '+error.message;}
      finally{
        try{capture?.dispose();}catch{}
        graph?.dispose();stream?.getTracks().forEach(t=>t.stop());
        if($('calibrateAudio'))$('calibrateAudio').disabled=false;
      }
    };
  }
  // Both armed mono inputs are captured by a single stereo worklet on the
  // same AudioContext clock. This avoids drift between independent recorders.
  const seriesSignature=()=>JSON.stringify({bpm:p().bpm,recording:recordingSettings(p().recording),audioSetup:setup(),armed:armedRecordingTracks(p()).map(a=>[a.track.id,a.channel])});
  const seriesMatches=series=>{try{return p()===series.project&&series.signature===seriesSignature()&&(!series.target||p().tracks.includes(series.target))&&!document.hidden;}catch{return false;}};
  async function record(series=null){
    if(d.getRecordState().recording){await stopRecording();return;}
    if(d.getRecordState().recordFinalizing||d.getRecordState().micPending)return;
    if(series&&(recordingSeries!==series||!series.state.active||!seriesMatches(series)))return;
    const request={cancelled:false,project:p(),bpm:p().bpm};pendingRecord=request;
    const checkRequest=()=>{if(request.cancelled||pendingRecord!==request||series&&(!series.state.active||!seriesMatches(series)))throw new DOMException('Préparation annulée.','AbortError');if(p()!==request.project||p().bpm!==request.bpm)throw Error('Le projet ou le tempo a changé pendant la préparation. Relance la prise.');};
    let stream,graph,capture,journal,activeRec=null,previousLoop;
    d.setFlags({micPending:true});d.updateTransport();
    try{
      stopTest();await engine().init();
      checkRequest();
      if(!navigator.mediaDevices?.getUserMedia||!engine().ctx.audioWorklet)throw Error('La capture PCM nécessite HTTPS et AudioWorklet.');
      const a=setup(),assignments=armedRecordingTracks(p());
      const window=recordingWindow(p().recording?.range,p());
      if(window&&window.seconds<=Math.abs(a.latencyMs||0)/1000)throw Error('La compensation de latence est plus longue que la plage de prise.');
      if(!series&&window?.takes>1){if(document.hidden)throw Error('Garde Studio visible pour lancer une série.');series=createRecordingSeries(window.takes);series.project=p();series.signature=seriesSignature();recordingSeries=series;}
      stream=await navigator.mediaDevices.getUserMedia(recordingInputConstraints(a,assignments));
      request.stream=stream;
      checkRequest();
      validateRecordingInputChannels(stream.getAudioTracks()[0]?.getSettings?.()||{},assignments,a.channel);
      let t=series?.target||track();if(!assignments.length&&t.type!=='audio')t=d.addTrack('audio');
      const targets=assignments.length?assignments:[{track:t,channel:a.channel==='2'?'2':'1'}];
      if(series&&!series.target)series.target=targets[0].track;
      const mode=assignments.length?captureChannelMode(assignments):a.channel;
      engine().pause();engine().patternMode=null;engine().clipPreview=null;engine().takePreview=null;
      const originalPosition=engine().position;if(window){request.returnPosition=originalPosition;engine().position=window.playbackStart*16;}
      const start=window?window.start*16:engine().position;previousLoop=engine().loop;engine().loop=false;
      request.previousLoop=previousLoop;
      const countBars=recordingSettings(p().recording).countInBars;
      if(countBars||window?.preRollSeconds)await engine().prepareInstruments(engine().ctx,engine().getPlaybackProject());
      checkRequest();
      graph=createRecordingGraph(engine().ctx,stream,recordingSettings(p().recording).gainDb);
      try{
        journal=await beginRecordingJournal({sampleRate:engine().ctx.sampleRate,channels:mode==='stereo'?2:1,projectName:p().name||'Session',onError:error=>{if(activeRec&&d.getRecordState().recording===activeRec){d.toast('Stockage de secours interrompu : '+error.message+'. Finalisation de la prise.');void stopRecording();}}});
      }catch(error){
        journal=null;series?.cancel();d.toast('Sauvegarde de secours indisponible : '+error.message+'. Termine et exporte chaque prise.');
      }
      checkRequest();
      const signalDiagnostics=createRecordingSignalDiagnostics({sampleRate:engine().ctx.sampleRate,channels:mode==='stereo'?2:1});
      capture=await createPcmCapture(engine().ctx,graph.inputNode,{
        channel:mode,
        onComplete:()=>{if(activeRec&&d.getRecordState().recording===activeRec)void stopRecording({automatic:true});},
        onChunk:channels=>{signalDiagnostics.add(channels);journal?.append(channels);},
        // With a durable journal available, keep only the current PCM group
        // in memory. Fallback to the legacy in-RAM capture if IndexedDB fails to open.
        retainChunks:!journal,
        onError:error=>{if(activeRec&&d.getRecordState().recording===activeRec){d.toast(error.message+' · Finalisation de la prise partielle.');void stopRecording();}}
      });
      checkRequest();
      if(a.monitor){
        graph.monitorMany(targets.map(({track,channel})=>({
          target:engine().channels.get(track.id).input,
          channel:channel==='2'?'2':'1',
          levelDb:channel==='2'?(a.monitorLevel2Db??-18):(a.monitorLevelDb??-18)
        })));
        d.toast('Retour casque logiciel actif : utilise impérativement un casque pour éviter les larsens.');
      }
      const telemetryId=uid();
      const rec={telemetryId,stream,graph,capture,journal,signalDiagnostics,track:targets[0].track,assignments:targets,start,originalPosition,window,previousLoop,series,seriesIndex:series?.state.current,options:clone(series?{...a,keepTakes:true}:a),captureMode:mode,autoLevel:recordingSettings(p().recording).autoLevel};
      activeRec=rec;pendingRecord=null;d.setRecording(rec);d.setFlags({micPending:false});engine().recordingTrackId=targets[0].track.id;
      engine().recordingEndStep=window?window.end*16:null;
      engine().loop=false;
      stream.getAudioTracks().forEach(inputTrack=>inputTrack.addEventListener('ended',()=>{if(d.getRecordState().recording===rec){d.toast('Micro déconnecté : finalisation et sauvegarde de la prise partielle.');void stopRecording();}},{once:true}));
      if(countBars)rec.countIn=createRecordingCountIn(engine().ctx,{bars:countBars,bpm:p().bpm,onChange:()=>d.updateTransport()});
      d.updateTransport();
      await engine().play(rec.countIn?{startAt:rec.countIn.endAt}:undefined);
      if(d.getRecordState().recording!==rec)return;
      if(!engine().playing)throw Error('Le départ de la prise a été interrompu.');
      const captureAt=rec.captureAt=engine().startTime+start*engine().stepDuration;capture.start(captureAt,window?{endTime:captureAt+window.seconds}:undefined);
      if(window?.preRollSeconds)rec.preRoll=createRecordingPreRoll(engine().ctx,{startAt:engine().playStartAt,endAt:captureAt,bpm:p().bpm,onChange:()=>d.updateTransport()});
      if(rec.countIn&&!await rec.countIn.done){if(d.getRecordState().recording===rec)await stopRecording();return;}
      if(d.getRecordState().recording!==rec)return;
      rec.countIn=null;d.updateTransport();
      if(rec.preRoll&&!await rec.preRoll.done){if(d.getRecordState().recording===rec)await stopRecording();return;}
      if(d.getRecordState().recording!==rec)return;
      rec.started=true;rec.preRoll=null;
      emitRecordingTelemetry('start',{takeId:telemetryId,frames:0,sampleRate:engine().ctx.sampleRate,channels:mode==='stereo'?2:1});
      rec.timer=setInterval(()=>{

        if(capture.frames===rec.previousFrames&&engine().playing){
          rec.stalledTicks=(rec.stalledTicks||0)+1;
          if(rec.stalledTicks>=12){
            d.toast('Capture sans nouvelles données : finalisation de la prise pour éviter de perdre le son.');
            void stopRecording();return;
          }
        }else rec.stalledTicks=0;
        rec.previousFrames=capture.frames;
        emitRecordingTelemetry('progress',{takeId:telemetryId,frames:capture.frames,sampleRate:engine().ctx.sampleRate,signal:signalDiagnostics.snapshot()});
        const seconds=capture.frames/engine().ctx.sampleRate;
        if(seconds>600&&!rec.warned10){rec.warned10=true;d.toast('Prise de 10 minutes : surveille la mémoire du navigateur et sauvegarde dès que possible.');}
        if(seconds>900&&!rec.warned15){rec.warned15=true;d.toast('Prise de 15 minutes : termine bientôt la prise et vérifie la sauvegarde.');}
        if(seconds>1200){d.toast('Prise arrêtée après 20 minutes.');void stopRecording();}
      },500);
      d.updateTransport();d.toast(targets.length>1?'Capture PCM synchronisée sur deux entrées.':'Capture PCM active. Stop termine la prise.');
    }catch(error){
      series?.cancel();if(recordingSeries===series)recordingSeries=null;
      const owned=activeRec?d.getRecordState().recording===activeRec:pendingRecord===request;
      activeRec?.countIn?.cancel();activeRec?.preRoll?.cancel();if(activeRec&&owned)engine().pause();
      if(journal&&!capture?.frames)try{await journal.clear();}catch{}
      capture?.dispose();journal?.close();graph?.dispose();stream?.getTracks().forEach(t=>t.stop());
      if(!owned)return;pendingRecord=null;
      engine().recordingTrackId=null;engine().recordingEndStep=null;if(request.returnPosition!==undefined)engine().position=request.returnPosition;if(previousLoop!==undefined)engine().loop=previousLoop;d.setRecording(null);d.setFlags({micPending:false,recordFinalizing:false});
      if(request.cancelled)return;
      d.toast('Enregistrement impossible : '+error.message);d.updateTransport();
    }
  }
  async function stopRecording({automatic=false}={}){
    if(!automatic)cancelRecordingSeries();
    const rec=d.getRecordState().recording;if(!rec){if(!automatic)cancelPendingRecording();return;}
    d.setRecording(null);d.setFlags({recordFinalizing:true});clearInterval(rec.timer);
    const cancelledBeforeStart=Number.isFinite(rec.captureAt)?engine().ctx.currentTime<rec.captureAt:!rec.started;
    rec.countIn?.cancel();rec.preRoll?.cancel();
    engine().pause();engine().recordingTrackId=null;engine().recordingEndStep=null;engine().loop=rec.previousLoop;engine().position=cancelledBeforeStart&&rec.window?rec.originalPosition:rec.start;d.updateTransport();
    if(cancelledBeforeStart){
      try{rec.capture.dispose();await rec.journal?.clear();d.toast('Préparation annulée. Aucune prise créée.');}
      catch(error){d.toast('Préparation annulée : '+error.message);}
      finally{rec.series?.cancel();if(recordingSeries===rec.series)recordingSeries=null;rec.journal?.close();graphCleanup(rec);d.setFlags({recordFinalizing:false});d.updateTransport();}
      return;
    }
    let persisted=false,complete=false;
    try{
      const inMemory=await rec.capture.stop();
      complete=!!rec.window&&rec.capture.frames===Math.round((rec.captureAt+rec.window.seconds)*engine().ctx.sampleRate)-Math.round(rec.captureAt*engine().ctx.sampleRate);
      emitRecordingTelemetry('progress',{takeId:rec.telemetryId,frames:rec.capture.frames,sampleRate:engine().ctx.sampleRate});
      // Journal-backed capture never accumulates PCM blocks in JS memory.
      // A cursor reads the stored groups directly into the final AudioBuffer.
      // If this operation fails, retain the journal for recovery/export.
      const fullBuffer=rec.journal?await rec.journal.toAudioBuffer(engine().ctx):inMemory;
      const targets=rec.assignments||[{track:rec.track,channel:rec.options.channel}];
      // Validate all assets before committing any take; the originals remain separate.
      const prepared=targets.map(({track,channel})=>{
        const buffer=rec.captureMode==='stereo'&&targets.length===1?fullBuffer:
          rec.captureMode==='2'&&targets.length===1?fullBuffer:
          extractRecordedChannel(engine().ctx,fullBuffer,targets.length===1?'1':channel);
        const quality=inspectRecordedTake(buffer);
        const data=encodeWav(buffer,{bits:32}),levels=measureBuffer(buffer);
        const gain=rec.autoLevel?normalisationGain(levels):{gainDb:0};
        const name='Prise '+(rec.series?rec.seriesIndex+'/'+rec.series.state.total+' · ':'')+new Date().toLocaleTimeString('fr-FR')+' · '+track.name;
        const placement=rangePlacement(recordingPlacement(rec.start/16,buffer.duration,p().bpm,rec.options.latencyMs),rec.window,p().bpm);
        return {track,id:uid(),name,data,buffer,levels,gain,placement,quality};
      });
      if(prepared.some(item=>item.placement.length<1/10000)){d.toast('Prise trop courte.');return;}
      d.checkpoint();
      for(const item of prepared){
        assets().set(item.id,{name:item.name,data:item.data,buffer:item.buffer,levels:item.levels});
        const c={id:uid(),name:item.name,audioId:item.id,gainDb:item.gain.gainDb,recorded:true,...item.placement};
        recordTake(item.track,c,p().bpm,uid,rec.options.keepTakes!==false);
        p().bars=fitSession(p().bars,c.start+c.length);
      }
      d.selectTrack(prepared[0].track.id);d.changed(true);
      for(const item of prepared)if(item.quality.warnings.length)d.toast(item.track.name+' : '+item.quality.warnings.join(' ; ')+'. Prise conservée.');
      // A completed take must reach IndexedDB before we report it as saved.
      // The WAV buffers remain available in this session if storage fails.
      try{
        await d.persistNow();
        persisted=true;
        try{await rec.journal?.clear();}catch(error){console.warn('Journal de récupération conservé',error);}
        emitRecordingTelemetry('finalized',{takeId:rec.telemetryId,frames:rec.capture.frames,sampleRate:engine().ctx.sampleRate,signal:rec.signalDiagnostics.snapshot()});
        d.toast(prepared.length+' prise(s) PCM enregistrée(s) et sauvegardée(s) localement.');
      }catch(saveError){
        emitRecordingTelemetry('error',{takeId:rec.telemetryId,message:'Sauvegarde locale : '+saveError.message});
        d.toast('Prise en mémoire, mais sauvegarde locale échouée : '+saveError.message+'. Exporte le projet avant de fermer.');
      }
    }catch(error){emitRecordingTelemetry('error',{takeId:rec.telemetryId,message:error.message});d.toast('Capture impossible : '+error.message);}
    finally{
      rec.journal?.close();graphCleanup(rec);d.setFlags({recordFinalizing:false});
      const series=rec.series;
      if(series&&recordingSeries===series){
        if(!seriesMatches(series))series.cancel();
        if(series.advance({persisted,complete,automatic})){void record(series);}
        else{recordingSeries=null;if(persisted&&automatic&&complete&&series.state.current===series.state.total)d.toast('Série terminée : '+series.state.total+' prises sauvegardées par piste.');}
      }
      d.updateTransport();
    }
  }
  function graphCleanup(rec){rec.graph.dispose();rec.stream.getTracks().forEach(t=>t.stop());}
  function stopTest(){testGraph?.dispose();testGraph=null;}
  const dbGet=key=>new Promise((resolve,reject)=>{const db=d.getDB();if(!db){reject(Error('Stockage local indisponible.'));return;}const req=db.transaction('sessions').objectStore('sessions').get(d.projectStorageKey(key));req.onsuccess=()=>resolve(req.result);req.onerror=()=>reject(req.error);});
  const dbHas=key=>new Promise((resolve,reject)=>{const req=d.getDB().transaction('sessions').objectStore('sessions').getKey(d.projectStorageKey(key));req.onsuccess=()=>resolve(req.result!==undefined);req.onerror=()=>reject(req.error);});
  const dbPut=(key,value)=>new Promise((resolve,reject)=>{const tx=d.getDB().transaction('sessions','readwrite');tx.objectStore('sessions').put(value,d.projectStorageKey(key));tx.oncomplete=resolve;tx.onerror=()=>reject(tx.error);});
  async function snapshot(name='Sauvegarde automatique',manual=false){const key=d.projectStorageKey('versions');if(!d.getDB()||!key||!manual&&Date.now()-(snapshotTimes.get(key)||0)<120000)return;const project=clone(p()),ids=[...audioAssetIds(project)];for(const id of ids){const a=assets().get(id);if(a&&!await dbHas('media:'+id))await dbPut('media:'+id,{id,name:a.name,data:a.data});}const list=await dbGet('versions')||[];list.unshift({id:uid(),date:Date.now(),name,project,assetIds:ids});await dbPut('versions',list.slice(0,12));snapshotTimes.set(key,Date.now());}
  async function versionsModal(){const list=await dbGet('versions').catch(()=>[]);d.modal('Versions de la session',`<div class="workflow-form"><div class="workflow-row"><input id="versionName" placeholder="Nom de cette version" maxlength="80"><button class="primary-btn" id="saveVersion">Créer un point de restauration</button></div><p>Douze points sont conservés sur cet appareil, avec les audios nécessaires. Télécharge un projet .chayah pour une copie indépendante.</p><div class="version-list">${(list||[]).map(v=>`<button class="outline-btn" data-restore-version="${v.id}"><strong>${esc(v.name)}</strong><span>${new Date(v.date).toLocaleString('fr-FR')} · ${esc(v.project.name)}</span></button>`).join('')||'<p>Aucune version enregistrée.</p>'}</div></div>`,'WARLIKE / HISTORIQUE');$('saveVersion').onclick=async()=>{try{await snapshot($('versionName').value.trim()||'Version manuelle',true);await versionsModal();}catch(error){d.toast('Version non sauvegardée : '+error.message);}};
    for(const b of document.querySelectorAll('[data-restore-version]'))b.onclick=async()=>{if(d.getRecordState().recording)return;const v=list.find(v=>v.id===b.dataset.restoreVersion);try{const candidate=clone(v.project);d.validateProject(candidate);await engine().init();for(const id of v.assetIds)if(!assets().has(id)){const a=await dbGet('media:'+id);if(!a)throw Error('Audio manquant dans cette version.');assets().set(id,{...a,buffer:await engine().ctx.decodeAudioData(a.data.slice(0))});}engine().resetSession();d.checkpoint();d.setProject(candidate);d.selectTrack(candidate.tracks[0].id,candidate.tracks[0].clips[0]?.id);d.changed(true);$('modal').close();d.toast('Version restaurée. Annuler retrouve la session précédente.');}catch(error){d.toast(error.message);}};
  }
  async function freezeTrack(id){const t=p().tracks.find(t=>t.id===id);if(!t||t.type==='bus'){d.toast('Gèle une piste source audio ou instrument.');return;}if(t.frozenTrack){d.checkpoint();Object.assign(t,clone(t.frozenTrack));delete t.frozenTrack;d.changed(true);return;}if(d.getRecordState().recording)return;d.toast('Calcul de la piste gelée…');try{const buffer=await engine().renderRange({captureId:t.id,preFader:true,tail:false,sampleRate:engine().ctx?.sampleRate===48000?48000:44100}),audioId=uid();assets().set(audioId,{name:t.name+' · gel',buffer,data:encodeWav(buffer,{bits:32})});d.checkpoint();const original={type:t.type,instrument:clone(t.instrument),sampler:clone(t.sampler||null),effects:clone(t.effects),inserts:clone(t.inserts),clips:clone(t.clips),automation:clone(t.automation),playlists:clone(t.playlists||[]),activePlaylist:t.activePlaylist};t.frozenTrack=original;t.type='audio';t.clips=[{id:uid(),name:t.name+' · gel',start:0,length:p().bars,audioId}];t.playlists=[];delete t.activePlaylist;for(const state of Object.values(t.effects))state.enabled=false;t.inserts=[];t.automation.curves=Object.fromEntries(Object.entries(t.automation.curves||{}).filter(([key])=>['volume','pan'].includes(key)||key.startsWith('send:')));d.selectTrack(t.id,t.clips[0].id);d.changed(true);d.toast('Piste gelée. Dégeler retrouve les réglages et les clips originaux.');}catch(error){d.toast(error.message);}}
  document.addEventListener('click',e=>{const b=e.target.closest('button[data-routing-track],[data-create-bus],[data-playlists-track],[data-automation-track],[data-audio-properties],[data-crossfade],[data-freeze-track],[data-send-remove],[data-send-toggle]');if(!b)return;
    if(b.dataset.routingTrack){routingModal(b.dataset.routingTrack);return;}if(b.hasAttribute('data-create-bus')){busModal();return;}if(b.dataset.playlistsTrack){playlistsModal(b.dataset.playlistsTrack);return;}if(b.dataset.automationTrack){automationModal(b.dataset.automationTrack);return;}if(b.hasAttribute('data-audio-properties')){audioProperties();return;}if(b.dataset.freezeTrack){freezeTrack(b.dataset.freezeTrack);return;}if(b.hasAttribute('data-crossfade')){try{d.checkpoint();const duration=applyCrossfade(track(),clip().id,p().bpm);d.changed(true);d.toast('Fondu croisé de '+Math.round(duration*1000)+' ms.');}catch(error){d.toast(error.message);}return;}
    const [id,sid]=(b.dataset.sendRemove||b.dataset.sendToggle).split(':'),t=p().tracks.find(t=>t.id===id),send=t?.sends?.find(s=>s.id===sid);if(!send)return;d.checkpoint();if(b.dataset.sendRemove)t.sends=t.sends.filter(s=>s.id!==sid);else send.enabled=!send.enabled;routingChanged();
  });
  document.addEventListener('change',e=>{const el=e.target;if(el.dataset.sendLevel)sendEdits.delete(el);if(el.dataset.routeOutput){const t=p().tracks.find(t=>t.id===el.dataset.routeOutput);if(!t)return;if(!routeAllowed(p().tracks,t.id,el.value)){d.toast('Ce routage créerait une boucle audio.');el.value=t.output;return;}if(t.output===el.value)return;d.checkpoint();t.output=el.value;routingChanged();}if(el.dataset.sendAdd&&el.value){const t=p().tracks.find(t=>t.id===el.dataset.sendAdd),target=el.value;if(!t)return;const candidate={tracks:p().tracks.map(track=>track===t?{...track,sends:[...(track.sends||[])]}:track)};if(!addAuxSend(candidate,t.id,target,uid)){d.toast('Envoi impossible : huit maximum, sans doublon ni boucle audio.');el.value='';return;}d.checkpoint();t.sends=candidate.tracks.find(track=>track.id===t.id).sends;routingChanged();}if(el.dataset.sendPosition){const [id,sid]=el.dataset.sendPosition.split(':'),t=p().tracks.find(t=>t.id===id),send=t?.sends?.find(s=>s.id===sid);if(!send)return;d.checkpoint();send.pre=el.value==='pre';routingChanged();}});
  document.addEventListener('pointerdown',e=>{if(e.target.dataset.sendLevel)sendEdits.delete(e.target);});
  document.addEventListener('focusout',e=>{sendEdits.delete(e.target);});
  document.addEventListener('input',e=>{if(e.target.dataset.sendLevel){const [id,sid]=e.target.dataset.sendLevel.split(':'),t=p().tracks.find(t=>t.id===id),s=t?.sends?.find(s=>s.id===sid);if(!s||!String(e.target.value).trim())return;const value=Number(e.target.value);if(!Number.isFinite(value))return;const level=Math.max(-60,Math.min(12,value));if(level===s.level)return;if(!sendEdits.has(e.target)){d.checkpoint();sendEdits.add(e.target);}s.level=level;for(const label of document.querySelectorAll(`[data-send-db="${sid}"]`))label.textContent=s.level.toFixed(1)+' dB';for(const slider of document.querySelectorAll(`[data-send-level="${id}:${sid}"]`))if(slider!==e.target)slider.value=s.level;d.changed();}});
  function updateFrame(){updateRangeIndicator();if(!engine().playing)return;const bar=engine().getPosition()/16;for(const t of p().tracks)if(t.automation?.mode==='read'){for(const key of ['volume','pan']){const points=t.automation.curves[key];if(!points?.length)continue;const value=pointValue(points,bar,t[key]);if(key==='volume'){for(const node of document.querySelectorAll(`[data-db="${t.id}"]`))node.textContent=value.toFixed(1)+' dB';for(const node of document.querySelectorAll(`[data-volume="${t.id}"]`))if(node!==document.activeElement)node.value=value;}}}}
  document.addEventListener('visibilitychange',()=>{if(!document.hidden)return;cancelRecordingSeries();const rec=d.getRecordState().recording;if(rec?.countIn||rec?.preRoll)void stopRecording();});
  return {renderMastering,renderInspector,renderMixer,renderAudioEditor,renderTimeline,exportModal,recordingModal,record,stopRecording,cancelPendingRecording,cancelRecordingSeries,versionsModal,snapshot,updateFrame,stopTest};
}
