import {focusControlDb} from './exo-focus-model.js';
import {hardwarePresetBank,applyHardwarePreset,mountHardwareMasterPresets} from './hardware-presets.js';
export const isExoFocus=id=>id==='exofocus';
export const EXO_FOCUS_BANKS=Object.freeze([['01 / DETECTOR',['frequency','q']],['02 / DYNAMIC',['threshold','range','response']],['03 / OUTPUT',['mix','output']]]);
export function exoFocusPresetBank(id,definition,factory,storage){return isExoFocus(id)?hardwarePresetBank(id,definition,factory,storage):[];}
export function applyExoFocusPreset(state,id,definition,preset){if(!isExoFocus(id))throw Error('Module hors EXO FOCUS');return applyHardwarePreset(state,id,definition,preset);}
export function mountExoFocusPresets(root,options){return mountHardwareMasterPresets(root,{...options,faceSelector:'.exo-focus-hardware',collection:'EXO',sectionClass:'exo-focus-presets',saveAttribute:'data-exo-focus-save'});}
const active=new WeakMap(),x=f=>28+Math.log(f/20)/Math.log(1000)*304,y=db=>20+Math.min(48,Math.max(0,-db))*2;
const hz=Float32Array.from({length:241},(_,i)=>20*1000**(i/240));let context;
function graph(){return '<svg viewBox="0 0 360 154" role="img" aria-label="Réponse nominale du filtre de détection"><rect x="1" y="1" width="358" height="152" rx="4" fill="#081218" stroke="#31545e"/>'+[20,100,500,1000,5000,10000,20000].map(f=>'<path d="M'+x(f)+' 20V116" stroke="#19343d"/><text x="'+x(f)+'" y="130" text-anchor="middle" fill="#a5c7ce" font-size="8">'+(f>=1000?f/1000+'k':f)+'</text>').join('')+[0,-12,-24,-36,-48].map(v=>'<path d="M28 '+y(v)+'H332" stroke="#31545e"/><text x="24" y="'+(y(v)+3)+'" text-anchor="end" fill="#a5c7ce" font-size="8">'+v+'</text>').join('')+'<path data-focus-band fill="none" stroke="#6ef2eb" stroke-width="2"/><path data-focus-center stroke="#e6c38d" stroke-dasharray="4 3"/><text x="180" y="145" text-anchor="middle" fill="#a5c7ce" font-size="9">DETECTOR BAND · 48 kHz · NOT OUTPUT EQ</text></svg>';}
export function mountExoFocus(root,{state,getStage,master=false}){
 const params=root.querySelector(master?'.master-module-params':'.plugin-window-params');if(!params||root.querySelector('.exo-focus-hardware'))return;
 const nodes=[...params.querySelectorAll('.param')],byKey=new Map(nodes.map(n=>{const i=n.querySelector('input');return [(i?.dataset.param||i?.dataset.masterParam||'').split('.').at(-1),n];}));
 if(nodes.length!==7||EXO_FOCUS_BANKS.flatMap(([,ks])=>ks).some(k=>!byKey.has(k)))return;
 const surface=document.createElement('section');surface.className='exo-focus-hardware';surface.setAttribute('aria-label','EXO FOCUS Dynamic Band Control Hardware');
 surface.innerHTML='<header class="exo-focus-brand"><small>WARLIKE / EXO COLLECTION</small><strong>FOCUS 02</strong><small>DYNAMIC BAND CONTROL</small></header><div class="exo-focus-display">'+graph()+'<div class="exo-focus-readouts"><output data-focus-frequency></output><output data-focus-response></output></div><section class="exo-focus-gr"><header><small>BAND REDUCTION · CONTROL SIGNAL</small><output data-focus-gr>—</output></header><div class="exo-focus-leds">'+Array.from({length:18},(_,i)=>'<i data-focus-led="'+i+'"></i>').join('')+'</div><div class="exo-focus-readouts"><span>0</span><span>6</span><span>12</span><span>18 dB</span></div><output data-focus-status></output></section><small>Courbe du filtre de détection, pas une mesure de la réponse de sortie. Réduction de bande estimée à partir du signal de contrôle existant, après Mix et avant gain de sortie.</small></div><footer>SELECTIVE BAND · ENVELOPE DETECTION · NATIVE DSP</footer>';
 params.before(surface);surface.querySelector('footer').before(params);params.classList.add('exo-focus-controls');
 const groups=EXO_FOCUS_BANKS.map(([label,ks],i)=>{const bank=document.createElement('section');bank.className='exo-focus-bank';bank.style.setProperty('--vox-bank',['#60c9d8','#6ef2eb','#e6c38d'][i]);const h=document.createElement('h4');h.textContent=label;bank.append(h,...ks.map(k=>byKey.get(k)));return bank;});params.replaceChildren(...groups);
 context??=new OfflineAudioContext(1,128,48000);const filter=context.createBiquadFilter();filter.type='bandpass';
 active.set(surface,{state,getStage,filter,signature:'',samples:new Float32Array(32)});paint(surface);return surface;
}
function paint(face){
 const e=active.get(face),s=e?.state();if(!s)return;
 const signature=[s.frequency,s.q,s.response].join(':');if(signature!==e.signature){e.signature=signature;e.filter.frequency.value=s.frequency;e.filter.Q.value=s.q;const mag=new Float32Array(hz.length),phase=new Float32Array(hz.length);e.filter.getFrequencyResponse(hz,mag,phase);face.querySelector('[data-focus-band]').setAttribute('d',Array.from(hz,(f,i)=>(i?'L':'M')+x(f).toFixed(2)+' '+y(20*Math.log10(Math.max(1e-9,mag[i]))).toFixed(2)).join(''));face.querySelector('[data-focus-center]').setAttribute('d','M'+x(s.frequency)+' 20V116');face.querySelector('[data-focus-frequency]').textContent='FREQ '+Math.round(s.frequency)+' Hz · Q '+s.q.toFixed(1);face.querySelector('[data-focus-response]').textContent='RESPONSE '+s.response+' ms';}
 const enabled=s.enabled!==false,monitor=enabled&&s.mix>0?e.getStage?.()?.monitor:null;let gr=0;
 if(monitor){if(e.samples.length!==monitor.fftSize)e.samples=new Float32Array(monitor.fftSize);monitor.getFloatTimeDomainData(e.samples);let avg=0;for(const val of e.samples)avg+=val;gr=focusControlDb(avg/e.samples.length);}
 face.querySelector('[data-focus-gr]').textContent=enabled&&s.mix>0&&!monitor?'—':gr.toFixed(1)+' dB';
 for(const led of face.querySelectorAll('[data-focus-led]'))led.classList.toggle('lit',Number(led.dataset.focusLed)<Math.round(-gr));
 face.querySelector('[data-focus-status]').textContent=!enabled?'BYPASS':s.mix===0?'DRY':!monitor?'HORS SIGNAL':gr<-.1?'REDUCING':'ACTIVE';
}
export function updateExoFocusFaces(root=document){root.querySelectorAll('.exo-focus-hardware').forEach(paint);}
