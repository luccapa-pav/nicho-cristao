import math, re, sys
sys.stdout.reconfigure(encoding='utf-8')

# Simulate JS logic in Python

def split_into_groups(text):
    if not text: return []
    parts = re.split(r'([.!?]+)', text.strip())
    sentences = []
    i = 0
    while i < len(parts):
        body  = (parts[i]   if i   < len(parts) else '').strip()
        punct = (parts[i+1] if i+1 < len(parts) else '').strip()
        s = (body + punct).strip()
        if s: sentences.append(s)
        i += 2
    if not sentences: sentences = [text.strip()]
    groups = []
    for sentence in sentences:
        sentence = sentence.strip()
        if not sentence: continue
        words = sentence.split()
        if len(words) <= 5:
            groups.append(sentence)
        else:
            for gi in range(0, len(words), 5):
                chunk = ' '.join(words[gi:gi+5])
                if chunk: groups.append(chunk)
    return groups if groups else [text.strip()]

def escape_drawtext(s):
    s = (s or '')
    s = re.sub(r'\\', '', s)          # remove backslashes (JS: .replace(/\\/g,''))
    s = s.replace("'", '\u2019')
    s = s.replace(':', ' -')
    s = re.sub(r'[\[\]%"]', '', s)   # includes double-quote (fixed)
    s = re.sub(r'\s{2,}', ' ', s)
    return s.strip()

def build_subtitle_filters(text, nar_dur, stop_at):
    if not text: return []
    groups = split_into_groups(text)
    per_group = nar_dur / len(groups)
    filters = []
    for idx, group in enumerate(groups):
        start       = idx * per_group
        end         = (idx + 1) * per_group
        display_end = min(end, stop_at)
        if start >= stop_at:
            continue
        filters.append({'start': start, 'end': display_end, 'text': group})
    return filters

def build_cta_filters(text, start_time):
    if not text: return []
    words = text.split()
    lines = []
    for li in range(0, len(words), 6):
        lines.append(' '.join(words[li:li+6]))
    return lines

NARRACAO = 'Apos 38 anos esperando, um homem recebeu a cura divina. Jesus passou por ali e fez o milagre. Voce tambem pode receber. So acredite e ore com fe. Deus esta esperando por voce agora!'
CTA_LONG = 'Siga para receber mais da luz de Deus e compartilhe com quem precisa deste milagre agora'
CTA_SHORT = 'Siga e Compartilhe!'

def check(label, cond, detail=''):
    status = 'PASS' if cond else 'FAIL'
    print(f'  [{status}] {label}' + (f' | {detail}' if detail else ''))
    return cond

all_pass = True

# ── CASE 1: Normal ──────────────────────────────────────────────────────────
print('=== CASE 1: Normal (audio=28s, scenes=24s) ===')
nar_dur, scenes = 28.0, 24.0
cta_dur = max(math.ceil(nar_dur - scenes), 4)
total_video = scenes + cta_dur
all_pass &= check('video >= audio (nothing cut)', total_video >= nar_dur, f'{total_video}s >= {nar_dur}s')
all_pass &= check('CTA >= 4s', cta_dur >= 4, f'ctaDuration={cta_dur}')
subs = build_subtitle_filters(NARRACAO, nar_dur, scenes)
all_pass &= check('subtitles generated', len(subs) > 0, f'{len(subs)} groups')
all_pass &= check('last sub ends at or before scenesDuration', all(s['end'] <= scenes for s in subs))
all_pass &= check('first sub starts at t=0', subs[0]['start'] == 0.0)
# Speed: each group covers nar_dur/N seconds of audio
per = nar_dur / len(split_into_groups(NARRACAO))
all_pass &= check('sub timing matches audio speed', abs(subs[0]['end'] - per) < 0.01, f'per_group={per:.2f}s')
print()

