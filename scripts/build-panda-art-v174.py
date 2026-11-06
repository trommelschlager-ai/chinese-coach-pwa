#!/usr/bin/env python3
"""Build reference-inspired decorative images from already approved Panda Go art.
All interactive controls remain HTML, not baked into these graphics.
"""
from pathlib import Path
from PIL import Image, ImageDraw, ImageEnhance, ImageFilter
import math, random
ROOT=Path(__file__).resolve().parent.parent
ASSETS=ROOT/'assets'
# Clean the original panda illustration's obsolete crown/flame/profile shortcuts.
hero=Image.open(ASSETS/'panda-go-panda-only-v173.webp').convert('RGB')
# Old badges are across the top right. Inpaint to reconstruct nearby sky instead
# of cropping the panda's forehead, face, headphones or paws.
try:
 import cv2, numpy as np
 mat=np.array(hero);mask=np.zeros(mat.shape[:2],dtype=np.uint8)
 h,w=mat.shape[:2]
 for cx,cy,rad in [(620,24,64),(755,24,61),(865,21,61)]:
  cv2.circle(mask,(round(cx*w/941),round(cy*h/600)),round(rad*w/941),255,-1)
 # Only the top sky is repaired; the prominent paw/logo and panda remain original.
 restored=cv2.inpaint(cv2.cvtColor(mat,cv2.COLOR_RGB2BGR),mask,21,cv2.INPAINT_TELEA)
 hero=Image.fromarray(cv2.cvtColor(restored,cv2.COLOR_BGR2RGB))
 print('Removed old nav badges with sky inpainting')
except ImportError:
 print('CV2 unavailable; use original image and avoid reporting badges cleaned')
hero.save(ASSETS/'panda-go-hero-clean-v174.webp',format='WEBP',quality=94,method=6)

# Reference-inspired map scene: mirror the existing approved landscape to put
# the pagoda left and keep mountains and sakura, like the user-approved map art.
scene=Image.open(ASSETS/'panda-hsk1-landscape-clean-v173.webp').convert('RGB')
# Strip a residual piece of the old giant panda at the left edge before mirroring.
scene=scene.crop((round(scene.width*.11),0,scene.width,scene.height))
scene=scene.transpose(Image.Transpose.FLIP_LEFT_RIGHT)
scene=ImageEnhance.Color(scene).enhance(1.26)
scene=ImageEnhance.Contrast(scene).enhance(1.07)
scene=ImageEnhance.Brightness(scene).enhance(1.04)
scene.save(ASSETS/'panda-hsk1-mountain-v174.webp','WEBP',quality=94,method=6)

# A real, transparent stone stairway atop the scenery (never screenshot buttons).
# Work at 2x for sharp detailed curved stair treads on Android.
S=2;W=400*S;H=740*S
canvas=Image.new('RGBA',(W,H),(0,0,0,0))
rng=random.Random(174)
d=ImageDraw.Draw(canvas,'RGBA')
stops=[(0,285),(0.12,276),(.25,155),(.40,300),(.54,175),(.68,120),(.81,279),(1.0,160)]
def x_at(t):
 for i in range(len(stops)-1):
  t0,x0=stops[i];t1,x1=stops[i+1]
  if t0<=t<=t1:
   u=(t-t0)/(t1-t0);u=u*u*(3-2*u)
   return x0+(x1-x0)*u
 return stops[-1][1]
def geo(y):
 t=y/(H-1)
 return (x_at(t)*S,y)
def normal(y):
 x0,_=geo(max(0,y-7));x1,_=geo(min(H-1,y+7))
 dx=(x1-x0)/14
 inv=math.sqrt(1+dx*dx)
 return (1/inv,-dx/inv)
def outline(extra=0,dy=0):
 left=[];right=[]
 for y in range(0,H,3):
  x,_=geo(y);n=normal(y)
  width=(37+44*y/H+extra)*S
  left.append((x-n[0]*width,y+dy-n[1]*width))
  right.append((x+n[0]*width,y+dy+n[1]*width))
 return left+right[::-1]
