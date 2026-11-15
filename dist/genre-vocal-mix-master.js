// WarLike-specific demo mixing and master-bus presets.
// These are applied to the actual insert graph and to BALANCE -> PRESS -> PEAK.
// Conservative factory values only; they are not LUFS or true-peak certifications.
import {EFFECTS} from './plugins.js';
import {MASTER_BASE_MODULES,masteringSettings} from './mastering.js';
const config={
 rock:{
  lead:{voxclean:{highpass:100,frequency:6300,range:3.5,air:.5},voxlevel:{peakThreshold:-17,levelThreshold:-25,ratio:2.8,mix:.9},voxambience:{slap:91,feedback:.09,room:.18,mix:.13}},
  backs:{voxclean:{highpass:135,range:3},voxdoubler:{mix:.19},voxambience:{slap:108,room:.24,mix:.16}},
  adlibs:{voxclean:{highpass:150,range:4},alterecho:{feedback:.22,mix:.16,duck:.7}},
  master:{balance:{cut:28,low:0,mid:.4,high:.3},press:{threshold:-17,ratio:1.9,attack:32,release:190,makeup:.5},peak:{drive:.5,ceiling:-1.2,release:150}}
 },
 pop:{
  lead:{voxclean:{highpass:85,frequency:6900,range:4.5,air:1},voxlevel:{peakThreshold:-14,levelThreshold:-23,ratio:2.3,mix:.85},voxambience:{slap:107,feedback:.06,room:.22,mix:.14}},
  backs:{voxclean:{highpass:120,range:4},voxdoubler:{mix:.24},voxambience:{slap:118,room:.32,mix:.18}},
  adlibs:{voxclean:{highpass:125,range:4},alterecho:{feedback:.2,mix:.17,duck:.75}},
  master:{balance:{cut:25,low:.2,mid:0,high:.65},press:{threshold:-16,ratio:1.45,attack:40,release:255,makeup:.25},peak:{drive:.25,ceiling:-1.3,release:180}}
 },
 rumba:{
  lead:{voxclean:{highpass:75,frequency:6100,range:3,air:-.5},voxlevel:{peakThreshold:-12,levelThreshold:-22,ratio:1.9,mix:.8},voxambience:{slap:115,feedback:.04,room:.27,mix:.15}},
  backs:{voxclean:{highpass:95,range:3},voxdoubler:{mix:.13},voxambience:{slap:120,room:.27,mix:.13}},
  adlibs:{voxclean:{highpass:120,range:3},alterecho:{feedback:.15,mix:.1,duck:.8}},
  master:{balance:{cut:23,low:.4,mid:-.25,high:-.1},press:{threshold:-15,ratio:1.4,attack:45,release:285,makeup:.25},peak:{drive:0,ceiling:-1.5,release:195}}
 }
};
export const DEMO_MIX_MASTER=Object.freeze(config);
function validateSettings(values,controls,location){
 for(const [key,value] of Object.entries(values)){
  const control=controls.find(c=>c.key===key);
  if(!control||!Number.isFinite(value)||value<control.min||value>control.max)throw Error('Réglage DSP invalide : '+location+'.'+key);
 }
}
export function validateDemoMix(style){
 const cfg=config[style];if(!cfg)throw Error('Style de mixage inconnu : '+style);
 for(const role of ['lead','backs','adlibs'])for(const [id,values] of Object.entries(cfg[role])){
  if(!EFFECTS[id])throw Error('Plugin absent : '+id);
  validateSettings(values,EFFECTS[id].controls,role+'.'+id);
 }
 for(const [id,values] of Object.entries(cfg.master))validateSettings(values,MASTER_BASE_MODULES[id].controls,'master.'+id);
 return true;
}
export function mixDemoVocalTrack(track,style,role){
 validateDemoMix(style);
 const cfg=config[style][role];if(!cfg)throw Error('Type de voix inconnu : '+role);
 for(const [id,params] of Object.entries(cfg)){
  if(!track.inserts.includes(id)||!track.effects[id])throw Error('Chaîne vocale incomplète : '+id);
  Object.assign(track.effects[id],params,{enabled:true});
 }
 return track;
}
export function makeDemoMastering(style){
 validateDemoMix(style);
 const state=config[style].master;
 return masteringSettings({
  inserts:['balance','press','peak'],bypass:false,
  ...Object.fromEntries(Object.entries(state).map(([id,p])=>[id,{...p,enabled:true}]))
 });
}
