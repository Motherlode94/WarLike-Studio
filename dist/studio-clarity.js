// Progressive disclosure for WarLike Studio. Preserve original button nodes and listeners.
function setup(){
 const top=document.querySelector('.top-actions');
 if(!top||document.getElementById('studioMoreMenu'))return;
 const details=document.createElement('details');details.id='studioMoreMenu';details.className='studio-more-menu';
 const summary=document.createElement('summary');summary.textContent='Outils';summary.setAttribute('aria-label','Afficher les outils secondaires');
 const panel=document.createElement('div');panel.className='studio-more-panel';
 details.append(summary,panel);
 const demo=top.querySelector('.public-demo-links');
 if(demo){const heading=document.createElement('strong');heading.textContent='Sessions de démonstration';panel.append(heading,demo);}
 for(const id of ['openBundle','openMastering','help']){const node=document.getElementById(id);if(node)panel.append(node);}
 const anchor=top.querySelector('#projectMenuBtn')?.closest('.menu-anchor');
 if(anchor)top.insertBefore(details,anchor);else top.append(details);
 const observer=new MutationObserver(()=>{if(details.open&&window.innerWidth<=760)details.scrollIntoView({block:'nearest'});});
 observer.observe(details,{attributes:true,attributeFilter:['open']});
 document.addEventListener('pointerdown',event=>{if(details.open&&!details.contains(event.target))details.open=false;});
 document.addEventListener('keydown',event=>{if(event.key==='Escape')details.open=false;});
}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',setup,{once:true});else setup();
