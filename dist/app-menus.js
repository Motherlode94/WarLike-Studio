// Main Studio handles Ctrl+S, Ctrl+C/V, Ctrl+Z and other editing shortcuts.
// File menus own only Ctrl+N / Ctrl+O so actions never run twice.
export function menuShortcut(event) {
 if(!(event.ctrlKey||event.metaKey)||event.altKey||event.isComposing||event.repeat)return null;
 const key=event.key.toLowerCase();
 return key==='n'?'new':key==='o'?'open':null;
}
export const menuSpecs = [
 ['file','Fichier',[
  ['Session',[['new','Nouvelle session','Ctrl+N'],['open','Ouvrir un projet','Ctrl+O'],['save','Enregistrer le projet','Ctrl+S']]],
  ['Import / Export',[['import','Importer audio',''],['export','Exporter / stems','']]]]],
 ['edit','Édition',[
  ['Historique',[['undo','Annuler','Ctrl+Z'],['redo','Rétablir','Ctrl+Maj+Z']]],
  ['Presse-papiers',[['cut','Couper le clip','Ctrl+X'],['copy','Copier le clip','Ctrl+C'],['paste','Coller le clip','Ctrl+V']]],
  ['Clip',[['duplicate','Dupliquer','Ctrl+D'],['delete','Supprimer','Suppr']]]]]
];
export function menuPosition(rect,width,height,vw,vh,nested=false){
 const x=nested?(rect.right+width<=vw?rect.right:rect.left-width):rect.left;
 const y=nested?rect.top:rect.bottom;
 return {left:Math.max(4,Math.min(x,vw-width-4)),top:Math.max(4,Math.min(y,vh-height-4))};
}
export function installAppMenus(d){
 const target=document.getElementById('projectMenuBtn')?.closest('.menu-anchor');
 if(!target)return;
 const anchors=[];let stack=[],active=null;
 const closeFrom=(depth)=>{while(stack.length>depth){const item=stack.pop();item.menu.remove();item.owner.setAttribute('aria-expanded','false');}};
 const close=()=>{closeFrom(0);active=null;};
 const buttons=menu=>Array.from(menu.children);
 function show(owner,items,depth){
  closeFrom(depth);
  const menu=document.createElement('div');
  menu.className='dropdown app-menu-dropdown app-cascade-menu';
  menu.setAttribute('role','menu');
  Object.assign(menu.style,{position:'fixed',display:'block',visibility:'hidden',zIndex:String(20000+depth),minWidth:'190px',maxWidth:'calc(100vw - 8px)',maxHeight:'calc(100vh - 8px)',overflowY:'auto',margin:'0',right:'auto',bottom:'auto',transform:'none'});
  for(const entry of items){
   const branch=Array.isArray(entry[1]);const b=document.createElement('button');
   b.type='button';b.setAttribute('role','menuitem');b.tabIndex=-1;
   const label=document.createElement('span');label.textContent=branch?entry[0]:entry[1];b.append(label);
   const key=document.createElement('kbd');key.textContent=branch?'▸':entry[2];b.append(key);
   if(branch){b.setAttribute('aria-haspopup','menu');b.setAttribute('aria-expanded','false');}
   b.addEventListener('pointerenter',()=>{if(branch){if(stack[depth+1]?.owner!==b)show(b,entry[1],depth+1);}else closeFrom(depth+1);});
   b.onclick=()=>{if(branch){const child=stack[depth+1]?.owner===b?stack[depth+1].menu:show(b,entry[1],depth+1);buttons(child)[0]?.focus();}else{const root=active;close();root?.focus();d.command(entry[0]);}};
   menu.append(b);
  }
  document.body.append(menu);
  const pos=menuPosition(owner.getBoundingClientRect(),menu.offsetWidth,menu.offsetHeight,innerWidth,innerHeight,depth>0);
  Object.assign(menu.style,{left:pos.left+'px',top:pos.top+'px',visibility:'visible'});
  owner.setAttribute('aria-expanded','true');stack.push({menu,owner});
  menu.onkeydown=e=>{
   const list=buttons(menu),at=list.indexOf(document.activeElement);
   if(['ArrowDown','ArrowUp','Home','End'].includes(e.key)){
    e.preventDefault();closeFrom(depth+1);
    list[e.key==='Home'?0:e.key==='End'?list.length-1:(at+(e.key==='ArrowDown'?1:-1)+list.length)%list.length]?.focus();
   }else if(e.key==='ArrowRight'&&list[at]?.hasAttribute('aria-haspopup')){e.preventDefault();list[at].click();}
   else if(e.key==='ArrowLeft'&&depth>0){e.preventDefault();closeFrom(depth);owner.focus();}
   else if(e.key==='Tab'){close();}
  };
  return menu;
 }
 for(const [id,name,items] of menuSpecs){
  const anchor=document.createElement('div');anchor.className='menu-anchor app-menu-anchor';
  const button=document.createElement('button');button.type='button';button.className='text-btn';button.id=id+'MenuBtn';button.textContent=name;button.setAttribute('aria-haspopup','menu');button.setAttribute('aria-expanded','false');
  anchor.append(button);target.before(anchor);anchors.push(anchor);
  button.onclick=()=>{const wasOpen=active===button;close();if(!wasOpen){active=button;buttons(show(button,items,0))[0]?.focus();}};
  button.onkeydown=e=>{if(e.key==='ArrowDown'){e.preventDefault();if(active!==button)button.click();else buttons(stack[0].menu)[0]?.focus();}};
 }
 document.addEventListener('pointerdown',e=>{if(!e.target.closest('.app-menu-anchor,.app-cascade-menu'))close();});
 window.addEventListener('resize',close);
 document.addEventListener('keydown',e=>{
  if(e.key==='Escape'&&stack.length){const root=active;close();root?.focus();e.preventDefault();e.stopPropagation();return;}
  const action=menuShortcut(e);
  if(!action||e.defaultPrevented||e.target.closest?.('input,textarea,select,[contenteditable="true"]')||document.getElementById('modal')?.open)return;
  e.preventDefault();close();d.command(action);
 },true);
}
