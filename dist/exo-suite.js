import {hardwarePresetBank,applyHardwarePreset,mountHardwareMasterPresets} from './hardware-presets.js';
export const EXO_IDS=Object.freeze(['exostrip','exofocus','exoair','exospace']);
export const isExo=id=>EXO_IDS.includes(id);
export function exoPresetBank(id,definition,factory,storage){return isExo(id)?hardwarePresetBank(id,definition,factory,storage):[];}
export function applyExoPreset(state,id,definition,preset){if(!isExo(id))throw Error('Module hors collection EXO.');return applyHardwarePreset(state,id,definition,preset);}
export function mountExoMasterPresets(root,options){if(!isExo(options.id))return;const slug=options.id.slice(3);return mountHardwareMasterPresets(root,{...options,faceSelector:'.exo-'+slug+'-hardware',collection:'EXO',sectionClass:'exo-suite-presets exo-'+slug+'-presets',saveAttribute:'data-exo-'+slug+'-save'});}
