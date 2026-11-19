# VC-SF-006  |  caption-safe-zone pass 2026-08-18
CARD = {
    "id": "VC-SF-006",
    "slots": ["TERM", "DEFINITION"],
    "default_duration": 4.0,
    "css": r'''.def-wrap{position:absolute;left:96px;top:0;width:888px;height:100%;display:flex;flex-direction:column;justify-content:center;align-items:center;text-align:center;}
.def-term{font-family:'Space Grotesk';font-weight:700;font-size:104px;color:#00D4AA;opacity:0;transform:translateY(30px);}
.def-eq{width:400px;height:8px;background:#00D4AA;border-radius:4px;opacity:0;margin:36px 0;transform:scaleX(0);transform-origin:center;}
.def-body{font-family:'Space Grotesk';font-weight:600;font-size:62px;line-height:1.2;color:#FFFFFF;opacity:0;transform:translateY(30px);}

/* --- caption-safe-zone pass: keep all text above y=1180 (caption band y1180-1540) --- */
.def-wrap{top:192px !important;height:988px !important;}

/* ax caption-safe v3: center ~y920, clamp bottom<=1340 (repo band bottom=1540) */
#axsafe{position:absolute;left:0;top:0;width:1080px;height:1920px;transform:translateY(224px);}
''',
    "body": r'''<div id="axsafe"><div class="def-wrap"><div class="def-term" id="defTerm">__TERM__</div><div class="def-eq" id="defEq"></div><div class="def-body" id="defBody">__DEFINITION__</div></div></div>''',
    "seek": r'''
var x=(typeof x!=='undefined'&&x>0)?x:4;
var HOLD=1,ENTER=0.5;
function S(i,N){return N<2?0.12*x:0.12*x+(i/(N-1))*((x-HOLD-ENTER)-0.12*x);}
function E(i,N){return N<2?Math.min(x-HOLD,0.12*x+0.6):S(i,N)+ENTER;}
if(!window.__fit){window.__fit=function(sel,maxW,maxH,line,center){
var els=document.querySelectorAll(sel);var ready=(!document.fonts)||document.fonts.status==='loaded';
for(var i=0;i<els.length;i++){var el=els[i];
if(el.dataset.fitok==='1'){el.style.fontSize=el.dataset.fitpx+'px';continue;}
if(!el.dataset.fbase){el.dataset.fbase=(parseFloat(getComputedStyle(el).fontSize)||40);}
if(maxW){el.style.maxWidth=maxW+'px';if(center){el.style.marginLeft='auto';el.style.marginRight='auto';}}
el.style.whiteSpace=line?'nowrap':'normal';if(!line){el.style.overflowWrap='break-word';el.style.wordBreak='break-word';}
var size=parseFloat(el.dataset.fbase);el.style.fontSize=size+'px';var g=0;
while(size>16&&g<240&&(el.scrollWidth>el.clientWidth+0.5||(maxH&&el.scrollHeight>maxH+0.5))){size-=2;el.style.fontSize=size+'px';g++;}
if(ready){el.dataset.fitpx=size;el.dataset.fitok='1';}}
};}

__fit(".def-term",888,0,1,1);__fit(".def-body",888,520,0,1);
function show(id,a,b,dy){var e=easeOutCubic(clamp((t-a)/(b-a)));var el=document.getElementById(id);if(el){el.style.opacity=e;el.style.transform='translateY('+(dy*(1-e))+'px)';}}
function grow(id,a,b){var e=easeOutCubic(clamp((t-a)/(b-a)));var el=document.getElementById(id);if(el){el.style.transform='scaleX('+e+')';}}
show('defTerm',S(0,3),E(0,3),30);
var e=easeOutCubic(clamp((t-S(1,3))/(E(1,3)-S(1,3))));var eq=document.getElementById('defEq');eq.style.opacity=e;eq.style.transform='scaleX('+e+')';
show('defBody',S(2,3),E(2,3),30);''',
}
