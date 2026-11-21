import {hardwarePresetBank,applyHardwarePreset,mountHardwareMasterPresets} from './hardware-presets.js';
export const VOX_IDS=Object.freeze(['voxtune','voxclean','voxlevel','voxaireq','voxambience','voxmicmodel','voxwarm','voxdoubler']);
export const isVox=id=>VOX_IDS.includes(id);
export function voxPresetBank(id,definition,factory,storage){return isVox(id)?hardwarePresetBank(id,definition,factory,storage):[];}
export function applyVoxPreset(state,id,definition,preset){if(!isVox(id))throw Error('Module hors collection VOX.');return applyHardwarePreset(state,id,definition,preset);}
export function mountVoxMasterPresets(root,options){if(!isVox(options.id))return;return mountHardwareMasterPresets(root,{...options,faceSelector:'.vox-tune-hardware,.vox-clean-hardware,.vox-level-hardware,.vox-air-hardware,.vox-ambience-hardware,.vox-mic-hardware,.vox-warm-hardware,.vox-doubler-hardware',collection:'VOX',sectionClass:'vox-master-presets',saveAttribute:'data-vox-save'});}
