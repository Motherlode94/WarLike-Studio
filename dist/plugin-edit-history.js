// UI-only, bounded history. Project/DSP data remains on its original track.
import {sliceSettings} from './sampler.js?v=0.14.0';
const copy=value=>structuredClone(value),equal=(a,b)=>JSON.stringify(a)===JSON.stringify(b);
const ownsSampler=(track,id)=>id==='instrument'&&track.type==='sampler';
function samplerEditState(raw={}){
  const value=raw??{},markers=Array.isArray(value.markers)?value.markers:[];
  // The sampler UI normalizes after calling changed(). Capture the same logical
  // settings so defaults and sorted/deduplicated cuts are not phantom edits.
  const duration=Math.max(0,...markers.filter(Number.isFinite));
  const settings=sliceSettings(value,duration);
  return {...settings,...Object.fromEntries(Object.entries(copy(value)).filter(([key])=>!Object.hasOwn(settings,key)))};
}
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
  const snapshot={values,comparison:id==='instrument'?null:copy(track.pluginComparisons?.[id]??null)};
  if(ownsSampler(track,id))snapshot.sampler=samplerEditState(track.sampler);
  return snapshot;
}
export function applyPluginEdit(track,id,definition,snapshot){
  const state=id==='instrument'?track.instrument:track.effects?.[id];
  if(!state||!snapshot?.values||definition.controls.some(c=>!Number.isFinite(snapshot.values[c.key])||snapshot.values[c.key]<c.min||snapshot.values[c.key]>c.max)||id!=='instrument'&&typeof snapshot.values.enabled!=='boolean')return false;
  let sampler;
  if(ownsSampler(track,id)){
    if(!snapshot.sampler||typeof snapshot.sampler!=='object'||Array.isArray(snapshot.sampler))return false;
    sampler=samplerEditState(snapshot.sampler);
    if(['assetId','mode','root','reverse','markers'].some(key=>!equal(sampler[key],snapshot.sampler[key])))return false;
  }
  const values=Object.fromEntries(definition.controls.map(c=>[c.key,snapshot.values[c.key]]));
  if(id!=='instrument')values.enabled=snapshot.values.enabled;
  Object.assign(state,values);
  if(sampler)track.sampler=sampler;
  if(id!=='instrument'){
    if(snapshot.comparison==null){if(track.pluginComparisons)delete track.pluginComparisons[id];}
    else{track.pluginComparisons??={};track.pluginComparisons[id]=copy(snapshot.comparison);}
  }
  return true;
}
