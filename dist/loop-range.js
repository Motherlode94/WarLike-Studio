export function loopBounds(range,bars){
 const total=bars*16;
 if(!range||!Number.isFinite(range.start)||!Number.isFinite(range.end))return {start:0,end:total};
 const start=Math.max(0,Math.min(total-1,Math.round(range.start*16)));
 const end=Math.max(start+1,Math.min(total,Math.round(range.end*16)));
 return {start,end};
}
export function loopPosition(raw,bounds){
 const {start,end}=bounds;
 return raw<end?Math.max(0,raw):start+((raw-end)%(end-start)+(end-start))%(end-start);
}
