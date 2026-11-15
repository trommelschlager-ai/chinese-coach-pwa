import json, subprocess, concurrent.futures, array, math, pathlib
entries=json.load(open('qa/panda-v365/inventory.json'));sources=sorted(set(e['src'] for e in entries))
def check(src):
 p=subprocess.run(['ffmpeg','-v','error','-i',src,'-f','f32le','-ac','1','-ar','16000','-'],capture_output=True,check=True)
 assert not p.stderr, (src,p.stderr.decode())
 samples=array.array('f',p.stdout);assert samples,src
 rms=math.sqrt(sum(x*x for x in samples)/len(samples));peak=max(abs(x) for x in samples)
 assert rms>.001 and peak>.01,(src,rms,peak)
 return dict(src=src,duration=len(samples)/16000,rmsDb=round(20*math.log10(rms),2),peak=round(peak,4))
with concurrent.futures.ThreadPoolExecutor(max_workers=4) as pool: results=list(pool.map(check,sources))
pathlib.Path('qa/panda-v365/decode.json').write_text(json.dumps(results,indent=2)+'\n')
print(f'{len(results)} MP3 decoded entirely, non-silent; duration {sum(x["duration"] for x in results):.1f} sec')
