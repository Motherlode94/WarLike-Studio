// Two separate readings from the independent serial compressor stages.
export const VOX_LEVEL_BANKS=Object.freeze([['01 · PEAK CONTROL',['peakThreshold']],['02 · PHRASE LEVEL',['levelThreshold','ratio','release']],['PARALLEL / OUTPUT',['mix','output']]]);
export const voxReduction=db=>Math.max(0,Math.min(24,-(Number.isFinite(db)?db:0)));
const entries=new WeakMap();
function meter(label,id){
 const ticks=[0,3,6,9,12,18,24].map(v=>'<text x="'+(20+v/24*308)+'" y="19" text-anchor="middle" font-size="10" fill="#d5cbe8">'+v+'</text>').join('');
 const leds=Array.from({length:24},(_,i)=>'<rect data-vox-led="'+i+'" x="'+(20+i*12.8)+'" y="28" width="10" height="19" rx="2" fill="#343044"/>').join('');
 return '<section class="vox-level-meter" data-vox-stage="'+id+'"><header><strong>'+label+'</strong><output>0.0 dB</output></header><svg viewBox="0 0 350 58" role="img" aria-label="'+label+' · réduction de gain"><rect x="1" y="1" width="348" height="56" rx="4" fill="#171520" stroke="#716782"/>'+ticks+leds+'</svg></section>';
}
export function mountVoxLevel(root,{state,getStage,master=false}){
 const params=root.querySelector(master?'.master-module-params':'.plugin-window-params');if(!params||root.querySelector('.vox-level-hardware'))return;
 const nodes=[...params.querySelectorAll('.param')],keys=new Map(nodes.map(n=>{const i=n.querySelector('input');return [(i?.dataset.param||i?.dataset.masterParam||'').split('.').at(-1),n];}));
 if(nodes.length!==6||VOX_LEVEL_BANKS.flatMap(([,k])=>k).some(k=>!keys.has(k)))return;
 const face=document.createElement('section');face.className='vox-level-hardware';face.setAttribute('aria-label','VOX LEVEL Dual Stage Vocal Compressor');
 face.innerHTML='<header class="vox-level-brand"><small>WARLIKE / VOX LAB</small><strong>LEVEL <span>02</span></strong><small>DUAL-STAGE VOCAL COMPRESSOR</small></header><div class="vox-level-display">'+meter('01 · PEAK CONTROL','peak')+'<div class="vox-level-flow">↓ SERIAL SIGNAL PATH</div>'+meter('02 · PHRASE LEVEL','phrase')+'<div class="vox-level-summary"><strong data-vox-status>ACTIVE</strong><output data-vox-total>0.0 dB</output></div><small>Somme des réductions internes avant mix et gain de sortie. Ce n’est pas une mesure de loudness.</small></div><section class="vox-level-blend"><span>PARALLEL MIX</span><div><i data-vox-wet></i></div><output data-vox-mix></output></section><footer>PEAK : 6:1 · ATTACK 2 ms · RELEASE 80 ms<br>PHRASE : ATTACK 25 ms · DRY PATH 12 ms</footer>';
 params.before(face);face.querySelector('footer').before(params);params.classList.add('vox-level-controls');
 const banks=VOX_LEVEL_BANKS.map(([label,ks],i)=>{const bank=document.createElement('section');bank.className='vox-level-bank';bank.style.setProperty('--vox-bank',['#aa8bd7','#b7a5e6','#96b6d0'][i]);const h=document.createElement('h4');h.textContent=label;bank.append(h,...ks.map(k=>keys.get(k)));return bank;});params.replaceChildren(...banks);
 entries.set(face,{state,getStage});paint(face);
}
function paint(face){
 const e=entries.get(face),s=e?.state();if(!s)return;
 const enabled=s.enabled!==false,stage=enabled?e.getStage():null;
 const reduction=node=>Math.min(0,Number.isFinite(node?.reduction)?node.reduction:0);
 const values=[reduction(stage?.comp),reduction(stage?.second)];
 for(const [i,id] of ['peak','phrase'].entries()){
  const meter=face.querySelector('[data-vox-stage="'+id+'"]'),db=values[i],n=voxReduction(db);
  meter.querySelector('output').textContent=db.toFixed(1)+' dB';
  for(const led of meter.querySelectorAll('[data-vox-led]')){const j=Number(led.dataset.voxLed);led.setAttribute('fill',j<Math.round(n)?(j>=15?'#e5a088':j>=6?'#d6b1f4':'#a08bdf'):'#343044');}
 }
 const total=values[0]+values[1];face.querySelector('[data-vox-total]').textContent=total.toFixed(1)+' dB · TOTAL GR';
 const status=face.querySelector('[data-vox-status]');status.textContent=!enabled?'BYPASS':total<-.1?'COMPRESSING':stage?'ACTIVE':'HORS SIGNAL';
 const wet=Math.max(0,Math.min(1,Number(s.mix)||0));face.querySelector('[data-vox-wet]').style.width=wet*100+'%';face.querySelector('[data-vox-mix]').textContent=Math.round((1-wet)*100)+'% DRY / '+Math.round(wet*100)+'% WET';
}
export function updateVoxLevelFaces(root=document){root.querySelectorAll('.vox-level-hardware').forEach(paint);}
