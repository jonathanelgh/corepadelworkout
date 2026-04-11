#!/usr/bin/env python3
"""Split SQL on statement boundaries into chunks <= max_bytes."""
from __future__ import annotations

import argparse
import re
import sys
from pathlib import Path


def iter_statements(text: str) -> list[str]:
    parts = re.split(r"(;\s*\n)", text)
    out: list[str] = []
    i = 0
    while i < len(parts):
        piece = parts[i]
        sep = parts[i + 1] if i + 1 < len(parts) else ""
        stmt = piece + sep
        i += 2 if sep else 1
        if stmt.strip():
            out.append(stmt)
    return out


def main() -> None:
    ap = argparse.ArgumentParser()
    ap.add_argument("max_bytes", type=int)
    ap.add_argument("files", nargs="+", type=Path)
    ap.add_argument(
        "-o",
        "--out-dir",
        type=Path,
        help="Write chunk-N.sql files instead of stdout",
    )
    args = ap.parse_args()
    max_bytes = args.max_bytes

    all_stmts: list[str] = []
    for path in args.files:
        all_stmts.extend(iter_statements(path.read_text(encoding="utf-8")))

    chunks: list[str] = []
    buf: list[str] = []
    cur = 0
    for stmt in all_stmts:
        enc = len(stmt.encode("utf-8"))
        if cur + enc > max_bytes and buf:
            chunks.append("".join(buf))
            buf = []
            cur = 0
        buf.append(stmt)
        cur += enc
    if buf:
        chunks.append("".join(buf))

    if args.out_dir:
        args.out_dir.mkdir(parents=True, exist_ok=True)
        for i, ch in enumerate(chunks, start=1):
            (args.out_dir / f"chunk_{i:03d}.sql").write_text(ch, encoding="utf-8")
        print(len(chunks), file=sys.stderr)
    else:
        sys.stdout.write("\n-- __CHUNK_BREAK__\n\n".join(chunks))


if __name__ == "__main__":
    main()
