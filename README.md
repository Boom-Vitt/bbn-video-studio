# bbn-video-studio

ปลั๊กอิน BBN Studio สำหรับ Claude Code และ Codex มี 3 สกิล:

| สกิล | ได้อะไร |
|---|---|
| `music-video` | แต่งเพลง (ไทยหรือภาษาอื่น) → สร้างเพลงด้วย ACE-Step ในเครื่อง (ฟรี) หรือ phaya/Suno → MV แบบ kinetic typography ด้วย three.js ซิงก์กับเนื้อร้อง → MP4 1920×1080 |
| `short-ex-3d` | คลิปอธิบาย/สื่อการสอนแนวตั้ง 9:16 ไม่เกิน 45 วิ: บทเปิดด้วยคำถาม → เสียงพากย์ AI โอเพนซอร์ส (VoxCPM2) → ฉาก 3D จาก Blender + three.js → ซับในตัว ดนตรี และเสียงเอฟเฟกต์ → MP4 1080×1920 พร้อมแคปชันโพสต์ |
| `long-ex` | วิดีโออธิบายแบ่งเป็นบท ค่าเริ่มต้น 1–5 นาที 16:9 1920×1080 ที่ 24 fps: ค้นข้อมูล → บทพากย์ → กำกับภาพ → สร้างฉากด้วย workflow ที่พร้อมใช้งาน → รวมเสียง ซับ และ MP4 พร้อมแหล่งอ้างอิง |

`music-video` และ `short-ex-3d` ใช้ pipeline เดิม และแบ่งฉากให้ subagent ทำพร้อมกันเมื่อเครื่องมือรองรับ
`long-ex` เก็บ manifest ของบท/ฉากและไฟล์ไว้ในโฟลเดอร์หัวข้อ เพื่อแก้เฉพาะฉากและทำต่อได้

`short-ex-3d` คือชื่อใหม่ของ `explainer-video`; โปรเจกต์วิดีโอที่สร้างไปแล้วไม่ต้องย้ายหรือเปลี่ยนชื่อ
งานอธิบายยาวใช้ `long-ex` แทนการยืด engine คลิปสั้น

## long-ex และ 5 workflow

`long-ex` ประสานงานทั้งห้าในแผน แต่เรียกใช้เฉพาะส่วนที่เหมาะกับเรื่อง มี runtime และได้รับอนุญาต:

