import {mountAlter} from './alter-face.js';
import {alterFilterLayout,alterFilterCutoff} from './alter-filter-model.js';
export const ALTER_FILTER_BANKS=Object.freeze([['01 / FILTER',['cutoff','q']],['02 / MOTION',['beats','depth']],['03 / MIX',['mix']]]);
const frequencies=Float32Array.from({length:180},(_,i)=>20*1000**(i/179));
const x=f=>28+304*Math.log(f/20)/Math.log(1000),y=db=>64-Math.max(-36,Math.min(18,db))*1.5;
let context;
const graph='<svg viewBox="0 0 360 230" role="img" aria-label="Réponse du filtre et cycle nominal de modulation"><rect x="1" y="1" width="358" height="228" rx="4" fill="#211711" stroke="#805d47"/>'+[20,100,1000,10000,20000].map(f=>'<path d="M'+x(f)+' 20V118" stroke="#514035"/><text x="'+x(f)+'" y="131" text-anchor="middle" font-size="8" fill="#ebdcc7">'+(f>=1000?f/1000+'k':f)+'</text>').join('')+[-36,-18,0,18].map(d=>'<path d="M28 '+y(d)+'H332" stroke="#514035"/><text x="24" y="'+(y(d)+3)+'" text-anchor="end" fill="#ebdcc7" font-size="8">'+d+'</text>').join('')+'<path data-filter-min fill="none" stroke="#876851" stroke-dasharray="3 3"/><path data-filter-max fill="none" stroke="#e0c491" stroke-dasharray="3 3"/><path data-filter-center fill="none" stroke="#edab69" stroke-width="2"/><path d="M28 177H332 M28 145V209 M104 145V209 M180 145V209 M256 145V209 M332 145V209" stroke="#514035"/><path data-filter-motion fill="none" stroke="#edab69" stroke-width="2"/><text x="28" y="221" font-size="9" fill="#ebdcc7">0</text><text data-filter-period x="332" y="221" text-anchor="end" font-size="9" fill="#ebdcc7"/></svg>';
export function mountAlterFilter(root,{state,getBpm,master=false}){
 context??=new OfflineAudioContext(1,128,48000);const filter=context.createBiquadFilter();filter.type='lowpass';
 const mag=new Float32Array(frequencies.length),phase=new Float32Array(frequencies.length);
 function curve(cutoff,q){filter.frequency.value=cutoff;filter.Q.value=q;filter.getFrequencyResponse(frequencies,mag,phase);return Array.from(frequencies,(f,i)=>(i?'L':'M')+x(f).toFixed(2)+' '+y(20*Math.log10(Math.max(1e-9,mag[i]))).toFixed(2)).join('');}
 return mountAlter(root,{master,state:()=>{const s=state();return s?{...s,bpm:getBpm()}:null;},id:'alter-filter',title:'FILTER 03',subtitle:'TEMPO SYNC / RESONANT LOW PASS',banks:ALTER_FILTER_BANKS,display:graph+'<div class="alter-pro-readouts"><output data-filter-rate></output><output data-filter-range></output></div><div class="alter-pro-readouts"><output data-filter-mix></output><output data-filter-status></output></div><small>Courbes du chemin filtré à 48 kHz : position centrale et extrêmes du LFO. Le cycle représente la modulation configurée, pas la phase instantanée ni une mesure du signal. Les valeurs sont limitées par Nyquist.</small>',footer:'SINE LFO · TEMPO SYNC · PARALLEL LOW PASS · NATIVE DSP',paint(surface,s){
 const m=alterFilterLayout(s,s.bpm);
 for(const [key,fc] of [['min',m.low],['max',m.high],['center',s.cutoff]])surface.querySelector('[data-filter-'+key+']').setAttribute('d',curve(fc,s.q));
 surface.querySelector('[data-filter-motion]').setAttribute('d',Array.from({length:129},(_,i)=>{const fc=alterFilterCutoff(s.cutoff,s.depth,i/128),oct=Math.log2(Math.max(1,fc)/s.cutoff);return (i?'L':'M')+(28+304*i/128).toFixed(2)+' '+(177-Math.max(-3,Math.min(3,oct))*10).toFixed(2);}).join(''));
 surface.querySelector('[data-filter-period]').textContent=m.periodMs.toFixed(1)+' ms';
 surface.querySelector('[data-filter-rate]').textContent=s.bpm+' BPM · LFO '+m.rate.toFixed(3)+' Hz';
 surface.querySelector('[data-filter-range]').textContent=Math.round(m.low)+'–'+Math.round(m.high)+' Hz';
 surface.querySelector('[data-filter-mix]').textContent='DRY '+Math.round((1-m.mix)*100)+'% / WET '+Math.round(m.mix*100)+'%';
 surface.querySelector('[data-filter-status]').textContent=s.enabled===false?'BYPASS':m.mix===0?'DRY':s.depth===0?'STATIC':'MODULATING';
 }});
}
