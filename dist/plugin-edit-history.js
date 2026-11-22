// UI-only, bounded history. Project/DSP data remains on its original track.
const copy=value=>structuredClone(value),equal=(a,b)=>JSON.stringify(a)===JSON.stringify(b);
export class PluginEditHistory {
  #entries=new Map();
  constructor(limit=40){this.limit=Math.max(1,Math.min(100,Math.trunc(limit)||40));}
  observe(key,signature,value,group){
    let entry=this.#entries.get(key);
    if(!entry||entry.signature!==signature){this.#entries.set(key,{signature,current:copy(value),past:[],future:[],group:null});return;}
    if(equal(value,entry.current))return;
    if(entry.group!==group||!entry.past.length){entry.past.push(copy(entry.current));if(entry.past.length>this.limit)entry.past.shift();}
    entry.current=copy(value);entry.future=[];entry.group=group;
  }
  canUndo(key){return !!this.#entries.get(key)?.past.length;}
  canRedo(key){return !!this.#entries.get(key)?.future.length;}
  step(key,redo=false){
    const entry=this.#entries.get(key);if(!entry)return null;
    const from=redo?entry.future:entry.past,to=redo?entry.past:entry.future;
    if(!from.length)return null;
    to.push(copy(entry.current));entry.current=from.pop();entry.group=null;
    return copy(entry.current);
  }
  forget(key){this.#entries.delete(key);}
  clear(){this.#entries.clear();}
}
export function capturePluginEdit(track,id,definition){
  const state=id==='instrument'?track.instrument:track.effects?.[id];if(!state)return null;
  const values=Object.fromEntries(definition.controls.map(c=>[c.key,state[c.key]??c.default]));
  if(id!=='instrument')values.enabled=state.enabled===true;
  return {values,comparison:id==='instrument'?null:copy(track.pluginComparisons?.[id]??null)};
}
export function applyPluginEdit(track,id,definition,snapshot){
  const state=id==='instrument'?track.instrument:track.effects?.[id];
  if(!state||!snapshot?.values||definition.controls.some(c=>!Number.isFinite(snapshot.values[c.key])||snapshot.values[c.key]<c.min||snapshot.values[c.key]>c.max)||id!=='instrument'&&typeof snapshot.values.enabled!=='boolean')return false;
  const values=Object.fromEntries(definition.controls.map(c=>[c.key,snapshot.values[c.key]]));
  if(id!=='instrument')values.enabled=snapshot.values.enabled;
  Object.assign(state,values);
  if(id!=='instrument'){
    if(snapshot.comparison==null){if(track.pluginComparisons)delete track.pluginComparisons[id];}
    else{track.pluginComparisons??={};track.pluginComparisons[id]=copy(snapshot.comparison);}
  }
  return true;
}
