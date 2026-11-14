// Estimates the relative arrival of the same sharp clap on two PCM channels.
// This does NOT measure absolute interface latency, headphone monitoring delay,
// or hardware clock drift. It requires both microphones to hear the same event.
export function estimateStereoTransientOffset(left,right,sampleRate,{maxOffsetMs=50}={}){
  if(!left||!right||left.length!==right.length||left.length<512||!Number.isFinite(sampleRate)||sampleRate<8000)
    throw Error('Deux canaux PCM comparables sont nécessaires.');
  const length=left.length;
  const window=Math.max(64,Math.round(sampleRate*.012));
  const step=Math.max(16,Math.round(sampleRate*.003));
  const peakCenters=[];
  for(const signal of [left,right]){
    let best=0,center=-1;
    for(let start=0;start+window<=length;start+=step){
      let sum=0;
      for(let k=start;k<start+window;k++){
        const value=signal[k];
        if(!Number.isFinite(value))continue;
        sum+=value*value;
      }
      if(sum>best){best=sum;center=start+Math.floor(window/2);}
    }
    const rms=Math.sqrt(best/window);
    if(center<0||rms<.01) return {ok:false,reason:'Signal commun insuffisant : fais un claquement net, audible sur les deux micros.'};
    peakCenters.push({center,rms});
  }
  const [a,b]=peakCenters;
  const coarse=b.center-a.center;
  const maxLag=Math.round(sampleRate*maxOffsetMs/1000);
  if(Math.abs(coarse)>maxLag) return {ok:false,reason:'Événements trop éloignés. Recommence avec un seul claquement net.'};
  // Cross-correlate a short neighborhood around the transient at high resolution.
  // Keep a constant overlap window to avoid biasing shorter candidate offsets.
  const radius=Math.min(Math.round(sampleRate*.025),Math.floor(length/10));
  let bestScore=-Infinity,bestLag=coarse;
  for(let lag=Math.max(-maxLag,coarse-Math.round(sampleRate*.008));lag<=Math.min(maxLag,coarse+Math.round(sampleRate*.008));lag++){
    let dot=0,aa=0,bb=0;
    for(let k=-radius;k<=radius;k++){
      const i=a.center+k,j=i+lag;
      if(i<0||j<0||i>=length||j>=length)continue;
      const x=left[i],y=right[j];
      if(!Number.isFinite(x)||!Number.isFinite(y))continue;
      dot+=x*y;aa+=x*x;bb+=y*y;
    }
    if(aa<1e-5||bb<1e-5)continue;
    const score=dot/Math.sqrt(aa*bb);
    if(score>bestScore){bestScore=score;bestLag=lag;}
  }
  if(bestScore<.2)return {ok:false,reason:'Corrélation faible : les micros ne semblent pas avoir capté le même claquement.',correlation:bestScore};
  return {ok:true,offsetSamples:bestLag,offsetMs:1000*bestLag/sampleRate,correlation:bestScore,
    note:'Décalage d’arrivée acoustique IN 2 par rapport à IN 1 ; pas une mesure de latence casque.'};
}

/** Summarize three independent clap measurements without claiming hardware clock sync. */
export function summarizeStereoSyncTrials(trials,{maxSpreadMs=1.5,minCorrelation=.5}={}){
  if(!Array.isArray(trials)||trials.length!==3||trials.some(t=>!t?.ok||!Number.isFinite(t.offsetMs)||!Number.isFinite(t.correlation)))
    return {ok:false,reason:'Trois claquements valides sont nécessaires pour vérifier la stabilité.',trials};
  const offsets=trials.map(t=>t.offsetMs).sort((a,b)=>a-b);
  const median=offsets[1],spread=offsets[2]-offsets[0];
  const correlation=Math.min(...trials.map(t=>t.correlation));
  if(correlation<minCorrelation)
    return {ok:false,reason:'Corrélation insuffisante entre les microphones. Recommence les trois claquements.',trials,spreadMs:spread};
  if(spread>maxSpreadMs)
    return {ok:false,reason:'Décalage instable entre les essais. Vérifie les distances et les entrées.',trials,spreadMs:spread};
  return {ok:true,offsetMs:median,spreadMs:spread,correlation,trials,
    kind:'acoustic-arrival-triplicate',
    note:'Écart acoustique relatif IN 2 − IN 1 sur trois événements, pas une mesure de latence du casque ou de dérive d’horloge.'};
}
