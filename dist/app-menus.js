// Main Studio handles Ctrl+S, Ctrl+C/V, Ctrl+Z and other editing shortcuts.
// File menus own only Ctrl+N / Ctrl+O so actions never run twice.
export function menuShortcut(event) {
 if(!(event.ctrlKey||event.metaKey)||event.altKey||event.isComposing||event.repeat)return null;
 const key=event.key.toLowerCase();
 return key==='n'?'new':key==='o'?'open':null;
}
export function installAppMenus(d){
 const target=document.getElementById('projectMenuBtn').closest('.menu-anchor');
 const menuAnchors=[];
 const close=()=>{for(const anchor of menuAnchors){anchor.querySelector('[role="menu"]').hidden=true;anchor.querySelector('[aria-haspopup="menu"]').setAttribute('aria-expanded','false');}};
 const specs=[['file','Fichier',[['new','Nouvelle session','Ctrl+N'],['open','Ouvrir un projet','Ctrl+O'],['save','Enregistrer le projet','Ctrl+S'],['import','Importer audio',''],['export','Exporter / stems','']]],['edit','Édition',[['undo','Annuler','Ctrl+Z'],['redo','Rétablir','Ctrl+Maj+Z'],['cut','Couper le clip','Ctrl+X'],['copy','Copier le clip','Ctrl+C'],['paste','Coller le clip','Ctrl+V'],['duplicate','Dupliquer','Ctrl+D'],['delete','Supprimer','Suppr']]]];
 for(const [id,name,items] of specs){
  const anchor=document.createElement('div');anchor.className='menu-anchor app-menu-anchor';
  anchor.innerHTML=`<button type="button" class="text-btn" id="${id}MenuBtn" aria-expanded="false" aria-haspopup="menu">${name}</button><div role="menu" class="dropdown app-menu-dropdown" hidden>${items.map(([action,label,key])=>`<button type="button" role="menuitem" data-menu-command="${action}"><span>${label}</span><kbd>${key}</kbd></button>`).join('')}</div>`;
  target.before(anchor);menuAnchors.push(anchor);
  const button=anchor.querySelector('[aria-haspopup="menu"]'),menu=anchor.querySelector('[role="menu"]');
  button.onclick=()=>{const open=menu.hidden;close();if(open){menu.hidden=false;button.setAttribute('aria-expanded','true');menu.querySelector('button')?.focus();}};
  menu.onclick=e=>{const b=e.target.closest('[data-menu-command]');if(!b)return;close();button.focus();d.command(b.dataset.menuCommand);};
  anchor.onkeydown=e=>{
   if(e.key==='Escape'){if(!menu.hidden){e.preventDefault();close();button.focus();}return;}
   if(menu.hidden||!['ArrowDown','ArrowUp','Home','End'].includes(e.key))return;
   e.preventDefault();
   const list=[...menu.querySelectorAll('button')],at=list.indexOf(document.activeElement);
   const next=e.key==='Home'?0:e.key==='End'?list.length-1:(at+(e.key==='ArrowDown'?1:-1)+list.length)%list.length;
   list[next]?.focus();
  };
 }
 document.addEventListener('pointerdown',e=>{if(!e.target.closest('.app-menu-anchor'))close();});
 document.addEventListener('keydown',e=>{
  if(e.key==='Escape'&&menuAnchors.some(a=>!a.querySelector('[role="menu"]').hidden)){
   const active=menuAnchors.find(a=>!a.querySelector('[role="menu"]').hidden)?.querySelector('[aria-haspopup="menu"]');
   close();active?.focus();e.preventDefault();return;
  }
  const action=menuShortcut(e);
  if(!action||e.defaultPrevented||e.target.closest?.('input,textarea,select,[contenteditable="true"]')||document.getElementById('modal')?.open)return;
  e.preventDefault();d.command(action);
 },true);
}
