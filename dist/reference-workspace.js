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
 const apply=value=>{const profile=layoutProfile(value);document.body.dataset.layoutProfile=profile;choice.value=profile;try{localStorage.setItem('warlike.layoutProfile',profile);}catch{}};
 apply(saved);choice.addEventListener('change',()=>apply(choice.value));layout.append(choice);panel.append(layout);
 const windows=document.querySelector('.warlike-workspaces');if(windows)panel.append(windows);
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
