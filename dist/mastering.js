import {routeMasterRack} from './master-rack-dsp.js';
import {normalizeRack,rackType,rackLeaves,rackIsSplit} from './master-rack-model.js';
import {EFFECTS} from './plugins.js?v=0.14.0';
// Original master-bus controls, shared by real-time playback and offline export.
export const MASTER_BASE_MODULES={
  balance:{name:'BALANCE',subtitle:'MASTER EQUALIZER',description:'Nettoie le grave et ajuste le poids, la présence et l’air du mix.',controls:[
    {key:'cut',name:'Low cut',min:20,max:100,step:1,default:20,unit:'Hz'},
    {key:'low',name:'Low · 100 Hz',min:-6,max:6,step:.25,default:0,unit:'dB'},
    {key:'mid',name:'Mid · 2.5 kHz',min:-6,max:6,step:.25,default:0,unit:'dB'},
    {key:'high',name:'Air · 10 kHz',min:-6,max:6,step:.25,default:0,unit:'dB'}]},
  press:{name:'PRESS',subtitle:'BUS COMPRESSOR',description:'Resserre la dynamique de l’ensemble du morceau, avec réduction de gain mesurée.',controls:[
    {key:'threshold',name:'Threshold',min:-40,max:0,step:.5,default:-18,unit:'dB'},
    {key:'ratio',name:'Ratio',min:1,max:6,step:.1,default:2,unit:':1'},
    {key:'attack',name:'Attack',min:1,max:100,step:1,default:30,unit:'ms'},
    {key:'release',name:'Release',min:50,max:1000,step:10,default:250,unit:'ms'},
    {key:'makeup',name:'Make-up',min:0,max:9,step:.25,default:0,unit:'dB'}]},
  peak:{name:'PEAK',subtitle:'OUTPUT LIMITER',description:'Contrôle les crêtes et fixe un plafond de sortie sur les échantillons.',controls:[
    {key:'drive',name:'Input gain',min:0,max:18,step:.25,default:0,unit:'dB'},
    {key:'ceiling',name:'Ceiling',min:-12,max:-.1,step:.1,default:-1,unit:'dB'},
    {key:'release',name:'Release',min:20,max:500,step:10,default:120,unit:'ms'}]}
};
export const MASTER_MODULES={...MASTER_BASE_MODULES,...EFFECTS};
const copy=value=>JSON.parse(JSON.stringify(value)),clamp=(v,min,max)=>Math.max(min,Math.min(max,v));
export function masteringSettings(value){
  return normalizeRack(value,MASTER_MODULES);
}
export const MASTER_PRESETS=[
  {name:'Départ neutre',description:'Tous les inserts sont vides. Construis ton mastering à partir du mix.',settings:{}},
  {name:'Gentle Finish',description:'EQ léger, compression douce et plafond à −1 dBFS.',settings:{balance:{enabled:true,cut:25,low:0,mid:0,high:.75},press:{enabled:true,threshold:-16,ratio:1.5,attack:30,release:250,makeup:.5},peak:{enabled:true,drive:1,ceiling:-1,release:160}}},
  {name:'Trap Focus',description:'Présence et grave contrôlé, compression modérée, plafond à −1 dBFS.',settings:{balance:{enabled:true,cut:25,low:.5,mid:.5,high:1},press:{enabled:true,threshold:-18,ratio:2,attack:30,release:150,makeup:1},peak:{enabled:true,drive:2,ceiling:-1,release:100}}},
  {name:'R&B Silk',description:'Courbe douce et transitoires préservées, plafond à −1,5 dBFS.',settings:{balance:{enabled:true,cut:25,low:.25,mid:-.5,high:.75},press:{enabled:true,threshold:-18,ratio:1.5,attack:45,release:350,makeup:.5},peak:{enabled:true,drive:1,ceiling:-1.5,release:180}}},
  {name:'Afro Groove',description:'Kick et basse lisibles, haut du spectre aéré, compression légère pour préserver la danse.',settings:{balance:{enabled:true,cut:24,low:.25,mid:-.25,high:.75},press:{enabled:true,threshold:-17,ratio:1.6,attack:35,release:220,makeup:.5},peak:{enabled:true,drive:.75,ceiling:-1.2,release:140}}},
  {name:'Amapiano Deep',description:'Préserve la dynamique du log drum et la séparation grave/kick sans gonfler artificiellement le sub.',settings:{balance:{enabled:true,cut:20,low:0,mid:-.25,high:.5},press:{enabled:true,threshold:-16,ratio:1.4,attack:45,release:300,makeup:0},peak:{enabled:true,drive:.5,ceiling:-1.3,release:180}}},
  {name:'Afrobeats Air',description:'Vocaux lumineux et percussions présentes, compression de bus discrète.',settings:{balance:{enabled:true,cut:26,low:.25,mid:.25,high:1},press:{enabled:true,threshold:-18,ratio:1.7,attack:30,release:200,makeup:.5},peak:{enabled:true,drive:1,ceiling:-1.2,release:140}}},
  {name:'Alternative Rock Punch',description:'Guitares distinctes, caisse claire affirmée et attaques préservées.',settings:{balance:{enabled:true,cut:28,low:0,mid:.5,high:.5},press:{enabled:true,threshold:-17,ratio:2,attack:30,release:160,makeup:.5},peak:{enabled:true,drive:1,ceiling:-1.2,release:120}}},
  {name:'Indie Rock Warm',description:'Texture douce, peu de compression et transitoires naturelles.',settings:{balance:{enabled:true,cut:25,low:.5,mid:-.25,high:0},press:{enabled:true,threshold:-15,ratio:1.5,attack:45,release:260,makeup:0},peak:{enabled:true,drive:.5,ceiling:-1.5,release:180}}},
  {name:'Heavy Alternative',description:'Bas médium contenu et contrôle modéré des crêtes de batterie/guitare.',settings:{balance:{enabled:true,cut:30,low:-.25,mid:.5,high:.5},press:{enabled:true,threshold:-18,ratio:2.2,attack:25,release:140,makeup:.5},peak:{enabled:true,drive:1.5,ceiling:-1,release:110}}}
];
export function applyMasterPreset(project,index){const preset=MASTER_PRESETS[index];if(!preset)throw new Error('Preset mastering inconnu.');project.mastering=masteringSettings(copy(preset.settings));return preset.name;}
export function matchMasterPreset(project){const state=masteringSettings(project.mastering);return MASTER_PRESETS.findIndex(p=>JSON.stringify(masteringSettings(p.settings))===JSON.stringify(state));}
export function exportMasterRack(project){return {format:'chayah-master-rack',version:project.mastering?.rackVersion===2?2:1,mastering:masteringSettings(project.mastering)};}
export function importMasterRack(project,data){
  if(data?.format!=='chayah-master-rack'||![1,2].includes(data.version)||!data.mastering||typeof data.mastering!=='object')throw new Error('Ce fichier n’est pas un rack de mastering CHAYAH.');
  for(const [id,def] of Object.entries(MASTER_MODULES))if(data.mastering[id]!==undefined&&(typeof data.mastering[id]?.enabled!=='boolean'||def.controls.some(c=>!Number.isFinite(data.mastering[id]?.[c.key]))))throw new Error('Réglages de mastering invalides.');
  project.mastering=masteringSettings(data.mastering);
}
const gain=db=>10**(db/20);
export function createMasterChain(ctx,input,{createEffect=null}={}){
  const cut=ctx.createBiquadFilter(),low=ctx.createBiquadFilter(),mid=ctx.createBiquadFilter(),high=ctx.createBiquadFilter(),press=ctx.createDynamicsCompressor(),makeup=ctx.createGain(),drive=ctx.createGain(),limiter=ctx.createDynamicsCompressor(),scaleIn=ctx.createGain(),guard=ctx.createWaveShaper(),scaleOut=ctx.createGain(),wet=ctx.createGain(),dry=ctx.createGain(),output=ctx.createGain();
  cut.type='highpass';cut.Q.value=.5;low.type='lowshelf';low.frequency.value=100;mid.type='peaking';mid.frequency.value=2500;mid.Q.value=.65;high.type='highshelf';high.frequency.value=10000;press.knee.value=6;
  // Fixed identity curve clips values outside ±1; separate gains set the ceiling.
  guard.curve=new Float32Array([-1,0,1]);guard.oversample='none';
  cut.connect(low);low.connect(mid);mid.connect(high);press.connect(makeup);drive.connect(limiter);
  limiter.connect(scaleIn);scaleIn.connect(guard);guard.connect(scaleOut);
  const rackInput=ctx.createGain(),rackOutput=ctx.createGain(),dryDelay=ctx.createDelay(4),splitNodes=new Map();const inputSplitter=ctx.createChannelSplitter(2),inputMeters=[ctx.createAnalyser(),ctx.createAnalyser()];inputMeters.forEach((m,i)=>{m.fftSize=512;inputSplitter.connect(m,i);});
  const splitter=ctx.createChannelSplitter(2),meters=[ctx.createAnalyser(),ctx.createAnalyser()];output.connect(splitter);meters.forEach((m,i)=>{m.fftSize=2048;splitter.connect(m,i);});
  return {input,inputSplitter,inputMeters,rackInput,rackOutput,dryDelay,splitNodes,createEffect,effects:new Map(),stages:{balance:{input:cut,output:high},press:{input:press,output:makeup},peak:{input:drive,output:scaleOut}},cut,low,mid,high,press,makeup,drive,limiter,scaleIn,guard,scaleOut,wet,dry,output,splitter,meters};
}
export function syncMasterChain(nodes,value,now=0,initial=false){
  const state=masteringSettings(value),eq=!state.bypass&&state.balance.enabled,bus=!state.bypass&&state.press.enabled,peak=!state.bypass&&state.peak.enabled;
  const set=(param,v)=>initial?param.setValueAtTime(v,now):param.setTargetAtTime(v,now,.02);
  set(nodes.cut.frequency,eq?state.balance.cut:0);for(const key of ['low','mid','high'])set(nodes[key].gain,eq?state.balance[key]:0);
  for(const key of ['threshold','ratio','attack','release'])set(nodes.press[key],key==='threshold'?(bus?state.press.threshold:0):key==='ratio'?(bus?state.press.ratio:1):state.press[key]/1000);
  set(nodes.makeup.gain,gain(bus?state.press.makeup:0));set(nodes.drive.gain,gain(peak?state.peak.drive:0));
  // Empty or bypassed master inserts have a direct, unprocessed signal path.
  set(nodes.limiter.threshold,peak?state.peak.ceiling:-2);set(nodes.limiter.knee,peak?0:2);set(nodes.limiter.ratio,peak?20:16);set(nodes.limiter.attack,peak?.001:.003);set(nodes.limiter.release,peak?state.peak.release/1000:.1);
  const ceiling=gain(state.peak.ceiling);nodes.scaleIn.gain.setValueAtTime(1/ceiling,now);nodes.scaleOut.gain.setValueAtTime(ceiling,now);
  const leaves=rackLeaves(state);
  for(const [id,stage] of nodes.effects)if(!leaves.includes(id)){stage.dispose();nodes.effects.delete(id);delete nodes.stages[id];nodes.routeSignature=null;}
  for(const id of leaves){const type=rackType(id);if(!EFFECTS[type]&&id===type)continue;let stage=nodes.effects.get(id);
    if(!stage){
      if(EFFECTS[type]){if(!nodes.createEffect)throw Error('Le moteur doit préparer les effets du master.');stage=nodes.createEffect(type,state[id]);}
      else{const input=nodes.input.context.createGain(),child=createMasterChain(nodes.input.context,input,{createEffect:nodes.createEffect});stage={input,output:child.output,processor:child,update:(value,at=nodes.input.context.currentTime,first=false)=>syncMasterChain(child,{inserts:[type],[type]:value},at,first),dispose:()=>{input.disconnect();for(const s of Object.values(child.stages))s.output.disconnect();child.output.disconnect();}};stage.update(state[id],now,initial);}
      nodes.effects.set(id,stage);nodes.stages[id]=stage;nodes.routeSignature=null;
    }else stage.update(state[id],now,initial);
  }
  routeMasterRack(nodes,state,now,initial);
}
