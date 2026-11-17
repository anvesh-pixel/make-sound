// Generates the two soft notification pings as 16-bit mono WAVs.
// Re-run after tweaking: node make-sounds.mjs  (writes into ./sounds)
import { writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const DIR = join(dirname(fileURLToPath(import.meta.url)), "sounds");
const SR = 44100;
const PEAK = 0.22; // overall loudness (0..1). Keep it gentle.

// One bell-ish note: fundamental + quiet partials, soft attack, exponential decay.
function note(buf, startSec, freq, durSec, gain = 1, decay = 4.5) {
  const start = Math.floor(startSec * SR);
  const len = Math.floor(durSec * SR);
  const attack = Math.floor(0.012 * SR);
  for (let i = 0; i < len && start + i < buf.length; i++) {
    const t = i / SR;
    const env = (i < attack ? i / attack : 1) * Math.exp(-decay * t);
    const s =
      Math.sin(2 * Math.PI * freq * t) +
      0.18 * Math.sin(2 * Math.PI * freq * 2 * t) * Math.exp(-3 * t) +
      0.06 * Math.sin(2 * Math.PI * freq * 3 * t) * Math.exp(-6 * t);
    buf[start + i] += s * env * gain;
  }
}

function writeWav(name, buf) {
  let max = 0;
  for (const v of buf) max = Math.max(max, Math.abs(v));
  const scale = (PEAK / (max || 1)) * 32767;
  // short fade-out on the last 30ms to avoid clicks
  const fade = Math.floor(0.03 * SR);
  const data = Buffer.alloc(buf.length * 2);
  for (let i = 0; i < buf.length; i++) {
    const f = i > buf.length - fade ? (buf.length - i) / fade : 1;
    data.writeInt16LE(Math.round(buf[i] * scale * f), i * 2);
  }
  const h = Buffer.alloc(44);
  h.write("RIFF", 0); h.writeUInt32LE(36 + data.length, 4); h.write("WAVE", 8);
  h.write("fmt ", 12); h.writeUInt32LE(16, 16); h.writeUInt16LE(1, 20); h.writeUInt16LE(1, 22);
  h.writeUInt32LE(SR, 24); h.writeUInt32LE(SR * 2, 28); h.writeUInt16LE(2, 32); h.writeUInt16LE(16, 34);
  h.write("data", 36); h.writeUInt32LE(data.length, 40);
  writeFileSync(join(DIR, name), Buffer.concat([h, data]));
}

// "Needs you": two quick rising notes (E5 -> A5), a gentle "hey?"
{
  const buf = new Float64Array(Math.floor(1.1 * SR));
  note(buf, 0.0, 659.25, 0.9, 0.8, 5);
  note(buf, 0.13, 880.0, 1.0, 1.0, 4);
  writeWav("attention.wav", buf);
}

// "Done": single warm, lower bell (G5 with a soft octave-below body), settles down
{
  const buf = new Float64Array(Math.floor(1.3 * SR));
  note(buf, 0.0, 783.99, 1.3, 1.0, 3.2);
  note(buf, 0.0, 392.0, 1.3, 0.35, 3.5);
  writeWav("done.wav", buf);
}

console.log("wrote attention.wav and done.wav to", DIR);
