"""Package a project/<slug>/ folder into public/downloads/<slug>.zip.

Usage:
    python project/build-zip.py                     # default: brownian-motion
    python project/build-zip.py black-scholes-greeks

Sets a top-level `<slug>/` folder, pulls the canonical notebook from
public/notebooks/<slug>.ipynb, normalises line endings (LF for the shell/python
launchers, CRLF for the .bat), and marks the .command/.sh scripts executable so
they run when double-clicked after unzipping. Re-run after editing any source.
"""
import os
import sys
import zipfile

ROOT = os.path.dirname(os.path.abspath(__file__))              # .../site/project
SLUG = sys.argv[1] if len(sys.argv) > 1 else "brownian-motion"
UNDER = SLUG.replace("-", "_")                                 # script/notebook basename

SRC = os.path.join(ROOT, SLUG)
# the notebook is not duplicated in the project folder — pull the canonical copy
NOTEBOOK_SRC = os.path.abspath(os.path.join(ROOT, "..", "public", "notebooks", f"{SLUG}.ipynb"))
OUT_DIR = os.path.abspath(os.path.join(ROOT, "..", "public", "downloads"))
os.makedirs(OUT_DIR, exist_ok=True)
OUT = os.path.join(OUT_DIR, f"{SLUG}.zip")

TOP = SLUG
FILES = [
    f"{UNDER}.py",
    f"{UNDER}.ipynb",
    "run-macos.command",
    "run-linux.sh",
    "run-windows.bat",
    "README.txt",
]
EXEC_EXT = {".command", ".sh"}

with zipfile.ZipFile(OUT, "w", zipfile.ZIP_DEFLATED) as z:
    for name in FILES:
        ext = os.path.splitext(name)[1]
        src_path = NOTEBOOK_SRC if name == f"{UNDER}.ipynb" else os.path.join(SRC, name)
        data = open(src_path, "rb").read()
        if ext in {".command", ".sh", ".py"}:
            data = data.replace(b"\r\n", b"\n")                 # unix LF
        elif ext == ".bat":
            data = data.replace(b"\r\n", b"\n").replace(b"\n", b"\r\n")  # windows CRLF
        info = zipfile.ZipInfo(f"{TOP}/{name}")
        info.compress_type = zipfile.ZIP_DEFLATED
        mode = 0o755 if ext in EXEC_EXT else 0o644
        info.external_attr = (mode & 0xFFFF) << 16              # unix permission bits
        z.writestr(info, data)

print(f"wrote {OUT}  ({os.path.getsize(OUT) // 1024} KB)")
