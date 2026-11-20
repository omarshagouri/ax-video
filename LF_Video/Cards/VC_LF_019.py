# VC-LF-019 | Long-form battery cluster readout
# 1920x1080. Supports one or two dashboard-style battery readouts.
CARD = {
    "id": "VC-LF-019",
    "slots": [
        "TITLE",
        "LEFT_LABEL", "LEFT_SOH", "LEFT_USABLE",
        "RIGHT_LABEL", "RIGHT_SOH", "RIGHT_USABLE",
        "FOOTER", "SOURCE"
    ],
    "default_duration": 5.5,
    "css": r'''
#cluster{
  position:absolute;
  left:150px;
  top:100px;
  width:1620px;
  height:790px;
}
.cl-title{
  font-family:'Space Grotesk',sans-serif;
  font-size:70px;
  line-height:1.05;
  font-weight:700;
  color:#FFFFFF;
  text-align:center;
  margin-bottom:48px;
  opacity:0;
  transform:translateY(22px);
}
.cards{
  display:flex;
  justify-content:center;
  gap:48px;
}
.readout{
  width:690px;
  min-height:475px;
  box-sizing:border-box;
  padding:42px 46px 36px;
  border-radius:30px;
  background:linear-gradient(180deg,rgba(20,36,64,.96),rgba(10,22,40,.92));
  border:2px solid #24375A;
  box-shadow:0 24px 80px rgba(0,0,0,.25);
  opacity:0;
  transform:translateY(24px) scale(.98);
}
.readout.left{border-top:8px solid #00D4AA;}
.readout.right{border-top:8px solid #FF8A4C;}
.r-label{
  font-family:Inter,sans-serif;
  font-size:29px;
  font-weight:700;
  letter-spacing:2.5px;
  color:#8CA0B8;
  text-transform:uppercase;
  text-align:center;
  margin-bottom:24px;
}
.soh-line{
  display:flex;
  align-items:flex-end;
  justify-content:center;
  gap:14px;
  margin-top:4px;
}
.soh{
  font-family:'Space Grotesk',sans-serif;
  font-size:128px;
  line-height:.92;
  font-weight:700;
  color:#FFFFFF;
}
.pct{
  font-family:'Space Grotesk',sans-serif;
  font-size:54px;
  line-height:1;
  font-weight:700;
  color:#00D4AA;
  margin-bottom:8px;
}
.right .pct{color:#FF8A4C;}
.metric-name{
  font-family:Inter,sans-serif;
  font-size:26px;
  font-weight:700;
  color:#8CA0B8;
  text-align:center;
  margin-top:10px;
}
.usable{
  margin:34px auto 0;
  width:86%;
  padding:23px 26px;
  box-sizing:border-box;
  border-radius:18px;
  background:rgba(140,160,184,.10);
  border:1px solid rgba(140,160,184,.18);
  text-align:center;
}
.usable .v{
  font-family:'Space Grotesk',sans-serif;
  font-size:52px;
  line-height:1;
  font-weight:700;
  color:#FFFFFF;
}
.usable .l{
  margin-top:7px;
  font-family:Inter,sans-serif;
  font-size:23px;
  font-weight:600;
  color:#8CA0B8;
}
.footer{
  margin:34px auto 0;
  max-width:1450px;
  text-align:center;
  font-family:Inter,sans-serif;
  font-size:31px;
  line-height:1.25;
  font-weight:600;
  color:#FFFFFF;
  opacity:0;
}
.source{
  position:absolute;
  left:10px;
  bottom:-60px;
  border-left:8px solid #00D4AA;
  padding-left:14px;
  font-family:Inter,sans-serif;
  font-size:23px;
  font-weight:600;
  color:#8CA0B8;
  opacity:0;
}
''',
    "body": r'''
<div id="cluster">
  <div class="cl-title" id="clTitle">__TITLE__</div>
  <div class="cards" id="clCards">
    <div class="readout left" id="clLeft">
      <div class="r-label" id="clLeftLabel">__LEFT_LABEL__</div>
      <div class="soh-line"><div class="soh" id="clLeftSoh">__LEFT_SOH__</div><div class="pct">%</div></div>
      <div class="metric-name">State of Health</div>
      <div class="usable"><div class="v" id="clLeftUsable">__LEFT_USABLE__</div><div class="l">usable capacity</div></div>
    </div>
    <div class="readout right" id="clRight">
      <div class="r-label" id="clRightLabel">__RIGHT_LABEL__</div>
      <div class="soh-line"><div class="soh" id="clRightSoh">__RIGHT_SOH__</div><div class="pct">%</div></div>
      <div class="metric-name">State of Health</div>
      <div class="usable"><div class="v" id="clRightUsable">__RIGHT_USABLE__</div><div class="l">usable capacity</div></div>
    </div>
  </div>
  <div class="footer" id="clFooter">__FOOTER__</div>
  <div class="source" id="clSource">SOURCE: __SOURCE__</div>
</div>
''',
    "seek": r'''
var x=(typeof x!=='undefined'&&x>0)?x:5.5;
var HOLD=1.0;
var active=Math.max(.4,x-HOLD);

if(!window.__fit){window.__fit=function(sel,maxW,maxH,line,center){
  var els=document.querySelectorAll(sel);
  for(var i=0;i<els.length;i++){
    var el=els[i];
    if(!el.dataset.fbase)el.dataset.fbase=(parseFloat(getComputedStyle(el).fontSize)||32);
    if(maxW){el.style.maxWidth=maxW+'px';if(center){el.style.marginLeft='auto';el.style.marginRight='auto';}}
    el.style.whiteSpace=line?'nowrap':'normal';
    if(!line){el.style.overflowWrap='break-word';el.style.wordBreak='break-word';}
    var size=parseFloat(el.dataset.fbase),g=0;
    while(size>18&&g<180&&(el.scrollWidth>el.clientWidth+1||(maxH&&el.scrollHeight>maxH+1))){
      size-=2;el.style.fontSize=size+'px';g++;
    }
  }
};}

__fit('.cl-title',1500,110,0,1);
__fit('.r-label',610,70,0,1);
__fit('.soh',440,140,1,1);
__fit('.usable .v',520,70,0,1);
__fit('.footer',1450,100,0,1);
__fit('.source',1450,50,1,0);

function ep(a,b){return easeOutCubic(clamp((t-a)/(b-a)));}
function revealCard(el,a,b){
  var p=ep(a,b);
  el.style.opacity=p;
  el.style.transform='translateY('+(24*(1-p))+'px) scale('+(0.98+0.02*p)+')';
}
function reveal(el,a,b,dy){
  var p=ep(a,b);
  el.style.opacity=p;
  el.style.transform='translateY('+(dy*(1-p))+'px)';
}

reveal(document.getElementById('clTitle'),.04*active,.22*active,22);

var left=document.getElementById('clLeft');
var right=document.getElementById('clRight');
var cards=document.getElementById('clCards');

function value(id){
  var el=document.getElementById(id);
  return el?(el.textContent||'').trim():'';
}
function panelOk(prefix){
  var parts=[
    value(prefix+'Label'),
    value(prefix+'Soh'),
    value(prefix+'Usable')
  ];
  var unresolved=parts.some(function(s){return s.indexOf('__')>-1;});
  var empty=parts.join('').trim().length===0;
  return !unresolved && !empty;
}

var leftOk=panelOk('clLeft');
var rightOk=panelOk('clRight');

if(!leftOk)left.style.display='none';
if(!rightOk)right.style.display='none';

if(leftOk && !rightOk){
  left.style.width='820px';
  cards.style.gap='0';
}
if(rightOk && !leftOk){
  right.style.width='820px';
  cards.style.gap='0';
}

if(leftOk)revealCard(left,.20*active,.48*active);
if(rightOk){
  var ra=leftOk ? .36*active : .20*active;
  var rb=leftOk ? .64*active : .48*active;
  revealCard(right,ra,rb);
}

var footer=document.getElementById('clFooter');
var ft=(footer.textContent||'').trim();
var footerOk=ft.length>0 && ft.indexOf('__')<0;
footer.style.opacity=footerOk?ep(.62*active,.82*active):0;

var source=document.getElementById('clSource');
var st=(source.textContent||'').replace('SOURCE:','').trim();
var sourceOk=st.length>0 && st.indexOf('__')<0 && st.toUpperCase().indexOf('ILLUSTRATIVE')!==0;
source.style.opacity=sourceOk?ep(.74*active,.94*active):0;
'''
};
