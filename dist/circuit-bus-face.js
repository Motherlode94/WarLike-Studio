// CIRCUIT BUS uses the native compressor instance, not an estimated loudness meter.
export const CIRCUIT_BUS_BANKS=Object.freeze([['DETECTOR',['threshold','ratio','knee']],['TIME CONSTANT',['attack','release']],['PARALLEL / OUTPUT',['mix','output']]]);
export const busReduction=db=>Math.max(0,Math.min(24,-(Number.isFinite(db)?db:0)));
const entries=new WeakMap();
function meterMarkup(){
 const ticks=[0,3,6,9,12,18,24].map(v=>'<text x="'+(22+v/24*316)+'" y="20" text-anchor="middle" font-size="10" fill="#cfdbdd">'+v+'</text>').join('');
 const leds=Array.from({length:24},(_,i)=>'<rect data-bus-led="'+i+'" x="'+(22+i*13.2)+'" y="31" width="10" height="24" rx="1" fill="#33434a"/>').join('');
 return '<svg viewBox="0 0 360 82" role="img" aria-label="Réduction de gain en décibels"><rect x="2" y="2" width="356" height="78" rx="4" fill="#101d29" stroke="#8195a3"/>'+ticks+leds+'<text x="180" y="70" text-anchor="middle" font-size="9" letter-spacing="2" fill="#cfdbdd">COMPRESSOR GAIN REDUCTION · dB</text></svg>';
}
export function mountCircuitBus(root,{state,getReduction,master=false}){
 const params=root.querySelector(master?'.master-module-params':'.plugin-window-params');if(!params||root.querySelector('.circuit-bus-hardware'))return;
 const nodes=[...params.querySelectorAll('.param')],byKey=new Map(nodes.map(n=>{const i=n.querySelector('input');return [(i?.dataset.param||i?.dataset.masterParam||'').split('.').at(-1),n];}));
 if(nodes.length!==7||CIRCUIT_BUS_BANKS.flatMap(([,keys])=>keys).some(k=>!byKey.has(k)))return;
 const face=document.createElement('section');face.className='circuit-bus-hardware';face.setAttribute('aria-label','CIRCUIT BUS Analog Console Hardware');
 face.innerHTML='<header class="circuit-bus-brand"><small>WARLIKE / CIRCUIT CONSOLE</small><strong>BUS <span>02</span></strong><small>STEREO PARALLEL BUS COMPRESSOR</small></header><section class="circuit-bus-meter">'+meterMarkup()+'<div><strong data-bus-status>ACTIVE</strong><output data-bus-gr>0.0 dB</output></div><small>Réduction du compresseur interne, avant mix parallèle et gain de sortie.</small></section><section class="circuit-bus-blend"><div><span>DRY</span><span>WET</span></div><div class="circuit-bus-blend-track"><i data-bus-wet></i></div><output data-bus-mix></output></section><footer>BUS DYNAMICS · ALIGNED PARALLEL PATH · NATIVE DSP</footer>';
 params.before(face);face.querySelector('footer').before(params);params.classList.add('circuit-bus-controls');
 const banks=CIRCUIT_BUS_BANKS.map(([label,keys],i)=>{const bank=document.createElement('section');bank.className='circuit-bus-bank';bank.style.setProperty('--bus-bank',['#cc755f','#d9ab5d','#72b6ad'][i]);const title=document.createElement('h4');title.textContent=label;bank.append(title,...keys.map(k=>byKey.get(k)));return bank;});params.replaceChildren(...banks);
 entries.set(face,{state,getReduction});paint(face);
}
function paint(face){
 const e=entries.get(face),s=e?.state();if(!s)return;
 const enabled=s.enabled!==false,db=enabled?Math.min(0,Number(e.getReduction())||0):0,amount=busReduction(db);
 for(const led of face.querySelectorAll('[data-bus-led]')){const n=Number(led.dataset.busLed);led.setAttribute('fill',n<Math.round(amount)?(n>=15?'#da785f':n>=6?'#e5b66e':'#9bc9a8'):'#33434a');}
 face.querySelector('[data-bus-gr]').textContent=db.toFixed(1)+' dB';
 const status=face.querySelector('[data-bus-status]');status.textContent=!enabled?'BYPASS':amount>.1?'COMPRESSING':'ACTIVE';status.dataset.compressing=String(enabled&&amount>.1);
 const wet=Math.max(0,Math.min(1,Number(s.mix)||0));face.querySelector('[data-bus-wet]').style.width=wet*100+'%';face.querySelector('[data-bus-mix]').textContent=Math.round((1-wet)*100)+'% DRY / '+Math.round(wet*100)+'% WET';
}
export function updateCircuitBusFaces(root=document){root.querySelectorAll('.circuit-bus-hardware').forEach(paint);}
