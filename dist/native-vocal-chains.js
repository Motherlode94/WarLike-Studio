/**
 * WarLike original signal chains inspired by common recording/mixing tasks.
 * These are independent processors, not replacements for proprietary plug-in
 * binaries, licenses, saved preset state, or exact DSP behavior.
 */
import {effectDefinition,ensurePlugins,placeInsert,INSERT_COUNT} from './plugins.js';

export const NATIVE_CHAINS={
  tracking:{name:'Prise vocale propre',description:'Nettoyage, compression et de-esser pour l’enregistrement.',effects:[
    {id:'voxclean',params:{}},{id:'voxlevel',params:{}},{id:'sibil',params:{}}
  ]},
  tuning:{name:'Justesse vocale',description:'Correction monophonique native, contrôle vocal et égalisation.',effects:[
    {id:'voxtune',params:{}},{id:'voxlevel',params:{}},{id:'vectoreq',params:{}}
  ]},
  modern:{name:'Voix moderne',description:'Chaîne polyvalente pour rap et chant : justesse, EQ, compression et ambiance.',effects:[
    {id:'voxtune',params:{}},{id:'vectoreq',params:{}},{id:'vectorcomp',params:{}},{id:'sibil',params:{}},{id:'alterecho',params:{mix:.15}},{id:'exospace',params:{mix:.1}}
  ]},
  mix:{name:'Mixage transparent',description:'Égalisation, compression et limitation du bus.',effects:[
    {id:'vectoreq',params:{}},{id:'vectorcomp',params:{}},{id:'vectorlimit',params:{}}
  ]},
  color:{name:'Couleur analogique',description:'Égalisation musicale, dynamique douce et saturation.',effects:[
    {id:'circuiteq',params:{}},{id:'circuitbus',params:{}},{id:'circuitcolor',params:{}}
  ]},
  creative:{name:'Voix créative',description:'Doublage, écho et réverbération avec des algorithmes WarLike.',effects:[
    {id:'alterdouble',params:{}},{id:'alterecho',params:{}},{id:'exospace',params:{}}
  ]},
  master:{name:'Pré-master',description:'Traitement de précision avant export, pas un mastering automatique.',effects:[
    {id:'vectoreq',params:{}},{id:'vectorcomp',params:{}},{id:'vectorlimit',params:{}}
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
export function applyNativeChain(track,selection,{replace=false}={}){
 ensurePlugins(track);
 const chain=typeof selection==='string'?NATIVE_CHAINS[selection]?.effects:selection;
 if(!Array.isArray(chain)||!chain.length)throw new Error('Chaîne native inconnue.');
 const existing=(replace?[]:track.inserts.filter(Boolean));
 if(existing.length+chain.length>INSERT_COUNT)throw new Error('Pas assez d’emplacements disponibles pour cette chaîne.');
 if(replace){for(const id of track.inserts.filter(Boolean))if(track.effects[id])track.effects[id].enabled=false;track.inserts.fill(null);}
 let index=replace?0:track.inserts.findIndex(id=>id===null);
 for(const item of chain){
   if(!effectDefinition(item.id))throw new Error('Effet WarLike non disponible : '+item.id);
   const inserted=placeInsert(track,index,item.id);
   const state=track.effects[inserted];
   for(const [key,value] of Object.entries(item.params||{})){
     const def=effectDefinition(item.id).controls.find(x=>x.key===key);
     if(def&&Number.isFinite(value))state[key]=Math.max(def.min,Math.min(def.max,value));
   }
   state.enabled=true;
   index=track.inserts.findIndex((id,i)=>i>index&&id===null);
 }
 return track;
}
