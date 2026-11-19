# VC-SF-017  |  caption-safe-zone pass 2026-08-18  |  SOURCE guard 2026-09-10
CARD = {
    "id": "VC-SF-017",
    "slots": ["TITLE", "C1_LABEL", "C1_VALUE", "C2_LABEL", "C2_VALUE", "C3_LABEL", "C3_VALUE", "SOURCE"],
    "default_duration": 4.5,
    "css": r'''.cb-wrap{position:absolute;left:96px;top:0;width:888px;height:100%;display:flex;flex-direction:column;justify-content:center;}
.cb-title{font-family:'Space Grotesk';font-weight:700;font-size:60px;color:#FFFFFF;text-align:center;margin-bottom:300px;opacity:0;transform:translateY(26px);}
.cb-plot{display:flex;justify-content:space-evenly;align-items:flex-end;height:520px;border-bottom:3px solid rgba(140,160,184,.4);margin-left:auto;margin-right:auto;}
.cb-col{display:flex;flex-direction:column;align-items:center;width:220px;}
.cb-val{font-family:'Space Grotesk';font-weight:700;font-size:56px;color:#FFFFFF;margin-bottom:16px;opacity:0;}
.cb-bar{width:150px;border-radius:14px 14px 0 0;height:0;}
.cb-lab{font-family:Inter;font-weight:600;font-size:34px;color:#8CA0B8;margin-top:22px;text-align:center;}
.src{position:absolute;left:96;bottom:230px;display:flex;align-items:center;gap:20px;opacity:0;}
.src-bar{width:10px;height:44px;background:#00D4AA;border-radius:3px;}
.src-txt{font-family:Inter;font-weight:600;font-size:30px;color:#FFFFFF;}

/* --- caption-safe-zone pass: keep all text above y=1180 (caption band y1180-1540) --- */
.cb-wrap{top:192px !important;height:988px !important;}.src{bottom:650px !important;;left:96px !important;}

/* ax caption-safe v3: center ~y920, clamp bottom<=1340 (repo band bottom=1540) */
#axsafe{position:absolute;left:0;top:0;width:1080px;height:1920px;transform:translateY(184px);}
''',
    "body": r'''<div id="axsafe"><div class="cb-wrap"><div class="cb-title" id="cbTitle">__TITLE__</div>
<div class="cb-plot">
<div class="cb-col" id="cbc1"><div class="cb-val" id="cbv1">__C1_VALUE__</div><div class="cb-bar" id="cbb1" style="background:#00D4AA"></div><div class="cb-lab">__C1_LABEL__</div></div>
<div class="cb-col" id="cbc2"><div class="cb-val" id="cbv2">__C2_VALUE__</div><div class="cb-bar" id="cbb2" style="background:#FF7A3C"></div><div class="cb-lab">__C2_LABEL__</div></div>
<div class="cb-col" id="cbc3"><div class="cb-val" id="cbv3">__C3_VALUE__</div><div class="cb-bar" id="cbb3" style="background:#00D4AA"></div><div class="cb-lab">__C3_LABEL__</div></div>
</div></div>
<div class="src" id="cbSrc"><div class="src-bar"></div><div class="src-txt">SOURCE: __SOURCE__</div></div></div>''',
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

__fit(".cb-title",888,160,0,1);
__fit(".cb-val",200,0,1,1);
__fit(".cb-lab",220,120,0,1);
__fit(".src-txt",820,0,1,0);

/* Dynamic 1/2/3-column handling.
   Blank VALUE+LABEL pairs disappear completely.
   Remaining bars are re-centered and resized as a group. */
var defs=[
  {col:'cbc1',bar:'cbb1',val:'cbv1'},
  {col:'cbc2',bar:'cbb2',val:'cbv2'},
  {col:'cbc3',bar:'cbb3',val:'cbv3'}
];

var visible=[];

defs.forEach(function(d){
    var col=document.getElementById(d.col);
    var val=document.getElementById(d.val);
    var lab=col?col.querySelector('.cb-lab'):null;

    var valueText=val?(val.textContent||'').trim():'';
    var labelText=lab?(lab.textContent||'').trim():'';

    var unresolved=(valueText.indexOf('__')>-1 || labelText.indexOf('__')>-1);
    var empty=(valueText.length===0 && labelText.length===0);

    if(!col || unresolved || empty){
        if(col){col.style.display='none';}
        return;
    }

    col.style.display='';
    var match=valueText.match(/-?[\d.]+/);
    var num=match?parseFloat(match[0]):0;
    visible.push({def:d,col:col,val:val,lab:lab,num:isNaN(num)?0:num});
});

var plot=document.querySelector('.cb-plot');
var N=visible.length;

/* Keep the baseline only under the real bar group, not across an empty slot. */
if(plot){
    if(N===1){
        plot.style.width='390px';
        plot.style.justifyContent='center';
    }else if(N===2){
        plot.style.width='650px';
        plot.style.justifyContent='space-evenly';
    }else{
        plot.style.width='860px';
        plot.style.justifyContent='space-evenly';
    }
}

var mx=1;
visible.forEach(function(v){if(v.num>mx){mx=v.num;}});

/* Timing uses the real active window and holds only the last second. */
var active=Math.max(0.25,x-HOLD);
var p=clamp(t/active);

function seg(a,b){
    return easeOutCubic(clamp((p-a)/(b-a)));
}

/* Title first. */
var title=document.getElementById('cbTitle');
var et=seg(0.00,0.22);
if(title){
    title.style.opacity=et;
    title.style.transform='translateY('+(26*(1-et))+'px)';
}

/* Bars build one-by-one across the visible set. */
visible.forEach(function(v,i){
    var spanStart=0.18 + (N>1 ? i*(0.30/(N-1)) : 0);
    var spanEnd=Math.min(0.86, spanStart+0.42);

    var eb=seg(spanStart,spanEnd);
    var height=(v.num/mx)*400;

    var bar=document.getElementById(v.def.bar);
    if(bar){
        bar.style.height=(eb*height)+'px';
    }

    var ev=seg(Math.min(spanStart+0.10,0.80), Math.min(spanEnd+0.10,0.96));
    if(v.val){
        v.val.style.opacity=ev;
    }
});

/* Optional source. */
var s=document.getElementById('cbSrc');
if(s){
    var source=s.textContent.replace('SOURCE:','').trim();
    var ok=source.length>0 &&
           source.indexOf('__')<0 &&
           source.toUpperCase().indexOf('ILLUSTRATIVE')!==0;
    s.style.opacity=ok?seg(0.78,1.00):0;
}''',
}
