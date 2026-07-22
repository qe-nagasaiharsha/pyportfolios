# -*- coding: utf-8 -*-
"""Strict cover fetch: only accept an Open Library cover whose author actually
matches our book (accent/punct-normalized). No author match -> no cover (the UI
falls back to a designed typographic cover). Prints an audit line per book."""
import json, re, os, time, unicodedata, urllib.request, urllib.parse, sys
sys.stdout.reconfigure(encoding="utf-8")
ROOT = r"C:\Users\Yonishwari\Desktop\Projects\pyportfolios\site"
COVERS = os.path.join(ROOT, "public", "covers")
CLEAN = os.path.join(ROOT, "scripts", "books_clean.json")
data = json.load(open(CLEAN, encoding="utf-8"))
UA = {"User-Agent": "pyportfolios-covers/1.0 (educational)"}

def norm(s):
    s = unicodedata.normalize("NFKD", s or "").encode("ascii", "ignore").decode()
    return re.sub(r"[^a-z0-9]+", "", s.lower())

def get(url, binary=False, tries=3, timeout=45):
    last = None
    for _ in range(tries):
        try:
            req = urllib.request.Request(url, headers=UA)
            with urllib.request.urlopen(req, timeout=timeout) as r:
                return r.read() if binary else json.loads(r.read())
        except Exception as e:
            last = e; time.sleep(2)
    raise last

def slugify(s):
    return re.sub(r"[^a-z0-9]+", "-", s.lower()).strip("-")[:48]

def parse(c):
    ym = re.search(r"\((\d{4})", c)
    year = int(ym.group(1)) if ym else None
    authors_part = (c[:ym.start()] if ym else c.split("(")[0]).strip()
    rest = (c[ym.end():] if ym else c).lstrip(". )").strip()
    title_full = re.split(r"\.\s", rest, 1)[0].strip().rstrip(".")
    title_full = re.sub(r"\s*\([^)]*ed\.?\)?|\s*\(Vols?\.[^)]*\)?", "", title_full).strip()
    main = re.split(r"[:—–]", title_full)[0].strip()
    authors_part = re.sub(r"&\s*the .*$", "", authors_part)
    chunks = re.split(r",\s*&\s*|\s*&\s*|;\s*", authors_part)
    surnames = []
    for ch in chunks:
        sn = re.sub(r"\b([A-Z]\.)+", "", ch.split(",")[0]).strip()
        if sn and norm(sn) and norm(sn) not in ("goldmansachs",):
            surnames.append(sn)
    return main, surnames, year

def title_ok(our_main, matched_title):
    mt = norm(matched_title)
    toks = [norm(t) for t in re.split(r"[^a-z0-9]+", our_main.lower()) if len(t) >= 4]
    toks = [t for t in toks if t]
    if not toks:
        toks = [norm(t) for t in re.split(r"[^a-z0-9]+", our_main.lower()) if norm(t)]
    return bool(toks) and all(t in mt for t in toks)

def find_strict(title, surnames, year):
    nsur = [norm(s) for s in surnames if norm(s)]
    if not nsur:
        return None, None
    queries = [
        {"title": title, "author": surnames[0], "limit": 12,
         "fields": "title,author_name,cover_i,first_publish_year,edition_count"},
        {"q": f"{title} {surnames[0]}", "limit": 12,
         "fields": "title,author_name,cover_i,first_publish_year,edition_count"},
    ]
    cand = []
    for params in queries:
        url = "https://openlibrary.org/search.json?" + urllib.parse.urlencode(params)
        try:
            docs = get(url).get("docs", [])
        except Exception:
            docs = []
        for d in docs:
            if not d.get("cover_i"):
                continue
            auths = [norm(a) for a in (d.get("author_name") or [])]
            if not any(any(s in a or a in s for a in auths) for s in nsur):
                continue  # author must match
            if not title_ok(title, d.get("title") or ""):
                continue  # title tokens must match too
            cand.append(d)
        if cand:
            break
        time.sleep(0.4)
    if not cand:
        return None, None
    def sc(d):
        s = 0
        if year and d.get("first_publish_year"):
            s -= abs(d["first_publish_year"] - year) * 0.6
        s += min(d.get("edition_count", 0), 60) * 0.2
        return s
    cand.sort(key=sc, reverse=True)
    best = cand[0]
    return best["cover_i"], f"{best.get('title')} / {', '.join(best.get('author_name') or [])[:60]}"

# wipe old covers to avoid stale wrong files
for f in os.listdir(COVERS):
    if f.endswith(".jpg"):
        os.remove(os.path.join(COVERS, f))

got = 0
for g in data:
    for b in g["books"]:
        title, surnames, year = parse(b["citation"])
        slug = slugify((surnames[0] if surnames else "book") + "-" + title)
        b["cover"] = None
        cid, matched = find_strict(title, surnames, year)
        if cid:
            try:
                img = get(f"https://covers.openlibrary.org/b/id/{cid}-L.jpg", binary=True)
                if len(img) > 1500:
                    fn = slug + ".jpg"
                    open(os.path.join(COVERS, fn), "wb").write(img)
                    b["cover"] = fn; got += 1
            except Exception:
                pass
        tag = "OK " if b["cover"] else "-- "
        print(f"{tag}{(surnames[0] if surnames else '?')[:14]:14} | {title[:34]:34} | {matched or 'NO AUTHOR MATCH'}")
        time.sleep(0.4)

json.dump(data, open(CLEAN, "w", encoding="utf-8"), ensure_ascii=False, indent=2)
print(f"\nSTRICT COVERS: {got}/{sum(len(g['books']) for g in data)}")
