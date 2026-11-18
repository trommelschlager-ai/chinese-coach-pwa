import test from 'node:test';
import assert from 'node:assert/strict';
import {spawnSync} from 'node:child_process';
import {estimatePitch, analyseContour} from '../assets/panda-tone-analytics-v457.mjs';

// Audio is generated in memory. These are frequency contours, NOT native Mandarin speech.
const rate = 48000;
const shapes = {
  level: u => 207,
  rise: u => 170 + 83 * u,
  dip: u => u < .54 ? 245 - 92 * u / .54 : 153 + 82 * (u - .54) / .46,
  fall: u => 270 - 102 * u,
};
function pcmFor(shape) {
  const intro = .15, duration = 1.15, outro = .2;
  const n = Math.ceil((intro + duration + outro) * rate);
  const buffer = Buffer.alloc(n * 2);
  let phase = 0;
  for (let i = 0; i < n; i++) {
    const t = i / rate, inside = t >= intro && t <= intro + duration;
    const u = Math.max(0, Math.min(1, (t - intro) / duration));
    phase += 2 * Math.PI * shape(u) / rate;
    const fade = inside ? Math.min(1, (t - intro) / .04, (intro + duration - t) / .04) : 0;
    const value = 0.22 * Math.sin(phase) * Math.max(0, fade);
    buffer.writeInt16LE(Math.round(32767 * value), i * 2);
  }
  return buffer;
}
function ffmpeg(args, input) {
  const r = spawnSync('ffmpeg', ['-nostdin', '-hide_banner', '-loglevel', 'error', ...args], {
    input, maxBuffer: 5 * 1024 * 1024, timeout: 12000
  });
  if (r.error) throw r.error;
  assert.equal(r.status, 0, r.stderr?.toString() || 'ffmpeg exited unexpectedly');
  return r.stdout;
}
function f0Path(pcm) {
  const count = Math.floor(pcm.length / 4);
  const samples = new Float32Array(count);
  for(let i = 0; i < count; i++) samples[i] = pcm.readFloatLE(i * 4);
  const frames = [], size = 4096, hop = 1344;
  for(let offset = 0; offset + size <= count; offset += hop) {
    const result = estimatePitch(samples.subarray(offset, offset + size), rate);
    if(result && result.clarity > .78) frames.push({t: (offset + size/2) / rate, hz: result.hz, clarity: result.clarity});
  }
  return frames;
}
test('MP3 encode/decode followed by microphone-like pitch frames tracks four synthetic contours', () => {
  for(const [expected, curve] of Object.entries(shapes)) {
    const encoded = ffmpeg(
      ['-f','s16le','-ar',String(rate),'-ac','1','-i','pipe:0','-codec:a','libmp3lame','-q:a','4','-f','mp3','pipe:1'],
      pcmFor(curve)
    );
    assert(encoded.length > 1000, 'MP3 bytes for ' + expected);
    const decoded = ffmpeg(
      ['-f','mp3','-i','pipe:0','-f','f32le','-ac','1','-ar',String(rate),'pipe:1'],
      encoded
    );
    const contour = analyseContour(f0Path(decoded));
    assert.equal(contour.kind, expected, `${expected}: ${contour.kind} (${contour.label}), stats ${JSON.stringify(contour.stats)}`);
    assert.equal(contour.isToneGrade, false);
  }
});