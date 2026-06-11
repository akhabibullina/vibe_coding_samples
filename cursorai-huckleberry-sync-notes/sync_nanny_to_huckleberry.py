#!/usr/bin/env python3
"""Sync nanny notes from Apple Notes into Huckleberry for a given date."""

from __future__ import annotations

import argparse
import asyncio
import json
import os
import re
import ssl
import subprocess
import sys
import time
import uuid
from dataclasses import dataclass, field
from datetime import date, datetime, timedelta
from pathlib import Path

import aiohttp
import certifi
from huckleberry_api import HuckleberryAPI
from huckleberry_api.firebase_types import (
    FirebaseBottleFeedIntervalData,
    FirebaseBreastFeedIntervalData,
    FirebaseDiaperData,
    FirebaseLastBottleData,
    FirebaseLastDiaperData,
    FirebaseLastNursingData,
    FirebaseLastSleepData,
    FirebaseSleepIntervalData,
    to_firebase_dict,
)

NOTE_NAME = "Nanny Notes for Huckleberry"
CONFIG_DIR = Path.home() / ".config" / "huckleberry"
CONFIG_FILE = CONFIG_DIR / "config.json"
DEFAULT_TIMEZONE = "America/Los_Angeles"
DEFAULT_TOLERANCE_MIN = 12

TIME_RE = r"(\d{1,2}:\d{2}\s*(?:am|pm|AM|PM))"
DATE_RE = re.compile(r"^(\d{1,2})/(\d{1,2})/(\d{2,4})$")
SLEEP_RE = re.compile(
    rf"(?i)fell asleep @?\s*{TIME_RE}\s*-\s*{TIME_RE}",
)
BREAST_RE = re.compile(
    rf"(?i)diana breast fed @?\s*{TIME_RE}(?:\(([^)]+)\))?",
)
BOTTLE_RE = re.compile(
    rf"(?i)diana fed @?\s*{TIME_RE}\s*(.*)?$",
)
DIAPER_RE = re.compile(
    rf"(?i)diaper change @?\s*{TIME_RE}",
)


@dataclass
class ParsedDay:
    log_date: date
    sleep: list[dict] = field(default_factory=list)
    breast: list[dict] = field(default_factory=list)
    bottle: list[dict] = field(default_factory=list)
    diaper: list[dict] = field(default_factory=list)


def load_config() -> dict:
    if CONFIG_FILE.exists():
        return json.loads(CONFIG_FILE.read_text())
    return {}


def resolve_credentials(config: dict) -> tuple[str, str, str]:
    email = os.environ.get("HUCKLEBERRY_EMAIL") or config.get("email")
    password = os.environ.get("HUCKLEBERRY_PASSWORD") or config.get("password")
    timezone = os.environ.get("HUCKLEBERRY_TIMEZONE") or config.get("timezone") or DEFAULT_TIMEZONE
    if not email or not password:
        raise SystemExit(
            f"Missing credentials. Set HUCKLEBERRY_EMAIL/HUCKLEBERRY_PASSWORD or create {CONFIG_FILE}."
        )
    return email, password, timezone


def read_note_text() -> str:
    script = f'''
    tell application "Notes"
        set targetNote to first note whose name is "{NOTE_NAME}"
        return plaintext of targetNote
    end tell
    '''
    return subprocess.check_output(["osascript", "-e", script], text=True).strip()


def parse_time(value: str, log_date: date) -> datetime:
    cleaned = value.strip().lower().replace(" ", "")
    parsed = datetime.strptime(f"{log_date.isoformat()} {cleaned}", "%Y-%m-%d %I:%M%p")
    return parsed


def parse_date_line(value: str) -> date | None:
    match = DATE_RE.match(value.strip())
    if not match:
        return None
    month, day, year = match.groups()
    year_num = int(year)
    if year_num < 100:
        year_num += 2000
    return date(year_num, int(month), int(day))


