from __future__ import annotations
import collections, json, re, urllib.request
import fitz

URL = "https://www.njoag.gov/wp-content/uploads/2026/04/Monmouth-race-dates-2026.pdf"
req=urllib.request.Request(URL,headers={"User-Agent":"WhereHorsesRun/1.0 (+https://github.com/badjoke-lab/where-horses-run)","Accept":"application/pdf"})
with urllib.request.urlopen(req,timeout=45) as response:
    if response.status != 200 or response.url.split("/")[2] != "www.njoag.gov":
        raise RuntimeError("NJRC official PDF HTTP / host mismatch")
    data=response.read(8_000_001)
if not (2000 <= len(data) <= 8_000_000 and data.startswith(b"%PDF-")):
    raise RuntimeError("invalid NJRC official PDF")
doc=fitz.open(stream=data,filetype="pdf")
if len(doc)!=1: raise RuntimeError("unexpected NJRC PDF page count")
page=doc[0]
t=page.get_text("dict")
numeric=[]
text_counts=collections.Counter()
for b in t.get("blocks",[]):
    for line in b.get("lines",[]):
        for s in line.get("spans",[]):
            st=s.get("text","").strip()
            color=s.get("color")
            if re.fullmatch(r"(?:[1-9]|[12]\d|3[01])",st):
                numeric.append({"n":int(st),"rect":[round(float(v),1) for v in s["bbox"]],"color":color,"font":s.get("font")})
                text_counts[str(color)]+=1
draws=page.get_drawings()
fill_counts=collections.Counter()
fill_samples={}
for d in draws:
    fill=d.get("fill")
    if fill is None: continue
    c=tuple(round(float(n),3) for n in fill)
    fill_counts[str(c)]+=1
    if len(fill_samples.setdefault(str(c),[]))<12:
        fill_samples[str(c)].append({"rect":[round(float(n),1) for n in d.get("rect",[])],"items":len(d.get("items",[])),"type":d.get("type")})
# Decode month coordinate regions before interpreting calendar cells.
regions=[("May",5,46,243,218,327),("June",6,274,472,218,327),("July",7,498,698,218,327),("August",8,46,244,386,493),("September",9,274,473,386,493),("October",10,498,698,386,493)]
white_months=collections.defaultdict(list)
for n in numeric:
    cx=(n["rect"][0]+n["rect"][2])/2;cy=(n["rect"][1]+n["rect"][3])/2
    if n["color"]!=16777215: continue
    for name,month,x0,x1,y0,y1 in regions:
        if x0 <= cx <= x1 and y0 <= cy <= y1:
            white_months[name].append(n)
            break
print("NJRC_WHITE_DAY_NUMBERS "+json.dumps({k:[{"day":v["n"],"x":v["rect"][0],"y":v["rect"][1]} for v in vals] for k,vals in white_months.items()}))
print("NJRC_MONMOUTH_PDF_DIAGNOSTICS "+json.dumps({
  "http_pdf_bytes":len(data),"pages":len(doc),"page_rect":[round(float(n),1) for n in page.rect],
  "numeric_count":len(numeric),"numeric_text_colors":text_counts,
  "numeric_samples":numeric[:60],
  "drawing_count":len(draws),"fill_colors":fill_counts,
  "fill_samples":fill_samples,
  "meeting_records_emitted":0,"production_calendar_ready":False,"raw_pdf_retained":False,
},ensure_ascii=False))
