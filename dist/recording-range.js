import {MAX_BARS} from './studio-model.js?v=0.14.0';
import {seriesTakes} from './recording-series.js';
export function recordingRange(value){
 if(value==null)return null;
 const start=Number(value.start),end=Number(value.end);
 if(typeof value!=='object'||!Number.isFinite(start)||!Number.isFinite(end)||start<0||end<=start||end>MAX_BARS)throw Error('Plage de prise invalide : la fin doit suivre le début.');
 const preRollBars=Number(value.preRollBars??0);
 if(![0,1,2,4].includes(preRollBars))throw Error('Prélecture invalide : choisis 0, 1, 2 ou 4 mesures.');
 const takes=seriesTakes(value.takes??1);
 return {enabled:value.enabled===true,start,end,...(preRollBars?{preRollBars}:{}),...(takes>1?{takes}:{})};
}
export function recordingWindow(value,{bars,bpm}){
 const range=recordingRange(value);if(!range?.enabled)return null;
 if(!Number.isFinite(bars)||!Number.isFinite(bpm)||bpm<40||bpm>240||range.end>bars)throw Error('La plage de prise dépasse le morceau. Ajuste les bornes.');
 const seconds=(range.end-range.start)*240/bpm;
 if(seconds>1200)throw Error('Une plage de prise est limitée à 20 minutes.');
 const playbackStart=Math.max(0,range.start-(range.preRollBars||0));
 return {...range,seconds,playbackStart,preRollSeconds:(range.start-playbackStart)*240/bpm};
}
export function rangePlacement(placement,range,bpm){
 if(!range)return placement;
 if(![placement.start,placement.length,placement.sourceOffset,range.start,range.end,bpm].every(Number.isFinite)||placement.length<0||placement.sourceOffset<0||range.end<=range.start||bpm<=0)throw Error('Placement de prise invalide.');
 const secondsPerBar=240/bpm,start=Math.max(range.start,placement.start),trim=Math.min(placement.length,Math.max(0,start-placement.start));
 return {...placement,start:Math.min(start,range.end),sourceOffset:placement.sourceOffset+trim*secondsPerBar,length:Math.max(0,Math.min(placement.length-trim,range.end-start))};
}
