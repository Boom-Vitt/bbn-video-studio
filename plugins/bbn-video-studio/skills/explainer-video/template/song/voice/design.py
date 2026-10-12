# Voice Design (VoxCPM2, Apache-2.0): a brand-new narrator from a text description, no reference recording.
#   $PY song/voice/design.py   -> song/voice/cand_<k>.wav
import os
os.environ.setdefault('VOXCPM_MPS_DTYPE', 'float32')  # Apple GPU: fp32 avoids garbled audio
MODEL = os.environ.get('VOXCPM_MODEL', 'openbmb/VoxCPM2')  # Hugging Face id (downloads ~5 GB once) or a local folder
import soundfile as sf
from voxcpm import VoxCPM

HERE = os.path.dirname(os.path.abspath(__file__))
TEXT = 'แชตจีพีที คล็อด หรือ เจมิไน งานของคุณควรใช้ตัวไหน สรุปให้จบใน สี่สิบ วิ เลือกถูก งานเร็วขึ้นทันที'
DESC = {
    'm1': 'A young Thai male tech creator, bright, energetic and confident, fast lively pace, smiling tone, clear studio voice',
    'm2': 'A Thai male narrator in his late twenties, punchy and upbeat like a viral short-video host, crisp and warm',
    'm3': 'A friendly Thai male YouTuber, excited and playful, quick rhythm, strong emphasis on key words',
    'f1': 'A young Thai female tech creator, bright, energetic and confident, fast lively pace, smiling tone, clear studio voice',
    'f2': 'A Thai female narrator in her late twenties, punchy and upbeat like a viral short-video host, crisp and warm',
    'f3': 'A cheerful Thai female presenter, excited and playful, quick rhythm, strong emphasis on key words',
}
model = VoxCPM.from_pretrained(MODEL, load_denoiser=False, optimize=False)
for k, d in DESC.items():
    out = os.path.join(HERE, f'cand_{k}.wav')
    if os.path.exists(out):
        continue
    wav = model.generate(text=f'({d}){TEXT}', cfg_value=2.0, inference_timesteps=10, seed=7, retry_badcase=True)
    sf.write(out, wav, model.tts_model.sample_rate, subtype='PCM_16')
    print('DONE', k, flush=True)
