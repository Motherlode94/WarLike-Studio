import {stretchAudio,transposeAudio} from './stretch-dsp.js?v=0.11.1';
self.onmessage=({data})=>{try{let channels=data.channels;if(data.semitones)channels=transposeAudio(channels,data.semitones);const pitchRate=2**((data.semitones||0)/12);const ratio=data.ratio*pitchRate;
  // Two bounded WSOLA passes cover combined pitch and time transforms.
  if(ratio>2){channels=stretchAudio(channels,data.sampleRate,2);channels=stretchAudio(channels,data.sampleRate,ratio/2,p=>postMessage({progress:p}));}else if(ratio<.5){channels=stretchAudio(channels,data.sampleRate,.5);channels=stretchAudio(channels,data.sampleRate,ratio/.5,p=>postMessage({progress:p}));}else channels=stretchAudio(channels,data.sampleRate,ratio,p=>postMessage({progress:p}));
  postMessage({channels},channels.map(c=>c.buffer));}catch(error){postMessage({error:error.message});}};
