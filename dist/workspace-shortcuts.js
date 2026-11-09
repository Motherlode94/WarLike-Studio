// FL Studio-inspired window navigation (original WarLike implementation).
// This helper is independent of the DOM so key handling can be unit tested.
export const WORKSPACE_SHORTCUTS = Object.freeze({
  F5:"playlist",
  F6:"rack",
  F7:"piano",
  F9:"mixer"
});
export function workspaceAction(event,options={}){
  const {modalOpen=false,recording=false}=options;
  if(modalOpen || recording || event.defaultPrevented || event.repeat || event.ctrlKey || event.metaKey || event.altKey || event.shiftKey)return null;
  const active=event.target;
  if(active?.isContentEditable || active?.closest?.('[contenteditable="true"]'))return null;
  if(active?.matches?.('input,textarea,select'))return null;
  return WORKSPACE_SHORTCUTS[event.key]||null;
}
export function handleWorkspaceAction(action,handlers={}){
  const invoke={playlist:handlers.playlist,rack:handlers.rack,piano:handlers.piano,mixer:handlers.mixer}[action];
  if(typeof invoke!=="function")return false;
  invoke();return true;
}
