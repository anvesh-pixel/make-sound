#!/usr/bin/env node
// Plays a soft ping. Usage: node ping.mjs attention|done
// Debounced so overlapping hooks (e.g. AskUserQuestion + elicitation notification) ping once.
import { spawnSync } from "node:child_process";
import { existsSync, readFileSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const kind = process.argv[2] === "done" ? "done" : "attention";
const dir = dirname(fileURLToPath(import.meta.url));
const wav = join(dir, "sounds", `${kind}.wav`);
const stamp = join(tmpdir(), "make-sound.last-ping");
const DEBOUNCE_MS = 2000;

function play(file) {
  const opts = { stdio: "ignore", windowsHide: true, timeout: 8000 };
  if (process.platform === "win32") {
    const ps = `(New-Object System.Media.SoundPlayer '${file.replace(/'/g, "''")}').PlaySync()`;
    return spawnSync("powershell.exe", ["-NoProfile", "-NonInteractive", "-Command", ps], opts);
  }
  if (process.platform === "darwin") return spawnSync("afplay", [file], opts);
  // Linux: try PulseAudio/PipeWire first, then ALSA
  const r = spawnSync("paplay", [file], opts);
  if (r.error || r.status !== 0) return spawnSync("aplay", ["-q", file], opts);
  return r;
}

try {
  if (!existsSync(wav)) process.exit(0);
  const now = Date.now();
  try {
    const [lastKind, lastAt] = readFileSync(stamp, "utf8").split(" ");
    if (lastKind === kind && now - Number(lastAt) < DEBOUNCE_MS) process.exit(0);
  } catch {}
  writeFileSync(stamp, `${kind} ${now}`);
  play(wav);
} catch {}
process.exit(0); // never fail the hook
