# VC-SF-018  |  Thumbnail / first-frame card (static composite)
CARD = {
    "id": "VC-SF-018",
    "slots": ["SERIES", "HEADLINE", "SUBHEAD"],
    "default_duration": 1.0,
    "css": r'''
@import url('https://fonts.googleapis.com/css2?family=Space+Mono:wght@400;700&display=swap');
.tc-root{ position:absolute; inset:0; background:#0A1628; overflow:hidden; }
.tc-bg{ position:absolute; inset:0; background-image:url("__BG_SRC__");
        background-size:cover; background-position:center; background-repeat:no-repeat; }
.tc-veil{ position:absolute; inset:0; background:
    linear-gradient(180deg, rgba(10,22,40,.72) 0%, rgba(10,22,40,.30) 22%,
      rgba(10,22,40,.00) 42%, rgba(10,22,40,.00) 60%, rgba(10,22,40,.55) 84%, rgba(10,22,40,.90) 100%); }
.tc-top{ position:absolute; top:150px; left:0; width:1080px; box-sizing:border-box; padding:0 70px;
         display:flex; flex-direction:column; align-items:center; text-align:center; gap:18px; }
.tc-series{ margin:0; font-family:'Space Mono', monospace; font-weight:400; font-size:30px;
            letter-spacing:5px; color:#b3c6d7; text-transform:uppercase; text-shadow:0 2px 20px rgba(0,0,0,.5); }
.tc-head{ margin:0; font-family:'Space Grotesk',sans-serif; font-weight:700; font-size:108px;
          line-height:1.06; letter-spacing:-1px; color:#FFFFFF; text-shadow:0 4px 30px rgba(0,0,0,.5); }
.tc-head .key{ color:#00D4AA; }
.tc-sub{ margin:0; font-family:'Space Grotesk',sans-serif; font-weight:600; font-size:44px;
         line-height:1.18; color:#FFFFFF; text-shadow:0 3px 22px rgba(0,0,0,.5); }
.tc-logo{ position:absolute; left:0; bottom:80px; width:1080px; text-align:center; }
.tc-logo img{ height:180px; width:auto; display:inline-block; filter:drop-shadow(0 4px 20px rgba(0,0,0,.6)); }
''',
    "body": r'''
<div class="tc-root">
  <div class="tc-bg" id="tcBg"></div>
  <div class="tc-veil"></div>
  <div class="tc-top">
    <p class="tc-series" id="tcSeries">__SERIES__</p>
    <h1 class="tc-head" id="tcHead">__HEADLINE__</h1>
    <p class="tc-sub" id="tcSub">__SUBHEAD__</p>
  </div>
  <div class="tc-logo" id="tcLogo"><img id="tcLogoImg" src="__LOGO_SRC__" alt=""></div>
</div>
''',
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

var se=document.getElementById('tcSeries');
if(se){ var stext=se.textContent.trim(); if(!stext || stext.indexOf('__SERIES')>-1){ se.style.display='none'; } }

var h=document.getElementById('tcHead');
if(h && h.dataset.kw!=='1'){ h.innerHTML=h.textContent.replace(/\*([^*]+)\*/g,'<span class="key">$1</span>'); h.dataset.kw='1'; }

var s=document.getElementById('tcSub');
if(s){ var st=s.textContent.trim(); if(!st || st.indexOf('__SUB')>-1){ s.style.display='none'; } }

var li=document.getElementById('tcLogoImg');
if(li){ var src=li.getAttribute('src')||''; if(!src || src.indexOf('__LOGO')>-1){ var lw=document.getElementById('tcLogo'); if(lw) lw.style.display='none'; } }

__fit('.tc-head',940,520,0,1);
__fit('.tc-sub',940,140,0,1);
''',
}
