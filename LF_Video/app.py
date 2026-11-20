"""Long Form — Card Lab service.

Independent from the Shorts services.
Existing Card Builder can point to this service and keep using POST /render-beat.
Card source lives in the local Cards/ directory and is bundled into this service.

Native output: 1920x1080, 30 fps, H.264, no audio.
"""
import os
import json
import base64
import asyncio
import subprocess
import tempfile
import shutil
import re

from fastapi import FastAPI, Request, HTTPException
from playwright.async_api import async_playwright

RENDER_API_KEY = os.environ["LONGFORM_RENDER_API_KEY"]

WIDTH = 1920
HEIGHT = 1080
FPS = 30

app = FastAPI()
_pw = None
_browser = None
_render_lock = asyncio.Lock()
BG_URI = None

FRAME = """
<!doctype html><html><head><meta charset="utf-8">
<link href="https://fonts.googleapis.com/css2?family=Space+Grotesk:wght@500;600;700&family=Inter:wght@400;600&display=swap" rel="stylesheet">
<style>
  html,body{margin:0;padding:0;width:1920px;height:1080px;overflow:hidden;}
  #stage{width:1920px;height:1080px;position:relative;overflow:hidden;
    background:#0A1628 url('__BG__') center/cover no-repeat;
    font-family:'Space Grotesk',sans-serif;}
  __CARD_CSS__
</style></head>
<body>
  <div id="stage">__CARD_BODY__</div>
<script>
  function clamp(x){return Math.max(0,Math.min(1,x));}
  function easeOutCubic(p){return 1-Math.pow(1-p,3);}
  window.seek=function(t,x){__CARD_SEEK__};
  window.seek(0,1);
</script></body></html>
"""

@app.on_event("startup")
async def startup():
    global _pw, _browser, BG_URI
    _pw = await async_playwright().start()
    _browser = await _pw.chromium.launch(args=["--no-sandbox", "--disable-dev-shm-usage"])
    with open("background.png", "rb") as f:
        BG_URI = "data:image/png;base64," + base64.b64encode(f.read()).decode()

@app.on_event("shutdown")
async def shutdown():
    if _browser:
        await _browser.close()
    if _pw:
        await _pw.stop()

def load_card(card_id: str):
    if not re.fullmatch(r"VC-LF-\d{3}", card_id):
        raise HTTPException(400, "Invalid card ID")
    # Unified repository deployments package Cards/ inside this container.
    local_path = os.path.join("Cards", f"{card_id.replace('-', '_')}.py")
    if os.path.isdir("Cards"):
        if not os.path.isfile(local_path):
            raise HTTPException(404, f"{card_id} is not in the packaged card library")
        ns = {}
        with open(local_path, encoding="utf-8") as source:
            exec(source.read(), ns)
        card = ns.get("CARD")
        if not isinstance(card, dict) or card.get("id") != card_id:
            raise HTTPException(500, "Packaged card definition is invalid")
        return card
    raise HTTPException(500, "The local Cards directory was not packaged")

def parse_duration(text, default):
    text = str(text or "").strip().lower().replace("s", "")
    return float(text) if text else float(default)

def build_html(card, values):
    missing = [s for s in card.get("slots", []) if s not in values]
    if missing:
        raise HTTPException(400, f"{card['id']} missing slot values: {missing}")
    html = (FRAME.replace("__CARD_CSS__", card.get("css", ""))
                 .replace("__CARD_BODY__", card.get("body", ""))
                 .replace("__CARD_SEEK__", card.get("seek", ""))
                 .replace("__BG__", BG_URI or ""))
    for name, text in values.items():
        html = html.replace(f"__{name}__", str(text))
    return html

