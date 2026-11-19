# VC-LF-010 | AX long-form centered layout v2
# 1920x1080. Main content is optically centered; lower subtitle band is protected.
# Motion remains duration-aware: animate through duration-1s, hold only the final 1s.
CARD = {
    "id": 'VC-LF-010',
    "slots": ['COL1_TITLE', 'COL1_POINT', 'COL2_TITLE', 'COL2_POINT', 'COL3_TITLE', 'COL3_POINT'],
    "default_duration": 4.5,
    "css": r'''.col-wrap{position:absolute;left:0;top:0;width:1080px;height:100%;display:flex;justify-content:center;align-items:center;gap:40px;}
.col{width:270px;min-height:360px;background:rgba(10,22,40,.55);border:1px solid rgba(0,212,170,.35);border-radius:20px;padding:36px 26px;opacity:0;transform:translateY(40px);}
.col-t{font-family:'Space Grotesk';font-weight:700;font-size:40px;color:#00D4AA;line-height:1.1;}
.col-bar{width:52px;height:4px;background:#00D4AA;border-radius:2px;margin:20px 0 24px;}
.col-p{font-family:Inter;font-weight:400;font-size:38px;line-height:1.32;color:#FFFFFF;}

/* --- caption-safe-zone pass: keep all text above y=1180 (caption band y1180-1540) --- */
.col-wrap{top:192px !important;height:988px !important;}

/* ax caption-safe v3: center ~y920, clamp bottom<=1340 (repo band bottom=1540) */
#axsafe{position:absolute;left:0;top:0;width:1080px;height:1920px;transform:translate(120px,-145px);}

#axsafe{transform:translate(120px,-145px)!important;}
.col-wrap{width:1160px!important;gap:34px!important;}
.col{width:300px!important;min-height:330px!important;padding:32px 24px!important;}
.col-t{font-size:38px!important;}
.col-p{font-size:34px!important;}

/* ===== LF V2 universal centered composition =====
   Optical content center ~= x 880 px.
   Scale 0.78 reduces Shorts-scale typography/graphics.
   Transform origin y=540 pulls high titles down and low graphics up.
   Approx. bottom 220-250 px remains available for subtitles. */
#axsafe{position:absolute!important;left:0!important;top:0!important;width:1080px!important;height:1920px!important;
transform:translate(340px,-145px) scale(.78)!important;transform-origin:540px 540px!important;}

/* LF V2 per-card readability scale */
#axsafe{transform:translate(340px,-145px) scale(0.90)!important;transform-origin:540px 540px!important;}
''',
    "body": r'''<div id="axsafe"><div class="col-wrap">
<div class="col" id="c1"><div class="col-t">__COL1_TITLE__</div><div class="col-bar"></div><div class="col-p">__COL1_POINT__</div></div>
<div class="col" id="c2"><div class="col-t">__COL2_TITLE__</div><div class="col-bar"></div><div class="col-p">__COL2_POINT__</div></div>
<div class="col" id="c3"><div class="col-t">__COL3_TITLE__</div><div class="col-bar"></div><div class="col-p">__COL3_POINT__</div></div></div></div>''',
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

__fit(".col-t",224,0,1,1);__fit(".col-p",224,240,0,1);
function show(id,a,b,dy){var e=easeOutCubic(clamp((t-a)/(b-a)));var el=document.getElementById(id);if(el){el.style.opacity=e;el.style.transform='translateY('+(dy*(1-e))+'px)';}}
function grow(id,a,b){var e=easeOutCubic(clamp((t-a)/(b-a)));var el=document.getElementById(id);if(el){el.style.transform='scaleX('+e+')';}}
/* Optional-column handling:
   A column is visible only when it contains real title/point text.
   Empty strings are treated exactly like missing placeholders.
   Visible columns are re-timed using the actual visible-column count. */
var filled=[];
['c1','c2','c3'].forEach(function(id){
  var el=document.getElementById(id);
  if(!el){return;}
  var titleEl=el.querySelector('.col-t');
  var pointEl=el.querySelector('.col-p');
  var title=titleEl?(titleEl.textContent||'').trim():'';
  var point=pointEl?(pointEl.textContent||'').trim():'';
  var unresolved=(title.indexOf('__')>-1 || point.indexOf('__')>-1);
  var empty=(title.length===0 && point.length===0);
  if(unresolved || empty){
    el.style.display='none';
  }else{
    el.style.display='';
    filled.push(id);
  }
});
filled.forEach(function(id,i){
  show(id,S(i,filled.length),E(i,filled.length),40);
});''',
}
