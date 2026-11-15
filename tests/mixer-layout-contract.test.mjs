import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
const css=readFileSync(new URL('../dist/reference-workspace.css',import.meta.url),'utf8');
const app=readFileSync(new URL('../dist/app.js',import.meta.url),'utf8');
test('mixer strips keep a readable width, horizontally scroll and align vertically',()=>{
 const marker=css.slice(css.lastIndexOf('/* Mixer layout stabilization:'));
 assert.ok(marker.includes('overflow-x:auto'),'mixer needs horizontal scroll');
 assert.match(marker,/\.reference-studio \.mixer-channel\{[^}]*flex:0 0 176px/s);
 assert.match(marker,/grid-template-rows:18px 26px 56px 165px 36px 42px 26px minmax\(205px,1fr\) 27px 28px/);
 assert.match(marker,/\.reference-studio \.mixer-master\{[^}]*position:sticky/s);
 assert.match(marker,/\.reference-studio \.mixer-channel \.channel-inserts\{[^}]*overflow-y:auto/s);
});
test('mixer retains its real inserts, rack editor and fader controls',()=>{
 for(const token of ['data-vox-rack-open','data-insert-open','data-insert-bypass','data-volume=','data-pan=','data-meter='])assert.ok(app.includes(token),'lost control '+token);
});
