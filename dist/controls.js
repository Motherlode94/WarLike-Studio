export function clampRangeValue(value,min,max,step=1) {
  const precision=Math.min(8,(String(step).split('.')[1]||'').length);
  const snapped=min+Math.round((value-min)/step)*step;
  return Number(Math.max(min,Math.min(max,snapped)).toFixed(precision));
}
export function dragRangeValue(start,dx,dy,min,max,step,fine=false) {
  return clampRangeValue(start+(dx*.5-dy)/180*(max-min)*(fine?.1:1),min,max,step);
}
export function installKnobControls({onStart=()=>{}}={}) {
  let drag=null,wheelTimer=0;
  const limits=input=>[Number(input.min),Number(input.max),Number(input.step)||1];
  const change=(input,value,commit=false)=>{input.value=value;input.dispatchEvent(new Event('input',{bubbles:true}));if(commit)input.dispatchEvent(new Event('change',{bubbles:true}));};
  document.addEventListener('pointerdown',event=>{
    const input=event.target.closest('.knob input[type="range"]');if(!input||event.button!==0)return;
    event.preventDefault();input.focus({preventScroll:true});onStart();
    drag={input,id:event.pointerId,x:event.clientX,y:event.clientY,value:Number(input.value)};
    input.setPointerCapture(event.pointerId);input.closest('.knob').classList.add('dragging');
  });
  document.addEventListener('pointermove',event=>{if(!drag||event.pointerId!==drag.id)return;event.preventDefault();const {input}=drag;change(input,dragRangeValue(drag.value,event.clientX-drag.x,event.clientY-drag.y,...limits(input),event.shiftKey));});
  const finish=event=>{if(!drag||event.pointerId!==drag.id)return;const {input}=drag;drag=null;input.closest('.knob')?.classList.remove('dragging');input.dispatchEvent(new Event('change',{bubbles:true}));};
  document.addEventListener('pointerup',finish);document.addEventListener('pointercancel',finish);
  document.addEventListener('wheel',event=>{
    const input=event.target.closest('.knob')?.querySelector('input[type="range"]');if(!input)return;event.preventDefault();
    if(!wheelTimer)onStart();clearTimeout(wheelTimer);wheelTimer=setTimeout(()=>wheelTimer=0,350);
    const [min,max,step]=limits(input),delta=Math.max(step,(max-min)/100*(event.shiftKey?.1:1));
    change(input,clampRangeValue(Number(input.value)-Math.sign(event.deltaY)*delta,min,max,step),true);
  },{passive:false});
  document.addEventListener('dblclick',event=>{
    const input=event.target.closest('.knob')?.querySelector('input[type="range"]');if(!input)return;
    event.preventDefault();onStart();change(input,Number(input.dataset.default??input.min),true);
  });
  document.addEventListener('click',event=>{
    const button=event.target.closest('[data-knob-value]');if(!button||button.parentElement.querySelector('.param-entry'))return;
    const range=button.closest('.param').querySelector('.knob input'),scale=range.dataset.unit==='%'?100:1,[min,max,step]=limits(range),entry=document.createElement('input');
    entry.type='number';entry.className='param-entry';entry.min=min*scale;entry.max=max*scale;entry.step=step*scale;entry.value=Number((Number(range.value)*scale).toFixed(5));entry.setAttribute('aria-label','Valeur de '+range.getAttribute('aria-label'));
    button.hidden=true;button.parentElement.append(entry);entry.focus();entry.select();let finished=false;
    const done=apply=>{if(finished)return;finished=true;const raw=entry.value.trim(),value=Number(raw);if(apply&&raw&&Number.isFinite(value)){onStart();change(range,clampRangeValue(value/scale,min,max,step),true);}entry.remove();button.hidden=false;};
    entry.addEventListener('keydown',e=>{if(e.key==='Enter'){e.preventDefault();done(true);}else if(e.key==='Escape'){e.preventDefault();done(false);}});entry.addEventListener('blur',()=>done(true));
  });
}
