import {setDemoPlaybackLevel} from './demo-playback-level.js';
import {createMasterRackUI} from './master-rack-ui.js?v=2';
import {rackType,rackLeaves,rackIsSplit,rackDefinition,rackLocation,placeRackModule,removeRackItem,insertRackSplit} from './master-rack-model.js';
import {mountSidebarBrowser} from './sidebar-browser.js';
import {mountMusicIndustry} from './music-industry-ui.js';
import {mountRackBrowser} from './war-rack-browser.js';
import {mountSessionPreview,updateSessionPreview} from './session-preview-ui.js';
import {mountProjectCompositions} from './project-compositions-ui.js';
import {GAME_SOUNDS,GAME_SOUND_CATEGORIES,gameSound,renderGameSound,gameSoundWav,gameSoundPack} from './game-sounds.js';
import {renderGameSoundBank} from './game-sounds-ui.js';
import {mountInstrumentFace,updateInstrumentFaces} from './instrument-faces.js';
import {mountEffectFace,updateEffectFaces} from './effect-faces.js';
import {INSTRU_PRESETS,INSTRU_CATEGORIES,findInstruPreset,instruValues,instruPhrase,applyInstruPreset} from './instru-presets.js';
import {renderInstruBank} from './instru-bank-ui.js';
import {mountExpansionHardware,updateExpansionHardware} from './expansion-hardware.js';
import {openInstrumentAudit} from './instrument-audit.js';
import {fullSongBars} from './full-song.js';
import {ORIGINS_BANK} from './origins.js';
import {loopBounds} from './loop-range.js';
import {arrangementShift,arrangementWidth,canTransferClip,transferClip} from './arrangement-layout.js';
import {pluginIdentity} from './plugin-identity.js';
import {mountVectorComp,updateVectorCompFaces} from './vector-comp-face.js';
import {mountCircuitBus,updateCircuitBusFaces} from './circuit-bus-face.js';
import {mountVoxLevel,updateVoxLevelFaces} from './vox-level-face.js';
import {mountVoxClean,updateVoxCleanFaces} from './vox-clean-face.js';
import {mountVoxTune,updateVoxTuneFaces} from './vox-tune-face.js';
import {mountVoxAir,updateVoxAirFaces} from './vox-air-face.js';
import {mountVoxAmbience,updateVoxAmbienceFaces} from './vox-ambience-face.js';
import {mountVoxMic} from './vox-mic-face.js';
import {mountVoxWarm} from './vox-warm-face.js';
import {mountVoxDoubler} from './vox-doubler-face.js';
import {updateVoxProFaces} from './vox-pro-face.js';
import {mountCircuitColor,updateCircuitColorFaces} from './circuit-color-face.js';
import {mountVectorLimit,updateVectorLimitFaces} from './vector-limit-face.js';
import {isVector,vectorPresetBank,applyVectorPreset,mountVectorMasterPresets} from './vector-suite.js';
import {isCircuit,circuitPresetBank,applyCircuitPreset,mountCircuitMasterPresets} from './circuit-suite.js';
import {isVox,voxPresetBank,applyVoxPreset,mountVoxMasterPresets} from './vox-suite.js';
import {isExo,exoPresetBank,applyExoPreset,mountExoMasterPresets} from './exo-suite.js';
import {isAlter,alterPresetBank,applyAlterPreset,mountAlterMasterSuite} from './alter-suite.js';
import {mountAlterDouble} from './alter-double-face.js';
import {mountAlterEcho} from './alter-echo-face.js';
import {mountAlterFilter} from './alter-filter-face.js';
import {updateAlterFaces} from './alter-face.js';
const isHardwarePreset=id=>isVector(id)||isCircuit(id)||isVox(id)||isExo(id)||isAlter(id);
import {measureLoudness} from './audio-loudness.js';
import {auditRouting,measureAudio,verifyWav32,auditContinuousPCM} from './audio-certification.js';
import {encodeWav as encodeCertificationWav} from './wav.js';
import {installedTrackChains,applyTrackChain} from './track-chain-extension.js';
import {MIX_TEMPLATES,MASTER_TEMPLATES,TEMPLATE_GENRES,mixTemplatePreview,masterTemplatePreview,applyMixTemplate,applyMasterTemplate} from './mix-master-templates.js';
import {VOX_STUDIORACKS,RACK_CATEGORIES,rackCapacity,planVoxStudioRack,applyVoxStudioRack,shiftVoxStudioInsert,bypassVoxStudioInsert} from './vox-studioracks.js';
import {parseReaperRpp,matchReaperMedia,reaperBasename} from './reaper-rpp.js';
import {NATIVE_CHAINS,nativeEffectsForNames,applyNativeChain,nativeChainCapacity} from './native-vocal-chains.js';
import {VOCAL_DEMOS,createVocalDemoSession} from './vocal-demo-sessions.js';
import {NEW_GENRE_DEMOS,createGenreDemoSession} from './genre-demo-sessions.js';
import {BEAT_DEMOS,createBeatDemoSession} from './beat-demo-sessions.js';
import {completePublicDemoVocals} from './public-demo-completion.js';
import {extendPublicDemoArrangement} from './public-demo-arrangements.js';
import {masterPublicDemo} from './demo-mastering.js';
import {routeVocalFX} from './demo-vocal-fx.js';
import {routeVocalSubgroups} from './demo-vocal-buses.js';
import {routePublicDemoGroups} from './demo-group-buses.js';
import {mixPublicDemoInstruments} from './demo-instrument-mix.js';
import {balancePublicDemo} from './demo-gain-staging.js';
import {createRecordedVocalDemoMedia} from './recorded-vocal-audio.js';
import {beginStudioPairing,completeStudioPairing,createStudioSync} from './studio-cloud-workflow.js';
import {readLocalProject,writeLocalProject} from './local-project-store.js';
import {workspaceAction,handleWorkspaceAction} from './workspace-shortcuts.js';
import {installAnnotations} from './annotations.js?v=0.14.0';
import {fadeOverlay,installFadeHandles} from './clip-tools.js?v=0.14.0';
import {mountEqCurve} from './eq-curve.js?v=0.14.0';
import {installAppMenus} from './app-menus.js?v=0.14.0';
import {openContextMenu,action as contextAction,group as contextGroup} from './context-menus.js';
import {installSignature} from './signature-ui.js?v=0.15.11';
import {normaliseFolders} from './signature-model.js?v=0.14.0';
import {mountSampler,sliceSettings} from './sampler.js?v=0.14.0';
import {mountPluginPicker} from './plugin-picker.js?v=0.15.11';
import {capturePreset,userPresets,storePreset,removePreset,applyUserPreset} from './user-plugin-presets.js';
const pickerPresetBanks=registry=>Object.fromEntries(Object.entries(registry).map(([id,def])=>[id,[...(FACTORY_PRESETS[id]||[]).map((p,index)=>({...p,index,source:'factory'})),...userPresets(localStorage,id,def).map(p=>({...p,source:'user'}))]]));
function applyPickerPreset(track,id,preset){if(!preset)return;if(preset.source==='factory')applyFactoryPreset(track,id,preset.index);else{const type=id==='instrument'?track.type:effectType(id),def=id==='instrument'?instrumentDefinition(type):effectDefinition(id);applyUserPreset(id==='instrument'?track.instrument:track.effects[id],preset,type,def);}}
import {ACOUSTIC_INSTRUMENTS} from './acoustic.js?v=0.14.0';
import {mountAcousticBrowser} from './acoustic-ui.js?v=0.14.0';
import {mountExoBrowser} from './exo-ui.js?v=0.14.0';
import {mountExoSpace,updateExoSpaceFaces} from './exo-space-face.js';
import {mountExoFocus,updateExoFocusFaces} from './exo-focus-face.js';
import {mountExoAir,updateExoAirFaces} from './exo-air-face.js';
import {mountExoStrip,updateExoStripFaces} from './exo-strip-face.js';
import {installPianoRoll} from './piano-roll.js?v=0.15.11';
import {normalizeNotes,resolvePatternClip,writePatternChannel,resizePattern,patternBarOptions,MAX_PATTERN_BARS,MAX_PATTERN_STEPS} from './piano-model.js?v=0.14.0';
import {installStudioWorkflow,automationParameters} from './studio-workflow.js?v=0.14.0';
import {MAX_BARS,sessionBars,fitSession,normaliseRouting,audioAssetIds,saveActivePlaylist,changeAudioTempo} from './studio-model.js?v=0.14.0';
import {normaliseCurve} from './automation.js?v=0.14.0';
import {reorderTrackList,stepTrackDestination,clampTrackVolume,installTrackReordering,removeProjectTrack,installPanEditing} from './tracks.js?v=0.14.0';
import {snapBar,musicalPosition,splitClip as splitClipData,trimClip,MIN_CLIP_LENGTH} from './editing.js?v=0.14.0';
import {EFFECT_PACKS,PACK_EFFECTS,relayTimes} from './packs.js?v=0.14.0';
import {createDivinityUI} from './divinity-ui.js';
import {AudioEngine,emptyProject,uid,noteName,bufferToWav} from './audio.js?v=0.15.12';
import {personalEffectPresets,saveEffectPreset,applyPersonalEffectPreset,nextPresetIndex,compareInsert,copyInsertComparison,INSTRUMENTS,EFFECTS,DRUM_VOICES,ensurePlugins,formatParam,placeInsert,moveInsert,INSERT_COUNT,effectDefinition,effectType,copyInsert,changeInstrument,instrumentDefinition} from './plugins.js?v=0.14.0';
import {recordingSettings,createRecordingGraph,measureBuffer,normalisationGain,clampClipGain} from './recording.js?v=0.14.0';
import {installKnobControls} from './controls.js?v=0.15.13';
import {PluginInstances} from './plugin-instances.js?v=1';
import {PluginWindowManager} from './plugin-window-manager.js';
import {findPluginControl,scopePluginWindowIds} from './plugin-window-dom.js';
import {PluginEditHistory,capturePluginEdit,applyPluginEdit} from './plugin-edit-history.js';
import {mountPluginCommandBar} from './plugin-command-bar.js';
const pluginInstances=new PluginInstances(),pluginWindows=new PluginWindowManager();
const pluginEdits=new PluginEditHistory();let pluginEditGroup=0;
const pluginWindowTemplate=document.getElementById('pluginFloat');
pluginWindowTemplate.remove();
let pluginWindowSerial=0,bundleOwner=null;
import {installFloatingWindow} from './windows.js';
import {FACTORY_PRESETS,presetsFor,matchPreset,applyFactoryPreset,exportRack,importRack} from './bundle.js?v=0.14.0';

import {MASTER_MODULES,MASTER_PRESETS,masteringSettings,applyMasterPreset,matchMasterPreset,exportMasterRack,importMasterRack} from './mastering.js?v=0.15.12';

import {DRUM_GROOVES,SESSION_TEMPLATES,createContentTrack,createContentClip,createFactorySession,contentCounts,FACTORY_STYLES} from './content.js?v=0.14.0';

const $=id=>document.getElementById(id), esc=s=>String(s).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const paths={play:'<path d="m6 3 11 7-11 7Z"/>',pause:'<path d="M7 4v12M13 4v12"/>',stop:'<rect x="5" y="5" width="10" height="10" rx="1"/>',rewind:'<path d="M4 4v12m11-12-8 6 8 6Z"/>',loop:'<path d="M16 6H6a3 3 0 0 0-3 3v2m1 3h10a3 3 0 0 0 3-3V9M13 3l3 3-3 3M7 11l-3 3 3 3"/>',metronome:'<path d="m8 3-4 14h12L12 3ZM10 12l5-8M7 13h6"/>',chevron:'<path d="m6 8 4 4 4-4"/>','chevron-right':'<path d="m8 5 5 5-5 5"/>',search:'<circle cx="8.5" cy="8.5" r="5"/><path d="m12.5 12.5 4 4"/>',grid:'<rect x="3" y="3" width="5" height="5" rx="1"/><rect x="12" y="3" width="5" height="5" rx="1"/><rect x="3" y="12" width="5" height="5" rx="1"/><rect x="12" y="12" width="5" height="5" rx="1"/>',wave:'<path d="M2 10h2l2-6 3 12 3-12 3 12 2-6h1"/>',piano:'<rect x="2" y="4" width="16" height="12" rx="1"/><path d="M6 4v12m4-12v12m4-12v12M4 4v6m4-6v6m4-6v6m4-6v6"/>',drums:'<rect x="3" y="3" width="5" height="5" rx="1"/><rect x="11" y="3" width="5" height="5" rx="1"/><rect x="3" y="11" width="5" height="5" rx="1"/><rect x="11" y="11" width="5" height="5" rx="1"/>',mic:'<rect x="7" y="2" width="6" height="10" rx="3"/><path d="M4 9v1a6 6 0 0 0 12 0V9m-6 7v3m-3 0h6"/>',upload:'<path d="M10 13V3M6 7l4-4 4 4M3 12v5h14v-5"/>',download:'<path d="M10 3v10m-4-4 4 4 4-4M3 14v3h14v-3"/>',plus:'<path d="M10 4v12M4 10h12"/>',close:'<path d="m5 5 10 10M5 15 15 5"/>',undo:'<path d="M3 8h9a5 5 0 0 1 0 10M3 8l4-4M3 8l4 4"/>',redo:'<path d="M17 8H8a5 5 0 0 0 0 10M17 8l-4-4M17 8l-4 4"/>',help:'<circle cx="10" cy="10" r="7"/><path d="M8 7a2 2 0 0 1 4 0c0 2-2 2-2 4m0 3h0"/>',timeline:'<path d="M3 4h12v3H3Zm4 5h10v3H7Zm-4 5h9v3H3Z"/>',sliders:'<path d="M5 3v5m0 4v5m5-14v9m0 4v1m5-14v2m0 4v8M3 8h4v4H3Zm5 4h4v4H8Zm5-7h4v4h-4Z"/>',copy:'<rect x="7" y="7" width="10" height="10" rx="1"/><path d="M13 5V3H3v10h2"/>',trash:'<path d="M3 5h14M8 3h4M5 5l1 12h8l1-12M8 8v6m4-6v6"/>',more:'<circle cx="4" cy="10" r=".6"/><circle cx="10" cy="10" r=".6"/><circle cx="16" cy="10" r=".6"/>',power:'<path d="M10 2v7M6 4a7 7 0 1 0 8 0"/>',save:'<path d="M3 3h12l2 2v12H3ZM6 3v5h7V3M6 17v-6h8v6"/>',folder:'<path d="M2 5h6l2 2h8l-2 10H2Z"/>',check:'<path d="m4 10 4 4 8-8"/>'};
const icon=n=>`<svg viewBox="0 0 20 20" aria-hidden="true">${paths[n]||paths.wave}</svg>`;
function icons(root=document){root.querySelectorAll('[data-icon]').forEach(el=>el.innerHTML=icon(el.dataset.icon));}
icons();
let masterRackUI=null;
let sidebarBrowser=null;
let project=emptyProject(),assets=new Map(),selectedTrack=project.tracks[0].id,selectedClip=project.tracks[0].clips[0]?.id,view='arrange',detail='plugins',editingTool='select',timelineZoom=1,suppressClipClickUntil=0,editMode='grid',editGrid=1/16,clipClipboard=null,suppressTrackClickUntil=0,quickTrackId=null,multiClips=new Set();
let history=[],future=[],saveTimer,recording=null,db=null,dragState=null,toastTimer,loaded=false,tuneBusy=false,micPreview=null,recordFinalizing=false,micPending=false,pluginWindow=null,bankState={tab:'sounds',filter:'all',search:''},backupAvailable=false;
let activeProjectId=null,projectIndex=[];
let studioCloud=null,studioCloudIdentity=null;
function updateCloudAccount(){const label=$('studioCloudAccount');if(label)label.textContent=studioCloudIdentity?'Compte cloud : '+(studioCloudIdentity.displayName||studioCloudIdentity.userId):'Cloud déconnecté · copie locale conservée';}
function lostCloudIdentity(){studioCloudIdentity=null;if($('modalTitle').textContent==='Mes projets cloud')$('modal').close();updateCloudAccount();if(activeProjectId)$('saveStatus').textContent='Cloud déconnecté — copie locale conservée';}
const getStudioCloud=()=>studioCloud??(studioCloud=createStudioSync({onIdentityLost:lostCloudIdentity}));
const cloudSessionChannel=typeof BroadcastChannel==='function'?new BroadcastChannel('warlike-studio-session'):null;
if(cloudSessionChannel)cloudSessionChannel.onmessage=()=>studioCloud?.invalidate();
const verifyCloudAccount=()=>{if(studioCloud?.identity())studioCloud.verifyIdentity().then(value=>{studioCloudIdentity=value;updateCloudAccount()}).catch(()=>{});};
window.addEventListener('focus',verifyCloudAccount);
document.addEventListener('visibilitychange',()=>{if(document.visibilityState==='visible')verifyCloudAccount();else engine.stopPreview();});
async function rememberCloudState(id,result){
 const job=saveQueue.catch(()=>{}).then(async()=>{
  const state=await dbRead(projectKey(id));if(!state)return;
  const index=projectIndex.map(meta=>meta.id===id?{...meta,cloudId:result.cloudId,cloudRevision:result.cloudRevision,cloudOwner:result.cloudOwner}:meta);
  state.project.__cloudAssets=result.cloudAssets;
  await new Promise((resolve,reject)=>{const tx=db.transaction('sessions','readwrite'),store=tx.objectStore('sessions');store.put(state,projectKey(id));store.put(index,'project-index');tx.oncomplete=resolve;tx.onerror=()=>reject(tx.error);});
  projectIndex=index;if(activeProjectId===id)project.__cloudAssets=result.cloudAssets;
 });saveQueue=job;return job;
}
async function uploadActiveProject(){
 if(!activeProjectId)throw Error('Ouvre un projet local pour le synchroniser.');
 const cloud=getStudioCloud();studioCloudIdentity=await cloud.connect();updateCloudAccount();
 await flushCurrent();
 const id=activeProjectId,meta=projectIndex.find(p=>p.id===id),state=await readLocalProject(db,id);
 if(!state)throw Error('Projet local introuvable.');
 if(meta?.cloudOwner&&meta.cloudOwner!==studioCloudIdentity.userId)throw Error('Ce projet est associé à un autre compte WarLike.');
 const result=await cloud.push({project:state.project,assets:state.assets||[],cloudId:meta?.cloudId,revision:meta?.cloudRevision,ownerId:meta?.cloudOwner,onCreated:created=>rememberCloudState(id,created),onProgress:progress=>cloudProgress(id,progress)});
 await rememberCloudState(id,result);toast('Projet sauvegardé dans ton cloud WarLike.');
}
async function listCloudProjects(){
 const cloud=getStudioCloud();studioCloudIdentity=await cloud.connect();updateCloudAccount();
 const projects=await cloud.list();
 modal('Mes projets cloud','<p class="modal-body-copy">Projets privés du compte connecté. Chaque morceau appartient exclusivement à ton compte WarLike. Les fiches publiées ne contiennent pas les pistes sources.</p>'+(projects.map(p=>'<div class="project-home-card"><strong>'+esc(p.name)+'</strong><div class="project-home-card-actions"><button class="primary-btn" data-cloud-open="'+esc(p.id)+'">Télécharger et ouvrir</button><button class="outline-btn" data-cloud-publish="'+esc(p.id)+'">Publier la fiche</button></div></div>').join('')||'<p>Aucun projet cloud.</p>'),'WARLIKE / CLOUD');
 document.querySelectorAll('[data-cloud-publish]').forEach(b=>b.onclick=async()=>{
  if(!studioCloudIdentity?.userId)return toast('Connecte ton compte WarLike.');
  const item=projects.find(p=>p.id===b.dataset.cloudPublish);
  if(!item)return toast('Projet cloud introuvable.');
  if(!confirm('Publier une fiche publique de « '+item.name+' » ? Les pistes et les fichiers audio restent privés. La lecture publique demande encore un export distinct.'))return;
  b.disabled=true;
  try{
   const response=await fetch('/api/studio/publish',{method:'POST',credentials:'same-origin',cache:'no-store',headers:{'Content-Type':'application/json','X-Warlike-Studio-Account':studioCloudIdentity.userId},body:JSON.stringify({sourceId:item.id,title:item.name,description:''})});
   const result=await response.json();
   if(!response.ok)throw Error(result.error||'Publication impossible.');
   toast('Fiche publiée · morceau source toujours privé.');
  }catch(error){toast(error.message);}finally{b.disabled=false;}
 });
 document.querySelectorAll('[data-cloud-open]').forEach(b=>b.onclick=async()=>{b.disabled=true;try{
  const remote=await cloud.fetchProject(b.dataset.cloudOpen);
  const id=await createProjectLocal(remote.project.name,remote.project,remote.media);
  await rememberCloudState(id,remote);toast('Projet téléchargé depuis le cloud.');
 }catch(error){toast(error.message);b.disabled=false;}});
}
function cloudProgress(id,{name,part,total}){if(id===activeProjectId)$('saveStatus').textContent='Copie locale enregistrée · Cloud : '+name+' · '+part+'/'+total;}
function scheduleAutoCloud(id,copy,media){
 const meta=projectIndex.find(p=>p.id===id);
 if(!studioCloudIdentity||!meta?.cloudId||meta.cloudOwner!==studioCloudIdentity.userId)return;
 const cloud=getStudioCloud();
 cloud.push({project:copy,assets:media,cloudId:meta.cloudId,revision:meta.cloudRevision,ownerId:meta.cloudOwner,onProgress:progress=>cloudProgress(id,progress)})
 .then(result=>rememberCloudState(id,result)).then(()=>{if(id===activeProjectId)$('saveStatus').textContent='Sauvegardé sur cet appareil et dans le cloud';})
 .catch(error=>{if(id===activeProjectId)$('saveStatus').textContent='Cloud non synchronisé — copie locale conservée';console.warn('Cloud sync',error.message);});
}

let saveQueue=Promise.resolve(),transitionQueue=Promise.resolve();
const exclusive=fn=>{const task=transitionQueue.catch(()=>{}).then(fn);transitionQueue=task.catch(()=>{});return task;};
async function flushCurrent(){if(saveTimer!==null){clearTimeout(saveTimer);saveTimer=null;await persist();}await saveQueue;}
const projectKey=id=>'project:'+id, scopedKey=k=>activeProjectId?'project:'+activeProjectId+':'+k:null;
const dbRead=k=>new Promise((ok,fail)=>{const r=db.transaction('sessions').objectStore('sessions').get(k);r.onsuccess=()=>ok(r.result);r.onerror=()=>fail(r.error)});
const dbWrite=(k,v)=>new Promise((ok,fail)=>{const t=db.transaction('sessions','readwrite');t.objectStore('sessions').put(v,k);t.oncomplete=ok;t.onerror=()=>fail(t.error)});
async function chooseProject(id){return exclusive(async()=>{
  if(recording||recordFinalizing||micPending)throw Error('Termine la prise en cours.');
  await flushCurrent();
  const state=await readLocalProject(db,id);if(!state)throw Error('Projet absent.');
  const next=clone(state.project);validateProject(next);
  const media=new Map(),context=new AudioContext();try{for(const a of state.assets||[])media.set(a.id,{...a,buffer:await context.decodeAudioData(a.data.slice(0))});}finally{await context.close();}
  engine.resetSession();project=next;assets=media;activeProjectId=id;engine.masterVolume=state.masterVolume??0;selectedTrack=next.tracks[0].id;selectedClip=next.tracks[0].clips[0]?.id;history=[];future=[];closeAllPluginWindows();render();updateUndo();$('saveStatus').textContent='Enregistré sur cet appareil';$('modal').close();
});}
async function createProjectLocal(name='Nouveau morceau',source=null,media=[]){
  if(recording||recordFinalizing||micPending)throw Error('Termine la prise en cours.');
  await flushCurrent();
  const next=source?clone(source):emptyProject();next.name=name.slice(0,60);
  const id=crypto.randomUUID(),now=Date.now();
  const nextIndex=[{id,name:next.name,createdAt:now,updatedAt:now},...projectIndex];
  await writeLocalProject(db,id,{project:next,masterVolume:Number.isFinite(next.masterVolume)?next.masterVolume:0,assets:media},nextIndex);
  projectIndex=nextIndex;await chooseProject(id);return id;
}

// Each public demo opens an independent local copy; no account or cloud upload required.
const PUBLIC_DEMOS=Object.freeze({
 trap:{template:'nocturne',label:'Trap',name:'WARLIKE · Trap pour tous'},
 afro:{template:'soleil',label:'Afro',name:'WARLIKE · Afro pour tous'},
 rnb:{template:'brume',label:'R&B',name:'WARLIKE · R&B pour tous'},
 ...Object.fromEntries(Object.entries(NEW_GENRE_DEMOS).map(([id,value])=>[id,{...value,genre:true}])),
 ...Object.fromEntries(Object.entries(BEAT_DEMOS).map(([id,value])=>[id,{...value,beat:true}])),
 ...Object.fromEntries(Object.entries(VOCAL_DEMOS).map(([key,value])=>[key,{...value,vocal:true}]))
});
let publicDemoOpening=false;
export async function launchPublicDemo(kind){
 const config=Object.hasOwn(PUBLIC_DEMOS,kind)?PUBLIC_DEMOS[kind]:null;
 if(!config){toast('Démo inconnue.');return;}
 if(publicDemoOpening)return;
 if(recording||recordFinalizing||micPending){toast('Termine la prise avant d’ouvrir la démo.');return;}
 publicDemoOpening=true;
 engine.stopPreview();
 document.querySelectorAll('[data-public-demo]').forEach(b=>b.disabled=true);
 try{
   const demo=config.beat?createBeatDemoSession(kind):config.vocal?createVocalDemoSession(kind):config.genre?createGenreDemoSession(kind):createVocalDemoSession('vox-'+kind);
   demo.name=config.name;demo.publicDemo=true;
   demo.demoRevision=config.beat?demo.demoRevision:config.vocal||config.template?6:config.genre?1:3;
   const demoMedia=demo.vocalDemo?await createRecordedVocalDemoMedia(demo):[];
   if(kind==='trap'||kind==='trap808')extendPublicDemoArrangement(demo,kind);
   completePublicDemoVocals(demo);
   balancePublicDemo(demo);
   mixPublicDemoInstruments(demo);
   routePublicDemoGroups(demo);
   routeVocalSubgroups(demo);
   routeVocalFX(demo);
   masterPublicDemo(demo,kind);
   setDemoPlaybackLevel(demo,kind,'public');
   if(db){
     await createProjectLocal(demo.name,demo,demoMedia);
     engine.masterVolume=Number.isFinite(demo.masterVolume)?demo.masterVolume:0;
     save();
   }else{
     engine.pause();engine.resetSession();
     closeAllPluginWindows();project=demo;assets=new Map();
     if(demoMedia.length){await engine.init();for(const m of demoMedia)assets.set(m.id,{...m,buffer:await engine.ctx.decodeAudioData(m.data.slice(0))});}
     activeProjectId=null;
     selectedTrack=demo.tracks[0].id;selectedClip=demo.tracks[0].clips[0]?.id;
     engine.masterVolume=Number.isFinite(demo.masterVolume)?demo.masterVolume:0;
     history=[];future=[];updateUndo();render();
     toast('Démo temporaire : le stockage local est indisponible. Exporte ton projet pour le conserver.');
   }
   $('modal').close();
   setView('arrange');fitTimeline();
   if(demo.vocalDemo)engine.seek((kind==='trap'?8:4)*16); // Seek to first recorded verse.
   updateTransport();
   toast(demo.vocalDemo?'Démo '+config.label+' · voix humaines en anglais · COUPLET (mesure '+(kind==='trap'?'9':'5')+') · FX modifiables · '+demo.bars+' mesures. Appuie sur Lecture.':'Démo '+config.label+' chargée · '+demo.bpm+' BPM · '+demo.keyName+' · '+demo.bars+' mesures. Appuie sur Lecture.');
 }catch(error){toast('Démo '+config.label+' indisponible : '+error.message);}
 finally{publicDemoOpening=false;document.querySelectorAll('[data-public-demo]').forEach(b=>b.disabled=false);}
}

async function launchFactoryProject(id){
 const template=SESSION_TEMPLATES.find(t=>t.id===id);if(!template||publicDemoOpening)return;
 if(recording||recordFinalizing||micPending)return toast('Termine la prise avant d’ouvrir une composition.');
 publicDemoOpening=true;engine.stopPreview();
 document.querySelectorAll('[data-public-demo],[data-factory-project-open]').forEach(b=>b.disabled=true);
 try{
  await createProjectLocal(template.name,createFactorySession(id,true));
  setView('arrange');fitTimeline();updateTransport();
  toast(template.name+' · copie complète ouverte. Ton projet précédent reste dans Mes projets.');
 }catch(error){toast('Ouverture impossible : '+error.message);}
 finally{publicDemoOpening=false;document.querySelectorAll('[data-public-demo],[data-factory-project-open]').forEach(b=>b.disabled=false);}
}
let projectHomeTab='open',projectHomePage=0;
function showProjectLibrary(){
 if(!db)return toast('Stockage local indisponible.');
 const pageSize=3;const pages=Math.max(1,Math.ceil(projectIndex.length/pageSize));projectHomePage=Math.min(projectHomePage,pages-1);
 const rows=projectIndex.slice(projectHomePage*pageSize,(projectHomePage+1)*pageSize).map(p=>'<article class="project-home-card"><div class="project-home-card-info"><strong>'+esc(p.name)+'</strong><small>Modifié le '+new Date(p.updatedAt).toLocaleString('fr-FR')+'</small></div><div class="project-home-card-actions"><button class="primary-btn" data-project-open="'+esc(p.id)+'">Ouvrir</button><button class="outline-btn" data-project-rename="'+esc(p.id)+'" aria-label="Renommer '+esc(p.name)+'">Renommer</button><button class="outline-btn project-home-delete" data-project-delete="'+esc(p.id)+'" aria-label="Supprimer '+esc(p.name)+'">Supprimer</button></div></article>').join('');
 const info='<div class="project-home-banner"><strong>Projets enregistrés sur cet appareil</strong><p>Mode local : pas encore de séparation sécurisée entre comptes WarLike. Sur un navigateur partagé, chacun peut accéder à ces projets.</p></div>';
 const create='<div class="project-home-section project-compositions-host"></div><form id="projectHomeCreate" class="project-home-form"><label for="libraryName">Nom du nouveau projet</label><div class="project-home-creation"><input id="libraryName" name="name" value="Nouveau morceau" maxlength="60" autocomplete="off" required aria-label="Nom du nouveau projet"><button type="submit" class="primary-btn" id="libraryNew">Créer et ouvrir</button></div></form>';
 const library='<section class="project-home-section"><h3>Mes projets locaux <span>'+projectIndex.length+'</span></h3><div class="project-home-list">'+(rows||'<p class="project-home-empty">Aucun projet local. Crée ton premier morceau pour commencer.</p>')+'</div></section>';
 modal('Mes projets','<div class="project-home">'+info+create+library+'<div class="project-home-footer"><button class="outline-btn" id="libraryRecover">Récupérer l’ancienne session</button><button class="outline-btn" id="libraryImport">Importer un fichier .chayah</button></div><section class="project-home-section"><h3>WarLike Cloud (optionnel)</h3><p id="studioCloudAccount" role="status">'+esc(studioCloudIdentity?'Compte cloud : '+(studioCloudIdentity.displayName||studioCloudIdentity.userId):'Cloud déconnecté')+'</p><p class="modal-body-copy">Connexion sécurisée nécessaire. Les projets locaux ne sont jamais envoyés automatiquement sans association explicite.</p><div class="project-home-footer"><button class="outline-btn" id="studioCloudConnect">Associer mon compte</button><button class="outline-btn" id="studioCloudOpen">Mes projets cloud</button><button class="primary-btn" id="studioCloudSave">Synchroniser le projet ouvert</button><button class="outline-btn" id="studioCloudLogout">Déconnecter</button></div></section></div>','WARLIKE / PROJETS');
 const home=document.querySelector('.project-home');
 const [banner,demos,form,libraryPanel,footer,cloud]=Array.from(home.children);
 mountProjectCompositions(demos,{stop:()=>engine.stopPreview(),sync:syncSessionPreview});
 const tabs=document.createElement('nav');tabs.className='session-dashboard-tabs';tabs.setAttribute('aria-label','Sessions');
 const panels={create:[form,footer],open:[libraryPanel,banner],demos:[demos],cloud:[cloud]};
 const pager=document.createElement('div');pager.className='session-dashboard-pager';
 pager.innerHTML='<button class="outline-btn" type="button" data-page="-1">Précédent</button><span>Page '+(projectHomePage+1)+' / '+pages+'</span><button class="outline-btn" type="button" data-page="1">Suivant</button>';
 libraryPanel.append(pager);
 pager.querySelector('[data-page="-1"]').disabled=projectHomePage===0;
 pager.querySelector('[data-page="1"]').disabled=projectHomePage>=pages-1;
 pager.querySelectorAll('[data-page]').forEach(b=>b.onclick=()=>{projectHomePage+=Number(b.dataset.page);showProjectLibrary();});
 for(const [key,label] of Object.entries({create:'Créer',open:'Ouvrir',demos:'Démos',cloud:'Cloud'})){
  const b=document.createElement('button');b.type='button';b.className='outline-btn';b.textContent=label;b.dataset.sessionTab=key;tabs.append(b);
  b.onclick=()=>{engine.stopPreview();projectHomeTab=key;applyTab();};
 }
 function applyTab(){for(const [key,nodes] of Object.entries(panels))for(const node of nodes)node.hidden=key!==projectHomeTab;
  tabs.querySelectorAll('button').forEach(b=>b.setAttribute('aria-pressed',String(b.dataset.sessionTab===projectHomeTab)));
 }
 home.prepend(tabs);home.classList.add('session-dashboard');applyTab();
 $('projectHomeCreate').onsubmit=async e=>{e.preventDefault();const button=$('libraryNew');button.disabled=true;try{await createProjectLocal($('libraryName').value.trim()||'Nouveau morceau');}catch(error){toast(error.message);button.disabled=false;}};
 $('libraryImport').onclick=()=>{$('modal').close();$('projectInput').click();};
 $('studioCloudConnect').onclick=async()=>{try{await beginStudioPairing();}catch(e){toast(e.message);}};
 $('studioCloudOpen').onclick=async()=>{try{await listCloudProjects();}catch(e){toast(e.message);}};
 $('studioCloudSave').onclick=async()=>{const b=$('studioCloudSave');b.disabled=true;try{await uploadActiveProject();}catch(e){toast(e.message);}finally{if(b.isConnected)b.disabled=false;}};
 $('studioCloudLogout').onclick=async()=>{try{await getStudioCloud().logout();toast('Session cloud déconnectée.');}catch(e){toast(e.message);}finally{lostCloudIdentity();cloudSessionChannel?.postMessage('changed');showProjectLibrary();}};

 document.querySelectorAll('[data-project-open]').forEach(b=>b.onclick=async()=>{try{await chooseProject(b.dataset.projectOpen)}catch(e){toast(e.message)}});
 document.querySelectorAll('[data-project-rename]').forEach(b=>b.onclick=async()=>{try{const p=projectIndex.find(x=>x.id===b.dataset.projectRename),name=prompt('Nom du projet',p.name)?.trim();if(!name)return;p.name=name.slice(0,60);const state=await dbRead(projectKey(p.id));state.project.name=p.name;await dbWrite(projectKey(p.id),state);await dbWrite('project-index',projectIndex);if(activeProjectId===p.id){project.name=p.name;render()}showProjectLibrary()}catch(e){toast(e.message)}});
 document.querySelectorAll('[data-project-delete]').forEach(b=>b.onclick=async()=>{try{const id=b.dataset.projectDelete;if(!confirm('Supprimer ce projet local et ses versions ? Exporte-le auparavant.'))return;await exclusive(async()=>{if(recording||recordFinalizing||micPending)throw Error('Termine la prise en cours.');await flushCurrent();const index=projectIndex.filter(p=>p.id!==id);await new Promise((resolve,reject)=>{const tx=db.transaction('sessions','readwrite'),store=tx.objectStore('sessions');store.delete(projectKey(id));const prefix='project:'+id+':';const range=IDBKeyRange.bound(prefix,prefix+String.fromCharCode(65535));store.openCursor(range).onsuccess=e=>{const cursor=e.target.result;if(cursor){cursor.delete();cursor.continue();}};store.put(index,'project-index');tx.oncomplete=resolve;tx.onerror=()=>reject(tx.error);tx.onabort=()=>reject(tx.error||Error('Transaction annulée'));});projectIndex=index;if(activeProjectId===id){activeProjectId=null;engine.resetSession();closeAllPluginWindows();project=emptyProject();assets=new Map();history=[];future=[];backupAvailable=false;render();updateUndo();}});showProjectLibrary();}catch(e){toast(e.message)}});
 $('libraryRecover').onclick=async()=>{try{const old=await dbRead('current');if(!old?.project)throw Error('Aucune ancienne session.');if(!confirm('Importer cette ancienne session locale ? Vérifie qu’elle t’appartient.'))return;await createProjectLocal('Session récupérée - '+old.project.name,old.project,old.assets||[]);toast('Session récupérée, original conservé.')}catch(e){toast(e.message)}};
}

const engine=new AudioEngine(()=>project,()=>assets);
const divinityUI=createDivinityUI({getProject:()=>project,getTrack:()=>currentTrack(),engine,checkpoint,changed,toast,renderMastering,renderLibrary});
engine.onSampleStatus=({type,done,total,error})=>toast(error||((done===total?'Sons prêts : ':'Chargement des sons : ')+(ACOUSTIC_INSTRUMENTS[type]?.name||INSTRUMENTS[type]?.name||'Instruments')));
let piano=null,signature=null;
const currentTrack=()=>project.tracks.find(t=>t.id===selectedTrack)||project.tracks[0];
const currentClip=()=>selectedClip===null?piano?.draft(selectedTrack):currentTrack()?.clips.find(c=>c.id===selectedClip);
const clone=v=>JSON.parse(JSON.stringify(v));
function parameterTrack(element){const owner=element.closest('[data-plugin-track]');return owner?project.tracks.find(t=>t.id===owner.dataset.pluginTrack):currentTrack();}

function toast(message){$('toast').textContent=message;$('toast').classList.add('visible');clearTimeout(toastTimer);toastTimer=setTimeout(()=>$('toast').classList.remove('visible'),4000);}
function checkpoint(){pluginEditGroup++;history.push(clone(project));if(history.length>40)history.shift();future=[];updateUndo();}
function updateUndo(){$('undo').disabled=!history.length;$('redo').disabled=!future.length;}
function undo(redo=false){if(recording||recordFinalizing||micPending){toast('Termine la prise avant Annuler/Rétablir.');return;}const from=redo?future:history,to=redo?history:future;if(!from.length)return;engine.pause();to.push(clone(project));project=from.pop();pluginEdits.clear();project.tracks.forEach(ensurePlugins);if(!project.tracks.some(t=>t.id===selectedTrack)){selectedTrack=project.tracks[0]?.id;selectedClip=null;}if(!currentTrack()?.clips.some(c=>c.id===selectedClip))selectedClip=currentTrack()?.clips[0]?.id;engine.sync();render();save();}
function changed(full=false){project.tracks.forEach(ensurePlugins);syncPluginEdits();engine.sync();save();if(full)render();}
let saveRevision=0;
function save(){if(!loaded||!activeProjectId)return;saveRevision++;$('saveStatus').innerHTML='<em></em> Enregistrement…';clearTimeout(saveTimer);saveTimer=setTimeout(()=>{saveTimer=null;persist().catch(()=>{});},500);}
async function openDB(){return new Promise((resolve,reject)=>{const request=indexedDB.open('chayah-studio',1);request.onupgradeneeded=()=>request.result.createObjectStore('sessions');request.onsuccess=()=>resolve(request.result);request.onerror=()=>reject(request.error);});}
async function persist(){
 if(!activeProjectId||!db)return;
 const id=activeProjectId,copy=clone(project),volume=engine.masterVolume,revision=saveRevision;
 const media=[...assets].map(([assetId,a])=>({id:assetId,name:a.name,data:a.data}));
 const job=saveQueue.catch(()=>{}).then(async()=>{
   const index=projectIndex.map(item=>item.id===id?{...item,name:copy.name,updatedAt:Date.now()}:item);
   await writeLocalProject(db,id,{project:copy,masterVolume:volume,assets:media},index);
   projectIndex=index;
   if(activeProjectId===id){try{await workflow.snapshot();}catch(error){console.warn('Historique non sauvegardé',error);}if(activeProjectId===id&&revision===saveRevision&&saveTimer===null)$('saveStatus').textContent='Enregistré sur cet appareil';}
   scheduleAutoCloud(id,copy,media);
 });
 saveQueue=job;
 try{await job;}catch(error){if(activeProjectId===id){$('saveStatus').textContent='Sauvegarde impossible';toast(error.message);}throw error;}
}
async function restore(){
 try{db=await openDB();projectIndex=await dbRead('project-index')||[];if(!Array.isArray(projectIndex))projectIndex=[]}catch{toast('Stockage local indisponible.')}
 loaded=true;project.tracks.forEach(ensurePlugins);render();$('saveStatus').textContent='Choisir un projet';document.documentElement.dataset.appReady='true';$('bootError').hidden=true;signature?.activate();if(db)showProjectLibrary();
 const requestedDemo=new URLSearchParams(location.search).get('demo')?.toLowerCase();
 if(requestedDemo&&Object.hasOwn(PUBLIC_DEMOS,requestedDemo))await launchPublicDemo(requestedDemo);
 if(location.protocol==='https:'){
  const pairingRequested=location.hash.includes('warlike_studio_pair');
  completeStudioPairing().then(async paired=>{
   studioCloudIdentity=await getStudioCloud().connect();updateCloudAccount();
   if(paired)cloudSessionChannel?.postMessage('changed');
   if(paired){toast('Compte WarLike associé. Choisis un projet à synchroniser.');showProjectLibrary();}
  }).catch(error=>{if(pairingRequested)toast(error.message);});
 }
}

function render(){
  // Expose only non-sensitive device routing to the Recording Pro input tester.
  if($('recordWorkspaceBar')){ $('recordWorkspaceBar').dataset.deviceId=project.audioSetup?.deviceId||''; $('recordWorkspaceBar').dataset.channel=project.audioSetup?.channel||'1'; }
  project.recording=recordingSettings(project.recording);project.mastering=masteringSettings(project.mastering);
  $('sessionRoot').value=String(project.pianoKey??9);$('sessionScale').value=project.pianoScale||'minor';$('sessionKey').textContent=project.keyName||(['Do','Do♯','Ré','Mi♭','Mi','Fa','Fa♯','Sol','La♭','La','Si♭','Si'][project.pianoKey??9]+' '+(project.pianoScale==='major'?'majeur':project.pianoScale==='chromatic'?'chromatique':'mineur'));$('projectName').value=project.name;if(document.activeElement!==$('bpm'))$('bpm').value=project.bpm;$('bars').value=project.bars;
  document.documentElement.style.setProperty('--bars',project.bars);
  // Fit the session on first open; horizontal zoom remains available.
  const available=$('timelineScroll').clientWidth-parseInt(getComputedStyle(document.body).getPropertyValue('--track-label'));
  document.documentElement.style.setProperty('--timeline-width',`${arrangementWidth(available,timelineZoom,project.bars)}px`);
  $('zoomLabel').textContent=Math.round(timelineZoom*100)+'%';
  renderTracks();renderDetail();if(view==='mixer'||floatingMixerOpen())renderMixer();if(view==='mastering'||masterRackUI?.isOpen())renderMastering();updateUndo();updateTransport();$('previousSession').disabled=!backupAvailable;renderLibrary();renderFloatingPlugin();signature?.render();
}
function renderTracks(){
  $('trackCount').textContent=String(project.tracks.length).padStart(2,'0');
  const rulerStep=Math.max(1,Math.ceil(project.bars/64));
  const rulerTicks=Array.from({length:Math.ceil(project.bars/rulerStep)},(_,i)=>{const bar=i*rulerStep,seconds=Math.floor(bar*240/project.bpm);return '<div class="pt-ruler-tick" style="left:'+bar/project.bars*100+'%"><span>'+(bar+1)+'</span><small>'+Math.floor(seconds/60)+':'+String(seconds%60).padStart(2,'0')+'</small></div>';}).join('');
  $('ruler').innerHTML=Array.from({length:Math.ceil(project.bars/Math.ceil(project.bars/64))},(_,i)=>`<div class="ruler-bar">${String(i*Math.ceil(project.bars/64)+1).padStart(2,'0')}</div>`).join('')+'<span class="loop-label">BOUCLE</span><div class="pt-ruler-overlay" aria-hidden="true">'+rulerTicks+'</div>';renderLoopRange();
  const sections=(Array.isArray(project.sections)?project.sections:[]).filter(section=>Number.isFinite(section.start)&&Number.isFinite(section.length)&&section.start>=0&&section.length>0&&section.start+section.length<=project.bars);$('songSections').innerHTML=(sections.length?sections:[{name:'SESSION',start:0,length:project.bars}]).map(section=>`<button data-seek-section="${section.start}" style="left:${section.start/project.bars*100}%;width:${section.length/project.bars*100}%" title="Aller à ${esc(section.name)}">${esc(section.name)}</button>`).join('');
  $('trackRows').innerHTML=project.tracks.map((t,index)=>`<div class="track-row ${t.id===selectedTrack?'selected':''}" data-track="${t.id}" style="--track-color:${t.color}"><div class="track-head"><button class="track-grip" data-track-drag="${t.id}" data-track-name="${esc(t.name)}" aria-label="Déplacer la piste ${esc(t.name)}" title="Glisser pour réordonner la piste">⠿</button><button class="track-select" data-track-name="${esc(t.name)}" title="Clic : propriétés · Glisser : déplacer la piste" data-select-track="${t.id}" aria-label="Sélectionner la piste ${esc(t.name)}" aria-pressed="${t.id===selectedTrack}"><span class="track-icon">${icon(t.type==='audio'?'mic':t.type==='drums'?'drums':t.type==='bass'?'wave':'piano')}</span><div class="track-info"><span class="track-title">${esc(t.name)}</span><small class="track-subtitle">${String(index+1).padStart(2,'0')} · ${t.type==='audio'?'Audio':t.type==='bus'?'Bus / Aux':INSTRUMENTS[t.type]?.name||'Synth'}</small></div></button><div class="track-controls"><button data-delete-track="${t.id}" title="Supprimer ${esc(t.name)}" aria-label="Supprimer la piste ${esc(t.name)}">${icon('trash')}</button><button data-track-properties="${t.id}" title="Propriétés de ${esc(t.name)}" aria-label="Propriétés de ${esc(t.name)}">⋯</button>${t.type==='audio'?`<button data-record-arm="${t.id}" class="track-record-arm ${t.recordArm?'armed':''}" aria-pressed="${t.recordArm===true}" title="Armer la piste" aria-label="Armer ${esc(t.name)}">●</button><select data-record-input="${t.id}" aria-label="Entrée de ${esc(t.name)}" title="Entrée à enregistrer"><option value="1" ${t.recordInput!=='2'?'selected':''}>IN 1</option><option value="2" ${t.recordInput==='2'?'selected':''}>IN 2</option></select>`:'' }<button data-action="mute" class="${t.mute?'on':''}" title="Mute ${esc(t.name)}" aria-label="Mute ${esc(t.name)}" aria-pressed="${t.mute}">M</button><button data-action="solo" class="${t.solo?'on':''}" title="Solo ${esc(t.name)}" aria-label="Solo ${esc(t.name)}" aria-pressed="${t.solo}">S</button></div><div class="track-head-inserts" data-plugin-track="${t.id}">${insertSlotsHTML(t,false,2)}</div><div class="pt-track-routing"><button type="button" data-track-properties="${t.id}" title="Réglages de piste">I/O · ${esc(project.tracks.find(bus=>bus.id===t.output)?.name||"MASTER")}</button><span title="Envois auxiliaires">SEND ${t.sends?.length||0}</span><span title="Mode automation">${esc(t.automation?.mode||"off").toUpperCase()}</span></div><div class="track-strip-meta"><button class="head-volume" data-track-level="${t.id}" aria-label="Régler le volume de ${esc(t.name)}" title="Volume : cliquer pour ouvrir le fader"><span>VOL</span><strong data-db="${t.id}">${t.volume.toFixed(1)} dB</strong></button><button class="head-pan" data-track-pan="${t.id}" aria-label="Régler le panoramique de ${esc(t.name)}" title="Panoramique : cliquer pour régler"><span>PAN</span><strong data-pan-label="${t.id}">${panLabel(t.pan)}</strong></button></div><div class="track-mini-meter"><span data-meter="${t.id}"></span></div></div><div class="track-lane" data-lane="${t.id}">${t.clips.map(c=>`<div class="clip ${c.id===selectedClip||multiClips.has(c.id)?'selected':''}" data-clip="${c.id}" role="button" tabindex="0" aria-pressed="${c.id===selectedClip}" aria-label="${esc(c.name)}, mesure ${c.start+1}" style="left:${c.start/project.bars*100}%;width:calc(${c.length/project.bars*100}% - 4px)"><span class="clip-name">${esc(c.name)}</span><canvas data-clip-canvas="${c.id}"></canvas>${fadeOverlay(c,project.bpm)}<span class="clip-trim-left" title="Rogner le début"></span><span class="clip-resize" title="Rogner la fin"></span></div>`).join('')}${!t.clips.length?`<div class="empty-track-hint">${icon(t.type==='audio'?'mic':'plus')}${t.type==='audio'?'Importe un son · ou enregistre ta voix':'Double-clic pour créer un pattern'}</div>`:''}</div></div>`).join('');
  renderSessionSidebar();updateEditSelection();workflow.renderTimeline();requestAnimationFrame(drawClips);
}
function drawClips(){for(const t of project.tracks)for(const c of t.clips){const canvas=document.querySelector(`[data-clip-canvas="${c.id}"]`);if(canvas)drawClip(canvas,t,c);}}
function drawClip(canvas,tr,clip){
  clip=resolvePatternClip(project,tr,clip);
  const width=Math.min(8192,Math.max(10,canvas.clientWidth)),height=Math.max(10,canvas.clientHeight),ratio=devicePixelRatio||1;canvas.width=width*ratio;canvas.height=height*ratio;const ctx=canvas.getContext('2d');ctx.scale(ratio,ratio);ctx.fillStyle=getComputedStyle(document.documentElement).getPropertyValue('--wave-ink').trim()||tr.color;ctx.strokeStyle=ctx.fillStyle;
  if(clip.audioId){const a=assets.get(clip.audioId);if(!a)return;const data=a.buffer.getChannelData(0),displayLength=clip.length*16*engine.stepDuration*a.buffer.sampleRate;for(let x=0;x<width;x++){const offset=(clip.sourceOffset||0)*a.buffer.sampleRate,lo=Math.floor(offset+x/width*displayLength),hi=Math.max(lo+1,Math.floor(offset+(x+1)/width*displayLength));let max=0;for(let j=lo;j<hi;j+=Math.max(1,Math.floor((hi-lo)/18)))max=Math.max(max,Math.abs(data[j]||0));const h=Math.max(1,Math.min(height,max*Math.pow(10,clampClipGain(clip.gainDb)/20)*height));ctx.fillRect(x,(height-h)/2,1,h);}}
  else if(tr.type==='drums'){const steps=clip.length*16,phase=clip.patternOffset||0;for(let s=Math.ceil(phase);s<phase+steps;s++)Object.entries(clip.pattern||{}).forEach(([_,p],i)=>{if(p[s%(clip.patternSteps||16)])ctx.fillRect((s-phase)/steps*width+1,i*(height/8)+1,Math.max(1,width/steps*.35),2);});}
  else{const notes=clip.notes||[],min=Math.min(24,...notes.map(n=>n.midi))-2,max=Math.max(69,...notes.map(n=>n.midi))+2,steps=clip.length*16;const phase=clip.patternOffset||0,period=clip.patternSteps||32;for(let base=Math.floor(phase/period)*period;base<phase+steps;base+=period)for(const n of notes){const start=base+n.step-phase,lo=Math.max(0,start),hi=Math.min(steps,start+n.len);if(hi<=lo)continue;ctx.fillRect(lo/steps*width,(1-(n.midi-min)/(max-min))*(height-5)+1,Math.max(1,(hi-lo)/steps*width-1),2);}}
}
function updateSelectionMarkers(){renderSessionSidebar();updateEditSelection();document.querySelectorAll('[data-mixer-track]').forEach(channel=>channel.classList.toggle('selected',channel.dataset.mixerTrack===selectedTrack));document.querySelectorAll('[data-track]').forEach(row=>row.classList.toggle('selected',row.dataset.track===selectedTrack));document.querySelectorAll('.track-select').forEach(button=>button.setAttribute('aria-pressed',button.dataset.selectTrack===selectedTrack));document.querySelectorAll('[data-clip]').forEach(clip=>{const selected=clip.dataset.clip===selectedClip||multiClips.has(clip.dataset.clip);clip.classList.toggle('selected',selected);clip.setAttribute('aria-pressed',selected);});}
function selectTrack(id,clipId=undefined){if(floatingMixerPanel)delete floatingMixerPanel.dataset.effectsOwner;multiClips.clear();const tr=project.tracks.find(t=>t.id===id);if(!tr)return;selectedTrack=id;selectedClip=clipId===undefined?tr.clips[0]?.id:clipId;updateSelectionMarkers();renderDetail();if(view==='mixer'||floatingMixerOpen())renderMixer();if(view==='library')renderContentCards();}
function selectClipElement(element){const keep=new Set(multiClips);const id=element.dataset.clip,trackId=element.closest('[data-track]').dataset.track;detail='editor';selectTrack(trackId,id);if(keep.has(id)){multiClips=keep;updateSelectionMarkers();}document.querySelector(`[data-clip="${id}"]`)?.focus({preventScroll:true});}
let timeRange=null,rangeDrag=null;
function setEditingTool(tool){timeRange=null;rangeDrag=null;editingTool=tool;updateEditSelection();document.querySelectorAll('[data-edit-tool]').forEach(button=>{const active=button.dataset.editTool===tool;button.classList.toggle('active',active);button.setAttribute('aria-pressed',active);});$('trackRows').dataset.tool=tool;$('trackRows').classList.toggle('draw-mode',tool==='draw');}
function renderDetail(){
  const tr=currentTrack();if(!tr)return;ensurePlugins(tr);
  $('selectionColor').style.background=tr.color;$('selectionName').textContent=tr.name;
  $('editorTab').classList.toggle('selected',detail==='editor');$('pluginsTab').classList.toggle('selected',detail==='plugins');$('tuneTab').classList.toggle('selected',detail==='tune');
  $('editorContent').hidden=detail!=='editor';$('pluginsContent').hidden=detail!=='plugins';$('tuneContent').hidden=detail!=='tune';
  $('duplicateClip').disabled=!currentClip();$('deleteClip').disabled=!currentClip();
  if(detail==='plugins')renderPlugins();else if(detail==='tune')renderTune();else renderEditor();renderInspector();
}
function paramHTML(c,value,target){const f=(value-c.min)/(c.max-c.min);return `<div class="param"><div class="knob" style="--angle:${f*280}deg;--rotation:${f*280-140}deg"><input type="range" min="${c.min}" max="${c.max}" step="${c.step}" value="${value}" data-default="${c.default}" data-unit="${c.unit}" data-param="${target}.${c.key}" aria-label="${esc(c.name)}" title="${esc(c.name)} : glisser ↑↓, Maj pour affiner, double-clic pour réinitialiser"></div><label>${c.name}</label><button type="button" class="param-value" data-knob-value title="Saisir une valeur précise">${formatParam(c,value)}</button></div>`;}
function renderPlugins(){
  const tr=currentTrack(),def=instrumentDefinition(tr.type);
  const instrument=def?`<article class="plugin-card instrument-card" style="--track-color:${tr.color}"><div class="plugin-brand">CHAYAH / INSTRUMENTS</div><div class="plugin-heading"><h3><button class="plugin-title" data-plugin-open="instrument">${tr.type==='instrument'?'Charger un instrument…':def.name}${tr.type==='bass'?'<span style="font-size:10px;letter-spacing:1px;margin-left:6px">808</span>':''}</button></h3><i>${icon(tr.type==='keys'?'piano':tr.type==='drums'?'drums':'wave')}</i></div><div class="plugin-subtitle">${def.subtitle}</div><div class="plugin-params">${def.controls.slice(0,3).map(c=>paramHTML(c,tr.instrument[c.key]??c.default,'instrument')).join('')}</div><div class="plugin-bottom"><span>${def.sampled?'ENREGISTREMENTS STÉRÉO':'SYNTHÈSE'}</span><span>01.0</span></div></article>`:`<article class="plugin-card instrument-card" style="--track-color:${tr.color}"><div class="plugin-brand">CHAYAH / ${tr.type==='bus'?'BUS / AUX':'AUDIO'}</div><div class="plugin-audio-placeholder">${icon(tr.type==='bus'?'sliders':'mic')}<div><strong>${tr.type==='bus'?'Entrées de routage':'Audio enregistré ou importé'}</strong><small>${tr.type==='bus'?'Reçoit les sorties et les envois des pistes.':'Importe un fichier audio ou lance une prise micro.'}</small>${tr.type==='audio'?`<button class="outline-btn" data-import style="margin-top:12px">${icon('upload')} Importer audio</button>`:''}</div></div></article>`;
  $('pluginsContent').innerHTML=instrument+tr.inserts.filter(Boolean).map(id=>{const d=effectDefinition(id);return `<article class="plugin-card ${!tr.effects[id].enabled?'bypassed':''}"><div class="plugin-brand">CHAYAH / EFFECTS</div><div class="plugin-heading"><h3><button class="plugin-title" data-plugin-open="${id}">${d.name}</button></h3><button class="power ${!tr.effects[id].enabled?'off':''}" data-power="${id}" title="Activer / désactiver ${d.name}" aria-label="Activer / désactiver ${d.name}" aria-pressed="${tr.effects[id].enabled}">${icon('power')}</button></div><div class="plugin-subtitle">${d.subtitle}</div><div class="plugin-params">${d.controls.slice(0,3).map(c=>paramHTML(c,tr.effects[id][c.key],id)).join('')}</div><div class="plugin-bottom"><span>${id==='echo'?'SYNC · 3/16':id==='aura'?'STEREO · 1.8 s':id==='color'?'SOFT CLIP':id==='glue'?'PARALLEL · COMP':id==='prism'?'FREQ · GAIN · Q':'HP / LP'}</span><span>01.0</span></div></article>`;}).join('')+`<article class="plugin-card empty-insert-card"><div class="plugin-brand">INSERTS DE LA PISTE</div><h3>Choisir mes effets</h3><p>Clique sur un emplacement pour placer un plugin.</p>${insertSlotsHTML(tr)}</article>`;
  $('pluginsContent').insertAdjacentHTML('afterbegin',`<div class="vox-rack-launch"><div><strong>VOX STUDIORACKS</strong><small>Racks vocaux à effets réels · Trap / Afro / R&B / Clean</small></div><button class="outline-btn" id="openVoxStudioRacks">Ouvrir le rack</button></div>`);
  $('openVoxStudioRacks').onclick=()=>openVoxStudioRacks(tr.id);
  $('pluginsContent').insertAdjacentHTML('afterbegin',`<div class="mix-master-template-launch"><strong>TEMPLATES MIX</strong><span>Voix · Guitares · Batterie · Basse · Bus</span><button type="button" class="outline-btn" data-template-track="${tr.id}">Ouvrir les templates</button></div>`);
  const chains=installedTrackChains(localStorage);if(chains.length){
   const controls=document.createElement('div');controls.className='track-chain-extension';const label=document.createElement('label');label.textContent='CHAÎNES VOCALES INSTALLÉES ';const select=document.createElement('select');select.setAttribute('aria-label','Chaîne vocale installée');select.append(new Option('Choisir une chaîne…',''));for(const chain of chains)select.append(new Option(chain.name,chain.id));const apply=document.createElement('button');apply.type='button';apply.className='outline-btn';apply.textContent='Ajouter aux inserts libres';apply.onclick=()=>{const preset=installedTrackChains(localStorage).find(p=>p.id===select.value);if(!preset)return toast('Choisis une chaîne installée.');ensurePlugins(tr);if(tr.inserts.filter(x=>x===null).length<preset.effects.length)return toast('Pas assez d’inserts libres sur cette piste.');checkpoint();try{applyTrackChain(tr,preset);changed(true);toast(preset.name+' ajoutée aux inserts libres.')}catch(error){toast(error.message)}};label.append(select);controls.append(label,apply);$('pluginsContent').prepend(controls);
  }
  $('pluginsContent').querySelectorAll('.plugin-card:not(.empty-insert-card)').forEach((card,i)=>{if(i===0&&!def)return;const id=i===0?'instrument':tr.inserts.filter(Boolean)[i-1],name=i===0?def.name:effectDefinition(id).name;card.insertAdjacentHTML('beforeend',`<button class="plugin-expand" data-plugin-open="${id}" aria-label="Ouvrir ${name} en grand" title="Ouvrir ${name} en grand">${icon('grid')}</button>`);});
}
function renderEditor(){
  const tr=currentTrack(),clip=currentClip(),root=$('editorContent');
  if(tr&&clip&&instrumentDefinition(tr.type)&&tr.type!=='drums'&&piano){piano.render(tr,clip);return;}
  piano?.closeFloatingPiano();
  root.style.setProperty('--track-color',tr.color);
  if(tr.type==='bus'){root.innerHTML='<div class="empty-editor"><strong>Bus / auxiliaire</strong><p>Choisis les sorties et les envois des pistes dans leurs propriétés. Les inserts de ce bus restent à ton choix.</p></div>';return;}
  if(!clip){root.innerHTML=`<div class="empty-editor">${icon(tr.type==='audio'?'mic':'plus')}<span>${tr.type==='audio'?'Prêt pour ta prochaine prise.':'Crée ton premier pattern.'}</span><p>${tr.type==='audio'?'Importe un son ou appuie sur R pour enregistrer.':'Double-clique sur la timeline pour ajouter un clip.'}</p><button class="outline-btn" ${tr.type==='audio'?'data-import':'data-create-clip'}>${icon(tr.type==='audio'?'upload':'plus')}${tr.type==='audio'?'Importer un audio':'Créer un clip'}</button></div>`;return;}
  const header=`<div class="editor-header"><div class="editor-caption"><b>${esc(clip.name)}</b><span>${Number(clip.length.toFixed(2))} mesures · ${tr.type==='drums'?`pattern de ${clip.patternSteps||16} pas`:tr.type==='audio'?'audio':`pattern de ${clip.patternSteps||32} pas`}</span></div><div class="editor-mini-controls">${tr.type!=='audio'?`<label>Swing <input id="swing" type="range" min="0" max="75" value="${project.swing}" aria-label="Swing"><span id="swingValue">${project.swing}%</span></label>`:''}${tr.type!=='audio'&&tr.type!=='drums'?'<label>Note <select id="noteLength"><option value="1">1/16</option><option value="2">1/8</option><option value="4" selected>1/4</option><option value="8">1/2</option><option value="14">Accord long</option></select></label>':''}</div></div>`;
  if(tr.type==='drums'){
    const steps=clip.patternSteps||16;root.innerHTML=header+`<div class="drum-tools"><label>Longueur<select id="drumPatternBars">${patternBarOptions.map(b=>`<option value="${b}" ${b*16===steps?'selected':''}>${b} mes.</option>`).join('')}</select></label><select id="drumGroove" aria-label="Groove de batterie">${DRUM_GROOVES.map(g=>`<option value="${g.id}">${g.name} · ${g.style}</option>`).join('')}</select><button class="outline-btn" id="applyDrumGroove">Appliquer le groove</button><button class="outline-btn" id="openDrumRack">Channel Rack</button></div>`+Object.entries(DRUM_VOICES).map(([voice,name])=>`<div class="drum-row"><button class="drum-voice" data-preview="${voice}">${icon('play')}${name}</button><div class="drum-steps">${Array.from({length:steps},(_,s)=>`<button class="step ${clip.pattern?.[voice]?.[s]?'on':''}" data-step="${s}" data-voice="${voice}" aria-label="${name}, pas ${s+1}" aria-pressed="${!!clip.pattern?.[voice]?.[s]}"></button>`).join('')}</div><button class="drum-fill" data-drum-fill="${voice}" data-fill-every="2" title="Remplir un pas sur deux">1/8</button><button class="drum-fill" data-drum-fill="${voice}" data-fill-every="4" title="Remplir un pas sur quatre">1/4</button><button class="drum-fill" data-drum-fill="${voice}" data-fill-every="0" title="Vider cette percussion">×</button></div>`).join('');
    $('drumPatternBars').onchange=e=>{checkpoint();resizePattern(project,clip,Number(e.target.value));writePatternChannel(project,tr,clip);changed();renderEditor();};
    $('applyDrumGroove').onclick=()=>{const groove=DRUM_GROOVES.find(g=>g.id===$('drumGroove').value);checkpoint();clip.pattern=Object.fromEntries(Object.keys(DRUM_VOICES).map(voice=>[voice,Array.from({length:steps},(_,i)=>groove.pattern[voice][i%16])]));writePatternChannel(project,tr,clip);changed();renderEditor();drawClips();};
    $('openDrumRack').onclick=()=>piano.rack();for(const b of root.querySelectorAll('[data-drum-fill]'))b.onclick=()=>{checkpoint();const every=Number(b.dataset.fillEvery);clip.pattern[b.dataset.drumFill]=Array.from({length:steps},(_,i)=>every&&i%every===0?1:0);writePatternChannel(project,tr,clip);changed();renderEditor();drawClips();};
  }
  else if(tr.type==='audio'){
    const a=assets.get(clip.audioId);root.innerHTML=header+`<div class="audio-editor"><div class="audio-editor-info"><strong>${esc(a?.name||'Fichier manquant')}</strong><small>${a?`${a.buffer.duration.toFixed(2)} s · ${Math.round(a.buffer.sampleRate/1000)} kHz · ${a.buffer.numberOfChannels===1?'Mono':'Stéréo'}`:'Réimporte le fichier pour l’écouter.'}</small><small>Le gain et les effets sont appliqués à l’export.</small>${clip.vocalSource?'<small>Voix humaine · anglais · <a href="./vocal-credits.html" target="_blank" rel="noopener">Crédits, adaptations et CC BY 3.0</a></small>':''}</div><canvas id="audioWave"></canvas><div class="clip-level-controls"><label for="clipGain">Gain du clip <strong id="clipGainValue">${formatDb(clampClipGain(clip.gainDb))}</strong></label><input id="clipGain" type="range" min="-24" max="36" step="0.5" value="${clampClipGain(clip.gainDb)}" aria-label="Gain du clip audio"><small id="clipPeak"></small><button class="outline-btn" data-normalize-clip ${!a?'disabled':''}>${icon('sliders')} Normaliser à −6 dB</button><button class="clip-gain-reset" data-reset-clip-gain>Gain à 0 dB</button></div></div>`;requestAnimationFrame(()=>{if($('audioWave')){drawClip($('audioWave'),tr,clip);updateClipPeak();}});
  }else{
    const notes=clip.notes||[],all=notes.map(n=>n.midi),base=tr.type==='bass'?29:tr.type==='lead'?65:53,min=Math.min(base,...all),max=Math.max(base+12,...all),rows=Math.min(28,max-min+1);
    root.innerHTML=header+`<div class="piano-wrap"><div class="piano-labels">${Array.from({length:rows},(_,i)=>max-i).map(n=>`<button class="piano-key ${[1,3,6,8,10].includes(n%12)?'black':''}" data-key="${n}" aria-label="Jouer ${noteName(n)}">${noteName(n)}</button>`).join('')}</div><div class="piano-grid" style="grid-template-rows:repeat(${rows},1fr)">${Array.from({length:rows},(_,i)=>max-i).map(n=>Array.from({length:32},(_,s)=>{const found=notes.find(x=>x.midi===n&&s>=x.step&&s<x.step+x.len);return `<button class="note-cell ${[1,3,6,8,10].includes(n%12)?'dark':''} ${s%16===0?'bar-start':''} ${found?'on':''}" data-note="${n}" data-nstep="${s}" aria-label="${noteName(n)}, pas ${s+1}" title="${noteName(n)} · ${s+1}" aria-pressed="${!!found}"></button>`;}).join('')).join('')}</div></div>`;
  }
  workflow.renderAudioEditor();
}
function renderMixer(){
  $('mixerView').innerHTML=project.tracks.map((tr,index)=>`<div class="mixer-channel ${tr.id===selectedTrack?'selected':''}" data-mixer-track="${tr.id}" data-plugin-track="${tr.id}" style="--track-color:${tr.color}"><div class="channel-top"><button data-delete-track="${tr.id}" title="Supprimer ${esc(tr.name)}" aria-label="Supprimer la piste ${esc(tr.name)}">${icon('trash')}</button><button class="mixer-track-grip" data-track-drag="${tr.id}" data-track-name="${esc(tr.name)}" title="Glisser pour déplacer la tranche dans le mixeur" aria-label="Déplacer la piste ${esc(tr.name)}">⠿</button><span>${String(index+1).padStart(2,'0')}</span><span>${instrumentDefinition(tr.type)?.name||(tr.type==='bus'?'BUS / AUX':'AUDIO')}</span><button data-track-properties="${tr.id}" aria-label="Propriétés de ${esc(tr.name)}" title="Propriétés de la piste">⋯</button></div><button class="channel-name" data-track-name="${esc(tr.name)}" title="Clic : propriétés · Glisser : réordonner" data-select-track="${tr.id}">${esc(tr.name)}</button>${instrumentDefinition(tr.type)?instrumentSlotHTML(tr):tr.type==='audio'?`<div class="channel-input-slot"><span>ENTRÉE AUDIO</span><select data-record-input="${tr.id}" aria-label="Entrée de ${esc(tr.name)}"><option value="1" ${tr.recordInput!=='2'?'selected':''}>IN 1</option><option value="2" ${tr.recordInput==='2'?'selected':''}>IN 2</option></select></div>`:'<div class="channel-input-slot"><span>BUS / AUX</span><small>Somme des pistes routées</small></div>'}<div class="channel-inserts has-vox-rack"><div class="vox-rack-row"><button class="vox-rack-mini" type="button" data-vox-rack-open="${tr.id}" title="VOX STUDIORACKS">VOX STUDIORACKS</button><button class="vox-rack-mini" type="button" data-template-track="${tr.id}" title="Templates de mixage">TEMPLATES MIX</button><button class="vox-rack-mini" type="button" data-war-rack-track="${tr.id}" title="Bibliothèque de presets de chaînes par source et étape">PRESETS WAR</button></div><div class="strip-label">INSERTS A–L </div>${insertSlotsHTML(tr)}</div><div class="channel-routing"><span>OUT</span> ${esc(project.tracks.find(bus=>bus.id===tr.output)?.name||"MASTER 1–2")}</div><div class="pan-control"><button type="button" class="pt-pan-knob" role="slider" tabindex="0" data-pt-pan="${tr.id}" aria-label="Panoramique ${esc(tr.name)}" aria-valuemin="-100" aria-valuemax="100" aria-valuenow="${Math.round(tr.pan*100)}" aria-valuetext="${esc(panLabel(tr.pan))}" style="--pan-angle:${tr.pan*135}deg"></button><label><span>L</span><button type="button" data-pan-center="${tr.id}" title="Recentrer la piste" aria-label="Recentrer ${esc(tr.name)}"><span data-pan-label="${tr.id}">${panLabel(tr.pan)}</span></button><span>R</span></label><input type="range" min="-1" max="1" step=".01" value="${tr.pan}" data-pan="${tr.id}" aria-label="Panoramique ${esc(tr.name)}"></div><div class="mixer-buttons">${tr.type==='audio'?`<button data-record-arm="${tr.id}" class="${tr.recordArm?'armed':''}" aria-pressed="${tr.recordArm===true}" aria-label="Armer ${esc(tr.name)}">R</button>`:''}<button class="${tr.mute?'on':''}" data-mute="${tr.id}" aria-label="Mute ${esc(tr.name)}">M</button><button class="${tr.solo?'on':''}" data-solo="${tr.id}" aria-label="Solo ${esc(tr.name)}">S</button></div><div class="mixer-fader"><div class="fader-scale"><span style="--pt-tick:0%">+12</span><span style="--pt-tick:20%">0</span><span style="--pt-tick:40%">-12</span><span style="--pt-tick:60%">-24</span><span style="--pt-tick:80%">-36</span><span style="--pt-tick:100%">-48</span></div><input type="range" min="-48" max="12" step=".5" value="${tr.volume}" data-volume="${tr.id}" aria-label="Volume ${esc(tr.name)}"><div class="channel-meter"><span data-meter="${tr.id}"></span></div><div class="pt-stereo-meter" aria-label="Crêtes gauche et droite"><button type="button" class="pt-peak-reset" data-pt-reset="${tr.id}" title="Réinitialiser les crêtes" aria-label="Réinitialiser les crêtes de la piste">CLIP</button><div class="pt-meter-scale" aria-hidden="true"><span>0</span><span>−12</span><span>−24</span><span>−36</span><span>−48</span><span>−60</span></div><i><span data-pt-meter="${tr.id}" data-side="0"></span></i><i><span data-pt-meter="${tr.id}" data-side="1"></span></i></div></div><button class="fader-db" data-track-level="${tr.id}" aria-label="Régler le volume de ${esc(tr.name)}"><span data-db="${tr.id}">${tr.volume.toFixed(1)} dB</span></button><button class="channel-footer" data-select-track="${tr.id}">${esc(tr.name)}</button></div>`).join('')+`<div class="mixer-channel mixer-master"><div class="channel-top"><span>Σ</span><span>STEREO</span></div><div class="channel-name">MASTER</div><button type="button" class="master-rack-launch" data-open-mastering title="Ouvrir le plugin de rack du bus Master">CHAYAH MASTER RACK</button><div class="channel-inserts"><div class="strip-label">INSERTS MASTER </div>${insertSlotsHTML(null,true)}</div><div class="channel-routing">STEREO OUT 1–2</div><div class="master-strip-caption">SORTIE STÉRÉO <button class="vox-rack-mini" type="button" data-template-master>Templates Master</button></div><div class="mixer-fader"><div class="fader-scale"><span style="--pt-tick:0%">+3</span><span style="--pt-tick:5.88235294117647%">0</span><span style="--pt-tick:29.411764705882355%">-12</span><span style="--pt-tick:52.94117647058824%">-24</span><span style="--pt-tick:76.47058823529412%">-36</span><span style="--pt-tick:100%">-48</span></div><input type="range" min="-48" max="3" step=".5" value="${engine.masterVolume}" data-master aria-label="Volume master"><div class="channel-meter"><span id="mixerMasterMeter"></span></div><div class="pt-stereo-meter" aria-label="Crêtes master gauche et droite"><button type="button" class="pt-peak-reset" data-pt-reset="all" title="Réinitialiser toutes les crêtes">RESET</button><div class="pt-meter-scale" aria-hidden="true"><span>0</span><span>−12</span><span>−24</span><span>−36</span><span>−48</span><span>−60</span></div><i><span data-pt-meter="master" data-side="0"></span></i><i><span data-pt-meter="master" data-side="1"></span></i></div></div><div class="fader-db" id="masterDb">${engine.masterVolume.toFixed(1)} dB</div><button class="channel-footer" data-open-mastering>MASTER 1–2</button></div>`;
  if($('mixerView').parentNode===floatingMixerPanel){
    const root=$('mixerView'), strips=document.createElement('div');strips.className='fl-mixer-strips';
    const rack=document.createElement('aside');rack.className='fl-mixer-effects';rack.setAttribute('aria-label','Inserts de la piste sélectionnée');
    const previousOwner=floatingMixerPanel.dataset.effectsOwner;
    const owner=previousOwner==='master'?'master':selectedTrack;
    const channels=[...root.querySelectorAll('.mixer-channel')];
    const selected=channels.find(n=>owner==='master'?n.classList.contains('mixer-master'):n.dataset.mixerTrack===owner)||channels.find(n=>n.classList.contains('mixer-master'));
    for(const channel of channels){const inserts=channel.querySelector('.channel-inserts');if(channel===selected&&inserts){const title=document.createElement('h3');title.textContent=channel.querySelector('.channel-name').textContent;rack.append(title,inserts);}else inserts?.remove();strips.append(channel);}
    const master=strips.querySelector('.mixer-master .channel-name');if(master){master.setAttribute('role','button');master.tabIndex=0;master.onclick=()=>{floatingMixerPanel.dataset.effectsOwner='master';renderMixer();};master.onkeydown=e=>{if(e.key==='Enter'||e.key===' '){e.preventDefault();master.click();}};}
    root.append(strips,rack);
  }
  $('mixerView').querySelectorAll('[data-vox-rack-open]').forEach(button=>button.onclick=()=>openVoxStudioRacks(button.dataset.voxRackOpen));
  workflow.renderMixer();
  // Presentation only: keep the live insert/send controls and their listeners.
  const mixRoot=$('mixerView');
  if(mixRoot.parentNode!==floatingMixerPanel) installPtMixSections(mixRoot);
  if(mixRoot.parentNode!==floatingMixerPanel){
    for(const channel of mixRoot.querySelectorAll('.mixer-channel')){
      const track=project.tracks.find(t=>t.id===channel.dataset.mixerTrack);
      channel.dataset.ptChannelKind=channel.classList.contains('mixer-master')?'master':track?.type==='bus'?'bus':track?.type==='audio'?'audio':'instrument';
    }
  }
}
// Browser-local presentation preferences, never serialized into a session.
function installPtMixSections(root){
  const ptMixSectionPrefs=installPtMixSections.prefs||={a:true,b:true,sends:true,io:true};
  if(!installPtMixSections.loaded){installPtMixSections.loaded=true;try{const saved=JSON.parse(localStorage.getItem('warlike.pt.mix.sections')||'{}');for(const k of Object.keys(ptMixSectionPrefs))if(typeof saved?.[k]==='boolean')ptMixSectionPrefs[k]=saved[k];}catch{}}
  let toolbar=root.previousElementSibling;
  if(!toolbar?.classList.contains('pt-mix-visibility')){
    toolbar=document.createElement('div');toolbar.className='pt-mix-visibility';toolbar.setAttribute('role','group');toolbar.setAttribute('aria-label','Sections du mixeur');
    root.before(toolbar);
    for(const [key,label] of [['a','Inserts A–F'],['b','Inserts G–L'],['sends','Sends'],['io','I/O']]){
      const button=document.createElement('button');button.type='button';button.textContent=label;button.dataset.ptSection=key;
      button.addEventListener('click',()=>{ptMixSectionPrefs[key]=!ptMixSectionPrefs[key];try{localStorage.setItem('warlike.pt.mix.sections',JSON.stringify(ptMixSectionPrefs));}catch{}apply();});
      toolbar.append(button);
    }
  }
  function apply(){for(const [key,value] of Object.entries(ptMixSectionPrefs)){root.classList.toggle('pt-hide-'+key,!value);toolbar.querySelector('[data-pt-section="'+key+'"]')?.setAttribute('aria-pressed',String(value));}}
  apply();
}
function insertSlotsHTML(track,master=false,limit=null){
  const slots=master?masteringSettings(project.mastering).inserts:track.inserts,registry=master?MASTER_MODULES:EFFECTS,owner=master?'master':track.id,state=master?masteringSettings(project.mastering):track.effects;
  return `<div class="insert-slots ${limit?'compact-inserts':''}">${slots.slice(0,limit||slots.length).map((id,i)=>{const letter=String.fromCharCode(65+i),name=id?(master?(rackIsSplit(id)?{name:'Division '+(state.splits[id].kind==='bands'?'par bandes':'parallèle')}:rackDefinition(registry,id)):effectDefinition(id)).name:'Aucun insert',on=id&&(rackIsSplit(id)?state.splits[id].enabled:state[id].enabled),attrs=`data-insert-track="${owner}" data-insert-master="${master}"`;return `<div class="insert-slot ${id?'occupied':'empty'} ${id&&!on?'insert-bypassed':''}"><span>${letter}</span><button ${id?`data-insert-open="${id}"`:`data-insert-slot="${i}"`} ${attrs} aria-label="${id?'Ouvrir '+name:'Choisir le plugin de l’insert '+letter} sur ${master?'MASTER':esc(track.name)}" title="${name}${id&&!on?' · Bypass':''}">${id?name:'—'}</button>${id?`<button class="insert-bypass" data-insert-bypass="${id}" ${attrs} aria-label="Bypass ${name} sur ${master?'MASTER':esc(track.name)}" aria-pressed="${!on}" title="${on?'Bypasser':'Réactiver'}">●</button><button class="insert-options" data-insert-slot="${i}" ${attrs} aria-label="Options de l’insert ${letter} sur ${master?'MASTER':esc(track.name)}" title="Remplacer, bypasser, déplacer, retirer">⋯</button>`:''}</div>`;}).join('')}</div>`;
}
function openInsertMenu(trackId,index,master=false,preferred=null){
  if(master)return openMasterRackInsert({index},preferred);
  const track=master?null:project.tracks.find(t=>t.id===trackId);if(!master&&!track)return;
  if(master)project.mastering=masteringSettings(project.mastering);else ensurePlugins(track);
  const slots=master?project.mastering.inserts:track.inserts,registry=master?MASTER_MODULES:EFFECTS,state=master?project.mastering:track.effects;
  if(index<0||index>=slots.length){toast('Tous les inserts sont occupés. Retire un module pour en choisir un autre.');return;}
  const id=slots[index],letter=String.fromCharCode(65+index),name=master?'MASTER':track.name;
  modal(`Effets · Insert ${letter} · ${name}`,`<div class="insert-menu"><label>PLUGIN<select id="insertChoice" aria-label="Plugin de l’insert ${letter}"><option value="">Aucun insert</option>${id&&!master&&id.includes('__')?`<option value="${id}" selected>${effectDefinition(id).name} · instance</option>`:''}${Object.entries(registry).map(([key,def])=>`<option value="${key}" ${key===id?'selected':''} ${master&&slots.includes(key)&&key!==id?'disabled':''}>${def.name} · ${def.subtitle}${master&&slots.includes(key)&&key!==id?' (déjà inséré)':''}</option>`).join('')}</select></label>${preferred&&!id?`<button class="primary-btn" id="insertPreferred">Insérer ${registry[preferred].name} ici</button>`:''}${id?`<div class="insert-menu-actions"><button class="outline-btn" id="editCurrentInsert">Ouvrir ${(master?registry[id]:effectDefinition(id)).name}</button><button class="outline-btn" id="bypassCurrentInsert">${state[id].enabled?'Bypasser':'Réactiver'}</button><button class="outline-btn" id="removeCurrentInsert">Retirer</button></div><label>DÉPLACER VERS<select id="insertDestination" aria-label="Destination de l’insert">${slots.map((key,i)=>`<option value="${i}" ${i===index?'selected':''}>${String.fromCharCode(65+i)} · ${key?(master?registry[key]:effectDefinition(key)).name:'Vide'}</option>`).join('')}</select></label><button class="outline-btn" id="moveCurrentInsert">Déplacer / échanger</button>${!master?'<button class="outline-btn" id="copyCurrentInsert">Copier vers cet emplacement vide</button>':''}`:''}<p>Signal : instrument ou entrée audio → inserts A à L → fader → sortie. Le bypass laisse passer le son et conserve les réglages.</p></div>`,'WARLIKE / EFFETS');
  const refresh=()=>{changed(true);$('modal').close();};
  const place=async (value,preset=null)=>{if(recording||recordFinalizing||micPending)return toast('Termine la prise avant de modifier les inserts.');if(master&&value&&slots.includes(value)&&slots[index]!==value){toast('Ce module est déjà présent sur le Master. Choisis un autre effet.');return;}if(value==='voxtune')try{await engine.init();}catch(error){toast(error.message);return;}checkpoint();if(master){const previous=slots[index];slots[index]=value;if(previous&&previous!==value)state[previous].enabled=false;if(value){state[value].enabled=true;if(preset&&isHardwarePreset(value))(isVector(value)?applyVectorPreset:isCircuit(value)?applyCircuitPreset:isVox(value)?applyVoxPreset:isExo(value)?applyExoPreset:applyAlterPreset)(state[value],value,registry[value],preset);}}else{value=placeInsert(track,index,value);if(value&&preset)applyPickerPreset(track,value,preset);}refresh();if(value&&!master)openPluginWindow(value,track.id);else if(value&&master)setView('mastering');};
  mountPluginPicker({root:document.querySelector('.insert-menu'),registry,selected:id?effectType(id):null,esc,disabledIds:master?slots.filter(item=>item&&item!==id):[],onChoose:value=>place(value),presetBanks:master?Object.fromEntries(Object.entries(registry).filter(([key])=>isHardwarePreset(key)).map(([key,def])=>[key,(isVector(key)?vectorPresetBank:isCircuit(key)?circuitPresetBank:isVox(key)?voxPresetBank:isExo(key)?exoPresetBank:alterPresetBank)(key,def,FACTORY_PRESETS,localStorage)])):pickerPresetBanks(registry),onPreset:(value,preset)=>place(value,preset)});
  $('insertChoice').closest('label').hidden=true;
  $('insertChoice').onchange=e=>place(e.target.value||null);
  if($('insertPreferred'))$('insertPreferred').onclick=()=>place(preferred);
  if(!id)return;
  $('editCurrentInsert').onclick=()=>{$('modal').close();if(master)setView('mastering');else openPluginWindow(id,track.id);};
  $('removeCurrentInsert').onclick=()=>place(null);
  $('bypassCurrentInsert').onclick=()=>{checkpoint();state[id].enabled=!state[id].enabled;refresh();};
  if($('copyCurrentInsert'))$('copyCurrentInsert').onclick=()=>{try{const to=Number($('insertDestination').value);checkpoint();copyInsert(track,index,to);refresh();}catch(error){toast(error.message);}};
  $('moveCurrentInsert').onclick=()=>{const to=Number($('insertDestination').value);if(to===index)return;checkpoint();if(master)[slots[index],slots[to]]=[slots[to],slots[index]];else moveInsert(track,index,to);refresh();};
}
function instrumentSlotHTML(track){return `<div class="track-instrument-slot" data-plugin-track="${track.id}"><span>INSTRUMENT</span><div><button data-plugin-open="instrument" aria-label="Ouvrir l’instrument de ${esc(track.name)}">${track.type==='instrument'?'Charger un instrument…':esc(instrumentDefinition(track.type).name)}</button>${track.type!=='drums'?`<button data-change-instrument="${track.id}" aria-label="Changer l’instrument de ${esc(track.name)}" title="Remplacer l’instrument en conservant les notes">▾</button>`:''}</div></div>`;}
function openInstrumentMenu(trackId){const track=project.tracks.find(t=>t.id===trackId);if(!track||!instrumentDefinition(track.type)||track.type==='drums')return;modal('Instrument · '+track.name,'<div id="instrumentPickerHost"></div><p class="picker-note">L’instrument choisi remplace le son sur cette piste. Les notes et les inserts sont conservés.</p>','WARLIKE / INSTRUMENTS');const choose=(type,preset=null)=>{if(recording||recordFinalizing||micPending)return toast('Termine la prise avant de changer d’instrument.');if(type!==track.type||preset){checkpoint();engine.stop();if(type!==track.type)changeInstrument(track,type);applyPickerPreset(track,'instrument',preset);changed(true);}$('modal').close();openPluginWindow('instrument',track.id);};mountPluginPicker({root:$('instrumentPickerHost'),registry:Object.fromEntries(Object.entries(INSTRUMENTS).filter(([type])=>type!=='drums'||track.type==='instrument'&&!track.clips.some(c=>c.notes?.length))),selected:track.type,esc,presetBanks:pickerPresetBanks(INSTRUMENTS),onPreset:(type,preset)=>choose(type,preset),onChoose:type=>choose(type)});}
function panLabel(v){return Math.abs(v)<.01?'CENTRE':`${Math.round(Math.abs(v)*100)}${v<0?' L':' R'}`;}
let masterPeakHold=-Infinity;
const masterMeterSamples=[new Float32Array(2048),new Float32Array(2048)];
function syncMasterWidgets(target,control,value){
  const f=(value-control.min)/(control.max-control.min);
  document.querySelectorAll(`[data-master-param="${target}"]`).forEach(input=>{input.value=value;input.parentElement.style.setProperty('--angle',`${f*280}deg`);input.parentElement.style.setProperty('--rotation',`${f*280-140}deg`);input.closest('.param').querySelector('.param-value').textContent=formatParam(control,value);});
}
function extensionMasterPresets(){try{const record=JSON.parse(localStorage.getItem('warlike.extensions.v1')||'{}')['studio-mix-presets'];return record?.enabled&&record.schema==='warlike.studio.mix-presets.v1'&&Array.isArray(record.data?.presets)?record.data.presets.filter(x=>x&&typeof x.name==='string'&&x.settings&&typeof x.settings==='object'):[]}catch{return []}}
function applyExtensionMaster(index){
 const preset=extensionMasterPresets()[index];if(!preset)return toast('Installe un preset depuis Extensions.');
 checkpoint();project.mastering=masteringSettings(preset.settings);changed();renderMastering();toast(preset.name+' appliqué à la chaîne master.');
}
function openWarRackBrowser(trackId=null){const tr=trackId===null?null:project.tracks.find(t=>t.id===trackId);if(trackId!==null&&!tr)return toast('Piste introuvable.');modal('Presets WAR · '+(tr?.name||'Master'),'<div id="warRackHost"></div>','WARLIKE / RACKS');mountRackBrowser($('warRackHost'),{track:tr,project,measureSource:tr?async()=>{if(recording||recordFinalizing||micPending)throw Error('Termine la prise.');return engine.renderRange({project:structuredClone(project),captureId:tr.id,preFader:true,clean:true,tail:false,sampleRate:44100});}:null,apply:async(r,mode,applyRack)=>{if(recording||recordFinalizing||micPending)throw Error('Termine la prise avant de modifier le rack.');if(mode==='replace'&&!confirm('Remplacer les inserts par '+r.name+' ? Annuler reste disponible.'))return false;const owner=project;if(r.stages?.some(s=>s.id==='voxtune'))await engine.init();if(project!==owner||tr&&!project.tracks.includes(tr)||recording||recordFinalizing||micPending)throw Error('Session modifiée pendant la préparation.');const draft=tr?structuredClone(tr):{mastering:structuredClone(project.mastering)};applyRack(r,{track:tr?draft:null,project:tr?null:draft,mode});checkpoint();if(tr){tr.inserts=draft.inserts;tr.effects=draft.effects;}else project.mastering=draft.mastering;$('modal').close();changed(true);toast(r.name+' appliqué.');return true;}});}
function openMixMasterTemplates(kind,trackId=null){
 const master=kind==='master',track=master?null:project.tracks.find(t=>t.id===trackId);
 if(!master&&!track)return toast('Piste introuvable.');
 const collection=master?MASTER_TEMPLATES:MIX_TEMPLATES;
 const genreOptions=[...new Set(collection.map(t=>t.genre))];
 const subtitle=master?'Le master remplacera uniquement la chaîne Master. Aucun fader de piste ne sera modifié.':'Choisis un mode explicite : remplacer les inserts de cette piste ou ajouter dans les emplacements libres.';
 const initial=collection[0];
 modal(master?'Templates Master':'Templates Mix · '+track.name,
  '<div class="mix-master-template-picker">'+
  '<p>'+esc(subtitle)+'</p><button type="button" class="outline-btn" id="openUniversalRack">WAR STUDIORACKS · Presets par source et étape</button>'+
  '<div class="mix-master-template-filters"><label>GENRE<select id="templateGenre"><option value="all">Tous les genres</option>'+genreOptions.map(g=>'<option value="'+esc(g)+'">'+esc(g)+'</option>').join('')+'</select></label>'+
  '<label>RECHERCHE<input id="templateSearch" type="search" placeholder="Trap, R&B, Afrobeat, rock…"></label></div>'+
  '<div class="mix-master-template-content"><div id="templateList" class="mix-master-template-list" role="listbox" aria-label="Templates disponibles"></div>'+
  '<section class="mix-master-template-detail"><h3 id="templateName"></h3><p id="templateDescription"></p><strong>CHAÎNE AUDIO · ORDRE DES INSERTS</strong><ol id="templateStages"></ol>'+
  (master?'': '<fieldset><legend>Mode d’application</legend><label><input type="radio" name="templateApplyMode" value="replace" checked> Remplacer les inserts de cette piste</label><label><input type="radio" name="templateApplyMode" value="append"> Ajouter dans les inserts libres</label></fieldset>')+
  '<p class="template-safety">Un seul point d’annulation. Les clips, instruments, faders, panoramiques et routages ne sont pas remplacés.</p>'+
  '<button type="button" id="applyMixMasterTemplate" class="primary-btn">Appliquer ce template</button></section></div></div>',
  master?'WARLIKE / MASTER TEMPLATES':'WARLIKE / MIX TEMPLATES');
 $('openUniversalRack').onclick=()=>openWarRackBrowser(master?null:track.id);
 let selected=initial.id;
 const byId=id=>collection.find(t=>t.id===id);
 const render=()=>{
  const query=$('templateSearch').value.trim().toLocaleLowerCase(),genre=$('templateGenre').value;
  const visible=collection.filter(t=>(genre==='all'||t.genre===genre)&&[t.name,t.genre,t.category,t.description].join(' ').toLocaleLowerCase().includes(query));
  if(!visible.some(t=>t.id===selected))selected=visible[0]?.id||null;
  $('templateList').replaceChildren(...visible.map(t=>{
   const button=document.createElement('button');button.type='button';button.className='mix-master-template-option';button.dataset.templateId=t.id;button.setAttribute('role','option');button.setAttribute('aria-selected',String(t.id===selected));
   const name=document.createElement('b');name.textContent=t.name;const caption=document.createElement('small');caption.textContent=t.genre+' · '+t.category;
   button.append(name,caption);button.onclick=()=>{selected=t.id;render();};return button;
  }));
  const t=byId(selected);$('applyMixMasterTemplate').disabled=!t;
  $('templateName').textContent=t?.name||'Aucun template trouvé';$('templateDescription').textContent=t?.description||'';
  $('templateStages').replaceChildren(...(t?(master?(t.stages||Object.entries(t.settings).filter(([id,v])=>MASTER_MODULES[id]&&v.enabled!==false).map(([id,values])=>({id,values}))):t.stages):[]).map(s=>{
   const item=document.createElement('li');item.textContent=(master?MASTER_MODULES[s.id]:EFFECTS[s.id])?.name||s.id;return item;
  }));
 };
 $('templateSearch').oninput=render;$('templateGenre').onchange=render;render();
 $('applyMixMasterTemplate').onclick=()=>{
  const template=byId(selected);if(!template)return;
  if(recording||recordFinalizing||micPending)return toast('Termine la prise avant de changer les chaînes.');
  const mode=master?'replace':document.querySelector('input[name="templateApplyMode"]:checked')?.value||'replace';
  const label=master?'la chaîne Master':'les inserts de '+track.name;
  if(mode==='replace'&&!confirm('Remplacer '+label+' par '+template.name+' ? Tu pourras utiliser Annuler.'))return;
  // Validate and stage on copies before checkpoint so failed applications never mutate the project.
  try{
   if(master){const draft={mastering:structuredClone(project.mastering)};applyMasterTemplate(draft,template);checkpoint();project.mastering=draft.mastering;}
   else{const draft=structuredClone(track);applyMixTemplate(draft,template,{mode});checkpoint();track.inserts=draft.inserts;track.effects=draft.effects;}
   $('modal').close();changed(true);if(master)renderMastering();toast('Template '+template.name+' appliqué.'); 
  }catch(error){toast(error.message);}
 };
}
function getMasterRack(){return masterRackUI??=createMasterRackUI({registry:MASTER_MODULES,getProject:()=>project,normalize:masteringSettings,checkpoint,changed,toast,render:()=>{renderMastering();if(view==='mixer'||floatingMixerOpen())renderMixer();},closed:()=>{if(view==='mixer'||floatingMixerOpen())renderMixer();},reduction:id=>{if(!id||project.mastering?.bypass||!project.mastering?.[id]?.enabled)return null;const type=rackType(id),host=engine.graph?.mastering,fx=host?.effects.get(id),child=fx?.processor||host,stage=fx?.channel?.stages[type];if(type==='vectorlimit')return stage?.reduction??null;if(type==='peak')return child?.peakProcessor?.reduction??null;const comp=type==='press'?child?.press:type==='glue'?fx?.channel?.compressor:stage?.comp||stage?.compressor;if(!comp)return null;return (comp.reduction||0)+(stage?.second?.reduction||0);},pick:openMasterRackInsert,format:formatParam,busy:()=>!!(recording||recordFinalizing||micPending)});}
function openMasterRackInsert(location,preferred=null){
 const state=masteringSettings(project.mastering),{list,index}=rackLocation(state,location),current=list[index];getMasterRack().open();
 modal('Module du rack · '+String.fromCharCode(65+index),'<div id="masterRackPicker"></div><div id="masterRackSlotActions" class="master-rack-picker-actions"></div>','CHAYAH / MASTER RACK');
 const actions=$('masterRackSlotActions');
 if(!location.splitId&&!current)for(const [kind,label] of [['parallel','Division parallèle'],['bands','Division par bandes']]){const b=document.createElement('button');b.type='button';b.className='outline-btn';b.textContent=label;b.dataset.rackCreateSplit=kind;b.onclick=()=>{getMasterRack().mutate(s=>insertRackSplit(s,index,kind));$('modal').close();getMasterRack().open();};actions.append(b);}
 if(current){const remove=document.createElement('button');remove.type='button';remove.className='outline-btn';remove.textContent='Retirer cet élément';remove.onclick=()=>{getMasterRack().mutate(s=>removeRackItem(s,location));$('modal').close();};actions.append(remove);}
 const place=(type,preset=null)=>{
  const selected=getMasterRack().mutate(draft=>{const slot=rackLocation(draft,location),old=slot.list[slot.index];let id=old;
   if(!id||rackIsSplit(id)||rackType(id)!==type){if(old)removeRackItem(draft,location);id=placeRackModule(draft,location,type,MASTER_MODULES);}draft[id].enabled=true;
   if(preset){if(isHardwarePreset(type))(isVector(type)?applyVectorPreset:isCircuit(type)?applyCircuitPreset:isVox(type)?applyVoxPreset:isExo(type)?applyExoPreset:applyAlterPreset)(draft[id],type,MASTER_MODULES[type],preset);else for(const c of MASTER_MODULES[type].controls)if(Number.isFinite(preset.values?.[c.key]))draft[id][c.key]=preset.values[c.key];}
   return id;
  });$('modal').close();if(selected)getMasterRack().openModule(selected);
 };
 mountPluginPicker({root:$('masterRackPicker'),registry:MASTER_MODULES,selected:current&&!rackIsSplit(current)?rackType(current):null,esc,onChoose:type=>place(type),presetBanks:Object.fromEntries(Object.entries(MASTER_MODULES).map(([type,def])=>[type,isHardwarePreset(type)?(isVector(type)?vectorPresetBank:isCircuit(type)?circuitPresetBank:isVox(type)?voxPresetBank:isExo(type)?exoPresetBank:alterPresetBank)(type,def,FACTORY_PRESETS,localStorage):(FACTORY_PRESETS[type]||[]).map(p=>({...p,source:'factory'}))])),onPreset:(type,preset)=>place(type,preset)});
}
function renderMastering(){
  project.mastering=masteringSettings(project.mastering);const state=project.mastering,legacyLeaves=rackLeaves(state).filter(id=>Object.hasOwn(MASTER_MODULES,id)&&(!masterRackUI||masterRackUI.selectedModule()===id)),selected=matchMasterPreset(project);
  $('masteringView').innerHTML=`<div class="mastering-heading"><div><span class="eyebrow">CHAYAH / MASTERING SUITE</span><h2>La touche finale.</h2><p>Place tes modules dans les inserts du master, dans l’ordre de ton choix.</p></div><button class="outline-btn ${state.bypass?'master-ab-active':''}" data-master-bypass aria-pressed="${state.bypass}">${state.bypass?'B · Chaîne bypassée':'A · Chaîne active'}</button></div>
  <div class="mastering-tools"><button class="outline-btn" type="button" data-template-master>Templates Master</button><label>EXTENSION INSTALLÉE<select id="extensionMasterPreset" aria-label="Préréglage de mastering téléchargé"><option value="">Choisir une extension…</option>${extensionMasterPresets().map((p,i)=>`<option value="${i}">${esc(p.name)}</option>`).join('')}</select></label><label>PRESET DE CHAÎNE<select id="masterPreset" aria-label="Preset de mastering"><option value="-1">Personnalisé</option>${MASTER_PRESETS.map((p,i)=>`<option value="${i}" ${i===selected?'selected':''}>${p.name}</option>`).join('')}</select></label><span>${esc(MASTER_PRESETS[selected]?.description||'Réglages personnalisés sur la sortie stéréo du morceau.')}</span><div class="master-rack-actions"><button class="text-btn" data-master-import>Charger</button><button class="outline-btn" data-master-export>Sauver le rack</button></div></div>
  <div class="master-meter-panel"><div class="master-stereo-bars"><div><b>L</b><div><span data-master-meter="0"></span></div><strong data-master-level="0">−∞</strong></div><div><b>R</b><div><span data-master-meter="1"></span></div><strong data-master-level="1">−∞</strong></div></div><div class="master-number"><span>CRÊTE / dBFS</span><strong data-master-peak>−∞</strong></div><div class="master-number"><span>RMS COURT / dBFS</span><strong data-master-rms>−∞</strong></div><button class="master-number peak-hold-reset" data-master-meter-reset title="Réinitialiser la crête mémorisée"><span>PEAK HOLD / dBFS ↺</span><strong data-master-hold>−∞</strong></button><div class="master-input-gain"><label>GAIN AVANT CHAÎNE <strong data-master-db>${engine.masterVolume.toFixed(1)} dB</strong></label><input type="range" min="-48" max="3" step=".5" value="${engine.masterVolume}" data-master aria-label="Gain avant mastering"></div></div>
  <div class="mastering-tools"><button class="outline-btn" id="certifyAudio">Analyser le rendu audio</button><button class="outline-btn" id="certifyTrackAudio">Diagnostiquer la piste sélectionnée</button><output id="audioCertification" aria-live="polite">Analyse hors ligne · Peak / RMS / LUFS / True Peak estimé / WAV float</output></div>
  <div class="master-insert-rack"><div class="master-rack-toolbar"><strong>CHAÎNE MASTER · 12 INSERTS</strong><button type="button" class="outline-btn" data-add-insert-track="master">+ Ajouter un plugin Master</button></div>${insertSlotsHTML(null,true)}</div><div class="master-module-grid ${state.bypass?'chain-bypassed':''}">${legacyLeaves.map((id,i)=>{const def=MASTER_MODULES[id];return `<article class="master-module ${state[id].enabled?'':'module-bypassed'}"><div class="master-module-top"><span>MASTER / 0${i+1}</span><button class="power ${state[id].enabled?'':'off'}" data-master-power="${id}" aria-label="Activer ${def.name} sur le master" aria-pressed="${state[id].enabled}">${icon('power')}</button></div><h3>${def.name}</h3><small>${def.subtitle}</small><p>${def.description}</p><div class="master-module-params">${def.controls.map(c=>paramHTML(c,state[id][c.key],id).replace('data-param=','data-master-param=')).join('')}</div><div class="master-module-foot">${['press','peak','circuitbus','vectorcomp','voxlevel','vectorlimit'].includes(id)?`<span>RÉDUCTION DE GAIN</span><strong data-master-gr="${id}">0.0 dB</strong>`:'<span>STÉRÉO · INSERT MASTER</span>'}</div></article>`;}).join('')||'<p class="empty-master-rack">Aucun plugin inséré. Clique sur un insert vide pour commencer.</p>'}</div>
  <div class="mastering-bottom"><span>Réglages conservés dans le projet et appliqués à l’export WAV. Les inserts sont vides dans une nouvelle session.</span><button class="text-btn" data-master-reset>Réinitialiser la chaîne</button></div>`;
  divinityUI.mountMaster($('masteringView'));
  $('extensionMasterPreset').onchange=event=>{if(event.target.value!=='')applyExtensionMaster(Number(event.target.value))};
  $('masterPreset').onchange=event=>{const index=Number(event.target.value);if(index<0)return;checkpoint();const name=applyMasterPreset(project,index);changed();renderMastering();toast(name+' appliqué au master.');};updateMasterMeters();
  for(const id of legacyLeaves){const root=$('masteringView').querySelector(`[data-master-power="${id}"]`)?.closest('.master-module');if(root)mountEqCurve({root,id,state:state[id],definition:MASTER_MODULES[id],checkpoint,master:true,change:(key,value)=>{syncMasterWidgets(id+'.'+key,MASTER_MODULES[id].controls.find(c=>c.key===key),value);changed();}});}
  if(legacyLeaves.includes('vectorcomp')){const root=$('masteringView').querySelector('[data-master-power="vectorcomp"]')?.closest('.master-module');if(root)mountVectorComp(root,{master:true,state:()=>project.mastering.vectorcomp,getReduction:()=>project.mastering.bypass||!project.mastering.vectorcomp?.enabled?0:engine.graph?.mastering?.effects?.get('vectorcomp')?.channel?.stages?.vectorcomp?.comp?.reduction??0});}
  if(legacyLeaves.includes('vectorlimit')){const root=$('masteringView').querySelector('[data-master-power="vectorlimit"]')?.closest('.master-module');if(root)mountVectorLimit(root,{master:true,state:()=>({...project.mastering.vectorlimit,enabled:!project.mastering.bypass&&project.mastering.vectorlimit?.enabled}),getStage:()=>engine.graph?.mastering?.effects?.get('vectorlimit')?.channel?.stages?.vectorlimit});}
  for(const id of legacyLeaves.filter(isVector)){const root=$('masteringView').querySelector('[data-master-power="'+id+'"]')?.closest('.master-module');if(root)mountVectorMasterPresets(root,{id,definition:MASTER_MODULES[id],state:()=>project.mastering[id],factory:FACTORY_PRESETS,storage:localStorage,checkpoint,changed:()=>{changed();renderMastering();},toast,busy:()=>recording||recordFinalizing||micPending});}
  if(legacyLeaves.includes('circuitbus')){const root=$('masteringView').querySelector('[data-master-power="circuitbus"]')?.closest('.master-module');if(root)mountCircuitBus(root,{master:true,state:()=>({...project.mastering.circuitbus,enabled:!project.mastering.bypass&&project.mastering.circuitbus?.enabled}),getReduction:()=>engine.graph?.mastering?.effects?.get('circuitbus')?.channel?.stages?.circuitbus?.comp?.reduction??0});}
  if(legacyLeaves.includes('circuitcolor')){const root=$('masteringView').querySelector('[data-master-power="circuitcolor"]')?.closest('.master-module');if(root)mountCircuitColor(root,{master:true,state:()=>({...project.mastering.circuitcolor,enabled:!project.mastering.bypass&&project.mastering.circuitcolor?.enabled})});}
  for(const id of legacyLeaves.filter(isCircuit)){const root=$('masteringView').querySelector('[data-master-power="'+id+'"]')?.closest('.master-module');if(root)mountCircuitMasterPresets(root,{id,definition:MASTER_MODULES[id],state:()=>project.mastering[id],factory:FACTORY_PRESETS,storage:localStorage,checkpoint,changed:()=>{changed();renderMastering();},toast,busy:()=>recording||recordFinalizing||micPending});}
  if(legacyLeaves.includes('voxlevel')){const root=$('masteringView').querySelector('[data-master-power="voxlevel"]')?.closest('.master-module');if(root)mountVoxLevel(root,{master:true,state:()=>({...project.mastering.voxlevel,enabled:!project.mastering.bypass&&project.mastering.voxlevel?.enabled}),getStage:()=>engine.graph?.mastering?.effects?.get('voxlevel')?.channel?.stages?.voxlevel});}
  if(legacyLeaves.includes('voxclean')){const root=$('masteringView').querySelector('[data-master-power="voxclean"]')?.closest('.master-module');if(root)mountVoxClean(root,{master:true,state:()=>({...project.mastering.voxclean,enabled:!project.mastering.bypass&&project.mastering.voxclean?.enabled}),getStage:()=>engine.graph?.mastering?.effects?.get('voxclean')?.channel?.stages?.voxclean});}
  if(legacyLeaves.includes('voxtune')){const root=$('masteringView').querySelector('[data-master-power="voxtune"]')?.closest('.master-module');if(root)mountVoxTune(root,{master:true,checkpoint,state:()=>({...project.mastering.voxtune,enabled:!project.mastering.bypass&&project.mastering.voxtune?.enabled}),getStage:()=>engine.graph?.mastering?.effects?.get('voxtune')?.channel?.stages?.voxtune});}
  if(legacyLeaves.includes('voxaireq')){const root=$('masteringView').querySelector('[data-master-power="voxaireq"]')?.closest('.master-module');if(root)mountVoxAir(root,{master:true,state:()=>({...project.mastering.voxaireq,enabled:!project.mastering.bypass&&project.mastering.voxaireq?.enabled})});}
  if(legacyLeaves.includes('voxambience')){const root=$('masteringView').querySelector('[data-master-power="voxambience"]')?.closest('.master-module');if(root)mountVoxAmbience(root,{master:true,state:()=>({...project.mastering.voxambience,enabled:!project.mastering.bypass&&project.mastering.voxambience?.enabled})});}
  if(legacyLeaves.includes('voxmicmodel')){const root=$('masteringView').querySelector('[data-master-power="voxmicmodel"]')?.closest('.master-module');if(root)mountVoxMic(root,{master:true,state:()=>({...project.mastering.voxmicmodel,enabled:!project.mastering.bypass&&project.mastering.voxmicmodel?.enabled})});}
  if(legacyLeaves.includes('voxwarm')){const root=$('masteringView').querySelector('[data-master-power="voxwarm"]')?.closest('.master-module');if(root)mountVoxWarm(root,{master:true,state:()=>({...project.mastering.voxwarm,enabled:!project.mastering.bypass&&project.mastering.voxwarm?.enabled})});}
  if(legacyLeaves.includes('voxdoubler')){const root=$('masteringView').querySelector('[data-master-power="voxdoubler"]')?.closest('.master-module');if(root)mountVoxDoubler(root,{master:true,state:()=>({...project.mastering.voxdoubler,enabled:!project.mastering.bypass&&project.mastering.voxdoubler?.enabled})});}
  for(const id of legacyLeaves.filter(isVox)){const root=$('masteringView').querySelector('[data-master-power="'+id+'"]')?.closest('.master-module');if(root)mountVoxMasterPresets(root,{id,definition:MASTER_MODULES[id],state:()=>project.mastering[id],factory:FACTORY_PRESETS,storage:localStorage,checkpoint,changed:()=>{changed();renderMastering();},toast,busy:()=>recording||recordFinalizing||micPending});}
  if(legacyLeaves.includes('exospace')){const root=$('masteringView').querySelector('[data-master-power="exospace"]')?.closest('.master-module');if(root){mountExoSpace(root,{master:true,state:()=>({...project.mastering.exospace,enabled:!project.mastering.bypass&&project.mastering.exospace?.enabled})});mountExoMasterPresets(root,{id:'exospace',definition:MASTER_MODULES.exospace,state:()=>project.mastering.exospace,factory:FACTORY_PRESETS,storage:localStorage,checkpoint,changed:()=>{changed();renderMastering();},toast,busy:()=>recording||recordFinalizing||micPending});}}
  if(legacyLeaves.includes('exofocus')){const root=$('masteringView').querySelector('[data-master-power="exofocus"]')?.closest('.master-module');if(root){mountExoFocus(root,{master:true,state:()=>({...project.mastering.exofocus,enabled:!project.mastering.bypass&&project.mastering.exofocus?.enabled}),getStage:()=>engine.graph?.mastering?.effects?.get('exofocus')?.channel?.stages?.exofocus});mountExoMasterPresets(root,{id:'exofocus',definition:MASTER_MODULES.exofocus,state:()=>project.mastering.exofocus,factory:FACTORY_PRESETS,storage:localStorage,checkpoint,changed:()=>{changed();renderMastering();},toast,busy:()=>recording||recordFinalizing||micPending});}}
  if(legacyLeaves.includes('exoair')){const root=$('masteringView').querySelector('[data-master-power="exoair"]')?.closest('.master-module');if(root){mountExoAir(root,{master:true,state:()=>({...project.mastering.exoair,enabled:!project.mastering.bypass&&project.mastering.exoair?.enabled})});mountExoMasterPresets(root,{id:'exoair',definition:MASTER_MODULES.exoair,state:()=>project.mastering.exoair,factory:FACTORY_PRESETS,storage:localStorage,checkpoint,changed:()=>{changed();renderMastering();},toast,busy:()=>recording||recordFinalizing||micPending});}}
  if(legacyLeaves.includes('exostrip')){const root=$('masteringView').querySelector('[data-master-power="exostrip"]')?.closest('.master-module');if(root){mountExoStrip(root,{master:true,state:()=>({...project.mastering.exostrip,enabled:!project.mastering.bypass&&project.mastering.exostrip?.enabled}),getStage:()=>engine.graph?.mastering?.effects?.get('exostrip')?.channel?.stages?.exostrip});mountExoMasterPresets(root,{id:'exostrip',definition:MASTER_MODULES.exostrip,state:()=>project.mastering.exostrip,factory:FACTORY_PRESETS,storage:localStorage,checkpoint,changed:()=>{changed();renderMastering();},toast,busy:()=>recording||recordFinalizing||micPending});}}
  if(legacyLeaves.includes('alterdouble')){const root=$('masteringView').querySelector('[data-master-power="alterdouble"]')?.closest('.master-module');if(root){mountAlterDouble(root,{master:true,state:()=>({...project.mastering.alterdouble,enabled:!project.mastering.bypass&&project.mastering.alterdouble?.enabled})});}}
  if(legacyLeaves.includes('alterecho')){const root=$('masteringView').querySelector('[data-master-power="alterecho"]')?.closest('.master-module');if(root){mountAlterEcho(root,{master:true,state:()=>({...project.mastering.alterecho,enabled:!project.mastering.bypass&&project.mastering.alterecho?.enabled}),getBpm:()=>project.bpm,getStage:()=>engine.graph?.mastering?.effects?.get('alterecho')?.channel?.stages?.alterecho});}}
  if(legacyLeaves.includes('alterfilter')){const root=$('masteringView').querySelector('[data-master-power="alterfilter"]')?.closest('.master-module');if(root){mountAlterFilter(root,{master:true,state:()=>({...project.mastering.alterfilter,enabled:!project.mastering.bypass&&project.mastering.alterfilter?.enabled}),getBpm:()=>project.bpm});}}
  mountAlterMasterSuite($('masteringView'),{inserts:legacyLeaves,definitions:MASTER_MODULES,state:()=>project.mastering,factory:FACTORY_PRESETS,storage:localStorage,checkpoint,changed:()=>{changed();renderMastering();},toast,busy:()=>recording||recordFinalizing||micPending});
  workflow.renderMastering();
  $('certifyTrackAudio').onclick=async()=>{
   const button=$('certifyTrackAudio'),full=$('certifyAudio'),out=$('audioCertification'),track=currentTrack();
   if(!track||track.type==='bus'){out.textContent='Sélectionne une piste instrument ou audio.';return;}
   if(recording||recordFinalizing||micPending||full.disabled)return;
   button.disabled=true;full.disabled=true;out.textContent='Diagnostic PCM de la piste en cours…';
   try{
    const snapshot=structuredClone(project),endBar=Math.min(8,snapshot.bars);
    const issues=auditRouting(snapshot);if(issues.length)throw Error(issues.join(' ; '));
    const options={project:snapshot,captureId:track.id,startBar:0,endBar,sampleRate:44100,tail:false};
    const processed=auditContinuousPCM(await engine.renderRange(options));
    const bypassed=auditContinuousPCM(await engine.renderRange({...options,clean:true}));
    const describe=r=>r.invalid+' invalides, '+r.overRange+' hors plage, '+r.candidateCount+' discontinuités suspectes';
    out.textContent=track.name+' · '+endBar+' premières mesures · Avec traitements : '+describe(processed)+' · Effets désactivés : '+describe(bypassed)+' · Capture de piste hors Master ; mute, solo et automation peuvent influencer les résultats. Comparaison indicative, à confirmer à l’écoute.';
   }catch(e){out.textContent='Échec du diagnostic : '+e.message;}finally{button.disabled=false;full.disabled=false;}
  };
  mountMusicIndustry({root:$('masteringView'),getProject:()=>project,render:async snapshot=>engine.renderRange({project:snapshot,sampleRate:44100}),busy:()=>!!(recording||recordFinalizing||micPending)});
  $('certifyAudio').onclick=async()=>{const button=$('certifyAudio'),out=$('audioCertification');button.disabled=true;out.textContent='Analyse en cours…';try{const snapshot=structuredClone(project);const issues=auditRouting(snapshot);if(issues.length)throw Error(issues.join(' ; '));const buffer=await engine.renderRange({project:snapshot,sampleRate:44100});const m=measureAudio(buffer);const pcm=auditContinuousPCM(buffer);const locations=pcm.channels.flatMap(ch=>ch.candidates.map(x=>({...x,channel:ch.channel}))).sort((a,b)=>a.frame-b.frame).slice(0,5).map(x=>'canal '+x.channel+' à '+x.seconds.toFixed(3)+' s').join(', ');const loud=measureLoudness(buffer);const wav=verifyWav32(encodeCertificationWav(buffer,{bits:32}),buffer);const ceiling=snapshot.mastering?.peak;const excess=ceiling?.enabled&&!snapshot.mastering.bypass&&m.peakDb>ceiling.ceiling+.1;out.textContent=(m.invalid||m.clipped||!wav||excess||loud.truePeakDb>0||m.peakDb===-Infinity?'ÉCHEC':'Contrôles mesurés OK')+' · Peak '+m.peakDb.toFixed(2)+' dBFS · RMS '+m.rmsDb.toFixed(2)+' dBFS · WAV '+(wav?'OK':'invalide')+' · LUFS-I '+loud.integrated.toFixed(2)+' · LUFS-S max '+loud.shortTermMax.toFixed(2)+' · LUFS-M max '+loud.momentaryMax.toFixed(2)+' · dBTP estimé '+loud.truePeakDb.toFixed(2)+' (validation normative en attente)'+ ' · PCM : '+pcm.invalid+' invalides, '+pcm.overRange+' hors plage, '+pcm.candidateCount+' discontinuités suspectes'+(locations?' ('+locations+')':'')+' — à confirmer à l’écoute';}catch(e){out.textContent='Échec : '+e.message;}finally{button.disabled=false;}};
  masterRackUI?.decorate();
}
function updateMasterMeters(){
  if(view!=='mastering'&&!masterRackUI?.isOpen())return;masterRackUI?.meters(engine.graph?.mastering);const chain=engine.graph?.mastering,levels=[];let sum=0,count=0;
  for(let c=0;c<2;c++){const data=masterMeterSamples[c];if(chain)chain.meters[c].getFloatTimeDomainData(data);else data.fill(0);let peak=0;for(const sample of data){peak=Math.max(peak,Math.abs(sample));sum+=sample*sample;count++;}levels.push(peak);const db=peak>0?20*Math.log10(peak):-Infinity;const bar=document.querySelector(`[data-master-meter="${c}"]`),label=document.querySelector(`[data-master-level="${c}"]`);if(bar){const level=Math.max(0,Math.min(100,(db+60)/60*100))+'%';bar.style.width=level;bar.style.setProperty('--level',level);bar.setAttribute('aria-label',(c?'Droite':'Gauche')+' · '+(Number.isFinite(db)?db.toFixed(1):'−∞')+' dBFS');}if(label)label.textContent=Number.isFinite(db)?db.toFixed(1):'−∞';}
  const peak=Math.max(...levels),peakDb=peak>0?20*Math.log10(peak):-Infinity,rmsDb=sum>0?20*Math.log10(Math.sqrt(sum/count)):-Infinity;masterPeakHold=Math.max(masterPeakHold,peakDb);
  for(const [key,value] of [['peak',peakDb],['rms',rmsDb],['hold',masterPeakHold]]){const node=document.querySelector(`[data-master-${key}]`);if(node){node.textContent=Number.isFinite(value)?value.toFixed(1):'−∞';node.classList.toggle('hot',value>=-.1);}}
  for(const id of ['press','peak','circuitbus','vectorcomp','voxlevel','vectorlimit']){const node=document.querySelector(`[data-master-gr="${id}"]`);if(node){const m=chain?.effects?.get(id)?.channel.pack.modules[id],reduction=id==='press'?chain?.press.reduction:id==='peak'?chain?.peakProcessor?.reduction:id==='vectorlimit'?m?.reduction:(m?.comp?.reduction||0)+(m?.second?.reduction||0);node.textContent=(!project.mastering.bypass&&project.mastering[id].enabled?(reduction||0):0).toFixed(1)+' dB';}}
}
let floatingMixerPanel=null,floatingMixerWindow=null,mixerHome=null,mixerNext=null;
function floatingMixerOpen(){return !!floatingMixerPanel&&!floatingMixerPanel.hidden;}
function closeFloatingMixer(){if(!floatingMixerOpen())return;floatingMixerWindow.close();const node=$('mixerView');mixerHome.insertBefore(node,mixerNext&&mixerNext.parentNode===mixerHome?mixerNext:null);node.hidden=view!=='mixer';}
function showFloatingMixer(){
 const node=$('mixerView');
 if(!floatingMixerPanel){mixerHome=node.parentNode;mixerNext=node.nextSibling;floatingMixerPanel=document.createElement('section');floatingMixerPanel.className='fl-rack-window fl-mixer-window';floatingMixerPanel.hidden=true;floatingMixerPanel.setAttribute('aria-label','Mixer FL Studio');floatingMixerPanel.innerHTML='<header class="fl-rack-header"><strong>Mixer</strong><button type="button" data-float-minimize aria-label="Réduire">−</button><button type="button" data-float-close aria-label="Fermer">×</button></header>';document.body.append(floatingMixerPanel);floatingMixerWindow=installFloatingWindow(floatingMixerPanel,floatingMixerPanel.firstElementChild,{onClose:closeFloatingMixer,key:'mixer'});new MutationObserver(()=>{if(document.body.dataset.layoutProfile!=='fl')closeFloatingMixer();}).observe(document.body,{attributes:true,attributeFilter:['data-layout-profile']});window.addEventListener('resize',()=>{if(innerWidth<=760)closeFloatingMixer();});}
 floatingMixerPanel.append(node);node.hidden=false;renderMixer();floatingMixerWindow.show();
}
function setView(next){if(next==='mastering'){signature?.syncView(view);getMasterRack().open();return;}if(view==='library'&&['instru','game','sessions'].includes(bankState.tab)&&next!=='library')engine.stopPreview();if(next==='mixer'&&document.body.dataset.layoutProfile==='fl'&&innerWidth>760){if(view!=='arrange')setView('arrange');showFloatingMixer();return;}if(floatingMixerOpen()&&next!=='arrange')closeFloatingMixer();document.body.dataset.studioSurface='playlist';view=next;if(next==='mixer')showTrackProperties(false);document.body.dataset.studioView=next;$('editWindowName').textContent=next==='mixer'?'MIX WINDOW':'EDIT WINDOW';$('studioEditbar').hidden=next!=='arrange';document.querySelector('.edit-selection-bar').hidden=next!=='arrange';$('timelineView').hidden=next!=='arrange';$('mixerView').hidden=next!=='mixer'&&!floatingMixerOpen();$('libraryView').hidden=next!=='library';$('masteringView').hidden=!masterRackUI?.isOpen();document.querySelector('.workspace').classList.toggle('mastering-active',next==='mastering');document.querySelectorAll('[data-view]').forEach(b=>b.classList.toggle('selected',b.dataset.view===next));$('arrangementSection').classList.toggle('library-open',['library','mastering'].includes(next));$('openMastering').classList.toggle('active',!!masterRackUI?.isOpen());document.querySelector('.workspace-core').classList.toggle('library-active',['library','mastering'].includes(next));if(next==='mastering')renderMastering();else if(next==='mixer')renderMixer();else if(next==='library')renderLibrary();else render();signature?.syncView(next);}
function renderInspector(){
  const tr=currentTrack();if(!tr)return;ensurePlugins(tr);const root=$('trackInspector'),index=project.tracks.indexOf(tr);root.dataset.pluginTrack=tr.id;root.style.setProperty('--track-color',tr.color);
  root.innerHTML=`<div class="inspector-heading"><span>PROPRIÉTÉS DE LA PISTE</span><button data-close-properties aria-label="Fermer les propriétés de la piste" title="Fermer">×</button></div><div class="inspector-track-title"><span style="background:${tr.color}"></span><h3>${esc(tr.name)}</h3><small>${tr.type==='audio'?'AUDIO':instrumentDefinition(tr.type)?.name||'MIDI'}</small></div><div class="inspector-reorder"><button data-track-step="${tr.id}" data-step-direction="-1" ${index===0?'disabled':''} aria-label="Monter ${esc(tr.name)}" title="Monter la piste">↑</button><span>PISTE ${index+1} / ${project.tracks.length}</span><button data-track-step="${tr.id}" data-step-direction="1" ${index===project.tracks.length-1?'disabled':''} aria-label="Descendre ${esc(tr.name)}" title="Descendre la piste">↓</button></div>${instrumentDefinition(tr.type)?instrumentSlotHTML(tr):''}<div class="inspector-identity"><label>NOM<input data-track-name-input="${tr.id}" aria-label="Nom de la piste sélectionnée" value="${esc(tr.name)}" maxlength="60"></label><label>COULEUR<input data-track-color-input="${tr.id}" aria-label="Couleur de la piste sélectionnée" type="color" value="${tr.color}"></label></div><div class="inspector-volume"><label>VOLUME <span class="volume-number-wrap"><input type="number" min="-48" max="12" step="0.5" value="${tr.volume}" data-volume-number="${tr.id}" aria-label="Volume en dB de ${esc(tr.name)}"><span>dB</span></span></label><input type="range" min="-48" max="12" step=".5" value="${tr.volume}" data-volume="${tr.id}" aria-label="Volume de la piste sélectionnée"><div class="volume-range-scale"><span>−48</span><button data-track-unity="${tr.id}" title="Ramener le volume à 0 dB">0 dB</button><span>+12</span></div><div class="inspector-pan-label"><span>L</span><button type="button" data-pan-center="${tr.id}" title="Recentrer la piste" aria-label="Recentrer ${esc(tr.name)}"><span data-pan-label="${tr.id}">${panLabel(tr.pan)}</span></button><span>R</span></div><input type="range" min="-1" max="1" step=".01" value="${tr.pan}" data-pan="${tr.id}" aria-label="Panoramique de la piste sélectionnée"><div class="mixer-buttons"><button class="${tr.mute?'on':''}" data-mute="${tr.id}" aria-label="Couper la piste sélectionnée">M</button><button class="${tr.solo?'on':''}" data-solo="${tr.id}" aria-label="Isoler la piste sélectionnée">S</button></div></div><div class="inspector-section-label">INSERTS CHAYAH</div><div class="inspector-inserts">${insertSlotsHTML(tr)}</div><div class="inspector-section-label">SORTIE</div><p class="inspector-route">${tr.type==='audio'?'Audio / micro':'Instrument'} → MASTER STÉRÉO 1–2</p><button class="outline-btn inspector-settings" data-inspector-settings>Réglages complets de la piste</button><button type="button" class="danger-btn inspector-settings" data-delete-track="${tr.id}">Supprimer cette piste</button>`;
  workflow.renderInspector();
}

function renderLibrary(){
  sidebarBrowser?.refresh();
  const count=contentCounts();$('instrumentCount').textContent=String(count.instruments).padStart(2,'0');$('effectCount').textContent=String(count.effects+1).padStart(2,'0');$('pluginsTab').querySelector('span').textContent=Object.keys(INSTRUMENTS).length+Object.keys(EFFECTS).length+4;document.querySelector('[data-bank-tab=effects] span').textContent=Object.keys(EFFECTS).reduce((n,id)=>n+FACTORY_PRESETS[id].length,0);$('contentStats').textContent=`${count.presets+INSTRU_PRESETS.length} presets · ${count.grooves} grooves · ${count.drums} percussions · ${count.sessions} sessions complètes`;
  document.querySelector('[data-bank-tab=sounds] span').textContent=Object.keys(INSTRUMENTS).reduce((n,id)=>n+FACTORY_PRESETS[id].length,0);document.querySelector('[data-bank-tab=packs] span').textContent=Object.keys(EFFECT_PACKS).length;document.querySelector('[data-bank-tab=instru] span').textContent=INSTRU_PRESETS.length;
  document.querySelector('[data-bank-tab=acoustic] span').textContent=Object.keys(ACOUSTIC_INSTRUMENTS).reduce((n,id)=>n+FACTORY_PRESETS[id].length,0);
  document.querySelector('[data-bank-tab=game] span').textContent=GAME_SOUNDS.length;
  $('bankSearch').value=bankState.search;document.querySelectorAll('[data-bank-tab]').forEach(b=>b.classList.toggle('selected',b.dataset.bankTab===bankState.tab));
  const choices=bankState.tab==='game'?Object.entries(GAME_SOUND_CATEGORIES):bankState.tab==='instru'?INSTRU_CATEGORIES.map(c=>[c,c]):['sounds','acoustic'].includes(bankState.tab)?Object.entries(bankState.tab==='acoustic'?ACOUSTIC_INSTRUMENTS:INSTRUMENTS).map(([id,d])=>[id,d.name]):bankState.tab==='effects'?Object.entries(EFFECTS).map(([id,d])=>[id,d.name]):bankState.tab==='packs'?Object.entries(EFFECT_PACKS).map(([id,p])=>[id,p.name]):bankState.tab==='grooves'?[...new Set(DRUM_GROOVES.map(g=>g.style))].map(s=>[s,s]):[];
  $('bankFilter').innerHTML='<option value="all">Tout afficher</option>'+choices.map(([id,name])=>`<option value="${esc(id)}" ${bankState.filter===id?'selected':''}>${esc(name)}</option>`).join('');$('bankFilter').disabled=!choices.length;renderContentCards();
}
function setBankTab(tab){engine.stopPreview();bankState.tab=tab;bankState.filter='all';bankState.search='';setView('library');}
function renderPackCards(){
  const normal=value=>String(value).toLowerCase().normalize('NFD').replace(/\p{M}/gu,''),search=normal(bankState.search);
  const packs=Object.entries(EFFECT_PACKS).filter(([id,p])=>(bankState.filter==='all'||bankState.filter===id)&&normal(p.name+' '+p.description+' '+(p.instruments||[]).map(key=>INSTRUMENTS[key]?.name||key).join(' ')+' '+p.modules.map(key=>EFFECTS[key].name+' '+EFFECTS[key].subtitle+' '+FACTORY_PRESETS[key].map(p=>p.name).join(' ')).join(' ')).includes(search));
  $('bankResults').textContent=packs.length+' pack'+(packs.length>1?'s':'');
  $('contentCards').innerHTML=packs.map(([id,pack])=>`<section class="effect-pack" style="--pack-color:${pack.color}"><div class="effect-pack-heading"><div><span>${pack.label}</span><h3>${pack.name}</h3></div><strong>${String(pack.modules.length+(pack.instruments?.length||0)).padStart(2,'0')}</strong></div><p>${pack.description}</p><div class="pack-modules">${pack.instruments?.includes('exo')?`<article class="pack-module exo-pack-instrument"><div class="pack-module-title"><h4>EXO</h4><small>INSTRUMENT / DUAL LAYER SYNTH</small></div><p>32 presets : keys, pads, leads, plucks, basses, bells, arps et textures. Banque avec recherche, favoris et sons personnels.</p><button class="content-add" data-suite-instrument="exo">Ouvrir / créer EXO</button></article>`:''}${pack.instruments?.includes('sampler')?'<article class="pack-module"><div class="pack-module-title"><h4>EXO SLICE</h4><small>SAMPLER / PADS</small></div><p>Charge un audio personnel et joue ses slices ou un sample accordé.</p><button class="content-add" data-suite-instrument="sampler">Ouvrir / créer EXO Slice</button></article>':''}${(pack.instruments||[]).filter(key=>INSTRUMENTS[key]?.pack==='wlexpansion').map(key=>{const def=INSTRUMENTS[key];return `<article class="pack-module"><div class="pack-module-title"><h4>${esc(def.name)}</h4><small>${esc(def.subtitle)}</small></div><p>${esc(def.description)}</p><button class="content-add" data-suite-instrument="${key}">Ouvrir / créer ${esc(def.name)}</button></article>`;}).join('')}${pack.modules.map(key=>{const def=EFFECTS[key];return `<article class="pack-module"><div class="pack-module-title"><h4>${def.name}</h4><small>${def.subtitle}</small></div><p>${def.description}</p><label>PRESET<select data-pack-preset="${key}" aria-label="Preset ${def.name}">${FACTORY_PRESETS[key].map((p,i)=>`<option value="${i}">${esc(p.name)}</option>`).join('')}</select></label><div class="pack-module-actions"><button class="content-add" data-pack-apply="${key}" aria-label="Appliquer le preset ${def.name}">${icon('check')} Appliquer</button><button class="outline-btn" data-plugin-open="${key}" aria-label="Ouvrir ${def.name}">Ouvrir</button></div></article>`;}).join('')}</div><div class="pack-target">Destination : <strong>${esc(currentTrack()?.name||'la piste sélectionnée')}</strong>${id==='wlexpansion'?' · 3 presets par instrument · pistes MIDI':' · 5 presets par effet · disponibles aussi dans les inserts du master'}</div></section>`).join('')||'<div class="bank-empty">Aucun pack trouvé.</div>';
  divinityUI.decoratePacks($('contentCards'));
}
function patternThumbnail(pattern){return `<svg class="groove-thumbnail" viewBox="0 0 160 48" aria-hidden="true">${Object.values(pattern).map((row,r)=>row.map((on,s)=>`<rect x="${s*10+1}" y="${r*6+1}" width="7" height="3" rx=".5" opacity="${on?'.85':'.12'}"/>`).join('')).join('')}</svg>`;}
function renderContentCards(){
  $('contentCards').classList.toggle('instru-bank-grid',['instru','game'].includes(bankState.tab));
  if(bankState.tab==='game'){renderGameSoundBank({root:$('contentCards'),results:$('bankResults'),search:bankState.search,category:bankState.filter,onPreview:previewGameSound,onStop:()=>engine.stopPreview(),onAdd:addGameSound,onWav:id=>download(gameSoundWav(id),id+'.wav','audio/wav'),onPack:(query,category)=>download(gameSoundPack(query,category),'warlike-game-sounds.zip','application/zip')});return;}
  if(bankState.tab==='instru'){renderInstruBank({root:$('contentCards'),results:$('bankResults'),search:bankState.search,category:bankState.filter,track:currentTrack(),onPreview:previewInstruSound,onStop:()=>engine.stopPreview(),onAdd:addInstruSound,onApply:applyInstruSound});return;}
  $('contentCards').classList.toggle('pack-grid',bankState.tab==='packs');if(bankState.tab==='packs'){renderPackCards();return;}
  const normal=s=>String(s).toLowerCase().normalize('NFD').replace(/\p{M}/gu,''),search=normal(bankState.search);let items=[];
  if(['sounds','acoustic','effects'].includes(bankState.tab)){
    const defs=bankState.tab==='acoustic'?ACOUSTIC_INSTRUMENTS:bankState.tab==='sounds'?INSTRUMENTS:EFFECTS;
    for(const [type,def] of Object.entries(defs))for(const [index,preset] of FACTORY_PRESETS[type].entries())items.push({kind:bankState.tab==='acoustic'?'sounds':bankState.tab,type,index,name:preset.name,subtitle:def.name+' / '+def.subtitle,color:def.color||'#a9b78b',search:preset.name+' '+def.name+' '+def.subtitle+' '+(def.description||'')});
  }else if(bankState.tab==='grooves')items=DRUM_GROOVES.map(g=>({...g,type:g.style,kind:'grooves',search:g.name+' '+g.style}));
  else if(bankState.tab==='kit')items=Object.entries(DRUM_VOICES).map(([voice,name])=>({voice,name,type:'kit',kind:'kit',search:name+' '+voice}));
  else items=SESSION_TEMPLATES.map(t=>({...t,type:'sessions',kind:'sessions',search:t.name+' '+t.style+' '+t.description}));
  items=items.filter(item=>(bankState.filter==='all'||item.type===bankState.filter)&&normal(item.search).includes(search));$('bankResults').textContent=`${items.length} résultat${items.length>1?'s':''}`;
  $('contentCards').innerHTML=items.map(item=>{
    if(['sounds','effects'].includes(item.kind)){const token=item.type+':'+item.index,isSound=item.kind==='sounds';return `<article class="content-card" style="--card-color:${item.color}"><div class="content-card-type">${isSound?'INSTRUMENT / PRESET':'EFFET / PRESET'}<span>${String(item.index+1).padStart(2,'0')}</span></div><h3>${esc(item.name)}</h3><p>${esc(item.subtitle)}</p><div class="preset-mini-bars" aria-hidden="true">${[28,43,65,37,55,28,47].map((h,i)=>`<span style="height:${h}%;opacity:${.25+i*.09}"></span>`).join('')}</div><div class="content-card-actions">${isSound?`<button class="outline-btn" data-bank-preview="${token}" aria-label="Écouter ${esc(item.name)}">${icon('play')} Écouter</button><button class="content-add" data-bank-add="${token}" aria-label="Ajouter ${esc(item.name)}">${icon('plus')} Ajouter</button>`:`<button class="outline-btn" data-bank-apply="${token}" aria-label="Appliquer ${esc(item.name)}">${icon('check')} Appliquer</button><small>Sur ${esc(currentTrack()?.name||'la piste')}</small>`}</div></article>`;}
    if(item.kind==='grooves')return `<article class="content-card groove-card"><div class="content-card-type">${esc(item.style)}<span>${item.bpm} BPM</span></div><h3>${esc(item.name)}</h3>${patternThumbnail(item.pattern)}<p>16 pas · au tempo du projet à l’ajout</p><div class="content-card-actions"><button class="outline-btn" data-groove-preview="${item.id}" aria-label="Écouter ${esc(item.name)}">${icon('play')} Écouter</button><button class="content-add" data-groove-add="${item.id}" aria-label="Ajouter ${esc(item.name)}">${icon('plus')} Ajouter</button></div></article>`;
    if(item.kind==='kit')return `<article class="content-card kit-card"><div class="content-card-type">PULSE / SYNTHÈSE<span>ONE-SHOT</span></div><span class="kit-voice-icon">${icon(item.voice==='kick'||item.voice==='tom'?'drums':'wave')}</span><h3>${esc(item.name)}</h3><p>Percussion originale générée par CHAYAH.</p><div class="content-card-actions"><button class="outline-btn" data-preview="${item.voice}">${icon('play')} Écouter</button><button class="content-add" data-drum-download="${item.voice}" aria-label="Télécharger ${esc(item.name)} en WAV">${icon('download')} WAV</button></div></article>`;
    return `<article class="content-card session-card"><div class="content-card-type">${item.bars?'COMPOSITION ORIGINALE':'SESSION COMPLÈTE'}<span>${item.bpm} BPM</span></div><h3>${esc(item.name)}</h3><p>${esc(item.description)}</p><div class="session-sections-preview"><span>INTRO</span><span>COUPLET A</span><span>REFRAIN</span><span>${esc(item.bridgeLabel||(item.bars?'PONT':'BREAK'))}</span><span>OUTRO</span></div><small class="session-summary">${item.bars||fullSongBars(item.bpm)} mesures · 9 pistes · ${esc(FACTORY_STYLES[item.id].keyName)}</small><div class="content-card-actions"><button type="button" class="outline-btn" data-session-preview="${item.id}" data-preview-name="${esc(item.name)}" aria-pressed="false" aria-label="Écouter un extrait de ${esc(item.name)}">▶ Écouter</button><button class="outline-btn" data-groove-preview="${item.groove}" title="Écouter le rythme">${icon('play')} Rythme</button><button class="content-add" data-session-load="${item.id}">${icon('folder')} Ouvrir</button></div></article>`;
  }).join('')||'<div class="bank-empty">Aucun contenu trouvé. Essaie un autre filtre.</div>';
 if(bankState.tab==='sessions'){mountSessionPreview($('contentCards'),()=>engine.stopPreview());syncSessionPreview();}
}
function syncSessionPreview(){
 if(view==='library'&&bankState.tab==='sessions')updateSessionPreview($('contentCards'),engine.sessionPreview.state,engine.sessionPreview.elapsed);
 if($('modal').open){const root=$('modal').querySelector('.project-home-compositions');if(root)updateSessionPreview(root,engine.sessionPreview.state,engine.sessionPreview.elapsed);}
}
engine.onSessionPreviewChange=()=>{syncSessionPreview();updateTransport();};
async function previewFactorySession(id){
 if(recording||recordFinalizing||micPending){toast('Termine la prise avant cette écoute.');return;}
 const state=engine.sessionPreview.state;
 if(state.id===id&&['preparing','playing'].includes(state.status)){engine.stopPreview();return;}
 await engine.previewSession(id);updateTransport();
}
async function previewGameSound(id){
 if(recording||recordFinalizing||micPending)throw Error('Termine la prise avant cette écoute.');
 engine.stopPreview();const request=engine.previewRequest,owner=project;
 await engine.init();
 if(request!==engine.previewRequest||owner!==project||view!=='library'||bankState.tab!=='game'||recording||recordFinalizing||micPending)return false;
 const sound=renderGameSound(id),buffer=engine.ctx.createBuffer(1,sound.length,sound.sampleRate);buffer.copyToChannel(sound.getChannelData(0),0);
 engine.capturePreview(()=>{const source=engine.ctx.createBufferSource(),gain=engine.ctx.createGain();source.buffer=buffer;gain.gain.value=.22;source.connect(gain);gain.connect(engine.ctx.destination);source.addEventListener('ended',()=>{source.disconnect();gain.disconnect();});engine.remember(source);source.start();});
 return true;
}
async function addGameSound(id){
 if(recording||recordFinalizing||micPending)throw Error('Termine la prise avant d’ajouter un son.');
 const owner=project,session=activeProjectId;engine.stopPreview();await engine.init();
 if(owner!==project||session!==activeProjectId)throw Error('Le projet a changé. Réessaie dans la session ouverte.');
 if(recording||recordFinalizing||micPending)throw Error('Termine la prise avant d’ajouter un son.');
 if(project.tracks.length>=64)throw Error('La session est limitée à 64 pistes.');
 const sound=gameSound(id),rendered=renderGameSound(id),data=gameSoundWav(id),buffer=engine.ctx.createBuffer(1,rendered.length,rendered.sampleRate);buffer.copyToChannel(rendered.getChannelData(0),0);
 const length=buffer.duration/(engine.stepDuration*16),start=Math.max(0,Math.min(MAX_BARS-length,Math.floor(engine.getPosition()/16)));
 const assetId=uid(),clip={id:uid(),name:sound.name,start,length,audioId:assetId};
 const track={id:uid(),name:sound.name,type:'audio',color:'#83c4bd',volume:-6,pan:0,mute:false,solo:false,clips:[clip]};ensurePlugins(track);
 checkpoint();assets.set(assetId,{name:id+'.wav',data,buffer});project.tracks.push(track);project.bars=fitSession(project.bars,start+length);selectedTrack=track.id;selectedClip=clip.id;detail='editor';changed(true);toast(sound.name+' ajouté comme piste audio.');
}
async function previewInstruSound(id){
 const preset=findInstruPreset(id);if(!preset)return;
 engine.stopPreview();const request=engine.previewRequest;
 if(preset.type==='drums'){await engine.previewPreset(preset.type,instruValues(id));return;}
 await engine.init();await engine.prepareInstrument(preset.type);
 if(request!==engine.previewRequest||view!=='library'||bankState.tab!=='instru')return;
 const notes=instruPhrase(id),params=instruValues(id),sd=60/project.bpm/4;
 engine.capturePreview(()=>{const time=engine.ctx.currentTime+.03;for(const n of notes)engine.synth(engine.ctx,engine.master,preset.type,n.midi,time+n.step*sd,n.len*sd,true,params,n.velocity*.65);});
}
function addInstruSound(id){
 const preset=findInstruPreset(id);if(!preset)return;engine.stopPreview();
 const track=createContentTrack(preset.type);applyInstruPreset(track,id);track.name=preset.name;
 const start=Math.min(Math.max(0,project.bars-2),Math.floor(engine.getPosition()/16));
 const clip=createContentClip(preset.type,preset.name,start,2);clip.patternSteps=32;
 if(preset.type==='drums'){for(const key of Object.keys(clip.pattern))clip.pattern[key]=[...clip.pattern[key],...clip.pattern[key]];}
 else clip.notes=instruPhrase(id,{arpeggiate:false}).map(n=>({...n,id:uid()}));
 track.clips=[clip];track.volume=['Nappes & textures','Chœurs'].includes(preset.category)?-18:preset.category==='Basses'?-10:-12;
 insertContentTrack(track);
}
function applyInstruSound(id){
 const preset=findInstruPreset(id),track=currentTrack();if(!preset||track?.type!==preset.type)return toast('Sélectionne une piste du même instrument ou ajoute une piste.');
 engine.stopPreview();checkpoint();applyInstruPreset(track,id);changed(true);renderFloatingPlugin();toast(preset.name+' appliqué à '+track.name+'.');
}
function insertContentTrack(track){if(project.tracks.length>=64){toast('La session est limitée à 64 pistes.');return;}checkpoint();project.tracks.push(track);selectedTrack=track.id;selectedClip=track.clips[0]?.id;detail='plugins';changed(true);toast('Piste '+track.name+' ajoutée à la session.');}
function addLibraryPreset(token){const [type,raw]=token.split(':'),index=Number(raw);if(!INSTRUMENTS[type]||!FACTORY_PRESETS[type]?.[index])return;const track=createContentTrack(type,index),start=Math.min(project.bars-2,Math.floor(engine.getPosition()/16));track.name=FACTORY_PRESETS[type][index].name.toUpperCase();track.clips.push(createContentClip(type,track.name,start,2));insertContentTrack(track);}
function addLibraryGroove(id){const groove=DRUM_GROOVES.find(g=>g.id===id);if(!groove)return;const track=createContentTrack('drums'),start=Math.min(project.bars-2,Math.floor(engine.getPosition()/16));track.name=groove.name.toUpperCase();track.clips.push(createContentClip('drums',track.name,start,2,id));insertContentTrack(track);}
function applyLibraryEffect(token){const [id,raw]=token.split(':'),index=Number(raw),track=currentTrack();if(!effectDefinition(id)||!FACTORY_PRESETS[id]?.[index]||!track)return;checkpoint();const name=applyFactoryPreset(track,id,index);changed(true);if(pluginWindow?.trackId===track.id)renderFloatingPlugin();toast(name+' appliqué à '+track.name+'.');}
async function storeSessionBackup(){if(!db)throw new Error('La sauvegarde locale est indisponible. Télécharge ton projet avant de changer de session.');const snapshot={project:clone(project),masterVolume:engine.masterVolume};await new Promise((resolve,reject)=>{const tx=db.transaction('sessions','readwrite');tx.objectStore('sessions').put(snapshot,scopedKey('beforeTemplate'));tx.oncomplete=resolve;tx.onerror=()=>reject(tx.error);});backupAvailable=true;$('previousSession').disabled=false;}
function loadFactorySession(id){const template=SESSION_TEMPLATES.find(t=>t.id===id);if(!template)return;if(recording||recordFinalizing){toast('Termine ta prise avant de changer de session.');return;}modal(template.name,`<p class="modal-body-copy">${esc(template.description)}<br><br>${template.bars||fullSongBars(template.bpm)} mesures, 9 pistes et une structure complète à ${template.bpm} BPM. Une copie de la session actuelle sera conservée dans <strong>Projet → Session précédente</strong>. Tes fichiers audio restent conservés.</p><div class="modal-actions"><button id="cancelTemplate" class="outline-btn">Conserver la session actuelle</button><button id="confirmTemplate" class="primary-btn">Ouvrir ${esc(template.name)}</button></div>`,'WARLIKE / SESSION DE DÉPART');$('cancelTemplate').onclick=()=>$('modal').close();$('confirmTemplate').onclick=async()=>{const button=$('confirmTemplate');button.disabled=true;try{await storeSessionBackup();checkpoint();engine.resetSession();project=createFactorySession(id,true);selectedTrack=project.tracks[0].id;selectedClip=project.tracks[0].clips[0]?.id;closeAllPluginWindows();$('modal').close();setView('arrange');changed(true);fitTimeline();toast('Session ouverte. La précédente reste accessible dans le menu Projet.');}catch(error){button.disabled=false;toast(error.message);}};}
async function restorePreviousSession(){if(recording||recordFinalizing){toast('Termine ta prise avant de changer de session.');return;}if(!db)return;try{const snapshot=await new Promise((resolve,reject)=>{const request=db.transaction('sessions').objectStore('sessions').get(scopedKey('beforeTemplate'));request.onsuccess=()=>resolve(request.result);request.onerror=()=>reject(request.error);});if(!snapshot){toast('Aucune session précédente sauvegardée.');return;}const previous=clone(snapshot.project);validateProject(previous);await storeSessionBackup();checkpoint();engine.resetSession();project=previous;engine.masterVolume=snapshot.masterVolume??-2;selectedTrack=project.tracks[0].id;selectedClip=project.tracks[0].clips[0]?.id;closeAllPluginWindows();setView('arrange');changed(true);toast('Session précédente restaurée.');}catch(error){toast('Restauration impossible : '+error.message);}}
function fitTimeline(){const label=parseInt(getComputedStyle(document.body).getPropertyValue('--track-label')),available=$('timelineScroll').clientWidth-label;timelineZoom=1;render();}
function addTrack(type,recordCheckpoint=true){
  if(recordCheckpoint)checkpoint();const colors={...Object.fromEntries(Object.entries(INSTRUMENTS).map(([key,def])=>[key,def.color])),audio:'#ca909a',bus:'#a78bc7',instrument:'#a5b3c1'};
  const tr={id:uid(),name:type==='bus'?`BUS ${project.tracks.filter(t=>t.type==='bus').length+1}`:type==='audio'?`AUDIO ${project.tracks.filter(t=>t.type==='audio').length+1}`:`${instrumentDefinition(type).name} ${project.tracks.filter(t=>t.type===type).length+1}`,type,color:colors[type],volume:0,pan:0,mute:false,solo:false,clips:[]};ensurePlugins(tr);project.tracks.push(tr);selectedTrack=tr.id;selectedClip=null;changed(true);return tr;
}
function createClip(track,start=0){if(track.type==='bus'){toast('Un bus reçoit le son des pistes par les sorties et les envois.');return;}
  if(track.type==='audio'){selectedTrack=track.id;$('audioInput').click();return;}
  checkpoint();const c={id:uid(),name:instrumentDefinition(track.type).name+' / '+String(track.clips.length+1).padStart(2,'0'),start:Math.min(project.bars-1,Math.max(0,start)),length:Math.min(2,project.bars-start)};
  if(track.type==='drums')c.pattern=Object.fromEntries(Object.keys(DRUM_VOICES).map(v=>[v,Array(16).fill(0)]));else c.notes=[];
  track.clips.push(c);selectedTrack=track.id;selectedClip=c.id;detail='editor';changed(true);
}
function selectedAudioClips(){return project.tracks.flatMap(track=>track.clips.filter(c=>c.audioId&&(multiClips.size?multiClips.has(c.id):c.id===selectedClip)).map(clip=>({track,clip})));}
function duplicateClip(){const c=currentClip(),tr=currentTrack();if(!c)return;const selected=selectedAudioClips();if(c.audioId&&selected.length){const start=Math.min(...selected.map(a=>a.clip.start)),end=Math.max(...selected.map(a=>a.clip.start+a.clip.length)),shift=end-start;if(end+shift>MAX_BARS){toast('La duplication dépasse la session maximale.');return;}checkpoint();multiClips.clear();const groups=new Map();for(const {track,clip} of selected){const next={...clone(clip),id:uid(),start:clip.start+shift};if(next.groupId){if(!groups.has(next.groupId))groups.set(next.groupId,uid());next.groupId=groups.get(next.groupId);}track.clips.push(next);multiClips.add(next.id);selectedClip=next.id;}project.bars=fitSession(project.bars,end+shift);changed(true);return;}
  const start=c.start+c.length;if(start+c.length>MAX_BARS)return;checkpoint();const next={...clone(c),id:uid(),start};project.bars=fitSession(project.bars,start+c.length);tr.clips.push(next);selectedClip=next.id;changed(true);}
function deleteClip(){const tr=currentTrack(),c=currentClip();if(!c)return;checkpoint();const ids=c.audioId?new Set(selectedAudioClips().map(a=>a.clip.id)):new Set([c.id]);for(const t of project.tracks){if(editMode==='shuffle'&&t.type==='audio'){const ordered=[...t.clips].sort((a,b)=>a.start-b.start);const removed=ordered.filter(x=>ids.has(x.id));const nonOverlapping=ordered.every((x,i)=>!i||ordered[i-1].start+ordered[i-1].length<=x.start+1e-8);if(removed.length&&nonOverlapping&&!ordered.some(x=>x.groupId)){for(const x of ordered){if(ids.has(x.id))continue;const shift=removed.filter(y=>y.start+y.length<=x.start+1e-8).reduce((sum,y)=>sum+y.length,0);x.start=Math.max(0,x.start-shift);}}else if(removed.length)toast('Shuffle : chevauchement ou groupe détecté, suppression sans déplacement.');}t.clips=t.clips.filter(x=>!ids.has(x.id));}multiClips.clear();selectedClip=tr.clips[0]?.id;changed(true);}

function modal(title,body,eyebrow='WARLIKE STUDIO'){engine.stopPreview();$('modalTitle').textContent=title;$('modalBody').innerHTML=body;$('modalEyebrow').textContent=eyebrow;if(!$('modal').open)$('modal').showModal();}
function addTrackModal(){
  modal('Nouvelle piste',`<form id="newTrackForm" class="new-track-form"><label>Type de piste<select id="newTrackType" aria-label="Type de piste"><option value="audio">Audio · enregistrer ou importer</option><option value="instrument">Instrument · jouer des notes MIDI</option><option value="bus">Bus / auxiliaire · regrouper ou recevoir des envois</option></select></label><label>Nombre<input id="newTrackCount" aria-label="Nombre de pistes" type="number" min="1" max="16" value="1"></label><label>Nom<input id="newTrackName" aria-label="Nom des nouvelles pistes" maxlength="45" placeholder="Nom automatique"></label><p id="newTrackDescription">Pour enregistrer un microphone ou placer des fichiers audio dans l’arrangement.</p><div class="modal-actions"><button type="button" id="cancelNewTracks" class="outline-btn">Annuler</button><button type="submit" class="primary-btn">Créer</button></div></form>`,'WARLIKE / PISTES');
  $('newTrackType').onchange=e=>$('newTrackDescription').textContent=({audio:'Pour enregistrer un microphone ou placer des fichiers audio dans l’arrangement.',instrument:'Crée une piste MIDI avec un emplacement Instrument vide. Tu choisis ensuite le plugin à charger.',bus:'Pour recevoir les sorties et les envois des autres pistes. Aucun clip ni instrument sur ce bus.'})[e.target.value];
  $('cancelNewTracks').onclick=()=>$('modal').close();$('newTrackForm').onsubmit=e=>{e.preventDefault();const type=$('newTrackType').value,count=Math.max(1,Math.min(16,Math.round(Number($('newTrackCount').value)||1))),name=$('newTrackName').value.trim();if(project.tracks.length+count>64){toast('La session est limitée à 64 pistes.');return;}const created=[];for(let i=0;i<count;i++){const track=addTrack(type,i===0);if(name)track.name=name+(count>1?' '+(i+1):'');created.push(track);}$('modal').close();selectedTrack=created[0].id;selectedClip=null;detail='plugins';changed(true);if(type==='instrument')openInstrumentMenu(created[0].id);};
}
function helpModal(){modal('Édition & Mix',`<div class="modal-body-copy"><p><strong>Pistes :</strong> glisse le nom ou la poignée ⠿ pour changer l’ordre, depuis la liste, l’arrangement ou Mix. Clique sur un nom ou sur ⋯ pour ouvrir les propriétés. Clique sur le niveau vert VOL pour régler le fader. Le volume peut être saisi en dB, de −48 à +12 ; 0 dB rétablit le gain unitaire. Ctrl+Alt+↑ / ↓ ou les flèches du panneau déplacent la piste sélectionnée.</p></div><p class="modal-body-copy"><strong>✎ Annoter :</strong> entoure une zone, ajoute une flèche ou une note, puis télécharge le PNG pour le joindre à la conversation. Le crayon est aussi présent dans les fenêtres ; Alt+Maj+A capture la vue courante. <a href="./diagnostics.html" target="_blank" rel="noopener">Diagnostic audio</a></p><div class="help-grid"><div><strong>Composer</strong><p>Channel Rack : ajoute un instrument, écris un pattern, écoute en PAT puis place-le en Playlist. SONG lit le morceau. Dans le piano roll, glisse les notes ou leur bord droit ; Ctrl+clic sélectionne un accord, Alt+molette règle la vélocité. Quantifier aligne les notes. Les grooves et les boutons 1/8–1/4 accélèrent la batterie.</p></div><div><strong>Prises, bus et automation</strong><p>Les propriétés de piste proposent les sorties, les envois, les prises alternatives et le comping. OFF/READ/WRITE ouvre les courbes d’automation. Réglages micro choisit l’entrée et la compensation d’enregistrement. Projet → Versions conserve des points de restauration. Mastering analyse le niveau ; Exporter propose WAV et stems ZIP.</p></div><div><strong>Édition</strong><p>Smart déplace un clip par son centre et rogne par ses bords. Déplacer (G), Rogner (T), Couper (C) et Dessin (P) restent accessibles dans la barre d’outils. Double-clique un clip pour ouvrir son éditeur.</p></div><div><strong>Grille ou Libre</strong><p>Grille aligne les déplacements au pas choisi. Libre permet une position précise. Alt suspend temporairement la grille. Les flèches décalent le clip sélectionné ; en mode Libre, le pas est de 10 ms.</p></div><div><strong>Couper et copier</strong><p>Clique sur la règle pour placer le curseur, puis B pour couper. Ctrl+C copie le clip ; Ctrl+V le colle au curseur sur une piste du même type. Ctrl+D duplique ; Suppr retire ; Ctrl+Z annule.</p></div><div><strong>Console Mix</strong><p>La console donne accès aux inserts, au panoramique, aux faders et aux niveaux. Clique sur un insert vide pour choisir un plugin. Le menu ⋯ permet de remplacer, bypasser, déplacer ou retirer le module. L’ordre des inserts est celui du traitement audio, à la lecture comme à l’export. Les fenêtres de plugins restent liées à leur piste pendant les autres sélections. Ctrl+= alterne Édition / Mix.</p></div></div><div class="modal-note">Espace : lecture/pause · Entrée : stop · R : prise micro sur la piste audio sélectionnée · L : boucle.<br>Déplie l’éditeur par ses onglets, ou avec le bouton chevron, puis ajuste sa hauteur par la séparation. Les sauvegardes sur cet appareil et les fichiers .chayah conservent le montage, les audios et les effets. L’export WAV utilise les mêmes décalages et réglages.<br><br>Warlike Studio est un DAW web expérimental. Les modules CHAYAH sont intégrés ; les plugins VST3 externes ne sont pas chargés dans le navigateur. TUNE traite une voix après la prise.</div>`,'WARLIKE / WORKSPACE');}
function pluginsModal(){modal('Instruments & effets',`<div class="audio-info-banner">${Object.keys(INSTRUMENTS).length+Object.keys(EFFECTS).length+1} modules intégrés CHAYAH · Instruments et effets intégrés. Version web, sans installation.</div><div class="plugin-browser-grid"><div class="plugin-browser-card"><h3>TUNE</h3><small>VOCAL PITCH CORRECTION</small><p>Correction de hauteur après la prise : tonalité, gamme, vitesse, dosage et comparaison avant/après.</p><button class="outline-btn" data-open-tune>Ouvrir le laboratoire vocal</button></div><h2 class="plugin-browser-section">INSTRUMENTS</h2>${Object.entries(INSTRUMENTS).map(([id,d])=>`<div class="plugin-browser-card"><h3>${d.name}</h3><small>${d.subtitle}</small><p>${d.description}</p><button class="outline-btn" data-add-type="${id}">${icon('plus')} Ajouter une piste</button></div>`).join('')}<h2 class="plugin-browser-section">EFFETS</h2>${Object.entries(EFFECTS).map(([id,d])=>`<div class="plugin-browser-card"><h3>${d.name}</h3><small>${d.subtitle}</small><p>${({color:'Saturation douce à harmoniques contrôlées.',sculpt:'Filtres coupe-bas et coupe-haut pour nettoyer le spectre.',echo:'Écho synchronisé au tempo, avec feedback réglable.',aura:'Réverbération stéréo avec réponse de 1,8 seconde.'})[id]}</p><button class="outline-btn" data-open-fx="${id}">Ouvrir sur la piste sélectionnée</button></div>`).join('')}</div>`,'CHAYAH / PLUGIN COLLECTION 01');}
function trackSettings(trackId=selectedTrack){const tr=project.tracks.find(t=>t.id===trackId);if(!tr)return;modal('Réglages de la piste',`<form id="trackSettingsForm" class="settings-form"><label>Nom<input name="name" value="${esc(tr.name)}" maxlength="35" required></label><label>Couleur<input name="color" type="color" value="${tr.color}"></label><label>Volume (dB)<input name="volume" type="number" min="-48" max="12" step=".5" value="${tr.volume}"></label><label>Panoramique<input name="pan" type="range" min="-1" max="1" step=".01" value="${tr.pan}"></label></form><div class="modal-actions"><button class="danger-btn" id="deleteTrack">Supprimer la piste</button><button class="primary-btn" id="saveTrackSettings">Appliquer</button></div>`);$('saveTrackSettings').onclick=()=>{const f=new FormData($('trackSettingsForm'));checkpoint();tr.name=String(f.get('name')).trim()||'PISTE';tr.color=f.get('color');tr.volume=Math.max(-48,Math.min(12,Number(f.get('volume'))||0));tr.pan=Number(f.get('pan'));$('modal').close();changed(true);};$('deleteTrack').onclick=()=>deleteTrackWithConfirmation(tr.id);}
function deleteTrackWithConfirmation(id){if(recording||recordFinalizing||micPending){toast('Termine la prise avant de supprimer une piste.');return;}const tr=project.tracks.find(t=>t.id===id);if(!tr)return;if(project.tracks.length===1){toast('Conserve au moins une piste.');return;}modal('Supprimer cette piste ?',`<p class="modal-body-copy">Les ${tr.clips.length} clip(s) de « ${esc(tr.name)} » seront retirés. Les éventuelles sorties vers cette piste reviendront au Master ; les envois vers elle seront retirés. Le bouton Annuler de la barre permet de restaurer la piste.</p><div class="modal-actions"><button class="outline-btn" id="cancelDelete">Conserver</button><button class="danger-btn" id="confirmDelete">Supprimer</button></div>`);$('cancelDelete').onclick=()=>$('modal').close();$('confirmDelete').onclick=()=>{if(recording||recordFinalizing||micPending){toast('Termine la prise avant de supprimer une piste.');return;}if(project.tracks.length<=1||!project.tracks.some(t=>t.id===id))return;checkpoint();engine.pause();selectedTrack=removeProjectTrack(project,id,selectedTrack);multiClips.clear();if(!currentTrack()?.clips.some(c=>c.id===selectedClip))selectedClip=currentTrack()?.clips[0]?.id;closeTrackQuickControl();$('modal').close();changed(true);updateTransport();toast('Piste supprimée. Le bouton Annuler permet de la restaurer.');};}

async function togglePlay(){if(recording||recordFinalizing||micPending){await stop();return;}try{if(engine.playing)engine.pause();else await engine.play();updateTransport();}catch(e){toast('Le moteur audio ne peut pas démarrer : '+e.message);}}
function updateTransport(){const counting=recording?.countIn?.state,preRoll=recording?.preRoll?.state,preReading=preRoll?.status==='playing',preparation=counting?.status==='counting'?'décompte':preReading?'prélecture':'',series=recording?.series?.state,takePrefix=series?'Prise '+series.current+'/'+series.total+' · ':'',status=$('recordCountInStatus');if(status){status.hidden=!preparation&&!series;status.textContent=takePrefix+(counting?.status==='counting'?'Décompte · '+counting.bar+'/'+counting.bars+' · '+counting.beat+'/4':preReading?'Prélecture · '+preRoll.remainingBeats+' temps avant la prise':series?'Enregistrement':'');}if($('recordCountIn')){$('recordCountIn').value=String(recordingSettings(project.recording).countInBars);$('recordCountIn').disabled=!!recording||recordFinalizing||micPending;}$('record').setAttribute('aria-label',preparation?'Annuler la '+(preReading?'prélecture':'préparation'):'Enregistrer le microphone');if($('modeSong')){$('modeSong').classList.toggle('active',!engine.patternMode&&!engine.clipPreview);$('modePattern').classList.toggle('active',!!engine.patternMode||!!engine.clipPreview);}$('play').innerHTML=icon(engine.playing?'pause':'play');$('play').setAttribute('aria-label',engine.playing?'Pause':'Lecture');$('record').classList.toggle('recording',!!recording);const recButton=$('recordWorkspaceStart');if(recButton){recButton.textContent=preparation?'■ Annuler '+(preReading?'la prélecture':'le décompte'):recordFinalizing?'Sauvegarde…':micPending?'Micro…':recording?series?'■ Terminer la série':'■ Terminer la prise':'● Enregistrer';recButton.disabled=recordFinalizing||micPending;recButton.setAttribute('aria-label',preparation?'Annuler '+(preReading?'la prélecture':'le décompte'):recording?series?'Terminer la prise et la série':'Terminer et sauvegarder la prise':'Démarrer l’enregistrement');recButton.classList.toggle('recording',!!recording);}$('record').disabled=recordFinalizing||micPending;$('recordSettings').title=`Réglages micro · gain ${formatDb(recordingSettings(project.recording).gainDb)} · niveau auto ${recordingSettings(project.recording).autoLevel?'actif':'inactif'}`;$('meterLabel').textContent=recording?'ENTRÉE MIC':'SORTIE';$('audioStatus').innerHTML=`<span class="tiny-dot" style="background:${recording?'#d78a7b':'#98b69b'}"></span> ${takePrefix}${counting?.status==='counting'?'Décompte · mesure '+counting.bar+'/'+counting.bars+' · temps '+counting.beat+'/4':preReading?'Prélecture · '+preRoll.remainingBeats+' temps avant la prise':recordFinalizing?'Préparation de la prise…':recording?'Prise en cours · '+(recording.assignments?.length?recording.assignments.map(a=>esc(a.track.name)).join(' + '):esc(recording.track.name)):engine.sessionPreview.state.status==='preparing'?'Préparation de la préécoute…':engine.sessionPreview.state.status==='playing'?'Préécoute · '+esc(engine.sessionPreview.state.name):engine.playing?'Lecture · WarLike Studio':engine.ctx?'Moteur audio actif · '+Math.round(engine.ctx.sampleRate/1000)+' kHz':'Prêt à créer'}`;}
$('recordCountIn').onchange=()=>{if(recording||recordFinalizing||micPending){updateTransport();return;}checkpoint();project.recording=recordingSettings({...project.recording,countInBars:Number($('recordCountIn').value)});changed();updateTransport();};
engine.onError=error=>{workflow.cancelRecordingSeries();if(recording)void stopRecording();toast('Lecture arrêtée : '+error.message);updateTransport();};
engine.onEnded=()=>{if(recording)stopRecording({automatic:true});updateTransport();};
engine.onRecordingExtend=()=>{requestAnimationFrame(()=>{if(recording)changed(true);});};
async function stop(){workflow.cancelRecordingSeries();if(recording){await stopRecording();return;}if(micPending&&workflow.cancelPendingRecording())return;engine.stop();updateTransport();}
async function record(){engine.stopPreview();return workflow.record();}
async function stopRecording(options){return workflow.stopRecording(options);}

async function importAudio(files,targetTrack=null,start=0){
  const list=[...files];if(!list.length)return;
  try{await engine.init();}catch(e){toast('Impossible d’ouvrir le moteur audio : '+e.message);return;}
  for(const file of list){if(file.size>100*1024*1024){toast(`${file.name} dépasse la limite de 100 Mo par fichier.`);continue;}
    try{const data=await file.arrayBuffer(),buffer=await engine.ctx.decodeAudioData(data.slice(0));checkpoint();let tr=targetTrack?.type==='audio'?targetTrack:null;
      if(!tr){const colors=['#ca909a','#8fa7c4','#b1a584'];tr={id:uid(),name:file.name.replace(/\.[^.]+$/,'').toUpperCase().slice(0,24),type:'audio',color:colors[project.tracks.length%3],volume:-6,pan:0,mute:false,solo:false,clips:[]};ensurePlugins(tr);project.tracks.push(tr);}
      const id=uid();assets.set(id,{name:file.name,data,buffer});let length=buffer.duration/(engine.stepDuration*16);if(start+length>MAX_BARS){length=MAX_BARS-start;toast('La limite de session est de '+MAX_BARS+' mesures.');}
      const c={id:uid(),name:file.name.replace(/\.[^.]+$/,'').toUpperCase(),start,length,audioId:id};tr.clips.push(c);project.bars=fitSession(project.bars,start+length);selectedTrack=tr.id;selectedClip=c.id;detail='editor';changed(true);targetTrack=null;
    }catch{toast(`Format non reconnu : ${file.name}. Essaie un WAV, MP3 ou OGG.`);}
  }
}
function download(data,name,type){const url=URL.createObjectURL(new Blob([data],{type})),a=document.createElement('a');a.href=url;a.download=name;a.click();setTimeout(()=>URL.revokeObjectURL(url),10000);}
function safeName(){return project.name.replace(/[^\p{L}\p{N}\-_ ]/gu,'').trim()||'Warlike-session';}
function toBase64(buffer){const b=new Uint8Array(buffer);let str='';for(let i=0;i<b.length;i+=32768)str+=String.fromCharCode(...b.subarray(i,i+32768));return btoa(str);}
function fromBase64(str){const b=atob(str),a=new Uint8Array(b.length);for(let i=0;i<b.length;i++)a[i]=b.charCodeAt(i);return a.buffer;}
async function saveProject(){
  try{$('saveProject').disabled=true;project.tracks.forEach(saveActivePlaylist);const used=audioAssetIds(project);const content={format:'chayah-studio',project:clone(project),masterVolume:engine.masterVolume,assets:[...used].map(id=>{const a=assets.get(id);if(!a)throw new Error('Un fichier audio est manquant.');return{id,name:a.name,data:toBase64(a.data)};})};download(JSON.stringify(content),safeName()+'.chayah','application/json');toast('Projet téléchargé avec ses audios et ses réglages.');}catch(e){toast('Sauvegarde impossible : '+e.message);}finally{$('saveProject').disabled=false;}
}
function validateProject(p){
  if(!p||p.version!==1||!Array.isArray(p.tracks)||!p.tracks.length||p.tracks.length>64)throw new Error('Projet Warlike Studio non reconnu.');
  if(!Number.isFinite(p.bpm)||p.bpm<40||p.bpm>240||!Number.isInteger(p.bars)||p.bars<1||p.bars>MAX_BARS||typeof p.name!=='string')throw new Error('Paramètres du projet invalides.');
  const audio=p.audioSetup||{};p.audioSetup={deviceId:typeof audio.deviceId==='string'?audio.deviceId.slice(0,500):'',channel:['1','2','stereo'].includes(audio.channel)?audio.channel:'1',monitor:audio.monitor===true,monitorLevelDb:Math.max(-36,Math.min(-6,Number.isFinite(Number(audio.monitorLevelDb))?Number(audio.monitorLevelDb):-18)),monitorLevel2Db:Math.max(-36,Math.min(-6,Number.isFinite(Number(audio.monitorLevel2Db))?Number(audio.monitorLevel2Db):-18)),latencyMs:Math.max(-500,Math.min(1000,Number.isFinite(audio.latencyMs)?audio.latencyMs:0)),keepTakes:audio.keepTakes!==false};p.delayCompensation=p.delayCompensation!==false;
  p.patterns=(Array.isArray(p.patterns)?p.patterns:[]).slice(0,128).filter(a=>a&&typeof a.id==='string').map(a=>({...a,name:String(a.name||'Pattern').slice(0,60),bars:Math.max(1,Math.min(MAX_PATTERN_BARS,Math.round(Number(a.bars)||2))),channels:a.channels&&typeof a.channels==='object'?a.channels:{}}));for(const pat of p.patterns)for(const data of Object.values(pat.channels)){if(data.notes)data.notes=normalizeNotes(data.notes,pat.bars*16);if(data.pattern)for(const voice of Object.keys(data.pattern))data.pattern[voice]=Array.from({length:pat.bars*16},(_,i)=>Math.max(0,Math.min(1,Number(data.pattern[voice]?.[i])||0)));}
  p.swing=Math.max(0,Math.min(75,Number(p.swing)||0));p.recording=recordingSettings(p.recording);p.mastering=masteringSettings(p.mastering);
  const trackIds=new Set(),clipIds=new Set();
  for(const tr of p.tracks){if(!['audio','bus','instrument',...Object.keys(INSTRUMENTS)].includes(tr.type)||typeof tr.id!=='string'||trackIds.has(tr.id)||!Array.isArray(tr.clips)||tr.clips.length>512)throw new Error('Piste invalide.');trackIds.add(tr.id);if(!/^[a-z0-9]+$/i.test(tr.id))throw new Error('Identifiant de piste invalide.');if(!/^#[0-9a-f]{6}$/i.test(tr.color))tr.color='#94b7aa';tr.name=String(tr.name).slice(0,60);tr.volume=Math.max(-48,Math.min(12,Number(tr.volume)||0));tr.pan=Math.max(-1,Math.min(1,Number(tr.pan)||0));tr.mute=!!tr.mute;tr.solo=!!tr.solo;ensurePlugins(tr);
    for(const [key,def] of Object.entries(tr.effects).map(([id])=>[id,effectDefinition(id)])){const state=tr.effects[key]||{};for(const c of def.controls)state[c.key]=Math.max(c.min,Math.min(c.max,(Number.isFinite(state[c.key])?state[c.key]:c.default)));state.enabled=state.enabled===true&&tr.inserts.includes(key);tr.effects[key]=state;}
    if(tr.type==='sampler'){const a=assets.get(tr.sampler?.assetId);tr.sampler=sliceSettings(tr.sampler,a?.buffer.duration||Math.max(0,...(tr.sampler?.markers||[]).filter(Number.isFinite)));}
    tr.playlists=(Array.isArray(tr.playlists)?tr.playlists:[]).slice(0,64).filter(l=>l&&typeof l.id==='string'&&Array.isArray(l.clips)&&l.clips.length<=512).map(l=>({...l,name:String(l.name||'Prise').slice(0,60),clips:l.clips.filter(c=>c&&typeof c.id==='string'&&Number.isFinite(c.start)&&c.start>=0&&Number.isFinite(c.length)&&c.length>0&&c.start+c.length<=MAX_BARS+.01&&typeof c.audioId==='string')}));
    const params=automationParameters(tr),curves={};for(const def of params)if(tr.automation?.curves?.[def.key])curves[def.key]=normaliseCurve(tr.automation.curves[def.key],def.min,def.max,p.bars);tr.automation={mode:['read','write'].includes(tr.automation?.mode)?tr.automation.mode:'off',curves};
    for(const c of instrumentDefinition(tr.type)?.controls||[])tr.instrument[c.key]=Math.max(c.min,Math.min(c.max,(Number.isFinite(tr.instrument[c.key])?tr.instrument[c.key]:c.default)));
    tr.tune={key:Math.round(Math.max(0,Math.min(11,Number(tr.tune.key)||0))),scale:['minor','major','chromatic'].includes(tr.tune.scale)?tr.tune.scale:'minor',speed:Math.max(0,Math.min(250,Number(tr.tune.speed)||0)),amount:Math.max(0,Math.min(1,Number(tr.tune.amount)||0)),mix:Math.max(0,Math.min(1,Number(tr.tune.mix)||0))};
    for(const c of tr.clips){if(typeof c.id!=='string'||!(/^[a-z0-9]+$/i.test(c.id)||/^[a-f0-9]{8}(?:-[a-f0-9]{4}){3}-[a-f0-9]{12}$/i.test(c.id))||clipIds.has(c.id)||!Number.isFinite(c.start)||c.start<0||!Number.isFinite(c.length)||c.length<=0||c.start+c.length>MAX_BARS+.01)throw new Error('Clip invalide.');clipIds.add(c.id);c.name=String(c.name).slice(0,100);
      if(c.audioId&&typeof c.audioId!=='string')throw new Error('Référence audio invalide.');c.gainDb=clampClipGain(c.gainDb);c.fadeIn=Math.max(0,Math.min(60,Number.isFinite(c.fadeIn)?c.fadeIn:.005));c.fadeOut=Math.max(0,Math.min(60,Number.isFinite(c.fadeOut)?c.fadeOut:.005));c.fadeCurve=c.fadeCurve==='equalPower'?'equalPower':'linear';c.sourceOffset=Math.max(0,Number.isFinite(c.sourceOffset)?c.sourceOffset:0);c.patternOffset=Math.max(0,Number.isFinite(c.patternOffset)?c.patternOffset:0);
      if(tr.type==='drums'&&!c.audioId){c.patternSteps=Math.max(16,Math.min(MAX_PATTERN_STEPS,Math.round(Number(c.patternSteps))||16));c.pattern=Object.fromEntries(Object.keys(DRUM_VOICES).map(v=>[v,Array.from({length:c.patternSteps},(_,i)=>Math.max(0,Math.min(1,Number(c.pattern?.[v]?.[i])||0)))]));}
      if(tr.type!=='drums'&&tr.type!=='bus'&&!c.audioId){c.patternSteps=Math.max(16,Math.min(MAX_PATTERN_STEPS,Math.round(Number(c.patternSteps))||32));c.notes=normalizeNotes(c.notes,c.patternSteps);}
    }
  }normaliseRouting(p);normaliseFolders(p);
}
let reaperSelection=null;
function showNativeChains(){
 if(!activeProjectId)return toast('Ouvre un projet avant de charger des effets.');
 const tr=currentTrack();
 if(!tr)return toast('Sélectionne une piste.');
 const names=Object.entries(NATIVE_CHAINS).map(([key,chain])=>'<option value="'+key+'">'+esc(chain.name)+'</option>').join('');
 modal('Chaînes FX WarLike','<p class="modal-body-copy">Effets originaux WarLike ; aucun preset ni algorithme propriétaire n’est copié. Les effets existants sont conservés sauf si tu choisis explicitement de les remplacer.</p>'+
 '<label for="nativeChainSelect">Chaîne à ajouter sur '+esc(tr.name)+'</label><select id="nativeChainSelect">'+names+'</select>'+
 '<p class="modal-body-copy" id="nativeChainInfo"></p>'+
 '<label class="reaper-fx-checkbox"><input type="checkbox" id="nativeChainReplace"> Remplacer les inserts actuels de cette piste</label>'+
 '<p class="modal-body-copy" id="nativeChainCapacity" role="status"></p>'+
 '<div class="modal-actions"><button class="outline-btn" id="nativeChainCancel">Annuler</button><button class="primary-btn" id="nativeChainApply">Ajouter les effets</button></div>','WARLIKE / FX NATIFS');
 const update=()=>{
   const selected=$('nativeChainSelect').value,chain=NATIVE_CHAINS[selected],replace=$('nativeChainReplace').checked;
   const info=nativeChainCapacity(tr,selected,{replace});
   $('nativeChainInfo').textContent=chain.description;
   $('nativeChainCapacity').textContent=info.required+' insert(s) nécessaires · '+info.available+' emplacement(s) disponibles.'+
     (!info.valid?' Sélectionne une chaîne plus courte ou remplace les inserts existants.':'');
   $('nativeChainApply').disabled=!info.valid;
   $('nativeChainApply').textContent=replace?'Remplacer les effets':'Ajouter les effets';
 };update();$('nativeChainSelect').onchange=update;$('nativeChainReplace').onchange=update;
 $('nativeChainCancel').onclick=()=>$('modal').close();
 $('nativeChainApply').onclick=()=>{try{
   if(currentTrack()?.id!==tr.id)throw Error('La piste sélectionnée a changé. Rouvre le menu.');
   const selected=$('nativeChainSelect').value,replace=$('nativeChainReplace').checked;
   if(!nativeChainCapacity(tr,selected,{replace}).valid)throw Error('Pas assez d’emplacements.');
   checkpoint();applyNativeChain(tr,selected,{replace});changed(true);$('modal').close();toast('Chaîne FX WarLike appliquée à '+tr.name+'.');
 }catch(error){toast(error.message);}};
}
function renderReaperImport(){
 if(!reaperSelection)return;
 const {parsed,files}=reaperSelection,media=matchReaperMedia(parsed.assets,files);
 const notices=[...parsed.warnings];
 if(media.missing.length)notices.push(media.missing.length+' audio(s) introuvable(s) : '+media.missing.slice(0,10).map(reaperBasename).join(', '));
 if(media.ambiguous.length)notices.push('Noms audio ambigus : '+media.ambiguous.slice(0,10).map(reaperBasename).join(', ')+'. Sélectionne des fichiers ayant des chemins distincts.');
 const desc=parsed.fxReport.flatMap(t=>t.plugins.map(name=>{
   const candidate=nativeEffectsForNames([name])[0];return '<li>'+esc(t.track)+' · '+esc(name)+' → '+esc(candidate?.replacement||'Aucun équivalent automatique')+'</li>';
 })).slice(0,40).join('');
 modal('Importer un projet REAPER',
 '<div class="project-home"><p class="modal-body-copy"><strong>'+esc(parsed.project.name)+'</strong> · '+parsed.project.tracks.length+' pistes · '+parsed.clipCount+' clips audio · '+parsed.project.bpm+' BPM (4/4)</p>'+
 '<p class="modal-body-copy">Sélectionne les fichiers audio associés au .rpp. Les médias restent sur cet appareil tant que tu ne synchronises pas explicitement le projet.</p>'+
 '<label>Fichiers audio complémentaires <input id="reaperMediaFiles" type="file" multiple accept="audio/*,.wav,.mp3,.ogg,.flac,.aif,.aiff,.m4a"></label>'+
 '<p class="modal-body-copy">Fichiers résolus : '+media.matched.length+' / '+parsed.assets.length+'</p>'+
 (notices.length?'<ul class="reaper-import-notices">'+notices.slice(0,18).map(x=>'<li>'+esc(x)+'</li>').join('')+'</ul>':'')+
 (desc?'<details><summary>Effets REAPER non convertis ('+parsed.fxReport.reduce((n,x)=>n+x.plugins.length,0)+')</summary><ul class="reaper-import-notices">'+desc+'</ul></details>':'')+
 (desc?'<label class="reaper-fx-checkbox"><input type="checkbox" id="reaperUseNativeFx"> Proposer des traitements WarLike analogues sur les pistes (réglages d’origine non transférés)</label>':'')+
 '<div class="modal-actions"><button class="outline-btn" id="cancelReaper">Annuler</button><button class="primary-btn" id="confirmReaper"'+(media.missing.length||media.ambiguous.length?' disabled':'')+'>Créer le projet WarLike</button></div></div>','WARLIKE / REAPER');
 $('cancelReaper').onclick=()=>{reaperSelection=null;$('modal').close();};
 $('reaperMediaFiles').onchange=e=>{files.push(...e.target.files);renderReaperImport();};
 $('confirmReaper').onclick=async()=>{const button=$('confirmReaper');button.disabled=true;try{
  if(recording||recordFinalizing||micPending)throw Error('Termine la prise avant l’import.');
  const ready=matchReaperMedia(parsed.assets,files);
  if(ready.missing.length||ready.ambiguous.length)throw Error('Des sources audio manquent encore.');
  await engine.init();
  const decoded=[];
  for(const entry of ready.matched){
    if(entry.file.size>100*1024*1024)throw Error('Média REAPER supérieur à 100 Mo : '+entry.file.name);
    const data=await entry.file.arrayBuffer();
    await engine.ctx.decodeAudioData(data.slice(0));
    decoded.push({id:entry.audioId,name:entry.file.name,data});
  }
  const candidate=structuredClone(parsed.project);
  if($('reaperUseNativeFx')?.checked)for(const item of parsed.fxReport){
   const tr=candidate.tracks.find(t=>t.id===item.trackId);
   const fx=nativeEffectsForNames(item.plugins);
   if(tr&&fx.length)applyNativeChain(tr,fx.map(x=>({id:x.replacement,params:{}})));
  }
  validateProject(candidate);
  await createProjectLocal(candidate.name,candidate,decoded);
  reaperSelection=null;
  toast('REAPER importé : '+candidate.tracks.length+' pistes, '+parsed.clipCount+' clips. Vérifie les effets et le placement.');
 }catch(error){toast('Import REAPER : '+error.message);if(button.isConnected)button.disabled=false;}};
}
async function beginReaperImport(files){
 const list=[...files],rpp=list.find(file=>/\.rpp(?:-bak)?$/i.test(file.name));
 if(!rpp){toast('Sélectionne un fichier REAPER .rpp (avec les médias si possible).');return;}
 try{
  const parsed=parseReaperRpp(await rpp.text(),{name:rpp.name});
  reaperSelection={parsed,files:list.filter(file=>file!==rpp)};
  renderReaperImport();
 }catch(error){toast('Projet REAPER non reconnu : '+error.message);}
}
let openingProject=false;
async function openProject(file){if(!file)return;if(openingProject)return toast('Un projet est déjà en cours de chargement.');if(recording||recordFinalizing||micPending)return toast('Termine la prise avant d’ouvrir un projet.');openingProject=true;try{const data=JSON.parse(await file.text());if(data.format!=='chayah-studio')throw new Error('Ce fichier n’est pas un projet Warlike Studio.');validateProject(data.project);if(data.assets!==undefined&&!Array.isArray(data.assets))throw new Error('Liste des fichiers audio invalide.');const media=data.assets||[],ids=new Set();for(const a of media){if(!a||typeof a.id!=='string'||ids.has(a.id))throw new Error('Identifiant audio invalide ou dupliqué.');ids.add(a.id);}const missing=[...audioAssetIds(data.project)].filter(id=>!ids.has(id));if(missing.length)throw new Error(missing.length+' fichier(s) audio manque(nt) dans ce projet. La session actuelle est conservée.');// Import validates media without resuming the live playback context (autoplay may be blocked in a fresh browser).
const decoded=new Map();const decoder=media.length?new AudioContext():null;try{for(const a of media){if(typeof a.id!=='string'||typeof a.name!=='string'||typeof a.data!=='string')throw new Error('Audio invalide.');const raw=fromBase64(a.data),buffer=await decoder.decodeAudioData(raw.slice(0));decoded.set(a.id,{name:a.name,data:raw,buffer});}}finally{if(decoder)await decoder.close();}if(recording||recordFinalizing||micPending)throw new Error('Une prise a démarré pendant le chargement. Termine-la puis réessaie.');await flushCurrent();const id=crypto.randomUUID(),now=Date.now();const importedAssets=media.map(a=>({id:a.id,name:a.name,data:decoded.get(a.id).data})),index=[{id,name:data.project.name,createdAt:now,updatedAt:now},...projectIndex];await writeLocalProject(db,id,{project:clone(data.project),masterVolume:Number.isFinite(data.masterVolume)?data.masterVolume:0,assets:importedAssets},index);projectIndex=index;await chooseProject(id);toast('Projet importé et sauvegardé.');}catch(e){toast('Ouverture impossible : '+e.message);}finally{openingProject=false;}}
async function exportWav(){if(recording){toast('Termine la prise avant d’exporter.');return;}if(project.tracks.some(t=>t.clips.some(c=>c.audioId&&!assets.has(c.audioId)))){toast('Un fichier audio est manquant. Réimporte-le avant l’export.');return;}const btn=$('exportWav');btn.disabled=true;btn.innerHTML=icon('wave')+' Rendu du mix…';try{const wav=await engine.exportWav();download(wav,safeName()+'.wav','audio/wav');toast('Mix exporté · WAV stéréo 44,1 kHz / 16 bits.');}catch(e){toast('Export impossible : '+e.message);}finally{btn.disabled=false;btn.innerHTML=icon('download')+' Exporter <span>WAV</span>';}}

// One-click solo recording setup for fast voice sessions in a browser.
$('recordWorkspaceSolo')?.addEventListener('click',()=>{
 if(recording||micPending||recordFinalizing){toast('Termine la prise avant de modifier les entrées.');return;}
 let t=currentTrack();
 if(t?.type!=='audio')t=project.tracks.find(tr=>tr.type==='audio');
 if(!t&&project.tracks.length>=64){toast('Limite de 64 pistes atteinte.');return;}
 checkpoint();
 if(!t)t=addTrack('audio',false);
 for(const tr of project.tracks)if(tr.type==='audio')tr.recordArm=tr.id===t.id;
 t.recordInput='1';selectedTrack=t.id;selectedClip=null;changed(true);
 toast('Prêt pour une voix : '+t.name+' sur IN 1. Vérifie le micro au casque avant REC.');
});

// Fast two-micro session preparation: uses the same track model and undo
// history as the regular Add Track dialog. Never arms while capture is active.
$('recordWorkspaceDuo')?.addEventListener('click',()=>{
 if(recording||micPending||recordFinalizing){toast('Termine la prise avant de préparer deux micros.');return;}
 const audio=project.tracks.filter(t=>t.type==='audio');
 if(audio.length<2&&project.tracks.length+2-audio.length>64){toast('La session est limitée à 64 pistes.');return;}
 checkpoint();
 while(project.tracks.filter(t=>t.type==='audio').length<2)addTrack('audio',false);
 const targets=project.tracks.filter(t=>t.type==='audio').slice(0,2);
 for(const tr of project.tracks)if(tr.type==='audio')tr.recordArm=false;
 targets.forEach((tr,i)=>{tr.recordArm=true;tr.recordInput=String(i+1);});
 selectedTrack=targets[0].id;selectedClip=null;changed(true);
 toast('Duo prêt : '+targets[0].name+' → IN 1 · '+targets[1].name+' → IN 2. Vérifie les deux entrées et porte un casque.');
});

// Record arming is per audio track. Preserve the historical selected-track
// recording path when no tracks are armed. Never change routing mid-take.
document.addEventListener('click',event=>{
 const btn=event.target.closest('[data-record-arm]');if(!btn)return;
 const t=project.tracks.find(t=>t.id===btn.dataset.recordArm);
 if(!t||t.type!=='audio')return;
 if(recording||micPending||recordFinalizing){toast('Termine la prise avant de changer les pistes armées.');return;}
 if(!t.recordArm&&project.tracks.filter(t=>t.recordArm).length>=2){toast('Deux pistes maximum peuvent être armées.');return;}
 checkpoint();t.recordArm=!t.recordArm;changed(true);
});
document.addEventListener('change',event=>{
 const el=event.target.closest('[data-record-input]');if(!el)return;
 const t=project.tracks.find(t=>t.id===el.dataset.recordInput);if(!t||t.type!=='audio')return;
 if(recording||micPending||recordFinalizing){el.value=t.recordInput||'1';toast('Change les entrées après la prise.');return;}
 checkpoint();t.recordInput=el.value==='2'?'2':'1';changed(true);
});

// Main navigation and project controls.
$('play').onclick=togglePlay;$('stop').onclick=stop;$('record').onclick=record;$('recordSettings').onclick=recordingModal;
$('rewind').onclick=()=>{if(recording||recordFinalizing||micPending)return toast('Termine ou annule la prise avant de déplacer le curseur.');engine.seek(0);updateTransport();};
function renderLoopRange(){const ruler=$('ruler');ruler.querySelector('.custom-loop-range')?.remove();if(!project.loopRange)return;const b=loopBounds(project.loopRange,project.bars),el=document.createElement('span');el.className='custom-loop-range';el.style.cssText=`position:absolute;pointer-events:none;top:0;height:100%;left:${b.start/(project.bars*16)*100}%;width:${(b.end-b.start)/(project.bars*16)*100}%;background:#56b58b38;border:1px solid #56b58b;z-index:2`;ruler.append(el);}
$('loop').addEventListener('contextmenu',e=>{e.preventDefault();if(recording)return;const b=loopBounds(project.loopRange,project.bars);modal('Zone de boucle',`<form id="loopRangeForm"><label>Début (mesure)<input id="loopBegin" type="number" min="1" max="${project.bars}" value="${b.start/16+1}" required></label><label>Fin (mesure incluse)<input id="loopFinish" type="number" min="1" max="${project.bars}" value="${b.end/16}" required></label><button type="submit" class="primary-btn">Appliquer</button><button type="button" id="loopReset">Session entière</button></form>`,'WARLIKE / TRANSPORT');$('loopRangeForm').onsubmit=ev=>{ev.preventDefault();const start=Number($('loopBegin').value)-1,end=Number($('loopFinish').value);if(end<=start)return toast('Zone invalide.');engine.pause();checkpoint();project.loopRange={start,end};changed(true);$('modal').close();};$('loopReset').onclick=()=>{engine.pause();checkpoint();delete project.loopRange;changed(true);$('modal').close();};});$('loop').title='Boucle · clic droit pour définir la zone';
$('loop').onclick=()=>{if(recording){toast('La boucle est suspendue pendant une prise.');return;}engine.loop=!engine.loop;$('loop').classList.toggle('active',engine.loop);$('loop').setAttribute('aria-pressed',engine.loop);};
$('metronome').onclick=()=>{engine.metronome=!engine.metronome;$('metronome').classList.toggle('active',engine.metronome);$('metronome').setAttribute('aria-pressed',engine.metronome);};
$('bpm').onchange=()=>{const n=Math.round(Math.max(40,Math.min(240,Number($('bpm').value)||138)));if(recording||recordFinalizing||micPending){$('bpm').value=project.bpm;toast('Change le tempo après la prise.');return;}if(project.tracks.some(t=>t.frozenTrack)){toast('Dégèle les pistes avant de changer le tempo.');$('bpm').value=project.bpm;return;}if(project.tracks.some(t=>t.type==='audio'&&t.clips.some(c=>(c.start+c.length)*n/project.bpm>MAX_BARS))){toast('Ce tempo dépasserait la longueur maximale de la session audio.');$('bpm').value=project.bpm;return;}const playing=engine.playing,ratio=n/project.bpm;engine.pause();checkpoint();changeAudioTempo(project,n);engine.position*=ratio;changed(true);$('bpm').value=n;drawClips();if(playing)engine.play();updateTransport();};
$('bars').onchange=()=>{if(recording||recordFinalizing||micPending){$('bars').value=project.bars;return toast('Termine ou annule la prise avant de changer la durée.');}const n=sessionBars($('bars').value),last=Math.max(0,...project.tracks.flatMap(t=>t.clips.map(c=>c.start+c.length)));if(last>n+.001){$('bars').value=project.bars;toast('Déplace ou raccourcis les clips qui dépassent avant de réduire le projet.');return;}checkpoint();project.bars=n;if(engine.position>=n*16)engine.seek(0);changed(true);};
$('projectName').onchange=()=>{checkpoint();project.name=$('projectName').value.trim()||'Nouvelle session';$('sessionRoot').value=String(project.pianoKey??9);$('sessionScale').value=project.pianoScale||'minor';$('sessionKey').textContent=project.keyName||(['Do','Do♯','Ré','Mi♭','Mi','Fa','Fa♯','Sol','La♭','La','Si♭','Si'][project.pianoKey??9]+' '+(project.pianoScale==='major'?'majeur':project.pianoScale==='chromatic'?'chromatique':'mineur'));$('projectName').value=project.name;save();};
$('undo').onclick=()=>undo();$('redo').onclick=()=>undo(true);
$('help').onclick=helpModal;$('browsePlugins').onclick=openSuite;$('openBundle').onclick=openSuite;$('addTrack').onclick=addTrackModal;
$('projectMenuBtn').onclick=e=>{e.stopPropagation();$('projectMenu').hidden=!$('projectMenu').hidden;};
document.addEventListener('click',e=>{if(!e.target.closest('.menu-anchor'))$('projectMenu').hidden=true;});
document.addEventListener('click',event=>{const button=event.target.closest('[data-public-demo]');if(button)launchPublicDemo(button.dataset.publicDemo);});
$('myProjects').onclick=()=>{showProjectLibrary();$('projectMenu').hidden=true;};$('saveProject').onclick=()=>{saveProject();$('projectMenu').hidden=true;};$('openProject').onclick=()=>{$('projectInput').click();$('projectMenu').hidden=true;};
$('openReaper').onclick=()=>{$('reaperInput').click();$('projectMenu').hidden=true;};
$('nativeChains').onclick=()=>{$('projectMenu').hidden=true;showNativeChains();};
$('newProject').onclick=()=>{$('projectMenu').hidden=true;modal('Nouvelle session',`<p class="modal-body-copy">La session actuelle reste récupérable avec Annuler. Télécharge-la d’abord si tu veux la conserver séparément.</p><div class="modal-actions"><button class="outline-btn" id="downloadCurrent">Télécharger le projet actuel</button><button class="primary-btn" id="confirmNew">Créer une session vide</button></div>`);$('downloadCurrent').onclick=saveProject;$('confirmNew').onclick=()=>{if(recording){toast('Termine la prise avant de changer de session.');return;}createProjectLocal().catch(e=>toast(e.message));};};
$('exportWav').onclick=()=>workflow.exportModal();$('importBtn').onclick=()=>$('audioInput').click();
$('audioInput').onchange=async e=>{const tr=currentTrack();await importAudio(e.target.files,tr?.type==='audio'?tr:null,Math.floor(engine.getPosition()/16));e.target.value='';};
$('projectInput').onchange=async e=>{await openProject(e.target.files[0]);e.target.value='';};
$('reaperInput').onchange=async e=>{await beginReaperImport(e.target.files);e.target.value='';};
$('editorTab').onclick=()=>{detail='editor';setDetailOpen(true);renderDetail();};$('pluginsTab').onclick=()=>{detail='plugins';setDetailOpen(true);renderDetail();};
$('tuneTab').onclick=()=>{detail='tune';setDetailOpen(true);renderDetail();};
$('duplicateClip').onclick=duplicateClip;$('deleteClip').onclick=deleteClip;$('trackSettings').onclick=()=>trackSettings();
$('closeModal').onclick=()=>$('modal').close();$('modal').addEventListener('click',e=>{if(e.target===$('modal')){const r=$('modal').getBoundingClientRect();if(e.clientX<r.left||e.clientX>r.right||e.clientY<r.top||e.clientY>r.bottom)$('modal').close();}});
$('modal').addEventListener('close',()=>{if($('modal').open)return;engine.stopPreview();if($('modalBody').querySelector('.project-home'))$('modalBody').replaceChildren();});
document.querySelectorAll('[data-view]').forEach(el=>el.onclick=()=>setView(el.dataset.view));
$('libraryEffects').innerHTML=Object.entries(EFFECTS).map(([id,d])=>`<button class="fx-library-item" data-open-fx="${id}"><span></span>${d.name[0]+d.name.slice(1).toLowerCase()}<small>${d.subtitle.toLowerCase()}</small></button>`).join('');


// Delegation keeps clip and plugin rendering independent from event lifetime.
document.addEventListener('click',async e=>{
  if(performance.now()<suppressTrackClickUntil&&e.target.closest('[data-select-track],[data-track-drag],.track-head,.mixer-channel')){e.preventDefault();return;}
  const bypassInsert=e.target.closest('[data-insert-bypass]');if(bypassInsert){const owner=bypassInsert.dataset.insertMaster==='true'?project.mastering:project.tracks.find(t=>t.id===bypassInsert.dataset.insertTrack)?.effects,id=bypassInsert.dataset.insertBypass;const state=rackIsSplit(id)?owner?.splits?.[id]:owner?.[id];if(state){checkpoint();state.enabled=!state.enabled;changed(true);}return;}
  const change=e.target.closest('[data-change-instrument]');if(change){openInstrumentMenu(change.dataset.changeInstrument);return;}
  const warRack=e.target.closest('[data-war-rack-track]');if(warRack){openWarRackBrowser(warRack.dataset.warRackTrack);return;}
  const mixTemplate=e.target.closest('[data-template-track]');if(mixTemplate){openMixMasterTemplates('mix',mixTemplate.dataset.templateTrack);return;}
  if(e.target.closest('[data-template-master]')){openMixMasterTemplates('master');return;}
  const quickAdd=e.target.closest('[data-add-insert-track]');if(quickAdd){const master=quickAdd.dataset.addInsertTrack==='master',track=master?null:project.tracks.find(t=>t.id===quickAdd.dataset.addInsertTrack);if(!master&&!track)return;const slots=master?masteringSettings(project.mastering).inserts:track.inserts,index=slots.findIndex(id=>id===null);if(index<0){toast('Tous les inserts sont occupés. Retire ou remplace un effet existant.');return;}openInsertMenu(master?'master':track.id,index,master);return;}
  const slot=e.target.closest('[data-insert-slot]');if(slot){openInsertMenu(slot.dataset.insertTrack,Number(slot.dataset.insertSlot),slot.dataset.insertMaster==='true');return;}
  const slotOpen=e.target.closest('[data-insert-open]');if(slotOpen){if(slotOpen.dataset.insertMaster==='true'){getMasterRack().select(slotOpen.dataset.insertOpen);setView('mastering');}else{const id=slotOpen.dataset.insertTrack,plugin=slotOpen.dataset.insertOpen;if(!project.tracks.some(t=>t.id===id))return;if(slotOpen.closest('#mixerView')&&currentTrack()?.id!==id)selectTrack(id);openPluginWindow(plugin,id);}return;}
  const remove=e.target.closest('[data-delete-track]');if(remove){deleteTrackWithConfirmation(remove.dataset.deleteTrack);return;}const props=e.target.closest('[data-track-properties]');if(props){selectTrack(props.dataset.trackProperties);trackSettings(props.dataset.trackProperties);return;}
  const level=e.target.closest('[data-track-level],[data-track-pan]');if(level){openTrackQuickControl(level.dataset.trackLevel||level.dataset.trackPan,level.dataset.trackPan?'pan':'volume',level);return;}
  if(e.target.closest('[data-close-properties]')){showTrackProperties(false);return;}
  const move=e.target.closest('[data-track-step]');if(move){moveTrackByStep(move.dataset.trackStep,Number(move.dataset.stepDirection));return;}
  const unity=e.target.closest('[data-track-unity]');if(unity){setTrackVolume(unity.dataset.trackUnity,0,true);return;}

  if(e.target.closest('[data-open-mastering]')){setView('mastering');return;}
  const mp=e.target.closest('[data-master-power]');if(mp){checkpoint();const state=project.mastering[mp.dataset.masterPower];state.enabled=!state.enabled;changed();renderMastering();return;}
  if(e.target.closest('[data-master-bypass]')){checkpoint();project.mastering.bypass=!project.mastering.bypass;changed();renderMastering();return;}
  if(e.target.closest('[data-master-reset]')){checkpoint();project.mastering=masteringSettings();changed();renderMastering();return;}
  if(e.target.closest('[data-master-meter-reset]')){masterPeakHold=-Infinity;return;}
  if(e.target.closest('[data-master-export]')){download(JSON.stringify(exportMasterRack(project),null,2),'CHAYAH_Master.chayahmaster','application/json');toast('Rack de mastering téléchargé.');return;}
  if(e.target.closest('[data-master-import]')){$('masterRackInput').click();return;}

  if(e.target.closest('[data-inspector-settings]')){trackSettings();return;}
  const section=e.target.closest('[data-seek-section]');if(section){if(recording||recordFinalizing||micPending)return toast('Termine ou annule la prise avant de changer de section.');engine.seek(Number(section.dataset.seekSection)*16);updateTransport();return;}
  const packApply=e.target.closest('[data-pack-apply]');if(packApply){const id=packApply.dataset.packApply,index=packApply.closest('.pack-module').querySelector('select').value;applyLibraryEffect(id+':'+index);return;}
  const bankAdd=e.target.closest('[data-bank-add]');if(bankAdd){addLibraryPreset(bankAdd.dataset.bankAdd);return;}
  const bankApply=e.target.closest('[data-bank-apply]');if(bankApply){applyLibraryEffect(bankApply.dataset.bankApply);return;}
  const bankPreview=e.target.closest('[data-bank-preview]');if(bankPreview){const [type,index]=bankPreview.dataset.bankPreview.split(':');try{await engine.previewPreset(type,FACTORY_PRESETS[type][Number(index)].values);updateTransport();}catch(error){toast(error.message);}return;}
  const grooveAdd=e.target.closest('[data-groove-add]');if(grooveAdd){addLibraryGroove(grooveAdd.dataset.grooveAdd);return;}
  const groovePreview=e.target.closest('[data-groove-preview]');if(groovePreview){const groove=DRUM_GROOVES.find(g=>g.id===groovePreview.dataset.groovePreview);try{if(groove)await engine.previewGroove(groove);updateTransport();}catch(error){toast(error.message);}return;}
  const drumDownload=e.target.closest('[data-drum-download]');if(drumDownload){const voice=drumDownload.dataset.drumDownload;drumDownload.disabled=true;try{download(await engine.renderDrumWav(voice),'CHAYAH_Pulse_'+voice+'.wav','audio/wav');toast('Percussion WAV générée.');}catch(error){toast(error.message);}finally{drumDownload.disabled=false;}return;}
  const sessionPreview=e.target.closest('[data-session-preview]');if(sessionPreview){await previewFactorySession(sessionPreview.dataset.sessionPreview);return;}
  const factoryProject=e.target.closest('[data-factory-project-open]');if(factoryProject){await launchFactoryProject(factoryProject.dataset.factoryProjectOpen);return;}
  const sessionLoad=e.target.closest('[data-session-load]');if(sessionLoad){loadFactorySession(sessionLoad.dataset.sessionLoad);return;}
  const suiteInstrument=e.target.closest('[data-suite-instrument]');if(suiteInstrument){const type=suiteInstrument.dataset.suiteInstrument,tr=currentTrack()?.type===type?currentTrack():project.tracks.find(t=>t.type===type)||addTrack(type);openPluginWindow('instrument',tr.id);return;}
  const suiteEffect=e.target.closest('[data-suite-effect]');if(suiteEffect){openPluginWindow(suiteEffect.dataset.suiteEffect,pluginWindow?.trackId||selectedTrack);return;}
  if(e.target.closest('[data-suite-tune]')){const tr=currentTrack()?.type==='audio'?currentTrack():project.tracks.find(t=>t.type==='audio')||addTrack('audio');detail='tune';selectTrack(tr.id);if(pluginWindow)pluginWindows.entries.find(e=>e.instance===pluginWindow)?.view.root.querySelector('[data-float-minimize]').click();return;}
  if(e.target.closest('[data-normalize-clip]')){normaliseSelectedClip();return;}
  if(e.target.closest('[data-reset-clip-gain]')){setSelectedClipGain(0,true);return;}
  const openPlugin=e.target.closest('[data-plugin-open]');if(openPlugin){openPluginWindow(openPlugin.dataset.pluginOpen,parameterTrack(openPlugin)?.id||selectedTrack);return;}
  if(e.target.closest('[data-open-tune]')){$('modal').close();detail='tune';setDetailOpen(true);renderDetail();return;}
  if(e.target.closest('[data-choose-voice]')){let tr=project.tracks.find(t=>t.type==='audio');if(!tr)tr=addTrack('audio');detail='tune';selectTrack(tr.id);return;}
  if(e.target.closest('[data-test-tune]')){await createTuneTest();return;}
  const preset=e.target.closest('[data-tune-preset]');if(preset){checkpoint();Object.assign(currentTrack().tune,{natural:{speed:110,amount:.65,mix:1},rap:{speed:18,amount:1,mix:1},hard:{speed:0,amount:1,mix:1}}[preset.dataset.tunePreset]);save();renderTune();return;}
  if(e.target.closest('[data-apply-tune]')){await applyTune();return;}
  const audition=e.target.closest('[data-tune-listen]');if(audition){const c=currentClip(),a=assets.get(audition.dataset.tuneListen==='original'?(c.originalAudioId||c.audioId):c.audioId);if(a){await engine.init();engine.pause();engine.audioVoice(engine.ctx,engine.channels.get(selectedTrack).input,a.buffer,engine.ctx.currentTime+.02,0,a.buffer.duration,true,c.gainDb,c.id);updateTransport();toast(audition.dataset.tuneListen==='original'?'Écoute de la prise originale.':'Écoute de la prise corrigée.');}return;}
  if(e.target.closest('[data-reset-tune]')){const c=currentClip();if(c?.originalAudioId){checkpoint();c.audioId=c.originalAudioId;delete c.originalAudioId;delete c.tuneReport;delete c.tuneApplied;changed(true);toast('Prise originale restaurée.');}return;}
  const b=e.target.closest('[data-preview]');if(b){await engine.preview(b.dataset.preview);updateTransport();return;}
  const inst=e.target.closest('[data-instrument]');if(inst){setDetailOpen(true);const type=inst.dataset.instrument;const tr=project.tracks.find(t=>t.type===type);if(tr){detail='plugins';selectTrack(tr.id);}else addTrack(type);await engine.preview(type,type==='bass'?33:57);updateTransport();return;}
  const fx=e.target.closest('[data-open-fx]');if(fx){$('modal').close();openPluginWindow(fx.dataset.openFx);return;}
  const add=e.target.closest('[data-add-type]');if(add){if(project.tracks.length>=64){toast('La session est limitée à 64 pistes.');return;}$('modal').close();const tr=addTrack(add.dataset.addType);detail='plugins';renderDetail();if(ACOUSTIC_INSTRUMENTS[tr.type])openPluginWindow('instrument',tr.id);return;}
  if(e.target.closest('[data-import]')){$('audioInput').click();return;}
  if(e.target.closest('[data-create-clip]')){createClip(currentTrack(),0);return;}
  const power=e.target.closest('[data-power]');if(power){checkpoint();const tr=parameterTrack(power);if(!tr)return;const state=tr.effects[power.dataset.power];state.enabled=!state.enabled;changed(true);renderFloatingPlugin();return;}
  const select=e.target.closest('[data-select-track]');if(select){selectTrack(select.dataset.selectTrack);showTrackProperties(true);return;}
  const mixerMute=e.target.closest('[data-mute],[data-solo]');if(mixerMute){const id=mixerMute.dataset.mute||mixerMute.dataset.solo,tr=project.tracks.find(t=>t.id===id),key=mixerMute.dataset.mute?'mute':'solo';checkpoint();tr[key]=!tr[key];changed();renderMixer();renderTracks();renderInspector();return;}
  const trackHead=e.target.closest('.track-head');if(trackHead){const tr=project.tracks.find(t=>t.id===trackHead.closest('[data-track]').dataset.track),action=e.target.closest('[data-action]');if(action){checkpoint();tr[action.dataset.action]=!tr[action.dataset.action];changed();renderTracks();renderInspector();}else selectTrack(tr.id);return;}
  const step=e.target.closest('[data-step]');if(step){const c=currentClip();if(!c)return;checkpoint();const p=c.pattern[step.dataset.voice];p[Number(step.dataset.step)]=1-p[Number(step.dataset.step)];step.classList.toggle('on',!!p[step.dataset.step]);step.setAttribute('aria-pressed',!!p[step.dataset.step]);if(p[step.dataset.step]&&!engine.playing)await engine.preview(step.dataset.voice);writePatternChannel(project,currentTrack(),c);changed();drawClips();return;}
  const key=e.target.closest('[data-key]');if(key){await engine.preview(currentTrack().type,Number(key.dataset.key),selectedTrack);updateTransport();return;}
  const note=e.target.closest('[data-nstep]');if(note){const c=currentClip(),midi=Number(note.dataset.note),s=Number(note.dataset.nstep),len=Number($('noteLength')?.value||4);checkpoint();const existing=c.notes.find(n=>n.midi===midi&&s>=n.step&&s<n.step+n.len);if(existing)c.notes=c.notes.filter(n=>n!==existing);else{c.notes.push({step:s,midi,len:Math.min(len,32-s)});if(!engine.playing)await engine.preview(currentTrack().type,midi,selectedTrack);}const chosen=$('noteLength').value;changed();renderEditor();$('noteLength').value=chosen;drawClips();return;}
});
document.addEventListener('pointerdown',e=>{if(!e.target.closest('.knob')&&e.target.matches('[data-param],[data-volume],[data-pan],[data-master],[data-tune-param],#swing,#clipGain,#micGain')){checkpoint();}});
document.addEventListener('keydown',e=>{if(e.target.matches('input[type=range]')&&['ArrowLeft','ArrowRight','ArrowUp','ArrowDown','Home','End'].includes(e.key)&&!e.repeat)checkpoint();});
document.addEventListener('input',e=>{
  const el=e.target;
  if(el.dataset.volumeNumber){if(el.value!==''&&Number.isFinite(Number(el.value)))setTrackVolume(el.dataset.volumeNumber,el.value);return;}
  if(el.dataset.masterParam){const [id,key]=el.dataset.masterParam.split('.'),c=MASTER_MODULES[id].controls.find(c=>c.key===key);project.mastering[id][key]=Number(el.value);syncMasterWidgets(el.dataset.masterParam,c,Number(el.value));changed();if($('masterPreset'))$('masterPreset').value=matchMasterPreset(project);return;}
  if(el.id==='clipGain'){setSelectedClipGain(Number(el.value));return;}
  if(el.id==='micGain'){setMicGain(Number(el.value));return;}
  if(el.dataset.tuneParam){const key=el.dataset.tuneParam,value=Number(el.value),c=TUNE_CONTROLS.find(p=>p.key===key);currentTrack().tune[key]=value;syncParameterWidgets(key,c,value,'data-tune-param');save();}
  if(el.dataset.param){const [target,key]=el.dataset.param.split('.'),tr=parameterTrack(el);if(!tr)return;const def=target==='instrument'?instrumentDefinition(tr.type):effectDefinition(target),c=def?.controls.find(c=>c.key===key),value=Number(el.value);if(!c||!Number.isFinite(value))return;if(target==='instrument')tr.instrument[key]=value;else tr.effects[target][key]=value;syncParameterWidgets(el.dataset.param,c,value,'data-param',tr.id);for(const {instance,view:win} of pluginWindows.entries){if(instance.trackId!==tr.id||instance.id!==target)continue;const preset=findPluginControl(win.body,'suitePreset');if(preset)preset.value=matchPreset(tr,target);if(target==='prism')drawPrismResponse(tr,win.body);const timing=findPluginControl(win.body,'relayTiming');if(target==='relay'&&timing)timing.textContent=relayTimes(project.bpm,tr.effects.relay.beats).map(v=>Math.round(v*1000)+' ms').join(' · ');}changed();}
  if(el.dataset.volume){setTrackVolume(el.dataset.volume,el.value);}
  if(el.dataset.pan)setTrackPan(el.dataset.pan,Number(el.value));
  if(el.hasAttribute('data-master')){engine.masterVolume=Number(el.value);document.querySelectorAll('[data-master]').forEach(input=>input.value=engine.masterVolume);document.querySelectorAll('[data-master-db],#masterDb').forEach(node=>node.textContent=engine.masterVolume.toFixed(1)+' dB');engine.sync();save();}
  if(el.id==='swing'){project.swing=Number(el.value);$('swingValue').textContent=project.swing+'%';save();}
});
document.addEventListener('change',e=>{if(e.target.dataset.volumeNumber){setTrackVolume(e.target.dataset.volumeNumber,e.target.value,true);return;}if(e.target.dataset.trackNameInput){const tr=project.tracks.find(t=>t.id===e.target.dataset.trackNameInput);if(tr){checkpoint();tr.name=e.target.value.trim().slice(0,60)||tr.name;changed(true);}return;}if(e.target.dataset.trackColorInput){const tr=project.tracks.find(t=>t.id===e.target.dataset.trackColorInput);if(tr){checkpoint();tr.color=e.target.value;changed(true);}return;}if(e.target.id==='autoLevel'){checkpoint();project.recording=recordingSettings({...project.recording,autoLevel:e.target.checked});save();}if(e.target.dataset.tuneOption){checkpoint();const key=e.target.dataset.tuneOption;currentTrack().tune[key]=key==='key'?Number(e.target.value):e.target.value;save();}});

$('ruler').addEventListener('pointerdown',e=>{if(recording)return;const r=$('ruler').getBoundingClientRect();engine.seek(snapBar((e.clientX-r.left)/r.width*project.bars,editMode,editGrid)*16);updateTransport();});
$('trackRows').addEventListener('dblclick',e=>{const clip=e.target.closest('[data-clip]');if(clip){selectClipElement(clip);setDetailOpen(true);if(!['drums','audio','bus'].includes(currentTrack()?.type)){document.body.dataset.studioSurface='piano';signature?.select('compose',false);renderDetail();}return;}const lane=e.target.closest('[data-lane]');if(!lane||editingTool==='draw')return;const tr=project.tracks.find(t=>t.id===lane.dataset.lane),r=lane.getBoundingClientRect(),start=Math.floor((e.clientX-r.left)/r.width*project.bars);createClip(tr,start);setDetailOpen(true);});
$('trackRows').addEventListener('click',e=>{
  if(performance.now()<suppressClipClickUntil)return;
  const clip=e.target.closest('[data-clip]');if(clip){if((e.ctrlKey||e.metaKey)&&multiClips.size)return;selectClipElement(clip);return;}
  const lane=e.target.closest('[data-lane]');if(!lane)return;const tr=project.tracks.find(t=>t.id===lane.dataset.lane),r=lane.getBoundingClientRect(),position=snapBar((e.clientX-r.left)/r.width*project.bars,editMode,editGrid);
  if(editingTool==='draw'&&!recording){createClip(tr,Math.max(0,Math.min(project.bars-1,position)));setDetailOpen(true);}
  else{selectTrack(tr.id,null);if(!recording)engine.seek(position*16);}
});
$('trackRows').addEventListener('keydown',e=>{const clip=e.target.closest('[data-clip]');if(clip&&e.key==='Enter'){e.preventDefault();e.stopPropagation();selectClipElement(clip);setDetailOpen(true);}});
$('trackRows').addEventListener('pointerdown',e=>{
  const clipEl=e.target.closest('[data-clip]');if(!clipEl||e.button!==0||recording||editingTool==='draw')return;
  const tr=project.tracks.find(t=>t.id===clipEl.closest('[data-track]').dataset.track),clip=tr.clips.find(c=>c.id===clipEl.dataset.clip),lane=clipEl.closest('.track-lane'),rect=clipEl.getBoundingClientRect();
  if(clip.audioId&&(e.ctrlKey||e.metaKey)){if(multiClips.has(clip.id))multiClips.delete(clip.id);else multiClips.add(clip.id);selectedTrack=tr.id;selectedClip=clip.id;detail='editor';updateSelectionMarkers();renderDetail();e.preventDefault();return;}
  if(clip.audioId&&!multiClips.has(clip.id)){multiClips.clear();multiClips.add(clip.id);if(clip.groupId)for(const t of project.tracks)for(const c of t.clips)if(c.groupId===clip.groupId)multiClips.add(c.id);}
  selectedTrack=tr.id;selectedClip=clip.id;detail='editor';updateSelectionMarkers();renderDetail();clipEl.focus({preventScroll:true});
  const smartZone=editingTool==='select'&&document.body.dataset.layoutProfile==='pt'&&clip.audioId?ptSmartZone(rect,e.clientX,e.clientY):null;
  if(editingTool==='selector'||smartZone==='selector'){const r=lane.getBoundingClientRect();const pos=rangePosition(e,r,clip);timeRange={project,clipId:clip.id,start:pos,end:pos};rangeDrag={pointer:e.pointerId,r,clip,anchor:pos};updateEditSelection();e.preventDefault();return;}
  if(editingTool==='split'){const r=lane.getBoundingClientRect();performSplit(snapBar((e.clientX-r.left)/r.width*project.bars,editMode,editGrid));suppressClipClickUntil=performance.now()+220;return;}
  timeRange=null;updateEditSelection();
  let edge=null;if(editingTool==='trim')edge=e.clientX<rect.left+rect.width/2?'left':'right';else if(editingTool==='select'){if(e.clientX-rect.left<9)edge='left';else if(rect.right-e.clientX<9)edge='right';}
  const fade=editingTool==='select'&&document.body.dataset.layoutProfile==='pt'&&clip.audioId&&e.clientY-rect.top<Math.min(18,rect.height/3)&&edge?(edge==='left'?'fadeIn':'fadeOut'):null;
  if(editMode==='spot'&&!edge&&!fade&&!e.altKey){suppressClipClickUntil=performance.now()+300;openSpotDialog(tr,clip);e.preventDefault();return;}
  dragState={fade,pointer:e.pointerId,el:clipEl,clip,tr,startX:e.clientX,startY:e.clientY,original:clone(clip),width:lane.getBoundingClientRect().width,bars:project.bars,scrollLeft:$('timelineScroll').scrollLeft,edge,items:clip.audioId?selectedAudioClips().map(({track,clip})=>({track,clip,original:clone(clip)})):[],changed:false};e.preventDefault();
});
document.addEventListener('pointermove',e=>{if(rangeDrag&&e.pointerId===rangeDrag.pointer){const pos=rangePosition(e,rangeDrag.r,rangeDrag.clip);timeRange.start=Math.min(pos,rangeDrag.anchor);timeRange.end=Math.max(pos,rangeDrag.anchor);updateEditSelection();e.preventDefault();return;}if(!dragState||e.pointerId!==dragState.pointer)return;const d=dragState,delta=(e.clientX-d.startX+$('timelineScroll').scrollLeft-d.scrollLeft)/d.width*d.bars;if(Math.hypot(delta*d.width/d.bars,e.clientY-d.startY)<4&&!d.changed)return;
  if(!d.changed){checkpoint();d.changed=true;try{d.el.setPointerCapture(e.pointerId);}catch{}}e.preventDefault();const mode=e.altKey?'slip':editMode;
  d.lastPointer={clientX:e.clientX,clientY:e.clientY,pointerId:e.pointerId,altKey:e.altKey};
  d.dropLane?.classList.remove('clip-drop-target','clip-drop-invalid');d.dropLane=null;d.dropTrack=null;
  if(!d.edge&&!d.fade&&mode!=='shuffle'&&mode!=='spot'&&d.items.length<=1){
   const hit=document.elementFromPoint(e.clientX,e.clientY)?.closest('[data-lane]');
   const dest=project.tracks.find(t=>t.id===hit?.dataset.lane);
   if(dest&&dest!==d.tr){
    d.dropLane=hit;
    const valid=canTransferClip(d.tr,dest,d.clip);
    hit.classList.add(valid?'clip-drop-target':'clip-drop-invalid');
    if(valid)d.dropTrack=dest;
   }
  }
  if(!d.scrollFrame&&!d.fade)d.scrollFrame=requestAnimationFrame(function scrollDrag(){if(dragState!==d)return;const sc=$('timelineScroll'),r=sc.getBoundingClientRect(),x=d.lastPointer.clientX;const speed=x>r.right-35?18:x<r.left+35?-18:0;if(speed>0&&sc.scrollLeft+sc.clientWidth>=sc.scrollWidth-2&&project.bars<MAX_BARS&&!d.edge){const end=fitSession(project.bars,project.bars+8);project.bars=end;document.documentElement.style.setProperty('--bars',end);document.documentElement.style.setProperty('--timeline-width',d.width*end/d.bars+'px');for(const t of project.tracks)for(const c of t.clips){const n=document.querySelector('[data-clip="'+c.id+'"]');if(n){n.style.left=c.start/end*100+'%';n.style.width='calc('+c.length/end*100+'% - 4px)';}}}if(speed){const old=sc.scrollLeft;sc.scrollLeft+=speed;if(sc.scrollLeft!==old)document.dispatchEvent(new PointerEvent('pointermove',d.lastPointer));}d.scrollFrame=requestAnimationFrame(scrollDrag);});
  if(d.fade){const secondsPerBar=240/project.bpm,sign=d.fade==='fadeIn'?1:-1;const other=d.fade==='fadeIn'?'fadeOut':'fadeIn';d.clip[d.fade]=Math.max(0,Math.min(60,Math.max(0,d.clip.length*secondsPerBar-(d.clip[other]||0)),(d.original[d.fade]||0)+sign*delta*secondsPerBar));d.el.dataset.fadePreview=d.clip[d.fade].toFixed(3)+' s';}
  else if(d.edge){const position=snapBar((d.edge==='left'?d.original.start:d.original.start+d.original.length)+delta,mode,editGrid),duration=assets.get(d.clip.audioId)?.buffer.duration??Infinity;Object.assign(d.clip,trimClip(d.original,d.edge,position,MAX_BARS,project.bpm,duration));}
  else if(d.items.length){const desired=snapBar(d.original.start+delta,mode,editGrid)-d.original.start,{shift}=arrangementShift(d.items.map(i=>i.original),desired,project.bars);for(const item of d.items){item.clip.start=item.original.start+shift;const node=document.querySelector(`[data-clip="${item.clip.id}"]`);if(node)node.style.left=item.clip.start/project.bars*100+'%';}}
  else d.clip.start=d.original.start+arrangementShift([d.original],snapBar(d.original.start+delta,mode,editGrid)-d.original.start,project.bars).shift;
  // Preserve pixels per bar during a drag. Grow the existing lanes without replacing captured nodes.
  const end=Math.max(d.clip.start+d.clip.length,...d.items.map(i=>i.clip.start+i.clip.length));
  if(end>project.bars){const before=project.bars;project.bars=fitSession(before,end+4);
   document.documentElement.style.setProperty('--bars',project.bars);
   document.documentElement.style.setProperty('--timeline-width',d.width*project.bars/d.bars+'px');
   for(const track of project.tracks)for(const clip of track.clips){const node=document.querySelector('[data-clip="'+clip.id+'"]');if(node){node.style.left=clip.start/project.bars*100+'%';node.style.width='calc('+clip.length/project.bars*100+'% - 4px)';}}
  }
  d.el.style.left=d.clip.start/project.bars*100+'%';d.el.style.width=`calc(${d.clip.length/project.bars*100}% - 4px)`;updateEditSelection();
});
// Compute a shuffle edit from the pre-drag layout, preserving existing gaps.
function shuffleDragLayout(d){
 const entries=d.tr.clips.map(c=>({c,start:c===d.clip?d.original.start:c.start,length:c===d.clip?d.original.length:c.length})).sort((a,b)=>a.start-b.start);
 if(d.tr.type!=='audio'||d.items.length!==1||entries.some(e=>e.c.groupId)||Object.keys(d.tr.automation?.curves||{}).length||entries.some((e,i)=>i&&entries[i-1].start+entries[i-1].length>e.start+1e-8))return null;
 const index=entries.findIndex(e=>e.c===d.clip);if(index<0)return null;
 if(d.edge){const shift=d.clip.length-d.original.length;return entries.map((e,i)=>({c:e.c,start:i===index?d.original.start:e.start+(i>index?shift:0),length:i===index?d.clip.length:e.length}));}
 const others=entries.filter(e=>e.c!==d.clip),target=d.clip.start+d.clip.length/2;
 let insert=others.findIndex(e=>target<e.start+e.length/2);if(insert<0)insert=others.length;
 const reordered=[...others];reordered.splice(insert,0,entries[index]);let cursor=entries[0].start;
 return reordered.map((e,i)=>{if(i)cursor+=Math.max(0,entries[i].start-entries[i-1].start-entries[i-1].length);const start=cursor;cursor+=e.length;return {c:e.c,start,length:e.length};});
}
function finishClipDrag(event){if(!dragState||(event?.pointerId!==undefined&&event.pointerId!==dragState.pointer))return;const d=dragState;dragState=null;cancelAnimationFrame(d.scrollFrame);d.dropLane?.classList.remove('clip-drop-target','clip-drop-invalid');delete d.el.dataset.fadePreview;if(d.changed){if(event?.type==='pointercancel'||event?.type==='blur'){Object.assign(d.clip,d.original);for(const item of d.items)Object.assign(item.clip,item.original);project.bars=d.bars;changed(true);return;}if(d.dropTrack&&transferClip(project,d.tr,d.dropTrack,d.clip)){selectedTrack=d.dropTrack.id;selectedClip=d.clip.id;}if(editMode==='shuffle'&&!d.fade&&d.tr.type==='audio'){const layout=shuffleDragLayout(d);if(layout&&layout.every(e=>e.start>=0&&e.start+e.length<=project.bars+1e-8)){for(const e of layout)e.c.start=e.start;}else{Object.assign(d.clip,d.original);for(const item of d.items)Object.assign(item.clip,item.original);toast('Shuffle indisponible : groupe, automation, chevauchement ou limite de session.');}}suppressClipClickUntil=performance.now()+180;changed(true);}}
function finishRange(e){if(!rangeDrag||(e?.pointerId!==undefined&&e.pointerId!==rangeDrag.pointer))return;rangeDrag=null;suppressClipClickUntil=performance.now()+180;}
document.addEventListener('pointerup',finishRange);document.addEventListener('pointercancel',finishRange);window.addEventListener('blur',()=>finishRange());
document.addEventListener('pointerup',finishClipDrag);document.addEventListener('pointercancel',finishClipDrag);window.addEventListener('blur',()=>finishClipDrag());
let dragDepth=0;const arrangement=$('arrangementSection');
arrangement.addEventListener('dragenter',e=>{if(e.dataTransfer.types.includes('Files')){e.preventDefault();dragDepth++;arrangement.classList.add('drop-active');}});
arrangement.addEventListener('dragover',e=>{e.preventDefault();e.dataTransfer.dropEffect='copy';});
arrangement.addEventListener('dragleave',()=>{if(--dragDepth<=0){dragDepth=0;arrangement.classList.remove('drop-active');}});
arrangement.addEventListener('drop',async e=>{e.preventDefault();dragDepth=0;arrangement.classList.remove('drop-active');const lane=e.target.closest('[data-lane]'),tr=lane?project.tracks.find(t=>t.id===lane.dataset.lane):null,r=lane?.getBoundingClientRect(),start=r?Math.max(0,Math.floor((e.clientX-r.left)/r.width*project.bars)):0;await importAudio(e.dataTransfer.files,tr,start);});
window.addEventListener('dragover',e=>e.preventDefault());window.addEventListener('drop',e=>e.preventDefault());
document.addEventListener('keydown',e=>{
  if(e.defaultPrevented)return;if(e.key==='Escape'&&!$('trackQuickControl').hidden){closeTrackQuickControl();e.preventDefault();return;}if(e.ctrlKey&&e.altKey&&['ArrowUp','ArrowDown'].includes(e.key)&&!e.target.matches('input,textarea,select')){e.preventDefault();moveTrackByStep(selectedTrack,e.key==='ArrowUp'?-1:1);return;}if(!e.target.matches('input,textarea,select')&&!e.target.isContentEditable&&!$('modal').open){if((e.ctrlKey||e.metaKey)&&e.key.toLowerCase()==='='){e.preventDefault();if(floatingMixerOpen())closeFloatingMixer();else setView(view==='mixer'?'arrange':'mixer');return;}if((e.ctrlKey||e.metaKey)&&e.key.toLowerCase()==='c'){if(currentClip()){e.preventDefault();const items=selectedAudioClips();clipClipboard=items.length>1?{group:items.map(a=>({trackId:a.track.id,clip:clone(a.clip)})),origin:Math.min(...items.map(a=>a.clip.start))}:{clip:clone(currentClip()),type:currentTrack().type};toast('Clip copié.');}return;}if((e.ctrlKey||e.metaKey)&&e.key.toLowerCase()==='v'){e.preventDefault();pasteClip();return;}if(!e.ctrlKey&&!e.metaKey){const tool={g:'move',t:'trim',c:'split'}[e.key.toLowerCase()];if(tool){e.preventDefault();setEditingTool(tool);return;}if(e.key.toLowerCase()==='b'){e.preventDefault();performSplit(engine.getPosition()/16);return;}if(e.key==='ArrowLeft'||e.key==='ArrowRight'){e.preventDefault();nudgeClip(e.key==='ArrowLeft'?-1:1);return;}}}if(e.key==='Escape'&&!$('modal').open){closePluginWindow();return;}
  const editable=e.target.matches('input,textarea,select')||e.target.isContentEditable;if(editable||$('modal').open)return;
  const transportKey=e.code==='Space'||e.code==='Enter'||['r','l'].includes(e.key.toLowerCase());
  if(transportKey&&!e.ctrlKey&&!e.metaKey&&!e.altKey){
    // Holding a transport key must not toggle playback, record or loop repeatedly.
    e.preventDefault();if(e.repeat||e.isComposing)return;
    if(e.code==='Space')togglePlay();else if(e.code==='Enter')stop();else if(e.key.toLowerCase()==='r')record();else $('loop').click();
    return;
  }
  if(e.code==='Space'||e.code==='Enter')return;
  if((e.ctrlKey||e.metaKey)&&e.key.toLowerCase()==='z'){e.preventDefault();undo(e.shiftKey);}else if((e.ctrlKey||e.metaKey)&&e.key.toLowerCase()==='y'){e.preventDefault();undo(true);}else if((e.ctrlKey||e.metaKey)&&e.key.toLowerCase()==='d'){e.preventDefault();duplicateClip();}else if((e.ctrlKey||e.metaKey)&&e.key.toLowerCase()==='s'){e.preventDefault();saveProject();}else if(e.key==='Delete'||e.key==='Backspace'){e.preventDefault();deleteClip();}else if(e.key.toLowerCase()==='v'&&!e.ctrlKey&&!e.metaKey)setEditingTool('select');else if(e.key.toLowerCase()==='p'&&!e.ctrlKey&&!e.metaKey)setEditingTool('draw');else if(e.key==='/'){e.preventDefault();document.querySelector('.library').classList.add('sounds-open');$('librarySearch').focus();}
});
let resizeTimer;window.addEventListener('resize',()=>{clearTimeout(resizeTimer);resizeTimer=setTimeout(render,100);});
function flushPendingSave(){if(!loaded||saveTimer==null)return;clearTimeout(saveTimer);saveTimer=null;persist().catch(()=>{});}
// Save before the browser freezes a hidden page; unloading alone cannot guarantee completion.
document.addEventListener('visibilitychange',()=>{if(document.visibilityState==='hidden')flushPendingSave();});
window.addEventListener('pagehide',flushPendingSave);
window.addEventListener('beforeunload',flushPendingSave);

let lastStep=-1,lastMeter=0;const meterData=new Uint8Array(128),packMeterData=new Float32Array(32);
const ptMeterBuffer=new Float32Array(2048);
const ptPeakState=new Map();
let ptPeakProject=null;
function updatePtStereoMeters(){
 if(document.body.dataset.layoutProfile!=='pt'||document.body.dataset.studioView!=='mixer')return;
 if(ptPeakProject!==project){ptPeakState.clear();ptPeakProject=project;}
 const now=performance.now(),active=new Set();
 for(const el of document.querySelectorAll('[data-pt-meter]')){
 const id=el.dataset.ptMeter,side=Number(el.dataset.side),key=id+':'+side;
 active.add(key);
 const ch=engine.channels.get(id),analyser=id==='master'?engine.graph?.mastering?.meters?.[side]:side===0?ch?.meterLeft:ch?.meterRight;
 let peak=0;if(analyser){const data=ptMeterBuffer.subarray(0,analyser.fftSize);analyser.getFloatTimeDomainData(data);for(const v of data)if(Number.isFinite(v))peak=Math.max(peak,Math.abs(v));}
 const db=peak>0?Math.max(-60,20*Math.log10(peak)):-60;
 const st=ptPeakState.get(key)||{level:-60,hold:-60,until:0,clip:false,time:now};
 const dt=Math.max(0,(now-st.time)/1000);st.time=now;
 st.level=Math.max(db,st.level-24*dt);
 if(db>=st.hold){st.hold=db;st.until=now+1500;}else if(now>st.until)st.hold=Math.max(db,st.hold-18*dt);
 st.clip=st.clip||peak>=1;ptPeakState.set(key,st);
 const pct=v=>Math.max(0,Math.min(100,(v+60)/60*100));
 el.style.height=pct(st.level)+'%';el.style.setProperty('--peak-offset',pct(st.hold)+'%');
 el.classList.toggle('clip',st.clip);const rail=el.parentElement;rail.style.setProperty('--peak-offset',pct(st.hold)+'%');rail.classList.toggle('latched-clip',st.clip);
 rail.title=(side?'R':'L')+' '+st.hold.toFixed(1)+' dBFS · clic : reset';
 }
 for(const key of ptPeakState.keys())if(!active.has(key))ptPeakState.delete(key);
}
document.addEventListener('click',e=>{
 const reset=e.target.closest('[data-pt-reset]');if(!reset)return;
 if(reset.dataset.ptReset==='all')ptPeakState.clear();else for(const key of ptPeakState.keys())if(key===reset.dataset.ptReset+':0'||key===reset.dataset.ptReset+':1')ptPeakState.delete(key);
 updatePtStereoMeters();
});
function meter(analyser){if(!analyser)return 0;analyser.getByteTimeDomainData(meterData);let sum=0;for(let i=0;i<meterData.length;i++){const x=(meterData[i]-128)/128;sum+=x*x;}return Math.sqrt(sum/meterData.length);}
function frame(now){workflow.updateFrame();piano?.updateFrame();if(engine.sessionPreview.state.status==='playing')syncSessionPreview();
  const position=engine.getPosition(),bar=Math.floor(position/16)+1,beat=Math.floor(position%16/4)+1,sixteenth=Math.floor(position%4)+1;
  $('positionDisplay').innerHTML=`${String(bar).padStart(3,'0')}<span>.</span>${beat}<span>.</span>${sixteenth}`;
  const sec=position*engine.stepDuration;$('secondsDisplay').textContent=`${String(Math.floor(sec/60)).padStart(2,'0')}:${(sec%60).toFixed(2).padStart(5,'0')}`;
  const lane=$('ruler');if(lane){const offset=lane.offsetLeft+position/(project.bars*16)*lane.clientWidth;$('playhead').style.left=offset+'px';}
  const step=Math.floor(position);if(step!==lastStep){lastStep=step;if(detail==='editor'){
    const clip=currentClip(),rel=clip?step-clip.start*16:-1,inside=clip&&rel>=0&&rel<clip.length*16;
    document.querySelectorAll('.step.current,.note-cell.current').forEach(el=>el.classList.remove('current'));
    if(inside&&engine.playing){document.querySelectorAll(`[data-step="${rel%16}"],[data-nstep="${rel%32}"]`).forEach(el=>el.classList.add('current'));}
  }}
  if(now-lastMeter>65){lastMeter=now;updateExpansionHardware();updateInstrumentFaces();updateEffectFaces();updateAlterFaces();updateExoStripFaces();updateExoAirFaces();updateExoFocusFaces();updateExoSpaceFaces();updateVoxProFaces();updateVoxAmbienceFaces();updateVoxAirFaces();updateVoxTuneFaces();updateVoxCleanFaces();updateVoxLevelFaces();updateCircuitColorFaces();updateCircuitBusFaces();updateVectorCompFaces();updateVectorLimitFaces();updateMasterMeters();updatePtStereoMeters();const mic=recording?.graph||micPreview,peak=mic?micPeak(mic.analyser):null;updateMicMeter(peak);const rms=recording?(peak||0):meter(engine.masterAnalyser),dbv=rms>0?20*Math.log10(rms):-100,level=Math.max(0,Math.min(100,(dbv+60)/60*100));$('masterLevel').style.width=level+'%';$('peakLabel').textContent=dbv<-60?'−∞ dB':dbv.toFixed(1)+' dB';if($('mixerMasterMeter'))$('mixerMasterMeter').style.height=level+'%';for(const [id,ch] of engine.channels){const els=document.querySelectorAll(`[data-meter="${id}"]`);if(els.length){const v=meter(ch.analyser);for(const el of els)el.style.height=Math.max(0,Math.min(100,((v>0?20*Math.log10(v):-100)+60)/60*100))+'%';}}
    document.querySelectorAll('[data-pack-meter]').forEach(node=>{const [trackId,id]=node.dataset.packMeter.split(':'),monitor=engine.channels.get(trackId)?.pack?.modules?.[id]?.monitor;let reduction=0;if(monitor){monitor.getFloatTimeDomainData(packMeterData);const avg=packMeterData.reduce((sum,v)=>sum+v,0)/packMeterData.length,value=id==='sibil'?1+avg:avg;reduction=20*Math.log10(Math.max(.0001,value));}node.textContent=Math.min(0,reduction).toFixed(1)+' dB';});
    document.querySelectorAll('[data-gr-track]').forEach(node=>{const ch=engine.channels.get(node.dataset.grTrack);node.textContent=(ch?.compressor.reduction||0).toFixed(1)+' dB';});
    if(recording&&position>=MAX_BARS*16-.5){stopRecording();toast('Limite maximale de session atteinte.');}
  }
  requestAnimationFrame(frame);
}
const TUNE_CONTROLS=[{key:'speed',name:'Retune',min:0,max:250,step:1,default:35,unit:'ms'},{key:'amount',name:'Correction',min:0,max:1,step:.01,default:1,unit:'%'},{key:'mix',name:'Mix',min:0,max:1,step:.01,default:1,unit:'%'}];
function formatDb(db){return Number.isFinite(db)?`${db>0?'+':''}${db.toFixed(1)} dB`:'−∞ dB';}
function assetLevels(asset){if(!asset.levels)asset.levels=measureBuffer(asset.buffer);return asset.levels;}
function updateClipPeak(){const c=currentClip(),a=assets.get(c?.audioId),label=$('clipPeak');if(!label||!a)return;const peak=assetLevels(a).peakDb+clampClipGain(c.gainDb);label.textContent=`Crête après gain : ${formatDb(peak)}${peak> -1?' · baisse le gain':''}`;label.classList.toggle('hot',peak> -1);}
function setSelectedClipGain(value,withUndo=false){const c=currentClip();if(!c?.audioId)return;if(withUndo)checkpoint();c.gainDb=clampClipGain(value);engine.setClipGain(c.id,c.gainDb);if($('clipGain'))$('clipGain').value=c.gainDb;if($('clipGainValue'))$('clipGainValue').textContent=formatDb(c.gainDb);updateClipPeak();drawClips();if($('audioWave'))drawClip($('audioWave'),currentTrack(),c);changed();}
function normaliseSelectedClip(){const c=currentClip(),a=assets.get(c?.audioId);if(!a)return;const level=normalisationGain(assetLevels(a));if(level.silent){toast('Signal presque silencieux : vérifie ton micro avant de remonter le niveau.');return;}setSelectedClipGain(level.gainDb,true);toast(`Gain du clip réglé à ${formatDb(level.gainDb)}${level.limited?' · amplification limitée à 30 dB': ' · crête visée −6 dB'}.`);}
let micRequest=0;
const micSamples=new Float32Array(2048);
function micPeak(analyser){analyser.getFloatTimeDomainData(micSamples);let peak=0;for(const x of micSamples)peak=Math.max(peak,Math.abs(x));return peak;}
function updateMicMeter(peak){const meter=$('micLevel'),value=$('micLevelValue'),hint=$('micLevelHint');if(!meter)return;const db=peak>0?20*Math.log10(peak):-Infinity;meter.style.width=Math.max(0,Math.min(100,(db+60)/60*100))+'%';meter.classList.toggle('hot',db> -1);if(value)value.textContent=formatDb(db);if(hint)hint.textContent=peak===null?'Teste ton micro pour vérifier le niveau.':db> -1?'Niveau trop élevé : baisse le gain.':db< -50?'Signal très faible : vérifie l’entrée et le gain de ton interface.':db< -24?'Signal faible : augmente le gain micro ou garde le niveau auto actif.':'Niveau reçu. Vise une crête entre −18 et −6 dB.';}
function stopMicPreview(){micRequest++;micPreview?.dispose();micPreview=null;}
async function startMicPreview(){
  if(recording||micPreview)return;
  if(!navigator.mediaDevices?.getUserMedia){toast('Le test micro n’est pas disponible dans ce navigateur.');return;}
  const request=++micRequest,button=$('testMic');let stream;if(button){button.disabled=true;button.textContent='Ouverture du micro…';}
  try{stream=await navigator.mediaDevices.getUserMedia({audio:{echoCancellation:false,noiseSuppression:false,autoGainControl:false}});if(request!==micRequest||!$('modal').open||!$('micGain')){stream.getTracks().forEach(t=>t.stop());return;}await engine.init();if(request!==micRequest||!$('modal').open||!$('micGain')){stream.getTracks().forEach(t=>t.stop());return;}micPreview=createRecordingGraph(engine.ctx,stream,recordingSettings(project.recording).gainDb);if($('testMic'))$('testMic').textContent='Micro actif · parle pour tester';updateTransport();}
  catch(e){stream?.getTracks().forEach(t=>t.stop());toast(e.name==='NotAllowedError'?'Autorise le microphone dans le navigateur pour le tester.':'Micro indisponible : '+e.message);if($('testMic')){$('testMic').disabled=false;$('testMic').textContent='Tester le micro';}}
}
function setMicGain(value){project.recording=recordingSettings({...project.recording,gainDb:value});recording?.graph.setGain(project.recording.gainDb);micPreview?.setGain(project.recording.gainDb);if($('micGain'))$('micGain').value=project.recording.gainDb;if($('micGainValue'))$('micGainValue').textContent=formatDb(project.recording.gainDb);save();updateTransport();}
function recordingModal(){return workflow.recordingModal();}

function syncParameterWidgets(target,control,value,attribute='data-param',trackId=selectedTrack){
  const f=(value-control.min)/(control.max-control.min);
  document.querySelectorAll(`[${attribute}="${target}"]`).forEach(input=>{if(parameterTrack(input)?.id!==trackId)return;input.value=value;input.parentElement.style.setProperty('--angle',`${f*280}deg`);input.parentElement.style.setProperty('--rotation',`${f*280-140}deg`);input.closest('.param').querySelector('.param-value').textContent=formatParam(control,value);});
}
function openVoxStudioRacks(trackId=selectedTrack){
 const tr=project.tracks.find(t=>t.id===trackId);if(!tr)return;ensurePlugins(tr);
 const categories=[...new Set([...RACK_CATEGORIES,...Object.values(VOX_STUDIORACKS).map(p=>p.category||'Voix')])];
 const choices=categories.map(category=>{
  const items=Object.entries(VOX_STUDIORACKS).filter(([,p])=>(p.category||'Voix')===category).map(([key,p])=>{
   const c=rackCapacity(tr,key);
   return `<option value="${esc(key)}" ${c.available<c.required?'disabled':''}>${esc(p.name)} · ${p.stages.length} DSP${c.available<c.required?' · manque de slots':''}</option>`;
  }).join('');
  return items?`<optgroup label="${esc(category)}">${items}</optgroup>`:'';
 }).join('');
 const rackSummary=key=>{
  if(!key)return '<p>Choisis un preset de chaîne.</p>';
  const plan=planVoxStudioRack(tr,key);
  return `<strong>${esc(plan.name)}</strong><p>${esc(plan.description)}</p>
   <p>${plan.required} plugins natifs à installer · ${plan.available} inserts libres.</p>
   <ol>${plan.stages.map(stage=>`<li><strong>${esc(stage.name)}</strong><ul>
    ${Object.entries(stage.values).map(([parameter,value])=>`<li>${esc(parameter)} : ${esc(String(value))}</li>`).join('')}
    </ul></li>`).join('')}</ol>
   <small>Prévisualisation uniquement. Le preset ajoute les plugins et leurs réglages en une seule opération. Chaque plugin s'édite ensuite dans sa fenêtre individuelle.</small>`;
 };
 const slots=tr.inserts.map((id,i)=>id?`<div class="vox-rack-stage">
   <span class="vox-rack-position">${String.fromCharCode(65+i)}</span>
   <strong>${esc(effectDefinition(id)?.name||id)}</strong>
   <button class="outline-btn" data-vr-open="${esc(id)}" aria-label="Ouvrir l'effet ${esc(id)}">Éditer</button>
   <button class="outline-btn" data-vr-toggle="${esc(id)}" aria-pressed="${!tr.effects[id]?.enabled}">${tr.effects[id]?.enabled?'Actif':'Bypass'}</button>
   <button class="outline-btn" data-vr-move="${i}" data-vr-dir="-1" ${i===0?'disabled':''} aria-label="Monter l'insert">↑</button>
   <button class="outline-btn" data-vr-move="${i}" data-vr-dir="1" ${i===tr.inserts.length-1?'disabled':''} aria-label="Descendre l'insert">↓</button>
  </div>`:'').join('');
 modal('VOX STUDIORACKS · '+tr.name,`<section class="vox-studioracks" data-vox-track="${tr.id}">
  <header><strong>WARLIKE / VOX STUDIORACKS</strong><span>RACK DSP ACTIF · ${tr.inserts.filter(Boolean).length} / ${tr.inserts.length} INSERTS</span></header>
  <p>Choisis un genre musical ou un template Mix/Master. Le rack installe les plugins natifs et leurs paramètres; il ne remplace pas les fenêtres individuelles des effets. Les traitements fonctionnent dans Play et l’export WAV.</p>
  <div class="vox-rack-apply"><label>PRESET / TYPE DE MIX <select id="voxStudioPreset">${choices}</select></label>
  <button class="primary-btn" id="voxStudioApply">Ajouter aux inserts libres</button></div>
  <nav class="vox-rack-template-navigation" aria-label="Presets par genre et usage"><button type="button" class="outline-btn" id="voxUniversalRack">WAR STUDIORACKS</button>
   <button type="button" class="outline-btn" id="voxRackInstrumentTemplates">Instruments par genre</button>
   <button type="button" class="outline-btn" id="voxRackMasterTemplates">Master par genre</button>
  </nav>
  <div class="vox-rack-preset-details" id="voxStudioPreview" aria-live="polite"></div>
  <div class="vox-rack-stages">${slots||'<p>Aucun effet sur cette piste. Choisis une chaîne ci-dessus.</p>'}</div>
  <small>Déplacer modifie le routage de la piste · Bypass conserve le réglage · Les inserts déjà présents sont préservés.</small>
  </section>`,'CHAYAH SUITE / DSP');
 const root=document.querySelector('#modalBody .vox-studioracks');
 const presetSelect=root.querySelector('#voxStudioPreset'),preview=root.querySelector('#voxStudioPreview');
 root.querySelector('#voxUniversalRack').onclick=()=>openWarRackBrowser(tr.id);
 root.querySelector('#voxRackInstrumentTemplates').onclick=()=>openMixMasterTemplates('mix',tr.id);
 root.querySelector('#voxRackMasterTemplates').onclick=()=>openMixMasterTemplates('master');
 const refreshRackPreview=()=>{preview.innerHTML=rackSummary(presetSelect.value);};
 presetSelect.addEventListener('change',refreshRackPreview);
 refreshRackPreview();
 root.querySelector('#voxStudioApply').onclick=async()=>{
  const key=root.querySelector('#voxStudioPreset').value;
  try{
   const c=rackCapacity(tr,key);if(c.available<c.required)throw Error('Il faut '+c.required+' inserts libres, seulement '+c.available+' disponibles.');
   if(VOX_STUDIORACKS[key].stages.some(stage=>stage.id==='voxtune'))await engine.init();
   checkpoint();applyVoxStudioRack(tr,key);changed(true);openVoxStudioRacks(tr.id);
  }catch(error){toast(error.message);}
 };
 root.querySelectorAll('[data-vr-open]').forEach(button=>button.onclick=()=>{const id=button.dataset.vrOpen;$('modal').close();openPluginWindow(id,tr.id);});
 root.querySelectorAll('[data-vr-toggle]').forEach(button=>button.onclick=()=>{checkpoint();bypassVoxStudioInsert(tr,button.dataset.vrToggle);changed(true);openVoxStudioRacks(tr.id);});
 root.querySelectorAll('[data-vr-move]').forEach(button=>button.onclick=()=>{const slot=Number(button.dataset.vrMove),direction=Number(button.dataset.vrDir);if(!tr.inserts[slot]||slot+direction<0||slot+direction>=tr.inserts.length)return;checkpoint();shiftVoxStudioInsert(tr,slot,direction);changed(true);openVoxStudioRacks(tr.id);});
}
function openPluginWindow(id,trackId=selectedTrack){
  const tr=project.tracks.find(t=>t.id===trackId),def=id==='instrument'?instrumentDefinition(tr?.type):effectDefinition(id);if(!tr||!def)return;if(id==='instrument'&&tr.type==='instrument'){openInstrumentMenu(tr.id);return;}
  ensurePlugins(tr);if(id!=='instrument'&&!tr.inserts.includes(id)){openInsertMenu(tr.id,tr.inserts.indexOf(null),false,id);return;}
  const instance=pluginInstances.acquire(tr.id,id),existing=pluginWindows.entries.find(e=>e.instance===instance);
  const entry=pluginWindows.open(instance,createPluginView);
  if(!existing)renderPluginView(instance);
  entry.view.controller.show();entry.view.root.focus({preventScroll:true});
}
function syncPluginWindowFocus(){
  pluginWindow=pluginWindows.active;
  for(const {instance,view:win} of pluginWindows.entries){const active=instance===pluginWindow;win.root.id=active?'pluginFloat':win.uid;win.root.dataset.active=String(active);scopePluginWindowIds(win.root,win.uid,active);}
}
function createPluginView(instance){
  const root=pluginWindowTemplate.cloneNode(true),uid='pluginWindow'+(++pluginWindowSerial);
  root.id=uid;root.dataset.pluginKey=instance.key;root.dataset.pluginTrack=instance.trackId;
  const header=root.querySelector('.floating-plugin-header'),title=header.querySelector('h2'),body=root.querySelector('.floating-plugin-body');
  const win={root,header,title,body,uid};document.body.append(root);icons(root);
  win.controller=installFloatingWindow(root,header,{key:'plugin:'+instance.key,offset:Math.min(6,pluginWindows.size)*24,onClose:()=>closePluginWindow(instance),onFocus:()=>{pluginWindows.focus(instance);syncPluginWindowFocus();}});
  const annotate=document.createElement('button');annotate.type='button';annotate.className='text-btn annotation-window-launch';annotate.textContent='✎ Annoter';annotate.setAttribute('aria-label','Annoter cette fenêtre');annotate.onclick=()=>$('annotateScreen')?.click();header.querySelector('.floating-window-actions').prepend(annotate);
  win.observer=new MutationObserver(()=>scopePluginWindowIds(root,uid,pluginWindows.active===instance));
  win.observer.observe(root,{childList:true,subtree:true});
  return win;
}
function closePluginWindow(instance=pluginWindow){
  const wasActive=pluginWindows.active===instance,closed=pluginWindows.close(instance,win=>{win.observer.disconnect();win.controller.dispose();win.root.remove();});
  if(!closed)return;pluginEdits.forget(instance.key);pluginInstances.release(instance);syncPluginWindowFocus();
  const active=pluginWindows.entries.at(-1)?.view;if(active&&wasActive){active.controller.focus();active.root.focus({preventScroll:true});}
}
function closeAllPluginWindows(){
  pluginWindows.clear(win=>{win.observer.disconnect();win.controller.dispose();win.root.remove();});pluginInstances.clear();pluginEdits.clear();pluginWindow=null;bundleOwner=null;
}
function renderFloatingPlugin(){
 const focused=document.activeElement,owner=focused?.closest('.floating-plugin');
 const browsing=focused?.closest('.plugin-preset-browser');
 const selector=browsing?(focused.matches('input[type="search"]')?'input[type="search"]':focused.matches('select')?'select':focused.matches('summary')?'summary':null):null;
 const selection=selector==='input[type="search"]'?[focused.selectionStart,focused.selectionEnd]:null;
 for(const {instance} of pluginWindows.entries)renderPluginView(instance);
 syncPluginWindowFocus();
 // A viewport reflow rebuilds plugin contents. Keep keyboard input in its owner.
 const next=selector&&owner?.isConnected?owner.querySelector('.plugin-preset-browser '+selector):null;
 if(next){next.focus({preventScroll:true});if(selection&&selection[0]!=null)next.setSelectionRange(...selection);}
}
function openSuite(){const tr=currentTrack();if(!instrumentDefinition(tr.type))openInsertMenu(tr.id,tr.inserts.indexOf(null));else openPluginWindow('instrument');}
let eqVisualContext=null;
function drawPrismResponse(track,root){
  if(!root?.isConnected||project.tracks.find(t=>t.id===track.id)!==track)return;
  const canvas=findPluginControl(root,'prismResponse');if(!canvas)return;const width=Math.max(250,canvas.clientWidth),height=110,ratio=devicePixelRatio||1;canvas.width=width*ratio;canvas.height=height*ratio;const ctx=canvas.getContext('2d');ctx.scale(ratio,ratio);ctx.clearRect(0,0,width,height);
  eqVisualContext??=new OfflineAudioContext(1,1,44100);const state=track.effects.prism,frequencies=Float32Array.from({length:240},(_,i)=>20*(1000**(i/239))),total=new Float32Array(240),phase=new Float32Array(240),mag=new Float32Array(240);
  for(const [type,freq,gain,q] of [['lowshelf',state.lowFreq,state.low,.7],['peaking',state.midFreq,state.mid,state.q],['highshelf',state.highFreq,state.high,.7]]){const filter=eqVisualContext.createBiquadFilter();filter.type=type;filter.frequency.value=freq;filter.gain.value=state.enabled?gain:0;filter.Q.value=q;filter.getFrequencyResponse(frequencies,mag,phase);for(let i=0;i<240;i++)total[i]+=20*Math.log10(Math.max(1e-9,mag[i]));}
  const x=f=>18+Math.log(f/20)/Math.log(1000)*(width-36),y=db=>height/2-db/24*(height/2-12);ctx.lineWidth=1;ctx.strokeStyle='#60704455';ctx.fillStyle='#91a17b';ctx.font='7px monospace';
  for(const f of [100,1000,10000]){ctx.beginPath();ctx.moveTo(x(f),8);ctx.lineTo(x(f),height-18);ctx.stroke();ctx.fillText(f===100?'100':f===1000?'1k':'10k',x(f)+3,height-6);}
  for(const db of [-12,0,12]){ctx.beginPath();ctx.moveTo(18,y(db));ctx.lineTo(width-18,y(db));ctx.stroke();ctx.fillText(db>0?'+'+db:String(db),1,y(db)-3);}
  ctx.lineWidth=2;ctx.strokeStyle=state.enabled?'#d0bf8b':'#758366';ctx.beginPath();for(let i=0;i<240;i++){const px=x(frequencies[i]),py=Math.max(7,Math.min(height-15,y(total[i])));if(i===0)ctx.moveTo(px,py);else ctx.lineTo(px,py);}ctx.stroke();
}
function observePluginEdit(instance,track,definition){
  const signature=JSON.stringify([instance.id==='instrument'?track.type:effectType(instance.id),definition.controls]);
  pluginEdits.observe(instance.key,signature,capturePluginEdit(track,instance.id,definition),pluginEditGroup);
}
function syncPluginEdits(){
  for(const {instance,view:win} of pluginWindows.entries){
    const tr=project.tracks.find(t=>t.id===instance.trackId),def=instance.id==='instrument'?instrumentDefinition(tr?.type):effectDefinition(instance.id);
    if(!tr||!def||instance.id!=='instrument'&&!tr.inserts.includes(instance.id))continue;
    observePluginEdit(instance,tr,def);
    for(const [direction,enabled] of [['undo',pluginEdits.canUndo(instance.key)],['redo',pluginEdits.canRedo(instance.key)]]){
      const button=win.root.querySelector('[data-plugin-history="'+direction+'"]');if(button)button.disabled=!enabled;
    }
  }
}
function undoPluginEdit(instance,redo=false){
  if(recording||recordFinalizing||micPending)return toast('Termine la prise avant cette action.');
  const tr=project.tracks.find(t=>t.id===instance.trackId),def=instance.id==='instrument'?instrumentDefinition(tr?.type):effectDefinition(instance.id);
  if(!tr||!def||!pluginWindows.entries.some(e=>e.instance===instance))return;
  syncPluginEdits();const snapshot=pluginEdits.step(instance.key,redo);if(!snapshot)return;
  checkpoint();if(!applyPluginEdit(tr,instance.id,def,snapshot))return;
  changed(true);toast((redo?'Modification rétablie':'Modification annulée')+' · '+def.name+' · '+tr.name);
}
function renderPluginView(instance){
  const win=pluginWindows.entries.find(e=>e.instance===instance)?.view;if(!win)return;const {id,trackId}=instance,tr=project.tracks.find(t=>t.id===trackId),def=id==='instrument'?instrumentDefinition(tr?.type):effectDefinition(id);
  if(!tr||!def||id!=='instrument'&&!tr.inserts.includes(id)){closePluginWindow(instance);return;}ensurePlugins(tr);const state=id==='instrument'?tr.instrument:tr.effects[id];
  const root=win.root,bodyRoot=win.body,local=name=>findPluginControl(bodyRoot,name);
  root.dataset.pluginTrack=tr.id;root.dataset.pack=def.pack||'studio';win.title.textContent=def.name+(id==='instrument'&&tr.type==='bass'?' 808':'')+(id==='instrument'?' · Instrument':' · Insert '+String.fromCharCode(65+tr.inserts.indexOf(id)))+' · '+tr.name;
  root.dataset.windowLabel=def.name+' · '+tr.name;root.setAttribute('aria-label',root.dataset.windowLabel);
  win.body.innerHTML=`<div class="plugin-window" style="--track-color:${tr.color}"><div class="plugin-window-meta"><span>${EFFECT_PACKS[def.pack]?.name?esc(EFFECT_PACKS[def.pack].name)+' / ':''}${def.subtitle}</span><strong>Piste : ${esc(tr.name)}</strong>${id!=='instrument'?`<button class="outline-btn float-bypass" data-power="${id}" aria-pressed="${state.enabled}">${state.enabled?'Actif':'Bypass'}</button>`:''}</div>${['hush','sibil'].includes(id)?`<div class="pack-activity"><span>${id==='sibil'?'BANDE DYNAMIQUE / RÉDUCTION':'GATE / ATTÉNUATION'}</span><strong data-pack-meter="${tr.id}:${id}">0.0 dB</strong></div>`:''}${id==='relay'?`<div class="pack-activity"><span>SYNC ${project.bpm} BPM / L · R</span><strong id="relayTiming">${relayTimes(project.bpm,state.beats).map(v=>Math.round(v*1000)+' ms').join(' · ')}</strong></div>`:''}${id==='glue'?`<div class="compressor-reduction">GAIN REDUCTION <strong data-gr-track="${tr.id}">0.0 dB</strong></div>`:''}<div class="plugin-window-params">${def.controls.map(c=>paramHTML(c,state[c.key]??c.default,id)).join('')}</div><p class="plugin-mouse-guide">Glisse ↑↓ pour régler · Maj pour affiner · Molette pour ajuster<br>Clique sur une valeur pour la saisir · Déplace la fenêtre par son titre</p><div class="plugin-window-footer"><span>${id==='instrument'?esc(def.description):def.description?esc(def.description):id==='prism'?'EQ trois bandes : fréquences réglables, gains et largeur Q de la bande centrale.':id==='glue'?'Compression parallèle : Mix dose le signal compressé. Knee adoucit le seuil. Make-up règle le niveau final.':id==='color'?'Mix dose la saturation en parallèle. Output permet de comparer à volume proche.':'Les réglages sont appliqués à cette piste et à l’export WAV.'}</span><button class="outline-btn" id="resetPlugin">Réinitialiser le module</button></div></div>`;
  local('resetPlugin').onclick=()=>{const owner=project.tracks.find(t=>t.id===trackId);if(!owner)return;checkpoint();const values=id==='instrument'?owner.instrument:owner.effects[id];def.controls.forEach(c=>values[c.key]=c.default);changed();renderPlugins();renderFloatingPlugin();};
  const options=presetsFor(tr,id),selected=matchPreset(tr,id),body=win.body,panel=body.querySelector('.plugin-window');
  // Only the selected instrument or effect belongs inside this window.
  // The complete track rack stays in the mixer / track inspector.
  panel.classList.add('suite-processor'); const identity=pluginIdentity(def,id==='instrument'?tr.type:effectType(id));panel.dataset.pluginFamily=identity.family;panel.dataset.processor=identity.processor;panel.dataset.pluginLayout=identity.layout;if(identity.processor==='vectoreq'){const params=panel.querySelector('.plugin-window-params');const knobs=Array.from(params.children);for(let i=0;i<6;i++){const group=document.createElement('section');group.className='vector-band';const heading=document.createElement('h4');heading.textContent='BAND '+(i+1);group.append(heading,...knobs.slice(i*3,i*3+3));params.append(group);}const output=document.createElement('section');output.className='vector-band vector-output';const heading=document.createElement('h4');heading.textContent='OUTPUT';output.append(heading,...knobs.slice(18));params.append(output);}panel.insertAdjacentHTML('afterbegin',`<div class="plugin-identity-banner"><strong>${esc(identity.label)}</strong><small>${esc(identity.layoutLabel)}</small></div>`);
  panel.insertAdjacentHTML('afterbegin',`<div class="suite-preset-bar"><label>PISTE<select id="suiteTrack" aria-label="Piste du plugin">${project.tracks.filter(t=>id!=='instrument'||t.type===tr.type).map(t=>`<option value="${t.id}" ${t.id===tr.id?'selected':''}>${esc(t.name)}</option>`).join('')}</select></label><label>PRESET<select id="suitePreset" aria-label="Preset du plugin"><option value="-1" ${selected<0?'selected':''}>Personnalisé</option>${options.map((p,i)=>`<option value="${i}" ${i===selected?'selected':''}>${p.name}</option>`).join('')}</select></label></div>`);
  if(id==='instrument'&&tr.type==='origins'){panel.classList.add('origins-hardware');const voice=ORIGINS_BANK[Math.round(state.voice)]||ORIGINS_BANK[0];panel.insertAdjacentHTML('afterbegin',`<div class="origins-face"><strong>O R I G I N S</strong><small>WORLD WINDS · MODELLED SERIES</small><div class="origins-screen">${esc(voice.region)} / ${esc(voice.family)}<b>${esc(voice.name)}</b><svg viewBox="0 0 240 30" aria-hidden="true"><path d="M0 15 Q10 0 20 15 T40 15 T60 15 T80 15 T100 15 T120 15 T140 15 T160 15 T180 15 T200 15 T220 15 T240 15" fill="none" stroke="currentColor"/></svg></div><label>Bibliothèque<select id="originsBank">${[...new Set(ORIGINS_BANK.map(v=>v.region))].map(region=>`<optgroup label="${esc(region)}">${ORIGINS_BANK.filter(v=>v.region===region).map(v=>`<option value="${v.id}" ${v.id===voice.id?'selected':''}>${esc(v.family+' / '+v.name)}</option>`).join('')}</optgroup>`).join('')}</select></label></div>`);local('originsBank').onchange=e=>{checkpoint();applyFactoryPreset(tr,id,Number(e.target.value)*3);changed(true);};}
  panel.insertAdjacentHTML('afterbegin',`<div class="suite-ab-controls" role="group" aria-label="Parcourir les presets d’usine"><button class="outline-btn" id="pluginPresetPrevious" ${!options.length?'disabled':''}>← Preset précédent</button><button class="outline-btn" id="pluginPresetNext" ${!options.length?'disabled':''}>Preset suivant →</button></div>`);
  for(const [button,direction] of [['pluginPresetPrevious',-1],['pluginPresetNext',1]])local(button).onclick=()=>{const index=nextPresetIndex(matchPreset(tr,id),direction,options.length);if(index<0)return;checkpoint();const name=applyFactoryPreset(tr,id,index);changed(true);toast('Preset '+name+'.');};
  if(id!=='instrument'){
    const personal=personalEffectPresets(project,id);
    panel.insertAdjacentHTML('beforeend',`<div class="suite-ab-controls"><label>MES PRESETS DU PROJET<select id="personalEffectPreset" aria-label="Charger un preset personnel"><option value="">Choisir…</option>${personal.map((preset,index)=>`<option value="${index}">${esc(preset.name)}</option>`).join('')}</select></label><label>NOM<input id="personalEffectName" maxlength="60" placeholder="Ex. Voix couplet douce"></label><button class="outline-btn" id="savePersonalEffect">Enregistrer le réglage</button><small>Conservé dans ce projet · Un même nom remplace le réglage précédent · 32 par effet.</small></div>`);
    local('savePersonalEffect').onclick=()=>{const name=local('personalEffectName').value.trim();if(!name)return toast('Donne un nom à ce preset.');if(personal.length>=32&&!personal.some(p=>p.name===name))return toast('Limite de 32 presets pour cet effet.');checkpoint();if(saveEffectPreset(project,tr,id,name)){changed(true);toast('Preset personnel enregistré dans le projet.');}};
    local('personalEffectPreset').onchange=event=>{if(event.target.value==='')return;const index=Number(event.target.value),candidate=clone(tr);if(!applyPersonalEffectPreset(project,candidate,id,index))return toast('Ce preset contient des valeurs invalides.');checkpoint();applyPersonalEffectPreset(project,tr,id,index);changed(true);toast('Preset personnel chargé.');};
    const active=tr.pluginComparisons?.[id]?.active==='B'?'B':'A';
    panel.insertAdjacentHTML('afterbegin',`<div class="suite-ab-controls" role="group" aria-label="Comparaison des réglages de ce plugin"><span>COMPARAISON</span><button class="outline-btn" id="pluginCompareA" aria-pressed="${active==='A'}">A</button><button class="outline-btn" id="pluginCompareB" aria-pressed="${active==='B'}">B</button><button class="outline-btn" id="pluginCompareCopy">Copier ${active} → ${active==='A'?'B':'A'}</button><small>Réglages indépendants pour cet insert</small></div>`);
    for(const target of ['A','B'])local('pluginCompare'+target).onclick=()=>{if((tr.pluginComparisons?.[id]?.active||'A')===target)return;checkpoint();if(compareInsert(tr,id,target)){changed(true);toast('Comparaison '+target+' · '+def.name);}};
    local('pluginCompareCopy').onclick=()=>{checkpoint();if(copyInsertComparison(tr,id)){changed(true);toast('Réglage copié vers '+(active==='A'?'B':'A')+'.');}};
  }
  // User bank is separate from project effect presets and works for instruments too.
  const type=id==='instrument'?tr.type:effectType(id),bank=userPresets(localStorage,type,def);
  const personal=document.createElement('section');personal.className='suite-ab-controls';personal.setAttribute('aria-label','Bibliothèque personnelle de plugins');
  personal.innerHTML='<label>MES PRESETS · CET APPAREIL<select id="userPluginPreset" aria-label="Preset personnel appareil"><option value="">Choisir…</option></select></label><label>NOM<input id="userPluginName" maxlength="60" placeholder="Nom du preset"></label><button type="button" class="outline-btn" id="userPluginSave">Enregistrer</button><button type="button" class="outline-btn" id="userPluginDelete">Supprimer</button><button type="button" class="outline-btn" id="userPluginExport">Exporter</button><label>Importer .wlpreset<input id="userPluginImport" type="file" accept=".wlpreset,.json"></label><small>Bibliothèque locale à ce navigateur, disponible dans tous les projets locaux. Aucun fichier audio inclus.</small>';
  panel.append(personal);const pick=local('userPluginPreset');bank.forEach((p,i)=>pick.add(new Option(p.name,String(i))));
  const busy=()=>recording||recordFinalizing||micPending,guard=fn=>{try{if(!pluginWindows.entries.some(e=>e.instance===instance)||project.tracks.find(t=>t.id===trackId)!==tr)return;if(busy())return toast('Termine la prise avant cette action.');fn();}catch(error){toast(error.message);}};
  local('userPluginSave').onclick=()=>guard(()=>{const name=local('userPluginName').value.trim();if(bank.some(p=>p.name===name)&&!confirm('Remplacer le preset '+name+' ?'))return;storePreset(localStorage,capturePreset(type,def,state,name),type,def);renderFloatingPlugin();document.dispatchEvent(new Event('warlike-sidebar-refresh'));toast('Preset enregistré sur cet appareil.');});
  pick.onchange=()=>guard(()=>{if(pick.value==='')return;const preset=bank[Number(pick.value)];checkpoint();applyUserPreset(state,preset,type,def);changed(true);toast('Preset '+preset.name+' chargé.');});
  local('userPluginDelete').onclick=()=>guard(()=>{const preset=bank.find(p=>p.name===local('userPluginName').value.trim())||(pick.value!==''?bank[Number(pick.value)]:null);if(!preset)return toast('Choisis ou saisis le nom du preset.');if(!confirm('Supprimer '+preset.name+' ?'))return;removePreset(localStorage,type,preset.name);renderFloatingPlugin();toast('Preset supprimé.');});
  local('userPluginExport').onclick=()=>guard(()=>{const preset=pick.value!==''?bank[Number(pick.value)]:capturePreset(type,def,state,local('userPluginName').value.trim()||def.name);download(JSON.stringify(preset,null,2),preset.name.replace(/[^a-z0-9_-]/gi,'_')+'.wlpreset','application/json');});
  local('userPluginImport').onchange=async e=>{const file=e.target.files[0];if(!file)return;try{if(file.size>65536)throw Error('Fichier preset trop volumineux.');const preset=JSON.parse(await file.text());guard(()=>{if(bank.some(p=>p.name===preset.name)&&!confirm('Remplacer le preset '+preset.name+' ?'))return;storePreset(localStorage,preset,type,def);renderFloatingPlugin();document.dispatchEvent(new Event('warlike-sidebar-refresh'));toast('Preset importé.');});}catch(error){toast(error.message);}};
  panel.insertAdjacentHTML('beforeend','<div class="suite-rack-actions"><span>RACK DE LA PISTE</span><button id="importRack" class="text-btn">Charger un rack</button><button id="exportRack" class="outline-btn">Exporter le rack</button></div>');
  local('suiteTrack').onchange=e=>{const destination=e.target.value;e.target.value=trackId;openPluginWindow(id,destination);};
  local('suitePreset').onchange=e=>{const index=Number(e.target.value);if(index<0)return;checkpoint();const name=applyFactoryPreset(tr,id,index);changed(true);toast('Preset '+name+' appliqué à '+tr.name+'.');};
  local('exportRack').onclick=()=>{download(JSON.stringify(exportRack(tr),null,2),tr.name.replace(/[^a-z0-9_-]/gi,'_')+'.chayahfx','application/json');toast('Rack CHAYAH Suite téléchargé.');};
  local('importRack').onclick=()=>{bundleOwner=instance;$('bundleInput').click();};
  mountEqCurve({root:panel,id:effectType(id),state,definition:def,checkpoint,change:(key,value)=>{syncParameterWidgets(id+'.'+key,def.controls.find(c=>c.key===key),value,'data-param',tr.id);changed();}});
  if(effectType(id)==='circuitcolor')mountCircuitColor(panel,{state:()=>project.tracks.find(t=>t.id===trackId)?.effects[id]});
  if(effectType(id)==='alterfilter')mountAlterFilter(panel,{state:()=>project.tracks.find(t=>t.id===trackId)?.effects[id],getBpm:()=>project.bpm});
  if(effectType(id)==='alterecho')mountAlterEcho(panel,{state:()=>project.tracks.find(t=>t.id===trackId)?.effects[id],getBpm:()=>project.bpm,getStage:()=>engine.channels.get(trackId)?.stages?.[id]});
  if(effectType(id)==='alterdouble')mountAlterDouble(panel,{state:()=>project.tracks.find(t=>t.id===trackId)?.effects[id]});
  if(effectType(id)==='exostrip')mountExoStrip(panel,{state:()=>project.tracks.find(t=>t.id===trackId)?.effects[id],getStage:()=>engine.channels.get(trackId)?.stages?.[id]});
  if(effectType(id)==='exoair')mountExoAir(panel,{state:()=>project.tracks.find(t=>t.id===trackId)?.effects[id]});
  if(effectType(id)==='exofocus')mountExoFocus(panel,{state:()=>project.tracks.find(t=>t.id===trackId)?.effects[id],getStage:()=>engine.channels.get(trackId)?.stages?.[id]});
  if(effectType(id)==='exospace')mountExoSpace(panel,{state:()=>project.tracks.find(t=>t.id===trackId)?.effects[id]});
  if(effectType(id)==='voxdoubler')mountVoxDoubler(panel,{state:()=>project.tracks.find(t=>t.id===trackId)?.effects[id]});
  if(effectType(id)==='voxwarm')mountVoxWarm(panel,{state:()=>project.tracks.find(t=>t.id===trackId)?.effects[id]});
  if(effectType(id)==='voxmicmodel')mountVoxMic(panel,{state:()=>project.tracks.find(t=>t.id===trackId)?.effects[id]});
  if(effectType(id)==='voxambience')mountVoxAmbience(panel,{state:()=>project.tracks.find(t=>t.id===trackId)?.effects[id]});
  if(effectType(id)==='voxaireq')mountVoxAir(panel,{state:()=>project.tracks.find(t=>t.id===trackId)?.effects[id]});
  if(effectType(id)==='voxtune')mountVoxTune(panel,{checkpoint,state:()=>project.tracks.find(t=>t.id===trackId)?.effects[id],getStage:()=>engine.channels.get(trackId)?.stages?.[id]});
  if(effectType(id)==='voxclean')mountVoxClean(panel,{state:()=>project.tracks.find(t=>t.id===trackId)?.effects[id],getStage:()=>engine.channels.get(trackId)?.stages?.[id]});
  if(effectType(id)==='voxlevel')mountVoxLevel(panel,{state:()=>project.tracks.find(t=>t.id===trackId)?.effects[id],getStage:()=>engine.channels.get(trackId)?.stages?.[id]});
  if(effectType(id)==='circuitbus')mountCircuitBus(panel,{state:()=>project.tracks.find(t=>t.id===trackId)?.effects[id],getReduction:()=>engine.channels.get(trackId)?.stages?.[id]?.comp?.reduction??0});
  if(effectType(id)==='vectorcomp')mountVectorComp(panel,{state:()=>project.tracks.find(t=>t.id===trackId)?.effects[id],getReduction:()=>{const t=project.tracks.find(t=>t.id===trackId);return !t?.effects[id]?.enabled?0:engine.channels.get(trackId)?.stages?.[id]?.comp?.reduction??0;}});
  if(effectType(id)==='vectorlimit')mountVectorLimit(panel,{state:()=>project.tracks.find(t=>t.id===trackId)?.effects[id],getStage:()=>engine.channels.get(trackId)?.stages?.[id]});
  if(id==='instrument'&&ACOUSTIC_INSTRUMENTS[tr.type])mountAcousticBrowser({panel,track:tr,engine,toast});
  if(id==='instrument'&&tr.type==='sampler')mountSampler({panel,track:tr,engine,assets,checkpoint,changed,save,toast,esc,insertPattern:(track,s)=>{checkpoint();const start=Math.floor(engine.getPosition()/16),count=s.mode==='chromatic'?1:s.markers.length-1,steps=Math.max(16,Math.ceil(count/4)*16);track.clips.push({id:uid(),name:'EXO Slice / '+(assets.get(s.assetId)?.name||'Sample'),start,length:steps/16,patternSteps:steps,notes:Array.from({length:count},(_,i)=>({id:uid(),step:i*4,midi:s.root+i,len:3,velocity:.8}))});project.bars=fitSession(project.bars,start+steps/16);selectedClip=track.clips.at(-1).id;changed(true);toast('Pattern créé : modifie les notes dans le piano roll.');}});
  if(id==='instrument')mountExpansionHardware(panel,{id:tr.type,state:()=>project.tracks.find(t=>t.id===trackId)?.instrument});
  if(id==='instrument'&&tr.type==='exo')mountExoBrowser({panel,track:tr,engine,checkpoint,changed,toast,paramHTML,esc});
  if(id==='instrument')mountInstrumentFace(panel,{id:tr.type,definition:def,state:()=>project.tracks.find(t=>t.id===trackId)?.instrument,formatValue:formatParam});
  else mountEffectFace(panel,{id:effectType(id),definition:def,state:()=>project.tracks.find(t=>t.id===trackId)?.effects[id],formatValue:formatParam});
  observePluginEdit(instance,tr,def);
  mountPluginCommandBar({root,body:win.body,panel,trackName:tr.name,slot:id==='instrument'?'Instrument':'Insert '+String.fromCharCode(65+tr.inserts.indexOf(id)),
    canUndo:pluginEdits.canUndo(instance.key),canRedo:pluginEdits.canRedo(instance.key),undo:()=>undoPluginEdit(instance),redo:()=>undoPluginEdit(instance,true),
    canEdit:()=>{if(recording||recordFinalizing||micPending){toast('Termine la prise avant cette action.');return false;}return true;}});
  scopePluginWindowIds(root,win.uid,pluginWindows.active===instance);
  if(id==='prism'){panel.querySelector('.plugin-window-params').insertAdjacentHTML('beforebegin','<canvas id="prismResponse" class="prism-response" aria-label="Réponse en fréquence de PRISM"></canvas>');requestAnimationFrame(()=>drawPrismResponse(tr,panel));}
}
const KEY_NAMES=['Do','Do♯','Ré','Ré♯','Mi','Fa','Fa♯','Sol','Sol♯','La','La♯','Si'];
function renderTune(){
  const tr=currentTrack(),clip=currentClip(),audio=tr.type==='audio'&&clip?.audioId,source=audio?assets.get(clip.originalAudioId||clip.audioId):null,report=clip?.tuneReport;
  $('tuneContent').innerHTML=`<div class="tune-identity"><div class="plugin-brand">CHAYAH / VOCAL LAB</div><h3>TUNE<span>01</span></h3><div class="plugin-subtitle">VOCAL PITCH CORRECTION</div><p>Ta voix, sur ta fréquence.</p><small>VOIX SOLO · APRÈS LA PRISE</small><button class="tune-test-link" data-test-tune>Créer un signal de test ↗</button></div><div class="tune-analysis"><div class="tune-source"><span>${audio?'SOURCE':'PRÊT À ANALYSER'}</span><strong>${esc(source?.name||'Choisis une prise voix')}</strong>${report?'<em>TRAITÉ</em>':''}</div>${audio?`<canvas id="tuneGraph" aria-label="Courbe de hauteur détectée et corrigée"></canvas><div class="tune-legend"><span><b class="original-line"></b> Original</span><span><b class="corrected-line"></b> Correction visée</span><span>${report?`${Math.round(report.before)} ¢ d’écart moyen source`:'Analyse de hauteur à lancer'}</span></div><div class="tune-ab"><button class="outline-btn" data-tune-listen="original">${icon('play')} Original</button><button class="outline-btn" data-tune-listen="corrected" ${!report?'disabled':''}>${icon('play')} Corrigé</button>${report?'<button class="tune-test-link" data-reset-tune>Restaurer</button>':''}</div>`:`<div class="tune-empty">${icon('mic')}<span>${tr.type!=='audio'?'Sélectionne une piste voix pour commencer.':'Importe une voix isolée ou enregistre une prise.'}</span><div><button class="outline-btn" ${tr.type==='audio'?'data-import':'data-choose-voice'}>${icon(tr.type==='audio'?'upload':'mic')}${tr.type==='audio'?'Importer une voix':'Choisir une piste voix'}</button></div></div>`}</div><div class="tune-controls"><div class="tune-key-controls"><label>Tonalité<select data-tune-option="key" aria-label="Tonalité de TUNE">${KEY_NAMES.map((k,i)=>`<option value="${i}" ${i===tr.tune.key?'selected':''}>${k}</option>`).join('')}</select></label><label>Gamme<select data-tune-option="scale" aria-label="Gamme de TUNE">${Object.entries({minor:'Mineure',major:'Majeure',chromatic:'Chromatique'}).map(([id,name])=>`<option value="${id}" ${id===tr.tune.scale?'selected':''}>${name}</option>`).join('')}</select></label></div><div class="tune-presets"><button data-tune-preset="natural">Naturel</button><button data-tune-preset="rap">Rap</button><button data-tune-preset="hard">Hard</button></div><div class="tune-parameter-row">${TUNE_CONTROLS.map(c=>paramHTML(c,tr.tune[c.key],'tune').replace('data-param="tune.','data-tune-param="')).join('')}<button class="primary-btn tune-apply" data-apply-tune ${!audio||tuneBusy?'disabled':''}>${icon(tuneBusy?'wave':'check')}<span>${tuneBusy?'Traitement…':'Appliquer'}</span></button></div><p class="tune-caption">L’original est conservé. Réapplique après chaque réglage.</p></div>`;
  if($('tuneGraph'))requestAnimationFrame(()=>drawTuneGraph(report));
}
function drawTuneGraph(report){const canvas=$('tuneGraph');if(!canvas)return;const w=canvas.clientWidth,h=canvas.clientHeight,ratio=devicePixelRatio||1;canvas.width=w*ratio;canvas.height=h*ratio;const ctx=canvas.getContext('2d');ctx.scale(ratio,ratio);
  const rows=report?.frames||[],valid=rows.filter(r=>r.input),min=valid.length?Math.floor(Math.min(...valid.map(r=>Math.min(r.input,r.output))))-1:56,max=valid.length?Math.ceil(Math.max(...valid.map(r=>Math.max(r.input,r.output))))+1:64;
  ctx.font='7px monospace';ctx.lineWidth=1;
  for(let n=min;n<=max;n++){const y=h-7-(n-min)/(max-min)*(h-14);ctx.strokeStyle='#6d5a8533';ctx.beginPath();ctx.moveTo(24,y);ctx.lineTo(w,y);ctx.stroke();ctx.fillStyle='#8f819e';ctx.fillText(noteName(n),0,y+2);}
  if(!rows.length){ctx.fillStyle='#b4a0c4';ctx.font='9px sans-serif';ctx.fillText('Applique TUNE pour afficher la courbe.',35,h/2+3);return;}
  for(const [field,color] of [['input','#a796b6'],['output','#e3ba8c']]){ctx.strokeStyle=color;ctx.lineWidth=field==='input'?1:1.5;ctx.beginPath();let begun=false;for(const r of rows){if(!r.input){begun=false;continue;}const x=25+r.time/report.duration*(w-30),y=h-7-(r[field]-min)/(max-min)*(h-14);if(!begun){ctx.moveTo(x,y);begun=true;}else ctx.lineTo(x,y);}ctx.stroke();}
}
async function createTuneTest(){
  if(recording||tuneBusy){toast('Termine le traitement ou la prise en cours.');return;}
  await engine.init();engine.pause();let tr=currentTrack();if(tr.type!=='audio')tr=project.tracks.find(t=>t.type==='audio')||addTrack('audio');
  const sr=44100,b=engine.ctx.createBuffer(1,sr*4,sr),d=b.getChannelData(0),pitches=[215,258,321,430];let phase=0;
  for(let i=0;i<d.length;i++){const sec=i/sr,part=Math.min(3,Math.floor(sec)),local=sec-part,f=pitches[part]*(1+.002*Math.sin(sec*2*Math.PI*5));phase+=2*Math.PI*f/sr;const env=Math.min(1,local/.04,Math.max(0,(.92-local)/.07));d[i]=env*(.26*Math.sin(phase)+.08*Math.sin(phase*2)+.04*Math.sin(phase*3));}
  checkpoint();const id=uid();assets.set(id,{name:'Signal vocal synthétique · désaccordé',data:bufferToWav(b),buffer:b});const c={id:uid(),name:'TUNE / SIGNAL TEST',start:0,length:4/(engine.stepDuration*16),audioId:id};tr.clips.push(c);selectedTrack=tr.id;selectedClip=c.id;detail='tune';changed(true);toast('Signal de test créé. Choisis un preset, puis Appliquer.');
}
async function applyTune(){
  const tr=currentTrack(),clip=currentClip(),asset=assets.get(clip?.originalAudioId||clip?.audioId);if(!asset||tuneBusy)return;if(recording){toast('Termine la prise avant d’appliquer TUNE.');return;}
  if(asset.buffer.duration>180){toast('Pour cette version, TUNE traite des prises de 3 minutes maximum.');return;}
  tuneBusy=true;engine.pause();updateTransport();renderTune();const options=clone(tr.tune);let worker;
  try{worker=new Worker(new URL('./tune-worker.js?v=0.14.0',import.meta.url),{type:'module'});const channels=Array.from({length:asset.buffer.numberOfChannels},(_,i)=>asset.buffer.getChannelData(i).slice());
    const result=await new Promise((resolve,reject)=>{worker.onmessage=e=>{if(e.data.error)reject(new Error(e.data.error));else if(e.data.result)resolve(e.data.result);else{const span=$('tuneContent').querySelector('.tune-apply span');if(span)span.textContent=e.data.progress+' %';}};worker.onerror=e=>reject(new Error(e.message||'Le moteur TUNE n’a pas démarré.'));worker.postMessage({channels,sampleRate:asset.buffer.sampleRate,options},channels.map(c=>c.buffer));});
    if(!result.report.voicedFrames){toast('Aucune hauteur stable détectée. Essaie une voix seule, sans instrumental.');return;}
    if(!project.tracks.some(t=>t.id===tr.id&&t.clips.some(c=>c.id===clip.id))){toast('Le clip a changé pendant le traitement. Sélectionne-le et réessaie.');return;}
    const buffer=engine.ctx.createBuffer(result.channels.length,result.channels[0].length,asset.buffer.sampleRate);result.channels.forEach((data,i)=>buffer.copyToChannel(data,i));
    checkpoint();const id=uid();assets.set(id,{name:asset.name+' · TUNE',data:bufferToWav(buffer,{bits:32}),buffer});clip.originalAudioId=clip.originalAudioId||clip.audioId;clip.audioId=id;clip.tuneReport=result.report;clip.tuneApplied=options;changed(true);toast('TUNE appliqué. Compare Original / Corrigé, puis lance le mix.');
  }catch(e){toast('TUNE n’a pas pu traiter cette prise : '+e.message);}finally{worker?.terminate();tuneBusy=false;if(detail==='tune')renderTune();}
}
$('libraryEffects').insertAdjacentHTML('afterbegin','<button class="fx-library-item tune-library" data-open-tune><span></span>Tune<small>Pitch correction</small></button>');
$('libraryInstruments').innerHTML=Object.entries(INSTRUMENTS).map(([type,d])=>`<button class="library-item" data-instrument="${type}"><span class="preset-icon" style="color:${d.color};border-color:${d.color}55;background:${d.color}11">${icon(type==='drums'?'drums':type==='keys'?'piano':'wave')}</span><span><strong>${d.name}${type==='bass'?' 808':''}</strong><small>${d.subtitle.toLowerCase()}</small></span>${icon('chevron-right')}</button>`).join('');
document.querySelector('.samples').innerHTML='<div class="section-label">KIT PULSE <span>08</span></div>'+Object.entries(DRUM_VOICES).map(([voice,name])=>`<div class="sample-row"><button data-preview="${voice}">${icon('play')}${name}</button><button data-drum-download="${voice}" aria-label="Télécharger ${name}" title="Télécharger en WAV">${icon('download')}</button></div>`).join('');
function sidebarPresetEntries(kind,id){return [...(FACTORY_PRESETS[id]||[]).map((p,index)=>({...p,index,source:'factory'})),...userPresets(localStorage,id,kind==='instrument'?INSTRUMENTS[id]:EFFECTS[id]).map(p=>({...p,source:'user'})),...(kind==='effect'?personalEffectPresets(project,id).map((p,index)=>({...p,index,source:'project'})):[])];}
sidebarBrowser=mountSidebarBrowser({instruments:INSTRUMENTS,effects:EFFECTS,readPresets:sidebarPresetEntries,revision:()=>{try{return localStorage.getItem('warlike.plugin.user-presets.v1')+'|'+JSON.stringify(project.pluginPresets||{});}catch{return '';}} ,
 onPreset:(kind,id,preset)=>{
  if(recording||recordFinalizing||micPending)return toast('Termine la prise avant de charger un preset.');
  try{
   const fresh=sidebarPresetEntries(kind,id).find(p=>p.source===preset.source&&p.name===preset.name&&(p.source==='user'||p.index===preset.index));if(!fresh)throw Error('La bibliothèque a changé. Relance la recherche.');preset=fresh;
   const original=kind==='instrument'?(currentTrack()?.type===id?currentTrack():project.tracks.find(t=>t.type===id)):currentTrack();
   if(!original&&project.tracks.length>=64)throw Error('La session est limitée à 64 pistes.');
   const candidate=original?clone(original):{type:id,inserts:[]};ensurePlugins(candidate);const plugin=kind==='instrument'?'instrument':id;
   if(kind==='effect'&&!candidate.inserts.includes(id)&&!candidate.inserts.includes(null))throw Error('Tous les inserts sont occupés. Retire un effet avant de charger ce preset.');
   if(preset.source==='project'){if(!candidate.inserts.includes(id))placeInsert(candidate,candidate.inserts.indexOf(null),id);if(!applyPersonalEffectPreset(project,candidate,id,preset.index))throw Error('Preset du projet invalide.');}
   else{if(kind==='effect'&&!candidate.inserts.includes(id))placeInsert(candidate,candidate.inserts.indexOf(null),id);applyPickerPreset(candidate,plugin,preset);}
   checkpoint();const target=original||addTrack(id,false);if(kind==='instrument')target.instrument=candidate.instrument;else{target.effects=candidate.effects;target.inserts=candidate.inserts;}
   selectedTrack=target.id;selectedClip=null;changed(true);openPluginWindow(plugin,target.id);toast(preset.name+' appliqué à '+target.name+'.');
  }catch(error){toast(error.message);}
 }
});
$('bankSearch').oninput=event=>{engine.stopPreview();bankState.search=event.target.value;renderContentCards();};$('bankFilter').onchange=event=>{engine.stopPreview();bankState.filter=event.target.value;renderContentCards();};
document.querySelectorAll('[data-bank-tab]').forEach(button=>button.onclick=()=>setBankTab(button.dataset.bankTab));
$('gameSoundBank').onclick=()=>{$('projectMenu').hidden=true;setBankTab('game');};$('instruBank').onclick=()=>{$('projectMenu').hidden=true;setBankTab('instru');};$('factorySessions').onclick=()=>{$('projectMenu').hidden=true;setBankTab('sessions');};$('openSessions').onclick=()=>setBankTab('sessions');
$('previousSession').onclick=()=>{$('projectMenu').hidden=true;restorePreviousSession();};
$('openMastering').onclick=()=>setView('mastering');
$('masterRackInput').onchange=async event=>{const file=event.target.files[0];event.target.value='';if(!file)return;try{const data=JSON.parse(await file.text()),copy={};importMasterRack(copy,data);checkpoint();project.mastering=copy.mastering;changed();renderMastering();toast('Rack appliqué au master.');}catch(error){toast(error.message);}};
$('toggleInspector').onclick=()=>showTrackProperties($('trackInspector').hidden);
$('zoomFit').onclick=()=>{if(view!=='arrange')setView('arrange');fitTimeline();};

installKnobControls({onStart:checkpoint});
function applyOverlapCrossfade(){
 if(recording||recordFinalizing)return;
 const track=currentTrack(),clip=currentClip();
 if(!clip?.audioId||!track){toast('Sélectionne un clip audio.');return;}
 const pairs=track.clips.filter(c=>c!==clip&&c.audioId).map(c=>{
 const [a,b]=[clip,c].sort((x,y)=>x.start-y.start);
 const overlap=a.start+a.length-b.start;
 return {a,b,overlap};
 }).filter(({a,b,overlap})=>a.start<b.start&&a.start+a.length<b.start+b.length&&overlap>0);
 if(pairs.length!==1){toast('Sélectionne un clip avec un seul chevauchement audio partiel.');return;}
 const {a,b,overlap}=pairs[0],duration=overlap*240/project.bpm;
 if(duration>60||duration+(a.fadeIn||0)>a.length*240/project.bpm||duration+(b.fadeOut||0)>b.length*240/project.bpm){toast('Transition incompatible avec les fondus existants.');return;}
 const owner=project;
 modal('Crossfade',`<p>Chevauchement : ${duration.toFixed(3)} s. Les deux clips restent en place.</p><label>Courbe <select id="crossfadeCurve"><option value="equalPower">Equal Power</option><option value="linear">Linear</option></select></label><div class="modal-actions"><button id="applyCrossfade" class="primary-btn">Appliquer</button></div>`);
 $('applyCrossfade').onclick=()=>{if(project!==owner||recording||recordFinalizing||!track.clips.includes(a)||!track.clips.includes(b))return;const curve=$('crossfadeCurve').value;checkpoint();a.fadeOut=duration;b.fadeIn=duration;a.fadeCurve=b.fadeCurve=curve;changed(true);toast('Crossfade appliqué · Ctrl+Z pour annuler.');};
}
$('ptCrossfade').onclick=applyOverlapCrossfade;
document.querySelectorAll('[data-edit-tool]').forEach(button=>button.onclick=()=>setEditingTool(button.dataset.editTool));
$('zoomIn').onclick=()=>{timelineZoom=Math.min(128,Math.round(timelineZoom*1.5*100)/100);render();};
$('zoomOut').onclick=()=>{timelineZoom=Math.max(.5,Math.round(timelineZoom/1.5*100)/100);render();};
$('bundleInput').onchange=async event=>{const file=event.target.files[0],instance=bundleOwner,tr=project.tracks.find(t=>t.id===instance?.trackId);event.target.value='';bundleOwner=null;if(!file||!tr)return;try{const data=JSON.parse(await file.text());if(!pluginWindows.entries.some(e=>e.instance===instance)||project.tracks.find(t=>t.id===tr.id)!==tr)return;const copy=clone(tr);importRack(copy,data);checkpoint();Object.assign(tr,{instrument:copy.instrument,effects:copy.effects,inserts:copy.inserts,tune:copy.tune});changed();renderPlugins();renderFloatingPlugin();toast('Rack chargé sur '+tr.name+'.');}catch(error){toast(error.message);}};
$('modal').addEventListener('close',stopMicPreview);
function setDetailOpen(open){document.body.classList.toggle('detail-collapsed',!open);$('toggleDetail').setAttribute('aria-expanded',String(open));$('toggleDetail').setAttribute('aria-label',open?'Replier l’éditeur inférieur':'Déplier l’éditeur inférieur');$('toggleDetail').textContent=open?'⌄':'⌃';requestAnimationFrame(drawClips);}
function ptSmartZone(r,x,y){const edge=x-r.left<9||r.right-x<9;if(edge)return y-r.top<Math.min(18,r.height/3)?'fade':'trim';return y-r.top<r.height/2?'selector':'grabber';}
$('trackRows').addEventListener('pointermove',e=>{if(dragState||rangeDrag||editingTool!=='select'||document.body.dataset.layoutProfile!=='pt')return;const node=e.target.closest('[data-clip]');if(!node)return;const t=project.tracks.find(t=>t.id===node.closest('[data-track]')?.dataset.track);const c=t?.clips.find(c=>c.id===node.dataset.clip);if(c?.audioId)node.dataset.smartZone=ptSmartZone(node.getBoundingClientRect(),e.clientX,e.clientY);});
function rangePosition(e,r,c){return Math.max(c.start,Math.min(c.start+c.length,snapBar((e.clientX-r.left)/Math.max(1,r.width)*project.bars,e.altKey?'slip':editMode,editGrid)));}
function updateEditSelection(){const c=currentClip();
 const range=(editingTool==='selector'||(editingTool==='select'&&document.body.dataset.layoutProfile==='pt'))&&timeRange?.project===project&&timeRange.clipId===c?.id?timeRange:null;
 document.querySelectorAll('[data-time-range]').forEach(n=>n.removeAttribute('data-time-range'));
 if(range&&c.length>0){const node=[...document.querySelectorAll('[data-clip]')].find(n=>n.dataset.clip===c.id);if(node){node.dataset.timeRange='';node.style.setProperty('--range-left',100*(range.start-c.start)/c.length+'%');node.style.setProperty('--range-width',100*(range.end-range.start)/c.length+'%');}}
$('editClipName').textContent=c?.name||'Aucun clip sélectionné';$('editStart').textContent=c?musicalPosition(range?.start??c.start):'—';$('editEnd').textContent=c?musicalPosition(range?.end??(c.start+c.length)):'—';$('editDuration').textContent=c?(range?range.end-range.start:c.length).toFixed(3)+' mes.':'—';$('splitAtCursor').disabled=!c;}
function renderSessionSidebar(){
  $('sessionTrackList').innerHTML=project.tracks.map((tr,i)=>`<button data-select-track="${tr.id}" data-track-name="${esc(tr.name)}" title="Glisser pour réordonner · Clic pour les propriétés" class="${tr.id===selectedTrack?'selected':''}" style="--track-color:${tr.color}" aria-pressed="${tr.id===selectedTrack}"><small>${String(i+1).padStart(2,'0')}</small><i></i><span>${esc(tr.name)}</span><b>${tr.mute?'M':tr.solo?'S':tr.type==='audio'?'A':tr.type==='bus'?'BUS':'MIDI'}</b></button>`).join('');
  const clips=project.tracks.flatMap(t=>t.clips.map(c=>({t,c})));$('sessionClipCount').textContent=clips.length;$('sessionClipList').innerHTML=clips.map(({t,c})=>`<button data-sidebar-clip="${c.id}" data-sidebar-track="${t.id}" class="${c.id===selectedClip||multiClips.has(c.id)?'selected':''}" style="--track-color:${t.color}" title="${esc(t.name+' / '+c.name)}"><i></i><span>${esc(c.name)}</span></button>`).join('')||'<p>Aucun clip</p>';$('sessionSummary').textContent=project.bars+' mesures · '+project.tracks.length+' pistes';
}
function performSplit(position){const tr=currentTrack(),c=currentClip();if(!c||recording)return;const parts=splitClipData(c,position,project.bpm,uid());if(!parts){toast('Place le curseur à l’intérieur du clip à couper.');return;}checkpoint();tr.clips.splice(tr.clips.indexOf(c),1,...parts);selectedClip=parts[1].id;changed(true);toast('Clip coupé · Ctrl+Z pour annuler.');}
function openSpotDialog(tr,clip){
 if(recording||recordFinalizing||micPending)return;
 const session=project,bpm=project.bpm,rate=engine.ctx?.sampleRate||48000,secondsPerBar=240/bpm;
 if(clip.groupId||(clip.audioId&&selectedAudioClips().length>1)){toast('Spot : sélectionne un clip non groupé.');return;}
 modal('Spot · '+clip.name,`<form id="spotForm" class="settings-form"><label>Unité<select id="spotUnit"><option value="bars">Mesures (origine 1)</option><option value="seconds">Secondes</option><option value="samples">Échantillons (${rate} Hz)</option></select></label><label>Référence<select id="spotAnchor"><option value="start">Début</option><option value="end">Fin</option></select></label><label>Position<input id="spotValue" type="number" step="any" required></label><p id="spotError" role="alert"></p><div class="modal-actions"><button type="button" id="spotCancel" class="outline-btn">Annuler</button><button type="submit" class="primary-btn">Appliquer</button></div></form>`,'WARLIKE / SPOT');
 const refresh=()=>{const p=clip.start+($('spotAnchor').value==='end'?clip.length:0),u=$('spotUnit').value;$('spotValue').value=u==='bars'?p+1:u==='seconds'?p*secondsPerBar:Math.round(p*secondsPerBar*rate);$('spotError').textContent='';};
 $('spotUnit').onchange=refresh;$('spotAnchor').onchange=refresh;$('spotCancel').onclick=()=>$('modal').close();refresh();
 $('spotForm').onsubmit=e=>{e.preventDefault();const v=$('spotValue').valueAsNumber,u=$('spotUnit').value,position=u==='bars'?v-1:u==='seconds'?v/secondsPerBar:v/rate/secondsPerBar,start=position-($('spotAnchor').value==='end'?clip.length:0);
 if(project!==session||project.bpm!==bpm||!tr.clips.includes(clip)||!project.tracks.includes(tr)||recording||recordFinalizing||micPending||clip.groupId){$('spotError').textContent='La session ou la sélection a changé.';return;}
 if(!Number.isFinite(start)||start< -1e-9||start+clip.length>project.bars+1e-9||(u==='samples'&&!Number.isInteger(v))){$('spotError').textContent='Position hors session ou nombre d’échantillons invalide.';return;}
 if(Math.abs(start-clip.start)>1e-9){checkpoint();clip.start=Math.max(0,start);changed(true);}$('modal').close();};
}
function nudgeClip(direction){const c=currentClip();if(!c||recording)return;const amount=editMode==='slip'?1/(engine.stepDuration*16*100):editGrid;checkpoint();const items=c.audioId?selectedAudioClips().map(a=>a.clip):[c],min=Math.min(...items.map(c=>c.start)),max=Math.max(...items.map(c=>c.start+c.length)),{shift,bars}=arrangementShift(items,direction*amount,project.bars);for(const item of items)item.start+=shift;project.bars=bars;changed(true);}
function pasteClip(){if(!clipClipboard||recording)return;if(clipClipboard.group){const at=snapBar(engine.getPosition()/16,editMode,editGrid),shift=at-clipClipboard.origin;if(clipClipboard.group.some(a=>a.clip.start+shift+a.clip.length>MAX_BARS))return;checkpoint();multiClips.clear();const groups=new Map();for(const item of clipClipboard.group){const t=project.tracks.find(t=>t.id===item.trackId)||currentTrack();if(t.type!=='audio')continue;const c={...clone(item.clip),id:uid(),start:item.clip.start+shift};if(c.groupId){if(!groups.has(c.groupId))groups.set(c.groupId,uid());c.groupId=groups.get(c.groupId);}t.clips.push(c);multiClips.add(c.id);project.bars=fitSession(project.bars,c.start+c.length);selectedTrack=t.id;selectedClip=c.id;}changed(true);return;}const tr=currentTrack();if(tr.type!==clipClipboard.type){toast('Choisis une piste du même type pour coller ce clip.');return;}const c=clone(clipClipboard.clip);c.id=uid();c.start=snapBar(engine.getPosition()/16,editMode,editGrid);if(c.start+c.length>MAX_BARS){toast('Le clip dépasse la session maximale.');return;}checkpoint();project.bars=fitSession(project.bars,c.start+c.length);tr.clips.push(c);selectedClip=c.id;changed(true);toast('Clip collé au curseur.');}
$('showTrackList').onclick=()=>{document.querySelector('.library').classList.remove('sounds-open');};
$('showSoundList').onclick=()=>{document.querySelector('.library').classList.add('sounds-open');sidebarBrowser.refresh();};
$('toggleDetail').onclick=()=>setDetailOpen(document.body.classList.contains('detail-collapsed'));
$('splitAtCursor').onclick=()=>performSplit(engine.getPosition()/16);
$('nudgeLeft').onclick=()=>nudgeClip(-1);$('nudgeRight').onclick=()=>nudgeClip(1);
$('editGrid').onchange=e=>editGrid=Number(e.target.value);
for(const b of document.querySelectorAll('[data-edit-mode]'))b.onclick=()=>{editMode=b.dataset.editMode;document.querySelectorAll('[data-edit-mode]').forEach(el=>{const active=el.dataset.editMode===editMode;el.classList.toggle('active',active);el.setAttribute('aria-pressed',String(active));});};
document.addEventListener('click',e=>{const b=e.target.closest('[data-sidebar-clip]');if(b){selectTrack(b.dataset.sidebarTrack,b.dataset.sidebarClip);setView('arrange');detail='editor';renderDetail();}});
let detailDrag=null;$('detailResize').onpointerdown=e=>{if(e.button!==0)return;setDetailOpen(true);detailDrag={id:e.pointerId,y:e.clientY,height:document.querySelector('.detail-panel').getBoundingClientRect().height};$('detailResize').setPointerCapture(e.pointerId);e.preventDefault();};
$('detailResize').onpointermove=e=>{if(!detailDrag)return;const h=Math.max(180,Math.min(innerHeight*.6,detailDrag.height+detailDrag.y-e.clientY));document.body.style.setProperty('--detail-height',h+'px');};
$('detailResize').onpointerup=()=>{detailDrag=null;drawClips();};$('detailResize').onpointercancel=()=>detailDrag=null;
$('detailResize').onkeydown=e=>{if(e.key==='ArrowUp'||e.key==='ArrowDown'){e.preventDefault();setDetailOpen(true);const h=document.querySelector('.detail-panel').getBoundingClientRect().height;document.body.style.setProperty('--detail-height',Math.max(180,Math.min(innerHeight*.6,h+(e.key==='ArrowUp'?20:-20)))+'px');}};
function showTrackProperties(open){$('trackInspector').hidden=!open;document.body.classList.toggle('track-properties-open',open);$('toggleInspector').setAttribute('aria-pressed',String(open));if(open)renderInspector();requestAnimationFrame(()=>{if(view==='arrange')render();});}
function setTrackVolume(id,raw,withUndo=false){const tr=project.tracks.find(t=>t.id===id),value=raw===''?null:clampTrackVolume(raw);if(!tr)return;if(value===null){syncTrackVolumeWidgets(tr);return;}if(withUndo&&value!==tr.volume)checkpoint();tr.volume=value;syncTrackVolumeWidgets(tr);changed();}
function setTrackPan(id,value){const tr=project.tracks.find(t=>t.id===id);if(!tr)return;tr.pan=Math.max(-1,Math.min(1,value));document.querySelectorAll(`[data-pt-pan="${tr.id}"]`).forEach(knob=>{knob.style.setProperty("--pan-angle",tr.pan*135+"deg");knob.setAttribute("aria-valuenow",Math.round(tr.pan*100));knob.setAttribute("aria-valuetext",panLabel(tr.pan));});document.querySelectorAll(`[data-pan-label="${tr.id}"]`).forEach(node=>node.textContent=panLabel(tr.pan));document.querySelectorAll(`[data-pan="${tr.id}"]`).forEach(input=>input.value=tr.pan);document.querySelectorAll(`[data-pan-number="${tr.id}"]`).forEach(input=>{if(input!==document.activeElement)input.value=Math.round(tr.pan*100);});changed();}
installPanEditing({getTrack:id=>project.tracks.find(t=>t.id===id),checkpoint,apply:setTrackPan});
function syncTrackVolumeWidgets(tr){document.querySelectorAll(`[data-db="${tr.id}"]`).forEach(node=>node.textContent=tr.volume.toFixed(1)+' dB');document.querySelectorAll(`[data-volume="${tr.id}"],[data-volume-number="${tr.id}"]`).forEach(input=>{if(input!==document.activeElement||!input.dataset.volumeNumber)input.value=tr.volume;});}
function reorderTrack(id,beforeId){if(recording||recordFinalizing)return;const next=reorderTrackList(project.tracks,id,beforeId);if(next===project.tracks)return;checkpoint();project.tracks=next;if(selectedTrack!==id){selectedTrack=id;selectedClip=project.tracks.find(t=>t.id===id).clips[0]?.id;}closeTrackQuickControl();changed(true);toast('Piste déplacée · Ctrl+Z pour annuler.');}
function moveTrackByStep(id,direction){reorderTrack(id,stepTrackDestination(project.tracks,id,direction));}
function closeTrackQuickControl(){quickTrackId=null;$('trackQuickControl').hidden=true;}
function openTrackQuickControl(id,parameter,anchor){const tr=project.tracks.find(t=>t.id===id);if(!tr)return;quickTrackId=id;const root=$('trackQuickControl'),pan=parameter==='pan';root.hidden=false;root.setAttribute('aria-label',(pan?'Panoramique':'Volume')+' de '+tr.name);root.innerHTML=`<div class="track-quick-heading"><strong>${esc(tr.name)}</strong><button data-close-quick aria-label="Fermer le fader de piste">×</button></div><label>${pan?'PANORAMIQUE':'VOLUME DE PISTE'}<span ${pan?`data-pan-label="${tr.id}"`:`data-db="${tr.id}"`}>${pan?panLabel(tr.pan):tr.volume.toFixed(1)+' dB'}</span></label><input type="range" min="${pan?-1:-48}" max="${pan?1:12}" step="${pan?.01:.5}" value="${pan?tr.pan:tr.volume}" ${pan?`data-pan="${tr.id}"`:`data-volume="${tr.id}"`} aria-label="${pan?'Panoramique rapide':'Fader rapide'} de ${esc(tr.name)}"><div class="track-quick-footer">${pan?`<input type="number" min="-100" max="100" step="1" value="${Math.round(tr.pan*100)}" data-pan-number="${tr.id}" aria-label="Panoramique de ${esc(tr.name)}, de moins cent gauche à cent droite"><button data-pan-center="${tr.id}">Centre</button>`:`<input type="number" min="-48" max="12" step=".5" value="${tr.volume}" data-volume-number="${tr.id}" aria-label="Saisie du volume de ${esc(tr.name)}"><span>dB</span><button data-track-unity="${tr.id}">0 dB</button>`}<button data-track-properties="${tr.id}">Propriétés</button></div>`;const r=anchor.getBoundingClientRect(),w=290,h=root.offsetHeight;root.style.left=Math.max(8,Math.min(innerWidth-w-8,r.left))+'px';root.style.top=Math.max(8,r.bottom+h+12>innerHeight?r.top-h-6:r.bottom+6)+'px';root.querySelector('input[type=range]').focus({preventScroll:true});}
document.addEventListener('focusin',e=>{if(e.target.dataset.volumeNumber)checkpoint();});
document.addEventListener('focusout',e=>{if(e.target.dataset.volumeNumber){const tr=project.tracks.find(t=>t.id===e.target.dataset.volumeNumber);if(tr)e.target.value=tr.volume;}});
document.addEventListener('keydown',e=>{if(e.target.dataset.volumeNumber&&e.key==='Enter'){e.preventDefault();setTrackVolume(e.target.dataset.volumeNumber,e.target.value);e.target.blur();}});
installTrackReordering({onMove:reorderTrack,canMove:()=>!recording&&!recordFinalizing&&!$('modal').open,onDragEnd:()=>suppressTrackClickUntil=performance.now()+250});
document.addEventListener('dragstart',e=>{if(e.target.closest('[data-select-track],[data-track-drag]'))e.preventDefault();});
document.addEventListener('pointerdown',e=>{if(!e.target.closest('#trackQuickControl,[data-track-level],[data-track-pan]'))closeTrackQuickControl();},true);
document.addEventListener('click',e=>{if(e.target.closest('[data-close-quick]'))closeTrackQuickControl();});
document.addEventListener('dblclick',e=>{const name=e.target.closest('[data-select-track]');if(name){selectTrack(name.dataset.selectTrack);showTrackProperties(true);$('trackInspector').querySelector('[data-track-name-input]')?.focus();}});
function openClipActions(splitPosition=null){
 if(recording||recordFinalizing||micPending)return toast('Termine la prise avant de modifier les clips.');
 const clip=currentClip();if(!clip)return toast('Sélectionne un clip dans la timeline.');
 const canSplit=Number.isFinite(splitPosition)&&splitPosition>clip.start&&splitPosition<clip.start+clip.length;
 modal('Actions du clip · '+clip.name,`<div class="workflow-form"><p>Les actions concernent le clip sélectionné et, pour les audios, sa sélection groupée. Le bouton Annuler restaure une modification.</p><div class="modal-actions"><button class="outline-btn" data-clip-command="copy">Copier</button><button class="outline-btn" data-clip-command="cut">Couper vers le presse-papiers</button><button class="outline-btn" data-clip-command="duplicate">Dupliquer</button><button class="outline-btn" data-clip-command="paste" ${clipClipboard?'':'disabled'}>Coller au curseur</button><button class="outline-btn" data-clip-command="splitHere" ${canSplit?'':'disabled'}>Découper ici</button><button class="outline-btn" data-clip-command="splitCursor">Découper au curseur</button><button class="danger-btn" data-clip-command="delete">Supprimer le clip</button></div></div>`,'WARLIKE / ÉDITION');
 for(const button of $('modal').querySelectorAll('[data-clip-command]'))button.onclick=()=>{if(recording||recordFinalizing||micPending)return toast('Termine la prise avant cette action.');$('modal').close();const command=button.dataset.clipCommand;({copy:copySelectedClip,cut:()=>{copySelectedClip();deleteClip();},duplicate:duplicateClip,paste:pasteClip,splitHere:()=>performSplit(splitPosition),splitCursor:()=>performSplit(engine.getPosition()/16),delete:deleteClip})[command]?.();};
}
const clipActionsButton=document.createElement('button');clipActionsButton.type='button';clipActionsButton.className='outline-btn';clipActionsButton.textContent='Actions du clip';clipActionsButton.onclick=()=>openClipActions();$('duplicateClip').before(clipActionsButton);
// Right-click resolves the actual object under the pointer, never the prior selection.
document.addEventListener('contextmenu',e=>{
 if(e.defaultPrevented||$('modal').open||e.target.closest('input,select,textarea,[contenteditable=true],.studio-context-menu'))return;
 const busy=()=>!!(recording||recordFinalizing||micPending),A=contextAction,G=contextGroup;
 const show=(title,items,anchor)=>openContextMenu(e,title,items,{busy,anchor});
 const insert=e.target.closest('.insert-slot');
 if(insert){
  const node=insert.querySelector('[data-insert-slot]');if(!node)return;
  const owner=node.dataset.insertTrack,index=Number(node.dataset.insertSlot),master=node.dataset.insertMaster==='true';
  const tr=project.tracks.find(t=>t.id===owner),state=master?project.mastering:tr?.effects,slots=master?project.mastering?.inserts:tr?.inserts;
  if(!slots)return;
  const id=slots[index],open=()=>openInsertMenu(owner,index,master);
  const remove=()=>{if(master){getMasterRack().mutate(s=>removeRackItem(s,{index}));return changed(true);}checkpoint();placeInsert(tr,index,null);changed(true);};const active=master&&rackIsSplit(id)?state.splits[id]:state?.[id];
  show('Insert '+String.fromCharCode(65+index),[
   A('insert-choose',id?'Remplacer / gérer…':'Choisir un plugin…',open),
   A('insert-open','Ouvrir le plugin',()=>{if(master){getMasterRack().select(id);return setView('mastering');}if(!project.tracks.some(t=>t.id===owner))return;if(currentTrack()?.id!==owner)selectTrack(owner);openPluginWindow(id,owner);},!id),
   A('insert-bypass',active?.enabled?'Bypasser':'Réactiver',()=>{if(master){getMasterRack().mutate(s=>{const value=rackIsSplit(id)?s.splits[id]:s[id];value.enabled=!value.enabled;});return changed(true);}checkpoint();active.enabled=!active.enabled;changed(true);},!id),
   G('insert-organize','Organisation',[A('insert-move','Déplacer / échanger…',open,!id),A('insert-copy','Copier vers un insert…',open,!id||master)]),
   A('insert-remove','Retirer le plugin',remove,!id)
  ],node);return;
 }
 const clipNode=e.target.closest('[data-clip]');
 if(clipNode){
  e.preventDefault();if(busy())return toast('Termine la prise avant de modifier les clips.');
  const lane=clipNode.closest('[data-lane]');if(!lane)return;const rect=lane.getBoundingClientRect();
  selectClipElement(clipNode);const clip=currentClip(),tr=currentTrack();if(!clip||!tr)return;
  const at=snapBar((e.clientX-rect.left)/rect.width*project.bars,editMode,editGrid),cursor=engine.getPosition()/16;
  const inside=v=>v>clip.start&&v<clip.start+clip.length;
  show(clip.name,[
   G('clip-edit','Édition',[A('clip-copy','Copier',copySelectedClip,false,'Ctrl+C'),A('clip-cut','Couper',()=>{copySelectedClip();deleteClip();},false,'Ctrl+X'),A('clip-paste','Coller au curseur',pasteClip,!clipClipboard),A('clip-duplicate','Dupliquer',duplicateClip,false,'Ctrl+D')]),
   G('clip-split','Découpage',[A('clip-split-here','Découper ici',()=>performSplit(at),!inside(at)),A('clip-split-cursor','Découper au curseur',()=>performSplit(cursor),!inside(cursor),'B')]),
   A('clip-delete','Supprimer le clip',deleteClip,false,'Suppr')
  ],clipNode);return;
 }
 const lane=e.target.closest('[data-lane]');
 if(lane){
  e.preventDefault();if(busy())return;const tr=project.tracks.find(t=>t.id===lane.dataset.lane);if(!tr)return;
  const rect=lane.getBoundingClientRect(),at=Math.max(0,Math.min(project.bars-1/16,snapBar((e.clientX-rect.left)/rect.width*project.bars,editMode,editGrid)));
  show(tr.name+' · Timeline',[
   A('lane-seek','Placer le curseur ici',()=>{engine.seek(at*16);updateTransport();}),
   A('lane-paste','Coller ici',()=>{selectTrack(tr.id,null);engine.seek(at*16);pasteClip();},!clipClipboard||(!clipClipboard.group&&clipClipboard.type!==tr.type)),
   A('lane-import','Importer audio…',()=>{selectTrack(tr.id);$('audioInput').click();}),
   A('lane-fit','Ajuster la timeline',fitTimeline)
  ],lane);return;
 }
 const trackNode=e.target.closest('[data-select-track],[data-track-drag],.track-head,[data-mixer-track]');
 if(trackNode){
  const id=trackNode.dataset.selectTrack||trackNode.dataset.trackDrag||trackNode.dataset.mixerTrack||trackNode.closest('[data-track]')?.dataset.track;
  const tr=project.tracks.find(t=>t.id===id);if(!tr)return;
  show(tr.name,[
   A('track-properties','Propriétés / renommer…',()=>{if(currentTrack()?.id!==id)selectTrack(id);trackSettings(id);}),
   G('track-mix','Mixage',[A('track-mute',tr.mute?'Réactiver la piste':'Mute',()=>{checkpoint();tr.mute=!tr.mute;changed(true);}),A('track-solo',tr.solo?'Désactiver Solo':'Solo',()=>{checkpoint();tr.solo=!tr.solo;changed(true);}),A('track-volume','Volume à 0 dB',()=>setTrackVolume(id,0,true),tr.volume===0),A('track-pan','Panoramique au centre',()=>{checkpoint();setTrackPan(id,0);},tr.pan===0)]),
   A('track-instrument','Ouvrir l’instrument',()=>{if(currentTrack()?.id!==id)selectTrack(id);openPluginWindow('instrument',id);},!instrumentDefinition(tr.type)),
   A('track-delete','Supprimer la piste…',()=>deleteTrackWithConfirmation(id),project.tracks.length<=1)
  ],trackNode);return;
 }
 const ruler=e.target.closest('#ruler');if(ruler){
  const rect=ruler.getBoundingClientRect(),at=Math.max(0,Math.min(project.bars-1/16,snapBar((e.clientX-rect.left)/rect.width*project.bars,editMode,editGrid)));
  show('Timeline',[A('timeline-seek','Placer le curseur ici',()=>{engine.seek(at*16);updateTransport();}),A('timeline-fit','Afficher toute la session',fitTimeline),A('timeline-loop','Définir la zone de boucle…',()=>$('loop').dispatchEvent(new MouseEvent('contextmenu',{bubbles:true,cancelable:true})))],ruler);
 }
});
piano=installPianoRoll({onFloating:()=>setDetailOpen(false),busy:()=>recording||recordFinalizing||micPending,getProject:()=>project,getEngine:()=>engine,currentTrack,currentClip,checkpoint,changed,save,addTrack,toast,modal,drawClips,updateTransport,openPlugin:openPluginWindow,selectRackTrack:id=>{if(currentTrack()?.id!==id)selectTrack(id);},openEditor:(id,clipId)=>{detail='editor';document.body.dataset.studioSurface='piano';signature?.select('compose',false);selectTrack(id,clipId);setDetailOpen(!(document.body.dataset.layoutProfile==='fl'&&innerWidth>760));}});
$('channelRack').onclick=()=>piano.rack();

 function closeWorkspaceWindow(id){const panel=document.querySelector('[data-managed-window="'+id+'"]');if(!panel||panel.hidden)return false;panel.querySelector('[data-float-close]')?.click();return true;}
 function openWorkspace(kind){
   if(recording||recordFinalizing||micPending)return toast('Termine la prise avant de changer de fenêtre.');
   const floating=document.body.dataset.layoutProfile==='fl'&&innerWidth>760;
   if(floating&&['rack','piano','mixer'].includes(kind)&&closeWorkspaceWindow(kind)){$('workspaceHint').textContent=({rack:'Channel Rack',piano:'Piano Roll',mixer:'Mixer'})[kind]+' masqué';return;}
   const actions={
     playlist:()=>{if(floating)for(const id of ['rack','piano','mixer'])closeWorkspaceWindow(id);setView('arrange');setDetailOpen(false);},
     rack:()=>piano.rack(),
     piano:()=>{
       const track=currentTrack();
       const melodic=t=>t&&!['audio','bus','drums'].includes(t.type);
       const target=melodic(track)?track:project.tracks.find(melodic);
       if(!target){toast('Ajoute un instrument pour ouvrir le Piano Roll.');return;}
       const clip=target.id===track?.id?currentClip():target.clips.find(c=>!c.audioId);
       setView('arrange');
       if(clip&&!clip.audioId)piano.openClip(target,clip);else piano.openChannel(target);
     },
     mixer:()=>setView('mixer')
   };
   if(!handleWorkspaceAction(kind,actions))return;
   document.querySelectorAll('[data-ws]').forEach(node=>node.classList.toggle('ws-active',node.dataset.ws===kind));
   const label={playlist:'Playlist',rack:'Channel Rack',piano:'Piano Roll',mixer:'Mixer'}[kind];
   const hint=$('workspaceHint');if(hint)hint.textContent=label+' ouvert';
 }
 document.querySelectorAll('[data-ws]').forEach(node=>node.addEventListener('click',()=>openWorkspace(node.dataset.ws)));
 document.addEventListener('keydown',event=>{
   const action=workspaceAction(event,{modalOpen:$('modal').open,recording:!!recording||!!recordFinalizing||!!micPending});
   if(!action)return;
   event.preventDefault();event.stopImmediatePropagation();openWorkspace(action);
 },true);

$('modeSong').onclick=()=>{if(recording||recordFinalizing||micPending)return toast('Termine ou annule la prise avant de changer de mode.');engine.pause();engine.patternMode=null;engine.clipPreview=null;engine.position=0;updateTransport();};
$('modePattern').onclick=()=>{if(recording||recordFinalizing||micPending)return toast('Termine ou annule la prise avant de changer de mode.');engine.pause();engine.patternMode=piano.bank().id;engine.clipPreview=null;engine.position=0;updateTransport();};
const workflow=installStudioWorkflow({getProject:()=>project,setProject:value=>{closeAllPluginWindows();project=value;},getAssets:()=>assets,getEngine:()=>engine,getDB:()=>db,projectStorageKey:scopedKey,currentTrack,currentClip,checkpoint,changed,save,selectTrack,addTrack,toast,modal,download,validateProject,updateTransport,persistNow:()=>{clearTimeout(saveTimer);saveTimer=null;return persist();},getRecordState:()=>({recording,recordFinalizing,micPending}),setRecording:value=>recording=value,setFlags:flags=>{if('recordFinalizing'in flags)recordFinalizing=flags.recordFinalizing;if('micPending'in flags)micPending=flags.micPending;}});
$('sessionVersions').onclick=()=>{$('projectMenu').hidden=true;workflow.versionsModal();};
document.addEventListener('click',e=>{if(e.target.closest('[data-group-clips]')){const items=selectedAudioClips();if(items.length<2){toast('Ctrl+clic sélectionne plusieurs clips audio.');return;}checkpoint();const group=uid();for(const {clip} of items)clip.groupId=group;changed(true);toast('Clips groupés : ils se déplacent ensemble.');}if(e.target.closest('[data-ungroup-clips]')){checkpoint();for(const {clip} of selectedAudioClips())delete clip.groupId;changed(true);}if(e.target.closest('[data-batch-gain]')){const items=selectedAudioClips();if(!items.length)return;modal('Gain de la sélection',`<div class="workflow-form"><label>Gain des ${items.length} clip(s) en dB<input id="batchClipGain" type="number" min="-24" max="36" value="0" step=".5"></label><button id="applyBatchGain" class="primary-btn">Appliquer</button></div>`);$('applyBatchGain').onclick=()=>{checkpoint();const value=clampClipGain($('batchClipGain').value);for(const {clip} of items)clip.gainDb=value;changed(true);$('modal').close();};}});
$('sessionRoot').innerHTML=['Do','Do♯','Ré','Mi♭','Mi','Fa','Fa♯','Sol','La♭','La','Si♭','Si'].map((name,i)=>`<option value="${i}">${name}</option>`).join('');
for(const id of ['sessionRoot','sessionScale'])$(id).onchange=()=>{checkpoint();project.pianoKey=Number($('sessionRoot').value);project.pianoScale=$('sessionScale').value;delete project.keyName;changed(true);toast('Tonalité mise à jour pour le piano roll. Les notes existantes restent à leur hauteur.');};
function copySelectedClip(){if(!currentClip())return;const items=selectedAudioClips();clipClipboard=items.length>1?{group:items.map(a=>({trackId:a.track.id,clip:clone(a.clip)})),origin:Math.min(...items.map(a=>a.clip.start))}:{clip:clone(currentClip()),type:currentTrack().type};toast('Clip copié.');}
installAppMenus({command:action=>{if(recording||recordFinalizing)return toast('Termine la prise avant cette action.');const buttons={new:'newProject',open:'openProject',save:'saveProject',import:'importBtn',export:'exportWav'};if(buttons[action]){$(buttons[action]).click();return;}({undo:()=>undo(),redo:()=>undo(true),copy:copySelectedClip,cut:()=>{copySelectedClip();deleteClip();},paste:pasteClip,duplicate:duplicateClip,delete:deleteClip})[action]?.();}});
installFadeHandles({getProject:()=>project,currentTrack,selectTrack,checkpoint,changed,busy:()=>recording||recordFinalizing});
signature=installSignature({getProject:()=>project,getAssets:()=>assets,getEngine:()=>engine,currentTrack,currentClip,esc,modal,toast,checkpoint,changed,save,selectTrack,addTrack,setView,setDetailOpen,showTrackProperties,updateTransport,busy:()=>recording||recordFinalizing});
installAnnotations({toast});
$('openInstrumentAudit').onclick=()=>openInstrumentAudit(modal);
restore();requestAnimationFrame(frame);

// Keep native range input semantics and existing gain/save handlers.
document.addEventListener('dblclick',e=>{if(document.body.dataset.layoutProfile!=='pt')return;const input=e.target.closest('.mixer-fader input[data-volume],.mixer-fader input[data-master]');if(!input)return;e.preventDefault();checkpoint();input.value='0';input.dispatchEvent(new Event('input',{bubbles:true}));});

 // PT rotary pan: relative vertical drag, accessible keyboard and existing audio/save path.
 document.addEventListener('pointerdown',e=>{
 const knob=e.target.closest('[data-pt-pan]');if(!knob||e.button!==0||document.body.dataset.layoutProfile!=='pt')return;
 const tr=project.tracks.find(t=>t.id===knob.dataset.ptPan);if(!tr)return;
 e.preventDefault();knob.focus();knob.setPointerCapture(e.pointerId);
 const start=e.clientY,pan=tr.pan,owner=project;let moved=false;
 const move=ev=>{if(ev.pointerId!==e.pointerId||project!==owner)return;const delta=start-ev.clientY;if(!moved&&Math.abs(delta)<2)return;if(!moved){checkpoint();moved=true;}setTrackPan(tr.id,Math.round((pan+delta/100)*100)/100);};
 const stop=ev=>{if(ev.pointerId!==e.pointerId)return;knob.removeEventListener('pointermove',move);knob.removeEventListener('pointerup',stop);knob.removeEventListener('pointercancel',stop);knob.removeEventListener('lostpointercapture',stop);};
 knob.addEventListener('pointermove',move);knob.addEventListener('pointerup',stop);knob.addEventListener('pointercancel',stop);knob.addEventListener('lostpointercapture',stop);
 });
 document.addEventListener('keydown',e=>{
 const knob=e.target.closest('[data-pt-pan]');if(!knob||document.body.dataset.layoutProfile!=='pt')return;
 const tr=project.tracks.find(t=>t.id===knob.dataset.ptPan);if(!tr)return;
 const step=e.shiftKey?.01:.05;let value;
 switch(e.key){case 'ArrowUp':case 'ArrowRight':value=tr.pan+step;break;case 'ArrowDown':case 'ArrowLeft':value=tr.pan-step;break;case 'Home':value=-1;break;case 'End':value=1;break;case 'Enter':case ' ':value=0;break;default:return;}
 e.preventDefault();checkpoint();setTrackPan(tr.id,Math.round(value*100)/100);
 });
 document.addEventListener('dblclick',e=>{const knob=e.target.closest('[data-pt-pan]');if(!knob||document.body.dataset.layoutProfile!=='pt')return;e.preventDefault();checkpoint();setTrackPan(knob.dataset.ptPan,0);});
