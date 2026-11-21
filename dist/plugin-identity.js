// Presentation metadata only: never mutate DSP definitions or saved parameters.
const families={vector:['VECTOR','precision'],circuit:['CIRCUIT','console'],voxlab:['VOX LAB','vocal'],voxpro:['VOX LAB PRO','vocal'],exo:['EXO','space'],alter:['ALTER','motion'],vocal:['VOCAL ESSENTIALS','restoration'],motion:['MOTION & COLOR','motion'],rebel:['REBEL','industrial']};
const layouts={vectoreq:'equalizer',circuiteq:'equalizer',prism:'equalizer',voxaireq:'equalizer',vectorcomp:'dynamics',vectorlimit:'limiter',circuitbus:'dynamics',glue:'dynamics',circuitcolor:'saturation',color:'saturation',voxtune:'pitch',voxlevel:'dynamics',voxclean:'restoration',hush:'restoration',sibil:'deesser',exospace:'reverb',alterecho:'delay',relay:'delay',alterdouble:'modulation',alterfilter:'modulation',phase:'modulation'};
const labels={equalizer:'Égalisation',dynamics:'Dynamique',limiter:'Limitation',saturation:'Coloration harmonique',pitch:'Correction de hauteur',restoration:'Restauration',deesser:'Contrôle des sifflantes',reverb:'Réverbération',delay:'Retard',modulation:'Modulation',controls:'Paramètres du processeur'};
export function pluginIdentity(def,processor){
 const pack=def?.pack||'studio',entry=Object.hasOwn(families,pack)?families[pack]:[String(pack).toUpperCase(),'studio'];
 const layout=Object.hasOwn(layouts,processor)?layouts[processor]:'controls';
 return {family:entry[1],label:entry[0],processor:String(processor||'unknown'),layout,layoutLabel:labels[layout]};
}
