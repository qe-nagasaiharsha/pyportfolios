# -*- coding: utf-8 -*-
"""Retry covers for books still missing one in books_clean.json.
Tries Open Library (author+title, then title-only, then general q), then
Google Books as a fallback. Updates books_clean.json in place."""
import json, re, os, time, urllib.request, urllib.parse, sys
sys.stdout.reconfigure(encoding="utf-8")
ROOT = r"C:\Users\Yonishwari\Desktop\Projects\pyportfolios\site"
COVERS = os.path.join(ROOT, "public", "covers")
CLEAN = os.path.join(ROOT, "scripts", "books_clean.json")
data = json.load(open(CLEAN, encoding="utf-8"))
UA = {"User-Agent": "pyportfolios-covers/1.0 (educational site)"}

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
    authors_part = c[:ym.start()].strip() if ym else c.split("(")[0]
    rest = c[ym.end():].lstrip(". )").strip() if ym else c
    title_full = re.split(r"\.\s", rest, 1)[0].strip().rstrip(".")
    title_full = re.sub(r"\s*\([^)]*ed\.\)|\s*\(Vols?\.[^)]*\)", "", title_full).strip()
    main = re.split(r"[:—–]", title_full)[0].strip()
    sn = authors_part.split(",")[0].strip()
    sn = re.sub(r"\b([A-Z]\.)+", "", sn).strip()
    return main, sn, year

def save_img(cid_url, fn):
    img = get(cid_url, binary=True)
    if len(img) > 1500:
        open(os.path.join(COVERS, fn), "wb").write(img); return True
    return False

def ol_cover(title, author, year):
    for params in (
        {"title": title, "author": author, "limit": 8, "fields": "cover_i,author_name,first_publish_year,edition_count"},
        {"title": title, "limit": 8, "fields": "cover_i,author_name,first_publish_year,edition_count"},
        {"q": f"{title} {author}", "limit": 8, "fields": "cover_i,author_name,first_publish_year,edition_count"},
    ):
        url = "https://openlibrary.org/search.json?" + urllib.parse.urlencode(params)
        try:
            docs = [d for d in get(url).get("docs", []) if d.get("cover_i")]
        except Exception:
            docs = []
        if docs:
            def sc(d):
                s = 0
                if author and d.get("author_name") and any(author.lower() in a.lower() for a in d["author_name"]): s += 100
                if year and d.get("first_publish_year"): s -= abs(d["first_publish_year"] - year) * 0.5
                s += min(d.get("edition_count", 0), 50) * 0.2
                return s
            docs.sort(key=sc, reverse=True)
            return f"https://covers.openlibrary.org/b/id/{docs[0]['cover_i']}-L.jpg"
        time.sleep(0.5)
    return None

def gb_cover(title, author):
    q = f'intitle:{title} inauthor:{author}'
    url = "https://www.googleapis.com/books/v1/volumes?maxResults=4&q=" + urllib.parse.quote(q)
    try:
        items = get(url, tries=2, timeout=30).get("items", [])
    except Exception:
        return None
    for it in items:
        links = it.get("volumeInfo", {}).get("imageLinks")
        if links:
            u = links.get("thumbnail") or links.get("smallThumbnail")
            if u:
                return u.replace("http://", "https://").replace("&edge=curl", "")
    return None

fixed = 0
for g in data:
    for b in g["books"]:
        if b["cover"]:
            continue
        title, author, year = parse(b["citation"])
        slug = slugify((author or "book") + "-" + title)
        fn = slug + ".jpg"
        url = ol_cover(title, author, year)
        src = "OL"
        if not url:
            url = gb_cover(title, author); src = "GB"
        ok = False
        if url:
            try:
                ok = save_img(url, fn)
            except Exception as e:
                print("  dl-err", e)
        if ok:
            b["cover"] = fn; fixed += 1
            print(f"FIXED via {src}: {author} | {title} -> {fn}")
        else:
            print(f"STILL MISSING: {author} | {title}")
        time.sleep(0.5)

json.dump(data, open(CLEAN, "w", encoding="utf-8"), ensure_ascii=False, indent=2)
got = sum(1 for c in data for b in c["books"] if b["cover"])
tot = sum(len(c["books"]) for c in data)
print(f"\nNOW: {got}/{tot} covers (+{fixed})")
