# Narrator = a designed voice (VoxCPM2 Voice Design, song/voice/design.py -> narrator.wav, no real person's voice):
# continuation prompt + timbre reference = that designed clip. One model load, one wav per lyrics line -> song/vo/<id>_<take>.wav
# (then song/vo/assemble.py). Digits/loanwords are spelled out for speech; seed is fixed, so retakes need new wording.
#   $PY song/myvoice/vo.py [take [id ...]]
import os, re, sys
os.environ.setdefault('VOXCPM_MPS_DTYPE', 'float32')  # Apple GPU: fp32 avoids garbled audio
MODEL = os.environ.get('VOXCPM_MODEL', 'openbmb/VoxCPM2')  # Hugging Face id (downloads ~5 GB once) or a local folder
# A bbn-voice-clone kit (OmniVoice + the voice owner's consented reference + profile.json): when set, it reads every
# line instead of the designed narrator.
KIT = os.environ.get('BBN_VOICE_KIT')
KIT_PROFILE = os.environ.get('BBN_VOICE_PROFILE')  # optional profile JSON inside/next to the kit (default: kit's voice/profile.json)

HERE = os.path.dirname(os.path.abspath(__file__))
OUT = os.path.join(HERE, '..', 'vo')
PROMPT_TEXT = 'แชตจีพีที คล็อด หรือ เจมิไน งานของคุณควรใช้ตัวไหน สรุปให้จบใน สี่สิบ วิ เลือกถูก งานเร็วขึ้นทันที'
VOICE_WAV = os.path.join(HERE, '..', 'voice', 'narrator.wav')
SAY = {'ChatGPT': 'แชตจีพีที', 'Claude': 'คล็อด', 'Gemini': 'เจมิไน', 'Google': 'กูเกิล', 'Gmail': 'จีเมล',
       'Docs': 'ด็อกส์', 'Drive': 'ไดรฟ์', 'วิ ': 'วิ ', 'ยาวๆ': 'ยาวยาว',
       'OpenAI': 'โอเพนเอไอ', 'AI': 'เอไอ'}  # longer keys first: replacements run in order
DIG = 'ศูนย์ หนึ่ง สอง สาม สี่ ห้า หก เจ็ด แปด เก้า'.split()


def thai_int(n):
    if n >= 1_000_000:
        return thai_int(n // 1_000_000) + 'ล้าน' + (thai_int(n % 1_000_000) if n % 1_000_000 else '')
    if n == 0:
        return 'ศูนย์'
    s, out = str(n), ''
    for i, c in enumerate(s):
        d, p = int(c), len(s) - 1 - i
        if d == 0:
            continue
        if p == 1:
            out += {1: '', 2: 'ยี่'}.get(d, DIG[d]) + 'สิบ'
        elif p == 0 and d == 1 and len(s) > 1:
            out += 'เอ็ด'
        else:
            out += DIG[d] + ['', 'สิบ', 'ร้อย', 'พัน', 'หมื่น', 'แสน'][p]
    return out


def spoken(text):
    text = text.replace('*', '')
    for k, v in SAY.items():
        text = text.replace(k, v)
    num = lambda m: thai_int(int(m[1].replace(',', ''))) + (' จุด ' + ' '.join(DIG[int(d)] for d in m[2]) if m[2] else '')
    return re.sub(r'(\d[\d,]*)(?:\.(\d+))?', lambda m: f' {num(m)} ', text).replace('  ', ' ').strip()


assert thai_int(1858) == 'หนึ่งพันแปดร้อยห้าสิบแปด' and thai_int(200000) == 'สองแสน' and thai_int(21) == 'ยี่สิบเอ็ด'
assert spoken('ใน 0.2 วินาที') == 'ใน ศูนย์ จุด สอง วินาที' and spoken('1,500 ชิ้น') == 'หนึ่งพันห้าร้อย ชิ้น'

def kit_lines(ids, take, only):
    import json, shutil, subprocess, tempfile
    py = json.load(open(os.path.join(KIT, 'runtime', 'runtime.json')))['python']
    for i, text in ids:
        out = os.path.join(OUT, f'{i}_{take}.wav')
        if os.path.exists(out) or (only and i not in only):
            continue
        with tempfile.TemporaryDirectory() as d:
            with open(f'{d}/line.txt', 'w') as f:
                f.write(spoken(text))
            subprocess.run([py, os.path.join(KIT, 'skill', 'bbn-voice-clone', 'scripts', 'clone.py'), '--kit', KIT,
                            '--text-file', f'{d}/line.txt', '--output', f'{d}/line.wav']
                           + (['--profile', KIT_PROFILE] if KIT_PROFILE else []), check=True)
            shutil.move(f'{d}/line.wav', out)
        print('DONE', i, flush=True)


if __name__ == '__main__':
    take, only = (sys.argv[1] if len(sys.argv) > 1 else 'a'), set(sys.argv[2:])
    ids, sec, n = [], None, 0
    for line in open(os.path.join(HERE, '..', 'lyrics.txt')):
        line = line.strip()
        if m := re.fullmatch(r'\[(\w+)\]', line):
            sec, n = m.group(1).lower(), 0
        elif line:
            n += 1
            ids.append((f'{sec}-{n}', line))
    if only == {'--print'}:
        for i, t in ids:
            print(i, spoken(t))
        sys.exit()
    os.makedirs(OUT, exist_ok=True)
    if KIT:
        kit_lines(ids, take, only)
        sys.exit()
    import soundfile as sf
    from voxcpm import VoxCPM
    model = VoxCPM.from_pretrained(MODEL, load_denoiser=False, optimize=False)
    for i, text in ids:
        out = os.path.join(OUT, f'{i}_{take}.wav')
        if os.path.exists(out) or (only and i not in only):
            continue
        audio = model.generate(text=spoken(text), prompt_wav_path=VOICE_WAV,
                               prompt_text=PROMPT_TEXT, reference_wav_path=VOICE_WAV,
                               cfg_value=2.0, inference_timesteps=10, seed=42, normalize=False, denoise=False,
                               retry_badcase=True, max_len=4096)
        sf.write(out, audio, model.tts_model.sample_rate, subtype='PCM_16')
        print('DONE', i, flush=True)
