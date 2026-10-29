"""Reproduce the curated CC0 bank. Maintainer tool: Python/numpy + ffmpeg.
Original WAVs are cached outside the repository; only compressed MP3s ship.
"""
import argparse, concurrent.futures, hashlib, json, subprocess, urllib.parse, urllib.request
from pathlib import Path
import numpy as np
from scipy.signal import find_peaks

p=argparse.ArgumentParser();p.add_argument('--plan',required=True);p.add_argument('--cache',required=True);p.add_argument('--download-only',action='store_true');args=p.parse_args()
root=Path(__file__).resolve().parents[1];cache=Path(args.cache);cache.mkdir(parents=True,exist_ok=True)
banks=json.loads(Path(args.plan).read_text());jobs=[(b,s) for b in banks for s in b['samples']]
def original(b,s):return cache/(b['id']+'-'+s['sourceSha']+'.wav')
def download(job):
 b,s=job;target=original(b,s)
 if not target.exists():
  url='https://raw.githubusercontent.com/'+b['repo']+'/'+b['revision']+'/'+urllib.parse.quote(s['sourcePath'],safe='/')
  with urllib.request.urlopen(url,timeout=60) as r:data=r.read()
  sha=hashlib.sha1(b'blob '+str(len(data)).encode()+b'\0'+data).hexdigest()
  if sha!=s['sourceSha']:raise ValueError('Source hash mismatch: '+s['sourcePath'])
  target.write_bytes(data)
 return b['id']
with concurrent.futures.ThreadPoolExecutor(max_workers=6) as ex:
 for i,_ in enumerate(ex.map(download,jobs),1):
  if i%10==0 or i==len(jobs):print('Downloaded',i,'/',len(jobs),flush=True)
if args.download_only:raise SystemExit(0)

def decode(b,s):
 raw=subprocess.check_output(['ffmpeg','-v','error','-i',str(original(b,s)),'-f','f32le','-ar','44100','-ac','2','-'])
 return np.frombuffer(raw,dtype='<f4').reshape(-1,2).copy()
for b in banks:
 s=min(b['samples'],key=lambda s:abs(s['rawMidi']-60));data=decode(b,s)[6000:40000].mean(axis=1).astype(float);data-=data.mean();n=len(data)
 spec=np.fft.rfft(data,n*2);ac=np.fft.irfft(abs(spec)**2,n*2)[:n];peaks,_=find_peaks(ac[15:1500]);peaks+=15
 lag=max(peaks,key=lambda i:ac[i]);hz=44100/lag;midi=69+12*np.log2(hz/440)
 print('Pitch reference',b['id'],s['sourcePath'].split('/')[-1],'raw',s['rawMidi'],'measured',round(midi,2),'offset',b['offset'],flush=True)
 if b['offset'] is None:
  delta=round((midi-s['rawMidi'])/12)*12
  if abs(midi-s['rawMidi']-delta)>.6:raise ValueError('Check pitch manually: '+b['id'])
  b['offset']=delta

def convert(job):
 b,s=job;data=decode(b,s);peak=float(abs(data).max());active=np.flatnonzero(np.max(abs(data),axis=1)>peak*.0007)
 start=max(0,min(int(active[0])-80,22050));end=min(len(data),int(active[-1])+3000);data=data[start:end]
 seconds=10 if b['id']=='piano' else 8 if not b['loop'] else 5.5;data=data[:int(seconds*44100)]
 data*=.8/max(peak,1e-7)
 loopStart=loopEnd=None
 if b['loop'] and len(data)>2*44100:
  n=4410;a=35280;z=min(len(data)-6615,171990);mix=np.linspace(0,1,n)[:,None]
  data[z-n:z]=data[z-n:z]*(1-mix)+data[a:a+n]*mix
  loopStart=(a+n)/44100;loopEnd=z/44100
 n=min(4410,len(data)//4);data[-n:]*=np.linspace(1,0,n)[:,None]
 out=root/'dist'/'samples'/s['file'];out.parent.mkdir(parents=True,exist_ok=True)
 subprocess.run(['ffmpeg','-v','error','-y','-f','f32le','-ar','44100','-ac','2','-i','-','-map_metadata','-1','-c:a','libmp3lame','-q:a','5',str(out)],input=data.astype('<f4').tobytes(),check=True)
 return b['id'],{'root':s['rawMidi']+b['offset'],'layer':s['layer'],'file':s['file'],'duration':round(len(data)/44100,4),'bytes':out.stat().st_size,**({'loopStart':loopStart,'loopEnd':loopEnd} if loopStart else {})}
maps={b['id']:[] for b in banks}
with concurrent.futures.ThreadPoolExecutor(max_workers=4) as ex:
 for i,(key,value) in enumerate(ex.map(convert,jobs),1):
  maps[key].append(value)
  if i%10==0 or i==len(jobs):print('Converted',i,'/',len(jobs),flush=True)
manifest={}
for b in banks:
 rows=maps[b['id']];manifest[b['id']]={'samples':rows,'bytes':sum(x['bytes'] for x in rows),'layers':max(x['layer'] for x in rows)+1,'range':[min(x['root'] for x in rows),max(x['root'] for x in rows)],'loop':b['loop']}
(root/'dist'/'acoustic-manifest.js').write_text('export const ACOUSTIC_BANKS='+json.dumps(manifest,separators=(',',':'))+';\n')
(root/'dist'/'samples'/'sources.json').write_text(json.dumps(banks,indent=2))
print('Complete:',len(jobs),'recordings,',sum(b['bytes'] for b in manifest.values()),'bytes',flush=True)
