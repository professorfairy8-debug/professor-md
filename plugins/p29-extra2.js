// ============================================================
// PROFESSOR²⁹ MD — extra commands pack 2 (offline, no API)
// AFK, reminders, notes, couple, actions, riddles, flag quiz
// ============================================================
const { cmd } = require('../arslan');

const pick = (a) => a[Math.floor(Math.random() * a.length)];
const num = (jid) => String(jid || '').split('@')[0].split(':')[0];
const tagOf = (jid) => '@' + num(jid);
const READMORE = '\u200e'.repeat(4001); // WhatsApp "Read more"

function def(pattern, alias, category, desc, react, fn) {
    cmd({ pattern, alias, category, desc, react, filename: __filename }, async (conn, mek, m, ctx) => {
        try { await fn(conn, mek, m, ctx); }
        catch (e) { console.error(`[p29-extra2] ${pattern}:`, e.message); await ctx.reply(`❌ *${pattern}* me masla aa gaya: ${e.message}`); }
    });
}
function target(ctx) {
    if (ctx.mentionedJid && ctx.mentionedJid.length) return ctx.mentionedJid[0];
    if (ctx.quoted && ctx.quoted.sender) return ctx.quoted.sender;
    return null;
}
const send = (c, from, mek, text, mentions) => c.sendMessage(from, { text, mentions: (mentions || []).filter(Boolean) }, { quoted: mek });
const fmtDur = (ms) => { const s = Math.floor(ms / 1000), h = Math.floor(s / 3600), mi = Math.floor(s % 3600 / 60); return h ? `${h}h ${mi}m` : mi ? `${mi}m ${s % 60}s` : `${s}s`; };

