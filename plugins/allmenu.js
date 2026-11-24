const { cmd, commands } = require("../arslan");
const moment = require("moment-timezone");
const fs = require("fs");
const { fakevCard } = require('../lib/fakevCard');
const config = require("../config");

const categoryIcons = {
    system: "⚙️", general: "🌐", owner: "👑", group: "👥",
    admin: "🛡️", download: "📥", downloader: "📥", fun: "🎉",
    search: "🔍", tools: "🧰", sticker: "🖼️", ai: "🤖",
    convert: "🔄", nsfw: "🔞", anti: "🚫", other: "✨"
};

// ============================================================
// 10 DIFFERENT MENU DESIGNS — one is picked at random every time
// someone runs .menu, so it doesn't look the same twice in a row.
// ============================================================
const THEMES = [
    // 1. Classic sharp box
    {
        header: (n, o, c, t, d) => `╭━━━❰ *${n}* ❱━━━┈⊷\n┃\n┃ 👑 *Owner*    : ${o}\n┃ 📦 *Commands* : *${c}*\n┃ ⏰ *Time*     : ${t}\n┃ 📅 *Date*     : ${d}\n┃ 🚀 *Platform* : ᑭᖇOᖴESSOᖇ ²⁹ ᗰᗪ🍷🚩\n┃\n╰━━━━━━━━━━━━━━━━━━━┈⊷`,
        cat: (icon, cat) => `\n╭─❖ ${icon} *${cat}* ❖─╮`,
        bullet: c => `│ ➤ ${c}`,
        catEnd: `╰────────────────╯`,
        footer: n => `━━━━━━━━━━━━━━━━━━━\n   *Powered By ${n}*\n━━━━━━━━━━━━━━━━━━━`
    },
    // 2. Double-line formal box
    {
        header: (n, o, c, t, d) => `╔══════════════════╗\n║  *${n}*\n╠══════════════════╣\n║ 👑 Owner    : ${o}\n║ 📦 Commands : *${c}*\n║ ⏰ Time     : ${t}\n║ 📅 Date     : ${d}\n╚══════════════════╝`,
        cat: (icon, cat) => `\n▓▒░ ${icon} *${cat}* ░▒▓`,
        bullet: c => `  ▸ ${c}`,
        catEnd: ``,
        footer: n => `╔══════════════════╗\n║  *${n}* — Powered\n╚══════════════════╝`
    },
    // 3. Rounded dotted style
    {
        header: (n, o, c, t, d) => `╭┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈╮\n┊ 🌸 *${n}* 🌸\n┊ 👑 ${o}\n┊ 📦 ${c} Commands\n┊ ⏰ ${t} • 📅 ${d}\n╰┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈╯`,
        cat: (icon, cat) => `\n✧───「 ${icon} *${cat}* 」───✧`,
        bullet: c => `   ✧ ${c}`,
        catEnd: ``,
        footer: n => `┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈\n   made with 🌸 ${n}\n┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈`
    },
    // 4. Star themed
    {
        header: (n, o, c, t, d) => `★═══════════════★\n   *${n}*\n★═══════════════★\n⋆ Owner: ${o}\n⋆ Commands: *${c}*\n⋆ ${t} | ${d}\n★═══════════════★`,
        cat: (icon, cat) => `\n☆彡 ${icon} *${cat}* 彡☆`,
        bullet: c => `  ⋆ ${c}`,
        catEnd: ``,
        footer: n => `★═══════════════★\n  *${n}* ⭐\n★═══════════════★`
    },
    // 5. Neon bracket style
    {
        header: (n, o, c, t, d) => `『 *${n}* 』\n\n⟡ Owner    : ${o}\n⟡ Commands : *${c}*\n⟡ Time     : ${t}\n⟡ Date     : ${d}`,
        cat: (icon, cat) => `\n『 ${icon} *${cat}* 』`,
        bullet: c => `  ⟡ ${c}`,
        catEnd: ``,
        footer: n => `『 *${n}* 』`
    },
    // 6. Minimalist clean lines
    {
        header: (n, o, c, t, d) => `── *${n}* ──\n\nOwner    : ${o}\nCommands : *${c}*\nTime     : ${t}\nDate     : ${d}`,
        cat: (icon, cat) => `\n── ${icon} ${cat} ──`,
        bullet: c => `• ${c}`,
        catEnd: ``,
        footer: n => `── Powered by ${n} ──`
    },
    // 7. Emoji-heavy fun style
    {
        header: (n, o, c, t, d) => `🌟━━━━━━━━━━━━🌟\n✨ *${n}* ✨\n🌟━━━━━━━━━━━━🌟\n👑 ${o}\n📦 ${c} commands loaded!\n⏰ ${t} 📅 ${d}`,
        cat: (icon, cat) => `\n🎈 ${icon} *${cat}* 🎈`,
        bullet: c => `   🌟 ${c}`,
        catEnd: ``,
        footer: n => `🎉 *${n}* 🎉\n🌟━━━━━━━━━━━━🌟`
    },
    // 8. Retro terminal style
    {
        header: (n, o, c, t, d) => `[ ${n} ]\n----------------\n> owner    : ${o}\n> commands : ${c}\n> time     : ${t}\n> date     : ${d}\n----------------`,
        cat: (icon, cat) => `\n[ ${cat.toLowerCase()} ]`,
        bullet: c => `  >> ${c}`,
        catEnd: ``,
        footer: n => `----------------\n[ powered by ${n} ]`
    },
    // 9. Elegant floral
    {
        header: (n, o, c, t, d) => `❦───────────────❦\n   *${n}*\n❦───────────────❦\n❧ Owner: ${o}\n❧ Commands: *${c}*\n❧ ${t} · ${d}`,
        cat: (icon, cat) => `\n❦ ${icon} *${cat}*`,
        bullet: c => `   ❧ ${c}`,
        catEnd: ``,
        footer: n => `❦───────────────❦\n   ${n}\n❦───────────────❦`
    },
    // 10. Futuristic block style
    {
        header: (n, o, c, t, d) => `▓▒░━━━━━━━━━━░▒▓\n  *${n}*\n▓▒░━━━━━━━━━━░▒▓\n▹ Owner: ${o}\n▹ Commands: *${c}*\n▹ ${t} | ${d}`,
        cat: (icon, cat) => `\n▓▒░ ${icon} *${cat}*`,
        bullet: c => `   ▹ ${c}`,
        catEnd: ``,
        footer: n => `▓▒░━━━━━━━━━━░▒▓\n   ${n}\n▓▒░━━━━━━━━━━░▒▓`
    }
];

