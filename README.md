# bbn-video-studio

Claude Code plugin ที่สั่งครั้งเดียวได้วิดีโอที่เสร็จพร้อมโพสต์ มี 2 สกิล:

| สกิล | ได้อะไร |
|---|---|
| `music-video` | แต่งเพลง (ไทยหรือภาษาอื่น) → สร้างเพลงด้วย ACE-Step ในเครื่อง (ฟรี) หรือ phaya/Suno → MV แบบ kinetic typography ด้วย three.js ซิงก์กับเนื้อร้อง → MP4 1920×1080 |
| `explainer-video` | คลิปอธิบาย/สื่อการสอนแนวตั้ง 9:16 ไม่เกิน 45 วิ: บทเปิดด้วยคำถาม → เสียงพากย์ AI โอเพนซอร์ส (VoxCPM2) → ฉาก 3D จาก Blender + three.js → ซับในตัว ดนตรี และเสียงเอฟเฟกต์ → MP4 1080×1920 พร้อมแคปชันโพสต์ |

ทั้งสองสกิลแบ่งงานสร้างฉากให้ subagent ของ Claude Code ทำพร้อมกัน แล้วส่งไฟล์ไว้ใน `~/Downloads`

> โหมดบทเรียนแนวนอน 16:9 ยาว 1–5 นาทีสำหรับ `explainer-video` กำลังพัฒนา

## ติดตั้ง
ใน Claude Code:
```
/plugin marketplace add Boom-Vitt/bbn-video-studio
/plugin install bbn-video-studio@bbn-video-studio
```
หรือคำสั่งเดียว (Claude Code 2.1.275 ขึ้นไป): `/plugin install bbn-video-studio --marketplace Boom-Vitt/bbn-video-studio`

### เครื่องที่ต้องมี
- Mac ชิป Apple Silicon, RAM 16 GB ขึ้นไป (32 GB ถ้าจะให้ AI แต่งเพลงในเครื่อง)
- [Blender](https://www.blender.org/download/) 5 ขึ้นไป, Google Chrome
- `brew install node ffmpeg uv yt-dlp` (Node 22.12 ขึ้นไป)
- พื้นที่ดิสก์: ~10 GB สำหรับโมเดลเสียงพากย์, อีก ~40 GB ถ้าลง ACE-Step

### ตั้งค่าครั้งแรก
```bash
X="$(find ~/.claude/plugins -path '*bbn-video-studio*/skills/explainer-video/scripts' -type d | head -1)"
"$X/setup.sh"     # Python env: VoxCPM2, mlx-whisper, librosa → ~/.venvs/bbn-video-studio
echo 'export PY=$HOME/.venvs/bbn-video-studio/bin/python' >> ~/.zshrc && source ~/.zshrc
"$X/doctor.sh"    # ต้องขึ้น ok ทุกบรรทัด (ACE-Step ไม่บังคับ)
```
ให้ AI แต่งเพลงในเครื่อง (ไม่บังคับ แต่ `music-video` ต้องใช้ ถ้าไม่มี phaya):
```bash
git clone https://github.com/ACE-Step/ACE-Step-1.5.git ~/ACE-Step-1.5 && cd ~/ACE-Step-1.5 && uv sync
uv run acestep-download && uv run acestep-download -m acestep-v15-xl-sft && uv run acestep-download -m acestep-5Hz-lm-4B
```
ถ้าไม่ลง ACE-Step: `explainer-video` ใช้เพลงที่มีสิทธิ์ใช้วางที่ `music/bed.wav` แทนได้, `music-video` ใช้ phaya ได้ (ตั้ง `PHAYA_API_KEY` เป็นตัวแปร env เท่านั้น ห้ามใส่ในไฟล์)

## ใช้งาน
```
/bbn-video-studio:music-video แต่งเพลงล้อเลียนชีวิตออฟฟิศที่ทุกคนส่งบอตไปประชุมแทน
/bbn-video-studio:explainer-video หัวข้อ: พร้อมเพย์ทำงานยังไง
```
หรือพิมพ์ธรรมดา เช่น "ทำ MV เพลง…", "ทำคลิปสั้น 3D อธิบายว่า…", "ทำสื่อการสอนเรื่อง…" Claude จะเลือกสกิลเอง

หนึ่งคลิปใช้เวลาหลายชั่วโมงและใช้ token มาก ระหว่างทาง Claude จะส่งภาพนิ่งของแต่ละฉากมาให้ติหรือสั่งแก้ได้

## ข้อควรรู้
- **งานหนักทีละงาน:** โมเดลเสียง โมเดลเพลง และการเรนเดอร์กินแรมมาก
- **Blender:** เปิดแบบไม่มีหน้าต่างตัวเดียว (`blender/bridge.py`, port 9878) ให้ทุก subagent ใช้ร่วมกัน ห้ามเปิดแยก
- **เสียงพากย์:** เป็นเสียงสังเคราะห์ ห้ามโคลนเสียงใครโดยไม่ได้รับอนุญาตเป็นลายลักษณ์อักษร
- **โลโก้แบรนด์:** ไม่ได้แนบมาใน repo ให้ดาวน์โหลด SVG ทางการต่อเรื่อง ห้ามวาดใหม่หรือเปลี่ยนสี และใส่เครดิตว่าเป็นเครื่องหมายการค้าของเจ้าของ
- **ข้อเท็จจริงในบท:** ต้องมีแหล่งที่มา ตรวจซ้ำก่อนโพสต์
- **เพลงอ้างอิง:** เลียนแบบได้แค่โครงสร้างและฝีมือ ห้ามลอกเนื้อร้อง ทำนอง หรือภาพ

## License
โค้ดในนี้ใช้ MIT (ดู `LICENSE`) ส่วนที่ดาวน์โหลดเพิ่มมี license ของตัวเอง: VoxCPM2 (Apache-2.0), ACE-Step (MIT), three.js (MIT), ฟอนต์ IBM Plex Sans Thai / Kanit / Sriracha (OFL) เสียงเอฟเฟกต์ใน `sfx/` สังเคราะห์ด้วยโค้ด ชื่อแบรนด์ที่กล่าวถึงเป็นเครื่องหมายการค้าของเจ้าของ

---

## English
A Claude Code plugin that turns one prompt into a finished video. `music-video`: write a song, generate it with local
ACE-Step 1.5 or phaya/Suno, and build a synced kinetic-typography three.js MV (1920×1080). `explainer-video`: a ≤45 s
vertical (9:16) 3D explainer: hook-first narrated script, open-source designed TTS voice (VoxCPM2), photoreal Blender
EEVEE plates rendered through one shared headless Blender bridge, three.js overlays, captions, music and SFX. Scenes are
built in parallel by Claude Code subagents; output lands in `~/Downloads`. A 16:9 1–5 min lesson mode is in progress.
Thai by default, other languages work. Requires an Apple Silicon Mac, Blender 5+, Chrome, Node 22.12+, ffmpeg and uv.
Install: `/plugin marketplace add Boom-Vitt/bbn-video-studio`, then `/plugin install bbn-video-studio@bbn-video-studio`.
