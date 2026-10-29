import {SAMPLER_INSTRUMENT} from './sampler.js?v=0.14.0';
import {EXO_INSTRUMENT,EXO_WAVES} from './exo.js?v=0.14.0';
import {PACK_EFFECTS} from './packs.js?v=0.14.0';
// CHAYAH's first-party instrument and effect registry. These are Web Audio
// processors, not native VST binaries. Each definition owns its controls/defaults.
import {ACOUSTIC_INSTRUMENTS} from './acoustic.js?v=0.14.0';
export const INSTRUMENTS = {
  ...ACOUSTIC_INSTRUMENTS,
  sampler:SAMPLER_INSTRUMENT,
  exo:EXO_INSTRUMENT,
  drums:{name:'PULSE',subtitle:'DRUM MACHINE',color:'#d9a06f',description:'Huit voix de percussion synthétisées. Aucun sample externe.',controls:[
    {key:'punch',name:'Punch',min:.2,max:1,step:.01,default:.85,unit:'%'},
    {key:'decay',name:'Decay',min:.1,max:.8,step:.01,default:.38,unit:'s'},
    {key:'hat',name:'Hi-hats',min:.1,max:1,step:.01,default:.75,unit:'%'}]},
  bass:{name:'MONO',subtitle:'808 SYNTHESIZER',color:'#b3acdf',description:'Sub oscillateur, attaque descendante et harmoniques réglables.',controls:[
    {key:'body',name:'Body',min:.1,max:1,step:.01,default:.6,unit:'%'},
    {key:'harmonics',name:'Harmonics',min:0,max:.5,step:.01,default:.08,unit:'%'},
    {key:'release',name:'Release',min:.03,max:1,step:.01,default:.16,unit:'s'}]},
  keys:{name:'VELVET',subtitle:'POLYPHONIC SYNTH',color:'#94b7aa',description:'Deux oscillateurs, désaccordage et enveloppe douce.',controls:[
    {key:'attack',name:'Attack',min:.005,max:.6,step:.001,default:.018,unit:'s'},
    {key:'release',name:'Release',min:.05,max:2,step:.01,default:.5,unit:'s'},
    {key:'detune',name:'Detune',min:0,max:25,step:.1,default:5,unit:'ct'}]},
  lead:{name:'NOVA',subtitle:'DUAL OSC LEAD',color:'#d0bd7d',description:'Deux oscillateurs en dents de scie, filtre et enveloppe courte pour les mélodies.',controls:[
    {key:'cutoff',name:'Cutoff',min:200,max:12000,step:10,default:3200,unit:'Hz'},
    {key:'detune',name:'Detune',min:0,max:35,step:.1,default:8,unit:'ct'},
    {key:'release',name:'Release',min:.04,max:1.2,step:.01,default:.18,unit:'s'}]},
  pad:{name:'HALO',subtitle:'ATMOSPHERIC PAD',color:'#91afcb',description:'Une nappe à deux oscillateurs désaccordés, avec attaque et relâchement longs.',controls:[
    {key:'attack',name:'Attack',min:.05,max:2,step:.01,default:.45,unit:'s'},
    {key:'release',name:'Release',min:.2,max:4,step:.01,default:1.6,unit:'s'},
    {key:'width',name:'Detune',min:0,max:35,step:.1,default:12,unit:'ct'}]},
  pluck:{name:'STRING',subtitle:'PLUCK SYNTH',color:'#c194b3',description:'Un son pincé à décroissance rapide, avec corps et brillance réglables.',controls:[
    {key:'decay',name:'Decay',min:.04,max:1.5,step:.01,default:.3,unit:'s'},
    {key:'brightness',name:'Brightness',min:500,max:12000,step:10,default:5000,unit:'Hz'},
    {key:'body',name:'Body',min:.05,max:.6,step:.01,default:.18,unit:'%'}]}
};
export const EFFECTS = {
  color:{name:'COLOR',subtitle:'SATURATION',controls:[{key:'drive',name:'Drive',min:0,max:1,step:.01,default:.12,unit:'%'},{key:'mix',name:'Mix',min:0,max:1,step:.01,default:1,unit:'%'},{key:'output',name:'Output',min:-18,max:6,step:.25,default:0,unit:'dB'}]},
  sculpt:{name:'SCULPT',subtitle:'FILTER / EQ',controls:[{key:'highpass',name:'Low cut',min:20,max:1000,step:1,default:20,unit:'Hz'},{key:'cutoff',name:'High cut',min:300,max:20000,step:10,default:18000,unit:'Hz'}]},
  echo:{name:'ECHO',subtitle:'TEMPO DELAY',controls:[{key:'mix',name:'Mix',min:0,max:.65,step:.01,default:0,unit:'%'},{key:'feedback',name:'Feedback',min:.05,max:.75,step:.01,default:.3,unit:'%'}]},
  aura:{name:'AURA',subtitle:'STEREO REVERB',controls:[{key:'mix',name:'Space',min:0,max:.7,step:.01,default:0,unit:'%'}]},
  prism:{name:'PRISM',subtitle:'THREE-BAND EQ',controls:[{key:'low',name:'Low gain',min:-18,max:18,step:.5,default:0,unit:'dB'},{key:'mid',name:'Mid gain',min:-18,max:18,step:.5,default:0,unit:'dB'},{key:'high',name:'High gain',min:-18,max:18,step:.5,default:0,unit:'dB'},{key:'lowFreq',name:'Low freq',min:40,max:400,step:1,default:120,unit:'Hz'},{key:'midFreq',name:'Mid freq',min:200,max:6000,step:10,default:1500,unit:'Hz'},{key:'highFreq',name:'High freq',min:2000,max:16000,step:100,default:8000,unit:'Hz'},{key:'q',name:'Mid Q',min:.2,max:8,step:.1,default:.8,unit:'Q'}]},
  glue:{name:'GLUE',subtitle:'DYNAMICS COMPRESSOR',defaultEnabled:false,controls:[{key:'threshold',name:'Threshold',min:-60,max:0,step:.5,default:-18,unit:'dB'},{key:'ratio',name:'Ratio',min:1,max:12,step:.1,default:3,unit:':1'},{key:'attack',name:'Attack',min:1,max:100,step:1,default:12,unit:'ms'},{key:'release',name:'Release',min:20,max:1000,step:10,default:180,unit:'ms'},{key:'makeup',name:'Make-up',min:0,max:18,step:.5,default:0,unit:'dB'},{key:'knee',name:'Knee',min:0,max:30,step:1,default:6,unit:'dB'},{key:'mix',name:'Mix',min:0,max:1,step:.01,default:1,unit:'%'}]}
};
Object.assign(EFFECTS,PACK_EFFECTS);
export const DRUM_VOICES={kick:'Deep kick',clap:'Dust clap',hat:'Silk hat',open:'Open hat',rim:'Wood rim',tom:'Low tom',shaker:'Sand shaker',perc:'Glass perc'};
export function pluginDefaults(type) {
  const instrument=Object.fromEntries((INSTRUMENTS[type]?.controls||[]).map(c=>[c.key,c.default]));
  const effects=Object.fromEntries(Object.entries(EFFECTS).map(([id,def])=>[id,{enabled:false,...Object.fromEntries(def.controls.map(c=>[c.key,c.default]))}]));
  return {instrument,effects};
}
export function ensurePlugins(track) {
  const d=pluginDefaults(track.type);
  if(!track.instrument)track.instrument={};for(const [key,value] of Object.entries(d.instrument))if(track.instrument[key]===undefined)track.instrument[key]=value;
  const legacy=track.inserts===undefined&&!!track.effects;
  if(!track.effects)track.effects={};for(const [id,state] of Object.entries(d.effects)){if(!track.effects[id])track.effects[id]={...state};else for(const [key,value] of Object.entries(state))if(track.effects[id][key]===undefined)track.effects[id][key]=value;}
  // Preserve saved mixes in their historical processing order. Fresh tracks stay empty.
  track.inserts=normaliseInserts(track.inserts,EFFECTS,legacy?LEGACY_EFFECT_ORDER.filter(id=>track.effects[id].enabled):[]);
  for(const [id,state] of Object.entries(track.effects)){const def=effectDefinition(id);if(!def){delete track.effects[id];continue;}for(const c of def.controls)if(!Number.isFinite(state[c.key]))state[c.key]=c.default;if(!track.inserts.includes(id))state.enabled=false;}
  track.output??='master';track.sends??=[];track.automation??={mode:'off',curves:{}};
  if(!track.tune)track.tune={key:9,scale:'minor',speed:35,amount:1,mix:1};
}
export const INSERT_COUNT=12;
export const EMPTY_INSTRUMENT={name:'INSTRUMENT',subtitle:'AUCUN INSTRUMENT CHARGÉ',color:'#a5b3c1',description:'Charge un instrument sur cette piste pour entendre les notes MIDI.',controls:[]};
export const instrumentDefinition=type=>type==='instrument'?EMPTY_INSTRUMENT:INSTRUMENTS[type];
export function changeInstrument(track,type){if(!instrumentDefinition(type)||!instrumentDefinition(track.type)||track.type==='drums'&&type!=='drums'||type==='drums'&&track.type!=='drums'&&(track.type!=='instrument'||track.clips?.some(c=>c.notes?.length)))throw Error('Choisis un instrument compatible avec les notes de cette piste.');track.type=type;track.instrument=pluginDefaults(type).instrument;ensurePlugins(track);return track;}
export const effectType=id=>String(id).split('__')[0];
export const effectDefinition=id=>EFFECTS[effectType(id)];
export const instanceId=type=>type+'__'+Math.random().toString(36).slice(2,10);
export const LEGACY_EFFECT_ORDER=['hush','sibil','color','sculpt','prism','glue','ember','orbit','sway','relay','echo','aura'];
export function normaliseInserts(value,registry=EFFECTS,fallback=[]){
  const seen=new Set();return Array.from({length:INSERT_COUNT},(_,i)=>{const id=(Array.isArray(value)?value:fallback)[i];if(!(Object.hasOwn(registry,id)||registry===EFFECTS&&typeof id==='string'&&/^[a-z]+__[a-z0-9]+$/.test(id)&&Object.hasOwn(registry,effectType(id)))||seen.has(id))return null;seen.add(id);return id;});
}
export function placeInsert(track,index,id){
  ensurePlugins(track);if(!Number.isInteger(index)||index<0||index>=INSERT_COUNT||id!==null&&!effectDefinition(id))throw new Error('Insert invalide.');
  if(id&&track.inserts.includes(id)&&track.inserts[index]!==id){const source=id;id=instanceId(effectType(id));track.effects[id]={...track.effects[source]};}
  if(id&&!track.effects[id])track.effects[id]={enabled:true,...Object.fromEntries(effectDefinition(id).controls.map(c=>[c.key,c.default]))};
  const previous=track.inserts[index];track.inserts[index]=id;if(previous&&previous!==id)track.effects[previous].enabled=false;if(id)track.effects[id].enabled=true;return id;
}
export function addEffectInsert(track,id){ensurePlugins(track);let index=track.inserts.indexOf(id);if(index<0)index=track.inserts.indexOf(null);if(index<0)throw new Error('Tous les inserts sont occupés.');placeInsert(track,index,id);return index;}
export function moveInsert(track,from,to){ensurePlugins(track);if(!Number.isInteger(from)||!Number.isInteger(to)||Math.min(from,to)<0||Math.max(from,to)>=INSERT_COUNT)throw new Error('Position d’insert invalide.');[track.inserts[from],track.inserts[to]]=[track.inserts[to],track.inserts[from]];}
export function formatParam(control,value) {return control.unit==='key'?['Do','Do♯','Ré','Mi♭','Mi','Fa','Fa♯','Sol','La♭','La','Si♭','Si'][Math.round(value)]:control.unit==='scale'?['Mineure','Majeure','Chromatique'][Math.round(value)]:control.unit==='wave'?EXO_WAVES[Math.round(value)]:control.unit==='mode'?['Off','Up','Down','Up/Down','Chord'][Math.round(value)]:control.unit==='%'?`${Math.round(value*100)}%`:control.unit==='s'?`${value.toFixed(2)} s`:control.unit==='Hz'&&value>=20?(value>=1000?`${(value/1000).toFixed(1)} kHz`:`${Math.round(value)} Hz`):control.unit==='Hz'?`${value.toFixed(2)} Hz`:control.unit==='beat'?`${value.toFixed(3).replace(/0+$/,'').replace(/\.$/,'')} ♩`:control.unit===':1'?`${value.toFixed(1)}:1`:`${value.toFixed(1)} ${control.unit}`;}

export function copyInsert(track,from,to){ensurePlugins(track);const source=track.inserts[from];if(!source||track.inserts[to])throw Error('Choisis un emplacement vide.');const id=instanceId(effectType(source));track.effects[id]=structuredClone(track.effects[source]);track.inserts[to]=id;return id;}
