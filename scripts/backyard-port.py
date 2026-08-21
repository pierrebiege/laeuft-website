"""
Portiert die eigenständige Backyard-Seite nach laeuft.ch/backyard.
Alles wird unter .byd gekapselt, damit weder CSS-Variablen noch
Hilfsklassen mit dem Rest von laeuft.ch kollidieren.
"""
import os, re, shutil, pathlib

SRC = pathlib.Path.home() / "Documents/team-schweiz-backyard/src"
APP = pathlib.Path.home() / "Documents/laeuft/laeuft-website/src/app"
DEST = APP / "backyard"
API = APP / "api/backyard"

for d in [DEST/"_components", DEST/"_lib", DEST/"_data", DEST/"live", DEST/"welt",
          DEST/"team", DEST/"strecke", DEST/"format", API/"live", API/"world"]:
    d.mkdir(parents=True, exist_ok=True)

def code(t: str) -> str:
    t = t.replace('@/data/', '@/app/backyard/_data/')
    t = t.replace('@/lib/', '@/app/backyard/_lib/')
    t = t.replace('@/components/', '@/app/backyard/_components/')
    # Routen unter /backyard
    for r in ["live", "welt", "team", "strecke", "format"]:
        t = t.replace(f'href="/{r}"', f'href="/backyard/{r}"')
        t = t.replace(f'"{r}", "/{r}"', f'"{r}", "/backyard/{r}"')
        t = t.replace(f"href: \"/{r}\"", f"href: \"/backyard/{r}\"")
    t = t.replace('href="/"', 'href="/backyard"')
    t = t.replace('["Live", "/live"]', '["Live", "/backyard/live"]')
    # API
    t = t.replace('/api/live?', '/api/backyard/live?')
    t = t.replace('/api/world?', '/api/backyard/world?')
    # Inline gesetzte Custom Properties ebenfalls kapseln
    t = t.replace('"--from"', '"--byd-from"').replace('"--to"', '"--byd-to"')
    # CSS-Variablen kapseln
    for v in ["bg", "fg", "rule", "mute", "accent"]:
        t = t.replace(f'var(--{v})', f'var(--byd-{v})')
    return t

# Komponenten, lib, data
for sub, dst in [("components", "_components"), ("lib", "_lib"), ("data", "_data")]:
    for f in (SRC/sub).glob("*"):
        (DEST/dst/f.name).write_text(code(f.read_text()))

# Seiten
(DEST/"page.tsx").write_text(code((SRC/"app/page.tsx").read_text()))
for r in ["live", "welt", "team", "strecke", "format"]:
    (DEST/r/"page.tsx").write_text(code((SRC/f"app/{r}/page.tsx").read_text()))

# API-Routen
(API/"live/route.ts").write_text(code((SRC/"app/api/live/route.ts").read_text()))
(API/"world/route.ts").write_text(code((SRC/"app/api/world/route.ts").read_text()))

# ---------------- CSS kapseln ----------------
css = (SRC/"app/globals.css").read_text()
css = css.replace('@import "tailwindcss";\n', '')
# @theme-Block raus – Farben stecken jetzt direkt in den Variablen
css = re.sub(r"@theme \{.*?\n\}\n", "", css, flags=re.S)
# Variablennamen kapseln
for v in ["bg", "fg", "rule", "mute", "accent"]:
    css = css.replace(f'--{v}:', f'--byd-{v}:')
    css = css.replace(f'var(--{v})', f'var(--byd-{v})')
css = css.replace('--from', '--byd-from').replace('--to', '--byd-to')
# :root -> .byd
css = css.replace(':root {\n  --byd-bg', '.byd {\n  --byd-bg')
css = re.sub(r'^\[data-hour=', '.byd [data-hour=', css, flags=re.M)
# html/body-Regeln durch den Wrapper ersetzen
css = re.sub(r"html \{.*?\n\}\n\n", "", css, flags=re.S)
css = re.sub(r"body \{.*?\n\}\n", "", css, flags=re.S)
# Hilfsklassen und Elementregeln scopen
for sel in [".display", ".stamp", ".tnum", ".rule", ".dawn", ".rail", ".reveal",
            ".blink", ".bell-ring", "section[data-hour]", "::selection"]:
    css = re.sub(r'^' + re.escape(sel), '.byd ' + sel, css, flags=re.M)
css = css.replace('.byd .rail::-webkit-scrollbar', '.byd .rail::-webkit-scrollbar')
css = css.replace('.rail > *', '.byd .rail > *')
css = css.replace('.reveal > *', '.byd .reveal > *')
css = css.replace('.reveal.is-in > *', '.byd .reveal.is-in > *')
css = css.replace('.byd .byd ', '.byd ')
# Keyframes eindeutig machen
css = css.replace('@keyframes bell-ring', '@keyframes byd-bell-ring')
css = css.replace('animation: bell-ring', 'animation: byd-bell-ring')
css = css.replace('@keyframes blink', '@keyframes byd-blink')
css = css.replace('animation: blink', 'animation: byd-blink')

header = """/* Backyard Ultra World Team Championship – Team Schweiz.
   Alles unter .byd gekapselt: eigene Farbvariablen, eigene Hilfsklassen.
   Der Rest von laeuft.ch bleibt davon unberührt. */

.byd {
  font-family: var(--font-archivo), ui-sans-serif, system-ui, sans-serif;
  -webkit-font-smoothing: antialiased;
  font-synthesis-weight: none;
  background: var(--byd-bg);
  color: var(--byd-fg);
  overflow-x: clip;
}

"""
(DEST/"backyard.css").write_text(header + css.lstrip())
print("CSS + Dateien portiert")
