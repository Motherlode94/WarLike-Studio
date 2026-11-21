import {hardwarePresetBank,applyHardwarePreset,mountHardwareMasterPresets} from './hardware-presets.js';
export const VECTOR_IDS=Object.freeze(["vectoreq","vectorcomp","vectorlimit"]);
export const isVector = id=>VECTOR_IDS.includes(id);
export function vectorPresetBank(id,definition,factory,storage){return isVector(id)?hardwarePresetBank(id,definition,factory,storage):[];}
export function applyVectorPreset(state,id,definition,preset){if(!isVector(id))throw Error('Module hors collection VECTOR.');return applyHardwarePreset(state,id,definition,preset);}
export function mountVectorMasterPresets(root,options){if(!isVector(options.id))return;return mountHardwareMasterPresets(root,{...options,faceSelector:'.vector-eq-hardware,.vector-comp-hardware,.vector-limit-hardware',collection:'VECTOR',sectionClass:'vector-master-presets',saveAttribute:'data-vector-save'});}
