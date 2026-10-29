// Timeline operations shared by Edit, shortcuts and the audio engine.
export const MIN_CLIP_LENGTH = 1 / 64;
export const barSeconds = bpm => 240 / bpm;
export function snapBar(value, mode = 'grid', grid = 1 / 16) {
  return mode === 'slip' ? value : Math.round(value / grid) * grid;
}
export function musicalPosition(bar) {
  const ticks = Math.max(0, Math.round(bar * 3840));
  return `${String(Math.floor(ticks / 3840) + 1).padStart(3, '0')} | ${Math.floor(ticks % 3840 / 960) + 1} | ${String(ticks % 960).padStart(3, '0')}`;
}
export function splitClip(clip, position, bpm, newId) {
  const delta = position - clip.start;
  if (delta < MIN_CLIP_LENGTH || clip.length - delta < MIN_CLIP_LENGTH) return null;
  const right = structuredClone(clip);
  right.id = newId;
  right.start = position;
  right.length = clip.length - delta;
  if (clip.audioId) right.sourceOffset = (clip.sourceOffset || 0) + delta * barSeconds(bpm);
  else right.patternOffset = (clip.patternOffset || 0) + delta * 16;
  const left={...structuredClone(clip),length:delta};if(clip.audioId){left.fadeOut=.005;right.fadeIn=.005;}return [left,right];
}
export function trimClip(clip, edge, position, total, bpm, sourceDuration = Infinity) {
  const next = { ...clip }, end = clip.start + clip.length;
  if (edge === 'left') {
    const available = clip.audioId ? (clip.sourceOffset || 0) / barSeconds(bpm) : (clip.patternOffset || 0) / 16;
    next.start = Math.max(0, clip.start - available, Math.min(end - MIN_CLIP_LENGTH, position));
    const delta = next.start - clip.start;
    next.length = end - next.start;
    if (clip.audioId) next.sourceOffset = Math.max(0, (clip.sourceOffset || 0) + delta * barSeconds(bpm));
    else next.patternOffset = Math.max(0, (clip.patternOffset || 0) + delta * 16);
  } else {
    const available = clip.audioId ? Math.max(MIN_CLIP_LENGTH, (sourceDuration - (clip.sourceOffset || 0)) / barSeconds(bpm)) : Infinity;
    next.length = Math.max(MIN_CLIP_LENGTH, Math.min(total - clip.start, available, position - clip.start));
  }
  return next;
}
