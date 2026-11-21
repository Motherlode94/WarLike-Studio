// VECTOR EQ presentation only. Move existing native controls; never clone inputs.
export const VECTOR_BANDS=Object.freeze(['LOW','LOW MID','MID','UPPER MID','PRESENCE','AIR']);
export function vectorBandKeys(index){return ['f'+index,'g'+index,'q'+index];}
export function mountVectorEqFace(root,section,params,state){
 const controls=[...params.querySelectorAll('.param')];
 const keys=new Map(controls.map(node=>{const input=node.querySelector('input');return [(input?.dataset.param||input?.dataset.masterParam||'').split('.').at(-1),node];}));
 if(controls.length!==19||![...VECTOR_BANDS.flatMap((_,i)=>vectorBandKeys(i)),'output'].every(k=>keys.has(k)))return;
 const face=document.createElement('section');face.className='vector-eq-hardware';face.setAttribute('aria-label','VECTOR EQ Analog Hardware');
 face.innerHTML='<header class="vector-eq-brand"><small>WARLIKE / VECTOR SERIES</small><strong>EQ <span>06</span></strong><span>SIX BAND PARAMETRIC · MINIMUM PHASE</span></header><div class="vector-eq-screen"></div><footer class="vector-eq-footer"><span>6 × PEAKING FILTERS</span><span>NATIVE DSP / STEREO</span></footer>';
 section.before(face);face.querySelector('.vector-eq-screen').append(section);
 face.querySelector('footer').before(params);
 params.classList.add('vector-eq-controls');
 // Older track rack has band wrappers; master has a flat control list.
 // Move the original inputs to the new semantic banks in either case.
 const banks=VECTOR_BANDS.map((label,i)=>{const bank=document.createElement('section');bank.className='vector-band vector-eq-bank';bank.dataset.vectorBand=String(i);bank.style.setProperty('--band-accent',['#e0b478','#d4c477','#b2c69c','#78c4bd','#8daed9','#c2a4d6'][i]);const heading=document.createElement('h4');heading.textContent='B'+(i+1)+' · '+label;bank.append(heading,...vectorBandKeys(i).map(k=>keys.get(k)));return bank;});
 const output=document.createElement('section');output.className='vector-band vector-output vector-eq-bank';const title=document.createElement('h4');title.textContent='OUTPUT';output.append(title,keys.get('output'));
 params.replaceChildren(...banks,output);
 const caption=document.createElement('small');caption.className='vector-eq-caption';caption.textContent='Réponse calculée des 6 filtres · avant gain de sortie · pas un analyseur spectral';face.querySelector('.vector-eq-screen').append(caption);
 return face;
}
