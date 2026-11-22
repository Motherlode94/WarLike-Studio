import {hardwarePresetBank,applyHardwarePreset,mountHardwareMasterPresets} from './hardware-presets.js';
export const ALTER_IDS=Object.freeze(['alterdouble','alterecho','alterfilter']);
export const isAlter=id=>ALTER_IDS.includes(id);
export function alterPresetBank(id,definition,factory,storage){return isAlter(id)?hardwarePresetBank(id,definition,factory,storage):[];}
export function applyAlterPreset(state,id,definition,preset){if(!isAlter(id))throw Error('Module hors ALTER');return applyHardwarePreset(state,id,definition,preset);}
export function mountAlterPresets(root,options){if(!isAlter(options.id))return;return mountHardwareMasterPresets(root,{...options,faceSelector:'.alter-'+options.id.slice(5)+'-hardware',collection:'ALTER',sectionClass:'alter-pro-presets',saveAttribute:'data-alter-save'});}
