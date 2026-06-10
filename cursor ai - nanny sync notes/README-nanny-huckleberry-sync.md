# Nanny Notes → Huckleberry Sync

Sync baby activity notes from Apple Notes into the [Huckleberry](https://huckleberrycare.com/) app at the end of each day. The script reads a nanny log note, parses sleep, feeding, and diaper entries for a given date, and writes only missing entries to Huckleberry (so re-running is safe).

## Files

| File | Purpose |
|------|---------|
| `~/bin/sync-nanny-huckleberry` | Shell wrapper; installs dependencies if needed |
| `~/bin/sync_nanny_huckleberry.py` | Main Python script |
| `~/.config/huckleberry/credentials` | Your Huckleberry login (not committed) |
| `~/.config/huckleberry/credentials.example` | Template for credentials |

## Requirements

- macOS (uses Apple Notes via AppleScript)
- Python 3.10+
- Huckleberry account with at least one child profile
- Network access to Huckleberry’s Firebase backend

Python packages (installed automatically by the wrapper if missing):

- `huckleberry-api`
- `certifi`

## Setup

### 1. Add `~/bin` to your PATH

If needed, add this to `~/.zshrc`:

```bash
export PATH="$HOME/bin:$PATH"
```

### 2. Store Huckleberry credentials

```bash
mkdir -p ~/.config/huckleberry
cp ~/.config/huckleberry/credentials.example ~/.config/huckleberry/credentials
chmod 600 ~/.config/huckleberry/credentials
```

Edit `~/.config/huckleberry/credentials`:

```ini
HUCKLEBERRY_EMAIL=your@email.com
HUCKLEBERRY_PASSWORD=your-password
HUCKLEBERRY_TIMEZONE=America/Los_Angeles
```

Alternatively, export credentials in your shell:

```bash
export HUCKLEBERRY_EMAIL=your@email.com
export HUCKLEBERRY_PASSWORD=your-password
export HUCKLEBERRY_TIMEZONE=America/Los_Angeles
```

Environment variables take precedence over the credentials file.

### 3. Create the Apple Note

Create a note in Apple Notes titled **Nanny Notes for Huckleberry** (or pass a custom name with `--note-name`).

Include a date line and activity lines for that day. See [Note format](#note-format) below.

## Usage

### End-of-day sync (recommended)

Uses the date in the note, or today if no date line is present:

```bash
sync-nanny-huckleberry
```

### Sync a specific date

```bash
sync-nanny-huckleberry --date 2026-06-08
```

If the note contains a different date and you pass `--date`, the script exits with an error to avoid syncing the wrong day.

### Preview without writing

```bash
sync-nanny-huckleberry --dry-run
```

Example output:

```text
Date: 2026-06-08
Found 2 sleep, 4 breast, 1 bottle, 1 diaper entries
  sleep   01:00 PM - 01:44 PM  (Fell asleep @1:00pm - 1:44pm)
  breast  12:09 PM  (quick snack)
  ...
Dry run only; nothing written.
```

### Other options

```bash
sync-nanny-huckleberry --help
```

| Flag | Description |
|------|-------------|
| `--date YYYY-MM-DD` | Sync a specific date |
| `--note-name "Title"` | Apple Notes page title (default: `Nanny Notes for Huckleberry`) |
| `--dry-run` | Parse and print entries only |
| `--tolerance-min N` | Skip if Huckleberry already has an entry within N minutes (default: 12) |
| `--no-mark-synced` | Do not append a sync marker to the Apple Note |

After a successful sync, the script appends a line like **Synced to Huckleberry on Jun 8, 2026 (3 new entries)** to the note.

## Note format

The parser supports two styles. Use one date block per sync.

### Current format (free text)

```text
6/8/26

Diana breast fed @12:09pm(quick snack)
Diana fed @12:46pm finished bottle
Fell asleep @1:00pm - 1:44pm
Diana breast fed @1:50pm(quick snack)
Diaper change @2:23pm
Diana breast fed @2:37pm(quick snack)
Diana breast fed @3:06pm
Fell asleep @3:30pm - 5:05pm
```

### Legacy format (sections)

```text
6/8/26

Feeds ~
•12:50pm bottle fed a little bit
•3:30-3:32pm finished bottle

Naps ~
•1:07-2:20pm
•3:40-4:30pm

Diaper change~
•2:43pm
```

### Supported entry types

| Type | Examples |
|------|----------|
| **Sleep** | `Fell asleep @1:00pm - 1:44pm`, `•1:07-2:20pm` under Naps |
| **Breast** | `Diana breast fed @12:09pm(quick snack)` |
| **Bottle** | `Diana fed @12:46pm finished bottle`, `•12:50pm bottle fed...` |
| **Diaper** | `Diaper change @2:23pm`, `•2:43pm` under Diaper change |

Times accept formats like `1:00pm`, `12:09pm`, and `3:30-5:05pm` ranges.

## How it works

1. Read the Apple Note body via AppleScript.
2. Strip HTML and parse the date plus activity lines.
3. Authenticate with Huckleberry using the unofficial `huckleberry-api` client.
4. Load existing sleep, feed, and diaper entries for that day.
5. Skip any parsed entry that already exists within `--tolerance-min` minutes.
6. Write new intervals to Firestore (same backend as the mobile app).
7. Update Huckleberry “last activity” prefs and optionally mark the note as synced.

Breast entries labeled “quick snack” are logged with a 5-minute duration; other breast entries use 15 minutes when no duration is specified.

## Automate end-of-day sync

### cron (daily at 8:00 PM)

```bash
crontab -e
```

Add:

```cron
0 20 * * * /Users/a0k0edi/bin/sync-nanny-huckleberry >> /tmp/huckleberry-sync.log 2>&1
```

### Shortcuts (manual or scheduled)

Create a macOS Shortcut that runs a Shell Script:

```bash
/Users/a0k0edi/bin/sync-nanny-huckleberry
```

Schedule it in Shortcuts or trigger it from your menu bar.

## Troubleshooting

**Missing credentials**

```text
Missing Huckleberry credentials.
Create ~/.config/huckleberry/credentials with:
```

Create the file as described in [Setup](#2-store-huckleberry-credentials).

**SSL certificate errors**

The wrapper uses `certifi` for TLS. If you still see certificate errors, run:

```bash
/Applications/Python\ 3.*/Install\ Certificates.command
```

**No activities found**

Check that the note title matches `--note-name` and that the note includes a date line (`M/D/YY`) and at least one recognizable activity line.

**Nothing new to sync**

Huckleberry already has entries near the parsed times. Use `--dry-run` to see what would be synced, or lower `--tolerance-min` if you need finer matching.

**Note date mismatch**

When using `--date`, the date in the note must match. Update the note’s date line or omit `--date` to use the note’s date.

## Security

- Keep `~/.config/huckleberry/credentials` mode `600` and do not commit it.
- This tool uses an unofficial reverse-engineered API client, not an official Huckleberry API.
- Credentials are only read locally and sent to Huckleberry’s Firebase auth endpoint during sync.

## Disclaimer

This project is not affiliated with Huckleberry Labs. Use at your own risk.
