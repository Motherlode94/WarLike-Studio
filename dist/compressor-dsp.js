import {dynamicsFrames} from './dynamics-timing.js';

// Feedforward soft knee and smooth decoupled detector in the log domain.
// Giannoulis, Massberg & Reiss, JAES 60(6), 2012, equations (4), (17), (23).
// Original implementation; the displayed transfer uses this same function.
export function compressorCurve(input,threshold,ratio,knee){
 const slope=1/Math.max(1,ratio)-1,delta=input-threshold,k=Math.max(0,knee);
 if(k===0)return input+(delta>0?slope*delta:0);
 if(delta<=-k/2)return input;
 if(delta>=k/2)return input+slope*delta;
 return input+slope*(delta+k/2)**2/(2*k);
}

export class StereoCompressor {
 constructor(rate){
  this.rate=rate;this.delayFrames=dynamicsFrames(rate);
  this.leftDelay=new Float32Array(this.delayFrames);this.rightDelay=new Float32Array(this.delayFrames);
  this.index=0;this.released=0;this.envelope=0;this.gain=1;this.reduction=0;this.left=0;this.right=0;
  this.attack=this.release=NaN;
 }
 process(left,right,threshold=-20,ratio=3,knee=6,attack=.02,release=.18){
  left=Number.isFinite(left)?left:0;right=Number.isFinite(right)?right:0;
  if(attack!==this.attack){this.attack=attack;this.attackCoefficient=Math.exp(-1/(Math.max(.0001,attack)*this.rate));}
  if(release!==this.release){this.release=release;this.releaseCoefficient=Math.exp(-1/(Math.max(.005,release)*this.rate));}
  const level=20*Math.log10(Math.max(1e-12,Math.abs(left),Math.abs(right)));
  const requested=Math.max(0,level-compressorCurve(level,threshold,ratio,knee));
  this.released=Math.max(requested,this.releaseCoefficient*this.released+(1-this.releaseCoefficient)*requested);
  this.envelope=this.attackCoefficient*this.envelope+(1-this.attackCoefficient)*this.released;
  if(this.released<1e-10)this.released=0;
  if(this.envelope<1e-10)this.envelope=0;
  this.reduction=this.envelope>0?-this.envelope:0;this.gain=10**(-this.envelope/20);
  const delayedLeft=this.leftDelay[this.index],delayedRight=this.rightDelay[this.index];
  this.leftDelay[this.index]=left;this.rightDelay[this.index]=right;
  if(++this.index===this.delayFrames)this.index=0;
  this.left=delayedLeft*this.gain;this.right=delayedRight*this.gain;
 }
}
