import {detectPitch,targetNote} from './tune-dsp.js?v=0.14.0';
export class VocalKernel{
 constructor(rate){this.rate=rate;this.rings=[new Float32Array(16384),new Float32Array(16384)];this.at=0;this.frames=0;this.phase=0;this.ratio=1;this.target=1;this.voiced=0;this.confident=0;this.grain=Math.round(rate*.04);this.base=Math.round(rate*.02);this.latency=this.base+this.grain/2;this.analysis=new Float32Array(512);}
 read(channel,delay){const ring=this.rings[channel],pos=(this.at-delay+32768)%16384,i=Math.floor(pos),f=pos-i;return ring[i]*(1-f)+ring[(i+1)%16384]*f;}
 process(input,output,p){const length=output[0].length,channels=Math.min(output.length,2),key=Math.round(p.key??9),scale=['minor','major','chromatic'][Math.round(p.scale??0)],amount=p.amount??1,mix=p.mix??1,speed=p.speed??35,alpha=1-Math.exp(-1/(this.rate*Math.max(.001,speed/1000)));
  for(let i=0;i<length;i++){
   for(let c=0;c<2;c++)this.rings[c][this.at]=input[c]?.[i]??input[0]?.[i]??0;
   if(++this.frames%512===0&&this.frames>=2048){for(let j=0;j<512;j++)this.analysis[j]=(this.read(0,2047-j*4)+this.read(0,2046-j*4)+this.read(0,2045-j*4)+this.read(0,2044-j*4))*.25;const detected=detectPitch(this.analysis,this.rate/4);this.confident=detected?1:0;if(detected){const midi=69+12*Math.log2(detected.frequency/440),target=targetNote(midi,key,scale);this.target=2**(Math.max(-2,Math.min(2,(target-midi)*amount))/12);}else this.target=1;}
   this.ratio+=(this.target-this.ratio)*alpha;this.voiced+=(this.confident-this.voiced)*.003;this.phase=(this.phase+(1-this.ratio)/this.grain+1)%1;const phase2=(this.phase+.5)%1,weight=.5-.5*Math.cos(2*Math.PI*this.phase),blend=this.voiced*Math.min(1,Math.abs(this.ratio-1)*2000)*mix;
   for(let c=0;c<channels;c++){const dry=this.read(c,this.latency),wet=this.read(c,this.base+this.phase*this.grain)*weight+this.read(c,this.base+phase2*this.grain)*(1-weight);output[c][i]=dry*(1-blend)+wet*blend;}
   this.at=(this.at+1)%16384;
  }return true;
 }
}
