import {MAX_BARS,fitSession} from './studio-model.js?v=0.14.0';
export function recordingHorizon(bars,step){
 if(step<bars*16-32)return bars;
 return fitSession(bars,Math.min(MAX_BARS,Math.ceil(step/16)+16));
}
