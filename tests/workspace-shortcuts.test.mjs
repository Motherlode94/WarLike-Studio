import test from 'node:test';
import assert from 'node:assert/strict';
import {workspaceAction,handleWorkspaceAction,WORKSPACE_SHORTCUTS} from '../dist/workspace-shortcuts.js';

const event=(key,extra={})=>({key,defaultPrevented:false,repeat:false,ctrlKey:false,metaKey:false,altKey:false,shiftKey:false,target:{isContentEditable:false,matches:()=>false,closest:()=>null},...extra});

test('FL-inspired shortcuts open the existing WarLike workspaces',()=>{
  assert.deepEqual(WORKSPACE_SHORTCUTS,{F5:'playlist',F6:'rack',F7:'piano',F9:'mixer'});
  for(const [key,expected] of Object.entries(WORKSPACE_SHORTCUTS))assert.equal(workspaceAction(event(key)),expected);
});
test('shortcuts never interrupt editing, modal workflows, recording or modified keys',()=>{
  assert.equal(workspaceAction(event('F7'),{recording:true}),null);
  assert.equal(workspaceAction(event('F7'),{modalOpen:true}),null);
  assert.equal(workspaceAction(event('F7',{repeat:true})),null);
  assert.equal(workspaceAction(event('F7',{ctrlKey:true})),null);
  assert.equal(workspaceAction(event('F7',{target:{matches:()=>true,isContentEditable:false}})),null);
  assert.equal(workspaceAction(event('F7',{target:{matches:()=>false,isContentEditable:true}})),null);
  assert.equal(workspaceAction(event('F7',{defaultPrevented:true})),null);
  assert.equal(workspaceAction(event('F8')),null);
});
test('actions dispatch only to the requested editor',()=>{
  const calls=[];
  assert.equal(handleWorkspaceAction('rack',{rack:()=>calls.push('rack'),mixer:()=>calls.push('mixer')}),true);
  assert.deepEqual(calls,['rack']);
  assert.equal(handleWorkspaceAction('unknown',{rack:()=>calls.push('bad')}),false);
});
