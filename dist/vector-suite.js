import {capturePreset,applyUserPreset,userPresets,storePreset} from './user-plugin-presets.js';
export const VECTOR_IDS=Object.freeze(['vectoreq','vectorcomp','vectorlimit']);
export const isVector=id=>VECTOR_IDS.includes(id);
export function vectorPresetBank(id,definition,factory,storage){
 if(!isVector(id))return [];
 return [...(factory[id]||[]).map((p,index)=>({...p,index,source:'factory'})),...userPresets(storage,id,definition).map(p=>({...p,source:'user'}))];
}
export function applyVectorPreset(state,id,definition,preset){
 if(!isVector(id))throw Error('Module hors collection VECTOR.');
 if(preset.source==='factory'){
  const checked=capturePreset(id,definition,preset.values,preset.name);
  return applyUserPreset(state,checked,id,definition);
 }
 return applyUserPreset(state,preset,id,definition);
}
export function mountVectorMasterPresets(root,{id,definition,state,factory,storage,checkpoint,changed,toast,busy}){
 const face=root.querySelector('.vector-eq-hardware,.vector-comp-hardware,.vector-limit-hardware');if(!face||face.querySelector('.vector-master-presets'))return;
 const bank=vectorPresetBank(id,definition,factory,storage);
 const section=document.createElement('section');section.className='vector-master-presets';section.setAttribute('aria-label','Presets '+definition.name);
 section.innerHTML='<label>PRESET MODULE<select aria-label="Preset '+definition.name+'"><option value="">Personnalisé / choisir…</option></select></label><label>NOM<input maxlength="60" placeholder="Mon preset"></label><button type="button" data-vector-save>Enregistrer</button>';
 const pick=section.querySelector('select'),name=section.querySelector('input');
 for(const source of ['factory','user']){
  const group=document.createElement('optgroup');group.label=source==='factory'?'Usine':'Mes presets · cet appareil';
  bank.forEach((p,i)=>{if(p.source===source)group.append(new Option(p.name,String(i)));});if(group.children.length)pick.append(group);
 }
 const guard=fn=>{try{if(busy())return toast('Termine la prise avant de modifier ce preset.');fn();}catch(error){toast(error.message);}};
 pick.onchange=()=>guard(()=>{if(pick.value==='')return;const p=bank[Number(pick.value)],copy={...state()};const label=applyVectorPreset(copy,id,definition,p);checkpoint();Object.assign(state(),copy);changed();toast(label+' appliqué au Master.');});
 section.querySelector('[data-vector-save]').onclick=()=>guard(()=>{const value=name.value.trim();const p=capturePreset(id,definition,state(),value);if(bank.some(x=>x.source==='user'&&x.name===p.name)&&!confirm('Remplacer '+p.name+' ?'))return;storePreset(storage,p,id,definition);changed();toast('Preset VECTOR enregistré sur cet appareil.');});
 face.querySelector('header').after(section);
}
