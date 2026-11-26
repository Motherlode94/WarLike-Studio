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
 !range||![range.start,range.end].every(Number.isFinite)||range.end<=range.start||range.start<=startBar)
  throw Error('Plage de rendu Studio invalide.');
 const barSeconds=240/bpm,offset=scheduleLeadSeconds/barSeconds;
 const report=measureCompRenderedSeams(buffer,{bpm,
  seamBars:[range.start-startBar+offset,range.end-startBar+offset]});
 return {...report,seams:report.seams.map((seam,index)=>({...seam,bar:index?range.end:range.start}))};
}

/**
 * R08.19 — Independent decode/compare of exported PCM against an offline
 * Studio render. Supports WAV PCM 16/24 and IEEE float 32 without using the
 * encoder's internal sample loop. Never changes the source buffers or bytes.
 * Threshold is one integer least-significant bit for PCM; float is bit-exact.
 */
export function compareRenderedWav(buffer,bytes,{bits}={}){
 const data=bytes instanceof ArrayBuffer?new DataView(bytes):
  ArrayBuffer.isView(bytes)?new DataView(bytes.buffer,bytes.byteOffset,bytes.byteLength):null;
 const channels=buffer?.numberOfChannels,frames=buffer?.length,rate=buffer?.sampleRate;
 if(!data||!Number.isInteger(channels)||channels<1||channels>32||
 !Number.isInteger(frames)||frames<0||!Number.isInteger(rate)||rate<=0||
 ![16,24,32].includes(bits))throw Error('Comparaison WAV invalide.');
 const chunk=bits/8,total=frames*channels*chunk;
 if(!Number.isSafeInteger(total)||total>0xffffffff-36||data.byteLength!==44+total)
  throw Error('Longueur WAV incompatible avec le rendu.');
 const tag=(offset,value)=>[...value].every((ch,i)=>data.getUint8(offset+i)===ch.charCodeAt(0));
 if(!tag(0,'RIFF')||!tag(8,'WAVE')||!tag(12,'fmt ')||!tag(36,'data')||
 data.getUint32(4,true)!==36+total||data.getUint32(16,true)!==16||
 data.getUint16(20,true)!==(bits===32?3:1)||data.getUint16(22,true)!==channels||
 data.getUint32(24,true)!==rate||data.getUint32(28,true)!==rate*channels*chunk||
 data.getUint16(32,true)!==channels*chunk||data.getUint16(34,true)!==bits||
 data.getUint32(40,true)!==total)throw Error('En-tête WAV incompatible avec le rendu.');
 const inputs=Array.from({length:channels},(_,channel)=>{
  const source=buffer.getChannelData(channel);
  if(!source||source.length!==frames)throw Error('Canal du rendu incomplet.');
  return source;
 });
 let offset=44,peak=0,maxError=0,mismatches=0,invalid=0,clipped=0;
 // Studio's PCM encoder uses +max = 2^(bits-1)-1, -max = 2^(bits-1).
 // Compare exact quantized integer words, not a symmetric one-LSB tolerance.
 // This detects corruption without flagging the positive scaling difference.
 const scale=2**(bits-1);
 for(let i=0;i<frames;i++)for(let channel=0;channel<channels;channel++){
  const sample=inputs[channel][i],finite=Number.isFinite(sample);
  if(!finite)invalid++;else{peak=Math.max(peak,Math.abs(sample));if(Math.abs(sample)>=1)clipped++;}
  let decoded,actualWord;
  if(bits===32)decoded=data.getFloat32(offset,true);
  else if(bits===16){actualWord=data.getInt16(offset,true);decoded=actualWord/scale;}
  else{
   actualWord=data.getUint8(offset)|(data.getUint8(offset+1)<<8)|(data.getUint8(offset+2)<<16);
   if(actualWord&0x800000)actualWord-=0x1000000;
   decoded=actualWord/scale;
  }
  const error=finite?Math.abs(decoded-sample):Infinity;
  maxError=Math.max(maxError,error);
  // Float32 is byte-accurate to its input. Signed PCM must equal Studio's
  // quantizer (rounding and its asymmetric positive full-scale included).
  const expectedWord=finite&&bits!==32?
   Math.round(Math.max(-1,Math.min(1,sample))*(sample<0?scale:scale-1)):null;
  if(!finite||(bits===32?decoded!==sample:actualWord!==expectedWord))mismatches++;
  offset+=chunk;
 }
 return {bits,channels,frames,rate,peak,maxError,mismatches,invalid,clipped,
  valid:mismatches===0&&invalid===0&&clipped===0};
}

