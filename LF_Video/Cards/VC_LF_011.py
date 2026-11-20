# VC-LF-011 | AX long-form centered layout v2
# 1920x1080. Main content is optically centered; lower subtitle band is protected.
# Motion remains duration-aware: animate through duration-1s, hold only the final 1s.
CARD = {
    "id": 'VC-LF-011',
    "slots": ['HEADER', 'ITEM1', 'ITEM2', 'ITEM3', 'ITEM4', 'REVEAL'],
    "default_duration": 5.0,
    "css": r'''.list-wrap{position:absolute;left:96px;top:0;width:888px;height:100%;display:flex;flex-direction:column;justify-content:center;}
.list-h{font-family:'Space Grotesk';font-weight:700;font-size:58px;color:#FFFFFF;margin-bottom:44px;opacity:0;transform:translateY(28px);}
.li{display:flex;align-items:center;gap:28px;margin-bottom:34px;opacity:0;transform:translateY(30px);}
.li-n{flex:0 0 auto;width:66px;height:66px;border-radius:16px;background:#00D4AA;color:#0A1628;font-family:'Space Grotesk';font-weight:700;font-size:38px;display:flex;align-items:center;justify-content:center;}
.li-t{font-family:Inter;font-weight:500;font-size:46px;color:#FFFFFF;line-height:1.2;}

/* --- caption-safe-zone pass: keep all text above y=1180 (caption band y1180-1540) --- */
.list-wrap{top:192px !important;height:988px !important;}

/* ax caption-safe v3: center ~y920, clamp bottom<=1340 (repo band bottom=1540) */
#axsafe{position:absolute;left:0;top:0;width:1080px;height:1920px;transform:translate(120px,-135px);}

#axsafe{transform:translate(140px,-135px)!important;}
.list-wrap{width:930px!important;}
.list-h{font-size:54px!important;margin-bottom:34px!important;}
.li{margin-bottom:26px!important;}
.li-t{font-size:40px!important;}

/* ===== LF V2 universal centered composition =====
   Optical content center ~= x 880 px.
   Scale 0.78 reduces Shorts-scale typography/graphics.
   Transform origin y=540 pulls high titles down and low graphics up.
   Approx. bottom 220-250 px remains available for subtitles. */
#axsafe{position:absolute!important;left:0!important;top:0!important;width:1080px!important;height:1920px!important;
transform:translate(340px,-135px) scale(.78)!important;transform-origin:540px 540px!important;}

/* LF V2 per-card readability scale */
#axsafe{transform:translate(340px,-135px) scale(0.90)!important;transform-origin:540px 540px!important;}
''',
    "body": r'''<div id="axsafe"><div class="list-wrap"><div class="list-h" id="lH">__HEADER__</div>
<div class="li" id="li1"><div class="li-n">1</div><div class="li-t">__ITEM1__</div></div>
<div class="li" id="li2"><div class="li-n">2</div><div class="li-t">__ITEM2__</div></div>
<div class="li" id="li3"><div class="li-n">3</div><div class="li-t">__ITEM3__</div></div>
<div class="li" id="li4"><div class="li-n">4</div><div class="li-t">__ITEM4__</div></div></div></div>''',
    "seek": r'''
/* AX LF timing normalization:
   real card duration = x
   animation window   = x - 1.0 s
   final 1.0 s        = settled hold
   The original card motion is remapped into that active window.
*/
var __lfRealX=(typeof x!=='undefined'&&x>0)?x:5;
var __lfActive=Math.max(0.25,__lfRealX-1.0);
var __lfP=clamp(t/__lfActive);
t=__lfP*4;
x=5;

var x=(typeof x!=='undefined'&&x>0)?x:4;var HOLD=1,ENTER=0.5;function S(i,N){return N<2?0.12*x:0.12*x+(i/(N-1))*((x-HOLD-ENTER)-0.12*x);}function E(i,N){return N<2?x-HOLD:S(i,N)+ENTER;}
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

__fit(".list-h",888,150,0,0);__fit(".li-t",740,140,0,0);
function show(id,a,b,dy){var e=easeOutCubic(clamp((t-a)/(b-a)));var el=document.getElementById(id);if(el){el.style.opacity=e;el.style.transform='translateY('+(dy*(1-e))+'px)';}}
// hide any item whose TEXT is blank or still a placeholder (chip included), collect the filled ones
var filled=[];
for(var i=1;i<=4;i++){var el=document.getElementById('li'+i);if(!el)continue;var tx=el.querySelector('.li-t');var v=tx?tx.textContent.trim():'';
  if(v && v.indexOf('__')<0){filled.push(i);el.style.display='';}else{el.style.display='none';}}
// REVEAL = how many items to show this time (blank -> show all filled, original cascade)
var rev=parseInt(('__REVEAL__'.match(/\d+/)||[''])[0],10);
var noRev=isNaN(rev);
var n=noRev?filled.length:rev;
var N=1+filled.length;show('lH',S(0,N),E(0,N),28);
var k=0;
for(var j=0;j<filled.length;j++){var i=filled[j],el=document.getElementById('li'+i);
  if(i>n){el.style.display='none';continue;}
  if(noRev){show('li'+i,S(1+k,N),E(1+k,N),30);k++;}      // no REVEAL: cascade all (unchanged)
  else if(i<n){el.style.opacity='1';el.style.transform='none';}   // already-revealed items sit static
  else{show('li'+i,S(1,2),E(1,2),30);}                          // the newest item animates in
}
''',
}
