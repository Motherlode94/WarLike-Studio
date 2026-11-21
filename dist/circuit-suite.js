import {hardwarePresetBank,applyHardwarePreset,mountHardwareMasterPresets} from './hardware-presets.js';
export const CIRCUIT_IDS=Object.freeze(["circuiteq","circuitbus","circuitcolor"]);
export const isCircuit = id=>CIRCUIT_IDS.includes(id);
export function circuitPresetBank(id,definition,factory,storage){return isCircuit(id)?hardwarePresetBank(id,definition,factory,storage):[];}
export function applyCircuitPreset(state,id,definition,preset){if(!isCircuit(id))throw Error('Module hors collection CIRCUIT.');return applyHardwarePreset(state,id,definition,preset);}
export function mountCircuitMasterPresets(root,options){if(!isCircuit(options.id))return;return mountHardwareMasterPresets(root,{...options,faceSelector:'.circuit-eq-hardware,.circuit-bus-hardware,.circuit-color-hardware',collection:'CIRCUIT',sectionClass:'circuit-master-presets',saveAttribute:'data-circuit-save'});}
