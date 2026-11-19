# VC-LF-009 | AX long-form centered layout v2
# 1920x1080. Main content is optically centered; lower subtitle band is protected.
# Motion remains duration-aware: animate through duration-1s, hold only the final 1s.
CARD = {
    "id": 'VC-LF-009',
    "slots": ['MYTH_LINE', 'FACT_LINE', 'SOURCE'],
    "default_duration": 4.5,
    "css": r'''.mf-wrap{position:absolute;left:96px;top:0;width:888px;height:100%;display:flex;flex-direction:column;justify-content:center;}
.mf-tag{font-family:'Space Grotesk';font-weight:600;font-size:30px;letter-spacing:.14em;text-transform:uppercase;opacity:0;transform:translateY(20px);}
.mf-myth-tag{color:#8CA0B8;} .mf-fact-tag{color:#00D4AA;}
.mf-myth{margin-top:16px;font-family:'Space Grotesk';font-weight:600;font-size:60px;line-height:1.16;color:#8CA0B8;text-decoration:line-through;text-decoration-color:#FF7A3C;text-decoration-thickness:5px;opacity:0;transform:translateY(28px);}
.mf-gap{height:56px;}
.mf-fact{margin-top:16px;font-family:'Space Grotesk';font-weight:700;font-size:70px;line-height:1.14;color:#FFFFFF;opacity:0;transform:translateY(30px);}
.src{position:absolute;left:96px;bottom:320px;display:flex;align-items:center;gap:20px;opacity:0;}
.src-bar{width:10px;height:44px;background:#00D4AA;border-radius:3px;}
.src-txt{font-family:Inter;font-weight:600;font-size:30px;color:#FFFFFF;letter-spacing:.02em;}

/* --- caption-safe-zone pass: keep all text above y=1180 (caption band y1180-1540) --- */
.mf-wrap{top:192px !important;height:988px !important;}.src{bottom:600px !important;}

/* ax caption-safe v3: center ~y920, clamp bottom<=1340 (repo band bottom=1540) */
#axsafe{position:absolute;left:0;top:0;width:1080px;height:1920px;transform:translate(120px,-280px);}

#axsafe{transform:translate(140px,-280px)!important;}
.mf-wrap{width:930px!important;}
.mf-myth{font-size:56px!important;}
.mf-fact{font-size:66px!important;}
.src{left:96px!important;}

/* ===== LF V2 universal centered composition =====
   Optical content center ~= x 880 px.
   Scale 0.78 reduces Shorts-scale typography/graphics.
   Transform origin y=540 pulls high titles down and low graphics up.
   Approx. bottom 220-250 px remains available for subtitles. */
#axsafe{position:absolute!important;left:0!important;top:0!important;width:1080px!important;height:1920px!important;
transform:translate(340px,-280px) scale(.78)!important;transform-origin:540px 540px!important;}

/* LF V2 per-card readability scale */
#axsafe{transform:translate(340px,-280px) scale(0.82)!important;transform-origin:540px 540px!important;}
.src{bottom:760px!important;}
''',
    "body": r'''<div id="axsafe"><div class="mf-wrap"><div class="mf-tag mf-myth-tag" id="mfT1">The myth</div><div class="mf-myth" id="mfMyth">__MYTH_LINE__</div><div class="mf-gap"></div><div class="mf-tag mf-fact-tag" id="mfT2">The data</div><div class="mf-fact" id="mfFact">__FACT_LINE__</div></div>
<div class="src" id="mfSrc"><div class="src-bar"></div><div class="src-txt">SOURCE: __SOURCE__</div></div></div>''',
    "seek": r'''
/* AX LF timing normalization:
   real card duration = x
   animation window   = x - 1.0 s
   final 1.0 s        = settled hold
   The original card motion is remapped into that active window.
*/
var __lfRealX=(typeof x!=='undefined'&&x>0)?x:4.5;
var __lfActive=Math.max(0.25,__lfRealX-1.0);
var __lfP=clamp(t/__lfActive);
t=__lfP*3.5;
x=4.5;

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

__fit(".mf-myth",888,300,0,0);__fit(".mf-fact",888,320,0,0);__fit(".src-txt",820,0,1,0);
function show(id,a,b,dy){var e=easeOutCubic(clamp((t-a)/(b-a)));var el=document.getElementById(id);if(el){el.style.opacity=e;el.style.transform='translateY('+(dy*(1-e))+'px)';}}
function grow(id,a,b){var e=easeOutCubic(clamp((t-a)/(b-a)));var el=document.getElementById(id);if(el){el.style.transform='scaleX('+e+')';}}
show('mfT1',S(0,5),E(0,5),20);show('mfMyth',S(1,5),E(1,5),28);show('mfT2',S(2,5),E(2,5),20);show('mfFact',S(3,5),E(3,5),30);
var s=document.getElementById('mfSrc');if(s){var st=(s.textContent.indexOf('__')<0 && s.textContent.replace('SOURCE:','').trim().length>0 && s.textContent.replace('SOURCE:','').trim().toUpperCase().indexOf('ILLUSTRATIVE')!==0);s.style.opacity=st?easeOutCubic(clamp((t-S(4,5))/(E(4,5)-S(4,5)))):0;}''',
}
