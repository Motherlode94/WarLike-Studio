// Preserve original native EQ controls, host automation, and presets.
export const CIRCUIT_EQ_BANDS=Object.freeze([
 {label:'LF',type:'LOW SHELF',frequency:'lowFreq',gain:'low',color:'#cc755f'},
 {label:'LMF',type:'BELL',frequency:'bodyFreq',gain:'body',color:'#d9ab5d'},
 {label:'HMF',type:'BELL',frequency:'presenceFreq',gain:'presence',color:'#72b6ad'},
 {label:'HF',type:'HIGH SHELF',frequency:'airFreq',gain:'air',color:'#87a6d1'}
].map(Object.freeze));
export const circuitProportionalQ=gain=>.5+Math.abs(gain)/5;
export function mountCircuitEqFace(section,params){
 const controls=[...params.querySelectorAll('.param')],keys=new Map(controls.map(node=>{const input=node.querySelector('input');return [(input?.dataset.param||input?.dataset.masterParam||'').split('.').at(-1),node];}));
 if(controls.length!==9||![...CIRCUIT_EQ_BANDS.flatMap(b=>[b.frequency,b.gain]),'output'].every(k=>keys.has(k)))return;
 const face=document.createElement('section');face.className='circuit-eq-hardware';face.setAttribute('aria-label','CIRCUIT EQ Console Hardware');
 face.innerHTML='<header class="circuit-eq-brand"><small>WARLIKE / CIRCUIT CONSOLE</small><strong>EQ <span>04</span></strong><small>PROPORTIONAL-Q · FOUR BAND</small></header><div class="circuit-eq-display"></div><footer>LF / HF SHELF · LMF / HMF BELL · NATIVE STEREO DSP</footer>';
 section.before(face);face.querySelector('.circuit-eq-display').append(section);face.querySelector('footer').before(params);params.classList.add('circuit-eq-controls');
 const banks=CIRCUIT_EQ_BANDS.map((b,i)=>{const bank=document.createElement('section');bank.className='circuit-eq-bank';bank.dataset.circuitBand=String(i);bank.style.setProperty('--circuit-band',b.color);const title=document.createElement('h4');title.textContent=b.label+' / '+b.type;bank.append(title,keys.get(b.frequency),keys.get(b.gain));if(b.type==='BELL'){const out=document.createElement('output');out.dataset.circuitQ=String(i);bank.append(out);}return bank;});
 const output=document.createElement('section');output.className='circuit-eq-bank circuit-eq-output';const title=document.createElement('h4');title.textContent='OUTPUT';output.append(title,keys.get('output'));params.replaceChildren(...banks,output);
 const note=document.createElement('small');note.textContent='Réponse calculée des filtres, avant gain de sortie. Q automatique sur les médiums ; pas de réglage Q indépendant.';face.querySelector('.circuit-eq-display').append(note);
 return face;
}
export function updateCircuitEqFace(face,state){
 for(const output of face.querySelectorAll('[data-circuit-q]')){const band=CIRCUIT_EQ_BANDS[Number(output.dataset.circuitQ)];output.textContent='AUTO Q '+circuitProportionalQ(state[band.gain]).toFixed(2);}
}
