// Read-only instrumentation: taps terminate in analysers, never in the audible path.
const active=new Map(),clamp=(v,a,b)=>Math.max(a,Math.min(b,v));
export const peakDb=peak=>peak>0?20*Math.log10(peak):-Infinity;
export const levelPosition=db=>clamp((db+60)/60,0,1);
export const reductionPosition=db=>clamp(-db/24,0,1);
const fmt=db=>Number.isFinite(db)?db.toFixed(1)+' dB':'−∞ dB';
function tap(node){
 const ctx=node.context,split=ctx.createChannelSplitter(2),meters=[ctx.createAnalyser(),ctx.createAnalyser()];
 for(const [i,m] of meters.entries()){m.fftSize=2048;split.connect(m,i);}
 node.connect(split);
 const buffer=new Float32Array(2048);
 return {read(){let peak=0;for(const m of meters){m.getFloatTimeDomainData(buffer);for(const x of buffer)peak=Math.max(peak,Math.abs(x));}return peakDb(peak);},dispose(){try{node.disconnect(split);}catch{}split.disconnect();meters.forEach(m=>m.disconnect());}};
}
function detach(entry){entry.input?.dispose();entry.output?.dispose();entry.input=entry.output=entry.stage=null;}
function meterSvg(kind,label,scale){
 const ticks=scale.map(([value,pos])=>'<text x="12" y="'+(25+pos*154)+'" font-size="9" fill="#c9d0c7">'+value+'</text><path d="M40 '+(22+pos*154)+'h7" stroke="#b9ae93"/>').join('');
 const segments=Array.from({length:24},(_,i)=>'<rect data-limit-segment="'+i+'" x="49" y="'+(176-i*6.65)+'" width="45" height="4.5" rx="1" fill="#303931"/>').join('');
 return '<div class="vector-limit-meter" data-limit-meter="'+kind+'"><span>'+label+'</span><svg viewBox="0 0 110 200" role="img" aria-label="'+label+'"><rect x="2" y="2" width="106" height="196" rx="5" fill="#101814" stroke="#877a60"/>'+ticks+segments+(kind==='out'?'<path data-limit-ceiling-line d="M45 22H99" stroke="#f4d18c" stroke-width="1.5" stroke-dasharray="3 2"/>':'')+'</svg><output>−∞ dB</output></div>';
}
const levelTicks=[[0,0],[-6,.1],[-12,.2],[-24,.4],[-36,.6],[-48,.8],[-60,1]],grTicks=[[24,0],[18,.25],[12,.5],[6,.75],[0,1]];
export function mountVectorLimit(root,{state,getStage,master=false}){
 const params=root.querySelector(master?'.master-module-params':'.plugin-window-params');if(!params||root.querySelector('.vector-limit-hardware'))return;
 const controls=[...params.querySelectorAll('.param')],keys=controls.map(n=>(n.querySelector('input')?.dataset.param||n.querySelector('input')?.dataset.masterParam||'').split('.').at(-1));
 if(keys.length!==3||!['drive','ceiling','release'].every(k=>keys.includes(k)))return;
 const face=document.createElement('section');face.className='vector-limit-hardware';face.setAttribute('aria-label','VECTOR LIMIT Analog Hardware');
 face.innerHTML='<header class="vector-limit-brand"><small>WARLIKE / VECTOR SERIES</small><strong>LIMIT <span>03</span></strong><span>STEREO SAMPLE PEAK LIMITER</span></header><div class="vector-limit-display"><div class="vector-limit-meters">'+meterSvg('in','INPUT + DRIVE',levelTicks)+meterSvg('gr','GAIN REDUCTION',grTicks)+meterSvg('out','OUTPUT',levelTicks)+'</div><div class="vector-limit-status"><strong data-limit-status>HORS SIGNAL</strong><span>CEILING <output data-limit-ceiling>−1 dBFS</output></span><button type="button" class="outline-btn" data-limit-reset>Reset peak</button><span>OUTPUT HOLD <output data-limit-hold>−∞ dBFS</output></span></div></div><footer class="vector-limit-footer">Anticipation 6 ms · gain stéréo lié · réduction mesurée · crêtes échantillons, sans certification True Peak.</footer>';
 params.before(face);face.querySelector('footer').before(params);params.classList.add('vector-limit-controls');
 const entry={state,getStage,stage:null,input:null,output:null,hold:-Infinity};active.set(face,entry);
 face.querySelector('[data-limit-reset]').onclick=()=>{entry.hold=-Infinity;};
 updateFace(face,entry);
}
function paintMeter(face,kind,db){
 const meter=face.querySelector('[data-limit-meter="'+kind+'"]'),position=kind==='gr'?reductionPosition(db):levelPosition(db);
 for(const segment of meter.querySelectorAll('[data-limit-segment]')){const n=Number(segment.dataset.limitSegment);segment.setAttribute('fill',(n+1)/24<=position?(n>=22?'#e77d58':n>=16?'#e4b86e':'#94c7a1'):'#303931');}
 meter.querySelector('output').textContent=kind==='gr'?fmt(db):fmt(db)+'FS';
}
function updateFace(face,entry){
 const s=entry.state();if(!s)return;
 const enabled=s.enabled!==false,visible=face.getClientRects().length>0,stage=enabled&&visible?entry.getStage():null;
 if(stage!==entry.stage){detach(entry);entry.hold=-Infinity;if(stage?.drive&&stage?.scaleOut){entry.stage=stage;entry.input=tap(stage.drive);entry.output=tap(stage.scaleOut);}}
 const input=entry.input?.read()??-Infinity,output=entry.output?.read()??-Infinity,gr=entry.stage?Math.min(0,entry.stage.reduction||0):0;
 entry.hold=Math.max(entry.hold,output);
 paintMeter(face,'in',input);paintMeter(face,'gr',gr);paintMeter(face,'out',output);
 face.querySelector('[data-limit-ceiling]').textContent=fmt(s.ceiling)+'FS';
 face.querySelector('[data-limit-hold]').textContent=fmt(entry.hold)+'FS';
 const y=178-levelPosition(s.ceiling)*156;face.querySelector('[data-limit-ceiling-line]').setAttribute('d','M45 '+y+'H99');
 const status=face.querySelector('[data-limit-status]');status.textContent=!enabled?'BYPASS':!stage||!Number.isFinite(input)?'HORS SIGNAL':gr<-.1?'LIMITING':'ACTIVE';status.dataset.limiting=String(enabled&&gr<-.1);
}
export function updateVectorLimitFaces(){for(const [face,entry] of active){if(!face.isConnected){detach(entry);active.delete(face);}else updateFace(face,entry);}}
