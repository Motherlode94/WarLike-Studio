// Adapted from Signalsmith Basics / Geraint Luff (MIT).
// See licenses/signalsmith-limiter.txt. One stereo-linked, sample-peak engine.
import {dynamicsFrames,dynamicsLatency} from './dynamics-timing.js';
export const limiterLatency = dynamicsLatency;

class BoxAverage {
 constructor(length) { this.values = new Float64Array(length).fill(1); this.index = 0; this.oldSum = length; this.newSum = 0; }
 next(value) {
  this.oldSum -= this.values[this.index]; this.newSum += value;
  this.values[this.index] = value;
  const result = (this.oldSum + this.newSum) / this.values.length;
  if (++this.index === this.values.length) { this.index = 0; this.oldSum = this.newSum; this.newSum = 0; }
  return result;
 }
}

export class VectorLimiter {
 constructor(rate) {
  this.rate = rate; this.delayFrames = dynamicsFrames(rate);
  const split = Math.round(this.delayFrames * .5822419);
  this.first = new BoxAverage(split + 1); this.second = new BoxAverage(this.delayFrames - split + 1);
  this.window = this.delayFrames + Math.ceil(rate * .003) + 1;
  this.values = new Float64Array(this.window + 1); this.times = new Float64Array(this.window + 1);
  this.head = 0; this.tail = 0; this.time = 0;
  this.leftDelay = new Float32Array(this.delayFrames); this.rightDelay = new Float32Array(this.delayFrames);
  this.index = 0; this.released = 1; this.gain = 1; this.left = 0; this.right = 0; this.safetyEvents = 0;
  this.releaseMs = NaN;
 }
 process(left, right, ceilingDb = -1, releaseMs = 100) {
  left = Number.isFinite(left) ? left : 0; right = Number.isFinite(right) ? right : 0;
  const ceiling = 10 ** (Math.max(-12, Math.min(-.1, ceilingDb)) / 20);
  if (releaseMs !== this.releaseMs) {
   this.releaseMs = releaseMs;
   // The two-stage smoother operates on energy (gain squared).
   this.slew = Math.LN2 / (Math.max(20, Math.min(500, releaseMs)) * .001 * this.rate * 2 + Math.LN2);
  }
  const peak = Math.max(ceiling, Math.abs(left), Math.abs(right));
  const allowed = (ceiling / peak) ** 2, size = this.values.length;
  while (this.head !== this.tail && this.times[this.head] <= this.time - this.window) this.head = (this.head + 1) % size;
  while (this.head !== this.tail) {
   const previous = (this.tail + size - 1) % size;
   if (this.values[previous] < allowed) break;
   this.tail = previous;
  }
  this.values[this.tail] = allowed; this.times[this.tail] = this.time++;
  this.tail = (this.tail + 1) % size;
  const minimum = this.values[this.head];
  this.released = Math.min(minimum, this.released + (minimum - this.released) * this.slew);
  let gain = Math.sqrt(Math.max(0, Math.min(1, this.second.next(this.first.next(this.released)))));
  const delayedLeft = this.leftDelay[this.index], delayedRight = this.rightDelay[this.index];
  this.leftDelay[this.index] = left; this.rightDelay[this.index] = right;
  if (++this.index === this.delayFrames) this.index = 0;
  // A falling automated ceiling also bounds samples already inside the delay.
  // A single common gain preserves the stereo ratio; this is not a clipper.
  const safe = ceiling / Math.max(ceiling, Math.abs(delayedLeft), Math.abs(delayedRight));
  if (gain > safe + 1e-12) { gain = safe; this.safetyEvents++; }
  this.gain = gain; this.left = delayedLeft * gain; this.right = delayedRight * gain;
 }
}
