# -*- coding: utf-8 -*-
"""Parse the annotated-literature JSON, look up real covers on Open Library,
download them to public/covers/, and emit a clean books.json for literature.ts."""
import json, re, os, time, urllib.request, urllib.parse, sys
sys.stdout.reconfigure(encoding="utf-8")

ROOT = r"C:\Users\Yonishwari\Desktop\Projects\pyportfolios\site"
COVERS = os.path.join(ROOT, "public", "covers")
os.makedirs(COVERS, exist_ok=True)
raw = json.load(open(os.path.join(ROOT, "scripts", "books_raw.json"), encoding="utf-8"))

UA = {"User-Agent": "pyportfolios-covers/1.0 (educational site)"}

def get(url, binary=False):
    req = urllib.request.Request(url, headers=UA)
    with urllib.request.urlopen(req, timeout=30) as r:
        return r.read() if binary else json.loads(r.read())

def slugify(s):
    s = s.lower()
    s = re.sub(r"[^a-z0-9]+", "-", s).strip("-")
    return s[:48]

def parse_citation(c):
    ym = re.search(r"\((\d{4})[a-z]?\)", c)
    year = int(ym.group(1)) if ym else None
    if ym:
        authors_part = c[:ym.start()].strip()
        rest = c[ym.end():].lstrip(". ").strip()
    else:
        authors_part = c.split("(")[0].strip()
        rest = c
    # title = up to first ". " in rest, strip edition/vols parens
    title_full = re.split(r"\.\s", rest, maxsplit=1)[0].strip().rstrip(".")
    title_full = re.sub(r"\s*\((?:\d+(?:st|nd|rd|th) ed\.|Vols?\.[^)]*|[^)]*ed\.)\)", "", title_full).strip()
    # main title for search = before colon/em-dash
    main = re.split(r"[:—–]", title_full)[0].strip()
    # surnames
    authors_part = re.sub(r"&\s*the .*$", "", authors_part)  # drop "& the Quantitative Resources Group..."
    chunks = re.split(r",\s*&\s*|\s*&\s*|;\s*", authors_part)
    surnames = []
    for ch in chunks:
        ch = ch.strip().rstrip(".")
        if not ch: continue
        sn = ch.split(",")[0].strip()
        sn = re.sub(r"\b([A-Z]\.)+", "", sn).strip()  # remove stray initials
        if sn and sn.lower() not in ("goldman sachs", "the quantitative resources group"):
            surnames.append(sn)
    if "Quantitative Resources Group" in authors_part or "Goldman Sachs" in authors_part:
        surnames = ["Litterman"] if not surnames else surnames
    surnames = [s for s in surnames if len(s) > 1]
    if len(surnames) == 1: disp = surnames[0]
    elif len(surnames) == 2: disp = f"{surnames[0]} & {surnames[1]}"
    elif len(surnames) >= 3: disp = ", ".join(surnames[:-1]) + " & " + surnames[-1]
    else: disp = authors_part
    return {"title_full": title_full, "title_main": main, "surnames": surnames,
            "author_disp": disp, "year": year}

def find_cover(title_main, surname, year):
    params = {"title": title_main, "limit": 6,
              "fields": "title,author_name,cover_i,first_publish_year,edition_count"}
    if surname: params["author"] = surname
    url = "https://openlibrary.org/search.json?" + urllib.parse.urlencode(params)
    try:
        data = get(url)
    except Exception as e:
        return None, f"search-err {e}"
    docs = [d for d in data.get("docs", []) if d.get("cover_i")]
    if not docs:
        return None, "no-cover-docs"
    # rank: prefer author match, then closest year, then edition_count
    def score(d):
        s = 0
        if surname and d.get("author_name"):
            if any(surname.lower() in a.lower() for a in d["author_name"]): s += 100
        if year and d.get("first_publish_year"):
            s -= abs(d["first_publish_year"] - year) * 0.5
        s += min(d.get("edition_count", 0), 50) * 0.2
        return s
    docs.sort(key=score, reverse=True)
    return docs[0]["cover_i"], "ok"

out = []
gi = 0
for cat in raw:
    gi += 1
    theme = re.sub(r"^\d+\.\s*", "", cat["category"]).strip()
    books = []
    for b in cat["books"]:
        p = parse_citation(b["citation"])
        slug = slugify((p["surnames"][0] if p["surnames"] else "book") + "-" + p["title_main"])
        cover_file = None
        cid, status = find_cover(p["title_main"], p["surnames"][0] if p["surnames"] else "", p["year"])
        if cid:
            try:
                img = get(f"https://covers.openlibrary.org/b/id/{cid}-L.jpg", binary=True)
                if len(img) > 1500:  # OL returns a tiny blank for missing
                    fn = slug + ".jpg"
                    open(os.path.join(COVERS, fn), "wb").write(img)
                    cover_file = fn
                else:
                    status = "blank-img"
            except Exception as e:
                status = f"dl-err {e}"
        print(f"[{gi}] {p['author_disp'][:24]:24} | {p['title_main'][:40]:40} | {status} | {cover_file or '-'}")
        books.append({
            "title": p["title_full"], "author": p["author_disp"], "year": p["year"],
            "why": b["bullets"], "cover": cover_file, "citation": b["citation"],
        })
        time.sleep(0.4)
    out.append({"theme": theme, "books": books})

json.dump(out, open(os.path.join(ROOT, "scripts", "books_clean.json"), "w", encoding="utf-8"),
          ensure_ascii=False, indent=2)
got = sum(1 for c in out for b in c["books"] if b["cover"])
tot = sum(len(c["books"]) for c in out)
print(f"\nCOVERS: {got}/{tot}")
