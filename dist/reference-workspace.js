// One Edit/Mix navigation. Move existing controls, never recreate their handlers.
export const layoutProfile=value=>value==='fl'?'fl':'pt';
export function installReferenceWorkspace({bar,onView,setDetailOpen}){
 document.body.classList.add('reference-studio');
 const tabs=document.querySelector('.arrangement .view-tabs');if(tabs)bar.prepend(tabs);
 const menu=document.createElement('details');menu.className='reference-window-menu';
 const summary=document.createElement('summary');summary.textContent='Fenêtres & outils';
 const panel=document.createElement('div');panel.className='reference-window-options';menu.append(summary,panel);
 const layout=document.createElement('label');layout.textContent='Disposition';
 const choice=document.createElement('select');choice.id='studioLayoutProfile';choice.setAttribute('aria-label','Disposition du studio');
 for(const [value,name] of [['pt','Pro Tools'],['fl','FL Studio']]){const option=document.createElement('option');option.value=value;option.textContent=name;choice.append(option);}
 let saved;try{saved=localStorage.getItem('warlike.layoutProfile');}catch{}
 const apply=value=>{const profile=layoutProfile(value);document.body.dataset.layoutProfile=profile;choice.value=profile;updateEditLabels(profile);try{localStorage.setItem('warlike.layoutProfile',profile);}catch{}};
 const editbar=document.getElementById('studioEditbar');
 const labels=[...editbar.querySelectorAll('[data-edit-mode],[data-edit-tool]')].map(node=>({node,original:node.textContent,pt:({grid:'Grid',slip:'Slip',select:'Smart',move:'Grabber',trim:'Trim',split:'Split',draw:'Pencil'})[node.dataset.editMode||node.dataset.editTool]}));
 function updateEditLabels(profile){for(const item of labels)item.node.textContent=profile==='pt'&&item.pt?item.pt:item.original;}
 const sections=[...document.querySelectorAll('.library > .library-section')];
 for(const section of sections){const heading=section.querySelector('.section-label');if(!heading)continue;const toggle=document.createElement('button');toggle.type='button';toggle.className='fl-folder-toggle';toggle.textContent='▾';toggle.setAttribute('aria-label','Replier ou développer '+heading.textContent.trim());toggle.setAttribute('aria-expanded','true');heading.prepend(toggle);toggle.addEventListener('click',()=>{const collapsed=section.classList.toggle('fl-folder-collapsed');toggle.textContent=collapsed?'▸':'▾';toggle.setAttribute('aria-expanded',String(!collapsed));});}
 apply(saved);choice.addEventListener('change',()=>apply(choice.value));layout.append(choice);panel.append(layout);
 const windows=document.querySelector('.warlike-workspaces');if(windows)panel.append(windows);
 const flTools=document.createElement('div');flTools.className='fl-workspace-tools';flTools.setAttribute('role','group');flTools.setAttribute('aria-label','Outils de composition');
 for(const [id,label,key] of [['playlist','Playlist','F5'],['rack','Channel Rack','F6'],['piano','Piano Roll','F7'],['mixer','Mixer','F9']]){const button=document.createElement('button');button.type='button';button.textContent=label;button.title=key;button.addEventListener('click',()=>windows?.querySelector(`[data-ws="${id}"]`)?.click());flTools.append(button);}
 bar.append(flTools);
 for(const id of ['organiseTracks','openVariants','openLyrics','mixCompare','referenceCompare']){const node=document.getElementById(id);if(node)panel.append(node);}
 const library=document.createElement('button');library.type='button';library.textContent='Bibliothèque de sons';library.onclick=()=>{tabs?.querySelector('[data-view=library]')?.click();menu.open=false;};panel.append(library);
 const mastering=document.createElement('button');mastering.type='button';mastering.textContent='Mastering';mastering.onclick=()=>{document.getElementById('openMastering')?.click();menu.open=false;};panel.append(mastering);
 const editor=document.createElement('button');editor.type='button';editor.textContent='Afficher / masquer l’éditeur inférieur';
 editor.onclick=()=>{document.getElementById('toggleDetail')?.click();menu.open=false;};panel.append(editor);bar.append(menu);
 const demos=document.querySelector('.top-actions .public-demo-links');
 const extras=document.querySelector('.studio-more-panel');if(demos&&extras)extras.prepend(demos);
 bar.addEventListener('click',event=>{
  const view=event.target.closest('[data-view]')?.dataset.view;
  if(event.target.closest('button[data-workspace]'))document.body.dataset.studioSurface='playlist';
  if(view){document.body.dataset.studioSurface='playlist';onView(view);if(view!=='library')setDetailOpen(false);}
 });
 panel.addEventListener('click',event=>{if(event.target.closest('button'))menu.open=false;});
 document.addEventListener('pointerdown',event=>{if(!menu.contains(event.target))menu.open=false;});
 document.addEventListener('keydown',event=>{if(event.key==='Escape')menu.open=false;});
}
