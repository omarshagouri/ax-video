# VC-LF-007 | AX long-form centered layout v2
# 1920x1080. Main content is optically centered; lower subtitle band is protected.
# Motion remains duration-aware: animate through duration-1s, hold only the final 1s.
CARD = {
    "id": 'VC-LF-007',
    "slots": ['WARNING_LINE', 'DETAIL'],
    "default_duration": 4.0,
    "css": r'''.warn-wrap{position:absolute;left:96px;top:0;width:888px;height:100%;display:flex;flex-direction:column;justify-content:center;align-items:center;text-align:center;}
.warn-tri{width:0;height:0;border-left:58px solid transparent;border-right:58px solid transparent;border-bottom:100px solid #FF7A3C;opacity:0;transform:translateY(24px);position:relative;}
.warn-tri::after{content:'!';position:absolute;left:-11px;top:34px;font-family:'Space Grotesk';font-weight:700;font-size:56px;color:#0A1628;}
.warn-pill{margin-top:34px;border:2px solid #FF7A3C;border-radius:12px;padding:12px 28px;font-family:'Space Grotesk';font-weight:600;font-size:30px;letter-spacing:.14em;color:#FF7A3C;opacity:0;transform:translateY(22px);}
.warn-line{margin-top:40px;font-family:'Space Grotesk';font-weight:700;font-size:74px;line-height:1.14;color:#FFFFFF;opacity:0;transform:translateY(34px);}
.warn-detail{margin-top:26px;font-family:Inter;font-weight:400;font-size:40px;line-height:1.3;color:#8CA0B8;opacity:0;transform:translateY(26px);}

/* --- caption-safe-zone pass: keep all text above y=1180 (caption band y1180-1540) --- */
.warn-wrap{top:192px !important;height:988px !important;}

/* ax caption-safe v3: center ~y920, clamp bottom<=1340 (repo band bottom=1540) */
#axsafe{position:absolute;left:0;top:0;width:1080px;height:1920px;transform:translate(120px,-143px);}

#axsafe{transform:translate(140px,-143px)!important;}
.warn-wrap{width:920px!important;}
.warn-line{font-size:68px!important;}
.warn-detail{font-size:36px!important;}

/* ===== LF V2 universal centered composition =====
   Optical content center ~= x 880 px.
   Scale 0.78 reduces Shorts-scale typography/graphics.
   Transform origin y=540 pulls high titles down and low graphics up.
   Approx. bottom 220-250 px remains available for subtitles. */
#axsafe{position:absolute!important;left:0!important;top:0!important;width:1080px!important;height:1920px!important;
transform:translate(340px,-143px) scale(.78)!important;transform-origin:540px 540px!important;}

/* LF V2 per-card readability scale */
#axsafe{transform:translate(340px,-143px) scale(0.82)!important;transform-origin:540px 540px!important;}
''',
    "body": r'''<div id="axsafe"><div class="warn-wrap"><div class="warn-tri" id="wTri"></div><div class="warn-pill" id="wPill">WARNING</div><div class="warn-line" id="wLine">__WARNING_LINE__</div><div class="warn-detail" id="wDetail">__DETAIL__</div></div></div>''',
    "seek": r'''
/* AX LF timing normalization:
   real card duration = x
   animation window   = x - 1.0 s
   final 1.0 s        = settled hold
   The original card motion is remapped into that active window.
*/
var __lfRealX=(typeof x!=='undefined'&&x>0)?x:4;
var __lfActive=Math.max(0.25,__lfRealX-1.0);
var __lfP=clamp(t/__lfActive);
t=__lfP*3;
x=4;

var x=(typeof x!=='undefined'&&x>0)?x:4;
var HOLD=1,ENTER=0.5;
function S(i,N){return N<2?0.12*x:0.12*x+(i/(N-1))*((x-HOLD-ENTER)-0.12*x);}
function E(i,N){return N<2?x-HOLD:S(i,N)+ENTER;}
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

__fit(".warn-pill",800,0,1,1);__fit(".warn-line",888,520,0,1);__fit(".warn-detail",888,260,0,1);
function show(id,a,b,dy){var e=easeOutCubic(clamp((t-a)/(b-a)));var el=document.getElementById(id);if(el){el.style.opacity=e;el.style.transform='translateY('+(dy*(1-e))+'px)';}}
function grow(id,a,b){var e=easeOutCubic(clamp((t-a)/(b-a)));var el=document.getElementById(id);if(el){el.style.transform='scaleX('+e+')';}}
show('wTri',S(0,5),E(0,5),24);show('wPill',S(1,5),E(1,5),22);show('wLine',S(2,5),E(2,5),34);show('wDetail',S(3,5),E(3,5),26);
// subtle breathing pulse on the triangle during hold (keeps the screen alive)
if(t>S(4,5)){var p=0.5+0.5*Math.sin((t-2.2)*3.2);document.getElementById('wTri').style.opacity=(0.8+0.2*p);}''',
}
