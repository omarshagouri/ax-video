# VC-SF-009  |  caption-safe-zone pass 2026-08-18  |  SOURCE guard 2026-09-10
CARD = {
    "id": "VC-SF-009",
    "slots": ["MYTH_LINE", "FACT_LINE", "SOURCE"],
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
#axsafe{position:absolute;left:0;top:0;width:1080px;height:1920px;transform:translateY(100px);}
''',
    "body": r'''<div id="axsafe"><div class="mf-wrap"><div class="mf-tag mf-myth-tag" id="mfT1">The myth</div><div class="mf-myth" id="mfMyth">__MYTH_LINE__</div><div class="mf-gap"></div><div class="mf-tag mf-fact-tag" id="mfT2">The data</div><div class="mf-fact" id="mfFact">__FACT_LINE__</div></div>
<div class="src" id="mfSrc"><div class="src-bar"></div><div class="src-txt">SOURCE: __SOURCE__</div></div></div>''',
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

__fit(".mf-myth",888,300,0,0);__fit(".mf-fact",888,320,0,0);__fit(".src-txt",820,0,1,0);
function show(id,a,b,dy){var e=easeOutCubic(clamp((t-a)/(b-a)));var el=document.getElementById(id);if(el){el.style.opacity=e;el.style.transform='translateY('+(dy*(1-e))+'px)';}}
function grow(id,a,b){var e=easeOutCubic(clamp((t-a)/(b-a)));var el=document.getElementById(id);if(el){el.style.transform='scaleX('+e+')';}}
show('mfT1',S(0,5),E(0,5),20);show('mfMyth',S(1,5),E(1,5),28);show('mfT2',S(2,5),E(2,5),20);show('mfFact',S(3,5),E(3,5),30);
var s=document.getElementById('mfSrc');if(s){var st=(s.textContent.indexOf('__')<0 && s.textContent.replace('SOURCE:','').trim().length>0 && s.textContent.replace('SOURCE:','').trim().toUpperCase().indexOf('ILLUSTRATIVE')!==0);s.style.opacity=st?easeOutCubic(clamp((t-S(4,5))/(E(4,5)-S(4,5)))):0;}''',
}