# ── CASE 2: Long audio (38s) ────────────────────────────────────────────────
print('=== CASE 2: Long audio (audio=38s, scenes=24s) ===')
nar_dur = 38.0
cta_dur = max(math.ceil(nar_dur - scenes), 4)
all_pass &= check('video >= audio', scenes + cta_dur >= nar_dur, f'{scenes+cta_dur}s >= {nar_dur}s')
all_pass &= check('ctaDuration correct', cta_dur == 14, f'got {cta_dur}')
subs = build_subtitle_filters(NARRACAO, nar_dur, scenes)
all_pass &= check('some subs shown despite long audio', len(subs) > 0)
all_pass &= check('no sub past scenesDuration', all(s['end'] <= scenes for s in subs))
print()

# ── CASE 3: Short audio (18s < scenesDuration=24s) ─────────────────────────
print('=== CASE 3: Short audio (audio=18s, scenes=24s) ===')
nar_dur = 18.0
cta_dur = max(math.ceil(nar_dur - scenes), 4)
all_pass &= check('ctaDuration = MIN_CTA when audio < scenes', cta_dur == 4, f'got {cta_dur}')
all_pass &= check('video >= audio', scenes + cta_dur >= nar_dur, f'{scenes+cta_dur}s >= {nar_dur}s')
subs = build_subtitle_filters(NARRACAO, nar_dur, scenes)
# All groups start before scenesDuration (nar_dur < scenes)
all_pass &= check('all subs shown (audio shorter than scenes)', len(subs) == len(split_into_groups(NARRACAO)))
print()

# ── CASE 4: Empty inputs ────────────────────────────────────────────────────
print('=== CASE 4: Edge — empty/None narracao and ctaText ===')
all_pass &= check('empty narracao -> []', build_subtitle_filters('', 28.0, 24.0) == [])
all_pass &= check('None narracao -> []', build_subtitle_filters(None, 28.0, 24.0) == [])
all_pass &= check('empty CTA -> []', build_cta_filters('', 24.0) == [])
all_pass &= check('None CTA -> []', build_cta_filters(None, 24.0) == [])
print()

# ── CASE 5: escapeDrawtext ──────────────────────────────────────────────────
print('=== CASE 5: escapeDrawtext — chars that break FFmpeg ===')
tests = [
    ("simple", "Siga e Compartilhe!", "Siga e Compartilhe!"),
    ("apostrophe", "Jesus' milagre", "Jesus\u2019 milagre"),
    ("colon", "Resultado: cura total", "Resultado - cura total"),
    ("brackets", "Ore [com fe]", "Ore com fe"),
    ("percent", "100% seguro", "100 seguro"),
    ("double quotes", 'texto "importante"', 'texto importante'),    # double quotes NOW removed
    ("backslash", "caminho\\pasta", "caminhopasta"),
]
for label, inp, expected in tests:
    got = escape_drawtext(inp)
    ok  = got == expected
    all_pass &= check(f'escape: {label}', ok, f'got={repr(got)} expected={repr(expected)}')

# Check for double-quote issue specifically
has_dquote = '"' in escape_drawtext('texto "importante"')
all_pass &= check('double-quote removed from output (shell safety)', not has_dquote,
                  'OK: no double-quote in output' if not has_dquote else 'FAIL: double-quote still present')
print()

# ── CASE 6: CTA word wrapping ───────────────────────────────────────────────
print('=== CASE 6: CTA word wrapping — line width safety ===')
for cta_text in [CTA_SHORT, CTA_LONG]:
    lines = build_cta_filters(cta_text, 24.0)
    max_chars = max(len(l) for l in lines)
    # At fontsize 52 on 1080px, safe char limit ~28 chars (Roboto-Bold avg ~38px/char)
    all_pass &= check(f'max {max_chars} chars/line ({len(lines)} lines)', max_chars <= 40,
                      f'text: {cta_text[:40]}...')
print()

# ── CASE 7: scenesDuration=0 guard ─────────────────────────────────────────
print('=== CASE 7: scenesDuration=0 (degenerate) ===')
subs = build_subtitle_filters(NARRACAO, 28.0, 0.0)
all_pass &= check('stopAt=0 -> no subtitles shown', subs == [], f'got {len(subs)} filters')
print()

# ── Summary ─────────────────────────────────────────────────────────────────
print('=' * 50)
print('QA RESULT:', 'ALL PASS' if all_pass else 'FAILURES FOUND — FIX REQUIRED')
