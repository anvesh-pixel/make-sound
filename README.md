# make-sound

Soft, ear-friendly notification pings for [Claude Code](https://claude.com/claude-code):

- **attention**: two quick rising notes (E5 → A5). Plays when Claude needs you: a question, a plan to approve, a permission prompt.
- **done**: one warm bell (G5 over a soft G4) that fades out. Plays when Claude finishes a reply.

Both are quiet (about 22% of full scale), under 1.3 s long, and made from sine waves by a small script, so no third-party audio is involved.

## Requirements

- Node 18+
- Windows: nothing extra (uses `System.Media.SoundPlayer`)
- macOS: nothing extra (uses `afplay`)
- Linux: `paplay` (PulseAudio/PipeWire) or `aplay` (ALSA)

## Install

```bash
git clone https://github.com/anvesh-pixel/make-sound ~/.claude/make-sound
```

Try it:

```bash
node ~/.claude/make-sound/ping.mjs attention
```

```bash
node ~/.claude/make-sound/ping.mjs done
```

Then add the hooks to `~/.claude/settings.json`, merging them with any hooks you already have. Use the absolute path to where you cloned the repo:

```json
{
  "hooks": {
    "PreToolUse": [
      {
        "matcher": "AskUserQuestion|ExitPlanMode",
        "hooks": [
          { "type": "command", "command": "node \"/ABS/PATH/make-sound/ping.mjs\" attention", "timeout": 10, "async": true }
        ]
      }
    ],
    "Notification": [
      {
        "matcher": "permission_prompt|elicitation_dialog",
        "hooks": [
          { "type": "command", "command": "node \"/ABS/PATH/make-sound/ping.mjs\" attention", "timeout": 10, "async": true }
        ]
      }
    ],
    "Stop": [
      {
        "hooks": [
          { "type": "command", "command": "node \"/ABS/PATH/make-sound/ping.mjs\" done", "timeout": 10, "async": true }
        ]
      }
    ]
  }
}
```

Notes:

- `async: true` plays the sound in the background, so Claude never waits for it.
- If the same ping fires twice within 2 s (for example, a question that triggers both a `PreToolUse` and a `Notification` hook), it plays only once.
- The `idle_prompt` notification is left out on purpose. Otherwise you'd hear a second "attention" ping about a minute after every "done" ping. Add it to the `Notification` matcher if you want that reminder.

## Customize

Edit `make-sounds.mjs` to change `PEAK` (loudness) or the notes, then regenerate the sounds:

```bash
node make-sounds.mjs
```

## License

MIT
