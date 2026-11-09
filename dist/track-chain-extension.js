import {EFFECTS,ensurePlugins,placeInsert} from './plugins.js?v=0.14.0';
export const TRACK_CHAIN_ID='studio-vocal-chains';
export const TRACK_CHAIN_SCHEMA='warlike.studio.track-chains.v1';
export function validateTrackChains(data){
 if(!data||data.schema!==TRACK_CHAIN_SCHEMA||!Array.isArray(data.presets)||!data.presets.length||data.presets.length>30)throw Error('Pack de chaînes invalide.');
 const ids=new Set();return {schema:TRACK_CHAIN_SCHEMA,presets:data.presets.map(p=>{
  if(!p||typeof p.id!=='string'||!/^[a-z0-9-]{2,50}$/.test(p.id)||ids.has(p.id)||typeof p.name!=='string'||!p.name.trim()||p.name.length>70||!Array.isArray(p.effects)||!p.effects.length||p.effects.length>6)throw Error('Chaîne invalide.');ids.add(p.id);
  const effects=p.effects.map(e=>{if(!e||!Object.hasOwn(EFFECTS,e.id)||!e.params||typeof e.params!=='object'||Array.isArray(e.params))throw Error('Effet inconnu.');const controls=EFFECTS[e.id].controls,params={};for(const [key,value] of Object.entries(e.params)){const c=controls.find(x=>x.key===key);if(!c||typeof value!=='number'||!Number.isFinite(value)||value<c.min||value>c.max)throw Error('Paramètre d’effet invalide : '+key);params[key]=value}return {id:e.id,params}});
  return {id:p.id,name:p.name.trim(),effects};
 })};
}
export function installedTrackChains(storage){try{const entries=JSON.parse(storage.getItem('warlike.extensions.v1')||'{}'),p=entries[TRACK_CHAIN_ID];if(!p?.enabled||p.schema!==TRACK_CHAIN_SCHEMA)return [];return validateTrackChains(p.data).presets}catch{return []}}
export function applyTrackChain(track,preset){
 const p=validateTrackChains({schema:TRACK_CHAIN_SCHEMA,presets:[preset]}).presets[0];ensurePlugins(track);if(track.inserts.filter(x=>x===null).length<p.effects.length)throw Error('Pas assez d’inserts libres sur cette piste.');
 for(const effect of p.effects){const slot=track.inserts.indexOf(null),id=placeInsert(track,slot,effect.id);Object.assign(track.effects[id],effect.params,{enabled:true});}
 return p.name;
}
