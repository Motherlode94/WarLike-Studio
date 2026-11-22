// Optional per-note expression. Missing fields preserve legacy playback.
const clamp=(n,a,b)=>Math.max(a,Math.min(b,n));
export const EXPRESSION_ARTICULATIONS=Object.freeze({normal:1,staccato:.5,tenuto:.95});
export function normalizeExpression(note={}){
 return {bend:Number.isFinite(note.bend)?clamp(note.bend,-12,12):0,vibrato:Number.isFinite(note.vibrato)?clamp(note.vibrato,0,100):0,articulation:Object.hasOwn(EXPRESSION_ARTICULATIONS,note.articulation)?note.articulation:'normal'};
}
export function expressionDuration(length,note){return length*EXPRESSION_ARTICULATIONS[normalizeExpression(note).articulation];}
export function scheduleNotePitch(param,base,time,duration,note){
 const {bend,vibrato}=normalizeExpression(note);
 if(!bend&&!vibrato)return;
 // A bounded cents curve, common to oscillator and sampled pitched sources.
 const count=Math.max(2,Math.min(2048,Math.ceil(duration*100)+1)),curve=new Float32Array(count);
 for(let i=0;i<count;i++){const t=duration*i/(count-1),r=t/duration;curve[i]=base+bend*100*Math.max(0,(r-.25)/.75)+vibrato*Math.min(1,t/.18)*Math.sin(2*Math.PI*5.5*t);}
 param.setValueCurveAtTime(curve,time,duration);
}
