// Progressive disclosure for WarLike Studio. Preserve original button nodes and listeners.
function setup(){
 const top=document.querySelector('.top-actions');
 if(!top||document.getElementById('studioMoreMenu'))return;
 const details=document.createElement('details');details.id='studioMoreMenu';details.className='studio-more-menu';
 const summary=document.createElement('summary');summary.textContent='Outils';summary.setAttribute('aria-label','Afficher les outils secondaires');
 const panel=document.createElement('div');panel.className='studio-more-panel';
 details.append(summary,panel);
 const demo=top.querySelector('.public-demo-links');
 if(demo){demo.setAttribute('aria-label','Sessions de démonstration');}
 for(const id of ['openBundle','help']){const node=document.getElementById(id);if(node)panel.append(node);}
 const anchor=top.querySelector('#projectMenuBtn')?.closest('.menu-anchor');
 if(anchor)top.insertBefore(details,anchor);else top.append(details);
 const observer=new MutationObserver(()=>{if(details.open&&window.innerWidth<=760)details.scrollIntoView({block:'nearest'});});
 observer.observe(details,{attributes:true,attributeFilter:['open']});
 // Recording: expose only the core capture controls; keep diagnostics in a disclosure.
 const recording=document.getElementById('recordWorkspaceBar');
 if(recording){
   const advanced=document.createElement('details');advanced.className='record-advanced-menu';
   const trigger=document.createElement('summary');trigger.textContent='Réglages avancés';
   trigger.setAttribute('aria-label','Afficher les outils avancés d’enregistrement');
   const contents=document.createElement('div');contents.className='record-advanced-content';
   advanced.append(trigger,contents);
   const ids=['recordWorkspaceSolo','recordWorkspaceDuo','recordWorkspaceMicTest','recordWorkspaceValidate','recordWorkspaceRecover','recordWorkspaceSyncCheck','recordWorkspaceMicDiagnostic'];
   for(const id of ids){const node=document.getElementById(id);if(node)contents.append(node);}
   const resultIds=['recordWorkspaceSyncResult','recordWorkspaceMicDiagnosticResult'];
   for(const id of resultIds){const node=document.getElementById(id);if(node)contents.append(node);}
   const note=recording.querySelector('.record-note');if(note)contents.append(note);
   const clipActions=recording.querySelector('.record-clip-actions');if(clipActions)contents.append(clipActions);
   recording.append(advanced);
 }
 // The library is optional on narrow displays; all existing browser controls remain intact.
 const library=document.querySelector('.studio-body>.library');
 const body=document.querySelector('.studio-body');
 if(library&&body){
   const toggle=document.createElement('button');toggle.type='button';toggle.id='studioLibraryToggle';
   toggle.className='studio-library-toggle';toggle.textContent='Bibliothèque';
   toggle.setAttribute('aria-controls','studioLibraryPanel');
   library.id='studioLibraryPanel';
   const setOpen=open=>{body.classList.toggle('studio-library-visible',open);toggle.setAttribute('aria-expanded',String(open));toggle.textContent=open?'Fermer bibliothèque':'Bibliothèque';};
   toggle.addEventListener('click',()=>setOpen(!body.classList.contains('studio-library-visible')));
   const nav=document.querySelector('.warlike-workspaces');
   if(nav)nav.append(toggle);else body.prepend(toggle);
   setOpen(false);
 }
 // Professional DAW layout: one primary Edit/Mix navigation, contextual tool groups.
 document.body.classList.add('studio-pro-layout');
 const workspaces=document.querySelector('.warlike-workspaces');
 if(workspaces){
   const label=workspaces.querySelector('.ws-label');if(label)label.textContent='VUES';
   const hint=workspaces.querySelector('.ws-hint');if(hint)hint.hidden=true;
   // Keep native workspace controls and their keyboard shortcuts; no duplicate view tabs.
 }
 const arrangement=document.getElementById('arrangementSection');
 const editbar=document.getElementById('studioEditbar');
 if(arrangement&&editbar){
   const details=document.createElement('details');details.className='studio-edit-options';
   const trigger=document.createElement('summary');trigger.textContent='Outils d’édition';
   trigger.setAttribute('aria-label','Afficher les outils d’édition avancés');
   const contents=document.createElement('div');contents.className='studio-edit-options-content';
   const editModes=editbar.querySelector('.edit-modes');
   const editTools=editbar.querySelector('.edit-tools');
   // Keep Smart tool and grid in the main edit strip. Secondary actions in disclosure.
   for(const selector of ['.nudge-controls','.edit-split']){const node=editbar.querySelector(selector);if(node)contents.append(node);}
   details.append(trigger,contents);editbar.append(details);
 }
 const arrangementToolbar=document.querySelector('.arrangement .workspace-toolbar');
 if(arrangementToolbar){
   const actions=arrangementToolbar.querySelector('.arrangement-actions');
   if(actions){
     const extra=document.createElement('details');extra.className='studio-arrange-options';
     const trigger=document.createElement('summary');trigger.textContent='Affichage';
     const contents=document.createElement('div');contents.className='studio-arrange-options-content';
     for(const selector of ['.timeline-zoom','.bars-control']){const node=actions.querySelector(selector);if(node)contents.append(node);}
     extra.append(trigger,contents);actions.append(extra);
   }
 }
 document.addEventListener('pointerdown',event=>{if(details.open&&!details.contains(event.target))details.open=false;});
 document.addEventListener('keydown',event=>{if(event.key==='Escape')details.open=false;});
}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',setup,{once:true});else setup();
