#!/usr/bin/env bash
set -euo pipefail
source_mp3='assets/hsk1-voices-v156/ca2a36b2097b5a6321a2.mp3'
target_mp3='assets/lesson1-hello-male-v297.mp3'
test -s "$source_mp3"
if ! command -v ffmpeg >/dev/null; then
  sudo apt-get update -qq
  sudo apt-get install -y -qq ffmpeg
fi
# The old file was mapped as a male narrator but sounded too high.
# Keep the original words and rhythm, shift pitch to a fuller male register.
if ffmpeg -hide_banner -filters 2>/dev/null | grep -q rubberband; then
  ffmpeg -nostdin -hide_banner -loglevel error -y -i "$source_mp3" \
    -af 'highpass=f=75,afftdn=nf=-45,rubberband=pitch=0.80:formant=shifted,loudnorm=I=-19:TP=-2:LRA=10' \
    -ar 44100 -ac 1 -codec:a libmp3lame -q:a 3 "$target_mp3"
else
  ffmpeg -nostdin -hide_banner -loglevel error -y -i "$source_mp3" \
    -af 'aresample=44100,highpass=f=75,afftdn=nf=-45,asetrate=35280,aresample=44100,atempo=1.25,loudnorm=I=-19:TP=-2:LRA=10' \
    -ar 44100 -ac 1 -codec:a libmp3lame -q:a 3 "$target_mp3"
fi
python3 - <<'PY'
import pathlib,subprocess
before=pathlib.Path('assets/hsk1-voices-v156/ca2a36b2097b5a6321a2.mp3')
after=pathlib.Path('assets/lesson1-hello-male-v297.mp3')
def duration(path):
    out=subprocess.check_output(['ffprobe','-v','error','-show_entries','format=duration','-of','default=noprint_wrappers=1:nokey=1',str(path)],text=True)
    return float(out.strip())
a,b=duration(before),duration(after)
assert a>0.4 and b>0.4 and abs(a-b)<0.35,(a,b)
assert after.stat().st_size>4500,after.stat().st_size
assert after.read_bytes().startswith((b'ID3',b'\xff\xfb',b'\xff\xf3'))
print('PASS male first-lesson greeting: %.2f -> %.2f s, output %d bytes'%(a,b,after.stat().st_size))
PY
