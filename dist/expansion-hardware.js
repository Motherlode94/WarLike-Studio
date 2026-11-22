import {EXPANSION_INSTRUMENTS} from './wl-expansion.js';
import {expansionBanks,expansionVisual} from './expansion-hardware-model.js';
const active=new WeakMap();
const svg=(label,body,view='0 0 360 140')=>'<svg viewBox="'+view+'" role="img" aria-label="'+label+'">'+body+'</svg>';
const txt=(x,y,s)=>'<text x="'+x+'" y="'+y+'" text-anchor="middle">'+s+'</text>';
function diagram(m){
 const grid='<path class="guide" d="M24 25H336 M24 65H336 M24 105H336 M24 25V105 M102 25V105 M180 25V105 M258 25V105 M336 25V105"/>';
 let body=grid;
 if(m.bars.length){const w=312/m.bars.length;body+=m.bars.map(([label,v],i)=>{const x=24+w*i+w*.2;return '<rect class="bar-track" x="'+x+'" y="25" width="'+w*.6+'" height="80" rx="3"/><rect class="signal-fill" x="'+x+'" y="'+(105-v*80)+'" width="'+w*.6+'" height="'+v*80+'" rx="3"/>'+txt(x+w*.3,120,label)+txt(x+w*.3,15,v.toFixed(2));}).join('');}
 else if(m.kind==='string'){const x=24+m.points[0]*312;body+='<path class="signal" d="M24 65H336"/><rect class="signal-fill" x="'+(x-7)+'" y="42" width="14" height="46" rx="2"/>'+txt(x,35,'POSITION')+txt(180,120,'MODÈLE DE CORDE · POSITION NORMALISÉE');}
 else if(m.kind==='pitch'){const [drop,time]=m.points;body+='<path class="signal" d="M24 '+(105-drop/24*80)+' L'+(24+time/.25*312)+' 105 H336"/>'+txt(180,122,'CHUTE EN DEMI-TONS · 0–250 ms');}
 else if(m.kind==='formants'){const [a,b,width]=m.points;const x=f=>24+f/1800*312;body+='<path class="signal" d="M24 105 Q'+(x(a)-18)+' 105 '+x(a)+' 30 Q'+(x(a)+18)+' 105 '+(x(b)-18)+' 105 Q'+x(b)+' 20 '+(x(b)+18)+' 105 H336"/>'+txt(x(a),19,'F1')+txt(x(b),19,'F2')+txt(180,122,'FORMANTS CONFIGURÉS · STÉRÉO '+Math.round(width*100)+' %');}
 else if(m.kind==='grains'){body+=m.points.map(([offset,size,noise],i)=>{const x=24+offset*312,y=25+(i%6)*13,w=size*312,a=Math.min(w,336-x);return '<rect class="signal-fill" opacity="'+(.35+noise*.6)+'" x="'+x+'" y="'+y+'" width="'+a+'" height="9" rx="2"/>'+(w>a?'<rect class="signal-fill" opacity=".5" x="24" y="'+y+'" width="'+(w-a)+'" height="9" rx="2"/>':'');}).join('')+txt(180,122,'DISTRIBUTION DES GRAINS · 1 s');}
 return svg('Configuration nominale du moteur sonore',body);
}
function envelope(e){const x=t=>24+312*t/e.end,peak=88-62*e.peak/(.55*10**(3/20));const d=Array.from({length:48},(_,i)=>{const f=(i+1)/48,v=e.peak*(.00001/e.peak)**f;return 'L'+x(e.hold+(e.end-e.hold)*f).toFixed(2)+' '+(88-62*v/(.55*10**(3/20))).toFixed(2);}).join(' ');return svg('Enveloppe nominale de gain, note de référence une seconde','<path class="guide" d="M24 88H336 M24 26V88 M'+x(e.hold)+' 26V88"/><path class="signal" d="M24 88 L'+x(e.attack)+' '+peak+' H'+x(e.hold)+' '+d+'"/>'+txt(180,14,'NOTE DE RÉFÉRENCE : 1 s')+txt(295,102,e.end.toFixed(2)+' s'),'0 0 360 110');}
export function mountExpansionHardware(root,{id,state}){
 const def=EXPANSION_INSTRUMENTS[id],params=root.querySelector('.plugin-window-params');if(!def||!params||root.querySelector('.expansion-hardware'))return;
 const nodes=[...params.querySelectorAll('.param')],byKey=new Map(nodes.map(n=>[(n.querySelector('input')?.dataset.param||'').split('.').at(-1),n])),banks=expansionBanks(id);
 if(nodes.length!==def.controls.length||banks.flatMap(([,keys])=>keys).some(k=>!byKey.has(k)))return;
 const face=document.createElement('section');face.className='expansion-hardware';face.dataset.expansionInstrument=id;face.style.setProperty('--exp-accent',def.color);face.setAttribute('aria-label',def.name+' · Instrument');
 face.innerHTML='<header><small>WARLIKE / WL EXPANSION</small><strong>'+def.name+'</strong><small>'+def.subtitle+'</small></header><div class="expansion-display"><div data-expansion-diagram></div><output data-expansion-readout></output><div data-expansion-envelope></div><small>Configuration calculée, pas une mesure audio. Enveloppe commune avant extinction propre de chaque source.</small></div><footer>MOTEUR NATIF · MIDI · PRESETS · EXPORT</footer>';
 params.before(face);face.querySelector('footer').before(params);params.classList.add('expansion-controls');
 params.replaceChildren(...banks.map(([name,keys])=>{const bank=document.createElement('section');bank.className='expansion-bank';const title=document.createElement('h4');title.textContent=name;bank.append(title,...keys.map(k=>byKey.get(k)));return bank;}));
 active.set(face,{id,state,signature:''});paint(face);return face;
}
function paint(face){const entry=active.get(face),s=entry?.state();if(!s)return;const signature=JSON.stringify(s);if(signature===entry.signature)return;entry.signature=signature;const m=expansionVisual(entry.id,s);face.querySelector('[data-expansion-diagram]').innerHTML=diagram(m);face.querySelector('[data-expansion-envelope]').innerHTML=envelope(m.envelope);face.querySelector('[data-expansion-readout]').textContent=m.detail.join(' · ');}
export function updateExpansionHardware(root=document){root.querySelectorAll('.expansion-hardware').forEach(paint);}
