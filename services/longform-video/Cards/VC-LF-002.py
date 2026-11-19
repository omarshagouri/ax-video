# VC-LF-002 | AX long-form centered layout v2
# 1920x1080. Main content is optically centered; lower subtitle band is protected.
# Motion remains duration-aware: animate through duration-1s, hold only the final 1s.
CARD = {
    "id": 'VC-LF-002',
    "slots": ['TITLE', 'VALUE_A', 'LABEL_A', 'VALUE_B', 'LABEL_B', 'SOURCE'],
    "default_duration": 3.0,
    "css": r'''
        #title{
            position:absolute; top:230px; left:0; width:1080px; text-align:center;
            color:#FFFFFF; font-size:76px; font-weight:700; opacity:0;
        }
        .baseline{
            position:absolute; bottom:620px; left:240px; width:600px; height:3px;
            background:#8CA0B8; opacity:0.35;
        }
        .bar{
            position:absolute; bottom:620px; width:200px; height:0;
            transform-origin:bottom center; transform:scaleY(0);
            border-radius:4px 4px 0 0;
        }
        #barA{ left:300px; background:#00D4AA; }
        #barB{ left:600px; background:#FF7A3C; }
        .val{
            position:absolute; width:200px; text-align:center;
            color:#FFFFFF; font-size:64px; font-weight:700; opacity:0;
        }
        #valA{ left:300px; } #valB{ left:600px; }
        .axis{
            position:absolute; bottom:520px;
            width:260px; text-align:center;
            color:#8CA0B8; font-size:34px; line-height:1.08; font-weight:500; opacity:0;
        }
        #labA{ left:270px; } #labB{ left:570px; }
        #source{
            position:absolute; bottom:340px; left:90px;
            color:#8CA0B8; font-size:30px; font-weight:400; opacity:0;
            border-left:12px solid #00D4AA; padding-left:10px;
        }
    

/* --- caption-safe-zone pass: keep all text above y=1180 (caption band y1180-1540) --- */
.baseline{bottom:800px !important;}.bar{bottom:800px !important;}.axis{bottom:700px !important;}#source{bottom:650px !important;}

/* ax caption-safe v3: center ~y920, clamp bottom<=1340 (repo band bottom=1540) */
#axsafe{position:absolute;left:0;top:0;width:1080px;height:1920px;transform:translate(120px,-139px);}

/* LF bar-chart framing */
#axsafe{transform:translate(150px,-139px)!important;}
#title{font-size:68px!important;}
#source{font-size:26px!important;}

/* ===== LF V2 universal centered composition =====
   Optical content center ~= x 880 px.
   Scale 0.78 reduces Shorts-scale typography/graphics.
   Transform origin y=540 pulls high titles down and low graphics up.
   Approx. bottom 220-250 px remains available for subtitles. */
#axsafe{position:absolute!important;left:0!important;top:0!important;width:1080px!important;height:1920px!important;
transform:translate(340px,-139px) scale(.78)!important;transform-origin:540px 540px!important;}

/* LF V2 per-card readability scale */
#axsafe{transform:translate(340px,-139px) scale(0.78)!important;transform-origin:540px 540px!important;}
#source{bottom:560px!important;left:150px!important;width:780px!important;}
''',
    "body": r'''<div id="axsafe">
        <div id="title">__TITLE__</div>
        <div class="baseline"></div>
        <div class="bar" id="barA"></div>
        <div class="bar" id="barB"></div>
        <div class="val" id="valA">__VALUE_A__</div>
        <div class="val" id="valB">__VALUE_B__</div>
        <div class="axis" id="labA">__LABEL_A__</div>
        <div class="axis" id="labB">__LABEL_B__</div>
        <div id="source">__SOURCE__</div>
    </div>''',
    "seek": r'''
/* AX LF timing normalization:
   real card duration = x
   animation window   = x - 1.0 s
   final 1.0 s        = settled hold
   The original card motion is remapped into that active window.
*/
var __lfRealX=(typeof x!=='undefined'&&x>0)?x:3;
var __lfActive=Math.max(0.25,__lfRealX-1.0);
var __lfP=clamp(t/__lfActive);
t=__lfP*2;
x=3;

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

__fit("#title",1000,180,0,1);__fit(".val",220,0,1,1);__fit(".axis",260,100,0,1);__fit("#source",900,90,0,0);

        var title=document.getElementById('title');
        var barA=document.getElementById('barA'), barB=document.getElementById('barB');
        var valA=document.getElementById('valA'), valB=document.getElementById('valB');
        var labA=document.getElementById('labA'), labB=document.getElementById('labB');
        var source=document.getElementById('source');

        var a=parseFloat(valA.textContent)||0, b=parseFloat(valB.textContent)||0;
        var maxV=Math.max(a,b,0.0001), maxH=450;
        var hA=maxH*a/maxV, hB=maxH*b/maxV;
        barA.style.height=hA+'px'; barB.style.height=hB+'px';
   valA.style.bottom=(800+hA+18)+'px';
valB.style.bottom=(800+hB+18)+'px';

        var te=easeOutCubic(clamp(t/0.6));
        title.style.opacity=te;
        title.style.transform='translateY('+(30*(1-te))+'px)';

        var fe=clamp((t-S(0,3))/(E(0,3)-S(0,3)));
        labA.style.opacity=fe; labB.style.opacity=fe; var _sv=(source.textContent||'').trim(); source.style.opacity=(_sv.length>0 && _sv.indexOf('__')<0 && _sv.toUpperCase().indexOf('ILLUSTRATIVE')!==0)?fe:0;

        var ge=easeOutCubic(clamp((t-S(1,3))/(E(1,3)-S(1,3))));
        barA.style.transform='scaleY('+ge+')';
        barB.style.transform='scaleY('+ge+')';

        var ve=easeOutCubic(clamp((t-S(2,3))/(E(2,3)-S(2,3))));
        valA.style.opacity=ve; valB.style.opacity=ve;
        valA.style.transform='translateY('+(18*(1-ve))+'px)';
        valB.style.transform='translateY('+(18*(1-ve))+'px)';
    ''',
}
