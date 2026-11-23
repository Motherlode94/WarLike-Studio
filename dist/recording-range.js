import {MAX_BARS} from './studio-model.js?v=0.14.0';
export function recordingRange(value){
 if(value==null)return null;
 const start=Number(value.start),end=Number(value.end);
 if(typeof value!=='object'||!Number.isFinite(start)||!Number.isFinite(end)||start<0||end<=start||end>MAX_BARS)throw Error('Plage de prise invalide : la fin doit suivre le début.');
 return {enabled:value.enabled===true,start,end};
}
export function recordingWindow(value,{bars,bpm}){
 const range=recordingRange(value);if(!range?.enabled)return null;
 if(!Number.isFinite(bars)||!Number.isFinite(bpm)||bpm<40||bpm>240||range.end>bars)throw Error('La plage de prise dépasse le morceau. Ajuste les bornes.');
 const seconds=(range.end-range.start)*240/bpm;
 if(seconds>1200)throw Error('Une plage de prise est limitée à 20 minutes.');
 return {...range,seconds};
}
export function rangePlacement(placement,range,bpm){
 if(!range)return placement;
 const secondsPerBar=240/bpm,start=Math.max(range.start,placement.start),trim=Math.max(0,start-placement.start);
 return {...placement,start,sourceOffset:placement.sourceOffset+trim*secondsPerBar,length:Math.max(0,Math.min(placement.length-trim,range.end-start))};
}
