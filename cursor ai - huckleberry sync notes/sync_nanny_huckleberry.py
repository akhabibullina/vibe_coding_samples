#!/usr/bin/env python3
"""Sync nanny activity notes from Apple Notes into Huckleberry."""

from __future__ import annotations

import argparse
import asyncio
import os
import re
import ssl
import subprocess
import sys
import time
import uuid
from dataclasses import dataclass, field
from datetime import date, datetime, timedelta
from html import unescape
from pathlib import Path
from zoneinfo import ZoneInfo

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
    to_firebase_dict,
)

DEFAULT_NOTE_NAME = "Nanny Notes for Huckleberry"
DEFAULT_TIMEZONE = "America/Los_Angeles"
DEFAULT_TOLERANCE_MIN = 12
CONFIG_PATH = Path.home() / ".config" / "huckleberry" / "credentials"

TIME_PATTERN = re.compile(
    r"(?P<hour>\d{1,2})(?::(?P<minute>\d{2}))?\s*(?P<ampm>am|pm)",
    re.IGNORECASE,
)
DATE_PATTERN = re.compile(r"^(\d{1,2})/(\d{1,2})/(\d{2,4})$")
SYNC_MARKER = re.compile(r"^Synced to Huckleberry on ", re.IGNORECASE)


@dataclass
class ParsedDay:
    log_date: date
    sleep: list[dict] = field(default_factory=list)
    bottle: list[dict] = field(default_factory=list)
    breast: list[dict] = field(default_factory=list)
    diaper: list[dict] = field(default_factory=list)


def load_credentials() -> dict[str, str]:
    if CONFIG_PATH.exists():
        values: dict[str, str] = {}
        for line in CONFIG_PATH.read_text().splitlines():
            line = line.strip()
            if not line or line.startswith("#") or "=" not in line:
                continue
            key, value = line.split("=", 1)
            values[key.strip()] = value.strip()
        return values
    return {}


def resolve_settings(args: argparse.Namespace) -> dict[str, str]:
    file_values = load_credentials()
    email = os.environ.get("HUCKLEBERRY_EMAIL") or file_values.get("HUCKLEBERRY_EMAIL")
    password = os.environ.get("HUCKLEBERRY_PASSWORD") or file_values.get("HUCKLEBERRY_PASSWORD")
    timezone = (
        os.environ.get("HUCKLEBERRY_TIMEZONE")
        or file_values.get("HUCKLEBERRY_TIMEZONE")
        or DEFAULT_TIMEZONE
    )
    if not email or not password:
        raise SystemExit(
            "Missing Huckleberry credentials.\n"
            f"Create {CONFIG_PATH} with:\n"
            "  HUCKLEBERRY_EMAIL=your@email.com\n"
            "  HUCKLEBERRY_PASSWORD=your-password\n"
            "  HUCKLEBERRY_TIMEZONE=America/Los_Angeles\n"
            "Or export HUCKLEBERRY_EMAIL and HUCKLEBERRY_PASSWORD."
        )
    return {"email": email, "password": password, "timezone": timezone}


def read_note_body(note_name: str) -> str:
    script = f'''
    tell application "Notes"
        set targetNote to first note whose name is "{note_name}"
        return body of targetNote
    end tell
    '''
    return subprocess.check_output(["osascript", "-e", script], text=True)


def html_to_lines(html: str) -> list[str]:
    text = re.sub(r"(?i)<br\s*/?>", "\n", html)
    text = re.sub(r"<[^>]+>", "", text)
    text = unescape(text)
    lines = [line.strip() for line in text.splitlines()]
    return [line for line in lines if line and not SYNC_MARKER.match(line)]


def parse_note_date(line: str, fallback: date) -> date | None:
    match = DATE_PATTERN.match(line.strip())
    if not match:
        return None
    month, day, year = match.groups()
    year_int = int(year)
    if year_int < 100:
        year_int += 2000
    return date(year_int, int(month), int(day))


def parse_clock_time(raw: str, log_date: date, tz: ZoneInfo) -> datetime:
    match = TIME_PATTERN.search(raw.strip())
    if not match:
        raise ValueError(f"Could not parse time from {raw!r}")
    hour = int(match.group("hour"))
    minute = int(match.group("minute") or "0")
    ampm = match.group("ampm").lower()
    if ampm == "pm" and hour != 12:
        hour += 12
    if ampm == "am" and hour == 12:
        hour = 0
    return datetime(log_date.year, log_date.month, log_date.day, hour, minute, tzinfo=tz)


