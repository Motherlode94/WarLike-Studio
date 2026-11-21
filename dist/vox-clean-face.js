import {voxCleanReduction} from './vox-clean-model.js';
export const VOX_CLEAN_BANKS=Object.freeze([['01 · HIGH PASS',['highpass']],['02 · DE-ESSER',['frequency','threshold','range']],['03 · AIR / OUTPUT',['air','output']]]);
const active=new Map();
function attach(node){
 const analyser=node.context.createAnalyser();analyser.fftSize=256;node.connect(analyser);const buffer=new Float32Array(256);
 return {read(){analyser.getFloatTimeDomainData(buffer);let sum=0;for(const v of buffer)sum+=v;return voxCleanReduction(sum/buffer.length);},dispose(){try{node.disconnect(analyser);}catch{}analyser.disconnect();}};
}
function detach(e){e.tap?.dispose();e.tap=null;e.stage=null;}
const x=f=>18+Math.log(f/20)/Math.log(1000)*324;
function graph(){
 const ticks=[20,100,500,1000,3000,10000,20000].map(f=>'<path d="M'+x(f)+' 12V78" stroke="#393445"/><text x="'+x(f)+'" y="94" text-anchor="middle" font-size="8" fill="#d5cbe8">'+(f>=1000?f/1000+'k':f)+'</text>').join('');
 return '<svg viewBox="0 0 360 104" role="img" aria-label="Repères de fréquence du coupe-bas, du de-esser et du shelf air"><rect x="1" y="1" width="358" height="102" rx="4" fill="#171520" stroke="#716782"/>'+ticks+'<rect data-clean-band x="0" y="12" width="0" height="66" fill="#b39ae6" opacity=".22"/><path data-clean-hp stroke="#8baecb" stroke-width="2"/><path data-clean-focus stroke="#c4a3f5" stroke-width="2"/><path d="M'+x(10000)+' 12V78" stroke="#e5b9a4" stroke-width="2" stroke-dasharray="3 3"/><g fill="#e5d6f8" font-size="9"><text x="22" y="24">HP</text><text x="180" y="24" text-anchor="middle">DE-ESS</text><text x="337" y="24" text-anchor="end">AIR</text></g></svg>';
}
export function mountVoxClean(root,{state,getStage,master=false}){
 const params=root.querySelector(master?'.master-module-params':'.plugin-window-params');if(!params||root.querySelector('.vox-clean-hardware'))return;
 const nodes=[...params.querySelectorAll('.param')],keys=new Map(nodes.map(n=>{const i=n.querySelector('input');return [(i?.dataset.param||i?.dataset.masterParam||'').split('.').at(-1),n];}));
 if(nodes.length!==6||VOX_CLEAN_BANKS.flatMap(([,k])=>k).some(k=>!keys.has(k)))return;
 const face=document.createElement('section');face.className='vox-clean-hardware';face.setAttribute('aria-label','VOX CLEAN Vocal Cleanup Hardware');
 face.innerHTML='<header class="vox-clean-brand"><small>WARLIKE / VOX LAB</small><strong>CLEAN <span>03</span></strong><small>VOCAL CLEANUP &amp; AIR</small></header><div class="vox-clean-display">'+graph()+'<small>Repères de fréquence, pas un analyseur spectral ni une réponse dynamique mesurée.</small><div class="vox-clean-readouts"><output data-clean-freq></output><output data-clean-air></output></div><section class="vox-clean-gr"><header><strong>DE-ESS · BAND GR</strong><output data-clean-gr>0.0 dB</output></header><div class="vox-clean-leds">'+Array.from({length:18},(_,i)=>'<i data-clean-led="'+i+'"></i>').join('')+'</div><div class="vox-clean-scale"><span>0</span><span>6</span><span>12</span><span>18 dB</span></div><strong data-clean-status>HORS SIGNAL</strong></section><small>Réduction estimée à partir du signal de contrôle interne, sur une fenêtre courte. Ne mesure pas la réduction du signal vocal entier.</small></div><footer>HIGH PASS · DYNAMIC SIBILANCE BAND · AIR SHELF 10 kHz</footer>';
 params.before(face);face.querySelector('footer').before(params);params.classList.add('vox-clean-controls');
 const banks=VOX_CLEAN_BANKS.map(([label,ks],i)=>{const bank=document.createElement('section');bank.className='vox-clean-bank';bank.style.setProperty('--vox-bank',['#96b6d0','#b7a5e6','#d6b1a5'][i]);const h=document.createElement('h4');h.textContent=label;bank.append(h,...ks.map(k=>keys.get(k)));return bank;});params.replaceChildren(...banks);
 const entry={state,getStage,stage:null,tap:null};active.set(face,entry);paint(face,entry);
}
function paint(face,e){
 const s=e.state();if(!s){detach(e);return;}
 const enabled=s.enabled!==false,stage=enabled&&face.getClientRects().length?e.getStage():null;
 if(stage!==e.stage){detach(e);if(stage?.control){e.tap=attach(stage.control);e.stage=stage;}}
 const gr=e.tap?.read()??0;
 face.querySelector('[data-clean-gr]').textContent=gr.toFixed(1)+' dB';
 for(const led of face.querySelectorAll('[data-clean-led]'))led.classList.toggle('lit',Number(led.dataset.cleanLed)<Math.round(-gr));
 face.querySelector('[data-clean-status]').textContent=!enabled?'BYPASS':!stage?'HORS SIGNAL':gr<-.1?'DE-ESSING':'ACTIVE';
 face.querySelector('[data-clean-freq]').textContent='HP '+Math.round(s.highpass)+' Hz · DE-ESS '+Math.round(s.frequency)+' Hz';
 face.querySelector('[data-clean-air]').textContent='AIR '+s.air.toFixed(1)+' dB';
 const hp=x(s.highpass),focus=x(s.frequency),left=x(Math.max(20,s.frequency/1.8)),right=x(Math.min(20000,s.frequency*1.8));
 face.querySelector('[data-clean-hp]').setAttribute('d','M'+hp+' 12V78');
 face.querySelector('[data-clean-focus]').setAttribute('d','M'+focus+' 12V78');
 const band=face.querySelector('[data-clean-band]');band.setAttribute('x',left);band.setAttribute('width',right-left);
}
export function updateVoxCleanFaces(){for(const [face,e] of active){if(!face.isConnected){detach(e);active.delete(face);}else paint(face,e);}}
