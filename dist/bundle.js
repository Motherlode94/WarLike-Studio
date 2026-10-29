import {ACOUSTIC_PRESETS} from './acoustic.js?v=0.13.0';
import {EXO_PRESETS} from './exo.js?v=0.13.0';
import {packPresetBank} from './packs.js?v=0.13.0';
import {INSTRUMENTS,EFFECTS,ensurePlugins,addEffectInsert,effectType,effectDefinition} from './plugins.js?v=0.13.0';
export const FACTORY_PRESETS={
  "drums": [
    {
      "name": "Trap Starter",
      "values": {
        "punch": 0.85,
        "decay": 0.38,
        "hat": 0.75
      }
    },
    {
      "name": "Soft Pocket",
      "values": {
        "punch": 0.55,
        "decay": 0.22,
        "hat": 0.45
      }
    },
    {
      "name": "Heavy Knock",
      "values": {
        "punch": 1,
        "decay": 0.6,
        "hat": 0.65
      }
    },
    {
      "name": "Afro Skin",
      "values": {
        "punch": 0.7,
        "decay": 0.28,
        "hat": 0.9
      }
    },
    {
      "name": "Tight Room",
      "values": {
        "punch": 0.65,
        "decay": 0.13,
        "hat": 0.55
      }
    }
  ],
  "bass": [
    {
      "name": "Clean Sub",
      "values": {
        "body": 0.6,
        "harmonics": 0,
        "release": 0.16
      }
    },
    {
      "name": "Heavy 808",
      "values": {
        "body": 0.8,
        "harmonics": 0.25,
        "release": 0.3
      }
    },
    {
      "name": "Long Tail",
      "values": {
        "body": 0.55,
        "harmonics": 0.08,
        "release": 0.75
      }
    },
    {
      "name": "Round Sub",
      "values": {
        "body": 0.45,
        "harmonics": 0.02,
        "release": 0.12
      }
    },
    {
      "name": "Bite",
      "values": {
        "body": 0.7,
        "harmonics": 0.4,
        "release": 0.1
      }
    }
  ],
  "keys": [
    {
      "name": "Velvet Original",
      "values": {
        "attack": 0.018,
        "release": 0.5,
        "detune": 5
      }
    },
    {
      "name": "Soft Pad",
      "values": {
        "attack": 0.28,
        "release": 1.4,
        "detune": 12
      }
    },
    {
      "name": "Short Keys",
      "values": {
        "attack": 0.008,
        "release": 0.15,
        "detune": 2
      }
    },
    {
      "name": "Glass Keys",
      "values": {
        "attack": 0.006,
        "release": 0.7,
        "detune": 0.2
      }
    },
    {
      "name": "Soul Keys",
      "values": {
        "attack": 0.025,
        "release": 0.9,
        "detune": 8
      }
    }
  ],
  "lead": [
    {
      "name": "Neon Hook",
      "values": {
        "cutoff": 6500,
        "detune": 9,
        "release": 0.18
      }
    },
    {
      "name": "Soft Whistle",
      "values": {
        "cutoff": 1100,
        "detune": 1,
        "release": 0.3
      }
    },
    {
      "name": "Acid Line",
      "values": {
        "cutoff": 2200,
        "detune": 18,
        "release": 0.07
      }
    },
    {
      "name": "Sharp Pulse",
      "values": {
        "cutoff": 9300,
        "detune": 5,
        "release": 0.1
      }
    },
    {
      "name": "Wide Lead",
      "values": {
        "cutoff": 4500,
        "detune": 25,
        "release": 0.4
      }
    }
  ],
  "pad": [
    {
      "name": "Air Room",
      "values": {
        "attack": 0.6,
        "release": 2,
        "width": 14
      }
    },
    {
      "name": "Warm Cloud",
      "values": {
        "attack": 1.2,
        "release": 3,
        "width": 8
      }
    },
    {
      "name": "Dawn",
      "values": {
        "attack": 0.15,
        "release": 0.9,
        "width": 6
      }
    },
    {
      "name": "Wide Nebula",
      "values": {
        "attack": 0.7,
        "release": 2.8,
        "width": 25
      }
    },
    {
      "name": "Slow Prayer",
      "values": {
        "attack": 1.8,
        "release": 3.8,
        "width": 12
      }
    }
  ],
  "pluck": [
    {
      "name": "Glass Pluck",
      "values": {
        "decay": 0.24,
        "brightness": 9000,
        "body": 0.16
      }
    },
    {
      "name": "Muted String",
      "values": {
        "decay": 0.13,
        "brightness": 2400,
        "body": 0.21
      }
    },
    {
      "name": "Kalimba Glow",
      "values": {
        "decay": 0.35,
        "brightness": 5800,
        "body": 0.18
      }
    },
    {
      "name": "Short Marimba",
      "values": {
        "decay": 0.12,
        "brightness": 1600,
        "body": 0.27
      }
    },
    {
      "name": "Wire",
      "values": {
        "decay": 0.65,
        "brightness": 10800,
        "body": 0.12
      }
    }
  ],
  "color": [
    {
      "name": "Clean",
      "values": {
        "drive": 0
      }
    },
    {
      "name": "Warm",
      "values": {
        "drive": 0.12
      }
    },
    {
      "name": "Crush",
      "values": {
        "drive": 0.55
      }
    },
    {
      "name": "Tape Glow",
      "values": {
        "drive": 0.24
      }
    },
    {
      "name": "Desert Drive",
      "values": {
        "drive": 0.38
      }
    }
  ],
  "sculpt": [
    {
      "name": "Full Range",
      "values": {
        "highpass": 20,
        "cutoff": 18000
      }
    },
    {
      "name": "Vocal Clean",
      "values": {
        "highpass": 90,
        "cutoff": 16000
      }
    },
    {
      "name": "Lo-Fi",
      "values": {
        "highpass": 160,
        "cutoff": 3400
      }
    },
    {
      "name": "Narrow Voice",
      "values": {
        "highpass": 140,
        "cutoff": 8000
      }
    },
    {
      "name": "Soft Top",
      "values": {
        "highpass": 40,
        "cutoff": 9500
      }
    }
  ],
  "echo": [
    {
      "name": "Dry",
      "values": {
        "mix": 0,
        "feedback": 0.3
      }
    },
    {
      "name": "Slap",
      "values": {
        "mix": 0.1,
        "feedback": 0.15
      }
    },
    {
      "name": "Wide Echo",
      "values": {
        "mix": 0.24,
        "feedback": 0.42
      }
    },
    {
      "name": "Dub Trail",
      "values": {
        "mix": 0.35,
        "feedback": 0.62
      }
    },
    {
      "name": "Hook Throw",
      "values": {
        "mix": 0.5,
        "feedback": 0.3
      }
    }
  ],
  "aura": [
    {
      "name": "Dry",
      "values": {
        "mix": 0
      }
    },
    {
      "name": "Small Studio",
      "values": {
        "mix": 0.12
      }
    },
    {
      "name": "Cloud",
      "values": {
        "mix": 0.42
      }
    },
    {
      "name": "Long Hall",
      "values": {
        "mix": 0.6
      }
    },
    {
      "name": "Tiny Room",
      "values": {
        "mix": 0.06
      }
    }
  ],
  "prism": [
    {
      "name": "Flat",
      "values": {
        "low": 0,
        "mid": 0,
        "high": 0
      }
    },
    {
      "name": "Vocal Air",
      "values": {
        "low": -2,
        "mid": 1.5,
        "high": 3
      }
    },
    {
      "name": "Warm Body",
      "values": {
        "low": 2,
        "mid": -1,
        "high": -0.5
      }
    },
    {
      "name": "Presence",
      "values": {
        "low": 0,
        "mid": 3,
        "high": 1
      }
    },
    {
      "name": "Deep Cut",
      "values": {
        "low": -6,
        "mid": -1,
        "high": 2
      }
    }
  ],
  "glue": [
    {
      "name": "Vocal Control",
      "values": {
        "threshold": -22,
        "ratio": 3,
        "attack": 12,
        "release": 180,
        "makeup": 3
      }
    },
    {
      "name": "Rap Firm",
      "values": {
        "threshold": -28,
        "ratio": 4.5,
        "attack": 6,
        "release": 140,
        "makeup": 5
      }
    },
    {
      "name": "Gentle Bus",
      "values": {
        "threshold": -14,
        "ratio": 2,
        "attack": 30,
        "release": 300,
        "makeup": 1.5
      }
    },
    {
      "name": "Tight Drums",
      "values": {
        "threshold": -20,
        "ratio": 6,
        "attack": 15,
        "release": 80,
        "makeup": 3
      }
    },
    {
      "name": "Hard Clamp",
      "values": {
        "threshold": -35,
        "ratio": 10,
        "attack": 2,
        "release": 80,
        "makeup": 8
      }
    }
  ]
};
Object.assign(FACTORY_PRESETS,ACOUSTIC_PRESETS,packPresetBank(),{exo:EXO_PRESETS.map(p=>({...p,values:{...p.values}}))});
export function presetsFor(track,id){return FACTORY_PRESETS[id==='instrument'?track.type:effectType(id)]||[];}
export function matchPreset(track,id){const state=id==='instrument'?track.instrument:track.effects[id];return presetsFor(track,id).findIndex(p=>Object.entries(p.values).every(([key,value])=>Math.abs(state[key]-value)<1e-8));}
for(const [id,presets] of Object.entries(FACTORY_PRESETS)){const def=INSTRUMENTS[id]||EFFECTS[id];for(const preset of presets)preset.values={...Object.fromEntries(def.controls.map(c=>[c.key,c.default])),...preset.values};}
export function applyFactoryPreset(track,id,index){ensurePlugins(track);const preset=presetsFor(track,id)[index];if(!preset)throw new Error('Preset inconnu.');const state=id==='instrument'?track.instrument:track.effects[id];Object.assign(state,preset.values);if(id!=='instrument'){if(track.inserts.includes(id))state.enabled=true;else addEffectInsert(track,id);}return preset.name;}
export function exportRack(track){ensurePlugins(track);return JSON.parse(JSON.stringify({format:'chayah-suite-rack',version:1,trackType:track.type,instrument:track.instrument,effects:track.effects,inserts:track.inserts,tune:track.tune}));}
export function importRack(track,data){
  if(data?.format!=='chayah-suite-rack'||data.version!==1)throw new Error('Ce fichier n’est pas un rack CHAYAH Suite.');
  if(data.trackType!==track.type)throw new Error('Sélectionne une piste du même type que ce rack.');
  const read=(value,def)=>Object.fromEntries(def.controls.map(c=>{const n=value?.[c.key]===undefined?c.default:value[c.key];if(!Number.isFinite(n))throw new Error('Valeur de preset invalide.');return [c.key,Math.max(c.min,Math.min(c.max,n))];}));
  const instrument=INSTRUMENTS[track.type]?read(data.instrument,INSTRUMENTS[track.type]):{};
  if(!data.effects||typeof data.effects!=='object')throw new Error('Effets du rack invalides.');const effects=Object.fromEntries(Object.entries(EFFECTS).map(([id,def])=>{const value=data.effects[id]||{enabled:false,...Object.fromEntries(def.controls.map(c=>[c.key,c.default]))};return[id,{enabled:value.enabled!==false,...read(value,def)}];}));
  for(const [id,value] of Object.entries(data.effects))if(!Object.hasOwn(EFFECTS,id)&&effectDefinition(id)&&/^[a-z]+__[a-z0-9]+$/.test(id))effects[id]={enabled:value.enabled!==false,...read(value,effectDefinition(id))};
  const tune=data.tune;if(!tune||!Number.isInteger(tune.key)||tune.key<0||tune.key>11||!['minor','major','chromatic'].includes(tune.scale)||!['speed','amount','mix'].every(k=>Number.isFinite(tune[k])))throw new Error('Réglages TUNE invalides.');
  const incoming={type:track.type,instrument,effects,tune};if(data.inserts!==undefined)incoming.inserts=data.inserts;ensurePlugins(incoming);
  Object.assign(track,{instrument,effects:incoming.effects,inserts:incoming.inserts,tune:{key:tune.key,scale:tune.scale,speed:Math.max(0,Math.min(250,tune.speed)),amount:Math.max(0,Math.min(1,tune.amount)),mix:Math.max(0,Math.min(1,tune.mix))}});
}
