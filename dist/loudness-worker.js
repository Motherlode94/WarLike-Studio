import {measureLoudness} from './loudness.js?v=0.14.0';
self.onmessage=({data})=>{try{postMessage({result:measureLoudness(data.channels,data.sampleRate)});}catch(error){postMessage({error:error.message});}};
