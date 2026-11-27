// A rack is an ordered serial graph; a split occupies one serial slot and sums
// independent processing lanes back into that slot. No feedback or nested split.
export const RACK_LIMITS=Object.freeze({slots:12,branches:8,modules:64,macros:8,targets:8});
const own=(o,k)=>Object.hasOwn(o||{},k),copy=x=>structuredClone(x),clamp=(x,a,b)=>Math.max(a,Math.min(b,x));
const uid=()=>Math.random().toString(36).slice(2,10);
export const rackType=id=>String(id||'').split('__')[0];
export const rackDefinition=(registry,id)=>registry[rackType(id)];
export const rackIsSplit=id=>typeof id==='string'&&/^split__[a-z0-9]{1,20}$/.test(id);
export function rackModuleSettings(def,value,enabled){return {enabled:enabled&&value?.enabled===true,...Object.fromEntries(def.controls.map(c=>[c.key,clamp(Number.isFinite(value?.[c.key])?value[c.key]:c.default,c.min,c.max)]))};}
export function rackLeaves(state){return [...(state.inserts||[]).filter(id=>id&&!rackIsSplit(id)),...Object.values(state.splits||{}).flatMap(s=>s.branches.flatMap(b=>b.inserts.filter(Boolean)))];}
export function normalizeRack(value,registry){
 const v=value||{},modern=v.rackVersion===2,seen=new Set(),splits={};
 const valid=id=>typeof id==='string'&&/^[a-z][a-z0-9]*(?:__[a-z0-9]{1,20})?$/.test(id)&&own(registry,rackType(id));
 function leaf(id){if(!id)return null;if(!valid(id)||!modern&&!own(registry,id)||seen.has(id)){if(modern)throw Error('Module inconnu ou instance utilisée deux fois.');return null;}seen.add(id);if(seen.size>RACK_LIMITS.modules)throw Error('Maximum 64 modules par rack.');return id;}
 const raw=Array.isArray(v.inserts)?v.inserts:Object.keys(registry).filter(id=>v[id]?.enabled),inserts=Array.from({length:12},(_,i)=>{
  const id=raw[i];if(!rackIsSplit(id))return leaf(id);
  if(!modern||own(splits,id))throw Error('Division de rack invalide.');const s=v.splits?.[id];
  if(!s||!['parallel','bands'].includes(s.kind)||!Array.isArray(s.branches)||s.branches.length<2||s.branches.length>8||s.kind==='bands'&&s.branches.length>5)throw Error('Une division exige 2 à 8 voies (5 bandes maximum).');
  const branchIds=new Set(),branches=s.branches.map((b,i)=>{if(!b||typeof b.id!=='string'||!/^b[a-z0-9]{1,20}$/.test(b.id)||branchIds.has(b.id)||!Array.isArray(b.inserts)||b.inserts.length>12)throw Error('Voie de rack invalide.');branchIds.add(b.id);if(!['stereo','mid','side','left','right'].includes(b.mode||'stereo'))throw Error('Mode de voie invalide.');return {id:b.id,name:String(b.name||'Voie '+(i+1)).slice(0,40),inserts:Array.from({length:12},(_,j)=>leaf(b.inserts[j])),gainDb:clamp(Number.isFinite(b.gainDb)?b.gainDb:0,-60,12),pan:clamp(Number.isFinite(b.pan)?b.pan:0,-1,1),mute:b.mute===true,solo:b.solo===true,mode:b.mode||'stereo'};});
  let frequencies=[];if(s.kind==='bands'){if(!Array.isArray(s.frequencies)||s.frequencies.length!==branches.length-1||s.frequencies.some((f,i)=>!Number.isFinite(f)||f<40||f>18000||i&&f<=s.frequencies[i-1]))throw Error('Fréquences croissantes entre 40 Hz et 18 kHz requises.');frequencies=[...s.frequencies];}
  splits[id]={kind:s.kind,enabled:s.enabled!==false,branches,frequencies};return id;
 });
 if(modern&&raw.length>12)throw Error('Maximum 12 emplacements dans la chaîne principale.');
 if(modern)for(const id of seen){const d=rackDefinition(registry,id),vstate=v[id];if(!vstate||typeof vstate.enabled!=='boolean'||d.controls.some(c=>!Number.isFinite(vstate[c.key])))throw Error('Paramètres incomplets ou invalides pour '+id);}
 const result={inserts,bypass:v.bypass===true,...Object.fromEntries(Object.entries(registry).map(([id,def])=>[id,rackModuleSettings(def,v[id],seen.has(id))]))};
 for(const id of seen)if(!own(registry,id))result[id]=rackModuleSettings(rackDefinition(registry,id),v[id],true);
 if(modern){const targets=new Set();const macros=(Array.isArray(v.macros)?v.macros:[]);if(macros.length>8)throw Error('Maximum huit macros.');
  result.rackVersion=2;result.inputDb=clamp(Number.isFinite(v.inputDb)?v.inputDb:0,-24,24);result.outputDb=clamp(Number.isFinite(v.outputDb)?v.outputDb:0,-24,12);result.mix=clamp(Number.isFinite(v.mix)?v.mix:1,0,1);result.splits=splits;
  result.macros=macros.map((m,i)=>{if(!m||!Array.isArray(m.targets)||m.targets.length>8)throw Error('Macro invalide.');return {name:String(m.name||'Macro '+(i+1)).slice(0,30),value:clamp(Number.isFinite(m.value)?m.value:0,0,1),targets:m.targets.map(t=>{const def=rackDefinition(registry,t.moduleId),c=def?.controls.find(c=>c.key===t.key),key=t.moduleId+'.'+t.key;if(!seen.has(t.moduleId)||!c||targets.has(key)||!Number.isFinite(t.min)||!Number.isFinite(t.max)||t.min<c.min||t.min>c.max||t.max<c.min||t.max>c.max)throw Error('Affectation de macro incompatible ou déjà utilisée.');targets.add(key);return {moduleId:t.moduleId,key:t.key,min:t.min,max:t.max};})};});
 }
 return result;
}
export function rackLocation(state,{splitId=null,branchId=null,index=0}={}){if(!Number.isInteger(index)||index<0||index>=12)throw Error('Emplacement invalide.');const list=splitId?state.splits?.[splitId]?.branches.find(b=>b.id===branchId)?.inserts:state.inserts;if(!list)throw Error('Voie introuvable.');return {list,index};}
const modern=state=>{state.rackVersion=2;state.splits??={};state.macros??=[];state.inputDb??=0;state.outputDb??=0;state.mix??=1;};
function freshId(state,type){return rackLeaves(state).includes(type)?type+'__'+uid():type;}
export function placeRackModule(state,location,type,registry){const def=registry[type];if(!def)throw Error('Module inconnu.');const {list,index}=rackLocation(state,location);if(list[index])throw Error('Retire le module de cet emplacement avant d’en ajouter un.');if(rackLeaves(state).length>=64)throw Error('Maximum 64 modules.');const id=freshId(state,type);if(id!==type||location.splitId)modern(state);state[id]={enabled:true,...Object.fromEntries(def.controls.map(c=>[c.key,c.default]))};list[index]=id;return id;}
export function removeRackItem(state,location){const {list,index}=rackLocation(state,location),id=list[index];if(!id)return;list[index]=null;if(rackIsSplit(id)){for(const b of state.splits[id].branches)for(const child of b.inserts)if(child)delete state[child];delete state.splits[id];}else if(id.includes('__'))delete state[id];else state[id].enabled=false;const alive=new Set(rackLeaves(state));for(const m of state.macros||[])m.targets=m.targets.filter(t=>alive.has(t.moduleId));}
export function insertRackSplit(state,index,kind='parallel'){modern(state);if(!Number.isInteger(index)||index<0||index>=12)throw Error('Emplacement invalide.');if(state.inserts[index])throw Error('Choisis un emplacement vide.');if(!['parallel','bands'].includes(kind))throw Error('Division inconnue.');const id='split__'+uid(),count=2;state.splits[id]={kind,enabled:true,frequencies:kind==='bands'?[1000]:[],branches:Array.from({length:count},(_,i)=>({id:'b'+uid(),name:kind==='bands'?(i?'Aigus':'Graves'):'Voie '+(i+1),inserts:Array(12).fill(null),gainDb:kind==='bands'?0:-20*Math.log10(count),pan:0,mute:false,solo:false,mode:'stereo'}))};state.inserts[index]=id;return id;}
export function moveRackItem(state,from,to,{duplicate=false}={}){const a=rackLocation(state,from),b=rackLocation(state,to),id=a.list[a.index];if(!id||a.list===b.list&&a.index===b.index)return;if((rackIsSplit(id)&&to.splitId)||(rackIsSplit(b.list[b.index])&&from.splitId))throw Error('Une division reste dans la chaîne principale.');
 if(duplicate){if(rackIsSplit(id))throw Error('Duplique les modules des voies séparément.');if(b.list[b.index])throw Error('La destination de la copie doit être vide.');modern(state);const next=rackType(id)+'__'+uid();state[next]=copy(state[id]);b.list[b.index]=next;}else [a.list[a.index],b.list[b.index]]=[b.list[b.index],id];}
export function setRackMacro(state,index,value){const m=state.macros?.[index];if(!m)throw Error('Macro introuvable.');m.value=clamp(value,0,1);for(const t of m.targets)state[t.moduleId][t.key]=t.min+m.value*(t.max-t.min);}
export const moduleLatency=id=>['press','peak','glue','exostrip','circuitbus','vectorcomp','vectorlimit'].includes(rackType(id))?.006:rackType(id)==='voxlevel'?.012:rackType(id)==='voxtune'?.04:0;
export function rackItemLatency(state,id){if(rackIsSplit(id)){const s=state.splits[id];return !s.enabled?0:Math.max(...s.branches.map(b=>b.inserts.reduce((n,id)=>n+(id&&state[id]?.enabled?moduleLatency(id):0),0)));}return state[id]?.enabled?moduleLatency(id):0;}
export const masterRackLatency=state=>state.bypass?0:state.inserts.reduce((n,id)=>n+(id?rackItemLatency(state,id):0),0);
