import {mountVoxProFace} from './vox-pro-face.js';
import {doublerLayout} from './vox-doubler-model.js';
export const DOUBLER_BANKS=Object.freeze([['DOUBLE / MODULATION',['voices','detune','delay']],['STEREO / MIX',['width','mix']]]);
const x=v=>180+v*146;
const graph='<svg viewBox="0 0 360 152" role="img" aria-label="Placement stéréo configuré des deux retards"><rect x="1" y="1" width="358" height="150" rx="4" fill="#171520" stroke="#716782"/>'+[-1,-.5,0,.5,1].map(v=>'<path d="M'+x(v)+' 24V112" stroke="'+(v===0?'#9387a4':'#393445')+'"/>').join('')+'<path d="M34 76H326" stroke="#9387a4"/><path data-double-span d="" stroke="#b7a5e6" stroke-width="3"/><circle cx="180" cy="76" r="5" fill="#eee5f6"/><circle data-double-left cy="54" r="8" fill="#96b6d0"/><circle data-double-right cy="98" r="8" fill="#d6b1a5"/><g fill="#d5cbe8" font-size="10"><text x="34" y="18" text-anchor="middle">L</text><text x="180" y="18" text-anchor="middle">C</text><text x="326" y="18" text-anchor="middle">R</text><text x="180" y="138" text-anchor="middle">PANORAMIQUE CONFIGURÉ · NON MESURÉ</text></g></svg>';
export function mountVoxDoubler(root,options){
 const face=mountVoxProFace(root,{...options,id:'vox-doubler',title:'DOUBLER 08',subtitle:'DUAL MODULATED STEREO DELAY',banks:DOUBLER_BANKS,display:graph+'<div class="vox-pro-profile"><div>LEFT<output data-double-l></output><small data-double-lfo-l></small></div><div>RIGHT<output data-double-r></output><small data-double-lfo-r></small></div></div><div class="vox-pro-readouts"><output data-double-width></output><output data-double-mix></output><output data-double-status></output></div><small>Deux lignes de retard physiques. Voices règle leur gain (plafonné à 2) ; Detune règle la profondeur de modulation du délai, sans garantir une transposition fixe en cents.</small>',footer:'2 MODULATED DELAYS · 0.53 / 0.70 Hz LFO · NATIVE DSP',paint(face,s){
 const m=doublerLayout(s),[l,r]=m.voices;
 face.querySelector('[data-double-left]').setAttribute('cx',x(l.pan));face.querySelector('[data-double-right]').setAttribute('cx',x(r.pan));
 face.querySelector('[data-double-span]').setAttribute('d','M'+x(l.pan)+' 76H'+x(r.pan));
 for(const [id,v] of [['l',l],['r',r]]){face.querySelector('[data-double-'+id+']').textContent=(v.base*1000).toFixed(1)+' ms';face.querySelector('[data-double-lfo-'+id+']').textContent='±'+(v.depth*1000).toFixed(2)+' ms · '+v.rate.toFixed(2)+' Hz';}
 face.querySelector('[data-double-width]').textContent='WIDTH '+Math.round(s.width*100)+'%';face.querySelector('[data-double-mix]').textContent='DRY '+Math.round(m.dry*100)+'% / WET '+Math.round(m.wet*100)+'%';face.querySelector('[data-double-status]').textContent=s.enabled===false?'BYPASS':m.wet===0?'DRY':'ACTIVE';
 }});
 if(face){for(const [key,label] of [['voices','Double level'],['detune','Mod depth']]){const input=face.querySelector('[data-param$=".'+key+'"],[data-master-param$=".'+key+'"]');const param=input?.closest('.param');if(param){param.querySelector('label').textContent=label;input.setAttribute('aria-label',label);}}}
 return face;
}
