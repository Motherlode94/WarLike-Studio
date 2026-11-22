import {exoAirTransfer,exoAirWet} from './exo-air-model.js';
import {hardwarePresetBank,applyHardwarePreset,mountHardwareMasterPresets} from './hardware-presets.js';
export const isExoAir=id=>id==='exoair';
export const EXO_AIR_BANKS=Object.freeze([['01 / BAND',['frequency']],['02 / EXCITER',['drive']],['03 / OUTPUT',['mix','output']]]);
export function exoAirPresetBank(id,definition,factory,storage){return isExoAir(id)?hardwarePresetBank(id,definition,factory,storage):[];}
export function applyExoAirPreset(state,id,definition,preset){if(!isExoAir(id))throw Error('Module hors EXO AIR');return applyHardwarePreset(state,id,definition,preset);}
export function mountExoAirPresets(root,options){return mountHardwareMasterPresets(root,{...options,faceSelector:'.exo-air-hardware',collection:'EXO',sectionClass:'exo-air-presets',saveAttribute:'data-exo-air-save'});}
const active=new WeakMap();
function graph(){return '<svg viewBox="0 0 360 164" role="img" aria-label="Fonction de transfert statique du waveshaper"><rect x="1" y="1" width="358" height="162" rx="4" fill="#081218" stroke="#31545e"/>'+[-1,-.5,0,.5,1].map(v=>'<path d="M'+(180+v*150)+' 14V140 M30 '+(77-v*63)+'H330" stroke="'+(v===0?'#527a85':'#19343d')+'"/>').join('')+'<path d="M30 140L330 14" stroke="#527a85" stroke-dasharray="4 3"/><path data-exo-air-curve fill="none" stroke="#6ef2eb" stroke-width="2.3"/><text x="180" y="155" text-anchor="middle" fill="#a5c7ce" font-size="9">STATIC TRANSFER · BEFORE FILTER / MIX</text></svg>';}
export function mountExoAir(root,{state,master=false}){
 const params=root.querySelector(master?'.master-module-params':'.plugin-window-params');if(!params||root.querySelector('.exo-air-hardware'))return;
 const nodes=[...params.querySelectorAll('.param')],byKey=new Map(nodes.map(n=>{const i=n.querySelector('input');return [(i?.dataset.param||i?.dataset.masterParam||'').split('.').at(-1),n];}));
 if(nodes.length!==4||EXO_AIR_BANKS.flatMap(([,ks])=>ks).some(k=>!byKey.has(k)))return;
 const surface=document.createElement('section');surface.className='exo-air-hardware';surface.setAttribute('aria-label','EXO AIR Harmonic Exciter Hardware');
 surface.innerHTML='<header class="exo-air-brand"><small>WARLIKE / EXO COLLECTION</small><strong>AIR 03</strong><small>HARMONIC EXCITER</small></header><div class="exo-air-display">'+graph()+'<div class="exo-air-readouts"><output data-exo-air-freq></output><output data-exo-air-drive></output><output data-exo-air-status></output></div><div class="exo-air-routing"><span>IN → DIRECT 100% → SUM</span><span>IN → HP → SHAPER 2× → HP → SEND → SUM</span><span>SUM → OUTPUT</span><output data-exo-air-send></output><output data-exo-air-output></output></div><small>Courbe statique du saturateur, pas un spectre mesuré. Amount pilote le gain du chemin harmonique (maximum 0,35) ; le signal direct reste à gain unitaire avant le trim commun.</small></div><footer>2× OVERSAMPLING · PARALLEL HIGH-PASS EXCITER · NATIVE DSP</footer>';
 params.before(surface);surface.querySelector('footer').before(params);params.classList.add('exo-air-controls');
 const groups=EXO_AIR_BANKS.map(([label,ks],i)=>{const bank=document.createElement('section');bank.className='exo-air-bank';bank.style.setProperty('--vox-bank',['#60c9d8','#6ef2eb','#e6c38d'][i]);const h=document.createElement('h4');h.textContent=label;bank.append(h,...ks.map(k=>byKey.get(k)));return bank;});params.replaceChildren(...groups);
 active.set(surface,{state,signature:''});paint(surface);return surface;
}
function paint(face){const e=active.get(face),s=e?.state();if(!s)return;const signature=[s.frequency,s.drive,s.mix,s.output,s.enabled].join(':');if(signature===e.signature)return;e.signature=signature;
 const f=exoAirTransfer(s.drive),enabled=s.enabled!==false,wet=exoAirWet(s.mix,enabled);
 face.querySelector('[data-exo-air-curve]').setAttribute('d',Array.from({length:161},(_,i)=>{const x=i/80-1;return (i?'L':'M')+(180+x*150).toFixed(2)+' '+(77-f(x)*63).toFixed(2);}).join(''));
 face.querySelector('[data-exo-air-freq]').textContent='HP '+Math.round(s.frequency)+' Hz';
 face.querySelector('[data-exo-air-drive]').textContent='DRIVE '+s.drive.toFixed(1)+' dB';
 face.querySelector('[data-exo-air-send]').textContent='HARMONIC SEND '+(wet*100).toFixed(1)+'%';
 face.querySelector('[data-exo-air-output]').textContent='OUTPUT '+(enabled?s.output:0).toFixed(1)+' dB';
 face.querySelector('[data-exo-air-status]').textContent=!enabled?'BYPASS':s.mix===0?'DIRECT ONLY':'ACTIVE';
}
export function updateExoAirFaces(root=document){root.querySelectorAll('.exo-air-hardware').forEach(paint);}
