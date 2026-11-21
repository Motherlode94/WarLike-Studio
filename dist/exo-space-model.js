// The original EXO stochastic impulse amplitude envelope.
export function exoSpaceEnvelope(i,size,rate){return Math.exp(-6.9*i/size)*Math.min(1,i/(rate*.006));}
export function exoSpaceLayout(s){return {preMs:s.predelay,durationMs:s.decay*1000,endMs:s.predelay+s.decay*1000,width:s.width,damping:s.damping,dry:s.enabled===false?1:1-s.mix,wet:s.enabled===false?0:s.mix,output:s.enabled===false?0:s.output};}
