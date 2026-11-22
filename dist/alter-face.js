// Reuse host controls: state, undo, automation and preset handling remain native.
export function mountAlterFace(root,{id,title,subtitle,banks,display,footer,state,paint,live=false,master=false}){
 const params=root.querySelector(master?'.master-module-params':'.plugin-window-params');if(!params||root.querySelector('.'+id+'-hardware'))return;
 const nodes=[...params.querySelectorAll('.param')],byKey=new Map(nodes.map(n=>{const i=n.querySelector('input');return [(i?.dataset.param||i?.dataset.masterParam||'').split('.').at(-1),n];}));
 const all=banks.flatMap(([,ks])=>ks);if(nodes.length!==all.length||all.some(k=>!byKey.has(k)))return;
 const face=document.createElement('section');face.className=id+'-hardware alter-pro-hardware';face.setAttribute('aria-label','ALTER '+title);
 face.innerHTML='<header class="alter-pro-brand"><small>WARLIKE / ALTER / CREATIVE FX</small><strong>'+title+'</strong><small>'+subtitle+'</small></header><div class="alter-pro-display">'+display+'</div><footer>'+footer+'</footer>';
 params.before(face);face.querySelector('footer').before(params);params.classList.add('alter-pro-controls');
 const groups=banks.map(([label,ks],i)=>{const bank=document.createElement('section');bank.className='alter-pro-bank';bank.style.setProperty('--alter-bank',['#e3a66e','#e0c491','#c58260'][i%3]);const h=document.createElement('h4');h.textContent=label;bank.append(h,...ks.map(k=>byKey.get(k)));return bank;});params.replaceChildren(...groups);
 active.set(face,{state,paint,live,signature:''});update(face);return face;
}
const active=new WeakMap();
function update(face){const e=active.get(face),s=e?.state();if(!s)return;const next=JSON.stringify(s);if(next===e.signature&&!e.live)return;e.signature=next;e.paint(face,s);}
export function updateAlterFaces(root=document){root.querySelectorAll('.alter-pro-hardware').forEach(update);}
