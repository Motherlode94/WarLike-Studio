import {ambienceLayout} from './vox-ambience-model.js';
export const VOX_AMBIENCE_BANKS=Object.freeze([['01 · SLAPBACK',['slap','feedback','tone']],['02 · LEVELS',['slapLevel','room']],['03 · FX SEND',['mix']]]);
const active=new WeakMap(),x=ms=>24+ms/540*310;
function graph(){
 const grid=[0,100,200,300,400,500].map(t=>'<path d="M'+x(t)+' 16V125" stroke="#393445"/><text x="'+x(t)+'" y="141" font-size="9" text-anchor="middle" fill="#d5cbe8">'+t+'</text>').join('');
 return '<svg viewBox="0 0 360 150" role="img" aria-label="Schéma temporel des répétitions et de la pièce"><rect x="1" y="1" width="358" height="148" rx="4" fill="#171520" stroke="#716782"/>'+grid+'<path d="M24 125H334" stroke="#897c9d"/><path d="M24 125V19" stroke="#e8e4ed" stroke-width="2"/><rect data-room-window x="24" y="88" height="37" width="0" fill="#96b6d0" opacity=".25"/><path data-room-envelope fill="none" stroke="#96b6d0" stroke-width="2"/>'+Array.from({length:4},(_,i)=>'<path data-amb-echo="'+i+'" stroke="#d6b1f4" stroke-width="3"/>').join('')+'<text x="29" y="13" font-size="9" fill="#e8e4ed">DRY</text><text x="337" y="141" font-size="8" fill="#d5cbe8">ms</text></svg>';
}
export function mountVoxAmbience(root,{state,master=false}){
 const params=root.querySelector(master?'.master-module-params':'.plugin-window-params');if(!params||root.querySelector('.vox-ambience-hardware'))return;
 const nodes=[...params.querySelectorAll('.param')],keys=new Map(nodes.map(n=>{const i=n.querySelector('input');return [(i?.dataset.param||i?.dataset.masterParam||'').split('.').at(-1),n];}));
 if(nodes.length!==6||VOX_AMBIENCE_BANKS.flatMap(([,ks])=>ks).some(k=>!keys.has(k)))return;
 const face=document.createElement('section');face.className='vox-ambience-hardware';face.setAttribute('aria-label','VOX AMBIENCE Room and Slapback Hardware');
 face.innerHTML='<header class="vox-ambience-brand"><small>WARLIKE / VOX LAB PRO</small><strong>AMBIENCE <span>05</span></strong><small>ROOM · FILTERED SLAPBACK</small></header><div class="vox-ambience-display">'+graph()+'<div class="vox-ambience-legend"><span>━━ Slapback</span><span>━━ Enveloppe room</span><output data-amb-status></output></div><div class="vox-ambience-readouts"><output data-amb-delay></output><output data-amb-room></output></div><small>Schéma nominal : répétitions hors réponse des filtres et enveloppe de décroissance normalisée, pas une mesure du signal ni un RT60.</small><div class="vox-ambience-route"><span>IN → DRY 100% → OUT</span><span>IN → SLAP / ROOM → FX SEND → OUT</span><output data-amb-send></output></div></div><footer>STEREO CONVOLUTION · PARALLEL SEND · NATIVE DSP</footer>';
 params.before(face);face.querySelector('footer').before(params);params.classList.add('vox-ambience-controls');
 const banks=VOX_AMBIENCE_BANKS.map(([label,ks],i)=>{const bank=document.createElement('section');bank.className='vox-ambience-bank';bank.style.setProperty('--vox-bank',['#b7a5e6','#96b6d0','#d6b1a5'][i]);const h=document.createElement('h4');h.textContent=label;bank.append(h,...ks.map(k=>keys.get(k)));return bank;});params.replaceChildren(...banks);
 active.set(face,{state,signature:''});paint(face);
}
function paint(face){
 const e=active.get(face),s=e?.state();if(!s)return;const signature=[s.slap,s.feedback,s.tone,s.slapLevel,s.room,s.mix,s.enabled].join(':');if(signature===e.signature)return;e.signature=signature;
 const model=ambienceLayout(s);
 model.echoes.forEach((p,i)=>face.querySelector('[data-amb-echo="'+i+'"]').setAttribute('d','M'+x(p.time)+' 125V'+(125-p.gain*100)));
 const window=face.querySelector('[data-room-window]');window.setAttribute('width',x(model.roomDurationMs)-24);window.setAttribute('opacity',model.roomGain>0?.25:0);
 face.querySelector('[data-room-envelope]').setAttribute('d',Array.from({length:41},(_,i)=>(i?'L':'M')+x(model.roomDurationMs*i/40)+' '+(125-100*model.roomGain*(1-i/40)**3)).join(''));
 face.querySelector('[data-amb-status]').textContent=s.enabled===false?'BYPASS':s.mix===0||(!s.room&&!s.slapLevel)?'DRY':'ACTIVE';
 face.querySelector('[data-amb-delay]').textContent='SLAP '+s.slap+' ms · FB '+Math.round(s.feedback*100)+'%';
 face.querySelector('[data-amb-room]').textContent='ROOM IR '+Math.round(model.roomDurationMs)+' ms';
 face.querySelector('[data-amb-send]').textContent='DRY 100% · FX '+Math.round((s.enabled===false?0:s.mix)*100)+'%';
}
export function updateVoxAmbienceFaces(root=document){root.querySelectorAll('.vox-ambience-hardware').forEach(paint);}
