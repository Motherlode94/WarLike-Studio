// VOX STUDIORACKS — real insert-chain presets; not a decorative plugin.
// Each stage is an existing Web Audio processor. Studio's normal inserts
// retain responsibility for Play, bypass, automation, persistence and WAV export.
import {EFFECTS,ensurePlugins,placeInsert,moveInsert} from './plugins.js?v=0.14.0';
import {STUDIORACK_MIX_PRESETS,STUDIORACK_CATEGORIES} from './studiorack-mix-presets.js';
import {GENRE_RACK_PRESETS,GENRE_RACK_CATEGORIES} from './genre-rack-presets.js';
export const RACK_CATEGORIES=Object.freeze([...GENRE_RACK_CATEGORIES,...STUDIORACK_CATEGORIES]);

const rack=(name,description,stages)=>({name,category:'Voix',description,stages});
export const VOX_STUDIORACKS=Object.freeze({
 futuristLead:rack('TRAP / FUTURIST LEAD','Esthétique trap futuriste : accordage très rapide, transposition légère, saturation contrôlée et écho. Une création originale, pas une reproduction de voix.',[
  {id:'voxclean',values:{highpass:105,range:5}},
  {id:'voxtune',values:{speed:5,amount:1,mix:1}},
  {id:'voxshift',values:{semitones:2,mix:.65}},
  {id:'voxlevel',values:{peakThreshold:-17,levelThreshold:-27,ratio:3.5}},
  {id:'voxwarm',values:{drive:7,mix:.3,output:-3}},
  {id:'alterecho',values:{beats:.25,feedback:.22,mix:.14}}
 ]),
 babyVoice:rack('BABY VOICE / HIGH','Voix rap plus aiguë : véritable pitch shift et coloration de résonances. À doser pour éviter l’effet cartoon involontaire.',[
  {id:'voxclean',values:{highpass:125,range:4}},
  {id:'voxtune',values:{speed:10,amount:.95,mix:1}},
  {id:'voxshift',values:{semitones:7,mix:1}},
  {id:'voxformant',values:{shift:4,brightness:2.5,mix:.8}},
  {id:'voxlevel',values:{peakThreshold:-16,levelThreshold:-27,ratio:2.8}},
  {id:'sibil',values:{frequency:7600,range:5}}
 ]),
 babyAdlibs:rack('BABY VOICE / ADLIBS','Adlibs aigus modulés, élargissement stéréo et répétitions courtes.',[
  {id:'voxclean',values:{highpass:150,range:4}},
  {id:'voxshift',values:{semitones:9,mix:1}},
  {id:'voxformant',values:{shift:5,brightness:3,mix:.85}},
  {id:'voxdoubler',values:{delay:21,detune:10,width:.9,mix:.25}},
  {id:'alterecho',values:{beats:.25,feedback:.28,mix:.2}}
 ]),
 trapLead:rack('TRAP / LEAD','Coupe-bas, accordage, densité, couleur et slapback.',[
  {id:'voxclean',values:{highpass:90,range:5}},
  {id:'voxtune',values:{speed:12,amount:.92,mix:1}},
  {id:'voxlevel',values:{peakThreshold:-15,levelThreshold:-27,ratio:3}},
  {id:'voxwarm',values:{drive:6,mix:.3,output:-2}},
  {id:'voxambience',values:{slap:93,room:.12,mix:.19}}
 ]),
 afroLead:rack('AFRO / LEAD','Correction naturelle, air et ambiance légère.',[
  {id:'voxclean',values:{highpass:95,range:4}},
  {id:'voxtune',values:{speed:85,amount:.6,mix:.75}},
  {id:'voxlevel',values:{peakThreshold:-12,levelThreshold:-22,ratio:2}},
  {id:'voxaireq',values:{air:2.5,presence:1,mix:.8}},
  {id:'voxambience',values:{slap:125,room:.32,mix:.24}}
 ]),
 rnbSilk:rack('R&B / SILK','Douceur, harmonisation des niveaux et élargissement discret.',[
  {id:'voxmicmodel',values:{source:0,target:1,air:1}},
  {id:'voxclean',values:{highpass:75,range:3}},
  {id:'voxlevel',values:{peakThreshold:-11,levelThreshold:-23,ratio:2}},
  {id:'voxwarm',values:{drive:3,mix:.22,output:-1}},
  {id:'voxdoubler',values:{delay:24,detune:8,width:.8,mix:.2}},
  {id:'voxambience',values:{slap:118,room:.42,mix:.28}}
 ]),
 cleanVoice:rack('VOICE / CLEAN','Voix claire, réduction des sifflantes et présence.',[
  {id:'voxclean',values:{highpass:85,range:6}},
  {id:'sibil',values:{frequency:6500,range:6}},
  {id:'voxlevel',values:{peakThreshold:-13,levelThreshold:-24,ratio:2.5}},
  {id:'voxaireq',values:{presence:1.5,air:1.5}}
 ])
 ,...STUDIORACK_MIX_PRESETS,...GENRE_RACK_PRESETS
});

/**
 * A rack preset is an install plan: ordered real DSP instances and parameter
 * values, not another VST window. Build the plan without editing the track.
 */
export function planVoxStudioRack(track,key){
 const preset=VOX_STUDIORACKS[key];
 if(!preset)throw Error('Preset de rack inconnu.');
 const slots=Array.isArray(track?.inserts)?track.inserts:[];
 const available=slots.filter(id=>id===null).length;
 const stages=preset.stages.map(stage=>{
  const definition=EFFECTS[stage.id];
  if(!definition)throw Error('DSP indisponible : '+stage.id);
  const values={};
  for(const [param,value] of Object.entries(stage.values)){
   const control=definition.controls.find(c=>c.key===param);
   if(!control||!Number.isFinite(value)||value<control.min||value>control.max)
    throw Error('Preset invalide : '+stage.id+'.'+param);
   values[param]=value;
  }
  return {id:stage.id,name:definition.name,values};
 });
 return {key,name:preset.name,category:preset.category||'Voix',description:preset.description,
  required:stages.length,available,canApply:available>=stages.length,stages};
}
export function rackCapacity(track,key){
 const plan=planVoxStudioRack(track,key);
 return {required:plan.required,available:plan.available};
}
export function applyVoxStudioRack(track,key){
 const plan=planVoxStudioRack(track,key);
 if(!plan.canApply)throw Error('VOX STUDIORACKS : '+plan.required+' inserts libres requis ('+plan.available+' disponibles).');
 // Build the new chain on a copy. Invalid stages or capacity cannot leave a
 // half-installed rack on the original project.
 const draft=structuredClone(track);
 ensurePlugins(draft);
 const added=[];
 for(const stage of plan.stages){
  const slot=draft.inserts.indexOf(null),id=placeInsert(draft,slot,stage.id);
  draft.effects[id]={...draft.effects[id],...stage.values,enabled:true};
  added.push({id,slot});
 }
 track.inserts=draft.inserts;track.effects=draft.effects;
 track.voxStudioRack={preset:key,stages:added.map(x=>x.id)};
 return added;
}
export function shiftVoxStudioInsert(track,slot,direction){
 ensurePlugins(track);const target=slot+direction;
 if(!Number.isInteger(slot)||![-1,1].includes(direction)||target<0||target>=track.inserts.length||!track.inserts[slot])return false;
 moveInsert(track,slot,target);return true;
}
export function bypassVoxStudioInsert(track,id){
 ensurePlugins(track);if(!track.inserts.includes(id))throw Error('Insert absent.');
 track.effects[id].enabled=!track.effects[id].enabled;
 return track.effects[id].enabled;
}
