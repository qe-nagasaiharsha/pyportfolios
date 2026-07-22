# -*- coding: utf-8 -*-
"""Parse the (revised) annotated list docx straight into books_clean.json:
theme, cleaned title, author display (surnames), year, why-bullets, full citation.
cover is set to null here; fetch_covers_v2.py fills it with verified covers."""
import docx, re, json, sys
sys.stdout.reconfigure(encoding="utf-8")
SRC = r"C:\Users\Yonishwari\Downloads\Quant Finance - Annotated Literature List (1).docx"
OUT = r"C:\Users\Yonishwari\Desktop\Projects\pyportfolios\site\scripts\books_clean.json"

def is_book(t):
    return bool(re.search(r"\(\d{4}[a-z]?\)", t)) or bool(re.search(r"\(Vols?\.", t))

def clean_title(tf):
    tf = re.sub(r"\s*\((?:\d+(?:st|nd|rd|th)\s+ed\.?|Rev\.?[^)]*|Vols?\.[^)]*|[^)]*\bed\.)\)", "", tf)
    if tf.count("(") > tf.count(")"):
        tf = tf[: tf.rfind(" (")]
    return tf.strip().rstrip(".").strip()

def parse(c):
    ym = re.search(r"\((\d{4})[a-z]?\)", c)
    year = int(ym.group(1)) if ym else None
    authors_part = (c[: ym.start()] if ym else c.split("(")[0]).strip()
    rest = (c[ym.end():] if ym else c).lstrip(". ").strip()
    title_full = clean_title(re.split(r"\.\s", rest, maxsplit=1)[0].strip())
    authors_part = re.sub(r"&\s*the .*$", "", authors_part)
    chunks = re.split(r",\s*&\s*|\s*&\s*|;\s*", authors_part)
    surnames = []
    for ch in chunks:
        sn = re.sub(r"\b([A-Z]\.)+", "", ch.split(",")[0]).strip()
        if sn and sn.lower() not in ("goldman sachs", "the quantitative resources group"):
            surnames.append(sn)
    surnames = [s for s in surnames if len(s) > 1]
    if len(surnames) == 1: disp = surnames[0]
    elif len(surnames) == 2: disp = f"{surnames[0]} & {surnames[1]}"
    elif len(surnames) >= 3: disp = ", ".join(surnames[:-1]) + " & " + surnames[-1]
    else: disp = authors_part
    return title_full, disp, year

d = docx.Document(SRC)
cats = []; cur = None; curbook = None
for p in d.paragraphs:
    t = p.text.strip()
    if not t: continue
    st = p.style.name if p.style else ""
    if st == "Heading 2":
        cur = {"theme": re.sub(r"^\d+\.\s*", "", t), "books": []}; cats.append(cur); curbook = None; continue
    if st == "List Paragraph":
        if curbook is not None: curbook["why"].append(t)
        continue
    if cur is None: continue
    if is_book(t):
        title, author, year = parse(t)
        curbook = {"title": title, "author": author, "year": year, "why": [], "cover": None, "citation": t}
        cur["books"].append(curbook)
    else:
        curbook = None  # sub-topic header

json.dump(cats, open(OUT, "w", encoding="utf-8"), ensure_ascii=False, indent=2)
tot = sum(len(c["books"]) for c in cats)
print(f"{tot} books, {len(cats)} categories")
for c in cats:
    print(f"  {c['theme']}: {len(c['books'])}")
# flag any odd titles
print("\nTitle sanity:")
for c in cats:
    for b in c["books"]:
        if b["title"].count("(") != b["title"].count(")") or len(b["title"]) < 6:
            print("  ODD:", repr(b["title"]))
print("  (none flagged above = clean)")
