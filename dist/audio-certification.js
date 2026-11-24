const db=x=>x>0?20*Math.log10(x):-Infinity;
export function auditRouting(project){
 const tracks=project.tracks||[],map=new Map(tracks.map(t=>[t.id,t])),issues=[];
 if(map.size!==tracks.length)issues.push('Identifiants dupliqués');
 const visited=new Set(),active=new Set();
 function visit(id){if(id==='master'||visited.has(id))return;if(active.has(id)){issues.push('Boucle : '+id);return;}const t=map.get(id);if(!t)return;active.add(id);
 for(const target of [t.output||'master',...(t.sends||[]).map(s=>s.target)]){if(target==='master')continue;if(map.get(target)?.type!=='bus')issues.push('Destination invalide : '+id+' → '+target);else visit(target);}
 active.delete(id);visited.add(id);}
 for(const t of tracks)visit(t.id);return issues;
}
export function measureAudio(buffer){
 let peak=0,sum=0,invalid=0,clipped=0,count=0;
 for(let c=0;c<buffer.numberOfChannels;c++)for(const x of buffer.getChannelData(c)){if(!Number.isFinite(x)){invalid++;continue;}peak=Math.max(peak,Math.abs(x));sum+=x*x;count++;if(Math.abs(x)>1)clipped++;}
 return {peakDb:db(peak),rmsDb:db(Math.sqrt(sum/Math.max(1,count))),invalid,clipped};
}
export function verifyWav32(bytes,buffer){
 const v=new DataView(bytes),size=buffer.length*buffer.numberOfChannels*4;
 if(v.byteLength!==44+size)return false;
 const tag=(o,s)=>[...s].every((ch,i)=>v.getUint8(o+i)===ch.charCodeAt(0));
 if(!tag(0,'RIFF')||!tag(8,'WAVE')||!tag(12,'fmt ')||!tag(36,'data')||v.getUint32(4,true)!==36+size||v.getUint16(20,true)!==3||v.getUint16(22,true)!==buffer.numberOfChannels||v.getUint32(24,true)!==buffer.sampleRate||v.getUint16(34,true)!==32||v.getUint32(40,true)!==size)return false;
 const channels=Array.from({length:buffer.numberOfChannels},(_,i)=>buffer.getChannelData(i));let offset=44;
 for(let i=0;i<buffer.length;i++)for(const ch of channels){if(!Number.isFinite(ch[i])||v.getFloat32(offset,true)!==ch[i])return false;offset+=4;}return true;
}

/**
 * R08.17 — PCM-level verification around two comp edit points.
 * Analyses rendered samples, not merely the fades/gain metadata. A large
 * isolated one-sample jump indicates a potential click (not proof of audibility).
 * This never modifies or normalizes the source signal.
 */
export function measureCompRenderedSeams(buffer,{bpm,seamBars,windowMs=10,jumpThreshold=.35}={}){
 const channels=buffer?.numberOfChannels,rate=buffer?.sampleRate,length=buffer?.length;
 if(!Number.isInteger(channels)||channels<1||channels>32||
 !Number.isFinite(rate)||rate<=0||!Number.isInteger(length)||length<2||
 !Number.isFinite(bpm)||bpm<=0||!Array.isArray(seamBars)||seamBars.length!==2||
 !seamBars.every(Number.isFinite)||!Number.isFinite(windowMs)||windowMs<2||windowMs>100||
 !Number.isFinite(jumpThreshold)||jumpThreshold<=0||jumpThreshold>2)
  throw Error('Paramètres de certification PCM invalides.');
 const signals=Array.from({length:channels},(_,channel)=>{
  const data=buffer.getChannelData(channel);
  if(!data||data.length!==length)throw Error('Canaux PCM incomplets.');
  return data;
 });
 const radius=Math.max(2,Math.round(windowMs*rate/1000));
 const seams=seamBars.map(bar=>{
  const frame=Math.round(bar*240/bpm*rate);
  if(frame<radius||frame+radius>=length)throw Error('Raccord hors du rendu audio ou fenêtre trop courte.');
  const measurements=signals.map((data,channel)=>{
   let peak=0,invalid=0,clipped=0,maxJump=0,maxJumpFrame=frame;
   let preSquares=0,postSquares=0,preCount=0,postCount=0;
   const jumps=[];
   for(let i=frame-radius;i<=frame+radius;i++){
    const value=data[i];
    if(!Number.isFinite(value)){invalid++;continue;}
    peak=Math.max(peak,Math.abs(value));
    if(Math.abs(value)>=1)clipped++;
    if(i<frame){preSquares+=value*value;preCount++}
    else{postSquares+=value*value;postCount++}
    if(i>frame-radius&&Number.isFinite(data[i-1])){
     const jump=Math.abs(value-data[i-1]);
     if(jump>maxJump){maxJump=jump;maxJumpFrame=i}
     jumps.push(jump);
    }
   }
   const ordered=jumps.sort((a,b)=>a-b);
   const baseline=ordered.length?ordered[Math.floor(ordered.length*.5)]:0;
   const nearestJump=frame>0&&Number.isFinite(data[frame])&&Number.isFinite(data[frame-1])?
    Math.abs(data[frame]-data[frame-1]):Infinity;
   const suspectedClick=nearestJump>jumpThreshold&&nearestJump>Math.max(.01,baseline*5);
   return {channel:channel+1,peak,clipped,invalid,maxJump,maxJumpFrame,
    nearestJump,baselineJump:baseline,preRms:Math.sqrt(preSquares/Math.max(1,preCount)),
    postRms:Math.sqrt(postSquares/Math.max(1,postCount)),suspectedClick};
  });
  return {bar,frame,channels:measurements,invalid:measurements.reduce((sum,x)=>sum+x.invalid,0),
   clipped:measurements.reduce((sum,x)=>sum+x.clipped,0),
   suspectedClick:measurements.some(x=>x.suspectedClick)};
 });
 return {sampleRate:rate,seams,valid:seams.every(s=>s.invalid===0&&s.clipped===0&&!s.suspectedClick)};
}

/**
 * R08.18 — Convert absolute edit bars to positions inside a Studio OfflineAudioContext
 * render. renderRange starts every schedule at 0.01 seconds.
 * Do not inspect beyond the exported context when a seam touches song edges.
 */
export function measureStudioCompRender(buffer,{bpm,startBar,range,scheduleLeadSeconds=.01}={}){
 if(!Number.isFinite(bpm)||bpm<=0||!Number.isFinite(startBar)||startBar<0||
 !Number.isFinite(scheduleLeadSeconds)||scheduleLeadSeconds<0||scheduleLeadSeconds>.1||
 !range||![range.start,range.end].every(Number.isFinite)||range.end<=range.start||range.start<startBar)
  throw Error('Plage de rendu Studio invalide.');
 const barSeconds=240/bpm,offset=scheduleLeadSeconds/barSeconds;
 const report=measureCompRenderedSeams(buffer,{bpm,
  seamBars:[range.start-startBar+offset,range.end-startBar+offset]});
 return {...report,seams:report.seams.map((seam,index)=>({...seam,bar:index?range.end:range.start}))};
}