// ============================================================
// 💤 AFK — jab koi aap ko mention kare, bot bata de ke aap AFK hain
// ============================================================
const afk = new Map(); // key: bare number -> { reason, since }
def('afk', ['away', 'brb'], 'tools', 'AFK on: .afk khana kha raha hoon', '💤', async (c, mek, m, ctx) => {
    afk.set(num(ctx.sender), { reason: ctx.q || 'Busy', since: Date.now(), jid: ctx.sender });
    send(c, ctx.from, mek, `💤 ${tagOf(ctx.sender)} ab *AFK* hain.\n📝 Wajah: ${ctx.q || 'Busy'}\n\n_Wapas aa kar koi bhi message likhein, AFK khud hat jayega._`, [ctx.sender]);
});
cmd({ pattern: 'p29_afk_hook', on: 'body', dontAddCommandList: true, filename: __filename }, async (c, mek, m, ctx) => {
    try {
        if (!afk.size || mek.key.fromMe) return;
        const me = num(ctx.sender);
        // the AFK person wrote something -> welcome back (but not for the .afk command itself)
        if (afk.has(me) && !/^\s*[.!#\/]?(afk|away|brb)\b/i.test(ctx.body || '')) {
            const a = afk.get(me); afk.delete(me);
            return send(c, ctx.from, mek, `👋 Welcome back ${tagOf(ctx.sender)}! Aap *${fmtDur(Date.now() - a.since)}* AFK rahe.`, [ctx.sender]);
        }
        const hits = [...new Set([...(ctx.mentionedJid || []), ctx.quoted && ctx.quoted.sender].filter(Boolean).map(num))].filter(n => afk.has(n) && n !== me);
        for (const n of hits) {
            const a = afk.get(n);
            await send(c, ctx.from, mek, `💤 @${n} abhi *AFK* hain (${fmtDur(Date.now() - a.since)} se)\n📝 ${a.reason}`, [a.jid || n + '@s.whatsapp.net']);
        }
    } catch (e) { /* hook never breaks chat */ }
});

// ============================================================
// ⏰ REMINDER
// ============================================================
def('remind', ['reminder', 'yaad'], 'tools', 'Yaad dilao: .remind 10m chai banani hai (s/m/h)', '⏰', async (c, mek, m, ctx) => {
    const mt = String(ctx.q || '').match(/^(\d+)\s*(s|sec|m|min|h|hr|hour)s?\b\s*(.*)$/i);
    if (!mt) return ctx.reply('⏰ Usage: *.remind 10m chai banani hai*\n(s = second, m = minute, h = ghanta — zyada se zyada 24h)');
    const mult = /^h/i.test(mt[2]) ? 3600e3 : /^m/i.test(mt[2]) ? 60e3 : 1e3;
    const ms = parseInt(mt[1], 10) * mult;
    if (ms < 5e3 || ms > 24 * 3600e3) return ctx.reply('❌ 5 second se 24 ghante tak ka reminder lag sakta hai.');
    const what = mt[3] || 'Aap ka reminder';
    setTimeout(() => { send(c, ctx.from, mek, `⏰ *REMINDER* ${tagOf(ctx.sender)}\n\n📝 ${what}`, [ctx.sender]).catch(() => {}); }, ms);
    ctx.reply(`✅ Theek hai! *${fmtDur(ms)}* baad yaad dila dunga:\n📝 ${what}\n\n_Note: bot restart ho jaye to reminder mit jata hai._`);
});

// ============================================================
// 📝 NOTES (per chat, MongoDB global setting me save)
// ============================================================
let db = null; try { db = require('../lib/database'); } catch (e) {}
const notesKey = (from) => 'notes:' + from;
const getNotes = (from) => { try { return (db && db.getGlobalSetting(notesKey(from))) || {}; } catch (e) { return {}; } };
const setNotes = (from, v) => { try { db && db.setGlobalSetting(notesKey(from), v); } catch (e) {} };

def('note', ['savenote', 'addnote'], 'tools', 'Note save: .note naam | text', '📝', async (c, mek, m, ctx) => {
    const [name, ...rest] = String(ctx.q || '').split('|');
    const key = (name || '').trim().toLowerCase(), text = rest.join('|').trim() || (ctx.quoted && (ctx.quoted.body || ctx.quoted.text)) || '';
    if (!key) {
        const notes = getNotes(ctx.from);
        const k = Object.keys(notes);
        return ctx.reply(k.length ? `📝 Notes: ${k.map(x => '*' + x + '*').join(', ')}\n\nParhein: *.note naam*\nNaya: *.note naam | text*` : '📝 Usage: *.note rules | Group ke rules yahan...*');
    }
    const notes = getNotes(ctx.from);
    if (!text) return ctx.reply(notes[key] ? `📝 *${key}*\n\n${notes[key]}` : `❌ "${key}" naam ka note nahi mila.`);
    if (ctx.isGroup && !ctx.isAdmins && !ctx.isOwner) return ctx.reply('❌ Group me note sirf admin save kar sakte hain.');
    if (Object.keys(notes).length >= 50 && !notes[key]) return ctx.reply('❌ Zyada se zyada 50 notes. Pehle koi delete karein.');
    notes[key] = text.slice(0, 3000); setNotes(ctx.from, notes);
    ctx.reply(`✅ Note *${key}* save ho gaya.`);
});
def('notes', ['allnotes', 'listnotes'], 'tools', 'Is chat ke saare notes', '🗒️', async (c, mek, m, ctx) => {
    const k = Object.keys(getNotes(ctx.from));
    ctx.reply(k.length ? `🗒️ *Notes (${k.length})*\n\n${k.map((x, i) => `${i + 1}. ${x}`).join('\n')}\n\n_Parhne ke liye: .note naam_` : '🗒️ Is chat me koi note nahi.');
});
def('delnote', ['removenote', 'rmnote'], 'tools', 'Note delete: .delnote naam', '🗑️', async (c, mek, m, ctx) => {
    const key = String(ctx.q || '').trim().toLowerCase(); if (!key) return ctx.reply('Usage: *.delnote naam*');
    if (ctx.isGroup && !ctx.isAdmins && !ctx.isOwner) return ctx.reply('❌ Sirf admin');
    const notes = getNotes(ctx.from); if (!notes[key]) return ctx.reply('❌ Ye note nahi mila');
    delete notes[key]; setNotes(ctx.from, notes); ctx.reply(`🗑️ Note *${key}* delete ho gaya.`);
});

// ============================================================
// 💑 COUPLE + ACTIONS
// ============================================================
def('couple', ['jodi', 'pair-up'], 'fun', 'Group ki aaj ki jodi', '💑', async (c, mek, m, ctx) => {
    if (!ctx.isGroup) return ctx.reply('❌ Sirf group me');
    const list = (ctx.participants || []).map(p => p.id);
    if (list.length < 2) return ctx.reply('Kam az kam 2 members chahiye');
    const a = pick(list); let b = pick(list); let guard = 0; while (b === a && guard++ < 20) b = pick(list);
    send(c, ctx.from, mek, `💑 *Aaj ki Jodi*\n\n${tagOf(a)} ❤️ ${tagOf(b)}\n\n${pick(['Rab ne bana di jodi 💍', 'Made for each other 🥰', 'Kya baat hai! 😍', 'Nazar na lage 🧿'])}`, [a, b]);
});
const ACTIONS = {
    hug: ['🤗', 'ne', 'ko zor ki jhappi di', ['Jhappi = dawai 💕', 'Aww 🥺']],
    slap: ['👋', 'ne', 'ko chapat maar di', ['Dard hua? 😂', 'Bechara 😅']],
    pat: ['🫳', 'ne', 'ke sar par pyaar se haath phera', ['Good boy/girl 🥰', 'Aww 💖']],
    highfive: ['🙌', 'ne', 'ke saath high five ki', ['Team 🔥', 'Yeah! ✨']],
    poke: ['👉', 'ne', 'ko chhera', ['Jaago! 😜', 'Oye! 😆']],
    salute: ['🫡', 'ne', 'ko salute kiya', ['Respect 💯', 'Izzat 🫡']]
};
for (const [name, [ico, mid, act, ends]] of Object.entries(ACTIONS)) {
    def(name, [], 'fun', `${ico} Kisi ko ${name} karein: .${name} @user`, ico, async (c, mek, m, ctx) => {
        const t = target(ctx);
        if (!t) return ctx.reply(`${ico} Kisi ko mention karein ya us ke message par reply: *.${name} @user*`);
        send(c, ctx.from, mek, `${ico} ${tagOf(ctx.sender)} ${mid} ${tagOf(t)} ${act}!\n${pick(ends)}`, [ctx.sender, t]);
    });
}

// ============================================================
// 🧩 RIDDLE + 🏳️ FLAG QUIZ (answer hidden behind "Read more")
// ============================================================
const RIDDLES = [
    ['Wo kya hai jo jitna sukhata hai, utna geela hota hai?', 'Towel (tauliya)'],
    ['Aisi kaunsi cheez hai jo toot jati hai bina chhuye?', 'Waada (promise)'],
    ['Mere paas sheher hain par ghar nahi, darya hain par pani nahi. Main kaun?', 'Naqsha (map)'],
    ['Wo kya hai jis ke daant hain par kaat nahi sakta?', 'Kanghi (comb)'],
    ['Wo kya hai jo upar jata hai par kabhi neeche nahi aata?', 'Umar (age)'],
    ['Jitna zyada lo, utna peeche chhorte jao. Kya hai?', 'Qadam (footsteps)'],
    ['Wo kya hai jis ki aankh hai par dekh nahi sakti?', 'Sui (needle)'],
    ['Wo kaunsa sawal hai jis ka jawab kabhi "haan" nahi ho sakta?', '"Kya aap so rahe hain?"'],
    ['Wo kya hai jo aap ka hai, lekin doosre zyada istemal karte hain?', 'Aap ka naam'],
    ['Har roz aata hai, kabhi "kal" nahi aata. Kya?', 'Aaj'],
    ['Wo kya hai jo bolti hai par munh nahi, sunti hai par kaan nahi?', 'Goonj (echo)'],
    ['Ghar se nikalte hi saath chalti hai, andhere me chhor deti hai. Kaun?', 'Parchhai (shadow)']
];
def('riddle', ['paheli', 'puzzle'], 'fun', 'Paheli — jawab "Read more" me', '🧩', async (c, mek, m, ctx) => {
    const [q, a] = pick(RIDDLES);
    ctx.reply(`🧩 *Paheli*\n\n${q}\n\n_Soch kar phir "Read more" dabayein_ 👇${READMORE}\n✅ Jawab: *${a}*`);
});
const FLAGS = [['🇵🇰', 'Pakistan'], ['🇮🇳', 'India'], ['🇸🇦', 'Saudi Arabia'], ['🇦🇪', 'UAE'], ['🇹🇷', 'Turkey'], ['🇬🇧', 'UK'], ['🇺🇸', 'USA'], ['🇨🇦', 'Canada'], ['🇯🇵', 'Japan'], ['🇨🇳', 'China'], ['🇧🇩', 'Bangladesh'], ['🇦🇫', 'Afghanistan'], ['🇮🇷', 'Iran'], ['🇶🇦', 'Qatar'], ['🇲🇾', 'Malaysia'], ['🇮🇩', 'Indonesia'], ['🇪🇬', 'Egypt'], ['🇧🇷', 'Brazil'], ['🇦🇷', 'Argentina'], ['🇫🇷', 'France'], ['🇩🇪', 'Germany'], ['🇮🇹', 'Italy'], ['🇪🇸', 'Spain'], ['🇦🇺', 'Australia'], ['🇰🇷', 'South Korea'], ['🇷🇺', 'Russia'], ['🇳🇵', 'Nepal'], ['🇱🇰', 'Sri Lanka'], ['🇴🇲', 'Oman'], ['🇰🇼', 'Kuwait']];
def('flagquiz', ['guessflag', 'jhanda'], 'fun', 'Jhanda pehchano — jawab "Read more" me', '🏳️', async (c, mek, m, ctx) => {
    const [f, name] = pick(FLAGS);
    const opts = [name]; while (opts.length < 4) { const o = pick(FLAGS)[1]; if (!opts.includes(o)) opts.push(o); }
    opts.sort(() => Math.random() - .5);
    ctx.reply(`🏳️ *Flag Quiz*\n\nYe kis mulk ka jhanda hai?\n\n${f}\n\n${opts.map((o, i) => `${'ABCD'[i]}) ${o}`).join('\n')}\n\n_Jawab "Read more" me_ 👇${READMORE}\n✅ *${'ABCD'[opts.indexOf(name)]}) ${name}*`);
});
