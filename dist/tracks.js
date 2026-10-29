// Move track objects without recreating clips, effects, assets or audio channels.
export function reorderTrackList(tracks, trackId, beforeId = null) {
  const source = tracks.findIndex(track => track.id === trackId);
  if (source < 0 || trackId === beforeId || (beforeId !== null && !tracks.some(track => track.id === beforeId))) return tracks;
  const next = tracks.filter(track => track.id !== trackId);
  const destination = beforeId === null ? next.length : next.findIndex(track => track.id === beforeId);
  next.splice(destination, 0, tracks[source]);
  return next.every((track, index) => track === tracks[index]) ? tracks : next;
}

export function stepTrackDestination(tracks, trackId, direction) {
  const index = tracks.findIndex(track => track.id === trackId);
  if (index < 0 || (direction < 0 && index === 0) || (direction > 0 && index === tracks.length - 1)) return trackId;
  return direction < 0 ? tracks[index - 1].id : tracks[index + 2]?.id ?? null;
}

export function clampTrackVolume(value) {
  if (value === null || value === undefined || (typeof value === 'string' && !value.trim())) return null;
  const numeric = Number(value);
  return Number.isFinite(numeric) ? Math.max(-48, Math.min(12, numeric)) : null;
}

// Pointer capture keeps a drag active beyond the name button, including in Mix.
export function installTrackReordering({onMove, canMove = () => true, onDragEnd = () => {}}) {
  let drag = null, animation = 0;
  const indicator = document.createElement('div');
  indicator.className = 'track-drop-indicator';
  indicator.hidden = true;
  indicator.setAttribute('aria-hidden', 'true');
  document.body.append(indicator);

  const surfaceAt = (x, y) => document.elementFromPoint(x, y)?.closest('#sessionTrackList, #trackRows, #mixerView');
  function showDestination() {
    if (!drag?.active) return;
    const surface = surfaceAt(drag.x, drag.y);
    drag.valid = false;
    indicator.hidden = true;
    if (!surface) return;
    const mixer = surface.id === 'mixerView';
    const selector = mixer ? '[data-mixer-track]' : surface.id === 'trackRows' ? '[data-track]' : '[data-select-track]';
    const nodes = [...surface.children].filter(node => node.matches(selector));
    if (!nodes.length) return;
    const scroller = surface.id === 'trackRows' ? document.getElementById('timelineScroll') : surface;
    const viewport = scroller.getBoundingClientRect();
    const cursor = mixer ? drag.x : drag.y, low = mixer ? viewport.left : viewport.top, high = mixer ? viewport.right : viewport.bottom;
    if (cursor < low + 30) mixer ? scroller.scrollLeft -= 8 : scroller.scrollTop -= 8;
    else if (cursor > high - 30) mixer ? scroller.scrollLeft += 8 : scroller.scrollTop += 8;
    const target = nodes.find(node => {
      const r = node.getBoundingClientRect();
      return cursor < (mixer ? r.left + r.width / 2 : r.top + r.height / 2);
    });
    const rect = (target || nodes.at(-1)).getBoundingClientRect();
    const bound = surface.getBoundingClientRect();
    const beforeId = target ? target.dataset.mixerTrack || target.dataset.track || target.dataset.selectTrack : null;
    drag.beforeId = beforeId;
    drag.valid = true;
    indicator.hidden = false;
    indicator.classList.toggle('vertical', mixer);
    indicator.style.left = (mixer ? target ? rect.left : rect.right : Math.max(0, bound.left)) + 'px';
    indicator.style.top = (mixer ? Math.max(viewport.top, rect.top) : target ? rect.top : rect.bottom) + 'px';
    indicator.style.width = (mixer ? 3 : Math.min(innerWidth - bound.left, bound.width)) + 'px';
    indicator.style.height = (mixer ? Math.min(viewport.height, rect.height) : 3) + 'px';
    indicator.dataset.label = 'Déplacer ' + drag.name;
  }
  function animate() {showDestination(); if (drag?.active) animation = requestAnimationFrame(animate);}
  function finish(commit) {
    if (!drag) return;
    const previous = drag;
    drag = null;
    cancelAnimationFrame(animation);
    indicator.hidden = true;
    document.body.classList.remove('track-reordering');
    document.querySelectorAll('.track-drag-source').forEach(node => node.classList.remove('track-drag-source'));
    try {if (previous.element.hasPointerCapture(previous.pointer)) previous.element.releasePointerCapture(previous.pointer);} catch {}
    if (previous.active) {
      onDragEnd();
      if (commit && previous.valid) onMove(previous.trackId, previous.beforeId);
    }
  }
  document.addEventListener('pointerdown', event => {
    const element = event.target.closest('[data-select-track], [data-track-drag]');
    if (!element || event.button !== 0 || !canMove() || event.target.closest('input,select,textarea')) return;
    drag = {element, trackId: element.dataset.trackDrag || element.dataset.selectTrack, pointer: event.pointerId,
      startX:event.clientX, startY:event.clientY, x:event.clientX, y:event.clientY, name: element.dataset.trackName || element.textContent.trim(), active:false};
  });
  document.addEventListener('pointermove', event => {
    if (!drag || drag.pointer !== event.pointerId) return;
    drag.x = event.clientX; drag.y = event.clientY;
    if (!drag.active && Math.hypot(drag.x - drag.startX, drag.y - drag.startY) >= 6) {
      drag.active = true;
      drag.element.classList.add('track-drag-source');
      document.body.classList.add('track-reordering');
      try {drag.element.setPointerCapture(event.pointerId);} catch {}
      animate();
    }
    if (drag.active) {event.preventDefault(); showDestination();}
  }, {passive:false});
  document.addEventListener('pointerup', event => {if (drag?.pointer === event.pointerId) finish(true);});
  document.addEventListener('pointercancel', event => {if (drag?.pointer === event.pointerId) finish(false);});
  document.addEventListener('keydown', event => {if (drag?.active && event.key === 'Escape') {event.preventDefault(); finish(false);}}, true);
  window.addEventListener('blur', () => finish(false));
}
