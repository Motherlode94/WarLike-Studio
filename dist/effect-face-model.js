// Visual grouping only. No DSP parameters or signal paths are created here.
const byKind={
 eq:'sculpt prism vectoreq circuiteq voxaireq tilteq notch alterfilter exoair',
 dynamics:'glue vectorcomp vectorlimit circuitbus voxlevel hush sibil exostrip exofocus',
 space:'aura exospace voxambience',
 echo:'echo slap relay alterecho',
 modulation:'orbit sway phase ring alterdouble voxdoubler',
 drive:'color ember circuitcolor voxwarm',
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
