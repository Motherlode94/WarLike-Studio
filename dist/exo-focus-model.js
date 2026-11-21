// Exact production law. The control signal subtracts a fraction of the target band.
export function focusControl(x,range,mix,enabled=true){
 const relative=Math.abs(x)*32,atten=relative<=1?1:Math.max(10**(-range/20),relative**(-.75));
 return enabled?(atten-1)*mix:0;
}
export function focusCurve(range,mix,enabled){return Float32Array.from({length:4097},(_,i)=>focusControl(i/2048-1,range,mix,enabled));}
export function focusControlDb(value){return 20*Math.log10(Math.max(1e-9,1+Math.min(0,Number.isFinite(value)?value:0)));}
