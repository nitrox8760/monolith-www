import json
import re
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
paths = list((ROOT / "guides").glob("*.html")) + list((ROOT / "resources").glob("*.html"))
for path in paths:
    text = path.read_text(encoding="utf-8")
    match = re.search(r'application/ld\+json">\s*(\{.*?\})\s*</script>', text, re.S)
    if not match:
        print("skip (no json-ld):", path.name)
        continue
    json.loads(match.group(1))
    print("ok:", path.name)
