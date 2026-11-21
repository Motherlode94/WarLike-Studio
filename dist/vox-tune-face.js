import {SCALES} from './tune-dsp.js?v=0.14.0';
export const VOX_TUNE_KEYS=Object.freeze(['Do','Do♯','Ré','Mi♭','Mi','Fa','Fa♯','Sol','La♭','La','Si♭','Si']);
export const VOX_TUNE_SCALES=Object.freeze(['minor','major','chromatic']);
export const VOX_TUNE_BANKS=Object.freeze([['KEY / SCALE',['key','scale']],['CORRECTION',['speed','amount','mix']]]);
export function allowedPitchClasses(key,scale){return (SCALES[VOX_TUNE_SCALES[Math.round(scale)]]||SCALES.minor).map(n=>((n+Math.round(key))%12+12)%12);}
export function pitchLabel(midi){if(!Number.isFinite(midi))return '—';const n=Math.round(midi);return VOX_TUNE_KEYS[(n%12+12)%12]+(Math.floor(n/12)-1);}
const active=new Map(),subscriptions=new WeakMap();
function detach(entry){
 if(!entry.node)return;const sub=subscriptions.get(entry.node);if(sub){sub.entries.delete(entry);if(!sub.entries.size){entry.node.port.removeEventListener('message',sub.listener);entry.node.port.postMessage({type:'vox-tune-monitor',enabled:false});subscriptions.delete(entry.node);}}
 entry.node=null;entry.report=null;entry.reportAt=0;
}
function attach(entry,node){
 let sub=subscriptions.get(node);if(!sub){sub={entries:new Set(),listener:null};sub.listener=e=>{if(e.data?.type==='vox-tune-telemetry')for(const item of sub.entries){item.report=e.data;item.reportAt=performance.now();}};subscriptions.set(node,sub);node.port.addEventListener('message',sub.listener);node.port.start();node.port.postMessage({type:'vox-tune-monitor',enabled:true});}
 sub.entries.add(entry);entry.node=node;
}
export function mountVoxTune(root,{state,getStage,checkpoint,master=false}){
 const params=root.querySelector(master?'.master-module-params':'.plugin-window-params');if(!params||root.querySelector('.vox-tune-hardware'))return;
 const nodes=[...params.querySelectorAll('.param')],keys=new Map(nodes.map(n=>{const i=n.querySelector('input');return [(i?.dataset.param||i?.dataset.masterParam||'').split('.').at(-1),n];}));
 if(nodes.length!==5||VOX_TUNE_BANKS.flatMap(([,ks])=>ks).some(k=>!keys.has(k)))return;
 const face=document.createElement('section');face.className='vox-tune-hardware';face.setAttribute('aria-label','VOX TUNE Live Pitch Hardware');
 face.innerHTML='<header class="vox-tune-brand"><small>WARLIKE / VOX LAB</small><strong>TUNE <span>01</span></strong><small>LIVE MONOPHONIC PITCH</small></header><section class="vox-tune-display"><div class="vox-tune-readouts"><div><span>DETECTED</span><output data-tune-detected>—</output><small data-tune-hz>— Hz</small></div><div><span>TARGET</span><output data-tune-target>—</output><small data-tune-status>HORS SIGNAL</small></div><div><span>SHIFT COMMAND</span><output data-tune-cents>—</output><small>cents · avant mix</small></div></div><div class="vox-tune-keyboard" role="group" aria-label="Choisir la tonalité"></div><div class="vox-tune-scale" role="group" aria-label="Choisir la gamme"></div><small>Touches violettes : notes de la gamme. Bordure claire : tonique. La correction commandée ne mesure pas la hauteur de sortie.</small></section><footer>YIN · MONOPHONIC · NOMINAL DSP LATENCY 40 ms</footer>';
 const keyboard=face.querySelector('.vox-tune-keyboard'),scaleRow=face.querySelector('.vox-tune-scale');
 function edit(key,value){const input=keys.get(key).querySelector('input');if(Number(input.value)===value)return;checkpoint?.();input.value=String(value);input.dispatchEvent(new Event('input',{bubbles:true}));input.dispatchEvent(new Event('change',{bubbles:true}));}
 // The original range inputs remain the single host parameter source.
 VOX_TUNE_KEYS.forEach((label,i)=>{const b=document.createElement('button');b.type='button';b.dataset.voxKey=String(i);b.className=[1,3,6,8,10].includes(i)?'accidental':'natural';b.textContent=label;b.setAttribute('aria-label','Tonalité '+label);b.onclick=()=>edit('key',i);keyboard.append(b);});
 ['Mineure','Majeure','Chromatique'].forEach((label,i)=>{const b=document.createElement('button');b.type='button';b.dataset.voxScale=String(i);b.textContent=label;b.onclick=()=>edit('scale',i);scaleRow.append(b);});
 params.before(face);face.querySelector('footer').before(params);params.classList.add('vox-tune-controls');
 const banks=VOX_TUNE_BANKS.map(([label,ks])=>{const bank=document.createElement('section');bank.className='vox-tune-bank';const h=document.createElement('h4');h.textContent=label;bank.append(h,...ks.map(k=>keys.get(k)));return bank;});params.replaceChildren(...banks);
 const entry={state,getStage,node:null,report:null,reportAt:0};active.set(face,entry);paint(face,entry);
}
function paint(face,e){
 const s=e.state();if(!s){detach(e);return;}const enabled=s.enabled!==false;
 const node=enabled&&face.getClientRects().length?e.getStage()?.pitch??null:null;
 if(node!==e.node){detach(e);if(node)attach(e,node);}
 const report=e.reportAt&&performance.now()-e.reportAt<500?e.report:null,voiced=report&&Number.isFinite(report.midi)&&report.frequency>0;
 face.querySelector('[data-tune-detected]').textContent=voiced?pitchLabel(report.midi):'—';
 face.querySelector('[data-tune-hz]').textContent=voiced?report.frequency.toFixed(1)+' Hz':'— Hz';
 face.querySelector('[data-tune-target]').textContent=voiced?pitchLabel(report.target):'—';
 face.querySelector('[data-tune-cents]').textContent=voiced?(report.cents>=0?'+':'')+report.cents.toFixed(1):'—';
 face.querySelector('[data-tune-status]').textContent=!enabled?'BYPASS':voiced?'VOICED':'HORS SIGNAL';
 const allowed=allowedPitchClasses(s.key,s.scale);
 for(const b of face.querySelectorAll('[data-vox-key]')){const n=Number(b.dataset.voxKey);b.classList.toggle('in-scale',allowed.includes(n));b.setAttribute('aria-pressed',String(n===Math.round(s.key)));b.classList.toggle('target',!!voiced&&((Math.round(report.target)%12+12)%12)===n);}
 for(const b of face.querySelectorAll('[data-vox-scale]'))b.setAttribute('aria-pressed',String(Number(b.dataset.voxScale)===Math.round(s.scale)));
}
export function updateVoxTuneFaces(){for(const [face,e] of active){if(!face.isConnected){detach(e);active.delete(face);}else paint(face,e);}}
