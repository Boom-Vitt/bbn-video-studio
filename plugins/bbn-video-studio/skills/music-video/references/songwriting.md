# Writing the song

The goal is a *sister piece*: same craft and emotional shape as the reference, different story, words, melody, palette
and mascot. "Mimic but not the same" means the user should feel the family resemblance without being able to point at
a copied line or image.

## 1. Extract the reference's skeleton (not its content)
From `transcript.txt` + contact sheets, write down the function of each section, e.g. for "LGTM":

| Section | Function | Device |
|---|---|---|
| Intro (spoken) | the boss's Slack message sets up the absurd premise | spoken chat message |
| Verse 1 | escalating corporate AI-first decisions | concrete numbers, named characters |
| Pre-chorus | the hidden danger ("nobody knows what the code does") | foreshadowing |
| Chorus | acronym hook everyone types without reading | spelled-out acronym chant |
| Post-chorus | call-and-response gag | "All done (it isn't)" |
| Verse 2 | consequences pile up | specific funny failures |
| Bridge | the incident at a precise bad time | "3 a.m." |
| Breakdown | "we told you" accountability | call-and-response |
| Final chorus | bot replaces everyone | escalation of the hook |
| Outro (spoken) | callback to the intro message | punchline |

Keep that skeleton. Replace everything else.

## 2. Find the local truth
The best hook is a phrase the audience types every day without thinking. Thai office culture is rich here:
รับทราบครับ (acknowledged), ด่วนมาก (very urgent), รบกวนพี่ๆ, เดี๋ยวกลับมาคุยกัน, ฝากด้วยนะคะ, ประชุมก่อนประชุม,
LINE read receipts "อ่านแล้ว 47". Pair it with a current AI-at-work absurdity (AI summaries, notetakers, agents,
token bills) and a concrete escalating disaster that pays off a detail planted early (the fine print on page 47 →
the company gets acquired in the bridge).

Pick a POV different from the reference (LGTM = engineer; Noted = the whole LINE group / the bot).

## 3. Lyrics craft (Thai)
- 8 lines per verse/chorus, 8–14 syllables per line; couplets with end rhyme (สัมผัส) — e.g. -าย/-าย, -ต/-ต.
- Concrete nouns and numbers beat abstractions (92 หน้า, 47 คน, 16:59, ข้อ 12.4(ข)).
- Parentheses = backing vocal / response. The video renders them as red-pen annotations, so use them for the
  call-and-response joke: `อ่านแล้ว (ไม่ได้อ่าน)`.
- Section tags in square brackets on their own line: `[Intro - spoken, LINE message]`, `[Verse 1]`, `[Pre-Chorus]`,
  `[Chorus]`, `[Post-Chorus]`, `[Bridge]`, `[Breakdown - call and response]`, `[Final Chorus]`, `[Outro - spoken]`.
  The slug before " - " becomes the line-id prefix (verse1-3, chorus2-1 …), so keep tags stable once scenes exist.
- Repeat the full chorus text each time (Suno only sings what is written). Small variation in the reprise is good
  (92 → 300 pages) and gives the reused scene a variant.

## 4. Hard limits (phaya / Suno)
- prompt (the lyrics) ≤ 2000 characters. Thai vowels and tone marks are separate code points, so count with
  `python3 -c "print(len(open('song/lyrics.txt').read()))"`. ~1950 is a full 3.5–4 min song.
- style ≤ 100 chars, e.g. `Thai nu-disco, city pop, funky slap bass, four-on-the-floor, 120 BPM, glossy synths, female vocal`.
  Swap vocal gender / genre vs the reference to help "not the same".
- negative_tags: `luk thung, ballad, slow, lo-fi` keeps Thai prompts from drifting to slow ballads.
- model V5. Each request returns 2 takes (3 credits).

## 5. Get sign-off once
Show the concept in one line + the chorus as a preview (AskUserQuestion with a preview pane works well) before
spending credits. Then don't re-ask.

## 6. Deliverable copy
After the render, give the title + a short description in the user's language, in the reference's tone: one dry
paragraph of premise, one line of "something to dance to while…", a credits block, 3–4 hashtags. Noted's:

```
รับทราบครับ (Noted)

บอสส่งแผน AI-First 92 หน้าเข้ากลุ่มไลน์ตอนห้าทุ่มสี่สิบเจ็ด แล้วมีคน "อ่านแล้ว 47" ตอบ "รับทราบครับ" กันทั้งกลุ่ม
แต่ไม่มีใครเปิดอ่านจริงสักคน … จนวันศุกร์ 16:59 มีจดหมายมาบอกว่า ตามสัญญาข้อ 12.4(ข) บริษัททั้งบริษัทเป็นของเขาไปแล้ว
ข้อความนี้ซ่อนอยู่ในหน้า 47 ที่ไม่มีใครเลื่อนไปถึง

เพลงนี้ไว้เต้นตอนกดรับทราบข้อความถัดไปโดยไม่อ่าน และเป็นใบเสร็จให้ทุกคนที่จะถามในที่ประชุมว่า "ทำไมไม่มีใครบอกพี่"

เพลง: phaya (AI) · ภาพเคลื่อนไหว: Claude Opus 5.5 · TypeScript + three.js · สรุปโดย: น้องสรุป (อ่านไป 0 หน้า) · ผู้อ่านจริง: 1 คน
#รับทราบครับ #นูดิสโก้ #มนุษย์ออฟฟิศ #AIFirst
```
