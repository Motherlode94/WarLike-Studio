import {circuitColorTransfer} from './circuit-color-model.js';
export const CIRCUIT_COLOR_BANKS=Object.freeze([['SATURATION',['drive','bias']],['FILTER',['tone']],['PARALLEL / OUTPUT',['mix','output']]]);
const active=new WeakMap();
function graph(){
 const grid=[-1,-.5,0,.5,1].map(v=>'<path d="M'+(180+v*152)+' 14V162 M28 '+(88-v*74)+'H332" stroke="'+(v===0?'#759194':'#304857')+'"/>').join('');
 return '<svg viewBox="0 0 360 182" role="img" aria-label="Courbe statique de saturation"><rect x="1" y="1" width="358" height="180" rx="4" fill="#101e28" stroke="#8195a3"/>'+grid+'<path d="M28 162L332 14" stroke="#8ea7aa" stroke-dasharray="4 4"/><path data-color-transfer fill="none" stroke="#e6be7c" stroke-width="2.5"/><g fill="#dce5dc" font-size="9"><text x="28" y="174">−1</text><text x="326" y="174">+1</text><text x="180" y="174" text-anchor="middle">INPUT</text><text x="5" y="17">+1</text><text x="5" y="162">−1</text></g></svg>';
}
export function mountCircuitColor(root,{state,master=false}){
 const params=root.querySelector(master?'.master-module-params':'.plugin-window-params');if(!params||root.querySelector('.circuit-color-hardware'))return;
 const nodes=[...params.querySelectorAll('.param')],keys=new Map(nodes.map(n=>{const i=n.querySelector('input');return [(i?.dataset.param||i?.dataset.masterParam||'').split('.').at(-1),n];}));
 if(nodes.length!==5||CIRCUIT_COLOR_BANKS.flatMap(([,k])=>k).some(k=>!keys.has(k)))return;
 const face=document.createElement('section');face.className='circuit-color-hardware';face.setAttribute('aria-label','CIRCUIT COLOR Analog Console Hardware');
 face.innerHTML='<header class="circuit-color-brand"><small>WARLIKE / CIRCUIT CONSOLE</small><strong>COLOR <span>03</span></strong><small>ASYMMETRIC CONSOLE SATURATION</small></header><section class="circuit-color-display">'+graph()+'<div class="circuit-color-readouts"><output data-color-drive></output><output data-color-bias></output><output data-color-status></output></div><small>Courbe statique du WaveShaper, avant filtre, mix et sortie. Pas un oscilloscope du signal.</small></section><footer>2× OVERSAMPLING · DC BLOCK 20 Hz · NATIVE DSP</footer>';
 params.before(face);face.querySelector('footer').before(params);params.classList.add('circuit-color-controls');
 const banks=CIRCUIT_COLOR_BANKS.map(([label,ks],i)=>{const bank=document.createElement('section');bank.className='circuit-color-bank';bank.style.setProperty('--color-bank',['#cc755f','#d9ab5d','#72b6ad'][i]);const title=document.createElement('h4');title.textContent=label;bank.append(title,...ks.map(k=>keys.get(k)));return bank;});params.replaceChildren(...banks);
 active.set(face,{state,signature:''});paint(face);
}
function paint(face){
 const e=active.get(face),s=e?.state();if(!s)return;const signature=[s.drive,s.bias,s.enabled,s.mix].join(':');if(signature===e.signature)return;e.signature=signature;
 const fn=circuitColorTransfer(s.drive,s.bias);
 face.querySelector('[data-color-transfer]').setAttribute('d',Array.from({length:161},(_,i)=>{const x=i/80-1;return (i?'L':'M')+(180+x*152).toFixed(2)+' '+(88-fn(x)*74).toFixed(2);}).join(''));
 face.querySelector('[data-color-drive]').textContent='DRIVE '+s.drive.toFixed(1)+' dB';
 face.querySelector('[data-color-bias]').textContent='BIAS '+Math.round(s.bias*100)+'%';
 face.querySelector('[data-color-status]').textContent=s.enabled===false?'BYPASS':s.mix===0?'DRY':'ACTIVE';
}
export function updateCircuitColorFaces(root=document){root.querySelectorAll('.circuit-color-hardware').forEach(paint);}
