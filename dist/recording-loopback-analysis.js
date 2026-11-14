// Three-pulse audio loopback estimator; estimates round-trip output-to-input
// offset of a connected line cable. It DOES NOT measure headphone comfort,
// speaker acoustics, nor exact one-way monitoring latency.
export function evaluateLoopbackLatency(signal,pulse,sampleRate,{expectedTimes=[.35,.7,1.05],maxLatencyMs=120}={}){
  if(!signal?.length||!pulse?.length||!Number.isFinite(sampleRate)||sampleRate<8000)
    throw Error('Signal de calibration PCM invalide.');
  const maxOffset=Math.max(0,Math.round(sampleRate*maxLatencyMs/1000));
  const attempts=[];
  // Normalized correlation is robust to changes in input gain and rejects noise.
  let pulsePower=0;
  for(let i=0;i<pulse.length;i++)pulsePower+=pulse[i]*pulse[i];
  if(pulsePower<1e-6)throw Error('Impulsion de calibration trop faible.');
  function correlate(start){
    let dot=0,power=0;
    for(let k=0;k<pulse.length;k++){const value=signal[start+k];dot+=value*pulse[k];power+=value*value;}
    return power>1e-8?dot/Math.sqrt(power*pulsePower):0;
  }
  for(const expectedTime of expectedTimes){
    const expected=Math.round(expectedTime*sampleRate);
    if(expected<0||expected+maxOffset+pulse.length>signal.length)
      throw Error('La capture est trop courte pour la calibration.');
    let best=-Infinity,position=expected;
    for(let offset=0;offset<=maxOffset;offset+=4){
      const match=correlate(expected+offset);
      if(match>best){best=match;position=expected+offset;}
    }
    for(let at=Math.max(expected,position-4);at<=Math.min(expected+maxOffset,position+4);at++){
      const match=correlate(at);
      if(match>best){best=match;position=at;}
    }
    attempts.push({latencyMs:(position-expected)*1000/sampleRate,correlation:best});
  }
  const good=attempts.filter(item=>item.correlation>=.65);
  if(good.length<3)return {ok:false,reason:'Au moins une impulsion de bouclage est absente ou trop bruitée.',attempts};
  const values=good.map(item=>item.latencyMs),mean=values.reduce((a,b)=>a+b,0)/values.length;
  const spread=Math.max(...values)-Math.min(...values);
  if(spread>4)return {ok:false,reason:'Latence instable entre les impulsions (>4 ms). Vérifie le routage et recommence.',attempts,spreadMs:spread};
  return {ok:true,latencyMs:mean,spreadMs:spread,attempts,kind:'wired-round-trip',sampleRate,
    note:'Latence du trajet audio sortie → câble → entrée, pas la latence casque à sens unique.'};
}
