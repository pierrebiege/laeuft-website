#!/usr/bin/env python3
"""Import reels from JSON into Supabase content_reels table."""

import json
import os
import sys

try:
    from supabase import create_client
except ImportError:
    print("Installing supabase-py...")
    os.system(f"{sys.executable} -m pip install supabase --quiet")
    from supabase import create_client

# Load env from .env.local
env_file = os.path.join(os.path.dirname(__file__), '..', '.env.local')
if os.path.exists(env_file):
    with open(env_file) as f:
        for line in f:
            line = line.strip()
            if line and not line.startswith('#') and '=' in line:
                key, val = line.split('=', 1)
                os.environ[key.strip()] = val.strip()

SUPABASE_URL = os.environ.get('NEXT_PUBLIC_SUPABASE_URL')
SUPABASE_KEY = os.environ.get('SUPABASE_SERVICE_ROLE_KEY')

if not SUPABASE_URL or not SUPABASE_KEY:
    print("ERROR: Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY in .env.local")
    sys.exit(1)

supabase = create_client(SUPABASE_URL, SUPABASE_KEY)

# Load JSON
json_path = os.path.join(os.path.dirname(__file__), '..', 'src', 'data', 'reels-data.json')
with open(json_path, 'r', encoding='utf-8') as f:
    reels = json.load(f)

print(f"Loaded {len(reels)} reels from JSON")

# Transform for DB schema
rows = []
for r in reels:
    storyboard = []
    for i, scene in enumerate(r.get('storyboard', [])):
        storyboard.append({"time": f"Szene {i+1}", "description": scene})

    rows.append({
        "reel_number": r['id'],
        "title": r['title'],
        "category": r.get('category', 'Education'),
        "duration": r.get('duration', '15-30s'),
        "reel_type": r.get('type', 'Music+Text'),
        "hook_text": r.get('hook_text', ''),
        "storyboard": json.dumps(storyboard),
        "audio_type": r.get('audio_type', 'Trending'),
        "audio_mood": r.get('audio_mood', ''),
        "caption": r.get('caption', ''),
        "sponsor": r.get('sponsor'),
        "sponsor_details": r.get('sponsor_details'),
        "voiceover_script": None,
        "needs_voiceover": r.get('needs_voiceover', False),
        "needs_video_footage": True,
        "props": json.dumps(r.get('needs_props', [])),
        "month": r.get('month', ''),
        "season": r.get('season', ''),
        "status": "backlog",
        "priority": 0,
    })

# Insert in batches of 50
batch_size = 50
imported = 0
errors = 0

for i in range(0, len(rows), batch_size):
    batch = rows[i:i+batch_size]
    try:
        result = supabase.table('content_reels').upsert(batch, on_conflict='reel_number').execute()
        imported += len(batch)
        print(f"  Batch {i//batch_size + 1}: {len(batch)} reels imported")
    except Exception as e:
        errors += len(batch)
        print(f"  Batch {i//batch_size + 1} FAILED: {e}")

print(f"\nDone! Imported: {imported}, Errors: {errors}")
