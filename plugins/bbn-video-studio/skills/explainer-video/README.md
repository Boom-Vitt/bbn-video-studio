# blender-explainer: สกิล Claude Code ทำคลิปสั้น 3D

สั่งใน Claude Code ครั้งเดียว ได้คลิปแนวตั้ง 9:16 ยาวไม่เกิน 45 วิ ครบทั้งงาน:
- เขียนบทแบบเปิดด้วยคำถาม (hook)
- เสียงพากย์จาก AI โอเพนซอร์สที่รันในเครื่อง
- ฉาก 3D จาก Blender ร่วมกับ three.js
- ซับไตเติลในตัว ดนตรีประกอบ และเสียงเอฟเฟกต์

ได้ไฟล์ MP4 พร้อมแคปชันโพสต์ไว้ใน `~/Downloads`

## ต้องมีอะไรบ้าง
- **เครื่อง:** Mac ชิป Apple Silicon (M1 ขึ้นไป) RAM 16 GB ขึ้นไป ถ้าจะให้ AI แต่งเพลงเองด้วย แนะนำ 32 GB
- **โปรแกรม:**
  - [Claude Code](https://claude.com/claude-code)
  - [Blender](https://www.blender.org/download/) 5.0 ขึ้นไป (ทดสอบบน 5.2)
  - Google Chrome
  - Node 22.12 ขึ้นไป, ffmpeg และ [uv](https://docs.astral.sh/uv/): `brew install node ffmpeg uv`
- **พื้นที่ดิสก์:** ประมาณ 10 GB สำหรับโมเดลเสียง ถ้าลง ACE-Step ไว้แต่งเพลงด้วย ต้องเพิ่มอีกราว 40 GB

## ติดตั้ง
```bash
unzip blender-explainer-skill_2026-10-12.zip -d ~/.claude/skills/      # ใช้คนเดียว
# หรือแตกไว้ใน <repo>/.claude/skills/ แล้ว commit ทั้งทีมจะได้สกิลเดียวกัน
~/.claude/skills/blender-explainer/scripts/setup.sh         # สร้าง Python env สำหรับเสียงพากย์ (ทำครั้งเดียว)
echo 'export PY=$HOME/.venvs/blender-explainer/bin/python' >> ~/.zshrc && source ~/.zshrc
~/.claude/skills/blender-explainer/scripts/doctor.sh        # ตรวจว่าเครื่องพร้อม (ต้องขึ้น ok ทุกบรรทัด ยกเว้น ACE-Step ที่ไม่บังคับ)
```
ถ้าต้องการให้ AI แต่งเพลงประกอบเอง (ไม่บังคับ):
```bash
git clone https://github.com/ACE-Step/ACE-Step-1.5.git ~/ACE-Step-1.5 && cd ~/ACE-Step-1.5 && uv sync
uv run acestep-download && uv run acestep-download -m acestep-v15-xl-sft && uv run acestep-download -m acestep-5Hz-lm-4B
```
ถ้าไม่ลง ACE-Step ให้หาเพลงที่มีสิทธิ์ใช้ มาวางไว้ที่ `music/bed.wav` ของโปรเจกต์แทน

## ใช้งาน
เปิด Claude Code ในโฟลเดอร์ที่จะเก็บงาน แล้วพิมพ์แบบใดแบบหนึ่ง:
```
/blender-explainer หัวข้อ: พร้อมเพย์ทำงานยังไง
```
```
ทำคลิปสั้น 3D อธิบายว่า ข้อมูลที่ส่งให้ AI ไปอยู่ที่ไหน
```
Claude จะทำต่อจนจบทีละขั้น:
1. บท
2. เสียงพากย์
3. ฉาก Blender โดยแบ่งให้ subagent หลายตัวสร้างพร้อมกัน
4. ดนตรีและเสียงเอฟเฟกต์
5. เรนเดอร์
6. ตรวจภาพ

งานหนึ่งคลิปกินเวลาหลายชั่วโมง และใช้ token ค่อนข้างมาก ระหว่างทาง Claude จะส่งภาพนิ่งของแต่ละฉากมาให้ดู ติหรือสั่งแก้ได้เลย

ดูตัวอย่างงานจริงได้ใน `examples/`:
- `ai-pick`: เทียบ ChatGPT, Claude, Gemini
- `ai-trip`: การ์ตูนฟองข้อความออกผจญภัย

## ข้อควรรู้
- **รันงานหนักทีละงาน:** โมเดลเสียง โมเดลเพลง และการเรนเดอร์กินแรมมาก Claude จะรอให้งานก่อนหน้าเสร็จก่อนเริ่มงานใหม่
- **Blender:** เปิดแบบไม่มีหน้าต่างไว้ตัวเดียว (`blender/bridge.py`) แล้วให้ทุก subagent ใช้ร่วมกัน ห้ามเปิด Blender แยกต่อ subagent เพราะเครื่องจะค้าง
- **เสียงพากย์:** เป็นเสียงสังเคราะห์ (VoxCPM2 Voice Design) ไม่ใช่เสียงของคนจริง ห้ามโคลนเสียงใครโดยไม่ได้รับอนุญาตเป็นลายลักษณ์อักษร
- **โลโก้แบรนด์:** สร้างจากไฟล์ SVG ทางการเท่านั้น ห้ามวาดใหม่หรือเปลี่ยนสี และใส่เครดิตว่าเป็นเครื่องหมายการค้าของเจ้าของ
- **ข้อเท็จจริงในบท:** ต้องมีแหล่งที่มา Claude จะจดไว้ใน `ref/facts.md` ควรตรวจซ้ำก่อนโพสต์
- **API key:** ห้ามบันทึกลงไฟล์ในโปรเจกต์ ถ้าจำเป็นให้ส่งผ่านตัวแปร env ตอนรันเท่านั้น
- **License:**

  | ส่วน | License |
  |---|---|
  | VoxCPM2 | Apache-2.0 |
  | ACE-Step | MIT |
  | three.js | MIT |
  | ฟอนต์ IBM Plex Sans Thai, Kanit, Sriracha | OFL |

  เสียงเอฟเฟกต์ใน `sfx/` สังเคราะห์ด้วยโค้ด (`sfx/make_sfx.py`) จึงไม่ติดลิขสิทธิ์
