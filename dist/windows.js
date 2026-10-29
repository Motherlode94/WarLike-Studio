export function constrainWindow(x,y,width,height,viewportWidth,viewportHeight) {
  const margin=8;
  return {x:Math.max(margin,Math.min(x,Math.max(margin,viewportWidth-width-margin))),y:Math.max(margin,Math.min(y,Math.max(margin,viewportHeight-Math.min(height,60)-margin)))};
}
export function installFloatingWindow(panel,header,{onClose=()=>{}}={}) {
  let drag=null,placed=false;
  const reposition=(x,y)=>{const r=panel.getBoundingClientRect(),p=constrainWindow(x,y,r.width,r.height,innerWidth,innerHeight);panel.style.left=p.x+'px';panel.style.top=p.y+'px';};
  const place=()=>{if(!placed){const r=panel.getBoundingClientRect();reposition(innerWidth-r.width-24,Math.max(8,innerHeight-r.height-45));placed=true;}else{const r=panel.getBoundingClientRect();reposition(r.left,Math.min(r.top,Math.max(8,innerHeight-r.height-12)));}};
  header.addEventListener('pointerdown',event=>{
    if(event.button!==0||event.target.closest('button,input,a'))return;
    const r=panel.getBoundingClientRect();drag={id:event.pointerId,x:event.clientX,y:event.clientY,left:r.left,top:r.top};header.setPointerCapture(event.pointerId);header.classList.add('moving');event.preventDefault();
  });
  header.addEventListener('pointermove',event=>{if(!drag||drag.id!==event.pointerId)return;reposition(drag.left+event.clientX-drag.x,drag.top+event.clientY-drag.y);});
  const finish=()=>{drag=null;header.classList.remove('moving');};
  header.addEventListener('pointerup',finish);header.addEventListener('pointercancel',finish);header.addEventListener('lostpointercapture',finish);window.addEventListener('blur',finish);
  window.addEventListener('resize',()=>{if(!panel.hidden)place();});
  panel.querySelector('[data-float-close]').addEventListener('click',onClose);
  panel.querySelector('[data-float-minimize]').addEventListener('click',event=>{const collapsed=panel.classList.toggle('collapsed');event.currentTarget.setAttribute('aria-expanded',!collapsed);event.currentTarget.title=collapsed?'Déployer la fenêtre':'Réduire la fenêtre';event.currentTarget.setAttribute('aria-label',collapsed?'Déployer la fenêtre du plugin':'Réduire la fenêtre du plugin');if(!collapsed)place();});
  return {show(){panel.hidden=false;panel.classList.remove('collapsed');const toggle=panel.querySelector('[data-float-minimize]');toggle.setAttribute('aria-expanded','true');toggle.title='Réduire la fenêtre';toggle.setAttribute('aria-label','Réduire la fenêtre du plugin');place();},close(){panel.hidden=true;finish();}};
}
