// WarLike Studio recording workspace. UI-only; delegates every audio operation
// to the existing Studio controls and never simulates track arming.
const key='warlike.recording.workspace.v1';
const $=id=>document.getElementById(id);
const bar=$('recordWorkspaceBar');
const button=$('recordWorkspaceToggle');
const label=$('recordWorkspaceTarget');
function setRecordingWorkspace(enabled){
  document.body.classList.toggle('record-workspace',enabled);
  button?.setAttribute('aria-pressed',String(enabled));
  if(button)button.textContent=enabled?'Quitter Recording':'Recording';
  if(bar)bar.hidden=!enabled;
  try{localStorage.setItem(key,enabled?'1':'0');}catch{}
  updateTarget();
}
function updateTarget(){
  const selected=document.querySelector('#trackRows .track-row.selected');
  const name=selected?.querySelector('.track-title')?.textContent?.trim();
  const audio=selected?.querySelector('.track-subtitle')?.textContent?.includes('Audio')||false;
  if(label)label.textContent=audio?'Piste cible : '+name:name?'Sélectionne une piste audio · actuel : '+name:'Sélectionne une piste audio';
  const armed=[...document.querySelectorAll('#trackRows [data-record-arm][aria-pressed="true"]')];
  const start=$('recordWorkspaceStart');
  if(armed.length){
    const names=armed.map(button=>button.closest('.track-row')?.querySelector('.track-title')?.textContent?.trim()).filter(Boolean);
    if(label)label.textContent='Armées : '+names.join(' + ')+' (entrées indépendantes)';
  }
  if(start)start.disabled=armed.length===0&&!audio;
}
button?.addEventListener('click',()=>setRecordingWorkspace(!document.body.classList.contains('record-workspace')));
$('recordWorkspaceStart')?.addEventListener('click',()=>{
  if(!$('recordWorkspaceStart').disabled)$('record')?.click();
});
$('recordWorkspaceMic')?.addEventListener('click',()=>$('recordSettings')?.click());
$('recordWorkspaceMetronome')?.addEventListener('click',()=>$('metronome')?.click());
$('recordWorkspaceMix')?.addEventListener('click',()=>document.querySelector('[data-view="mixer"]')?.click());
$('recordWorkspaceEdit')?.addEventListener('click',()=>document.querySelector('[data-view="arrange"]')?.click());
const rows=$('trackRows');
if(rows)new MutationObserver(updateTarget).observe(rows,{childList:true,subtree:true,attributes:true,attributeFilter:['class']});
try{setRecordingWorkspace(localStorage.getItem(key)==='1');}catch{setRecordingWorkspace(false);}

// Middle-mouse hand pan is opt-in to the recording workspace.
// Primary button interactions remain entirely owned by Studio's clip editor.
const scroller=$('timelineScroll');
let hand=null;
scroller?.addEventListener('pointerdown',event=>{
  if(event.button!==1||!document.body.classList.contains('record-workspace'))return;
  event.preventDefault();
  hand={id:event.pointerId,x:event.clientX,y:event.clientY,left:scroller.scrollLeft,top:scroller.scrollTop};
  scroller.setPointerCapture(event.pointerId);
  scroller.classList.add('record-hand-pan');
});
scroller?.addEventListener('pointermove',event=>{
  if(!hand||event.pointerId!==hand.id)return;
  scroller.scrollLeft=hand.left-(event.clientX-hand.x);
  scroller.scrollTop=hand.top-(event.clientY-hand.y);
});
function endHandPan(event){
  if(!hand||event.pointerId!==hand.id)return;
  hand=null;scroller.classList.remove('record-hand-pan');
  try{scroller.releasePointerCapture(event.pointerId);}catch{}
}
scroller?.addEventListener('pointerup',endHandPan);
scroller?.addEventListener('pointercancel',endHandPan);
window.addEventListener('blur',()=>{hand=null;scroller?.classList.remove('record-hand-pan');});

// Clip commands delegate to the existing Edit Window functions. They do not
// mutate project state independently or bypass its undo/history safeguards.
const clipTools={recordClipSelectTool:'select',recordClipTrimTool:'trim',recordClipSplitTool:'split'};
for(const [id,mode] of Object.entries(clipTools)){
  $(id)?.addEventListener('click',()=>{
    if(document.body.dataset.studioView!=='arrange')document.querySelector('[data-view="arrange"]')?.click();
    document.querySelector('[data-edit-tool="'+mode+'"]')?.click();
    refreshClipToolbar();
  });
}
$('recordClipDuplicate')?.addEventListener('click',()=>$('duplicateClip')?.click());
$('recordClipDelete')?.addEventListener('click',()=>$('deleteClip')?.click());
function refreshClipToolbar(){
  const selected=document.querySelector('#trackRows [data-clip].selected');
  for(const id of ['recordClipDuplicate','recordClipDelete'])if($(id))$(id).disabled=!selected;
  for(const [id,mode] of Object.entries(clipTools)){
    const active=document.querySelector('[data-edit-tool="'+mode+'"]')?.getAttribute('aria-pressed')==='true';
    $(id)?.setAttribute('aria-pressed',String(active));
  }
}
const toolbarObserver=new MutationObserver(refreshClipToolbar);
if(rows)toolbarObserver.observe(rows,{subtree:true,childList:true,attributes:true,attributeFilter:['class','aria-pressed']});
document.querySelector('#studioEditbar')?.addEventListener('click',refreshClipToolbar);
refreshClipToolbar();

