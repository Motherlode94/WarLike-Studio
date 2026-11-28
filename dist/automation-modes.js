// Pro Tools style automation write passes (Write, Touch, Latch).
// Pure data helpers: the UI calls them with bar positions, the engine holds the
// touched parameter so existing curves do not fight the hand during a pass.
import {pointValue,putPoint} from './automation.js?v=0.14.0';

export const AUTOMATION_MODES=Object.freeze(['off','read','touch','latch','write']);
export const READS_CURVES=new Set(['read','touch','latch','write']);
export const WRITES_ON_TOUCH=new Set(['touch','latch','write']);
// Glide back to the previous curve after a Touch release or a Latch stop (Pro Tools "AutoMatch").
export const AUTOMATCH_BARS=1/16;

const clone=points=>points?points.map(p=>({bar:p.bar,value:p.value})):null;

export function startPass(track,key,bar,value){
 const original=clone(track.automation?.curves?.[key]);
 // startValue: level before the hand moved (curve value, else the control value at touch).
 const startValue=original?.length?pointValue(original,bar,value):value;
 return {trackId:track.id,key,mode:track.automation?.mode||'off',startBar:bar,lastBar:bar,value,startValue,original,latched:false};
}

// Overwrite: existing points strictly between the previous and the current write position
// are removed, then the new value is written. The curve never zig-zags with old moves.
export function writePass(track,pass,bar,value,base){
 base=pass.startValue??base;// a new curve starts from the level before the gesture
 const points=track.automation?.curves?.[pass.key];
 if(points&&bar>pass.lastBar){const from=pass.lastBar,to=bar;track.automation.curves[pass.key]=points.filter(p=>!(p.bar>from+1e-9&&p.bar<to-1e-9));}
 if(pass.lastBar===pass.startBar&&!(points||[]).some(p=>Math.abs(p.bar-pass.startBar)<1/960)){
  // Anchor the start so the curve before the pass keeps its shape.
  putPoint(track,pass.key,pass.startBar,pass.startValue??pointValue(pass.original,pass.startBar,pass.value),base);
 }
 putPoint(track,pass.key,bar,value,base);
 pass.lastBar=Math.max(pass.lastBar,bar);pass.value=value;
 return pass;
}

// Touch release or Latch stop: hold the written value at the end bar, then glide back to the
// original curve (or the static value when there was none) over AUTOMATCH_BARS.
export function finishPass(track,pass,bar,base,{bars=Infinity}={}){
 base=pass.startValue??base;
 const end=Math.max(pass.lastBar,bar);
 writePass(track,pass,end,pass.value,base);
 const back=Math.min(bars,end+AUTOMATCH_BARS);
 if(back>end){
  const points=track.automation.curves[pass.key];
  track.automation.curves[pass.key]=points.filter(p=>!(p.bar>end+1e-9&&p.bar<back-1e-9));
  putPoint(track,pass.key,back,pass.original?.length?pointValue(pass.original,back,base):(pass.startValue??base),base);
 }
 return track.automation.curves[pass.key];
}

export function holdKey(trackId,key){return trackId+'|'+key;}
