import {StereoCompressor} from './compressor-dsp.js';

// First-order bilinear low-pass, high = input - low. The complementary sum is
// exactly the input, including during cutoff automation. Only high is compressed.
export class StereoDeesser {
 constructor(rate){
  this.rate=rate;this.comp=new StereoCompressor(rate);this.delayFrames=this.comp.delayFrames;
  this.lowLeft=new Float32Array(this.delayFrames);this.lowRight=new Float32Array(this.delayFrames);
  this.stateLeft=0;this.stateRight=0;this.index=0;this.frequency=NaN;
  this.left=0;this.right=0;this.reduction=0;
 }
 process(left,right,threshold=-24,ratio=5,knee=2,attack=.001,release=.075,frequency=6500){
  left=Number.isFinite(left)?left:0;right=Number.isFinite(right)?right:0;
  frequency=Math.max(20,Math.min(this.rate*.45,Number.isFinite(frequency)?frequency:6500));
  if(frequency!==this.frequency){this.frequency=frequency;const g=Math.tan(Math.PI*frequency/this.rate);this.coefficient=g/(1+g);}
  const vLeft=(left-this.stateLeft)*this.coefficient,vRight=(right-this.stateRight)*this.coefficient;
  const lowLeft=vLeft+this.stateLeft,lowRight=vRight+this.stateRight;
  this.stateLeft=lowLeft+vLeft;this.stateRight=lowRight+vRight;
  this.comp.process(left-lowLeft,right-lowRight,threshold,ratio,knee,attack,release);
  this.left=this.lowLeft[this.index]+this.comp.left;this.right=this.lowRight[this.index]+this.comp.right;
  this.lowLeft[this.index]=lowLeft;this.lowRight[this.index]=lowRight;
  if(++this.index===this.delayFrames)this.index=0;
  this.reduction=this.comp.reduction;
 }
}
