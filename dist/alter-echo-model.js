export const alterEchoSeconds=(beats,bpm)=>60/bpm*beats;
export const alterEchoDuck=(x,amount)=>1/(1+Math.abs(x)*amount*12);
export function alterEchoCurve(amount){return Float32Array.from({length:4097},(_,i)=>alterEchoDuck(i/2048-1,amount));}
export function alterEchoLayout(s,bpm){const delay=alterEchoSeconds(s.beats,bpm)*1000,mix=s.enabled===false?0:s.mix;return {delay,mix,echoes:Array.from({length:5},(_,i)=>({time:delay*(i+1),gain:mix*s.feedback**i}))};}
