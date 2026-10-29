import test from 'node:test';
import assert from 'node:assert/strict';
import {DRUM_GROOVES,SESSION_TEMPLATES,createFactorySession,createContentClip,contentCounts} from '../dist/content.js';
import {DRUM_VOICES,ensurePlugins} from '../dist/plugins.js';
import {exportRack,importRack} from '../dist/bundle.js';

test('factory sessions are complete, bounded and independent projects',()=>{
  assert.deepEqual(contentCounts(),{instruments:19,effects:16,presets:190,grooves:12,drums:8,sessions:3});
  for(const template of SESSION_TEMPLATES){
    const project=createFactorySession(template.id),ids=new Set();
    assert.equal(project.bars,16);assert.equal(project.tracks.length,9);
    assert.equal(project.bpm,template.bpm);assert.equal(project.tracks.filter(t=>t.type==='audio').length,3);
    for(const track of project.tracks){
      assert.ok(!ids.has(track.id));ids.add(track.id);
      for(const clip of track.clips){
        assert.ok(!ids.has(clip.id));ids.add(clip.id);
        assert.ok(clip.start>=0&&clip.start+clip.length<=project.bars);
        if(clip.notes)for(const n of clip.notes){assert.ok(n.step>=0&&n.step<32);assert.ok(n.len>0&&n.step+n.len<=32);assert.ok([0,2,4,5,7,9,11].includes(n.midi%12));}
      }
    }
    assert.deepEqual(project.sections.map(s=>s.start),[0,4,8,12]);
    project.tracks[0].clips[0].pattern.kick.fill(0);
    assert.ok(createFactorySession(template.id).tracks[0].clips[0].pattern.kick.some(Boolean));
  }
});

test('every groove has eight valid rows and produces independent editable clips',()=>{
  assert.equal(new Set(DRUM_GROOVES.map(g=>g.id)).size,12);
  for(const groove of DRUM_GROOVES){
    assert.deepEqual(Object.keys(groove.pattern),Object.keys(DRUM_VOICES));
    assert.ok(groove.bpm>=60&&groove.bpm<=200);
    for(const row of Object.values(groove.pattern)){assert.equal(row.length,16);assert.ok(row.every(v=>v===0||v===1));}
    const clip=createContentClip('drums',groove.name,0,2,groove.id);
    assert.deepEqual(clip.pattern,groove.pattern);clip.pattern.kick.fill(0);
    assert.ok(groove.pattern.kick.some(Boolean));
  }
});

test('old sessions retain their mix and acquire neutral new processors',()=>{
  const old={type:'bass',instrument:{body:.4,harmonics:0,release:.1},effects:{color:{enabled:false,drive:0},echo:{enabled:false,mix:0,feedback:.2}}};
  const original=structuredClone(old);ensurePlugins(old);
  assert.deepEqual(old.instrument,original.instrument);assert.deepEqual(old.effects.color,{...original.effects.color,mix:1,output:0});assert.deepEqual(old.effects.echo,original.effects.echo);
  assert.deepEqual(old.effects.prism,{enabled:false,low:0,mid:0,high:0,lowFreq:120,midFreq:1500,highFreq:8000,q:.8});assert.equal(old.effects.glue.enabled,false);
});

test('pre-0.5 racks load with neutral EQ and bypassed compression',()=>{
  const original=createFactorySession().tracks[1],rack=exportRack(original);
  delete rack.effects.prism;delete rack.effects.glue;
  delete rack.effects.color.mix;delete rack.effects.color.output;
  const target=createFactorySession().tracks[1];target.effects.glue.enabled=true;target.effects.prism.low=12;
  importRack(target,rack);
  assert.deepEqual(target.instrument,rack.instrument);assert.equal(target.effects.glue.enabled,false);assert.equal(target.effects.prism.low,0);
  assert.equal(target.effects.color.mix,1);assert.equal(target.effects.color.output,0);
});