def parse_note(text: str, fallback_date: date | None = None) -> ParsedDay:
    lines = [line.strip() for line in text.splitlines() if line.strip()]
    log_date = fallback_date
    parsed = ParsedDay(log_date=fallback_date or date.today())

    for line in lines:
        if line.lower() == NOTE_NAME.lower():
            continue

        maybe_date = parse_date_line(line)
        if maybe_date:
            parsed.log_date = maybe_date
            continue

        sleep_match = SLEEP_RE.search(line)
        if sleep_match:
            start_raw, end_raw = sleep_match.groups()
            parsed.sleep.append(
                {
                    "start": parse_time(start_raw, parsed.log_date),
                    "end": parse_time(end_raw, parsed.log_date),
                    "notes": line,
                }
            )
            continue

        breast_match = BREAST_RE.search(line)
        if breast_match:
            time_raw, detail = breast_match.groups()
            parsed.breast.append(
                {
                    "start": parse_time(time_raw, parsed.log_date),
                    "notes": (detail or line).strip(),
                }
            )
            continue

        bottle_match = BOTTLE_RE.search(line)
        if bottle_match:
            time_raw, detail = bottle_match.groups()
            parsed.bottle.append(
                {
                    "start": parse_time(time_raw, parsed.log_date),
                    "notes": (detail or line).strip(),
                }
            )
            continue

        diaper_match = DIAPER_RE.search(line)
        if diaper_match:
            time_raw = diaper_match.group(1)
            parsed.diaper.append(
                {
                    "start": parse_time(time_raw, parsed.log_date),
                    "mode": "both",
                    "notes": line,
                }
            )

    if not any([parsed.sleep, parsed.breast, parsed.bottle, parsed.diaper]):
        raise SystemExit("No parseable nanny entries found in the note.")
    return parsed


def has_nearby(existing_starts: list[float], target: datetime, tolerance_min: int) -> bool:
    target_ts = target.timestamp()
    return any(abs(start - target_ts) <= tolerance_min * 60 for start in existing_starts)


async def write_sleep(api: HuckleberryAPI, child_uid: str, start: datetime, end: datetime) -> None:
    client = await api._get_firestore_client()
    sleep_ref = client.collection("sleep").document(child_uid)
    start_sec = int(start.timestamp())
    duration_sec = int((end - start).total_seconds())
    offset = await api._get_timezone_offset_minutes()
    interval_id = f"{int(start.timestamp() * 1000)}-{uuid.uuid4().hex[:20]}"
    interval = FirebaseSleepIntervalData(
        start=start_sec,
        duration=duration_sec,
        offset=offset,
        end_offset=offset,
        lastUpdated=time.time(),
    )
    await sleep_ref.collection("intervals").document(interval_id).set(to_firebase_dict(interval))


async def write_breast(api: HuckleberryAPI, child_uid: str, start: datetime, notes: str) -> None:
    client = await api._get_firestore_client()
    feed_ref = client.collection("feed").document(child_uid)
    start_sec = start.timestamp()
    offset = await api._get_timezone_offset_minutes()
    interval_id = f"{int(start_sec * 1000)}-{uuid.uuid4().hex[:20]}"
    interval = FirebaseBreastFeedIntervalData(
        mode="breast",
        start=start_sec,
        lastSide="left",
        leftDuration=300,
        rightDuration=0,
        offset=offset,
        end_offset=offset,
        lastUpdated=time.time(),
        notes=notes,
    )
    await feed_ref.collection("intervals").document(interval_id).set(to_firebase_dict(interval))


async def write_bottle(api: HuckleberryAPI, child_uid: str, start: datetime, notes: str) -> None:
    client = await api._get_firestore_client()
    feed_ref = client.collection("feed").document(child_uid)
    start_sec = start.timestamp()
    offset = await api._get_timezone_offset_minutes()
    interval_id = f"{int(start_sec * 1000)}-{uuid.uuid4().hex[:20]}"
    interval = FirebaseBottleFeedIntervalData(
        mode="bottle",
        start=start_sec,
        lastUpdated=time.time(),
        bottleType="Breast Milk",
        amount=0,
        units="ml",
        offset=offset,
        end_offset=offset,
        notes=notes,
    )
    await feed_ref.collection("intervals").document(interval_id).set(to_firebase_dict(interval))


