#!/usr/bin/env python3
"""Inspect 1833 public-domain facsimile pages without committing the PDF.
Only sampled low-resolution JPGs are logged for temporary visual verification.
"""
import base64,io,re
import fitz
from urllib.request import Request,urlopen
PDF='https://upload.wikimedia.org/wikipedia/commons/4/49/El_Evangelio_de_San_Lucas%2C_del_lat%C3%ADn_al_mexicano.pdf'
req=Request(PDF,headers={'User-Agent':'Tlahtolli-facsimile-research/0.1'})
with urlopen(req,timeout=70) as response:buf=response.read(15_000_000)
doc=fitz.open(stream=buf,filetype='pdf')
print('PDF_PAGE_COUNT',len(doc))
print('PDF_BYTES',len(buf))
for i in [0,3,5,7,9,11,13,15,17,20,24,30,50,90,140,151]:
 if i>=len(doc):continue
 txt=' '.join(doc[i].get_text().split())
 print('PAGE_TEXT',i,'chars',len(txt),'opening',repr(txt[:75]))
# Sample a few pages around the beginning of the Nahuatl text; no uploads.
for i in [17,18,19,21,22]:
 if i>=len(doc):continue
 pix=doc[i].get_pixmap(matrix=fitz.Matrix(2.2,2.2),alpha=False)
 from PIL import Image
 im=Image.frombytes('RGB',[pix.width,pix.height],pix.samples)
 im.thumbnail((580,900))
 output=io.BytesIO();im.save(output,format='JPEG',quality=62,optimize=True)
 data=base64.b64encode(output.getvalue()).decode('ascii')
 print('SAMPLE_IMAGE_'+str(i)+'_BEGIN'+data+'END_SAMPLE_IMAGE_'+str(i))
print('Facsimile sample pages generated solely for review.')
