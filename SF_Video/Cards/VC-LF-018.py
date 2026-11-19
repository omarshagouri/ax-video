# VC-LF-018 | Long-form chapter divider
# 1920x1080. Full chapter-start treatment:
# large teal chapter number + large centered title + thin teal accent line.
CARD = {
    "id": "VC-LF-018",
    "slots": ["CHAPTER_NUM", "TITLE"],
    "default_duration": 3.0,
    "css": r"""
@import url('https://fonts.googleapis.com/css2?family=Orbitron:wght@500;600;700&display=swap');

.ch-root{
  position:absolute;
  inset:0;
  width:1920px;
  height:1080px;
  background:transparent;
  overflow:hidden;
}
.ch-stage{
  position:absolute;
  inset:0;
  width:1920px;
  height:1080px;
}
.ch-accent{
  position:absolute;
  left:calc(50% - 215px);
  top:365px;
  width:430px;
  height:4px;
  border-radius:999px;
  background:#00D4AA;
  box-shadow:0 0 20px rgba(0,212,170,.30);
  opacity:0;
  transform:scaleX(0);
  transform-origin:center;
}
.ch-row{
  position:absolute;
  top:50%;
  left:0;
  right:0;
  transform:translateY(-50%);
  width:100%;
  display:flex;
  align-items:center;
  justify-content:center;
}
.ch-number-wrap{
  position:absolute;
  left:120px;
  top:50%;
  transform:translateY(-50%);
}
.ch-number{
  flex:0 0 auto;
  margin-top:4px;
  font-family:'Orbitron',sans-serif;
  font-size:116px;
  line-height:.94;
  font-weight:700;
  letter-spacing:-3px;
  color:#00D4AA;
  text-shadow:0 4px 28px rgba(0,0,0,.40);
  opacity:0;
  transform:translateX(-30px);
}
.ch-title{
  flex:0 0 auto;
  width:1320px;
  max-width:calc(100% - 600px);
  margin:0;
  font-family:'Orbitron',sans-serif;
  font-size:104px;
  line-height:1.01;
  font-weight:600;
  letter-spacing:-3.2px;
  color:#FFFFFF;
  text-align:center;
  text-transform:uppercase;
  white-space:nowrap;
  overflow-wrap:normal;
  word-break:normal;
  text-shadow:0 4px 30px rgba(0,0,0,.46);
  opacity:0;
  transform:translateY(24px);
}
""",
    "body": r"""
<div class="ch-root">
  <div class="ch-stage">
    <div class="ch-accent" id="chAccent"></div>
    <div class="ch-row">
      <div class="ch-number-wrap"><div class="ch-number" id="chNum">__CHAPTER_NUM__</div></div>
      <h1 class="ch-title" id="chTitle">__TITLE__</h1>
    </div>
  </div>
</div>
""",
    "seek": r"""
var n=document.getElementById('chNum');
var h=document.getElementById('chTitle');
var a=document.getElementById('chAccent');

if(n){
  var txt=(n.textContent||'').trim();
  if(txt && txt.slice(-1)!=='.'){ n.textContent=txt+'.'; }
}

/* Self-contained fit logic: do not depend on a renderer-global helper. */
if(h){
  var maxSize=104;
  var minSize=40;
  var size=maxSize;
  h.style.fontSize=size+'px';
  /* Fit uppercase chapter titles to one centered line without wrapping. */
  while(size>minSize && h.scrollWidth>h.clientWidth+1){
    size-=2;
    h.style.fontSize=size+'px';
  }
}

/* Chapter divider has three distinct entrance beats across the actual hold.
   The remaining final 12% settles for legibility. */
var __duration=(typeof x!=='undefined'&&Number.isFinite(x)&&x>0)?x:3;
var __window=Math.max(0.25,__duration*0.88);
function __step(a,b){return easeOutCubic(clamp((t-__window*a)/Math.max(0.05,__window*(b-a))));}
var pLine=__step(0.03,0.28);
if(a){
  a.style.transform='scaleX('+pLine+')';
  a.style.opacity=pLine;
}

var pNum=__step(0.28,0.56);
if(n){
  n.style.opacity=pNum;
  n.style.transform='translateX('+(-30*(1-pNum))+'px)';
}

var pTitle=__step(0.49,0.94);
if(h){
  h.style.opacity=pTitle;
  h.style.transform='translateY('+(24*(1-pTitle))+'px)';
}
"""
}
