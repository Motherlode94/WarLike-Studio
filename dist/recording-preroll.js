// A UI observer only: transport and PCM are already scheduled on the audio clock.
// This timer must never start or reschedule capture at the punch-in boundary.
export function createRecordingPreRoll(ctx,{startAt,endAt,bpm,onChange=()=>{},setTimer=setInterval,clearTimer=clearInterval}={}){
 if(!Number.isFinite(startAt)||startAt<0||!Number.isFinite(endAt)||endAt<=startAt||!Number.isFinite(bpm)||bpm<40||bpm>240)throw Error('Prélecture invalide.');
 let status='pending',timer,resolve,last='';const done=new Promise(yes=>{resolve=yes;});
 const state=()=>({status:status==='pending'?(ctx.currentTime<startAt?'waiting':ctx.currentTime<endAt?'playing':'finished'):status,remainingBeats:Math.max(0,Math.ceil((endAt-Math.max(startAt,ctx.currentTime))/(60/bpm)))});
 function finish(next){if(status!=='pending')return;status=next;clearTimer(timer);onChange(state());resolve(next==='finished');}
 function tick(){if(status!=='pending')return;if(ctx.state!=='running'){finish('cancelled');return;}if(ctx.currentTime>=endAt){finish('finished');return;}const s=state(),key=s.status+':'+s.remainingBeats;if(key!==last){last=key;onChange(s);}}
 timer=setTimer(tick,25);tick();
 return {done,get state(){return state();},cancel(){finish('cancelled');}};
}
