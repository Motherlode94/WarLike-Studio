import {moduleLatency,rackIsSplit,rackItemLatency,masterRackLatency} from './master-rack-model.js';
const gain=db=>10**(db/20);
export function stereoRackMode(ctx,mode='stereo'){
 const input=ctx.createGain(),output=ctx.createGain(),owned=[input,output];
 if(mode==='stereo'){input.connect(output);return {input,output,dispose:()=>owned.forEach(n=>n.disconnect())};}
 input.channelCount=2;input.channelCountMode='explicit';const split=ctx.createChannelSplitter(2),merge=ctx.createChannelMerger(2);owned.push(split,merge);input.connect(split);merge.connect(output);
 const matrix={mid:[[.5,.5],[.5,.5]],side:[[.5,-.5],[-.5,.5]],left:[[1,0],[0,0]],right:[[0,0],[0,1]]}[mode];
 if(!matrix)throw Error('Mode stéréo inconnu.');
 for(let out=0;out<2;out++)for(let ch=0;ch<2;ch++)if(matrix[out][ch]){const g=ctx.createGain();g.gain.value=matrix[out][ch];split.connect(g,ch);g.connect(merge,0,out);owned.push(g);}
 return {input,output,dispose:()=>owned.forEach(n=>n.disconnect())};
}
export function createRackSplit(ctx,split,state,stages){
 const owned=[],node=kind=>{const n=ctx[kind]();owned.push(n);return n;},input=node('createGain'),output=node('createGain'),filters=[];
 // Complementary bands: LP1, LP2-LP1, ..., Input-LPn. Their unprocessed
 // sum reconstructs Input; no unsupported linear-phase/LR crossover claim.
 for(const frequency of split.frequencies){const f=node('createBiquadFilter');f.type='lowpass';f.frequency.value=frequency;f.Q.value=Math.SQRT1_2;input.connect(f);filters.push(f);}
 const lanes=split.branches.map((branch,index)=>{
  const feed=node('createGain');
  if(split.kind==='parallel')input.connect(feed);
  else{const upper=filters[index]||input;upper.connect(feed);if(index){const negative=node('createGain');negative.gain.value=-1;filters[index-1].connect(negative);negative.connect(feed);}}
  const mode=stereoRackMode(ctx,branch.mode);feed.connect(mode.input);
  let last=mode.output;for(const id of branch.inserts)if(id&&state[id].enabled){last.connect(stages[id].input);last=stages[id].output;}
  const delay=ctx.createDelay(4),level=node('createGain'),pan=node('createStereoPanner'),meter=node('createAnalyser');owned.push(delay);meter.fftSize=256;
  last.connect(delay);delay.connect(level);level.connect(pan);pan.connect(meter);meter.connect(output);
  return {id:branch.id,delay,level,pan,meter,mode};
 });
 const set=(p,v,now,initial)=>initial?p.setValueAtTime(v,now):p.setTargetAtTime(v,now,.02);
 return {input,output,lanes,update(next,value,now,initial){const solo=next.branches.some(b=>b.solo),latencies=next.branches.map(b=>b.inserts.reduce((n,id)=>n+(id&&value[id].enabled?moduleLatency(id):0),0)),max=Math.max(...latencies);filters.forEach((f,i)=>set(f.frequency,next.frequencies[i],now,initial));lanes.forEach((lane,i)=>{const b=next.branches[i];set(lane.level.gain,b.mute||solo&&!b.solo?0:gain(b.gainDb),now,initial);set(lane.pan.pan,b.pan,now,initial);set(lane.delay.delayTime,max-latencies[i],now,initial);});},dispose(){for(const lane of lanes)lane.mode.dispose();for(const n of owned)try{n.disconnect();}catch{}}};
}
export function routeMasterRack(nodes,state,now,initial){
 const order=state.bypass?[]:state.inserts.filter(id=>id&&(rackIsSplit(id)?state.splits[id].enabled:state[id].enabled));
 const signature=JSON.stringify([state.bypass,state.rackVersion,order,order.filter(rackIsSplit).map(id=>[id,state.splits[id].kind,state.splits[id].branches.map(b=>[b.id,b.mode,b.inserts.filter(id=>id&&state[id].enabled)])])]);
 if(nodes.routeSignature!==signature){
  nodes.input.disconnect();for(const stage of Object.values(nodes.stages))stage.output.disconnect();for(const split of nodes.splitNodes.values())split.dispose();nodes.splitNodes.clear();
  for(const n of [nodes.rackInput,nodes.wet,nodes.dry,nodes.rackOutput,nodes.dryDelay])n.disconnect();
  if(state.bypass||!state.rackVersion&&!order.length)nodes.input.connect(nodes.output);
  else{
   nodes.input.connect(nodes.rackInput);let last=nodes.rackInput;
   for(const id of order){let stage=nodes.stages[id];if(rackIsSplit(id)){stage=createRackSplit(nodes.input.context,state.splits[id],state,nodes.stages);nodes.splitNodes.set(id,stage);}last.connect(stage.input);last=stage.output;}
   last.connect(nodes.wet);nodes.rackInput.connect(nodes.dryDelay);nodes.dryDelay.connect(nodes.dry);nodes.dry.connect(nodes.rackOutput);nodes.wet.connect(nodes.rackOutput);nodes.rackOutput.connect(nodes.output);
  }
  nodes.routeSignature=signature;
 }
 const set=(p,v)=>initial?p.setValueAtTime(v,now):p.setTargetAtTime(v,now,.02);
 set(nodes.rackInput.gain,gain(state.inputDb||0));set(nodes.rackOutput.gain,gain(state.outputDb||0));set(nodes.wet.gain,state.mix??1);set(nodes.dry.gain,1-(state.mix??1));set(nodes.dryDelay.delayTime,masterRackLatency(state));
 for(const [id,split] of nodes.splitNodes)split.update(state.splits[id],state,now,initial);
}
