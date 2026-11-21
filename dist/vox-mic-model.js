// Generic tonal profiles, not proprietary microphone emulations.
export const MIC_PROFILES=Object.freeze([[0,0,0],[1,-.5,2],[-2,1,-1],[2,-1,-2]].map(Object.freeze));
export function micColorGains(s){const from=MIC_PROFILES[Math.round(s.source)]||MIC_PROFILES[0],to=MIC_PROFILES[Math.round(s.target)]||MIC_PROFILES[0];return [s.proximity+to[0]-from[0],s.presence+to[1]-from[1],s.air+to[2]-from[2]];}
