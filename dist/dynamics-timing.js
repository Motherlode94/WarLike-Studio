// Both dynamics processors use the same fixed, sample-rounded anticipation.
export const dynamicsFrames=rate=>Math.ceil(rate*.006);
export const dynamicsLatency=(rate,stages=1)=>stages*dynamicsFrames(rate)/rate;
