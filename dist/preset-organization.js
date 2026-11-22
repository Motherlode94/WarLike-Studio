// R08.3g.6 — Shared logical paths and namespaced favorites.
// References source catalogs; no duplicate DSP presets or mutable registry copies.
export const PRESET_FAVORITES_KEY='warlike.studio.preset-favorites.v1';
export const presetPath=(...parts)=>parts.map(x=>String(x).trim()).filter(Boolean).join(' / ');
export const presetKey=(domain,id)=>domain+':'+id;
export const normalizePresetText=text=>String(text??'').normalize('NFD').replace(/\p{M}/gu,'').toLocaleLowerCase();
export function readPresetFavorites(storage){
 try{
  const values=JSON.parse(storage?.getItem(PRESET_FAVORITES_KEY)||'[]');
  return Array.isArray(values)?[...new Set(values.filter(v=>typeof v==='string'&&/^(instru|factory|mix|master):/.test(v)).slice(0,1000))]:[];
 }catch{return []}
}
export function setPresetFavorite(storage,domain,id,on){
 const key=presetKey(domain,id),items=new Set(readPresetFavorites(storage));
 if(on)items.add(key);else items.delete(key);
 storage?.setItem(PRESET_FAVORITES_KEY,JSON.stringify([...items]));
 return [...items];
}
export function presetMatches(entry,{query='',path='all',favoritesOnly=false,favorites=[]}={}){
 const terms=normalizePresetText(query).trim().split(/\s+/).filter(Boolean);
 const directory=presetPath(...(entry.folders||[]));
 const hay=normalizePresetText([entry.name,entry.description,entry.tags,entry.genre,entry.category,directory].join(' '));
 return (path==='all'||directory===path||directory.startsWith(path+' / '))
  &&(!favoritesOnly||favorites.includes(entry.favoriteKey))
  &&terms.every(t=>hay.includes(t));
}
export function presetFolderTree(entries){
 const root=new Map();
 for(const entry of entries){
  let node=root;
  for(const part of entry.folders||[]){
   if(!node.has(part))node.set(part,{folders:new Map(),entries:[]});
   node=node.get(part).folders;
  }
  // terminal items can coexist with descendants
  if(!node.has(''))node.set('',{folders:new Map(),entries:[]});
  node.get('').entries.push(entry);
 }
 return root;
}
export function flattenPresetPaths(entries){
 return [...new Set(entries.map(entry=>presetPath(...(entry.folders||[]))).filter(Boolean))].sort((a,b)=>a.localeCompare(b,'fr'));
}
