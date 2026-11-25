# PROFESSOR²⁹ MD — Fixes (Nov 2026)

## Naya
- **Har command ke end me** `> *Powered by PROFESSOR²⁹ MD*` (config: `FOOTER_TEXT`)
- **Nayi DP**: `media/bot-dp.jpg` + `plugins/utils/bot_image.jpg`
- **Menu**: 🌸/👑 hata diye, kacha channel link hata diya → neeche **"View channel"** button
- **.chreact** — channel auto-react (default ON)
  - `.chreact on` / `.chreact off` / `.chreact status`
  - `.chreact key <API_KEY>` (ya Config Var `CHREACT_API_KEY`)
  - `.chreact <post link> ❤️` — manual react via ammar-chreact-api
- **.autoreact** on / off / set ❤️,🌹 / reset — har message par pyara react

## Fix
- **kick / tagall / promote / demote / "only admins"** — Baileys v7 LID groups ka masla (admin check har ID form se)
- **kick** — mention / reply / number; bot aur owner kabhi kick nahi hote (kickall / end bhi)
- **Anti-delete** — ab "You" chat (Message yourself) me, media ke saath
- **Channel react** — galat server-id fix; boot par latest 3 posts par react
- **Song** — saare servers ek saath try (pehle ek-ek kar ke minutes lagte the)
- **Fancy** — offline (40 styles), API error khatam

## v3
- **Channel auto-react hamesha ON** (default) — pyare dil/happy emojis: ❤️🩷💖💗💕💞🥰😍😘🤗😊🫶🌹🌸✨🦋…  Band karna ho to `.chreact off`
- Connect par channel JID 4 dafa tak try (pehle ek dafa fail ho kar ruk jata tha)
- **.autostatus** naya (pehle wala kisi setting ko nahi badalta tha): on / off / view on|off / like on|off / emoji
- `.autostatusview` alias add (help text me yahi likha tha lekin command nahi thi)
- **quiz / numgame / giveaway** — jawab ab check hote hain (un ka hook kabhi call nahi hota tha)
- **.yt** — ab song wala mazboot multi-server downloader use karta hai
- **.ping** — live edit me bhi footer
- antibot / antifake / kickoffline / botadmin / removeadmins — LID groups me bot-admin check fix
  (removeadmins pehle khud bot ko bhi nikalne ki koshish karta tha)
