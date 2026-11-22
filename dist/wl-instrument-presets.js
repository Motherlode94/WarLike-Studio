import {ROCK_GUITAR_PRESETS} from './rock-metal-presets.js';
// Original editable presets; NOT loaded into demonstration sessions.
export const WL_INSTRUMENT_PRESETS={
 wlsteel:[{name:'Studio Steel',values:{}},{name:'Bright Fingerstyle',values:{brightness:11000,body:.62,decay:1.7}},{name:'Soft Ballad',values:{brightness:4600,body:.7,attack:.012,release:.5}}],
 wlnylon:[{name:'Classic Nylon',values:{}},{name:'Warm Close',values:{brightness:3100,body:.8,attack:.014}},{name:'Gentle Arpeggio',values:{brightness:5400,decay:2.1,release:.4}}],
 wlfolk12:[{name:'Wide Twelve',values:{}},{name:'Jangle',values:{brightness:12000,body:.5,decay:1.9}},{name:'Shimmer Soft',values:{brightness:6900,body:.63,release:.55}}],
 wljazz:[{name:'Hollow Jazz',values:{}},{name:'Round Solo',values:{brightness:2400,body:.72,drive:.04}},{name:'Late Night',values:{brightness:4300,body:.8,decay:2}}],
 wlclean:[{name:'Clean Studio',values:{}},{name:'Bright Rhythm',values:{brightness:13000,body:.45,decay:.6}},{name:'Soft Electric',values:{brightness:5200,body:.74,release:.4}}],
 wlcrunch:[{name:'Edge Crunch',values:{}},{name:'Rock Rhythm',values:{drive:.75,brightness:6600,body:.6}},{name:'Heavy Lead',values:{drive:.95,brightness:4300,decay:1.6}}],
 wlmuted:[{name:'Funk Mute',values:{}},{name:'Afro Chop',values:{brightness:10800,attack:.001,release:.07}},{name:'Tight Pocket',values:{brightness:4800,body:.7,release:.05}}],
 wlrompler:[{name:'Atlas Piano Glow',values:{wave:1,texture:0,layer:.25,cutoff:6000}},{name:'Atlas Pop Layer',values:{wave:2,texture:3,layer:.6,release:.7}},{name:'Atlas Air Pad',values:{wave:1,texture:2,attack:.7,release:3,space:.7}}],
 wlvirtual:[{name:'Vanguard Supersaw',values:{detune:26,cutoff:5400,width:1}},{name:'Vanguard Bass Lead',values:{cutoff:1900,pulse:.6,release:.15}},{name:'Vanguard Soft Pad',values:{detune:10,attack:.35,release:2.6}}],
 wlspectral:[{name:'Nebula Glass',values:{fm:.7,harmonics:.65,cutoff:8800}},{name:'Nebula Dark Atmos',values:{fm:.25,harmonics:.8,attack:1,release:4,cutoff:1800}},{name:'Nebula Bell Motion',values:{fm:.9,harmonics:.35,motion:.7,release:2}}]
};

for(const [id,patches] of Object.entries(ROCK_GUITAR_PRESETS))WL_INSTRUMENT_PRESETS[id].push(...patches);