def parse_range(raw: str, log_date: date, tz: ZoneInfo) -> tuple[datetime, datetime]:
    if "-" not in raw:
        raise ValueError(f"Expected a time range in {raw!r}")
    start_raw, end_raw = raw.split("-", 1)
    start = parse_clock_time(start_raw, log_date, tz)
    end = parse_clock_time(end_raw, log_date, tz)
    if end <= start:
        end += timedelta(days=1)
    return start, end


def infer_diaper_mode(text: str) -> str:
    lowered = text.lower()
    if "both" in lowered or "mixed" in lowered or "poop" in lowered or "poo" in lowered:
        return "both"
    if "pee" in lowered or "wet" in lowered:
        return "pee"
    if "dry" in lowered:
        return "dry"
    return "pee"


def parse_note_lines(lines: list[str], requested_date: date | None, tz: ZoneInfo) -> ParsedDay:
    log_date = requested_date or date.today()
    parsed = ParsedDay(log_date=log_date)
    section = ""

    for line in lines:
        if line.lower() in {"feeds ~", "naps ~", "diaper change~", "diaper change ~"}:
            section = line.lower()
            continue

        note_date = parse_note_date(line, log_date)
        if note_date:
            log_date = note_date
            parsed.log_date = log_date
            continue

        lowered = line.lower()

        sleep_match = re.search(
            r"(?:fell asleep|nap(?:\s+\d+)?|sleep)\s*(?:@|~)?\s*(.+)",
            line,
            re.IGNORECASE,
        )
        if sleep_match and "-" in sleep_match.group(1):
            start, end = parse_range(sleep_match.group(1), log_date, tz)
            parsed.sleep.append({"start": start, "end": end, "notes": line})
            continue

        if section.startswith("naps") and line.startswith("•"):
            body = line.lstrip("•").strip()
            if "-" in body:
                start, end = parse_range(body, log_date, tz)
                parsed.sleep.append({"start": start, "end": end, "notes": body})
            continue

        breast_match = re.search(
            r"breast\s*fed\s*@(?P<time>[^(\n]+)(?:\((?P<notes>[^)]+)\))?",
            line,
            re.IGNORECASE,
        )
        if breast_match:
            start = parse_clock_time(breast_match.group("time"), log_date, tz)
            notes = (breast_match.group("notes") or "").strip()
            parsed.breast.append({"start": start, "notes": notes or line})
            continue

        bottle_match = re.search(
            r"(?<!\bbreast\s)fed\s*@(?P<time>[^(\n]+)(?:\((?P<notes>[^)]+)\))?",
            line,
            re.IGNORECASE,
        )
        if bottle_match and "breast" not in lowered.split("@", 1)[0]:
            start = parse_clock_time(bottle_match.group("time"), log_date, tz)
            notes = (bottle_match.group("notes") or line.split("@", 1)[-1]).strip()
            parsed.bottle.append({"start": start, "notes": notes})
            continue

        if section.startswith("feeds") and line.startswith("•"):
            body = line.lstrip("•").strip()
            if "bottle" in body.lower() or "fed" in body.lower():
                start = parse_clock_time(body, log_date, tz)
                parsed.bottle.append({"start": start, "notes": body})
            continue

        diaper_match = re.search(
            r"diaper(?:\s+change)?\s*@(?P<time>[^(\n]+)(?:\((?P<notes>[^)]+)\))?",
            line,
            re.IGNORECASE,
        )
        if diaper_match:
            start = parse_clock_time(diaper_match.group("time"), log_date, tz)
            notes = (diaper_match.group("notes") or "Diaper change").strip()
            parsed.diaper.append(
                {"start": start, "mode": infer_diaper_mode(line), "notes": notes}
            )
            continue

        if section.startswith("diaper") and line.startswith("•"):
            body = line.lstrip("•").strip()
            if body.lower().startswith("("):
                continue
            start = parse_clock_time(body, log_date, tz)
            parsed.diaper.append(
                {"start": start, "mode": infer_diaper_mode(body), "notes": body}
            )

    if requested_date and parsed.log_date != requested_date:
        raise SystemExit(
            f"Note date {parsed.log_date.isoformat()} does not match requested date "
            f"{requested_date.isoformat()}."
        )

    if not any([parsed.sleep, parsed.bottle, parsed.breast, parsed.diaper]):
        raise SystemExit("No activities found in the nanny note.")

    return parsed


def has_nearby(existing_starts: list[float], target: datetime, tolerance_min: int) -> bool:
    target_ts = target.timestamp()
    return any(abs(start - target_ts) <= tolerance_min * 60 for start in existing_starts)


