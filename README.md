# ABI Sound Companion

เว็บ minimal สำหรับฟังเสียง Pickup ของ Arena Breakout: Infinite และฝึกทายเสียงไอเท็ม

## ความสามารถ

- เทียบเสียงกับเสียงอ้างอิง 38 กลุ่มในเบราว์เซอร์ โดยไม่ส่งเสียงหรือภาพหน้าจอไปเซิร์ฟเวอร์
- แสดงไอเท็มที่เป็นไปได้ พร้อมตัวกรองขนาดช่อง แผนที่/โหมด และ Cargo
- แสดงผลเบื้องต้นระหว่างเสียงยังไม่จบ
- โหมดฝึก 4 ตัวเลือกพร้อมรูปไอเท็ม เฉลย คะแนน และ streak โดยช้อยผิดใช้คนละกลุ่มเสียง

## Raid Loadout Wheel

แท็บ “สุ่มชุดลง Raid” เพิ่มวงล้อปืนพร้อมรูปอุปกรณ์ เลือกโหมด, แนวปืน, ระดับเกราะ และเกราะริกหรือเกราะแยกได้ หมุนหนึ่งครั้งได้ปืนหลัก, ammo caliber เดียวกัน, หมวก, เกราะ, เสื้อริกเมื่อจำเป็น, กระเป๋า และรายการยา/ของใช้ พร้อม checklist และ copy

- Normal: gear/ammo สูงสุด T4; Lockdown: สูงสุด T5 ตามประกาศ Season 7
- Forbidden: มีตัวเลือกเกราะ T3–T6; ammo สูงสุด T6 จากข้อมูลชุดนี้ ไม่ใช่การอ้างว่าโหมดมี cap T6
- กระสุนขั้นต่ำ T3 และขั้นต่ำ T5 เมื่อเลือกเกราะ T6 จึงตัดปืนที่ไม่มี ammo ตามตัวกรองออก
- ไม่ใส่เกราะริกซ้อนกับเกราะ/เสื้อริก
- ไม่มีการสุ่ม attachments, headset หรือ face mask ที่ยังตรวจ compatibility ไม่ได้ เลือกแม็กกาซีนให้ตรงกับปืนใน Gunsmith
- ปริมาณของใช้เป็น baseline ต้องปรับตามการเล่น ช่องเก็บ และน้ำหนัก ไม่มีการคำนวณ inventory packing หรือราคาตลาดสด จึงไม่ยืนยันเงื่อนไขมูลค่าเข้าโหมด

ข้อมูลอุปกรณ์ตรวจวันที่ 13 ต.ค. 2026 จาก [ABI Builder Wiki](https://abibuilder.com/wiki), แนวทาง [เตรียมชุด](https://abibuilder.com/guides/playing-solo-chapter-2-loadout-philosophy), [รายการแพทย์](https://arenabreakout-infinite.com/items/medical/) และ [ประกาศเกมอย่างเป็นทางการ](https://steamcommunity.com/app/2073620/announcements/?l=english) รูปอุปกรณ์โหลดจาก ABI Builder โดยตรง

ทดสอบ compatibility ด้วย `node test-loadout.mjs` (10,512 ชุดครอบคลุมทุก mode/tier/role/armor และทุกปืนใน pool)

## Deploy บน Vercel

Import รีโป `Chinaapanda/ABI-` แล้วกด Deploy ได้เลย มี `vercel.json` ตั้งค่า static site ไว้แล้ว

- Root Directory: รากรีโป (ไม่ต้องเปลี่ยนเป็น `dist`)
- Framework Preset: Other
- Build Command: ว่าง
- Output Directory: `dist`
- ไม่ต้องตั้ง Environment Variables

## เปิดในเครื่อง

ใช้ Python 3 รันจากโฟลเดอร์รีโป:

```sh
python -m http.server 8765 --bind 127.0.0.1 --directory dist
```

เปิด http://127.0.0.1:8765 ในเบราว์เซอร์ หรือใช้ static hosting ที่รองรับ HTTPS

## ข้อจำกัด

ต้องเลือกหน้าต่างเกมและเปิดแชร์เสียงหน้าต่างด้วยตัวเอง เว็บล็อกชื่อโปรเซส UAGame.exe ไม่ได้ หากเบราว์เซอร์ไม่ให้ audio track จะหยุดรับเสียง ไม่ใช้เสียงรวมทั้งเครื่อง

ทดสอบ matcher ด้วยเสียงอ้างอิงสะอาดผ่าน 38/38 ผลแรกใช้เสียงประมาณ 158–270 ms ในการป้อนข้อมูลจำลอง ไม่รวมความหน่วงการแชร์เสียง ยังไม่ได้ทดสอบรับเสียงจาก ABI จริง และเสียงอื่นที่ทับกันอาจทำให้พลาดหรือจับผิด

ไม่มีคำอนุญาตเฉพาะจากผู้พัฒนาเกมสำหรับเครื่องมือนี้ การทำงานผ่านเว็บไม่ได้รับรองว่าปลอดภัยด้านกฎกว่า desktop

## ข้อมูลและเครดิต

ข้อมูลไอเท็มและเสียงอ้างอิงมาจาก [ABI Builder](https://abibuilder.com/merchant) รูปไอเท็มโหลดจาก ABI assets ของ hexaov91 ที่ระบุในข้อมูล รูปและเสียงเป็นทรัพย์สินของเจ้าของที่เกี่ยวข้อง

[EULA](https://eulaforgames.com/rule/202406060003/ALL) · [ประกาศทีมรักษาความปลอดภัยของเกม](https://www.arenabreakoutinfinite.com/en/news.html?content_id=729a9cd8ac31fa421eaa143a3ddae66e2735)
