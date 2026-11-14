// Mobile workspace: progressive disclosure without removing DAW functionality.
const BREAKPOINT=700;
const host=document.querySelector('.workspace-toolbar');
if(host){
  const nav=document.createElement('div');
  nav.className='mobile-compact-switches';
  nav.setAttribute('role','group');
  nav.setAttribute('aria-label','Panneaux mobiles');
  const entries=[['options','Outils'],['detail','Éditeur'],['windows','Fenêtres'],['sidebar','Pistes']];
  nav.innerHTML=entries.map(([id,title])=>'<button type="button" data-mobile-panel="'+id+'" aria-expanded="false">'+title+'</button>').join('');
  host.insertBefore(nav,host.firstChild);
  let active=null;
  const isMobile=()=>window.innerWidth<=BREAKPOINT;
  function refresh(){
    const mobile=isMobile();
    document.body.classList.toggle('mobile-compact',mobile);
    document.body.dataset.mobilePanel=mobile?(active||'none'):'desktop';
    for(const b of nav.querySelectorAll('button')){
      const expanded=mobile&&active===b.dataset.mobilePanel;
      b.setAttribute('aria-expanded',String(expanded));
      b.classList.toggle('selected',expanded);
    }
  }
  nav.addEventListener('click',e=>{
    const button=e.target.closest('[data-mobile-panel]');
    if(!button)return;
    active=active===button.dataset.mobilePanel?null:button.dataset.mobilePanel;
    refresh();
    if(active==='detail')document.querySelector('.detail-panel')?.scrollIntoView({block:'nearest'});
  });
  // The editor can be opened from its existing controls; don't interfere with its state.
  document.addEventListener('click',e=>{
    if(!isMobile())return;
    if(e.target.closest('[data-view]')){
      active=null;refresh();
    }else if(e.target.closest('#channelRack,#openBundle')){
      active='detail';refresh();
    }
  });
  window.addEventListener('resize',refresh,{passive:true});
  refresh();
}
