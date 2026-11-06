from PIL import Image,ImageDraw,ImageFont
from pathlib import Path
from io import BytesIO
import base64
candidates=["assets/lessons-backdrop.webp","assets/approved-panda-lake-v112.webp","assets/china-autumn-temple-v71.webp","assets/china-misty-pavilion-v70.webp","assets/china-landscape.svg","assets/china-lake-vocab.svg","assets/approved-home-v36.png","assets/panda-go-approved-home-v132.jpg","assets/course-scene-01.webp","assets/course-scene-02.webp","assets/course-scene-03.webp","assets/course-scene-04.webp","assets/course-scene-05.webp","assets/course-scene-06.webp","assets/course-scene-07.webp","assets/course-scene-08.webp","assets/course-scene-09.webp","assets/course-scene-10.webp","assets/approved-quiz-scene-v112.webp","assets/approved-final-home.svg"]
im=Image.new('RGB',(960,((len(candidates)+4)//5)*350),(247,235,255));draw=ImageDraw.Draw(im)
for i,path in enumerate(candidates):
 try:
  p=Image.open(path).convert('RGB')
  p.thumbnail((183,315))
  xx=(i%5)*192+int((192-p.width)/2);yy=(i//5)*350+15
  im.paste(p,(xx,yy));draw.text(((i%5)*192+5,yy+315),Path(path).name[:24],fill=(40,15,50))
 except Exception as exc: draw.text(((i%5)*192+5,(i//5)*350+15),str(exc)[:20],fill=(255,20,20))
buf=BytesIO();im.save(buf,format='JPEG',quality=62)
print('PANDA_CONTACT_START');print(base64.b64encode(buf.getvalue()).decode());print('PANDA_CONTACT_END')