async def write_diaper(api: HuckleberryAPI, child_uid: str, start: datetime, mode: str, notes: str) -> None:
    client = await api._get_firestore_client()
    diaper_ref = client.collection("diaper").document(child_uid)
    start_sec = start.timestamp()
    offset = await api._get_timezone_offset_minutes()
    interval_id = f"{int(start_sec * 1000)}-{uuid.uuid4().hex[:20]}"
    interval = FirebaseDiaperData(
        mode=mode,
        start=start_sec,
        lastUpdated=time.time(),
        offset=offset,
        notes=notes,
    )
    await diaper_ref.collection("intervals").document(interval_id).set(to_firebase_dict(interval))


async def update_prefs(api: HuckleberryAPI, child_uid: str, parsed: ParsedDay) -> None:
    client = await api._get_firestore_client()
    offset = await api._get_timezone_offset_minutes()
    now = time.time()

    if parsed.sleep:
        last_sleep = max(parsed.sleep, key=lambda item: item["start"])
        await client.collection("sleep").document(child_uid).set(
            {
                "prefs": {
                    "lastSleep": to_firebase_dict(
                        FirebaseLastSleepData(
                            start=int(last_sleep["start"].timestamp()),
                            duration=int((last_sleep["end"] - last_sleep["start"]).total_seconds()),
                            offset=offset,
                        )
                    ),
                    "timestamp": {"seconds": now},
                    "local_timestamp": now,
                }
            },
            merge=True,
        )

    if parsed.bottle:
        last_bottle = max(parsed.bottle, key=lambda item: item["start"])
        await client.collection("feed").document(child_uid).set(
            {
                "prefs": {
                    "lastBottle": to_firebase_dict(
                        FirebaseLastBottleData(
                            mode="bottle",
                            start=last_bottle["start"].timestamp(),
                            bottleType="Breast Milk",
                            bottleAmount=0,
                            bottleUnits="ml",
                            offset=offset,
                        )
                    ),
                    "timestamp": {"seconds": now},
                    "local_timestamp": now,
                }
            },
            merge=True,
        )
    elif parsed.breast:
        last_breast = max(parsed.breast, key=lambda item: item["start"])
        await client.collection("feed").document(child_uid).set(
            {
                "prefs": {
                    "lastNursing": to_firebase_dict(
                        FirebaseLastNursingData(
                            mode="breast",
                            start=last_breast["start"].timestamp(),
                            duration=300,
                            leftDuration=300,
                            rightDuration=0,
                            offset=offset,
                        )
                    ),
                    "timestamp": {"seconds": now},
                    "local_timestamp": now,
                }
            },
            merge=True,
        )

    if parsed.diaper:
        last_diaper = max(parsed.diaper, key=lambda item: item["start"])
        await client.collection("diaper").document(child_uid).set(
            {
                "prefs": {
                    "lastDiaper": to_firebase_dict(
                        FirebaseLastDiaperData(
                            start=last_diaper["start"].timestamp(),
                            mode=last_diaper["mode"],
                            offset=offset,
                        )
                    ),
                    "timestamp": {"seconds": now},
                    "local_timestamp": now,
                }
            },
            merge=True,
        )


def format_entry(kind: str, start: datetime, end: datetime | None = None, notes: str = "") -> str:
    if end:
        return f"{kind}: {start.strftime('%I:%M %p')} - {end.strftime('%I:%M %p')} {notes}".strip()
    return f"{kind}: {start.strftime('%I:%M %p')} {notes}".strip()


