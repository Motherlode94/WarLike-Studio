import {capturePreset,applyUserPreset,userPresets,storePreset} from './user-plugin-presets.js';
// Shared preset infrastructure. The host owns checkpointing and project persistence.
export function hardwarePresetBank(id,definition,factory,storage){
 return [...(factory[id]||[]).map((p,index)=>({...p,index,source:'factory'})),...userPresets(storage,id,definition).map(p=>({...p,source:'user'}))];
}
export function applyHardwarePreset(state,id,definition,preset){
 if(!preset)throw Error('Preset inconnu.');
 const checked=preset.source==='factory'?capturePreset(id,definition,preset.values,preset.name):preset;
 return applyUserPreset(state,checked,id,definition);
}
export function mountHardwareMasterPresets(root,{id,definition,state,factory,storage,checkpoint,changed,toast,busy,faceSelector,collection,sectionClass,saveAttribute}){
 const face=root.querySelector(faceSelector);if(!face||face.querySelector('.hardware-master-presets'))return;
 const bank=hardwarePresetBank(id,definition,factory,storage);
 const section=document.createElement('section');section.className='hardware-master-presets '+sectionClass;section.setAttribute('aria-label','Presets '+definition.name);
 section.innerHTML='<label>PRESET MODULE<select><option value="">Personnalisé / choisir…</option></select></label><label>NOM<input maxlength="60" placeholder="Mon preset"></label><button type="button">Enregistrer</button>';
 const pick=section.querySelector('select'),name=section.querySelector('input'),save=section.querySelector('button');pick.setAttribute('aria-label','Preset '+definition.name);save.setAttribute(saveAttribute,'');
 for(const source of ['factory','user']){
  const group=document.createElement('optgroup');group.label=source==='factory'?'Usine':'Mes presets · cet appareil';
  bank.forEach((p,i)=>{if(p.source===source)group.append(new Option(p.name,String(i)));});if(group.children.length)pick.append(group);
 }
 const guard=fn=>{try{if(busy())return toast('Termine la prise avant de modifier ce preset.');fn();}catch(error){toast(error.message);}};
 pick.onchange=()=>guard(()=>{if(pick.value==='')return;const p=bank[Number(pick.value)],copy={...state()};const label=applyHardwarePreset(copy,id,definition,p);checkpoint();Object.assign(state(),copy);changed();toast(label+' appliqué au Master.');});
 save.onclick=()=>guard(()=>{const p=capturePreset(id,definition,state(),name.value.trim());if(bank.some(x=>x.source==='user'&&x.name===p.name)&&!confirm('Remplacer '+p.name+' ?'))return;storePreset(storage,p,id,definition);changed();toast('Preset '+collection+' enregistré sur cet appareil.');});
 face.querySelector('header').after(section);
}
