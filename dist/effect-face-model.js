// Visual grouping only. No DSP parameters or signal paths are created here.
const byKind={
 eq:'sculpt prism vectoreq circuiteq voxaireq tilteq notch alterfilter exoair harditilt elianaveil',
 dynamics:'glue vectorcomp vectorlimit circuitbus voxlevel hush sibil exostrip exofocus hardibus elianaembrace elianaguard',
 space:'aura exospace voxambience eliananest',
 echo:'echo slap relay alterecho',
 modulation:'orbit sway phase ring alterdouble voxdoubler hardistage',
 drive:'color ember circuitcolor voxwarm harditape',
 vocal:'voxtune voxclean voxmicmodel'
};
const names={eq:'SPECTRE / FILTRES',dynamics:'DYNAMIQUE / CONTRÔLE',space:'ESPACE / RÉVERBÉRATION',echo:'TEMPS / RÉPÉTITIONS',modulation:'MOUVEMENT / STÉRÉO',drive:'HARMONIQUES / GRAIN',vocal:'VOIX / CORRECTION',generic:'TRAITEMENT AUDIO'};
const kinds=Object.fromEntries(Object.entries(byKind).flatMap(([kind,ids])=>ids.split(' ').map(id=>[id,kind])));
const outputKeys=new Set('output makeup mix drywet gain volume level'.split(' '));
const roles={
 time:/^(attack|release|decay|predelay|time|beats|rate|response|feedback|hold|lookahead|slap|preDelay|delay)$/i,
 tone:/^(frequency|freq|cutoff|pivot|tone|q|resonance|highpass|lowpass|midFreq|highFreq|lowFreq|low|mid|high|tilt|sidechain)$/i,
 shape:/^(drive|character|threshold|ratio|knee|range|depth|amount|saturation|width|pan)$/i
};
export function effectFace(id,definition){
 if(!definition?.controls?.length)return null;
 const keys=definition.controls.map(c=>c.key);
 if(new Set(keys).size!==keys.length)return null;
 const kind=kinds[id]||(/EQ|FILTER/i.test(definition.subtitle)?'eq':/COMP|LIMIT|GATE/i.test(definition.subtitle)?'dynamics':'generic');
 const groups=[{name:'CŒUR DU TRAITEMENT',keys:[]},{name:'COULEUR / TEMPS',keys:[]},{name:'MÉLANGE / SORTIE',keys:[]}];
 for(const key of keys){
  const index=outputKeys.has(key)?2:roles.time.test(key)||roles.tone.test(key)?1:0;
  groups[index].keys.push(key);
 }
 const focus=keys.filter(k=>!outputKeys.has(k)).slice(0,2);
 while(focus.length<Math.min(2,keys.length))focus.push(keys.find(k=>!focus.includes(k)));
 return {id,kind,label:names[kind],groups:groups.filter(x=>x.keys.length),focus};
}
export function effectReadout(control,value,format){
 return format(control,Number.isFinite(value)?value:control.default);
}
export function effectDialFraction(control,value){
 const raw=Number.isFinite(value)?value:control.default;
 return Number.isFinite(raw)&&control.max>control.min?Math.max(0,Math.min(1,(raw-control.min)/(control.max-control.min))):0;
}

/**
 * Hardware identity belongs to the processor, not its family. A deterministic
 * engraving and accent are stable across reloads and are presentation-only.
 * No synthetic audio meter, fake response curve or DSP parameter is created.
 */
export function effectHardwareIdentity(id,definition){
 if(typeof id!=='string'||!id||!definition?.name||!definition?.controls?.length)
  throw Error('Identité matérielle de plugin invalide.');
 const seed=[...id].reduce((n,char)=>((n*33)^char.charCodeAt(0))>>>0,5381);
 const hue=seed%360;
 const engraving=id.toUpperCase().replace(/[^A-Z0-9]/g,'').slice(0,6);
 const serial=String(seed%10000).padStart(4,'0');
 const geometry=['console','rack','pedal','module'][seed%4];
 const accent='hsl('+hue+' 68% 75%)';
 return Object.freeze({engraving,serial,geometry,accent,
  hash:seed,variant:id+'-'+serial});
}
