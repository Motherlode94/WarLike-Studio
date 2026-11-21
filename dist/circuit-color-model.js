// Shared transfer law for the native WaveShaper and its illustrative graph.
export function circuitColorTransfer(drive,biasValue){
 const k=10**(drive/20),bias=biasValue*.2,offset=Math.tanh(bias*k);
 const norm=Math.max(Math.abs(Math.tanh((1+bias)*k)-offset),Math.abs(Math.tanh((-1+bias)*k)-offset));
 return x=>(Math.tanh((x+bias)*k)-offset)/norm;
}
export function circuitColorCurve(drive,bias){const fn=circuitColorTransfer(drive,bias);return Float32Array.from({length:4097},(_,i)=>fn(i/2048-1));}
