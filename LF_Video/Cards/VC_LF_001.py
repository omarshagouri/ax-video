# VC-LF-001 | AX long-form centered layout v2
# 1920x1080. Main content is optically centered; lower subtitle band is protected.
# Motion remains duration-aware: animate through duration-1s, hold only the final 1s.
CARD = {
    "id": 'VC-LF-001',
    "slots": ['KICKER', 'NUM', 'PCT'],
    "default_duration": 3.0,
    "css": r'''
        #axsafe{
            position:absolute;
            inset:0;
            width:1920px;
            height:1080px;
        }
        #block{
            position:absolute;
            left:120px;
            top:285px;
            width:1120px;
            text-align:center;
        }
        .kicker{
            color:#8CA0B8;
            font-size:44px;
            font-weight:500;
            letter-spacing:7px;
            text-transform:uppercase;
            margin:0 0 18px;
            clip-path:inset(0 100% 0 0);
        }
        .hero{
            color:#FFFFFF;
            font-size:260px;
            font-weight:700;
            margin:0;
            line-height:0.95;
            opacity:0;
            transform:scale(0.85);
            transform-origin:center center;
        }
        .hero .key{ color:#00D4AA; }
    
/* LF v1 composition polish */
#block{left:120px!important;top:285px!important;width:1080px!important;text-align:center!important;}
.kicker{font-size:48px!important;letter-spacing:7px!important;color:#9CB1C8!important;}
.hero{font-size:300px!important;}

/* ===== LF V2 centered composition ===== */
#axsafe{position:absolute!important;inset:0!important;width:1920px!important;height:1080px!important;transform:none!important;}
#block{position:absolute!important;left:350px!important;top:275px!important;width:1060px!important;text-align:center!important;}
.kicker{font-size:38px!important;line-height:1.28!important;letter-spacing:6px!important;color:#9CB1C8!important;margin-bottom:24px!important;}
.hero{font-size:230px!important;line-height:.95!important;}
.hero .key{color:#00D4AA!important;}
''',
    "body": r'''<div id="axsafe">
        <div id="block">
            <p class="kicker" id="kick">__KICKER__</p>
            <h1 class="hero" id="hero">__NUM__<span class="key">__PCT__</span></h1>
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
while(size>18&&g<240&&(el.scrollWidth>el.clientWidth+0.5||(maxH&&el.scrollHeight>maxH+0.5))){size-=2;el.style.fontSize=size+'px';g++;}
if(ready){el.dataset.fitpx=size;el.dataset.fitok='1';}}
};}

var keyEl=document.querySelector('.hero .key');
if(keyEl && keyEl.textContent.trim().length>3){
    keyEl.style.display='block';
    keyEl.style.fontSize='54px';
    keyEl.style.marginTop='22px';
    keyEl.style.fontFamily='Inter, sans-serif';
    keyEl.style.fontWeight='600';
    keyEl.style.whiteSpace='normal';
}

__fit('.kicker',1040,110,0,1);
__fit('.hero',980,280,1,1);

/*
x = total card duration from the renderer.
Motion uses the whole card duration minus the final 1 second.
The last 1 second is a settled hold.
*/
var x=(typeof x!=='undefined' && x>0)?x:3.0;
var HOLD=1.0;
var ACTIVE=Math.max(0.25,x-HOLD);
var p=clamp(t/ACTIVE);

var kick=document.getElementById('kick');
var hero=document.getElementById('hero');

/* Preserve the original motion proportions, but stretch them across ACTIVE. */
var we=easeOutCubic(clamp(p/0.64));
kick.style.clipPath='inset(0 '+(100*(1-we))+'% 0 0)';

var pp=clamp((p-0.60)/0.40);
hero.style.opacity=pp>0?1:0;

var scale;
if(pp<0.6){scale=0.85+(1.05-0.85)*easeOutCubic(pp/0.6);}
else{scale=1.05-(1.05-1.0)*easeOutCubic((pp-0.6)/0.4);}
hero.style.transform='scale('+scale+')';
    ''',
}
