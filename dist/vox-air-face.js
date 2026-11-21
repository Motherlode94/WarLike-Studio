// Calculated complex response of the actual VOX AIR EQ topology at 48 kHz.
// The dry path and wet output gain are included; this is not a live spectrum.
export const VOX_AIR_BANKS=Object.freeze([['01 · HIGH PASS',['highpass']],['02 · PRESENCE',['presenceFreq','presence']],['03 · AIR',['airFreq','air']],['PARALLEL / OUTPUT',['mix','output']]]);
export function mixedResponseDb(real,imag,mix,output,enabled=true){
 if(!enabled)return 0;
 const wet=mix*10**(output/20);
 return 20*Math.log10(Math.max(1e-9,Math.hypot(1-mix+wet*real,wet*imag)));
}
// Create independent analysis filters with immediate values. AudioParam events
// queued by the native processor are evaluated during rendering, not here.
export function createVoxAirAnalysisFilters(ctx){
 const filters=['highpass','peaking','highshelf'].map(type=>{const node=ctx.createBiquadFilter();node.type=type;return node;});
 filters[0].Q.value=Math.SQRT1_2;filters[1].Q.value=.75;return filters;
}
export function voxAirComplexResponse(filters,s,frequencies){
 const [hp,presence,air]=filters;hp.frequency.value=s.highpass;presence.frequency.value=s.presenceFreq;presence.gain.value=s.presence;air.frequency.value=s.airFreq;air.gain.value=s.air;
 const mag=new Float32Array(frequencies.length),phase=new Float32Array(frequencies.length),m=new Float64Array(frequencies.length).fill(1),p=new Float64Array(frequencies.length);
 for(const filter of filters){filter.getFrequencyResponse(frequencies,mag,phase);for(let i=0;i<frequencies.length;i++){m[i]*=mag[i];p[i]+=phase[i];}}
 return {m,p};
}
const active=new WeakMap(),clamp=(v,a,b)=>Math.max(a,Math.min(b,v));
const freq=Float32Array.from({length:240},(_,i)=>20*1000**(i/239)),x=f=>25+Math.log(f/20)/Math.log(1000)*310,y=db=>90-clamp(db,-24,24)*3;
let context;
function graph(){
 const grid=[50,100,500,1000,5000,10000,20000].map(f=>'<path d="M'+x(f)+' 12V162" stroke="#393445"/><text x="'+x(f)+'" y="175" font-size="8" text-anchor="middle" fill="#d5cbe8">'+(f>=1000?f/1000+'k':f)+'</text>').join('');
 const dbs=[-24,-12,0,12,24].map(db=>'<path d="M25 '+y(db)+'H335" stroke="'+(db===0?'#9387a4':'#393445')+'"/><text x="21" y="'+(y(db)+3)+'" text-anchor="end" font-size="8" fill="#d5cbe8">'+db+'</text>').join('');
 return '<svg viewBox="0 0 360 182" role="img" aria-label="Réponse fréquentielle calculée de VOX AIR EQ"><rect x="1" y="1" width="358" height="180" rx="4" fill="#171520" stroke="#716782"/>'+grid+dbs+'<path data-air-wet fill="none" stroke="#84789c" stroke-dasharray="4 3"/><path data-air-response fill="none" stroke="#d6b1f4" stroke-width="2.3"/><path data-air-hp stroke="#96b6d0" stroke-dasharray="3 3"/><path data-air-presence stroke="#b7a5e6" stroke-dasharray="3 3"/><path data-air-shelf stroke="#e5b9a4" stroke-dasharray="3 3"/></svg>';
}
export function mountVoxAir(root,{state,master=false}){
 const params=root.querySelector(master?'.master-module-params':'.plugin-window-params');if(!params||root.querySelector('.vox-air-hardware'))return;
 const nodes=[...params.querySelectorAll('.param')],keys=new Map(nodes.map(n=>{const i=n.querySelector('input');return [(i?.dataset.param||i?.dataset.masterParam||'').split('.').at(-1),n];}));
 if(nodes.length!==7||VOX_AIR_BANKS.flatMap(([,ks])=>ks).some(k=>!keys.has(k)))return;
 const face=document.createElement('section');face.className='vox-air-hardware';face.setAttribute('aria-label','VOX AIR EQ Vocal Presence Hardware');
 face.innerHTML='<header class="vox-air-brand"><small>WARLIKE / VOX LAB PRO</small><strong>AIR EQ <span>04</span></strong><small>HIGH PASS · PRESENCE · AIR SHELF</small></header><div class="vox-air-display">'+graph()+'<div class="vox-air-legend"><span>━━ Réponse combinée</span><span>┄┄ Wet seul</span><output data-air-status></output></div><div class="vox-air-readouts"><output data-air-frequency></output><output data-air-mix></output></div><small>Réponse calculée à 48 kHz, incluant phase, mix et gain de sortie du chemin traité. Pas un analyseur spectral.</small></div><footer>MINIMUM PHASE · PARALLEL MIX · NATIVE DSP</footer>';
 params.before(face);face.querySelector('footer').before(params);params.classList.add('vox-air-controls');
 const banks=VOX_AIR_BANKS.map(([label,ks],i)=>{const bank=document.createElement('section');bank.className='vox-air-bank';bank.style.setProperty('--vox-bank',['#96b6d0','#b7a5e6','#d6b1a5','#aa8bd7'][i]);const h=document.createElement('h4');h.textContent=label;bank.append(h,...ks.map(k=>keys.get(k)));return bank;});params.replaceChildren(...banks);
 context??=new OfflineAudioContext(1,128,48000);
 const filters=createVoxAirAnalysisFilters(context);
 active.set(face,{state,filters,signature:''});paint(face);
}
function paint(face){
 const e=active.get(face),s=e?.state();if(!s)return;
 const signature=[s.highpass,s.presenceFreq,s.presence,s.airFreq,s.air,s.mix,s.output,s.enabled].join(':');if(signature===e.signature)return;e.signature=signature;
 const {m,p}=voxAirComplexResponse(e.filters,s,freq);
 const path=fn=>Array.from(freq,(f,i)=>(i?'L':'M')+x(f).toFixed(2)+' '+y(fn(i)).toFixed(2)).join('');
 face.querySelector('[data-air-wet]').setAttribute('d',path(i=>20*Math.log10(Math.max(1e-9,m[i]))+s.output));
 face.querySelector('[data-air-response]').setAttribute('d',path(i=>mixedResponseDb(m[i]*Math.cos(p[i]),m[i]*Math.sin(p[i]),s.mix,s.output,s.enabled!==false)));
 for(const [key,value] of [['hp',s.highpass],['presence',s.presenceFreq],['shelf',s.airFreq]])face.querySelector('[data-air-'+key+']').setAttribute('d','M'+x(value)+' 12V162');
 face.querySelector('[data-air-status]').textContent=s.enabled===false?'BYPASS':s.mix===0?'DRY':'ACTIVE';
 face.querySelector('[data-air-frequency]').textContent='HP '+Math.round(s.highpass)+' Hz · PRES '+(s.presenceFreq/1000).toFixed(1)+' kHz · AIR '+(s.airFreq/1000).toFixed(1)+' kHz';
 face.querySelector('[data-air-mix]').textContent=Math.round((1-s.mix)*100)+'% DRY / '+Math.round(s.mix*100)+'% WET';
}
export function updateVoxAirFaces(root=document){root.querySelectorAll('.vox-air-hardware').forEach(paint);}
