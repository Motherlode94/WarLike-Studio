// VECTOR COMP front panel. All knobs are the existing host controls.
// The curve depicts the static compressor law, before makeup and parallel mix.
const clamp=(value,min,max)=>Math.max(min,Math.min(max,value));
export function compressorCurve(input,threshold,ratio,knee){
 const slope=1/Math.max(1,ratio)-1,delta=input-threshold,k=Math.max(0,knee);
 if(k===0)return input+(delta>0?slope*delta:0);
 if(delta<=-k/2)return input;
 if(delta>=k/2)return input+slope*delta;
 return input+slope*(delta+k/2)**2/(2*k);
}
export function reductionAngle(db){return -55+110*clamp(-(Number.isFinite(db)?db:0)/24,0,1);}
const groups=[['DETECTOR',['threshold','ratio','knee']],['ENVELOPE',['attack','release']],['OUTPUT',['mix','output']]];
const live=new WeakMap(),ns='http://www.w3.org/2000/svg';
const point=(angle,r)=>{const a=angle*Math.PI/180;return [130+r*Math.sin(a),116-r*Math.cos(a)];};
function meterSVG(){
 const ticks=[0,3,6,9,12,18,24].map(db=>{const angle=reductionAngle(-db),[x,y]=point(angle,88),[x2,y2]=point(angle,78),[tx,ty]=point(angle,65);return '<path d="M'+x+' '+y+'L'+x2+' '+y2+'" stroke="#362f25" stroke-width="1.5"/><text x="'+tx+'" y="'+(ty+3)+'" text-anchor="middle" fill="#382e24" font-size="10">'+db+'</text>';}).join('');
 return '<svg viewBox="0 0 260 142" role="img" aria-label="Indicateur de réduction de gain en décibels"><rect x="2" y="2" width="256" height="138" rx="9" fill="#211e1a" stroke="#aa8e62" stroke-width="2"/><rect x="10" y="10" width="240" height="122" rx="5" fill="#ead6aa" stroke="#8f7955"/><path d="M57.9 65.5 A88 88 0 0 1 202.1 65.5" fill="none" stroke="#735d3c"/>'+ticks+'<path data-vector-needle d="M130 116 L130 34" stroke="#922f2b" stroke-width="2" stroke-linecap="round" transform="rotate(-55 130 116)"/><circle cx="130" cy="116" r="5" fill="#47372a"/><text x="130" y="106" text-anchor="middle" fill="#51412c" font-size="9" letter-spacing="1.6">GAIN REDUCTION</text></svg>';
}
function graphSVG(){return '<svg viewBox="0 0 260 142" role="img" aria-label="Courbe de compression statique"><rect x="1" y="1" width="258" height="140" rx="7" fill="#141d23" stroke="#76664d"/><g stroke="#35464c" stroke-width="1">'+[0,15,30,45,60].map(v=>'<path d="M'+(26+v/60*216)+' 12V116 M26 '+(116-v/60*104)+'H242"/>').join('')+'</g><path d="M26 116L242 12" stroke="#78918e" fill="none" stroke-dasharray="4 4"/><path data-vector-curve stroke="#e8bf79" stroke-width="2.2" fill="none"/><g fill="#ddd3bf" font-size="9"><text x="26" y="130">−60</text><text x="231" y="130">0</text><text x="5" y="15">0</text><text x="3" y="116">−60</text><text x="125" y="138">IN dBFS</text><text x="5" y="65" transform="rotate(-90 5 65)">OUT</text></g></svg>';}
export function mountVectorComp(root,{state,getReduction,master=false}){
 const params=root.querySelector(master?'.master-module-params':'.plugin-window-params');if(!params||root.querySelector('.vector-comp-hardware'))return;
 const controls=[...params.querySelectorAll('.param')];const byKey=new Map(controls.map(node=>{const input=node.querySelector('input');return [(input?.dataset.param||input?.dataset.masterParam||'').split('.').at(-1),node];}));
 if(groups.flatMap(([,keys])=>keys).some(key=>!byKey.has(key)))return;
 const face=document.createElement('section');face.className='vector-comp-hardware';face.setAttribute('aria-label','VECTOR COMP Analog Hardware');
 face.innerHTML='<header class="vector-comp-brand"><span>WARLIKE / VECTOR SERIES</span><strong>COMP<span> 01</span></strong><small>PARALLEL DYNAMICS · STEREO</small></header><div class="vector-comp-displays"><div class="vector-display"><span>REDUCTION · dB</span>'+meterSVG()+'<output data-vector-gr>0.0 dB</output><small>Réduction du compresseur · avant mix</small></div><div class="vector-display"><span>TRANSFER · STATIC</span>'+graphSVG()+'<small>Avant gain de sortie et mix parallèle</small></div></div>';
 params.before(face);face.append(params);params.classList.add('vector-comp-controls');
 for(const [name,keys] of groups){const section=document.createElement('section');section.className='vector-comp-bank';const title=document.createElement('h4');title.textContent=name;section.append(title,...keys.map(key=>byKey.get(key)));params.append(section);}
 face.insertAdjacentHTML('beforeend','<footer class="vector-comp-footer"><span>VCA-INSPIRED FRONT PANEL</span><span>WEB AUDIO / NATIVE DSP</span></footer>');
 live.set(face,{state,getReduction,last:''});updateVectorFace(face);
}
function updateVectorFace(face){
 const data=live.get(face);if(!data)return;
 const s=data.state(),reduction=Number(data.getReduction())||0;
 face.querySelector('[data-vector-needle]').setAttribute('transform','rotate('+reductionAngle(reduction)+' 130 116)');
 face.querySelector('[data-vector-gr]').textContent=Math.min(0,reduction).toFixed(1)+' dB';
 if(!s)return;
 const signature=[s.threshold,s.ratio,s.knee].join(':');if(signature===data.last)return;data.last=signature;
 const points=Array.from({length:121},(_,i)=>{const v=-60+i*.5,o=compressorCurve(v,s.threshold,s.ratio,s.knee);return (i?'L':'M')+(26+i/120*216).toFixed(2)+' '+(116-(clamp(o,-60,0)+60)/60*104).toFixed(2);}).join('');
 face.querySelector('[data-vector-curve]').setAttribute('d',points);
}
export function updateVectorCompFaces(root=document){root.querySelectorAll('.vector-comp-hardware').forEach(updateVectorFace);}
