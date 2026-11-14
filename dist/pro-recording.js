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
