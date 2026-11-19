# VC-SF-013  |  caption-safe-zone pass 2026-08-18
CARD = {
    "id": "VC-SF-013",
    "slots": ["STEP1", "STEP2", "STEP3", "STEP4"],
    "default_duration": 4.5,
    "css": r'''.pr-wrap{position:absolute;left:96px;top:0;width:888px;height:100%;display:flex;flex-direction:column;justify-content:center;align-items:center;gap:30px;}
.pr-step{width:640px;padding:34px 30px;background:rgba(10,22,40,.6);border:1px solid rgba(0,212,170,.4);border-radius:18px;font-family:'Space Grotesk';font-weight:700;font-size:52px;color:#FFFFFF;text-align:center;opacity:0;transform:translateY(34px);}
.pr-arr{font-size:52px;color:#00D4AA;opacity:0;transform:translateY(10px);line-height:0.6;}

/* --- caption-safe-zone pass: keep all text above y=1180 (caption band y1180-1540) --- */
.pr-wrap{top:192px !important;height:988px !important;}

/* ax caption-safe v3: center ~y920, clamp bottom<=1340 (repo band bottom=1540) */
#axsafe{position:absolute;left:0;top:0;width:1080px;height:1920px;transform:translateY(235px);}
''',
    "body": r'''<div id="axsafe"><div class="pr-wrap">
<div class="pr-step" id="ps1">__STEP1__</div><div class="pr-arr" id="pa1">&#9660;</div>
<div class="pr-step" id="ps2">__STEP2__</div><div class="pr-arr" id="pa2">&#9660;</div>
<div class="pr-step" id="ps3">__STEP3__</div><div class="pr-arr" id="pa3">&#9660;</div>
<div class="pr-step" id="ps4">__STEP4__</div></div></div>''',
    "seek": r'''
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

__fit(".pr-step",640,160,0,1);
function show(id,a,b,dy){var e=easeOutCubic(clamp((t-a)/(b-a)));var el=document.getElementById(id);if(el){el.style.opacity=e;el.style.transform='translateY('+(dy*(1-e))+'px)';}}
function grow(id,a,b){var e=easeOutCubic(clamp((t-a)/(b-a)));var el=document.getElementById(id);if(el){el.style.transform='scaleX('+e+')';}}
/* Optional process steps:
   - blank strings and unresolved placeholders are hidden
   - arrows appear only BETWEEN real steps
   - entrance timing is recalculated from the number of visible elements */
var stepIds=['ps1','ps2','ps3','ps4'];
var arrowIds=['pa1','pa2','pa3'];
var visible=[];

stepIds.forEach(function(id){
    var el=document.getElementById(id);
    if(!el){return;}
    var txt=(el.textContent||'').trim();
    var empty=(txt.length===0 || txt.indexOf('__')>-1);
    if(empty){
        el.style.display='none';
    }else{
        el.style.display='';
        visible.push(el);
    }
});

/* Start with every arrow hidden. */
arrowIds.forEach(function(id){
    var a=document.getElementById(id);
    if(a){a.style.display='none';}
});

/* Show the arrow that follows each visible step except the last one. */
for(var i=0;i<visible.length-1;i++){
    var idx=stepIds.indexOf(visible[i].id);
    if(idx>=0 && idx<arrowIds.length){
        var a=document.getElementById(arrowIds[idx]);
        if(a){a.style.display='';}
    }
}

/* Animate only real steps/arrows, in DOM order. */
var sequence=[];
stepIds.forEach(function(id,idx){
    var el=document.getElementById(id);
    if(el && el.style.display!=='none'){
        sequence.push({id:id,dy:34});
        if(idx<arrowIds.length){
            var a=document.getElementById(arrowIds[idx]);
            if(a && a.style.display!=='none'){
                sequence.push({id:arrowIds[idx],dy:10});
            }
        }
    }
});

var N=sequence.length;
sequence.forEach(function(item,i){
    show(item.id,S(i,N),E(i,N),item.dy);
});''',
}
