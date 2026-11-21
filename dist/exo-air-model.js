// Original normalized EXO AIR waveshaping law and parallel send coefficient.
export function exoAirTransfer(driveDb){const drive=10**(driveDb/20);return x=>Math.tanh(x*drive)/Math.tanh(drive);}
export function exoAirCurve(drive){const f=exoAirTransfer(drive);return Float32Array.from({length:4097},(_,i)=>f(i/2048-1));}
export function exoAirWet(mix,enabled=true){return enabled?mix*.35:0;}
