// Nominal sine LFO parameters; the actual cutoff is constrained by Web Audio.
export function alterFilterRate(bpm,beats){return bpm/60/beats;}
export function alterFilterCutoff(cutoff,cents,phase,sampleRate=48000){return Math.min(sampleRate/2,Math.max(0,cutoff*2**(cents*Math.sin(phase*2*Math.PI)/1200)));}
export function alterFilterLayout(s,bpm,sampleRate=48000){const rate=alterFilterRate(bpm,s.beats);return {rate,periodMs:1000/rate,low:alterFilterCutoff(s.cutoff,s.depth,.75,sampleRate),high:alterFilterCutoff(s.cutoff,s.depth,.25,sampleRate),mix:s.enabled===false?0:s.mix};}