cmd({
    pattern: "menu",
    alias: ["commandlist", "allmenu", "help"],
    desc: "Fetch and display all available bot commands",
    category: "system",
    filename: __filename,
}, async (conn, mek, m, { reply, args, prefix }) => {
    try {
        const pfx = prefix || config.PREFIX || '.';
        // .help <command> → details for one command
        if (args && args[0]) {
            const want = String(args[0]).toLowerCase().replace(/^[^a-z0-9]+/, '');
            const c = commands.find(x => x.on !== 'body' && String(x.pattern).toLowerCase() === want)
                || commands.find(x => x.on !== 'body' && (x.alias || []).map(a => String(a).toLowerCase()).includes(want));
            if (!c) return reply(`❌ *${want}* naam ki koi command nahi mili.\n${pfx}menu likh kar saari commands dekhein.`);
            return reply(`📖 *${pfx}${c.pattern}*\n\n📝 ${c.desc || 'No description'}\n📂 Category: ${c.category || 'misc'}` +
                ((c.alias && c.alias.length) ? `\n🔁 Aliases: ${c.alias.map(a => pfx + a).join(', ')}` : '') +
                (c.use ? `\n⚙️ Usage: ${c.use}` : ''));
        }
        const brand = conn.brand || null;
        const botDisplayName = (brand && brand.botName) || config.BOT_NAME || 'ᑭᖇOᖴESSOᖇ ²⁹ ᗰᗪ🍷🚩';
        const channelJid = (brand && brand.channelJid) || config.CHANNEL_JID;

        let grouped = {};
        const seen = new Set();
        for (const cmd of commands) {
            if (!cmd.pattern || typeof cmd.pattern !== 'string' || !cmd.category) continue;
            if (cmd.on === 'body' || cmd.dontAddCommandList) continue;   // internal hooks
            const name = cmd.pattern.toLowerCase();
            if (seen.has(name)) continue;                                // duplicates
            seen.add(name);
            const cat = String(cmd.category).toLowerCase();
            if (!grouped[cat]) grouped[cat] = [];
            grouped[cat].push(cmd.pattern);
        }

        const totalCommands = seen.size;
        const theme = THEMES[Math.floor(Math.random() * THEMES.length)];

        let menuText = "";
        const sortedCats = Object.keys(grouped).sort();
        for (const cat of sortedCats) {
            const icon = categoryIcons[cat.toLowerCase()] || "🔸";
            menuText += theme.cat(icon, cat.toUpperCase()) + "\n";
            menuText += grouped[cat].sort().map(theme.bullet).join("\n");
            if (theme.catEnd) menuText += `\n${theme.catEnd}`;
            menuText += "\n";
        }

        const time = moment().tz("Africa/Kampala").format("HH:mm:ss");
        const date = moment().tz("Africa/Kampala").format("dddd, MMMM Do YYYY");
        const ownerText = config.OWNER_NAME || "𝑃𝑅𝜣𝐹𝛯𝑺𝑺𝜣𝑅 ²⁹ 𝑅𝜦𝑍𝜦🇦🇱 ᒪEGᑎEᗪ ᖴᗩIᖇY 🚩";

        const caption = `${theme.header(botDisplayName, ownerText, totalCommands, time, date)}

*✨ Type ${pfx}help <command> for details ✨*
${menuText}
📢 *Channel Join Karein:*
${(brand && brand.channelLink) || config.CHANNEL_LINK}

${theme.footer(botDisplayName)}`.trim();

        const imgTarget = (brand && brand.botImage) || config.IMAGE_PATH;
        let menuImageSource;
        if (typeof imgTarget === 'string' && imgTarget.startsWith('data:')) {
            menuImageSource = Buffer.from(imgTarget.split(',')[1] || '', 'base64');
        } else if (typeof imgTarget === 'string' && fs.existsSync(imgTarget)) {
            menuImageSource = fs.readFileSync(imgTarget);
        } else {
            menuImageSource = { url: imgTarget || "https://files.catbox.moe/prkkzj.png" };
        }

        const liveChannelJid = channelJid || config.CHANNEL_JID;
        const menuPayload = {
            image: menuImageSource,
            caption,
            contextInfo: {
                mentionedJid: [m.sender],
                forwardingScore: 999,
                isForwarded: true,
                forwardedNewsletterMessageInfo: {
                    newsletterJid: liveChannelJid,
                    newsletterName: botDisplayName,
                    serverMessageId: 2,
                }
            }
        };
        if (!liveChannelJid) delete menuPayload.contextInfo.forwardedNewsletterMessageInfo;
        await conn.sendMessage(m.chat, menuPayload, { quoted: fakevCard });

        // 🎵 Menu song — media/menu-song.mp3 ya MENU_SONG link
        try {
            const song = config.MENU_SONG;
            let audio = null;
            if (song && /^https?:\/\//.test(song)) audio = { url: song };
            else if (song && fs.existsSync(song)) audio = fs.readFileSync(song);
            if (audio) {
                await conn.sendMessage(m.chat, { audio, mimetype: 'audio/mpeg', ptt: false }, { quoted: mek });
            }
        } catch (e) {
            console.error("Menu song error:", e.message);
        }

    } catch (err) {
        console.error("AllMenu Error:", err.message);
        reply("❌ Error while generating menu.");
    }
});
