// Reuse host controls: state, undo, automation and preset handling remain native.
export function mountVoxProFace(root,{id,title,subtitle,banks,display,footer,state,paint,master=false}){
 const params=root.querySelector(master?'.master-module-params':'.plugin-window-params');if(!params||root.querySelector('.'+id+'-hardware'))return;
 const nodes=[...params.querySelectorAll('.param')],byKey=new Map(nodes.map(n=>{const i=n.querySelector('input');return [(i?.dataset.param||i?.dataset.masterParam||'').split('.').at(-1),n];}));
 const all=banks.flatMap(([,ks])=>ks);if(nodes.length!==all.length||all.some(k=>!byKey.has(k)))return;
 const face=document.createElement('section');face.className=id+'-hardware vox-pro-hardware';face.setAttribute('aria-label','VOX '+title);
 face.innerHTML='<header class="vox-pro-brand"><small>WARLIKE / VOX LAB PRO</small><strong>'+title+'</strong><small>'+subtitle+'</small></header><div class="vox-pro-display">'+display+'</div><footer>'+footer+'</footer>';
 params.before(face);face.querySelector('footer').before(params);params.classList.add('vox-pro-controls');
 const groups=banks.map(([label,ks],i)=>{const bank=document.createElement('section');bank.className='vox-pro-bank';bank.style.setProperty('--vox-bank',['#b7a5e6','#96b6d0','#d6b1a5'][i%3]);const h=document.createElement('h4');h.textContent=label;bank.append(h,...ks.map(k=>byKey.get(k)));return bank;});params.replaceChildren(...groups);
 active.set(face,{state,paint,signature:''});update(face);return face;
}
const active=new WeakMap();
function update(face){const e=active.get(face),s=e?.state();if(!s)return;const next=JSON.stringify(s);if(next===e.signature)return;e.signature=next;e.paint(face,s);}
export function updateVoxProFaces(root=document){root.querySelectorAll('.vox-pro-hardware').forEach(update);}
