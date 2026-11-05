from PIL import Image
import numpy as np
from scipy.ndimage import binary_dilation
from scipy.sparse import lil_matrix
from scipy.sparse.linalg import spsolve
from pathlib import Path
root=Path(__file__).resolve().parents[1]/'assets'
im=Image.open(root/'hanzi-approved-v141.png').convert('RGB')
a=np.array(im)
def erase(box,kind='purple'):
 x0,y0,x1,y1=box;c=a[y0:y1,x0:x1].copy();r,g,b=c.astype(float).transpose(2,0,1)
 mask=(r<180)&(g<130) if kind=='glyph' else (g<165)&((r<190)|(b>r*1.08))
 mask=binary_dilation(mask,iterations=3)
 # Harmonic fill uses only neighbouring original pixels, not a redrawn gradient.
 yy,xx=np.where(mask);ids=np.full(mask.shape,-1);ids[yy,xx]=np.arange(len(yy));M=lil_matrix((len(yy),len(yy)));rhs=np.zeros((len(yy),3))
 h,w=mask.shape
 for i,(y,x) in enumerate(zip(yy,xx)):
  n=0
  for dy,dx in [(1,0),(-1,0),(0,1),(0,-1)]:
   v,u=y+dy,x+dx
   if 0<=v<h and 0<=u<w:
    n+=1
    if mask[v,u]:M[i,int(ids[v,u])]=-1
    else:rhs[i]+=c[v,u]
  M[i,i]=n
 c[yy,xx]=np.clip(spsolve(M.tocsr(),rhs),0,255).astype('uint8');a[y0:y1,x0:x1]=c
for box,kind in [((158,150,540,522),'glyph'),((222,646,546,729),'purple'),((310,765,554,823),'purple'),((177,985,781,1066),'purple'),((177,1091,781,1176),'purple'),((177,1202,781,1282),'purple')]:erase(box,kind)
Image.fromarray(a).save(root/'hanzi-dynamic-v141.png')
Image.fromarray(a[150:522,158:540]).save(root/'hanzi-paper-v141.png')
# Reusable selected/unselected tab textures from the source artwork.
for name,box in [('active',(302,897,564,963)),('inactive',(44,897,297,963))]:
 b=np.array(im);a=b;erase(box,'purple')
 if name=='active':
  # White lettering is removed using the same source-derived harmonic fill.
  c=a[box[1]:box[3],box[0]:box[2]]
  # Use horizontal source scanlines free of lettering to preserve original pink lighting.
  for y in range(12,62):
   c[y,30:-25]=c[y,10:11]
 Image.fromarray(a[box[1]:box[3],box[0]:box[2]]).save(root/f'hanzi-tab-{name}-v141.png')
print('Prepared original artwork and dynamic layers')

Image.open(root/'hanzi-dynamic-v141.png').crop((31,964,834,1309)).save(root/'hanzi-panel-v141.png')

# Seamless source-only scenery continuation for viewports taller than the artwork.
from PIL import ImageOps
footer=im.crop((0,1440,864,1536));tile=Image.new('RGB',(864,192));tile.paste(ImageOps.flip(footer),(0,0));tile.paste(footer,(0,96));tile.save(root/'hanzi-footer-v141.png')
