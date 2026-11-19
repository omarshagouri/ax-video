# VC-SH-003  |  auto-fit safe-zone patch applied 2026-08-09
# Text shrink-to-fit added at top of seek(); css/body unchanged.
CARD = {
    "id": "VC-SH-003",
    "slots": ["TAG", "STATEMENT", "ROLE"],
    "default_duration": 4.0,
    "css": r'''
        #note{
            position:absolute; top:380px; left:120px; width:840px;
            text-align:center;
        }
        .pill{
            display:inline-block; opacity:0; transform:scale(0.9);
            color:#00D4AA; border:2px solid #00D4AA; border-radius:999px;
            font-family:'Space Grotesk',sans-serif; font-size:30px; font-weight:600;
            letter-spacing:3px; text-transform:uppercase; padding:14px 34px;
        }
        .statement{
            opacity:0; margin:48px 0 0; color:#FFFFFF;
            font-family:'Space Grotesk',sans-serif; font-size:60px; font-weight:600;
            line-height:1.28;
        }
        .rule{
            width:130px; height:5px; background:#00D4AA; margin:44px auto 0;
            border-radius:3px; transform-origin:center; transform:scaleX(0);
        }
        .role{
            opacity:0; margin:40px 0 0; color:#8CA0B8;
            font-family:'Inter',sans-serif; font-size:36px; font-weight:600;
            letter-spacing:1px;
        }
    
/* ax caption-safe v3: center ~y920, clamp bottom<=1340 (repo band bottom=1540) */
#axsafe{position:absolute;left:0;top:0;width:1080px;height:1920px;transform:translateY(342px);}
''',
    "body": r'''<div id="axsafe">
        <div id="note">
            <div class="pill" id="pill">__TAG__</div>
            <div class="statement" id="stmt">__STATEMENT__</div>
            <div class="rule" id="rule"></div>
            <div class="role" id="role">__ROLE__</div>
        </div>
    </div>''',
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

__fit(".pill",800,0,1,1);__fit(".statement",840,600,0,1);__fit(".role",840,0,1,1);

        var pill=document.getElementById('pill');
        var stmt=document.getElementById('stmt');
        var rule=document.getElementById('rule');
        var role=document.getElementById('role');

        // pill: fade + scale in, 0.0-0.5s
        var pe=easeOutCubic(clamp(t/0.5));
        pill.style.opacity=pe;
        pill.style.transform='scale('+(0.9+0.1*pe)+')';

        // statement: fade + rise, 0.4-1.1s
        var se=easeOutCubic(clamp((t-S(0,3))/(E(0,3)-S(0,3))));
        stmt.style.opacity=se;
        stmt.style.transform='translateY('+(24*(1-se))+'px)';

        // teal rule: grow from center, 1.0-1.6s
        var re=easeOutCubic(clamp((t-S(1,3))/(E(1,3)-S(1,3))));
        rule.style.transform='scaleX('+re+')';

        // role: fade + rise, 1.5-2.0s
        var oe=easeOutCubic(clamp((t-S(2,3))/(E(2,3)-S(2,3))));
        role.style.opacity=oe;
        role.style.transform='translateY('+(16*(1-oe))+'px)';
    ''',
}
