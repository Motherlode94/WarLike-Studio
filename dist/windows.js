import {fitGeometry,readGeometry,writeGeometry,profileId} from './workspace-layout-model.js';
export function constrainWindow(x,y,width,height,viewportWidth,viewportHeight) {
  const margin=8;
  return {x:Math.max(margin,Math.min(x,Math.max(margin,viewportWidth-width-margin))),y:Math.max(margin,Math.min(y,Math.max(margin,viewportHeight-Math.min(height,60)-margin)))};
}
export function constrainFullWindow(x,y,width,height,viewportWidth,viewportHeight) {
  const p=constrainWindow(x,y,width,height,viewportWidth,viewportHeight);
  return {...p,y:Math.max(8,Math.min(y,Math.max(8,viewportHeight-height-8)))};
}
// Keep managed non-modal windows ordered without unbounded z-index growth.
const windowStack=[];
const managed=new Map();
const currentProfile=()=>profileId(document.body.dataset.layoutProfile);
const safeRead=()=>readGeometry(localStorage,currentProfile());
export function captureWindowGeometry(){const map=safeRead();for(const [id,controller] of managed){const g=controller.geometry();if(g)map[id]=g;}return map;}
export function applyWindowGeometry(map){writeGeometry(localStorage,currentProfile(),map);for(const controller of managed.values())controller.restore();}
export function focusManagedWindow(id){const controller=managed.get(id);if(!controller||controller.panel.hidden)return false;controller.show();controller.panel.querySelector('header button')?.focus({preventScroll:true});return true;}
export function managedWindowLabel(id){return managed.get(id)?.panel.dataset.windowLabel||({plugin:'Plugin',rack:'Channel Rack',piano:'Piano Roll',mixer:'Mixer'})[id]||id;}
export function openManagedWindows(){return [...managed].filter(([,c])=>!c.panel.hidden).map(([id])=>id);}
export function closeManagedWindows(){for(const c of [...managed.values()])if(!c.panel.hidden)c.requestClose();}
export function raiseFloatingWindow(panel){
  const index=windowStack.indexOf(panel);
  if(index>=0)windowStack.splice(index,1);
  windowStack.push(panel);
  windowStack.forEach((item,i)=>{item.style.zIndex=String(80+i);});
}
export function installFloatingWindow(panel,header,{onClose=()=>{},onFocus=()=>{},key=null,offset=0}={}) {
  let drag=null,placed=false,desired=null,lastProfile=null;panel.dataset.floatingWindow='true';
  const events=new AbortController(),listen=(target,type,fn,options={})=>target.addEventListener(type,fn,{...options,signal:events.signal});
  const activate=()=>{raiseFloatingWindow(panel);onFocus();};
  const toggle=panel.querySelector('[data-float-minimize]');
  const geometry=()=>{if(panel.hidden||panel.classList.contains('collapsed')||panel.classList.contains('fl-piano-large')||innerWidth<=760)return null;const r=panel.getBoundingClientRect();return {x:r.left,y:r.top,width:r.width,height:r.height};};
  const persist=()=>{const g=geometry();if(!key||!g)return;desired=g;try{writeGeometry(localStorage,currentProfile(),{...safeRead(),[key]:g});}catch{}};
  const owns=event=>event.target.closest('[data-floating-window]')===panel;
  listen(panel,'pointerdown',event=>{if(owns(event))activate();},{capture:true});
  listen(panel,'focusin',event=>{if(owns(event))activate();});
  const reposition=(x,y)=>{panel.style.maxWidth=Math.max(0,innerWidth-16)+'px';panel.style.maxHeight=Math.max(0,innerHeight-16)+'px';const r=panel.getBoundingClientRect(),p=constrainFullWindow(x,y,r.width,r.height,innerWidth,innerHeight);panel.style.left=p.x+'px';panel.style.top=p.y+'px';};
  const apply=g=>{const fitted=fitGeometry(g,innerWidth,innerHeight);if(!fitted)return;panel.style.width=fitted.width+'px';panel.style.height=fitted.height+'px';reposition(fitted.x,fitted.y);};
  const restore=()=>{lastProfile=currentProfile();desired=key?safeRead()[key]||null:null;placed=false;panel.style.removeProperty('width');panel.style.removeProperty('height');panel.style.removeProperty('left');panel.style.removeProperty('top');if(!panel.hidden)place();};
  const place=()=>{if(lastProfile!==currentProfile()){restore();return;}if(panel.classList.contains('fl-piano-large'))return;if(desired&&!panel.classList.contains('collapsed')){apply(desired);placed=true;return;}if(!placed){const r=panel.getBoundingClientRect();reposition(innerWidth-r.width-24-offset,Math.max(8,innerHeight-r.height-45-offset));placed=true;}else{const r=panel.getBoundingClientRect();reposition(r.left,Math.min(r.top,Math.max(8,innerHeight-r.height-12)));}};
  const begin=(event,resize=null)=>{
    if(event.button!==0||panel.classList.contains('fl-piano-large')||resize&&panel.classList.contains('collapsed'))return;
    if(!resize&&event.target.closest('button,input,a,select,textarea,[contenteditable]'))return;
    const r=panel.getBoundingClientRect();drag={id:event.pointerId,x:event.clientX,y:event.clientY,left:r.left,top:r.top,width:r.width,height:r.height,resize,moved:false};
    header.setPointerCapture(event.pointerId);header.classList.add('moving');event.preventDefault();
  };
  listen(header,'pointerdown',event=>begin(event,event.target.closest('[data-float-resize-edge]')?.dataset.floatResizeEdge||(event.target.closest('[data-float-resize]')?'se':null)));
  listen(header,'pointermove',event=>{if(!drag||drag.id!==event.pointerId)return;const dx=event.clientX-drag.x,dy=event.clientY-drag.y;if(Math.abs(dx)+Math.abs(dy)<2&&!drag.moved)return;drag.moved=true;
    if(drag.resize){
      const style=getComputedStyle(panel),minWidth=Math.min(Number.parseFloat(style.minWidth)||300,innerWidth-16),minHeight=Math.min(Number.parseFloat(style.minHeight)||85,innerHeight-16),right=drag.left+drag.width,bottom=drag.top+drag.height;
      let left=drag.left,top=drag.top,width=drag.width,height=drag.height;
      if(drag.resize.includes('e'))width=Math.max(minWidth,Math.min(innerWidth-left-8,drag.width+dx));
      if(drag.resize.includes('s'))height=Math.max(minHeight,Math.min(innerHeight-top-8,drag.height+dy));
      if(drag.resize.includes('w')){left=Math.max(8,Math.min(right-minWidth,drag.left+dx));width=right-left;}
      if(drag.resize.includes('n')){top=Math.max(8,Math.min(bottom-minHeight,drag.top+dy));height=bottom-top;}
      panel.style.width=width+'px';panel.style.height=height+'px';reposition(left,top);
    }else reposition(drag.left+dx,drag.top+dy);
  });
  const finish=()=>{const moved=drag?.moved,id=drag?.id;drag=null;header.classList.remove('moving');if(id!==undefined&&header.hasPointerCapture(id))header.releasePointerCapture(id);if(moved)persist();};
  listen(header,'pointerup',finish);listen(header,'pointercancel',finish);listen(header,'lostpointercapture',finish);listen(window,'blur',finish);
  // Native resize remains supported; only actual user pointer interaction persists geometry.
  let nativeStart=null;
  listen(panel,'pointerdown',e=>{if(e.button===0&&!header.contains(e.target)&&!e.target.closest('[data-float-resize-edge]')){const g=geometry();if(g&&e.clientX>=g.x+g.width-24&&e.clientY>=g.y+g.height-24)nativeStart=g;}},{capture:true});
  listen(window,'pointerup',()=>{if(nativeStart){const g=geometry();if(g&&(g.width!==nativeStart.width||g.height!==nativeStart.height))persist();nativeStart=null;}},{capture:true});
  listen(window,'pointercancel',()=>nativeStart=null,{capture:true});
  listen(window,'resize',()=>{if(!panel.hidden)place();});
  if(!document.getElementById('floating-window-mouse-css')){const style=document.createElement('style');style.id='floating-window-mouse-css';style.textContent=`
[data-floating-window]{overscroll-behavior:contain}
.float-resize-layer{position:absolute;inset:0 auto auto 0;width:100%;height:var(--floating-window-height,100%);pointer-events:none;z-index:20}
.float-resize-layer>span{position:absolute;pointer-events:auto;touch-action:none}
.float-resize-layer>[data-float-resize-edge=n],.float-resize-layer>[data-float-resize-edge=s]{left:13px;right:13px;height:6px;cursor:ns-resize}
.float-resize-layer>[data-float-resize-edge=n]{top:0}.float-resize-layer>[data-float-resize-edge=s]{bottom:0}
.float-resize-layer>[data-float-resize-edge=e],.float-resize-layer>[data-float-resize-edge=w]{top:13px;bottom:13px;width:6px;cursor:ew-resize}
.float-resize-layer>[data-float-resize-edge=e]{right:0}.float-resize-layer>[data-float-resize-edge=w]{left:0}
.float-resize-layer>[data-float-resize-edge=nw],.float-resize-layer>[data-float-resize-edge=ne],.float-resize-layer>[data-float-resize-edge=sw],.float-resize-layer>[data-float-resize-edge=se]{width:13px;height:13px}
.float-resize-layer>[data-float-resize-edge=nw]{left:0;top:0;cursor:nwse-resize}.float-resize-layer>[data-float-resize-edge=ne]{right:0;top:0;cursor:nesw-resize}
.float-resize-layer>[data-float-resize-edge=sw]{left:0;bottom:0;cursor:nesw-resize}.float-resize-layer>[data-float-resize-edge=se]{right:0;bottom:0;cursor:nwse-resize}
.collapsed>header .float-resize-layer,.fl-piano-large>header .float-resize-layer{display:none}
@media(max-width:760px){.float-resize-layer{display:none}}
`;document.head.append(style);}
  if(getComputedStyle(header).position==='static')header.style.position='relative';
  const resizeLayer=document.createElement('div');resizeLayer.className='float-resize-layer';resizeLayer.setAttribute('aria-hidden','true');for(const edge of ['n','e','s','w','nw','ne','sw','se']){const handle=document.createElement('span');handle.dataset.floatResizeEdge=edge;resizeLayer.append(handle);}header.append(resizeLayer);
  const observer=new ResizeObserver(()=>panel.style.setProperty('--floating-window-height',panel.getBoundingClientRect().height+'px'));observer.observe(panel);
  const resizeButton=document.createElement('button');resizeButton.type='button';resizeButton.className='outline-btn';resizeButton.dataset.floatResize='';resizeButton.textContent='↘';resizeButton.title='Glisser pour redimensionner · flèches au clavier';resizeButton.setAttribute('aria-label','Redimensionner la fenêtre');toggle.before(resizeButton);
  listen(resizeButton,'keydown',e=>{if(!['ArrowLeft','ArrowRight','ArrowUp','ArrowDown'].includes(e.key)||panel.classList.contains('collapsed'))return;e.preventDefault();e.stopPropagation();const r=panel.getBoundingClientRect();apply({x:r.left,y:r.top,width:Math.max(300,r.width+(e.key==='ArrowRight'?24:e.key==='ArrowLeft'?-24:0)),height:Math.max(85,r.height+(e.key==='ArrowDown'?24:e.key==='ArrowUp'?-24:0))});persist();});
  listen(panel.querySelector('[data-float-close]'),'click',onClose);
  listen(toggle,'click',event=>{const collapsed=panel.classList.toggle('collapsed');event.currentTarget.setAttribute('aria-expanded',!collapsed);event.currentTarget.title=collapsed?'Déployer la fenêtre':'Réduire la fenêtre';event.currentTarget.setAttribute('aria-label',collapsed?'Déployer la fenêtre du plugin':'Réduire la fenêtre du plugin');resizeButton.disabled=collapsed;if(!collapsed)place();});
  const controller={panel,geometry,restore,requestClose:onClose,focus:activate,show(){panel.hidden=false;activate();panel.classList.remove('collapsed');resizeButton.disabled=false;toggle.setAttribute('aria-expanded','true');toggle.title='Réduire la fenêtre';toggle.setAttribute('aria-label','Réduire la fenêtre du plugin');place();if(!desired)persist();},close(){panel.hidden=true;const index=windowStack.indexOf(panel);if(index>=0)windowStack.splice(index,1);windowStack.forEach((item,i)=>{item.style.zIndex=String(80+i);});finish();},dispose(){this.close();events.abort();observer.disconnect();resizeLayer.remove();resizeButton.remove();if(managed.get(key)===this)managed.delete(key);}};
  if(key){managed.set(key,controller);panel.dataset.managedWindow=key;}return controller;
}
