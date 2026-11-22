export const GEOMETRY_KEY='warlike.window.geometry.v1';
export const WORKSPACES_KEY='warlike.window.layouts.v1';
export const WINDOW_IDS=Object.freeze(['plugin','rack','piano','mixer']);
export const profileId=p=>p==='fl'?'fl':'pt';
const clamp=(n,min,max)=>Math.max(min,Math.min(n,max));
export function validGeometry(g){
 if(!g||!['x','y','width','height'].every(k=>Number.isFinite(g[k])))return null;
 return {x:clamp(Math.round(g.x),0,10000),y:clamp(Math.round(g.y),0,10000),width:clamp(Math.round(g.width),160,10000),height:clamp(Math.round(g.height),85,10000)};
}
export function fitGeometry(g,vw,vh){
 const v=validGeometry(g);if(!v)return null;
 const width=Math.min(v.width,Math.max(1,vw-16)),height=Math.min(v.height,Math.max(1,vh-16));
 return {width,height,x:clamp(v.x,8,Math.max(8,vw-width-8)),y:clamp(v.y,8,Math.max(8,vh-height-8))};
}
export function sanitizeGeometryMap(x){
 const safe={};for(const id of [...WINDOW_IDS,...Object.keys(x||{}).filter(id=>id.startsWith('plugin:')&&id.length<=400).slice(-256)]){const g=validGeometry(x?.[id]);if(g)safe[id]=g;}return safe;
}
function read(storage,key,fallback){try{return JSON.parse(storage.getItem(key)||'null')??fallback;}catch{return fallback;}}
export function readGeometry(storage,profile){return sanitizeGeometryMap(read(storage,GEOMETRY_KEY,{})?.[profileId(profile)]);}
export function writeGeometry(storage,profile,map){
 const all={pt:readGeometry(storage,'pt'),fl:readGeometry(storage,'fl')};all[profileId(profile)]=sanitizeGeometryMap(map);storage.setItem(GEOMETRY_KEY,JSON.stringify(all));return all[profileId(profile)];
}
export function normalizeLayout(value){
 if(!value||typeof value.name!=='string'||!value.name.trim()||value.name.trim().length>60)return null;
 return {name:value.name.trim(),profile:profileId(value.profile),view:['arrange','mixer','library','mastering'].includes(value.view)?value.view:'arrange',detailOpen:value.detailOpen===true,inspectorOpen:value.inspectorOpen===true,detailHeight:Number.isFinite(value.detailHeight)?clamp(Math.round(value.detailHeight),180,1000):null,windows:sanitizeGeometryMap(value.windows)};
}
export function readLayouts(storage){const raw=read(storage,WORKSPACES_KEY,[]);return Array.isArray(raw)?raw.slice(0,32).map(normalizeLayout).filter(Boolean):[];}
export function saveLayout(storage,value){
 const layout=normalizeLayout(value);if(!layout)throw Error('Nom de disposition invalide.');
 const all=readLayouts(storage),index=all.findIndex(x=>x.name===layout.name);
 if(index<0){if(all.length>=32)throw Error('Limite de 32 dispositions.');all.push(layout);}else all[index]=layout;
 storage.setItem(WORKSPACES_KEY,JSON.stringify(all));return layout;
}
export function deleteLayout(storage,name){storage.setItem(WORKSPACES_KEY,JSON.stringify(readLayouts(storage).filter(x=>x.name!==name)));}
