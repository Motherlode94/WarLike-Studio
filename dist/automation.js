export const pointValue=(points,bar,fallback)=>{if(!points?.length)return fallback;if(bar<=points[0].bar)return points[0].value;for(let i=1;i<points.length;i++)if(bar<=points[i].bar){const a=points[i-1],b=points[i];return a.value+(b.value-a.value)*(bar-a.bar)/(b.bar-a.bar);}return points.at(-1).value;};
export function normaliseCurve(points,min,max,bars){const unique=new Map();for(const p of Array.isArray(points)?points.slice(0,2048):[])if(Number.isFinite(p?.bar)&&Number.isFinite(p?.value))unique.set(Math.max(0,Math.min(bars,p.bar)),Math.max(min,Math.min(max,p.value)));return [...unique].map(([bar,value])=>({bar,value})).sort((a,b)=>a.bar-b.bar);}
export function putPoint(track,key,bar,value,base){track.automation??={mode:'off',curves:{}};track.automation.curves??={};const points=track.automation.curves[key]??[{bar:0,value:base}];const rounded=Math.round(bar*960)/960,index=points.findIndex(p=>Math.abs(p.bar-rounded)<1/960);if(index>=0)points[index]={bar:rounded,value};else points.push({bar:rounded,value});track.automation.curves[key]=points.sort((a,b)=>a.bar-b.bar);}
export function automateParam(param,points,{startBar,endBar,when,secondsPerBar,map=x=>x,exponential=false}){
  param.cancelScheduledValues(when);const initial=map(pointValue(points,startBar,0));param.setValueAtTime(initial,when);
  const relevant=points.filter(p=>p.bar>startBar&&p.bar<=endBar);if(points.some(p=>p.bar>endBar))relevant.push({bar:endBar,value:pointValue(points,endBar,0)});
  for(const p of relevant){const time=when+(p.bar-startBar)*secondsPerBar,value=map(p.value);if(exponential&&value>0&&initial>0)param.exponentialRampToValueAtTime(value,time);else param.linearRampToValueAtTime(value,time);}
}
const db=x=>10**(x/20);
export function bindings(ch,track,definitions){
  const map=new Map(),add=(key,label,min,max,value,targets)=>map.set(key,{key,label,min,max,value,targets:targets.map(t=>Array.isArray(t)?{param:t[0],map:t[1],exponential:!!t[2]}:{param:t,map:x=>x})});
  add('volume','Volume',-48,12,track.volume,[[ch.gain.gain,db,true]]);add('pan','Panoramique',-1,1,track.pan,[ch.pan.pan]);
  for(const send of track.sends||[]){const n=ch.sendNodes?.get(send.id);if(n)add('send:'+send.id,'Envoi '+send.target,-60,12,send.level,[[n.gain.gain,x=>send.enabled?db(x):0,true]]);}
  for(const id of track.inserts||[]){if(!id||!track.effects[id]?.enabled)continue;const type=id.split('__')[0],n=ch.instanceChannels?.get(id)||ch,e=track.effects[id],m=n.pack.modules[type];const targets={
    color:{mix:[[n.colorWet.gain,x=>x],[n.colorDry.gain,x=>1-x]],output:[[n.colorOut.gain,db,true]]},sculpt:{cutoff:[n.filter.frequency],highpass:[n.highpass.frequency]},
    prism:{low:[n.eqLow.gain],mid:[n.eqMid.gain],high:[n.eqHigh.gain],lowFreq:[n.eqLow.frequency],midFreq:[n.eqMid.frequency],highFreq:[n.eqHigh.frequency],q:[n.eqMid.Q]},
    glue:{threshold:[n.compressor.threshold],ratio:[n.compressor.ratio],attack:[[n.compressor.attack,x=>x/1000]],release:[[n.compressor.release,x=>x/1000]],knee:[n.compressor.knee],makeup:[[n.makeup.gain,db,true]],mix:[[n.compressWet.gain,x=>x],[n.compressDry.gain,x=>1-x]]},
    echo:{mix:[n.send.gain],feedback:[n.feedback.gain]},aura:{mix:[n.space.gain]},
    ...(m?{[type]:type==='hush'?{threshold:[[m.envelope.scale.gain,x=>.5/db(x),true]]}:type==='sibil'?{frequency:[m.band.frequency],threshold:[[m.envelope.scale.gain,x=>1/32/db(x),true]]}:type==='ember'?{tone:[m.tone.frequency],output:[[m.blend.wet.gain,x=>e.mix*db(x),true]],mix:[[m.blend.dry.gain,x=>1-x],[m.blend.wet.gain,x=>x*db(e.output)]]}:type==='orbit'?{rate:[m.lfo.frequency],depth:[[m.depthL.gain,x=>x*.007],[m.depthR.gain,x=>-x*.007]],width:[[m.panL.pan,x=>-x],m.panR.pan],mix:[[m.blend.dry.gain,x=>1-x],m.blend.wet.gain]}:type==='sway'?{rate:[m.lfo.frequency],depth:[[m.amp.gain,x=>1-x/2],[m.depth.gain,x=>x/2]],pan:[m.panDepth.gain],mix:[[m.blend.dry.gain,x=>1-x],m.blend.wet.gain]}:{feedback:[m.feedbackL.gain,m.feedbackR.gain],tone:[m.toneL.frequency,m.toneR.frequency],mix:[[m.blend.dry.gain,x=>1-x],m.blend.wet.gain]}}:{} )
  }[type]||{};
    for(const [key,t] of Object.entries(targets)){const c=definitions[type].controls.find(c=>c.key===key);if(c)add(id+':'+key,definitions[type].name+' · '+c.name,c.min,c.max,e[key],t);}
  }return map;
}
