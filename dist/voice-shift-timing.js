// Center of the existing two-grain window, rounded to an exact sample.
export const voiceShiftGrain=rate=>Math.max(512,Math.round(rate*.045));
export const voiceShiftFrames=rate=>Math.round(voiceShiftGrain(rate)*2.5);
export const voiceShiftLatency=rate=>voiceShiftFrames(rate)/rate;