// Input test is an actual browser capture/level analyser, not a simulated
// "live" meter. It never connects the microphone to the speakers or uploads
// audio. Separate from the recorder to avoid changing existing capture code.
let micTest=null, micTestGeneration=0;

const testButton=$('recordWorkspaceMicTest'),testOutput=$('recordWorkspaceInputDb'),testLevel=$('recordWorkspaceInputLevel');
function stopInputTest(){
  micTestGeneration++;
  if(!micTest){if(testButton){testButton.textContent='Tester l’entrée';testButton.setAttribute('aria-pressed','false');}return;}
  const old=micTest;micTest=null;
  cancelAnimationFrame(old.frame);
  try{old.source.disconnect();old.analyser.disconnect();}catch{}
  old.stream.getTracks().forEach(t=>t.stop());
  old.context.close().catch(()=>{});
  if(testButton){testButton.textContent='Tester l’entrée';testButton.setAttribute('aria-pressed','false');}
  if(testOutput){testOutput.textContent='— dBFS';testOutput.classList.remove('input-clipping');}
  if(testLevel)testLevel.style.width='0%';
}
async function toggleInputTest(){
  if(micTest){stopInputTest();return;}
  if(!navigator.mediaDevices?.getUserMedia){if(testOutput)testOutput.textContent='Micro indisponible (HTTPS requis)';return;}
  if($('record')?.classList.contains('recording')){if(testOutput)testOutput.textContent='Arrêter la prise avant le test';return;}
  if(testButton)testButton.disabled=true;
  const generation=++micTestGeneration;
  let stream,context;
  try{
    // Read the same saved device as the actual PCM recorder; fall back to default only if no device was selected.
    const savedDevice=bar?.dataset.deviceId||'';
    const deviceId=savedDevice||document.querySelector('#inputDevice')?.value||'';
    stream=await navigator.mediaDevices.getUserMedia({audio:{...(deviceId?{deviceId:{exact:deviceId}}:{}),echoCancellation:false,noiseSuppression:false,autoGainControl:false}});
    if(generation!==micTestGeneration||!document.body.classList.contains('record-workspace')||$('record')?.classList.contains('recording')){stream.getTracks().forEach(t=>t.stop());return;}
    context=new AudioContext();
    if(context.state==='suspended')await context.resume();
    if(generation!==micTestGeneration){stream.getTracks().forEach(t=>t.stop());await context.close();return;}
    const source=context.createMediaStreamSource(stream),analyser=context.createAnalyser();
    analyser.fftSize=2048;source.connect(analyser);
    const samples=new Float32Array(analyser.fftSize);
    const current=micTest={stream,context,source,analyser,frame:0};
    testButton.textContent='Arrêter test micro';testButton.setAttribute('aria-pressed','true');
    function measure(){
      if(micTest!==current)return;
      if($('record')?.classList.contains('recording')){stopInputTest();return;}
      analyser.getFloatTimeDomainData(samples);
      let peak=0;for(const s of samples)peak=Math.max(peak,Math.abs(s));
      const db=peak>0?20*Math.log10(peak):-Infinity;
      if(testOutput){testOutput.textContent=Number.isFinite(db)?db.toFixed(1)+' dBFS':'−∞ dBFS';testOutput.classList.toggle('input-clipping',db>=-0.5);}
      if(testLevel)testLevel.style.width=Math.min(100,Math.max(0,(db+60)/60*100))+'%';
      current.frame=requestAnimationFrame(measure);
    }
    measure();
    stream.getTracks().forEach(t=>t.addEventListener('ended',stopInputTest,{once:true}));
  }catch(error){
    stream?.getTracks().forEach(t=>t.stop());
    await context?.close().catch(()=>{});
    if(testOutput)testOutput.textContent='Entrée indisponible : '+error.message;
  }finally{if(testButton)testButton.disabled=false;}
}
testButton?.addEventListener('click',toggleInputTest);
button?.addEventListener('click',()=>{if(!document.body.classList.contains('record-workspace'))stopInputTest();});
$('recordWorkspaceStart')?.addEventListener('click',stopInputTest,{capture:true});
$('record')?.addEventListener('click',stopInputTest,{capture:true});
document.addEventListener('visibilitychange',()=>{if(document.hidden)stopInputTest();});
window.addEventListener('pagehide',stopInputTest);
