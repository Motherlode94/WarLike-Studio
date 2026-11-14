/**
 * WarLike original signal chains inspired by common recording/mixing tasks.
 * These are independent processors, not replacements for proprietary plug-in
 * binaries, licenses, saved preset state, or exact DSP behavior.
 */
import {effectDefinition,ensurePlugins,placeInsert,INSERT_COUNT} from './plugins.js';

export const NATIVE_CHAINS={
  tracking:{name:'Prise vocale propre',description:'Nettoyage, compression et de-esser pour l’enregistrement.',effects:[
    {id:'voxclean',params:{highpass:85,range:5,air:0}},{id:'voxlevel',params:{ratio:2.2,levelThreshold:-23,mix:.9}},{id:'sibil',params:{threshold:-26}}
  ]},
  tuning:{name:'Justesse vocale',description:'Correction monophonique native, contrôle vocal et égalisation.',effects:[
    {id:'voxtune',params:{speed:22,amount:.9}},{id:'voxlevel',params:{ratio:2.5}},{id:'vectoreq',params:{g2:-1,g4:1}}
  ]},
  modern:{name:'Voix moderne',description:'Chaîne polyvalente pour rap et chant : justesse, EQ, compression et ambiance.',effects:[
    {id:'voxtune',params:{speed:10,amount:.95}},{id:'vectoreq',params:{g1:-2,g4:1.25,g5:1}},{id:'vectorcomp',params:{threshold:-22,ratio:3.5,attack:12,release:130}},{id:'sibil',params:{threshold:-25}},{id:'alterecho',params:{mix:.15,feedback:.26}},{id:'exospace',params:{mix:.1}}
  ]},
  mix:{name:'Mixage transparent',description:'Égalisation, compression et limitation du bus.',effects:[
    {id:'vectoreq',params:{g1:-.75,g5:.5}},{id:'vectorcomp',params:{threshold:-18,ratio:2.5,mix:.8}},{id:'vectorlimit',params:{ceiling:-1}}
  ]},
  color:{name:'Couleur analogique',description:'Égalisation musicale, dynamique douce et saturation.',effects:[
    {id:'circuiteq',params:{body:-1,presence:1.5,air:.5}},{id:'circuitbus',params:{threshold:-17,ratio:2,attack:35,release:180}},{id:'circuitcolor',params:{drive:4,mix:.27}}
  ]},
  creative:{name:'Voix créative',description:'Doublage, écho et réverbération avec des algorithmes WarLike.',effects:[
    {id:'alterdouble',params:{mix:.36,depth:2.5}},{id:'alterecho',params:{mix:.22,feedback:.35}},{id:'exospace',params:{}}
  ]},
  master:{name:'Pré-master',description:'Traitement de précision avant export, pas un mastering automatique.',effects:[
    {id:'vectoreq',params:{g1:-.5,g5:.5}},{id:'vectorcomp',params:{threshold:-14,ratio:1.5,attack:36,release:200,mix:1}},{id:'vectorlimit',params:{ceiling:-1,drive:.75}}
  ]}
};
/**
 * Comparaison fonctionnelle uniquement. Ne récupère jamais le state VST/CLAP
 * tiers. L'utilisateur accepte explicitement la proposition avant insertion.
 */
const REPLACEMENTS=[
  [/auto.?tune|antares|waves tune|pitchcorrection|reapitch/i,'voxtune'],
  [/pro.?q|fabfilter.*eq|re(a)?eq|equaliz|parametric.*eq|ozone.*equaliz/i,'vectoreq'],
  [/pro.?c|fabfilter.*comp|reacomp|rcomp|r.?vox|vocal.?compress|compressor/i,'vectorcomp'],
  [/de.?ess|sibilan/i,'sibil'],
  [/valhalla|vintage.?verb|room|reverb|verb$/i,'exospace'],
  [/echo.?boy|h.?delay|delay|re delay|re.?delay/i,'alterecho'],
  [/decapitator|saturat|distort|tape|soundtoys.*drive/i,'circuitcolor'],
  [/doubler|micro.?shift|little.?micro.?shift/i,'alterdouble'],
  [/limiter|pro.?l|maximizer|ozone.*maxim/i,'vectorlimit'],
  [/gate|denoise|noise reduction|reafir/i,'voxclean']
];
export function suggestNativeReplacement(name){
 const value=String(name||'');
 return REPLACEMENTS.find(([pattern])=>pattern.test(value))?.[1]||null;
}
export function nativeEffectsForNames(names=[]){
 const seen=new Set();
 return names.map(name=>({original:name,replacement:suggestNativeReplacement(name)})).filter(item=>{
   if(!item.replacement||seen.has(item.replacement))return false;
   seen.add(item.replacement);return true;
 });
}
/**
 * Add a chain as one atomic track update: malformed/oversized chains must
 * leave the active recording/mix untouched. Preserve existing insert order,
 * including empty slots between currently loaded processors.
 */
export function nativeChainCapacity(track,selection,{replace=false}={}){
 const chain=typeof selection==='string'?NATIVE_CHAINS[selection]?.effects:selection;
 if(!Array.isArray(chain)||!chain.length)return {required:0,available:0,valid:false};
 const inserts=Array.isArray(track?.inserts)?track.inserts:[];
 const available=replace?INSERT_COUNT:INSERT_COUNT-inserts.filter(Boolean).length;
 return {required:chain.length,available,valid:chain.length<=available&&chain.every(item=>item&&effectDefinition(item.id))};
}
export function applyNativeChain(track,selection,{replace=false}={}){
 const chain=typeof selection==='string'?NATIVE_CHAINS[selection]?.effects:selection;
 if(!Array.isArray(chain)||!chain.length)throw new Error('Chaîne native inconnue.');
 if(!track||typeof track!=='object')throw new Error('Piste invalide.');
 const capacity=nativeChainCapacity(track,chain,{replace});
 if(chain.some(item=>!item||!effectDefinition(item.id)))throw new Error('Cette chaîne contient un effet indisponible.');
 if(!capacity.valid)throw new Error('Pas assez d’emplacements disponibles pour cette chaîne ('+capacity.required+' requis, '+capacity.available+' libres).');
 // Prepare a complete copy, then commit only if all processors and values pass.
 const draft=structuredClone(track);
 ensurePlugins(draft);
 if(replace){
   for(const effectId of draft.inserts.filter(Boolean))if(draft.effects[effectId])draft.effects[effectId].enabled=false;
   draft.inserts.fill(null);
 }
 for(const item of chain){
   const index=draft.inserts.indexOf(null);
   if(index<0)throw new Error('Pas assez d’emplacements disponibles.');
   const inserted=placeInsert(draft,index,item.id);
   const state=draft.effects[inserted];
   const definition=effectDefinition(item.id);
   for(const [key,value] of Object.entries(item.params||{})){
     const def=definition.controls.find(x=>x.key===key);
     if(!def||!Number.isFinite(value))throw new Error('Paramètre FX non valide : '+item.id+'.'+key);
     state[key]=Math.max(def.min,Math.min(def.max,value));
   }
   state.enabled=true;
 }
 track.inserts=draft.inserts;
 track.effects=draft.effects;
 if(draft.pluginComparisons)track.pluginComparisons=draft.pluginComparisons;
 return track;
}
