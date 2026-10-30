#!/usr/bin/env python3
"""Probe only non-content DOM structure; never print modern copyrighted text."""
import requests
from bs4 import BeautifulSoup
urls=[
 "https://sermonesenmexicano.unam.mx/sem/ayer1485i",
 "https://sermonesenmexicano.unam.mx/sem/ayer1485c?p=5&s=ayer1485-5"
]
for url in urls:
    resp=requests.get(url,timeout=35,headers={"User-Agent":"Tlahtolli/1.0 (research contact: project GitHub niftybacon/tlahtolli)"})
    print("STATUS",resp.status_code,"BYTES",len(resp.content),"URL",url)
    resp.raise_for_status()
    soup=BeautifulSoup(resp.content,"html.parser")
    print("LINKS",[(x.get("href") or "")[:150] for x in soup.select("a[href]") if "ayer1485" in (x.get("href") or "")][:10])
    for string in soup.find_all(string=lambda s:s and s.strip() in {"Transcripción","Traducción","Manuscrito"}):
        el=string.parent
        print("MARKER",repr(string.strip()),"TAG",el.name,"CLASS",el.get("class"),"PARENT",el.parent.name,el.parent.get("class"),"GRANDPARENT",el.parent.parent.name,el.parent.parent.get("class"))
    for tag in soup.select("h1,h2,h3,h4,h5,h6"):
        print("HEADING",tag.name,tag.get_text(" ",strip=True)[:80],tag.get("class"))
    print("DIV CLASSES",[x.get("class") for x in soup.select("div[class]") if any(z in str(x.get("class")).lower() for z in ["trans","tradu","conten","text","tab"])][:18])
