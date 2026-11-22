import {FUNK_GOSPEL_PRESETS} from './funk-gospel-presets.js';
import {RNB_NEO_SOUL_PRESETS} from './rnb-neo-soul-presets.js';
import {AMAPIANO_AFROBEAT_PRESETS} from './amapiano-afrobeat-presets.js';
import {TRAP_DRILL_PRESETS} from './trap-drill-presets.js';
// Original synthesis algorithms. Not named-brand emulations or acoustic recordings.
const entries=[
 {
  "id": "wltitan",
  "name": "WL TITAN",
  "subtitle": "ELECTRIC BASS MODEL",
  "family": "Basses",
  "description": "Corde pincée, position de micro et couleur électrique.",
  "color": "#b4a17f",
  "phrase": "bass",
  "controls": [
   {
    "key": "pickup",
    "name": "Pickup",
    "min": 0.1,
    "max": 0.8,
    "step": 0.01,
    "default": 0.23,
    "unit": "%"
   },
   {
    "key": "brightness",
    "name": "Brightness",
    "min": 500,
    "max": 9000,
    "step": 50,
    "default": 3800,
    "unit": "Hz"
   },
   {
    "key": "damping",
    "name": "Damping",
    "min": 0.1,
    "max": 1,
    "step": 0.01,
    "default": 0.45,
    "unit": "%"
   },
   {
    "key": "attack",
    "name": "Attack",
    "min": 0.002,
    "max": 1,
    "step": 0.002,
    "default": 0.008,
    "unit": "s"
   },
   {
    "key": "release",
    "name": "Release",
    "min": 0.025,
    "max": 3,
    "step": 0.005,
    "default": 0.25,
    "unit": "s"
   },
   {
    "key": "output",
    "name": "Output",
    "min": -24,
    "max": 3,
    "step": 0.5,
    "default": -9,
    "unit": "dB"
   }
  ],
  "presets": [
   {
    "name": "Round Finger",
    "values": {
     "pickup": 0.23,
     "brightness": 2800,
     "damping": 0.55
    }
   },
   {
    "name": "Funk Pick",
    "values": {
     "pickup": 0.48,
     "brightness": 7000,
     "damping": 0.8
    }
   },
   {
    "name": "Deep Neck",
    "values": {
     "pickup": 0.15,
     "brightness": 1200,
     "damping": 0.25
    }
   }
  ]
 },
 {
  "id": "wlabyss",
  "name": "WL ABYSS",
  "subtitle": "SUB / PITCH DROP",
  "family": "Basses",
  "description": "Sub sinusoïdal, chute de hauteur et saturation harmonique.",
  "color": "#aa8dd1",
  "phrase": "bass",
  "controls": [
   {
    "key": "drop",
    "name": "Pitch Drop",
    "min": 0,
    "max": 24,
    "step": 1,
    "default": 12,
    "unit": "st"
   },
   {
    "key": "time",
    "name": "Drop Time",
    "min": 0.01,
    "max": 0.25,
    "step": 0.01,
    "default": 0.07,
    "unit": "s"
   },
   {
    "key": "drive",
    "name": "Drive",
    "min": 0,
    "max": 1,
    "step": 0.01,
    "default": 0.3,
    "unit": "%"
   },
   {
    "key": "attack",
    "name": "Attack",
    "min": 0.002,
    "max": 1,
    "step": 0.002,
    "default": 0.008,
    "unit": "s"
   },
   {
    "key": "release",
    "name": "Release",
    "min": 0.025,
    "max": 3,
    "step": 0.005,
    "default": 0.25,
    "unit": "s"
   },
   {
    "key": "output",
    "name": "Output",
    "min": -24,
    "max": 3,
    "step": 0.5,
    "default": -9,
    "unit": "dB"
   }
  ],
  "presets": [
   {
    "name": "Deep 808",
    "values": {
     "drop": 12,
     "time": 0.07,
     "drive": 0.15
    }
   },
   {
    "name": "Dirty Sub",
    "values": {
     "drop": 5,
     "time": 0.04,
     "drive": 0.85
    }
   },
   {
    "name": "Long Drop",
    "values": {
     "drop": 24,
     "time": 0.2,
     "drive": 0.4
    }
   }
  ]
 },
 {
  "id": "wlimperial",
  "name": "WL IMPERIAL",
  "subtitle": "ORCHESTRAL ENSEMBLE SYNTH",
  "family": "Cordes synthétiques",
  "description": "Ensemble de cordes synthétiques désaccordées et couche de cuivres.",
  "color": "#c6b187",
  "phrase": "pad",
  "controls": [
   {
    "key": "strings",
    "name": "Strings",
    "min": 0,
    "max": 1,
    "step": 0.01,
    "default": 0.75,
    "unit": "%"
   },
   {
    "key": "brass",
    "name": "Brass",
    "min": 0,
    "max": 1,
    "step": 0.01,
    "default": 0.35,
    "unit": "%"
   },
   {
    "key": "width",
    "name": "Width",
    "min": 0,
    "max": 1,
    "step": 0.01,
    "default": 0.7,
    "unit": "%"
   },
   {
    "key": "attack",
    "name": "Attack",
    "min": 0.002,
    "max": 1,
    "step": 0.002,
    "default": 0.22,
    "unit": "s"
   },
   {
    "key": "release",
    "name": "Release",
    "min": 0.025,
    "max": 3,
    "step": 0.005,
    "default": 0.8,
    "unit": "s"
   },
   {
    "key": "output",
    "name": "Output",
    "min": -24,
    "max": 3,
    "step": 0.5,
    "default": -9,
    "unit": "dB"
   }
  ],
  "presets": [
   {
    "name": "Velvet Ensemble",
    "values": {
     "strings": 1,
     "brass": 0.1,
     "attack": 0.3
    }
   },
   {
    "name": "Imperial Brass",
    "values": {
     "strings": 0.2,
     "brass": 1,
     "attack": 0.035
    }
   },
   {
    "name": "Wide Score",
    "values": {
     "strings": 0.8,
     "brass": 0.55,
     "width": 1
    }
   }
  ]
 },
 {
  "id": "wltonewheel",
  "name": "WL TONEWHEEL",
  "subtitle": "ADDITIVE DRAWBAR ORGAN",
  "family": "Pianos & claviers",
  "description": "Orgue additif à cinq tirettes et percussion d'attaque.",
  "color": "#b0a779",
  "phrase": "keys",
  "controls": [
   {
    "key": "sub",
    "name": "16 ft",
    "min": 0,
    "max": 1,
    "step": 0.01,
    "default": 0.25,
    "unit": "%"
   },
   {
    "key": "fundamental",
    "name": "8 ft",
    "min": 0.1,
    "max": 1,
    "step": 0.01,
    "default": 0.8,
    "unit": "%"
   },
   {
    "key": "third",
    "name": "2 2/3 ft",
    "min": 0,
    "max": 1,
    "step": 0.01,
    "default": 0.4,
    "unit": "%"
   },
   {
    "key": "octave",
    "name": "4 ft",
    "min": 0,
    "max": 1,
    "step": 0.01,
    "default": 0.45,
    "unit": "%"
   },
   {
    "key": "high",
    "name": "2 ft",
    "min": 0,
    "max": 1,
    "step": 0.01,
    "default": 0.18,
    "unit": "%"
   },
   {
    "key": "percussion",
    "name": "Percussion",
    "min": 0,
    "max": 1,
    "step": 0.01,
    "default": 0.25,
    "unit": "%"
   },
   {
    "key": "attack",
    "name": "Attack",
    "min": 0.002,
    "max": 1,
    "step": 0.002,
    "default": 0.008,
    "unit": "s"
   },
   {
    "key": "release",
    "name": "Release",
    "min": 0.025,
    "max": 3,
    "step": 0.005,
    "default": 0.25,
    "unit": "s"
   },
   {
    "key": "output",
    "name": "Output",
    "min": -24,
    "max": 3,
    "step": 0.5,
    "default": -9,
    "unit": "dB"
   }
  ],
  "presets": [
   {
    "name": "Soul Drawbars",
    "values": {
     "sub": 0.6,
     "octave": 0.6,
     "third": 0.5
    }
   },
   {
    "name": "Gospel Bright",
    "values": {
     "high": 0.8,
     "third": 0.8,
     "percussion": 0.6
    }
   },
   {
    "name": "Mellow Organ",
    "values": {
     "sub": 0.35,
     "octave": 0.12,
     "third": 0,
     "high": 0
    }
   }
  ]
 },
 {
  "id": "wlmbira",
  "name": "WL MBIRA",
  "subtitle": "MODAL LAMELLOPHONE",
  "family": "Percussions mélodiques",
  "description": "Modèle modal de lames métalliques, avec partiels inharmoniques.",
  "color": "#c9a06f",
  "phrase": "pluck",
  "controls": [
   {
    "key": "metal",
    "name": "Metal",
    "min": 0,
    "max": 1,
    "step": 0.01,
    "default": 0.55,
    "unit": "%"
   },
   {
    "key": "decay",
    "name": "Decay",
    "min": 0.1,
    "max": 2,
    "step": 0.01,
    "default": 0.75,
    "unit": "s"
   },
   {
    "key": "buzz",
    "name": "Buzz",
    "min": 0,
    "max": 1,
    "step": 0.01,
    "default": 0.18,
    "unit": "%"
   },
   {
    "key": "attack",
    "name": "Attack",
    "min": 0.002,
    "max": 1,
    "step": 0.002,
    "default": 0.008,
    "unit": "s"
   },
   {
    "key": "release",
    "name": "Release",
    "min": 0.025,
    "max": 3,
    "step": 0.005,
    "default": 0.25,
    "unit": "s"
   },
   {
    "key": "output",
    "name": "Output",
    "min": -24,
    "max": 3,
    "step": 0.5,
    "default": -9,
    "unit": "dB"
   }
  ],
  "presets": [
   {
    "name": "Warm Tines",
    "values": {
     "metal": 0.25,
     "decay": 0.9,
     "buzz": 0.08
    }
   },
   {
    "name": "Bright Mbira",
    "values": {
     "metal": 0.9,
     "decay": 0.7,
     "buzz": 0.5
    }
   },
   {
    "name": "Short Tines",
    "values": {
     "metal": 0.55,
     "decay": 0.2,
     "buzz": 0.2
    }
   }
  ]
 },
 {
  "id": "wlngoma",
  "name": "WL NGOMA",
  "subtitle": "MODAL HAND DRUM",
  "family": "Percussions",
  "description": "Membrane modale accordée, transitoire de frappe et amortissement.",
  "color": "#bf876e",
  "phrase": "pluck",
  "controls": [
   {
    "key": "skin",
    "name": "Skin",
    "min": 0,
    "max": 1,
    "step": 0.01,
    "default": 0.55,
    "unit": "%"
   },
   {
    "key": "decay",
    "name": "Decay",
    "min": 0.08,
    "max": 1.5,
    "step": 0.01,
    "default": 0.4,
    "unit": "s"
   },
   {
    "key": "strike",
    "name": "Strike",
    "min": 0,
    "max": 1,
    "step": 0.01,
    "default": 0.5,
    "unit": "%"
   },
   {
    "key": "attack",
    "name": "Attack",
    "min": 0.002,
    "max": 1,
    "step": 0.002,
    "default": 0.008,
    "unit": "s"
   },
   {
    "key": "release",
    "name": "Release",
    "min": 0.025,
    "max": 3,
    "step": 0.005,
    "default": 0.25,
    "unit": "s"
   },
   {
    "key": "output",
    "name": "Output",
    "min": -24,
    "max": 3,
    "step": 0.5,
    "default": -9,
    "unit": "dB"
   }
  ],
  "presets": [
   {
    "name": "Deep Hand Drum",
    "values": {
     "skin": 0.2,
     "decay": 0.75,
     "strike": 0.3
    }
   },
   {
    "name": "Slap Skin",
    "values": {
     "skin": 0.9,
     "decay": 0.23,
     "strike": 0.9
    }
   },
   {
    "name": "Dry Pocket",
    "values": {
     "skin": 0.5,
     "decay": 0.15,
     "strike": 0.6
    }
   }
  ]
 },
 {
  "id": "wlkora",
  "name": "WL KORA",
  "subtitle": "PLUCKED HARP MODEL",
  "family": "Cordes pincées",
  "description": "Corde pincée filtrée et résonances sympathiques synthétiques.",
  "color": "#d3ad7b",
  "phrase": "pluck",
  "controls": [
   {
    "key": "pluck",
    "name": "Pluck Position",
    "min": 0.08,
    "max": 0.7,
    "step": 0.01,
    "default": 0.3,
    "unit": "%"
   },
   {
    "key": "resonance",
    "name": "Sympathetic",
    "min": 0,
    "max": 1,
    "step": 0.01,
    "default": 0.4,
    "unit": "%"
   },
   {
    "key": "decay",
    "name": "Decay",
    "min": 0.2,
    "max": 3,
    "step": 0.01,
    "default": 1.3,
    "unit": "s"
   },
   {
    "key": "attack",
    "name": "Attack",
    "min": 0.002,
    "max": 1,
    "step": 0.002,
    "default": 0.008,
    "unit": "s"
   },
   {
    "key": "release",
    "name": "Release",
    "min": 0.025,
    "max": 3,
    "step": 0.005,
    "default": 0.25,
    "unit": "s"
   },
   {
    "key": "output",
    "name": "Output",
    "min": -24,
    "max": 3,
    "step": 0.5,
    "default": -9,
    "unit": "dB"
   }
  ],
  "presets": [
   {
    "name": "Kora Cascade",
    "values": {
     "pluck": 0.25,
     "resonance": 0.55,
     "decay": 1.7
    }
   },
   {
    "name": "Dry Strings",
    "values": {
     "pluck": 0.5,
     "resonance": 0.1,
     "decay": 0.5
    }
   },
   {
    "name": "Golden Harp",
    "values": {
     "pluck": 0.12,
     "resonance": 0.8,
     "decay": 2.4
    }
   }
  ]
 },
 {
  "id": "wlchoir",
  "name": "WL CHOIR",
  "subtitle": "MULTI-VOICE FORMANT ENSEMBLE",
  "family": "Voix synthétique",
  "description": "Ensemble synthétique à trois voix avec deux résonances formantiques.",
  "color": "#c1a7cf",
  "phrase": "pad",
  "controls": [
   {
    "key": "vowel",
    "name": "Vowel A–O",
    "min": 0,
    "max": 1,
    "step": 0.01,
    "default": 0.4,
    "unit": "%"
   },
   {
    "key": "spread",
    "name": "Detune",
    "min": 0,
    "max": 30,
    "step": 1,
    "default": 14,
    "unit": "ct"
   },
   {
    "key": "width",
    "name": "Width",
    "min": 0,
    "max": 1,
    "step": 0.01,
    "default": 0.7,
    "unit": "%"
   },
   {
    "key": "attack",
    "name": "Attack",
    "min": 0.002,
    "max": 1,
    "step": 0.002,
    "default": 0.22,
    "unit": "s"
   },
   {
    "key": "release",
    "name": "Release",
    "min": 0.025,
    "max": 3,
    "step": 0.005,
    "default": 0.8,
    "unit": "s"
   },
   {
    "key": "output",
    "name": "Output",
    "min": -24,
    "max": 3,
    "step": 0.5,
    "default": -9,
    "unit": "dB"
   }
  ],
  "presets": [
   {
    "name": "Ah Ensemble",
    "values": {
     "vowel": 0,
     "spread": 12,
     "width": 0.8
    }
   },
   {
    "name": "Ooh Choir",
    "values": {
     "vowel": 1,
     "spread": 8,
     "width": 0.55
    }
   },
   {
    "name": "Wide Choir",
    "values": {
     "vowel": 0.5,
     "spread": 25,
     "width": 1
    }
   }
  ]
 },
 {
  "id": "wldrift",
  "name": "WL DRIFT",
  "subtitle": "PROCEDURAL GRANULAR CLOUD",
  "family": "Synthétiseurs",
  "description": "Nuage de grains fenêtrés issus d'une table synthétique interne.",
  "color": "#7abebd",
  "phrase": "pad",
  "controls": [
   {
    "key": "grain",
    "name": "Grain Size",
    "min": 0.025,
    "max": 0.2,
    "step": 0.005,
    "default": 0.08,
    "unit": "s"
   },
   {
    "key": "density",
    "name": "Density",
    "min": 8,
    "max": 40,
    "step": 1,
    "default": 20,
    "unit": "Hz"
   },
   {
    "key": "scatter",
    "name": "Scatter",
    "min": 0,
    "max": 1,
    "step": 0.01,
    "default": 0.45,
    "unit": "%"
   },
   {
    "key": "attack",
    "name": "Attack",
    "min": 0.002,
    "max": 1,
    "step": 0.002,
    "default": 0.22,
    "unit": "s"
   },
   {
    "key": "release",
    "name": "Release",
    "min": 0.025,
    "max": 3,
    "step": 0.005,
    "default": 0.8,
    "unit": "s"
   },
   {
    "key": "output",
    "name": "Output",
    "min": -24,
    "max": 3,
    "step": 0.5,
    "default": -9,
    "unit": "dB"
   }
  ],
  "presets": [
   {
    "name": "Floating Dust",
    "values": {
     "grain": 0.12,
     "density": 24,
     "scatter": 0.5
    }
   },
   {
    "name": "Sparse Glass",
    "values": {
     "grain": 0.04,
     "density": 10,
     "scatter": 0.2
    }
   },
   {
    "name": "Storm Cloud",
    "values": {
     "grain": 0.18,
     "density": 40,
     "scatter": 1
    }
   }
  ]
 },
 {
  "id": "wlmatrix",
  "name": "WL MATRIX",
  "subtitle": "TWO-MODULATOR FM",
  "family": "Synthétiseurs",
  "description": "Porteuse sinusoïdale avec deux modulateurs FM indépendants.",
  "color": "#86a9d9",
  "phrase": "keys",
  "controls": [
   {
    "key": "ratioA",
    "name": "Ratio A",
    "min": 0.5,
    "max": 8,
    "step": 0.5,
    "default": 2,
    "unit": ""
   },
   {
    "key": "ratioB",
    "name": "Ratio B",
    "min": 0.5,
    "max": 8,
    "step": 0.5,
    "default": 3,
    "unit": ""
   },
   {
    "key": "indexA",
    "name": "Index A",
    "min": 0,
    "max": 5,
    "step": 0.1,
    "default": 1.4,
    "unit": ""
   },
   {
    "key": "indexB",
    "name": "Index B",
    "min": 0,
    "max": 5,
    "step": 0.1,
    "default": 0.7,
    "unit": ""
   },
   {
    "key": "decay",
    "name": "Mod Decay",
    "min": 0.03,
    "max": 2,
    "step": 0.01,
    "default": 0.35,
    "unit": "s"
   },
   {
    "key": "attack",
    "name": "Attack",
    "min": 0.002,
    "max": 1,
    "step": 0.002,
    "default": 0.008,
    "unit": "s"
   },
   {
    "key": "release",
    "name": "Release",
    "min": 0.025,
    "max": 3,
    "step": 0.005,
    "default": 0.25,
    "unit": "s"
   },
   {
    "key": "output",
    "name": "Output",
    "min": -24,
    "max": 3,
    "step": 0.5,
    "default": -9,
    "unit": "dB"
   }
  ],
  "presets": [
   {
    "name": "FM Glass",
    "values": {
     "ratioA": 2,
     "ratioB": 3,
     "indexA": 1.4,
     "indexB": 0.7
    }
   },
   {
    "name": "Metal Bell",
    "values": {
     "ratioA": 3.5,
     "ratioB": 5,
     "indexA": 3,
     "indexB": 1.2
    }
   },
   {
    "name": "Soft Electric",
    "values": {
     "ratioA": 1,
     "ratioB": 2,
     "indexA": 0.5,
     "indexB": 0.2,
     "decay": 0.8
    }
   }
  ]
 }
];
export const EXPANSION_INSTRUMENTS=Object.fromEntries(entries.map(({id,presets,...definition})=>[id,{...definition,pack:'wlexpansion'}]));
export const EXPANSION_PRESETS=Object.fromEntries(entries.map(({id,presets})=>[id,[...presets,...(TRAP_DRILL_PRESETS[id]||[]),...(AMAPIANO_AFROBEAT_PRESETS[id]||[]),...(RNB_NEO_SOUL_PRESETS[id]||[]),...(FUNK_GOSPEL_PRESETS[id]||[])]]));
export const EXPANSION_PACK={name:'WL EXPANSION',label:'TEN ORIGINAL INSTRUMENTS',color:'#bda587',description:'Basses, organ, modal percussion, plucked strings, ensemble, granular and FM instruments; internally generated audio.',instruments:Object.keys(EXPANSION_INSTRUMENTS),modules:[]};
