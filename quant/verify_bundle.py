"""Spot-check that a shipped bundle carries an EXECUTED notebook."""
import json
import sys
import zipfile
from pathlib import Path

slug = sys.argv[1] if len(sys.argv) > 1 else "mvo-efficient-frontier"
z = zipfile.ZipFile(Path(__file__).resolve().parent.parent / "vault" / "bundles" / f"{slug}.zip")
nb = json.loads(z.read(f"{slug}/{slug}.ipynb"))
code = [c for c in nb["cells"] if c["cell_type"] == "code"]
outs = sum(len(c.get("outputs", [])) for c in code)
imgs = sum(1 for c in code for o in c.get("outputs", []) if "image/png" in o.get("data", {}))
print(f"  cells={len(nb['cells'])}  code={len(code)}  outputs={outs}  embedded charts={imgs}")
print("  files:", [n.split("/")[-1] for n in z.namelist()])
