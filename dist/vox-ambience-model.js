// Nominal routing parameters; display is a diagram, not a measured impulse response.
export const VOX_ROOM_SECONDS=.115;
export function ambienceLayout(s){
 const enabled=s.enabled!==false,mix=enabled?s.mix:0;
 return {dry:1,roomDurationMs:VOX_ROOM_SECONDS*1000,roomGain:s.room*mix,slapGain:s.slapLevel*mix,echoes:Array.from({length:4},(_,i)=>({time:s.slap*(i+1),gain:s.slapLevel*mix*s.feedback**i}))};
}