async def write_sleep(api: HuckleberryAPI, child_uid: str, start: datetime, end: datetime, notes: str) -> None:
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
    print(f"  sleep   {start.strftime('%I:%M %p')} - {end.strftime('%I:%M %p')}  ({notes})")


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
    print(f"  bottle  {start.strftime('%I:%M %p')}  ({notes})")


async def write_breast(api: HuckleberryAPI, child_uid: str, start: datetime, notes: str) -> None:
    client = await api._get_firestore_client()
    feed_ref = client.collection("feed").document(child_uid)
    start_sec = start.timestamp()
    offset = await api._get_timezone_offset_minutes()
    duration = 300 if "quick snack" in notes.lower() else 900
    interval_id = f"{int(start_sec * 1000)}-{uuid.uuid4().hex[:20]}"
    interval = FirebaseBreastFeedIntervalData(
        mode="breast",
        start=start_sec,
        lastSide="left",
        lastUpdated=time.time(),
        leftDuration=duration,
        rightDuration=0,
        offset=offset,
        end_offset=offset,
        notes=notes,
    )
    await feed_ref.collection("intervals").document(interval_id).set(to_firebase_dict(interval))
    print(f"  breast  {start.strftime('%I:%M %p')}  ({notes})")


async def write_diaper(
    api: HuckleberryAPI, child_uid: str, start: datetime, mode: str, notes: str
) -> None:
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
    print(f"  diaper  {start.strftime('%I:%M %p')}  ({notes})")