| Workflow | หน้าที่ | เงื่อนไข |
|---|---|---|
| [HyperFrames](https://github.com/heygen-com/hyperframes) | Timeline, diagram, typography และรวมวิดีโอ | Apache-2.0; ตรวจ Node 22+, FFmpeg, Chrome และ installation ที่ใช้งานจริง |
| [onetake](https://github.com/feitangyuan/onetake) | ช่วงกล้องต่อเนื่องและตรวจ continuity / pacing / framing / audio | PolyForm Noncommercial; ไม่รวมโค้ดหรือสกิลไว้ใน BBN และต้องมีหลักฐาน commercial license สำหรับ external route นี้ |
| [Collage B-roll](https://github.com/pyang5166/gbro-collage-broll) | ภาพเปรียบเทียบแบบ paper collage | MIT; อนุมัติ metaphor → still → ค่าใช้จ่าย → Gemini video → QA; มีค่าใช้จ่ายและต้องตรวจ provider |
| [Claude Animation Base](https://github.com/JohnHeibel/ClaudeAnimationBase) | ฉากตัวละครวาดมือด้วย p5.js / p5.brush | MIT; storyboard และ contact-sheet QA; watercolour อาจเรนเดอร์ช้า |
| [Lemo-Opuscar](https://github.com/lemomo-ai/lemo-opuscar) | กำกับภาพ เลือกจาก 43 styles หรือสร้างฉาก Canvas/WebGL | MIT สำหรับ repo หลัก; ตรวจ license ของ demo assets แยก |

ไม่มีโค้ด/โมเดลของทั้งห้าติดมากับปลั๊กอินนี้ การสร้างวิดีโอจริงขึ้นกับ workflow ที่มีอยู่และการอนุญาตใช้งาน
ถ้า route ขาด runtime, license หรือ spending approval ให้บันทึกว่า blocked และเสนอทางเลือกอย่างตรงไปตรงมา
ทางเลือกที่ BBN เขียนเองไม่ใช่การรัน onetake หรือ renderer ต้นฉบับ ตรวจการออกเสียงและฟอนต์/ซับภาษาไทยแยกเสมอ
รายละเอียดและแหล่งข้อมูล: [integration guide](plugins/bbn-video-studio/skills/long-ex/references/integrations.md)
แต่ละ route มี setup, capability checks, input/output และขั้นตอนส่งงานไปยัง skill/guide ต้นฉบับจริง
บันทึก `workflow_ref` ของ installation ที่อ่าน และ `handoff_ref` ของคำขอฉาก; validator แบบ `--ready` ต้องมีทั้งสอง
ดู [handoff template](plugins/bbn-video-studio/skills/long-ex/handoff.example.md) การใช้ Lemo เพื่อกำกับภาพอย่างเดียว
ต้องรายงานว่าเป็น direction; จะนับว่า render ผ่าน workflow ใดได้ก็ต่อเมื่อ workflow นั้นรันและคืน artifacts จริง

Manifest ตัวอย่างและ validator ใช้ Python standard library เท่านั้น ไม่ติดตั้งโปรแกรม ไม่เรียก API และไม่เรนเดอร์:

```bash
python3 plugins/bbn-video-studio/skills/long-ex/scripts/validate_manifest.py plugins/bbn-video-studio/skills/long-ex/manifest.example.json
python3 -m unittest discover -s tests -v
```

เพิ่ม `--ready` เพื่อตรวจหลักฐาน prerequisites ที่บันทึกไว้ ก่อนรันต้องตรวจสิทธิ์และ provider จริงด้วย
Manifest ตัวอย่างเป็นแผน จึงยังไม่ผ่าน `--ready`

## ติดตั้ง
### Codex: ใช้ checkout ในเครื่อง

```bash
codex plugin marketplace add /absolute/path/to/bbn-video-studio
codex plugin add bbn-video-studio@bbn-video-studio
codex plugin list --marketplace bbn-video-studio --json
```

ใช้ path ของ checkout ที่มีไฟล์ `.agents/plugins/marketplace.json` นี้ เปิด task ใหม่เพื่อโหลด skills ที่อัปเดต
ไม่ต้องหยุด task เก่าหรือแก้ installed cache ของ task ที่กำลังรัน ชื่อสกิลใน Codex คือ `$music-video`, `$short-ex-3d`, `$long-ex`
เมื่อต้นฉบับอ้างถึง Agent / SendMessage ของ Claude ให้ใช้เครื่องมือ delegation ที่ host มี โดยรักษา ownership และข้อจำกัดงานหนักเดิม

### Claude Code
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
X="$(find ~/.claude/plugins -path '*bbn-video-studio*/skills/short-ex-3d/scripts' -type d | head -1)"
"$X/setup.sh"     # Python env: VoxCPM2, mlx-whisper, librosa → ~/.venvs/bbn-video-studio
echo 'export PY=$HOME/.venvs/bbn-video-studio/bin/python' >> ~/.zshrc && source ~/.zshrc
"$X/doctor.sh"    # ต้องขึ้น ok ทุกบรรทัด (ACE-Step ไม่บังคับ)
```
ให้ AI แต่งเพลงในเครื่อง (ไม่บังคับ แต่ `music-video` ต้องใช้ ถ้าไม่มี phaya):
```bash
git clone https://github.com/ACE-Step/ACE-Step-1.5.git ~/ACE-Step-1.5 && cd ~/ACE-Step-1.5 && uv sync
uv run acestep-download && uv run acestep-download -m acestep-v15-xl-sft && uv run acestep-download -m acestep-5Hz-lm-4B
```
ถ้าไม่ลง ACE-Step: `short-ex-3d` ใช้เพลงที่มีสิทธิ์ใช้วางที่ `music/bed.wav` แทนได้, `music-video` ใช้ phaya ได้ (ตั้ง `PHAYA_API_KEY` เป็นตัวแปร env เท่านั้น ห้ามใส่ในไฟล์)

## ใช้งาน
```
/bbn-video-studio:music-video แต่งเพลงล้อเลียนชีวิตออฟฟิศที่ทุกคนส่งบอตไปประชุมแทน
/bbn-video-studio:short-ex-3d หัวข้อ: พร้อมเพย์ทำงานยังไง
/bbn-video-studio:long-ex อธิบายพร้อมเพย์ให้คนเริ่มต้นเข้าใจใน 3 นาที แบ่งเป็นบท พร้อมแหล่งอ้างอิง
```
หรือพิมพ์ธรรมดา เช่น "ทำ MV เพลง…", "ทำคลิปสั้น 3D อธิบายว่า…", "ทำวิดีโออธิบายยาวแบ่งเป็นบท…" agent จะเลือกสกิลเอง

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
BBN Studio is a Claude Code and Codex plugin with three workflows. `music-video`: write a song, generate it with local
ACE-Step 1.5 or phaya/Suno, and build a synced kinetic-typography three.js MV (1920×1080). `short-ex-3d`: a ≤45 s
vertical (9:16) 3D explainer: hook-first narrated script, open-source designed TTS voice (VoxCPM2), photoreal Blender
EEVEE plates rendered through one shared headless Blender bridge, three.js overlays, captions, music and SFX. Scenes are
built in parallel when the host supports subagents; output lands in `~/Downloads`. `short-ex-3d` is the renamed
`explainer-video` skill; existing generated projects need no migration. `long-ex` plans and produces chaptered
explanations, defaulting to 16:9, 1–5 minutes at 1920×1080/24 fps, with a resumable scene manifest, shared direction,
narration/captions and QA. It coordinates HyperFrames, onetake, Collage B-roll, Claude Animation Base and Lemo-Opuscar
as external optional routes. No upstream renderer is bundled. onetake requires separately verified commercial-license
evidence; collage requires creative approvals and separately authorized paid generation. Missing routes remain blocked.
Thai by default, other languages work. Requires an Apple Silicon Mac, Blender 5+, Chrome, Node 22.12+, ffmpeg and uv.
Install: `/plugin marketplace add Boom-Vitt/bbn-video-studio`, then `/plugin install bbn-video-studio@bbn-video-studio`.
