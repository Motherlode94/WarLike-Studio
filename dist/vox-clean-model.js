// Same detector law as the original VOX CLEAN processor.
export function voxCleanControl(range,x){
 const relative=Math.abs(x)*32;
 return relative<=1?0:Math.max(10**(-range/20),relative**(-.75))-1;
}
export function voxCleanCurve(range){return Float32Array.from({length:4097},(_,i)=>voxCleanControl(range,i/2048-1));}
export function voxCleanReduction(control){return 20*Math.log10(Math.max(1e-6,1+Math.min(0,Number.isFinite(control)?control:0)));}