async def update_prefs(api: HuckleberryAPI, child_uid: str, parsed: ParsedDay) -> None:
    client = await api._get_firestore_client()
    offset = await api._get_timezone_offset_minutes()
    now = time.time()

    if parsed.sleep:
        last = parsed.sleep[-1]
        await client.collection("sleep").document(child_uid).set(
            {
                "prefs": {
                    "lastSleep": to_firebase_dict(
                        FirebaseLastSleepData(
                            start=int(last["start"].timestamp()),
                            duration=int((last["end"] - last["start"]).total_seconds()),
                            offset=offset,
                        )
                    ),
                    "timestamp": {"seconds": now},
                    "local_timestamp": now,
                }
            },
            merge=True,
        )

    if parsed.breast:
        last = parsed.breast[-1]
        await client.collection("feed").document(child_uid).set(
            {
                "prefs": {
                    "lastNursing": to_firebase_dict(
                        FirebaseLastNursingData(
                            mode="breast",
                            start=last["start"].timestamp(),
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
    elif parsed.bottle:
        last = parsed.bottle[-1]
        await client.collection("feed").document(child_uid).set(
            {
                "prefs": {
                    "lastBottle": to_firebase_dict(
                        FirebaseLastBottleData(
                            mode="bottle",
                            start=last["start"].timestamp(),
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

    if parsed.diaper:
        last = parsed.diaper[-1]
        await client.collection("diaper").document(child_uid).set(
            {
                "prefs": {
                    "lastDiaper": to_firebase_dict(
                        FirebaseLastDiaperData(
                            start=last["start"].timestamp(),
                            mode=last["mode"],
                            offset=offset,
                        )
                    ),
                    "timestamp": {"seconds": now},
                    "local_timestamp": now,
                }
            },
            merge=True,
        )


def mark_note_synced(note_name: str, log_date: date, added: int) -> None:
    body = read_note_body(note_name)
    marker_text = (
        f"Synced to Huckleberry on {log_date.strftime('%b')} {log_date.day}, "
        f"{log_date.year} ({added} new entries)"
    )
    marker = f"<div><b>{marker_text}</b></div>"
    if "Synced to Huckleberry on" in body:
        body = re.sub(
            r"<div><b>Synced to Huckleberry on [^<]+</b></div>",
            marker,
            body,
            count=1,
        )
    else:
        body = body + marker

    script = f'''
    tell application "Notes"
        set targetNote to first note whose name is "{note_name}"
        set body of targetNote to {repr(body)}
    end tell
    '''
    subprocess.run(["osascript", "-e", script], check=True)


async def sync(args: argparse.Namespace) -> int:
    settings = resolve_settings(args)
    tz = ZoneInfo(settings["timezone"])
    requested_date = date.fromisoformat(args.date) if args.date else None
    note_html = read_note_body(args.note_name)
    parsed = parse_note_lines(html_to_lines(note_html), requested_date, tz)

    print(f"Date: {parsed.log_date.isoformat()}")
    print(f"Found {len(parsed.sleep)} sleep, {len(parsed.breast)} breast, "
          f"{len(parsed.bottle)} bottle, {len(parsed.diaper)} diaper entries")

    if args.dry_run:
        for label, items in [
            ("sleep", parsed.sleep),
            ("breast", parsed.breast),
            ("bottle", parsed.bottle),
            ("diaper", parsed.diaper),
        ]:
            for item in items:
                if label == "sleep":
                    print(
                        f"  {label:7} {item['start'].strftime('%I:%M %p')} - "
                        f"{item['end'].strftime('%I:%M %p')}  ({item['notes']})"
                    )
                else:
                    print(
                        f"  {label:7} {item['start'].strftime('%I:%M %p')}  "
                        f"({item.get('notes', '')})"
                    )
        print("Dry run only; nothing written.")
        return 0

    ssl_context = ssl.create_default_context(cafile=certifi.where())
    connector = aiohttp.TCPConnector(ssl=ssl_context)
    async with aiohttp.ClientSession(connector=connector) as websession:
        api = HuckleberryAPI(
            email=settings["email"],
            password=settings["password"],
            timezone=settings["timezone"],
            websession=websession,
        )
        await api.authenticate()
        child_uid = (await api.get_user()).childList[0].cid
        child_name = (await api.get_user()).childList[0].nickname or child_uid
        print(f"Authenticated for child: {child_name}")

        day_start = int(datetime.combine(parsed.log_date, datetime.min.time(), tzinfo=tz).timestamp())
        day_end = day_start + 86400
        existing_sleep = await api.list_sleep_intervals(child_uid, day_start, day_end)
        existing_feed = await api.list_feed_intervals(child_uid, day_start, day_end)
        existing_diaper = await api.list_diaper_intervals(child_uid, day_start, day_end)

        sleep_starts = [entry.start for entry in existing_sleep]
        feed_starts = [entry.start for entry in existing_feed]
        diaper_starts = [entry.start for entry in existing_diaper]

        added = 0
        for nap in parsed.sleep:
            if has_nearby(sleep_starts, nap["start"], args.tolerance_min):
                print(f"  skip    sleep near {nap['start'].strftime('%I:%M %p')}")
                continue
            await write_sleep(api, child_uid, nap["start"], nap["end"], nap["notes"])
            added += 1

        for feed in parsed.breast:
            if has_nearby(feed_starts, feed["start"], args.tolerance_min):
                print(f"  skip    breast near {feed['start'].strftime('%I:%M %p')}")
                continue
            await write_breast(api, child_uid, feed["start"], feed["notes"])
            added += 1

        for feed in parsed.bottle:
            if has_nearby(feed_starts, feed["start"], args.tolerance_min):
                print(f"  skip    bottle near {feed['start'].strftime('%I:%M %p')}")
                continue
            await write_bottle(api, child_uid, feed["start"], feed["notes"])
            added += 1

        for diaper in parsed.diaper:
            if has_nearby(diaper_starts, diaper["start"], args.tolerance_min):
                print(f"  skip    diaper near {diaper['start'].strftime('%I:%M %p')}")
                continue
            await write_diaper(api, child_uid, diaper["start"], diaper["mode"], diaper["notes"])
            added += 1

        if added:
            await update_prefs(api, child_uid, parsed)
            if args.mark_synced:
                mark_note_synced(args.note_name, parsed.log_date, added)
            print(f"Done. Added {added} entries to Huckleberry.")
        else:
            print("Nothing new to sync.")

    return 0


def build_parser() -> argparse.ArgumentParser:
    parser = argparse.ArgumentParser(
        description="Sync Apple Notes nanny activity log into Huckleberry."
    )
    parser.add_argument(
        "--date",
        help="Sync a specific date (YYYY-MM-DD). Defaults to the date in the note, or today.",
    )
    parser.add_argument(
        "--note-name",
        default=DEFAULT_NOTE_NAME,
        help=f"Apple Notes page title (default: {DEFAULT_NOTE_NAME}).",
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
        help="Skip entries if Huckleberry already has one within this many minutes.",
    )
    parser.add_argument(
        "--no-mark-synced",
        dest="mark_synced",
        action="store_false",
        help="Do not append a sync marker to the Apple Note.",
    )
    parser.set_defaults(mark_synced=True)
    return parser


def main() -> int:
    parser = build_parser()
    args = parser.parse_args()
    try:
        return asyncio.run(sync(args))
    except subprocess.CalledProcessError as exc:
        print(f"Apple Notes error: {exc}", file=sys.stderr)
        return 1
    except KeyboardInterrupt:
        print("Cancelled.", file=sys.stderr)
        return 130


if __name__ == "__main__":
    raise SystemExit(main())
