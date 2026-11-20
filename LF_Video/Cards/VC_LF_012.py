# VC-LF-012 | AX long-form centered layout v2
# 1920x1080. Main content is optically centered; lower subtitle band is protected.
# Motion remains duration-aware: animate through duration-1s, hold only the final 1s.
CARD = {
    "id": 'VC-LF-012',
    "slots": ['LOW_PCT', 'HIGH_PCT', 'CAPTION'],
    "default_duration": 4.0,
    "css": r'''.soc-wrap{position:absolute;left:96px;top:0;width:888px;height:100%;display:flex;flex-direction:column;justify-content:center;align-items:center;}
.soc-cap{font-family:'Space Grotesk';font-weight:700;font-size:56px;color:#FFFFFF;margin-bottom:60px;text-align:center;opacity:0;transform:translateY(28px);}
.soc-track{position:relative;width:820px;height:96px;background:rgba(140,160,184,.18);border-radius:16px;overflow:visible;opacity:0;}
.soc-fill{position:absolute;top:0;height:100%;background:#00D4AA;transform:scaleX(0);transform-origin:left;}
.soc-lab{position:absolute;top:-56px;font-family:'Space Grotesk';font-weight:700;font-size:40px;color:#00D4AA;opacity:0;white-space:nowrap;}
.soc-ends{width:820px;display:flex;justify-content:space-between;margin-top:22px;font-family:Inter;font-weight:600;font-size:32px;color:#8CA0B8;opacity:0;}

/* --- caption-safe-zone pass: keep all text above y=1180 (caption band y1180-1540) --- */
.soc-wrap{top:192px !important;height:988px !important;}

/* ax caption-safe v3: center ~y920, clamp bottom<=1340 (repo band bottom=1540) */
#axsafe{position:absolute;left:0;top:0;width:1080px;height:1920px;transform:translate(120px,-147px);}

#axsafe{transform:translate(140px,-147px)!important;}
.soc-wrap{width:930px!important;}
.soc-cap{font-size:52px!important;margin-bottom:54px!important;}

/* ===== LF V2 universal centered composition =====
   Optical content center ~= x 880 px.
   Scale 0.78 reduces Shorts-scale typography/graphics.
   Transform origin y=540 pulls high titles down and low graphics up.
   Approx. bottom 220-250 px remains available for subtitles. */
#axsafe{position:absolute!important;left:0!important;top:0!important;width:1080px!important;height:1920px!important;
transform:translate(340px,-147px) scale(.78)!important;transform-origin:540px 540px!important;}

/* LF V2 per-card readability scale */
#axsafe{transform:translate(340px,-147px) scale(0.90)!important;transform-origin:540px 540px!important;}
''',
    "body": r'''<div id="axsafe"><div class="soc-wrap"><div class="soc-cap" id="socCap">__CAPTION__</div>
<div class="soc-track" id="socTrack"><div class="soc-fill" id="socFill"></div><div class="soc-lab" id="socLo">__LOW_PCT__%</div><div class="soc-lab" id="socHi">__HIGH_PCT__%</div></div>
<div class="soc-ends" id="socEnds"><span>0%</span><span>100%</span></div></div></div>''',
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

var x=(typeof x!=='undefined'&&x>0)?x:4;if(!window.__fit){window.__fit=function(sel,maxW,maxH,line,center){
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

__fit(".soc-cap",820,180,0,1);__fit(".soc-lab",110,0,1,0);
var HOLD=1,ENTER=0.5;
function S(i,N){return N<2?0.12*x:0.12*x+(i/(N-1))*((x-HOLD-ENTER)-0.12*x);}
function E(i,N){return N<2?x-HOLD:S(i,N)+ENTER;}
function show(id,a,b,dy){var e=easeOutCubic(clamp((t-a)/(b-a)));var el=document.getElementById(id);if(el){el.style.opacity=e;el.style.transform='translateY('+(dy*(1-e))+'px)';}}
var N=4;
// order: 0 title -> 1 empty bar -> 2 numbers -> 3 fill wipe -> hold last 1s
show('socCap',S(0,N),E(0,N),28);
var barE=easeOutCubic(clamp((t-S(1,N))/(E(1,N)-S(1,N))));
var trk=document.getElementById('socTrack');if(trk)trk.style.opacity=barE;
var ends=document.getElementById('socEnds');if(ends)ends.style.opacity=barE;
var lo=parseFloat(('__LOW_PCT__'.match(/[\d.]+/)||[20])[0]);var hi=parseFloat(('__HIGH_PCT__'.match(/[\d.]+/)||[80])[0]);
var fill=document.getElementById('socFill');var track=820;var loF=lo/100,hiF=hi/100;
fill.style.left=(loF*track)+'px';fill.style.width=(track*(hiF-loF))+'px';fill.style.transformOrigin='left';
var elo=document.getElementById('socLo'),ehi=document.getElementById('socHi');
elo.style.left=(loF*track-10)+'px';ehi.style.left=(hiF*track-70)+'px';
var numE=easeOutCubic(clamp((t-S(2,N))/(E(2,N)-S(2,N))));elo.style.opacity=numE;ehi.style.opacity=numE;
fill.style.transform='scaleX('+easeOutCubic(clamp((t-S(3,N))/(E(3,N)-S(3,N))))+')';''',
}
