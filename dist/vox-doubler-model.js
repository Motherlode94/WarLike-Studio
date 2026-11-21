// Existing two-delay topology; no promise of independent pitch-shifted voices.
export function doublerVoice(s,sign){
 const base=(s.delay+(sign>0?3:0))/1000,depth=Math.min(s.detune/10000,base-.001);
 return {base,depth:Math.max(0,depth),rate:sign>0?.7:.53,pan:s.width*sign,level:Math.min(1,s.voices/2)/2};
}
export function doublerLayout(s){
 return {dry:s.enabled===false?1:1-s.mix,wet:s.enabled===false?0:s.mix,voices:[-1,1].map(sign=>doublerVoice(s,sign))};
}