/**
 * R08.20 — Measure successive independent live analyser snapshots.
 * These are short windows, not a continuous PCM capture; never infer a
 * click from the difference between two separately acquired windows.
 * Sampling gaps and consecutive silence are explicitly reported.
 */
export function auditLiveAudioWindows(windows,{silenceThresholdDb=-65,clipThreshold=.999,maxGapSeconds=.5}={}){
 if(!Array.isArray(windows)||!windows.length||
 ![silenceThresholdDb,clipThreshold,maxGapSeconds].every(Number.isFinite)||
 clipThreshold<=0||clipThreshold>2||maxGapSeconds<=0)
  throw Error('Fenêtres d’écoute live invalides.');
 let previous=-Infinity,dropoutRuns=0,run=0,peak=0,clipped=0,invalid=0,gaps=0;
 const results=windows.map(({time,channels},index)=>{
  if(!Number.isFinite(time)||time<=previous||
   !Array.isArray(channels)||!channels.length||channels.length>32)
   throw Error('Fenêtre d’écoute live invalide.');
  if(index&&time-previous>maxGapSeconds)gaps++;
  previous=time;
  let power=0,count=0,windowPeak=0,windowClipped=0,windowInvalid=0;
  for(const ch of channels){
   if(!ch?.length)throw Error('Canal d’écoute live vide.');
   for(const x of ch){
    if(!Number.isFinite(x)){windowInvalid++;continue}
    const a=Math.abs(x);windowPeak=Math.max(windowPeak,a);power+=x*x;count++;
    if(a>=clipThreshold)windowClipped++;
   }
  }
  const rms=Math.sqrt(power/Math.max(1,count)),rmsDb=rms>0?20*Math.log10(rms):-Infinity;
  const silent=rmsDb<silenceThresholdDb;
  run=silent?run+1:0;dropoutRuns=Math.max(dropoutRuns,run);
  peak=Math.max(peak,windowPeak);clipped+=windowClipped;invalid+=windowInvalid;
  return {time,peak:windowPeak,rmsDb,silent,clipped:windowClipped,invalid:windowInvalid};
 });
 return {windows:results,peak,clipped,invalid,gaps,longestSilentRun:dropoutRuns,
  status:invalid?'invalid':clipped?'clipping':gaps?'incomplete':'measured'};
}

/** S03.1: inspect continuous PCM only. Large isolated jumps are candidates,
 * not proof of audible glitches; legitimate transients can trigger them. */
export function auditContinuousPCM(buffer,{jumpThreshold=.35,contrast=5,maxCandidates=32}={}){
 const channels=buffer?.numberOfChannels,length=buffer?.length,rate=buffer?.sampleRate;
 if(!Number.isInteger(channels)||channels<1||channels>32||!Number.isInteger(length)||length<3||!Number.isFinite(rate)||rate<=0||!Number.isFinite(jumpThreshold)||jumpThreshold<=0||jumpThreshold>2||!Number.isFinite(contrast)||contrast<1||!Number.isInteger(maxCandidates)||maxCandidates<0||maxCandidates>1000)throw Error('Diagnostic PCM invalide.');
 const results=[];
 for(let channel=0;channel<channels;channel++){
  const data=buffer.getChannelData(channel);
  if(!data||data.length!==length)throw Error('Canal PCM incomplet.');
  let peak=0,invalid=0,overRange=0,maxJump=0,candidateCount=0;
  const candidates=[];
  for(let i=0;i<length;i++){
   const sample=data[i];
   if(!Number.isFinite(sample)){invalid++;continue;}
   const magnitude=Math.abs(sample);peak=Math.max(peak,magnitude);
   if(magnitude>1)overRange++;
   if(i===0||!Number.isFinite(data[i-1]))continue;
   const jump=Math.abs(sample-data[i-1]);maxJump=Math.max(maxJump,jump);
   if(i<2||i+1>=length||!Number.isFinite(data[i-2])||!Number.isFinite(data[i+1]))continue;
   const neighbor=Math.max(.01,Math.abs(data[i-1]-data[i-2]),Math.abs(data[i+1]-sample));
   if(jump>=jumpThreshold&&jump>=neighbor*contrast){
    candidateCount++;
    if(candidates.length<maxCandidates)candidates.push({frame:i,seconds:i/rate,jump});
   }
  }
  results.push({channel:channel+1,peak,invalid,overRange,maxJump,candidateCount,candidates});
 }
 return {sampleRate:rate,frames:length,channels:results,invalid:results.reduce((s,x)=>s+x.invalid,0),overRange:results.reduce((s,x)=>s+x.overRange,0),candidateCount:results.reduce((s,x)=>s+x.candidateCount,0)};
}
