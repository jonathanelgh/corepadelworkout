#!/usr/bin/env python3
"""Print compact JSON lines for user-supabase execute_sql (project_id + query)."""
from __future__ import annotations

import json
import sys
from pathlib import Path


def main() -> None:
    out_dir = Path(__file__).resolve().parent / "_tax_mcp_payloads"
    if not out_dir.is_dir():
        print("Missing", out_dir, file=sys.stderr)
        sys.exit(1)
    for p in sorted(out_dir.glob("payload_*.json")):
        d = json.loads(p.read_text(encoding="utf-8"))
        sys.stdout.write(json.dumps(d, separators=(",", ":")) + "\n")


if __name__ == "__main__":
    main()