async def render_card_mp4(card, values, duration, out_path):
    html = build_html(card, values)
    frames = tempfile.mkdtemp(prefix="axlf_")
    try:
        total = max(1, round(FPS * duration))
        context = await _browser.new_context(viewport={"width": WIDTH, "height": HEIGHT})
        page = await context.new_page()
        await page.set_content(html)
        await page.evaluate("() => document.fonts.ready")
        for i in range(total):
            await page.evaluate("(args) => window.seek(args.t, args.x)", {"t": i / FPS, "x": duration})
            await page.locator("#stage").screenshot(path=f"{frames}/frame_{i:04d}.png")
        await context.close()
        cmd = [
            "ffmpeg", "-y", "-framerate", str(FPS),
            "-i", f"{frames}/frame_%04d.png",
            "-c:v", "libx264", "-pix_fmt", "yuv420p", "-r", str(FPS),
            "-movflags", "+faststart", out_path,
        ]
        subprocess.run(cmd, check=True, capture_output=True)
    finally:
        shutil.rmtree(frames, ignore_errors=True)

async def render_card_png(card, values, at_seconds, duration, out_path):
    html = build_html(card, values)
    context = await _browser.new_context(viewport={"width": WIDTH, "height": HEIGHT})
    page = await context.new_page()
    try:
        await page.set_content(html)
        await page.evaluate("() => document.fonts.ready")
        await page.evaluate("(args) => window.seek(args.t, args.x)", {"t": float(at_seconds), "x": float(duration)})
        await page.wait_for_timeout(100)
        await page.locator("#stage").screenshot(path=out_path)
    finally:
        await context.close()

def check_key(req: Request):
    if req.headers.get("x-api-key") != RENDER_API_KEY:
        raise HTTPException(401, "bad api key")

@app.get("/")
def health():
    return {
        "status": "ok",
        "service": "lf-card-lab",
        "canvas": f"{WIDTH}x{HEIGHT}",
        "fps": FPS,
        "timing": "duration-aware; final 1s hold",
    }

@app.post("/render-beat")
async def render_beat(req: Request):
    check_key(req)
    body = await req.json()
    video_id = str(body.get("video_id") or "LF-TEST")
    beat = str(body.get("beat") or "1")
    card_id = str(body.get("card_id") or "").strip()
    if not card_id.startswith("VC-LF-"):
        raise HTTPException(400, "long-form Card Lab only accepts VC-LF-* cards")
    values = body.get("values", {})
    if isinstance(values, str):
        values = json.loads(values)
    card = load_card(card_id)
    duration = parse_duration(body.get("duration"), card.get("default_duration", 3.0))
    filename = f"{video_id}_beat_{beat.zfill(2)}_{card_id}.mp4"
    out_path = f"/tmp/{filename}"
    async with _render_lock:
        await render_card_mp4(card, values, duration, out_path)
    with open(out_path, "rb") as f:
        payload = base64.b64encode(f.read()).decode()
    os.remove(out_path)
    return {
        "status": "ok",
        "filename": filename,
        "duration": duration,
        "width": WIDTH,
        "height": HEIGHT,
        "fps": FPS,
        "file_base64": payload,
    }

@app.post("/render-card-png")
async def render_card_png_endpoint(req: Request):
    check_key(req)
    body = await req.json()
    card_id = str(body.get("card_id") or "").strip()
    if not card_id.startswith("VC-LF-"):
        raise HTTPException(400, "long-form Card Lab only accepts VC-LF-* cards")
    values = body.get("values", {})
    if isinstance(values, str):
        values = json.loads(values)
    card = load_card(card_id)
    duration = parse_duration(body.get("duration"), card.get("default_duration", 3.0))
    at_seconds = float(body.get("at_seconds", duration))
    output_name = str(body.get("output_name") or f"{card_id}.png")
    if not output_name.lower().endswith(".png"):
        output_name += ".png"
    out_path = f"/tmp/{output_name}"
    async with _render_lock:
        await render_card_png(card, values, at_seconds, duration, out_path)
    with open(out_path, "rb") as f:
        payload = base64.b64encode(f.read()).decode()
    os.remove(out_path)
    return {
        "status": "ok",
        "filename": output_name,
        "width": WIDTH,
        "height": HEIGHT,
        "file_base64": payload,
    }
