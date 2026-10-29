import {tuneAudio} from './tune-dsp.js?v=0.14.0';
self.onmessage=event=>{try{const {channels,sampleRate,options}=event.data;const result=tuneAudio(channels,sampleRate,options,progress=>self.postMessage({progress}));self.postMessage({result},result.channels.map(c=>c.buffer));}catch(e){self.postMessage({error:e.message});}};
