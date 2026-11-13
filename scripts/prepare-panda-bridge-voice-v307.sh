#!/usr/bin/env bash
set -euo pipefail
src='assets/panda-bridge-voice-v307/source-lv-20261113.mp3'
dir='assets/panda-bridge-voice-v307'
test -s "$src"
mkdir -p "$dir"
# Boundaries from the silence-separated 18.43 s Luvvoice recording.
# Re-encode only to make MP3 boundaries reliable on Android, never change tempo or pitch.
while IFS=' ' read -r clip start end; do
  [[ -z "${clip:-}" ]] && continue
  duration="$(awk -v a="$start" -v b="$end" 'BEGIN { printf "%.3f", b-a }')"
  ffmpeg -nostdin -hide_banner -loglevel error -y -ss "$start" -i "$src" -t "$duration" -map 0:a:0 -vn -c:a libmp3lame -b:a 96k -ac 1 "$dir/$clip.mp3"
  test -s "$dir/$clip.mp3"
  echo "Created $clip.mp3: $(ffprobe -v error -show_entries format=duration -of csv=p=0 "$dir/$clip.mp3")s"
done <<'CLIPS'
B01 0.13 1.84
B02 2.34 3.91
B03 4.36 5.45
B04 5.95 7.05
B05 7.53 8.60
B06 9.08 10.01
B07 10.48 11.54
B08 12.03 12.67
B09 13.12 15.16
B10 15.62 17.85
CLIPS
