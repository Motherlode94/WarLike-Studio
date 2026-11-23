const roots=new WeakSet();
const node=(tag,text)=>{const n=document.createElement(tag);if(text)n.textContent=text;return n;};
export function mountSessionPreview(root,onStop){
 if(!roots.has(root)){root.addEventListener('keydown',e=>{if(['Enter',' '].includes(e.key)&&e.target.closest('[data-session-preview],[data-session-preview-stop]'))e.stopPropagation();});roots.add(root);}
 const panel=node('section');panel.className='session-preview-panel';panel.setAttribute('aria-label','Préécoute des compositions');
 const info=node('div'),title=node('strong','Préécoute · extrait musical de 4 mesures');
 const status=node('output');status.dataset.sessionPreviewStatus='';status.setAttribute('role','status');
 const progress=node('progress');progress.dataset.sessionPreviewProgress='';progress.setAttribute('aria-label','Progression de la préécoute');progress.value=0;progress.max=1;
 const elapsed=node('span');elapsed.dataset.sessionPreviewTime='';elapsed.setAttribute('aria-live','off');
 const stop=node('button','■ Arrêter');stop.type='button';stop.className='outline-btn';stop.dataset.sessionPreviewStop='';stop.onclick=onStop;
 info.append(title,status,progress,elapsed);panel.append(info,stop);root.prepend(panel);
}
export function updateSessionPreview(root,state,elapsed=0){
 const panel=root.querySelector('.session-preview-panel');if(!panel)return;
 const key=state.status+':'+(state.id||''),changed=panel.dataset.key!==key;panel.dataset.key=key;
 const active=['preparing','playing'].includes(state.status);panel.dataset.state=state.status;
 const output=panel.querySelector('[data-session-preview-status]');
 const text=state.status==='preparing'?'Préparation · '+state.name:
  state.status==='playing'?'Écoute · '+state.name+' · '+state.section:
  state.status==='error'?'Préécoute indisponible : '+state.message:'Choisis un morceau à écouter.';
 if(output.textContent!==text)output.textContent=text;
 panel.querySelector('[data-session-preview-stop]').disabled=!active;
 const progress=panel.querySelector('progress');progress.hidden=state.status!=='playing';progress.max=state.seconds||1;progress.value=elapsed;
 const clock=panel.querySelector('[data-session-preview-time]'),time=state.status==='playing'?Math.floor(elapsed)+' / '+Math.ceil(state.seconds)+' s':'';
 if(clock.textContent!==time)clock.textContent=time;
 if(changed)for(const button of root.querySelectorAll('[data-session-preview]')){
  const pressed=active&&button.dataset.sessionPreview===state.id,name=button.dataset.previewName;
  button.setAttribute('aria-pressed',String(pressed));button.setAttribute('aria-label',(pressed?'Arrêter la préécoute de ':'Écouter un extrait de ')+name);
  const label=pressed?'■ Arrêter':'▶ Écouter';if(button.textContent!==label)button.textContent=label;
 }
}
