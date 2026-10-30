"""Temoa feasibility probe: output ONLY source structure, not copyrighted text."""
import requests
from bs4 import BeautifulSoup
urls=[
"https://temoa.iib.unam.mx/",
"https://temoa.iib.unam.mx/3-relacion-de-chimalpahin",
"https://temoa.iib.unam.mx/3-relacion-de-chimalpahin/134r",
"https://temoa.iib.unam.mx/3-relacion-de-chimalpahin/140v",
"https://temoa.iib.unam.mx/8-relacion-de-chimalpahin",
"https://temoa.iib.unam.mx/8-relacion-de-chimalpahin/0r",
"https://temoa.iib.unam.mx/anales-mexicanos",
"https://temoa.iib.unam.mx/cuauhtitlan-anales",
"https://temoa.iib.unam.mx/la-leyenda-de-los-soles"
]
for url in urls:
    try:
        resp=requests.get(url,timeout=25,headers={"User-Agent":"Tlahtolli/1.0 (noncommercial manuscript metadata research)"})
        print("PAGE",resp.status_code, len(resp.content),resp.url,flush=True)
        resp.raise_for_status()
        soup=BeautifulSoup(resp.content,"html.parser")
        for tag in soup(["script","style","footer","header","nav"]):tag.decompose()
        print("H",[(h.name,h.get_text(" ",strip=True)[:64]) for h in soup.select("h1,h2,h3,h4,h5")][:12])
        print("ANCHORS",[(a.get("href") or "")[:110] for a in soup.select("a[href]") if
               any(term in (a.get("href") or "") for term in ["/135","/136","/134","/0r","/0v"])][:10])
        print("CLASS_META",[(tag.name,tag.get("class"),len(tag.get_text(" ",strip=True))) for tag in soup.select("div[class],p[class],article[class]") if len(tag.get_text(" ",strip=True))>90][:18])
        print("BODY_CHARS",len(soup.get_text(" ",strip=True)))
        print("FOLIO_ANCHORS",len([a for a in soup.select("a[href]") if __import__("re").search(r"/[0-9]+[rv]($|[?#])",(a.get("href") or ""))]))
    except Exception as exc: print("PROBE_ERROR",str(exc)[:250],flush=True)
