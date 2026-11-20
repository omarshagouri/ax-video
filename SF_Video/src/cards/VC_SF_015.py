# VC-SF-015  |  caption-safe-zone pass 2026-08-18  |  SOURCE guard 2026-09-10
CARD = {
    "id": "VC-SF-015",
    "slots": ["QUOTE_TEXT", "SOURCE_NAME"],
    "default_duration": 4.5,
    "css": r'''.q-wrap{position:absolute;left:96px;top:0;width:888px;height:100%;display:flex;flex-direction:column;justify-content:center;}
.q-mark{font-family:'Space Grotesk';font-weight:700;font-size:200px;line-height:0.6;color:#00D4AA;height:120px;opacity:0;transform:translateY(20px);}
.q-text{font-family:'Space Grotesk';font-weight:600;font-size:64px;line-height:1.24;color:#FFFFFF;opacity:0;transform:translateY(30px);}
.q-src{display:flex;align-items:center;gap:20px;margin-top:44px;opacity:0;transform:translateY(20px);}
.q-bar{width:52px;height:4px;background:#00D4AA;border-radius:2px;}
.q-name{font-family:Inter;font-weight:600;font-size:38px;color:#8CA0B8;letter-spacing:.02em;}

/* --- caption-safe-zone pass: keep all text above y=1180 (caption band y1180-1540) --- */
.q-wrap{top:192px !important;height:988px !important;}

/* ax caption-safe v3: center ~y920, clamp bottom<=1340 (repo band bottom=1540) */
#axsafe{position:absolute;left:0;top:0;width:1080px;height:1920px;transform:translateY(238px);}
''',
    "body": r'''<div id="axsafe"><div class="q-wrap"><div class="q-mark" id="qMark">&#8220;</div><div class="q-text" id="qText">__QUOTE_TEXT__</div>
<div class="q-src" id="qSrc"><div class="q-bar"></div><div class="q-name">__SOURCE_NAME__</div></div></div></div>''',
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

__fit(".q-text",888,520,0,0);__fit(".q-name",740,0,1,0);
function show(id,a,b,dy){var e=easeOutCubic(clamp((t-a)/(b-a)));var el=document.getElementById(id);if(el){el.style.opacity=e;el.style.transform='translateY('+(dy*(1-e))+'px)';}}
function grow(id,a,b){var e=easeOutCubic(clamp((t-a)/(b-a)));var el=document.getElementById(id);if(el){el.style.transform='scaleX('+e+')';}}
show('qMark',S(0,3),E(0,3),20);show('qText',S(1,3),E(1,3),30);(function(){var qs=document.getElementById('qSrc');var nm=qs?(qs.textContent||'').trim():'';if(nm.length>0 && nm.indexOf('__')<0 && nm.toUpperCase().indexOf('ILLUSTRATIVE')!==0){show('qSrc',S(2,3),E(2,3),20);}else if(qs){qs.style.opacity=0;}})();''',
}
