const { cmd } = require("../arslan");

cmd({
    pattern: "groupstatus",
    alias: ["gstatus", "poststatus", "statuspost"],
    desc: "Post text or media to WhatsApp Status",
    category: "group",
    react: "📡",
    filename: __filename
},
async (conn, mek, m, { reply, pushname, q, isOwner, participants }) => {
    try {
        if (!isOwner) return reply("❌ Yeh command sirf bot owner ke liye hai.");

        // WhatsApp only shows a status to the JIDs listed in statusJidList —
        // without it the post goes nowhere. Use the group members (when used
        // in a group) plus the bot's own number.
        const me = conn.user.id.split(':')[0].split('@')[0] + '@s.whatsapp.net';
        const statusJidList = [...new Set([
            me,
            ...(participants || []).map(p => p.id || p.jid).filter(j => j && j.endsWith('@s.whatsapp.net'))
        ])];
        const sendOpts = { statusJidList };
        const caption = (q || "").trim();
        const stamp = new Date().toLocaleString();

        // TEXT STATUS
        if (!m.quoted && caption) {
            await conn.sendMessage("status@broadcast", {
                text: `╭━━〔 ᑭᖇOᖴESSOᖇ ²⁹ ᗰᗪ🍷🚩 〕━━⬣\n┃ 👤 User : ${pushname}\n┃ ⏰ Time : ${stamp}\n┃\n┃ 💬 Message:\n┃ ${caption}\n╰━━━━━━━━━━━━━━━━⬣`,
                backgroundColor: "#315575",
                font: 1
            }, sendOpts);
            return reply(`✅ Text status posted (${statusJidList.length} log dekh sakte hain).`);
        }

        if (!m.quoted) {
            return reply("❌ Kisi image, video, audio ya sticker ko reply karein.\n\nExample:\n.groupstatus Hello World");
        }

        const quoted = m.quoted;
        const type = quoted.mtype;
        const mediaCaption = `👤 Posted By: ${pushname}\n🕒 ${stamp}\n\n${caption || quoted.text || ""}`.trim();

        // Quoted plain text → post it as a text status
        if (type === 'conversation' || type === 'extendedTextMessage') {
            await conn.sendMessage("status@broadcast", {
                text: quoted.text || caption, backgroundColor: "#315575", font: 1
            }, sendOpts);
            return reply("✅ Text status posted.");
        }

        if (!['imageMessage', 'videoMessage', 'audioMessage', 'stickerMessage'].includes(type)) {
            return reply("❌ Unsupported media type. Image, video, audio ya sticker reply karein.");
        }

        const media = await quoted.download();
        let content;
        if (type === 'imageMessage') content = { image: media, caption: `📸 ᑭᖇOᖴESSOᖇ ²⁹ ᗰᗪ🍷🚩\n\n${mediaCaption}` };
        else if (type === 'videoMessage') content = { video: media, caption: `🎥 ᑭᖇOᖴESSOᖇ ²⁹ ᗰᗪ🍷🚩\n\n${mediaCaption}` };
        else if (type === 'audioMessage') content = { audio: media, mimetype: "audio/mp4", ptt: false };
        else content = { image: media, caption: mediaCaption }; // stickers can't be statuses — post as image

        await conn.sendMessage("status@broadcast", content, sendOpts);
        return reply("✅ Status posted.");
    } catch (err) {
        console.error("GROUPSTATUS ERROR:", err.message);
        return reply(`❌ ᑭᖇOᖴESSOᖇ ²⁹ ᗰᗪ🍷🚩 STATUS ERROR\n\n${err.message}`);
    }
});
