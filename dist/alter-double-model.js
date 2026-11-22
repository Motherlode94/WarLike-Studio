export function alterDoubleVoice(s,sign){return {delay:(s.delay+(sign>0?6:0))/1000,rate:s.rate*(sign>0?1.17:1),depth:Math.min(s.depth,s.delay*.8)/1000*sign,pan:s.width*sign};}
export function alterDoubleLayout(s){const mix=s.enabled===false?0:s.mix;return {dry:1-mix,wet:mix*.5,voices:[-1,1].map(sign=>alterDoubleVoice(s,sign))};}
