// Browser-local presets, independent of project ownership and factory banks.
// Only numeric controls of the declared plugin are accepted; no executable data.
export const PRESET_KEY='warlike.plugin.user-presets.v1';
export function validatePreset(input,id,def){
 if(!input||input.format!=='warlike-plugin-preset'||input.version!==1||input.plugin!==id||typeof input.name!=='string'||!input.name.trim()||input.name.trim().length>60||!input.values||!def?.controls)throw Error('Preset incompatible ou invalide.');
 const values={};for(const c of def.controls){const v=input.values[c.key];if(!Number.isFinite(v)||v<c.min||v>c.max)throw Error('Valeur invalide : '+c.key);values[c.key]=v;}
 return {format:'warlike-plugin-preset',version:1,plugin:id,name:input.name.trim(),values};
}
export function capturePreset(id,def,state,name){return validatePreset({format:'warlike-plugin-preset',version:1,plugin:id,name,values:Object.fromEntries(def.controls.map(c=>[c.key,state[c.key]??c.default]))},id,def);}
function read(storage){const raw=storage.getItem(PRESET_KEY);if(!raw)return [];const list=JSON.parse(raw);if(!Array.isArray(list))throw Error('Bibliothèque personnelle invalide.');return list;}
export function userPresets(storage,id,def){try{return read(storage).filter(p=>p?.plugin===id).flatMap(p=>{try{return [validatePreset(p,id,def)];}catch{return [];}});}catch{return [];}}
export function storePreset(storage,preset,id,def){
 const value=validatePreset(preset,id,def),all=read(storage),i=all.findIndex(p=>p?.plugin===id&&p.name===value.name);
 if(i<0){if(all.filter(p=>p?.plugin===id).length>=64||all.length>=1024)throw Error('Limite de presets personnels atteinte.');all.push(value);}else all[i]=value;
 storage.setItem(PRESET_KEY,JSON.stringify(all));return value;
}
export function removePreset(storage,id,name){const all=read(storage);storage.setItem(PRESET_KEY,JSON.stringify(all.filter(p=>!(p?.plugin===id&&p.name===name))));}
export function applyUserPreset(state,preset,id,def){const valid=validatePreset(preset,id,def);Object.assign(state,valid.values);return valid.name;}
