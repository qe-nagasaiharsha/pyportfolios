# -*- coding: utf-8 -*-
"""Final attempt for the last few covers via known ISBNs (verified by title)."""
import json, os, re, time, urllib.request, urllib.parse, sys
sys.stdout.reconfigure(encoding="utf-8")
ROOT = r"C:\Users\Yonishwari\Desktop\Projects\pyportfolios\site"
COVERS = os.path.join(ROOT, "public", "covers")
CLEAN = os.path.join(ROOT, "scripts", "books_clean.json")
data = json.load(open(CLEAN, encoding="utf-8"))
UA = {"User-Agent": "pyportfolios-covers/1.0"}

# slug-substring -> (isbn candidates, verify keyword)
TRY = {
    "hilpisch-python-for-algorithmic-trading": (["9781492053354", "1492053354"], "algorithmic trading"),
    "cartea-algorithmic-and-high-frequency-trading": (["9781107091146", "1107091144"], "high-frequency"),
    "kissell-algorithmic-trading-methods": (["9780128156308", "9780128156315"], "algorithmic trading"),
    "strimpel-python-for-algorithmic-trading-cookbook": (["9781835084700"], "cookbook"),
    "andersen-interest-rate-modeling": (["9780984422104", "9780984422111", "9780984422128"], "interest rate"),
}

def get(url, binary=False, timeout=40):
    req = urllib.request.Request(url, headers=UA)
    with urllib.request.urlopen(req, timeout=timeout) as r:
        return r.read() if binary else json.loads(r.read())

def slugify(s):
    return re.sub(r"[^a-z0-9]+", "-", s.lower()).strip("-")[:48]

def parse_slug(c):
    ym = re.search(r"\((\d{4})", c)
    authors_part = c[:ym.start()].strip() if ym else c.split("(")[0]
    rest = c[ym.end():].lstrip(". )").strip() if ym else c
    title_full = re.split(r"\.\s", rest, 1)[0].strip().rstrip(".")
    title_full = re.sub(r"\s*\([^)]*ed\.\)|\s*\(Vols?\.[^)]*\)", "", title_full).strip()
    main = re.split(r"[:—–]", title_full)[0].strip()
    sn = re.sub(r"\b([A-Z]\.)+", "", authors_part.split(",")[0].strip()).strip()
    return slugify((sn or "book") + "-" + main)

fixed = 0
for g in data:
    for b in g["books"]:
        if b["cover"]:
            continue
        slug = parse_slug(b["citation"])
        cfg = None
        for k, v in TRY.items():
            if slug.startswith(k[:30]) or k.startswith(slug[:30]):
                cfg = v; break
        if not cfg:
            print("no-isbn-config for", slug); continue
        isbns, kw = cfg
        done = False
        for isbn in isbns:
            try:
                meta = get(f"https://openlibrary.org/isbn/{isbn}.json")
                title = (meta.get("title", "") + " " + (meta.get("subtitle", "") or "")).lower()
                if kw.lower() not in title:
                    print(f"  {isbn} title mismatch: {title[:50]!r}"); continue
                img = get(f"https://covers.openlibrary.org/b/isbn/{isbn}-L.jpg?default=false", binary=True)
                if len(img) > 1500:
                    fn = slug + ".jpg"
                    open(os.path.join(COVERS, fn), "wb").write(img)
                    b["cover"] = fn; fixed += 1; done = True
                    print(f"FIXED via ISBN {isbn}: {slug} -> {fn}")
                    break
            except Exception as e:
                print(f"  {isbn} err {e}")
            time.sleep(0.6)
        if not done:
            print("STILL MISSING:", slug)
        time.sleep(0.4)

json.dump(data, open(CLEAN, "w", encoding="utf-8"), ensure_ascii=False, indent=2)
got = sum(1 for c in data for b in c["books"] if b["cover"])
tot = sum(len(c["books"]) for c in data)
print(f"\nFINAL: {got}/{tot} covers (+{fixed} this pass)")