# Soft shadow, saffron stone sides, golden rim, sunlit deck.
shadow=Image.new('RGBA',(W,H),(0,0,0,0));sd=ImageDraw.Draw(shadow,'RGBA')
sd.polygon(outline(16,20*S),fill=(56,29,42,102))
shadow=shadow.filter(ImageFilter.GaussianBlur(11*S))
canvas=Image.alpha_composite(canvas,shadow)
d=ImageDraw.Draw(canvas,'RGBA')
d.polygon(outline(9,8*S),fill=(125,71,53,235))
d.polygon(outline(6,2*S),fill=(195,133,72,255))
d.polygon(outline(1,0),fill=(240,203,139,255))
# Individual sandstone treads and edge bricks, perspective grows toward viewer.
for y in range(9,H-8,25*S):
 x,_=geo(y);nx,ny=normal(y);width=(36+44*y/H)*S
 jitter=rng.uniform(-1.2,1.2)*S
 L=(x-nx*width,y-ny*width+jitter)
 R=(x+nx*width,y+ny*width+jitter)
 d.line([L,R],fill=(145,93,62,186),width=3*S)
 d.line([(L[0],L[1]-3*S),(R[0],R[1]-3*S)],fill=(255,244,203,218),width=2*S)
 # Soft vertical grout markings near stones' edges
 for sign in (-1,1):
  e=(x+sign*nx*width,y+sign*ny*width)
  d.ellipse((e[0]-3*S,e[1]-2*S,e[0]+4*S,e[1]+3*S),fill=(164,102,62,108))
 # Occasional smaller masonry joints for organic texture
 if rng.random()>.42:
  frac=rng.uniform(-.62,.64)
  xx=x+nx*width*frac; yy=y+ny*width*frac
  d.line([(xx,yy),(xx+nx*6*S,yy+ny*6*S)],fill=(165,116,79,90),width=S)
# Highlights and grass at the stair edges.
for y in range(18,H-15,9*S):
 x,_=geo(y);nx,ny=normal(y);width=(38+44*y/H)*S
 if rng.random()>.55:
  side=rng.choice([-1,1])
  X=x+side*nx*width;Y=y+side*ny*width
  d.ellipse((X-2*S,Y-2*S,X+2*S,Y+2*S),fill=(238,221,160,161))
canvas=canvas.resize((400,740),resample=Image.Resampling.LANCZOS)
canvas.save(ASSETS/'panda-stone-staircase-v174.webp',format='WEBP',quality=94,method=6)
for filename in ('panda-go-hero-clean-v174.webp','panda-hsk1-mountain-v174.webp','panda-stone-staircase-v174.webp'):
 p=ASSETS/filename
 print('Created',filename,p.stat().st_size,'bytes',Image.open(p).size)

# Three existing high-detail course illustrations (book, scroll and speech
# bubbles) are reused as transparent stickers; 4-6 keep custom fan, lantern,
# pagoda vector assets rather than copying painted/text-bearing buttons.
original=Image.open(ASSETS/'panda-go-home-v136-clean.png').convert('RGBA')
crops=[
 ('1',(85,795,382,956)),
 ('2',(90,790,377,957)),
 ('3',(75,945,386,1113))
]
for level,box in crops:
 sticker=original.crop(box)
 alpha=Image.new('L',sticker.size,0)
 ad=ImageDraw.Draw(alpha)
 pad=9
 ad.rounded_rectangle((pad,pad,sticker.width-pad,sticker.height-pad),radius=31,fill=255)
 alpha=alpha.filter(ImageFilter.GaussianBlur(10))
 sticker.putalpha(alpha)
 sticker.thumbnail((270,145),resample=Image.Resampling.LANCZOS)
 dest=ASSETS/f'panda-hsk-card-{level}-v174.webp'
 sticker.save(dest,format='WEBP',quality=94,method=6)
 print('Generated illustrated HSK card',level,sticker.size,dest.stat().st_size)
