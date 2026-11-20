# VC-SH-001  |  auto-fit safe-zone patch applied 2026-08-09
# Text shrink-to-fit added at top of seek(); css/body unchanged.
CARD = {
    "id": "VC-SH-001",
    "slots": ["KICKER", "NUM", "PCT"],
    "default_duration": 3.0,
    "css": r'''
        #block{ position:absolute; top:430px; left:0; width:1080px; text-align:center; }
        .kicker{ color:#8CA0B8; font-size:56px; font-weight:500; letter-spacing:6px;
                 text-transform:uppercase; margin:0 0 10px; clip-path: inset(0 100% 0 0); }
        .hero{ color:#FFFFFF; font-size:300px; font-weight:700; margin:0; line-height:1;
               opacity:0; transform: scale(0.85); }
        .hero .key{ color:#00D4AA; }
    
/* ax caption-safe v3: center ~y920, clamp bottom<=1340 (repo band bottom=1540) */
#axsafe{position:absolute;left:0;top:0;width:1080px;height:1920px;transform:translateY(318px);}
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
while(size>16&&g<240&&(el.scrollWidth>el.clientWidth+0.5||(maxH&&el.scrollHeight>maxH+0.5))){size-=2;el.style.fontSize=size+'px';g++;}
if(ready){el.dataset.fitpx=size;el.dataset.fitok='1';}}
};}

// 1. Run the auto-layout adjustment FIRST
var keyEl = document.querySelector('.hero .key');
if (keyEl && keyEl.textContent.trim().length > 3) {
    keyEl.style.display = 'block';
    keyEl.style.fontSize = '65px';
    keyEl.style.marginTop = '15px';
    keyEl.style.fontFamily = 'Inter, sans-serif';
    keyEl.style.fontWeight = '600';
    keyEl.style.whiteSpace = 'normal';
}

// 2. THEN run the shrink-to-fit calculator
__fit(".kicker",900,0,0,1);
__fit(".hero",900,0,1,1);

var kick = document.getElementById('kick');
var hero = document.getElementById('hero');
var we = easeOutCubic(clamp((t - 0.0) / 1.0));
kick.style.clipPath = 'inset(0 ' + (100 * (1 - we)) + '% 0 0)';
var pp = clamp((t - 1.0) / 0.5);
hero.style.opacity = pp > 0 ? 1 : 0;
var scale;
if (pp < 0.6){ scale = 0.85 + (1.05 - 0.85) * easeOutCubic(pp / 0.6); }
else { scale = 1.05 - (1.05 - 1.0) * easeOutCubic((pp - 0.6) / 0.4); }
hero.style.transform = 'scale(' + scale + ')';
    ''',
}
