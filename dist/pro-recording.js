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
  const start=$('recordWorkspaceStart');
  if(start)start.disabled=!audio;
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
