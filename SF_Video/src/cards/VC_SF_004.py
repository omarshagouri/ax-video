# VC-SF-004  |  caption-safe-zone pass 2026-08-18
CARD = {
    "id": "VC-SF-004",
    "slots": ["KICKER", "HOOK"],
    "default_duration": 4.0,
    "css": r'''
.hook-wrap{
  position:absolute; left:96px; top:0;
  width:840px; height:100%;
  display:flex; flex-direction:column; justify-content:center; align-items:flex-start;
}
.hook-krow{ display:flex; align-items:center; gap:22px; margin-bottom:30px; }
.hook-bar{
  width:66px; height:5px; background:#00D4AA; border-radius:2px;
  transform:scaleX(0); transform-origin:left center;
}
.hook-kicker{
  font-family:'Space Grotesk',sans-serif; font-weight:600; font-size:32px;
  letter-spacing:0.14em; text-transform:uppercase; color:#00D4AA;
  opacity:0; transform:translateY(16px);
}
.hook-line{
  font-family:'Space Grotesk',sans-serif; font-weight:700; font-size:92px;
  line-height:1.06; color:#FFFFFF;
  opacity:0; transform:translateY(48px);
}


/* --- caption-safe-zone pass: keep all text above y=1180 (caption band y1180-1540) --- */
.hook-wrap{top:192px !important;height:988px !important;}

/* ax caption-safe v3: center ~y920, clamp bottom<=1340 (repo band bottom=1540) */
#axsafe{position:absolute;left:0;top:0;width:1080px;height:1920px;transform:translateY(230px);}
''',
    "body": r'''<div id="axsafe">
<div class="hook-wrap">
  <div class="hook-krow">
    <div class="hook-bar" id="hkBar"></div>
    <div class="hook-kicker" id="hkKicker">__KICKER__</div>
  </div>
  <div class="hook-line" id="hkLine">__HOOK__</div>
</div>
</div>''',
    "seek": r'''
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

__fit(".hook-kicker",840,0,1,0);__fit(".hook-line",840,900,0,0);

// 1) accent bar wipes in left-to-right (0.00 - 0.60s)
var eBar = easeOutCubic(clamp(t / 0.60));
document.getElementById('hkBar').style.transform = 'scaleX(' + eBar + ')';

// 2) kicker fades + rises (0.55 - 1.15s)
var eK = easeOutCubic(clamp((t - 0.55) / 0.60));
var k = document.getElementById('hkKicker');
k.style.opacity = eK;
k.style.transform = 'translateY(' + (16 * (1 - eK)) + 'px)';

// 3) hook line rises + fades (1.15 - 2.25s), then hold
var eH = easeOutCubic(clamp((t - 1.15) / 1.10));
var line = document.getElementById('hkLine');
line.style.opacity = eH;
line.style.transform = 'translateY(' + (48 * (1 - eH)) + 'px)';
''',
}