async def sync(parsed: ParsedDay, email: str, password: str, timezone: str, dry_run: bool, tolerance_min: int) -> int:
    print(f"Syncing nanny notes for {parsed.log_date.isoformat()}")

    if dry_run:
        for item in parsed.sleep:
            print("DRY RUN " + format_entry("sleep", item["start"], item["end"], item["notes"]))
        for item in parsed.breast:
            print("DRY RUN " + format_entry("breast", item["start"], notes=item["notes"]))
        for item in parsed.bottle:
            print("DRY RUN " + format_entry("bottle", item["start"], notes=item["notes"]))
        for item in parsed.diaper:
            print("DRY RUN " + format_entry("diaper", item["start"], notes=item["notes"]))
        return 0

    ssl_context = ssl.create_default_context(cafile=certifi.where())
    connector = aiohttp.TCPConnector(ssl=ssl_context)
    async with aiohttp.ClientSession(connector=connector) as websession:
        api = HuckleberryAPI(email=email, password=password, timezone=timezone, websession=websession)
        await api.authenticate()
        user_doc = await api.get_user()
        child_uid = user_doc.childList[0].cid
        child_name = user_doc.childList[0].nickname or child_uid
        print(f"Authenticated. Target child: {child_name}")

        day_start = int(datetime.combine(parsed.log_date, datetime.min.time()).timestamp())
        day_end = day_start + 86400
        existing_sleep = await api.list_sleep_intervals(child_uid, day_start, day_end)
        existing_feed = await api.list_feed_intervals(child_uid, day_start, day_end)
        existing_diaper = await api.list_diaper_intervals(child_uid, day_start, day_end)

        sleep_starts = [entry.start for entry in existing_sleep]
        feed_starts = [entry.start for entry in existing_feed]
        diaper_starts = [entry.start for entry in existing_diaper]

        added = 0
        for item in parsed.sleep:
            if has_nearby(sleep_starts, item["start"], tolerance_min):
                print(f"Skipping sleep near {item['start'].strftime('%I:%M %p')} (already logged)")
                continue
            await write_sleep(api, child_uid, item["start"], item["end"])
            print("Logged " + format_entry("sleep", item["start"], item["end"], item["notes"]))
            added += 1

        for item in parsed.breast:
            if has_nearby(feed_starts, item["start"], tolerance_min):
                print(f"Skipping breast feed near {item['start'].strftime('%I:%M %p')} (already logged)")
                continue
            await write_breast(api, child_uid, item["start"], item["notes"])
            print("Logged " + format_entry("breast", item["start"], notes=item["notes"]))
            added += 1

        for item in parsed.bottle:
            if has_nearby(feed_starts, item["start"], tolerance_min):
                print(f"Skipping bottle near {item['start'].strftime('%I:%M %p')} (already logged)")
                continue
            await write_bottle(api, child_uid, item["start"], item["notes"])
            print("Logged " + format_entry("bottle", item["start"], notes=item["notes"]))
            added += 1

        for item in parsed.diaper:
            if has_nearby(diaper_starts, item["start"], tolerance_min):
                print(f"Skipping diaper near {item['start'].strftime('%I:%M %p')} (already logged)")
                continue
            await write_diaper(api, child_uid, item["start"], item["mode"], item["notes"])
            print("Logged " + format_entry("diaper", item["start"], notes=item["notes"]))
            added += 1

        if added:
            await update_prefs(api, child_uid, parsed)
            print(f"Sync complete. Added {added} entries to Huckleberry.")
        else:
            print("Nothing new to sync; Huckleberry already has matching entries for this date.")
        return added


def build_arg_parser() -> argparse.ArgumentParser:
    parser = argparse.ArgumentParser(description="Sync nanny notes from Apple Notes into Huckleberry.")
    parser.add_argument(
        "--date",
        help="Date to sync in YYYY-MM-DD format. Defaults to the date in the note, or today.",
    )
    parser.add_argument(
        "--dry-run",
        action="store_true",
        help="Parse and print entries without writing to Huckleberry.",
    )
    parser.add_argument(
        "--tolerance-min",
        type=int,
        default=DEFAULT_TOLERANCE_MIN,
        help=f"Skip entries if one already exists within this many minutes (default: {DEFAULT_TOLERANCE_MIN}).",
    )
    return parser


def main() -> int:
    args = build_arg_parser().parse_args()
    config = load_config()

    note_text = read_note_text()
    fallback_date = date.fromisoformat(args.date) if args.date else date.today()
    parsed = parse_note(note_text, fallback_date=fallback_date)

    if args.date:
        parsed.log_date = date.fromisoformat(args.date)

    if args.dry_run:
        return asyncio.run(
            sync(
                parsed=parsed,
                email="",
                password="",
                timezone=config.get("timezone") or DEFAULT_TIMEZONE,
                dry_run=True,
                tolerance_min=args.tolerance_min,
            )
        )

    email, password, timezone = resolve_credentials(config)
    return asyncio.run(
        sync(
            parsed=parsed,
            email=email,
            password=password,
            timezone=timezone,
            dry_run=False,
            tolerance_min=args.tolerance_min,
        )
    )


if __name__ == "__main__":
    sys.exit(main())
