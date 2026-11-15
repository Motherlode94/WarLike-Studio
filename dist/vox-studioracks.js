// VOX STUDIORACKS — real insert-chain presets; not a decorative plugin.
// Each stage is an existing Web Audio processor. Studio's normal inserts
// retain responsibility for Play, bypass, automation, persistence and WAV export.
import {EFFECTS,ensurePlugins,placeInsert,moveInsert} from './plugins.js?v=0.14.0';
import {STUDIORACK_MIX_PRESETS,STUDIORACK_CATEGORIES} from './studiorack-mix-presets.js';
export {STUDIORACK_CATEGORIES};

const rack=(name,description,stages)=>({name,category:'Voix',description,stages});
export const VOX_STUDIORACKS=Object.freeze({
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
 ,...STUDIORACK_MIX_PRESETS
});

export function rackCapacity(track,key){
 const preset=VOX_STUDIORACKS[key];if(!preset)throw Error('Preset de rack inconnu.');
 ensurePlugins(track);
 for(const stage of preset.stages)if(!EFFECTS[stage.id])throw Error('DSP indisponible : '+stage.id);
 return {required:preset.stages.length,available:track.inserts.filter(id=>id===null).length};
}
export function applyVoxStudioRack(track,key){
 const preset=VOX_STUDIORACKS[key],capacity=rackCapacity(track,key);
 if(capacity.available<capacity.required)throw Error('VOX STUDIORACKS : '+capacity.required+' inserts libres requis ('+capacity.available+' disponibles).');
 // Preflight all controls before modifying any project data.
 for(const stage of preset.stages){
  const controls=EFFECTS[stage.id].controls;
  for(const [param,value] of Object.entries(stage.values)){
   const c=controls.find(x=>x.key===param);
   if(!c||!Number.isFinite(value)||value<c.min||value>c.max)throw Error('Preset invalide : '+stage.id+'.'+param);
  }
 }
 const added=[];
 for(const stage of preset.stages){
  const slot=track.inserts.indexOf(null),id=placeInsert(track,slot,stage.id);
  // placeInsert can allocate a unique instance ID if the same type already exists.
  track.effects[id]={...track.effects[id],...stage.values,enabled:true};
  added.push({id,slot});
 }
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
