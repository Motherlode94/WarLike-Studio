import test from 'node:test';
import assert from 'node:assert/strict';
import {menuShortcut} from '../dist/app-menus.js';

const event=(key,extra={})=>({key,ctrlKey:true,metaKey:false,altKey:false,isComposing:false,repeat:false,...extra});

test('file shortcuts are delegated only for new and open',()=>{
 assert.equal(menuShortcut(event('n')),'new');
 assert.equal(menuShortcut(event('O')),'open');
 assert.equal(menuShortcut(event('s')),null,'Main Studio owns Ctrl+S: no duplicate export');
 for(const key of ['x','c','v','z','d','y'])assert.equal(menuShortcut(event(key)),null,'Main Studio owns editing key '+key);
});
test('menu shortcuts ignore Alt chords, repeats and composition',()=>{
 assert.equal(menuShortcut(event('n',{altKey:true})),null);
 assert.equal(menuShortcut(event('n',{repeat:true})),null);
 assert.equal(menuShortcut(event('n',{isComposing:true})),null);
 assert.equal(menuShortcut(event('n',{ctrlKey:false})),null);
 assert.equal(menuShortcut(event('o',{ctrlKey:false,metaKey:true})),'open');
});
