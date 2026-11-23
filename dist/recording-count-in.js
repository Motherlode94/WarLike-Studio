export function countInBars(value){return [1,2].includes(Number(value))?Number(value):0;}
export function countInPlan({bars=0,bpm,startAt=0}){
 const count=countInBars(bars);
 if(!Number.isFinite(bpm)||bpm<40||bpm>240||!Number.isFinite(startAt)||startAt<0)throw Error('Décompte invalide.');
 const beatSeconds=60/bpm,beats=count*4;
 return {bars:count,beats,beatSeconds,startAt,endAt:startAt+beats*beatSeconds,clicks:Array.from({length:beats},(_,i)=>({time:startAt+i*beatSeconds,accent:i%4===0}))};
}
// Only the audio clock decides when the count ends; the timer refreshes UI.
// Clicks go to the output, independently of the microphone/capture graph.
export function createRecordingCountIn(ctx,{bars,bpm,onChange=()=>{},setTimer=setInterval,clearTimer=clearInterval}={}){
 const plan=countInPlan({bars,bpm,startAt:ctx.currentTime+.1});
 if(!plan.beats)throw Error('Choisis une ou deux mesures de décompte.');
 let status='counting',timer,resolve,lastBeat='';const voices=[];
 const done=new Promise(yes=>{resolve=yes;});
 const state=()=>{const index=Math.max(0,Math.min(plan.beats-1,Math.floor((ctx.currentTime-plan.startAt)/plan.beatSeconds)));return {status,bar:Math.floor(index/4)+1,bars:plan.bars,beat:index%4+1,beats:4,remaining:plan.beats-index};};
 function finish(next){
  if(status!=='counting')return;status=next;clearTimer(timer);
  for(const {oscillator,gain} of voices){try{oscillator.stop();}catch{}try{oscillator.disconnect();gain.disconnect();}catch{}}
  onChange(state());resolve(next==='finished');
 }
 try{
  for(const click of plan.clicks){
   const oscillator=ctx.createOscillator(),gain=ctx.createGain();voices.push({oscillator,gain});
   oscillator.frequency.value=click.accent?1200:850;gain.gain.setValueAtTime(.07,click.time);gain.gain.exponentialRampToValueAtTime(.001,click.time+.035);
   oscillator.connect(gain);gain.connect(ctx.destination);
   oscillator.addEventListener('ended',()=>{oscillator.disconnect();gain.disconnect();},{once:true});
   oscillator.start(click.time);oscillator.stop(click.time+.04);
  }
  timer=setTimer(()=>{if(status!=='counting')return;if(ctx.state!=='running'){finish('cancelled');return;}if(ctx.currentTime>=plan.endAt)finish('finished');else{const current=state(),key=current.bar+':'+current.beat;if(key!==lastBeat){lastBeat=key;onChange(current);}}},25);
 }catch(error){finish('cancelled');throw error;}
 return {endAt:plan.endAt,done,get state(){return state();},cancel(){finish('cancelled');}};
}
