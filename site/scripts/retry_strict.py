# -*- coding: utf-8 -*-
"""Targeted strict retry for books still missing a cover, using the CLEAN title
already stored in books_clean.json (avoids citation-parse glitches). Author+title
verified, same as fetch_covers_v2."""
import json, re, os, time, unicodedata, urllib.request, urllib.parse, sys
sys.stdout.reconfigure(encoding="utf-8")
ROOT = r"C:\Users\Yonishwari\Desktop\Projects\pyportfolios\site"
COVERS = os.path.join(ROOT, "public", "covers")
CLEAN = os.path.join(ROOT, "scripts", "books_clean.json")
data = json.load(open(CLEAN, encoding="utf-8"))
UA = {"User-Agent": "pyportfolios-covers/1.0"}

def norm(s):
    s = unicodedata.normalize("NFKD", s or "").encode("ascii", "ignore").decode()
    return re.sub(r"[^a-z0-9]+", "", s.lower())

def get(url, binary=False, tries=3, timeout=45):
    last = None
    for _ in range(tries):
        try:
            with urllib.request.urlopen(urllib.request.Request(url, headers=UA), timeout=timeout) as r:
                return r.read() if binary else json.loads(r.read())
        except Exception as e:
            last = e; time.sleep(2)
    raise last

def slugify(s): return re.sub(r"[^a-z0-9]+", "-", s.lower()).strip("-")[:48]

def title_ok(our_main, matched):
    mt = norm(matched)
    toks = [norm(t) for t in re.split(r"[^a-z0-9]+", our_main.lower()) if len(t) >= 4] or \
           [norm(t) for t in re.split(r"[^a-z0-9]+", our_main.lower()) if norm(t)]
    return bool(toks) and all(t in mt for t in toks)

fixed = 0
for g in data:
    for b in g["books"]:
        if b["cover"]:
            continue
        main = re.split(r"[:—–]", b["title"])[0].strip()
        surname = re.split(r"\s*&\s*|,\s*", b["author"])[0].strip()
        nsur = norm(surname)
        cid = None; matched = None
        for params in ({"title": main, "author": surname, "limit": 12,
                        "fields": "title,author_name,cover_i,first_publish_year,edition_count"},
                       {"q": f"{main} {surname}", "limit": 12,
                        "fields": "title,author_name,cover_i,first_publish_year,edition_count"}):
            url = "https://openlibrary.org/search.json?" + urllib.parse.urlencode(params)
            try: docs = get(url).get("docs", [])
            except Exception: docs = []
            cands = []
            for d in docs:
                if not d.get("cover_i"): continue
                auths = [norm(a) for a in (d.get("author_name") or [])]
                if not any(nsur in a or a in nsur for a in auths): continue
                if not title_ok(main, d.get("title") or ""): continue
                cands.append(d)
            if cands:
                cands.sort(key=lambda d: min(d.get("edition_count", 0), 60), reverse=True)
                cid = cands[0]["cover_i"]; matched = f"{cands[0].get('title')} / {(cands[0].get('author_name') or [''])[0]}"
                break
            time.sleep(0.4)
        if cid:
            try:
                img = get(f"https://covers.openlibrary.org/b/id/{cid}-L.jpg", binary=True)
                if len(img) > 1500:
                    fn = slugify(surname + "-" + main) + ".jpg"
                    open(os.path.join(COVERS, fn), "wb").write(img)
                    b["cover"] = fn; fixed += 1
                    print(f"FIXED: {surname} | {main} -> {fn}  ({matched})")
            except Exception as e:
                print("dl-err", e)
        if not b["cover"]:
            print(f"still fallback: {surname} | {main}")
        time.sleep(0.4)

json.dump(data, open(CLEAN, "w", encoding="utf-8"), ensure_ascii=False, indent=2)
got = sum(1 for c in data for b in c["books"] if b["cover"])
print(f"\nNOW: {got}/{sum(len(g['books']) for g in data)} covers (+{fixed})")
