// Contextual commands are callbacks to the existing Studio editing model.
// No command runs on right-click: mutation requires an explicit menu selection.
export function contextPosition(x,y,w,h,vw,vh){
 return {left:Math.max(4,Math.min(x,vw-w-4)),top:Math.max(4,Math.min(y,vh-h-4))};
}
let active=null;
export function closeContextMenu(restore=false){active?.close(restore);}
export function openContextMenu(event,title,items,{busy=()=>false,anchor=event.target}={}){
 event.preventDefault();event.stopPropagation();closeContextMenu();
 if(busy())return;
 const target=anchor instanceof Element?anchor:null,stack=[];
 const focusable=menu=>Array.from(menu.querySelectorAll(':scope > button:not(:disabled)'));
 const trim=depth=>{while(stack.length>depth){const {menu,owner}=stack.pop();menu.remove();owner?.setAttribute('aria-expanded','false');}};
 const cleanup=(restore=false)=>{trim(0);document.removeEventListener('pointerdown',outside,true);document.removeEventListener('keydown',keys,true);window.removeEventListener('resize',resize);window.removeEventListener('blur',resize);if(active?.close===cleanup)active=null;if(restore&&target?.isConnected)target.focus({preventScroll:true});};
 const outside=e=>{if(!e.target.closest('.studio-context-menu'))cleanup();};
 const resize=()=>cleanup();
 const keys=e=>{
  if(!stack.length)return;
  if(e.key==='Escape'){e.preventDefault();e.stopImmediatePropagation();cleanup(true);return;}
  if(e.key==='Tab'){cleanup();return;}
  if(e.key==='Shift'||e.key==='Control'||e.key==='Alt'||e.key==='Meta')return;
  // Prevent global clip shortcuts, transport and piano edits while a menu owns focus.
  e.stopImmediatePropagation();
  const level=stack.findIndex(x=>x.menu.contains(document.activeElement)),depth=level<0?stack.length-1:level,entry=stack[depth],buttons=focusable(entry.menu),i=buttons.indexOf(document.activeElement);
  if(['ArrowDown','ArrowUp','Home','End'].includes(e.key)){
   e.preventDefault();trim(depth+1);buttons[e.key==='Home'?0:e.key==='End'?buttons.length-1:(i+(e.key==='ArrowDown'?1:-1)+buttons.length)%buttons.length]?.focus();
  }else if(e.key==='ArrowRight'&&buttons[i]?.hasAttribute('aria-haspopup')){e.preventDefault();buttons[i].click();}
  else if(e.key==='ArrowLeft'&&depth>0){e.preventDefault();const owner=entry.owner;trim(depth);owner.focus();}
  else if(e.key==='Enter'||e.key===' '){e.preventDefault();buttons[i]?.click();}
  else e.preventDefault();
 };
 function show(label,entries,x,y,depth=0,owner=null){
  trim(depth);
  const menu=document.createElement('div');menu.className='dropdown app-menu-dropdown app-cascade-menu studio-context-menu';menu.setAttribute('role','menu');menu.setAttribute('aria-label',label);
  Object.assign(menu.style,{position:'fixed',display:'block',visibility:'hidden',zIndex:String(30000+depth),minWidth:'min(210px, calc(100vw - 8px))',maxWidth:'calc(100vw - 8px)',maxHeight:'calc(100vh - 8px)',overflowY:'auto',margin:'0',right:'auto',bottom:'auto',transform:'none'});
  const heading=document.createElement('div');heading.setAttribute('role','presentation');heading.textContent=label;Object.assign(heading.style,{padding:'8px 10px',fontSize:'11px',opacity:'.8',fontWeight:'600'});menu.append(heading);
  for(const item of entries){
   const button=document.createElement('button');button.type='button';button.setAttribute('role','menuitem');button.tabIndex=-1;button.disabled=!!item.disabled;button.dataset.contextAction=item.id||'';
   const text=document.createElement('span');text.textContent=item.label;button.append(text);
   const hint=document.createElement('kbd');hint.textContent=item.children?'▸':item.hint||'';button.append(hint);
   if(item.children){button.setAttribute('aria-haspopup','menu');button.setAttribute('aria-expanded','false');}
   const expand=()=>{if(button.disabled)return;if(stack[depth+1]?.owner===button)return stack[depth+1].menu;const r=button.getBoundingClientRect();return show(item.label,item.children,r.right,r.top,depth+1,button);};
   button.onpointerenter=()=>{if(item.children)expand();else trim(depth+1);};
   button.onclick=()=>{if(item.children){const child=expand();focusable(child)[0]?.focus();return;}cleanup(true);if(!busy())item.run?.();};
   menu.append(button);
  }
  document.body.append(menu);stack.push({menu,owner});
  if(owner&&x+menu.offsetWidth>innerWidth)x=owner.getBoundingClientRect().left-menu.offsetWidth;
  const pos=contextPosition(x,y,menu.offsetWidth,menu.offsetHeight,innerWidth,innerHeight);
  Object.assign(menu.style,{left:pos.left+'px',top:pos.top+'px',visibility:'visible'});owner?.setAttribute('aria-expanded','true');return menu;
 }
 active={close:cleanup};
 const rect=target?.getBoundingClientRect(),keyboard=event.clientX===0&&event.clientY===0;
 const root=show(title,items,keyboard?(rect?.left||4):event.clientX,keyboard?(rect?.bottom||4):event.clientY);
 focusable(root)[0]?.focus({preventScroll:true});
 document.addEventListener('pointerdown',outside,true);document.addEventListener('keydown',keys,true);window.addEventListener('resize',resize);window.addEventListener('blur',resize);
}
export const action=(id,label,run,disabled=false,hint='')=>({id,label,run,disabled,hint});
export const group=(id,label,children)=>({id,label,children,disabled:children.every(x=>x.disabled)});
