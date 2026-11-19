# VC-LF-008 | AX long-form centered layout v2
# 1920x1080. Main content is optically centered; lower subtitle band is protected.
# Motion remains duration-aware: animate through duration-1s, hold only the final 1s.
CARD = {
    "id": 'VC-LF-008',
    "slots": ['CORRECT_LABEL', 'CORRECT_ITEM', 'WRONG_LABEL', 'WRONG_ITEM'],
    "default_duration": 4.0,
    "css": r'''.elim-wrap{position:absolute;left:0;top:0;width:1080px;height:100%;display:flex;flex-direction:column;justify-content:center;align-items:center;}
.elim-row{display:flex;width:888px;justify-content:space-between;position:relative;}
.elim-div{position:absolute;left:50%;top:6px;width:2px;height:280px;background:rgba(140,160,184,.35);transform:translateX(-1px) scaleY(0);transform-origin:top;}
.elim-col{width:400px;text-align:center;}
.elim-head{font-family:'Space Grotesk';font-weight:700;font-size:44px;letter-spacing:.04em;opacity:0;transform:translateY(24px);}
.elim-item{margin-top:34px;font-family:'Space Grotesk';font-weight:700;font-size:64px;line-height:1.12;color:#FFFFFF;opacity:0;transform:translateY(30px);}
.elim-ok{color:#00D4AA;} .elim-no{color:#FF7A3C;}
.hd-ic{display:inline-block;width:.82em;height:.82em;margin-left:.26em;vertical-align:-.08em;}
.elim-rule{width:400px;height:8px;background:#00D4AA;border-radius:4px;margin-top:56px;transform:scaleX(0);transform-origin:center;}

/* --- caption-safe-zone pass: keep all text above y=1180 (caption band y1180-1540) --- */
.elim-wrap{top:192px !important;height:988px !important;}
.elim-item{overflow-wrap:normal !important;word-break:normal !important;}

/* ax caption-safe v3: center ~y920, clamp bottom<=1340 (repo band bottom=1540) */
#axsafe{position:absolute;left:0;top:0;width:1080px;height:1920px;transform:translate(120px,-148px);}

#axsafe{transform:translate(140px,-148px)!important;}
.elim-row{width:920px!important;}
.elim-col{width:420px!important;}

/* ===== LF V2 universal centered composition =====
   Optical content center ~= x 880 px.
   Scale 0.78 reduces Shorts-scale typography/graphics.
   Transform origin y=540 pulls high titles down and low graphics up.
   Approx. bottom 220-250 px remains available for subtitles. */
#axsafe{position:absolute!important;left:0!important;top:0!important;width:1080px!important;height:1920px!important;
transform:translate(340px,-148px) scale(.78)!important;transform-origin:540px 540px!important;}

/* LF V2 per-card readability scale */
#axsafe{transform:translate(340px,-148px) scale(0.82)!important;transform-origin:540px 540px!important;}
''',
    "body": r'''<div id="axsafe"><div class="elim-wrap"><div class="elim-row"><div class="elim-div" id="eDiv"></div>
<div class="elim-col"><div class="elim-head elim-ok" id="eH1">__CORRECT_LABEL__<svg class="hd-ic" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"><path d="M5 13l4 4L19 7"/></svg></div><div class="elim-item" id="eI1">__CORRECT_ITEM__</div></div>
<div class="elim-col"><div class="elim-head elim-no" id="eH2">__WRONG_LABEL__<svg class="hd-ic" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"><path d="M6 6l12 12M18 6L6 18"/></svg></div><div class="elim-item" id="eI2">__WRONG_ITEM__</div></div></div>
<div class="elim-rule" id="eRule"></div></div></div>''',
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

__fit(".elim-head",380,0,1,1);__fit(".elim-item",380,380,0,1);
function show(id,a,b,dy){var e=easeOutCubic(clamp((t-a)/(b-a)));var el=document.getElementById(id);if(el){el.style.opacity=e;el.style.transform='translateY('+(dy*(1-e))+'px)';}}
function grow(id,a,b){var e=easeOutCubic(clamp((t-a)/(b-a)));var el=document.getElementById(id);if(el){el.style.transform='scaleX('+e+')';}}
var d=easeOutCubic(clamp((t-S(0,6))/(E(0,6)-S(0,6))));document.getElementById('eDiv').style.transform='translateX(-1px) scaleY('+d+')';
show('eH1',S(1,6),E(1,6),24);show('eI1',S(2,6),E(2,6),30);show('eH2',S(3,6),E(3,6),24);show('eI2',S(4,6),E(4,6),30);grow('eRule',S(5,6),E(5,6));''',
}
