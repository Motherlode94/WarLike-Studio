import {MAX_BARS,fitSession} from './studio-model.js?v=0.14.0';
export function arrangementShift(items,desired,bars){
 const min=Math.min(...items.map(c=>c.start)),end=Math.max(...items.map(c=>c.start+c.length));
 const shift=Math.max(-min,Math.min(MAX_BARS-end,desired));
 return {shift,bars:fitSession(bars,end+shift)};
}
export function arrangementWidth(available,zoom,bars){
 return Math.max(320,available*zoom,bars*18*zoom);
}
