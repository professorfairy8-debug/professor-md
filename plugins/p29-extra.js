// ============================================================
// PROFESSOR²⁹ MD — extra commands pack (Nov 2026)
// Sab commands OFFLINE hain (koi bahar ki API nahi), is liye
// "API error" kabhi nahi aata. Footer + DP main.js khud lagata hai.
// ============================================================
const { cmd } = require('../arslan');
const crypto = require('crypto');
const os = require('os');
const fs = require('fs');
const path = require('path');

const pick = (a) => a[Math.floor(Math.random() * a.length)];
const randInt = (min, max) => Math.floor(Math.random() * (max - min + 1)) + min;
const bar = (pct) => '█'.repeat(Math.round(pct / 10)) + '░'.repeat(10 - Math.round(pct / 10));
const num = (jid) => String(jid || '').split('@')[0].split(':')[0];
const tagOf = (jid) => '@' + num(jid);

function def(pattern, alias, category, desc, react, fn) {
    cmd({ pattern, alias, category, desc, react, filename: __filename }, async (conn, mek, m, ctx) => {
        try {
            await fn(conn, mek, m, ctx);
        } catch (e) {
            console.error(`[p29-extra] ${pattern}:`, e.message);
            await ctx.reply(`❌ *${pattern}* me masla aa gaya: ${e.message}`);
        }
    });
}

// Who is the command about? mention > reply > sender
function target(ctx) {
    if (ctx.mentionedJid && ctx.mentionedJid.length) return ctx.mentionedJid[0];
    if (ctx.quoted && ctx.quoted.sender) return ctx.quoted.sender;
    return ctx.sender;
}
// Same answer for the same person on the same day (feels fair, not random spam)
function dailyScore(seed) {
    const day = new Date().toISOString().slice(0, 10);
    const h = crypto.createHash('md5').update(seed + day).digest();
    return h[0] % 101;
}
async function sendMention(conn, from, mek, text, mentions) {
    return conn.sendMessage(from, { text, mentions: mentions.filter(Boolean) }, { quoted: mek });
}

// ============================================================
// 🎉 FUN (15)
// ============================================================
def('flip', ['coinflip', 'toss'], 'fun', 'Sikka uchalein — Head ya Tail', '🪙', async (c, mek, m, { reply }) => {
    reply(`🪙 Sikka uchala...\n\n*${pick(['HEAD 👑', 'TAIL 🦅'])}* aaya!`);
});

def('rps', ['rockpaperscissors'], 'fun', 'Rock Paper Scissors: .rps rock', '✊', async (c, mek, m, { args, reply }) => {
    const map = { rock: '✊', paper: '✋', scissors: '✌️', r: '✊', p: '✋', s: '✌️', patthar: '✊', kaghaz: '✋', qainchi: '✌️' };
    const norm = { r: 'rock', p: 'paper', s: 'scissors', patthar: 'rock', kaghaz: 'paper', qainchi: 'scissors' };
    let you = (args[0] || '').toLowerCase(); you = norm[you] || you;
    if (!['rock', 'paper', 'scissors'].includes(you)) return reply('✊✋✌️ Usage: *.rps rock* / *paper* / *scissors*');
    const bot = pick(['rock', 'paper', 'scissors']);
    const win = { rock: 'scissors', paper: 'rock', scissors: 'paper' };
    const res = you === bot ? '🤝 Barabar!' : win[you] === bot ? '🎉 Aap jeet gaye!' : '😎 Bot jeet gaya!';
    reply(`Aap: ${map[you]} ${you}\nBot: ${map[bot]} ${bot}\n\n*${res}*`);
});

def('slot', ['slots', 'casino'], 'fun', 'Slot machine khelein', '🎰', async (c, mek, m, { reply }) => {
    const sym = ['🍒', '🍋', '🍇', '💎', '7️⃣', '🔔'];
    const r = [pick(sym), pick(sym), pick(sym)];
    const res = r[0] === r[1] && r[1] === r[2] ? '💰 JACKPOT! Teeno same!' : (r[0] === r[1] || r[1] === r[2] || r[0] === r[2]) ? '✨ Do same — thora sa jeet gaye!' : '😅 Is dafa nahi, dobara try karein!';
    reply(`🎰 *SLOT MACHINE*\n\n┃ ${r.join(' ┃ ')} ┃\n\n${res}`);
});

def('choose', ['chuno', 'select'], 'fun', 'Bot aap ke liye chune: .choose biryani, pizza', '🤔', async (c, mek, m, { q, reply }) => {
    const opts = String(q || '').split(/,|\bor\b|\bya\b|\|/i).map(x => x.trim()).filter(Boolean);
    if (opts.length < 2) return reply('🤔 Kam az kam 2 cheezein likhein.\nExample: *.choose biryani, pizza, burger*');
    reply(`🤔 Soch samajh kar...\n\n👉 *${pick(opts)}*`);
});

def('fortune', ['kismat', 'qismat'], 'fun', 'Aaj ki qismat', '🔮', async (c, mek, m, { reply, pushname }) => {
    const f = ['Aaj koi purana dost yaad karega 💌', 'Paisa aane ke chances hain 💸', 'Koi achi khabar milne wali hai 🎉', 'Aaj zyada pani piyen aur muskurayein 😊', 'Jis kaam ka socha hai, aaj shuru kar dein 🚀', 'Kisi ki madad karenge to din bana rahega 🤝', 'Aaj neend achi aayegi 😴', 'Koi aap ko secretly pasand karta hai 🙈', 'Sabr karein, waqt aap ka aane wala hai ⏳', 'Aaj kuch naya seekhne ka din hai 📚'];
    reply(`🔮 *${pushname || 'Aap'} ki aaj ki qismat:*\n\n${pick(f)}`);
});

def('pickupline', ['pickup', 'line'], 'fun', 'Masoom si pickup line', '😉', async (c, mek, m, { reply }) => {
    const l = ['Kya aap WiFi ho? Kyunke mujhe aap se connection mehsoos ho raha hai 📶', 'Aap Google Maps ho kya? Main aap ki aankhon mein kho gaya 🗺️', 'Aap ki smile dekh kar mera phone bhi full charge ho gaya 🔋', 'Kya aap chai ho? Har subah aap ki zaroorat mehsoos hoti hai ☕', 'Aap ke bina meri playlist adhoori hai 🎶', 'Kya aap keyboard ho? Kyunke aap bilkul mere type ke ho ⌨️', 'Aap sun ho ya moon? Din raat dimagh mein rehte ho 🌙', 'Mere dil ka password aap ka naam hai 🔐'];
    reply(`😉 ${pick(l)}`);
});

def('lovemeter', ['lovetest', 'lovecalc'], 'fun', 'Do logon ka love %: .lovemeter @a @b', '💘', async (c, mek, m, ctx) => {
    const a = ctx.mentionedJid[0] || ctx.sender;
    const b = ctx.mentionedJid[1] || (ctx.quoted && ctx.quoted.sender) || null;
    if (!b) return ctx.reply('💘 Usage: *.lovemeter @user1 @user2* ya kisi ke message par reply karein.');
    const pct = dailyScore([num(a), num(b)].sort().join('+'));
    const msg = pct > 80 ? 'Rab ne bana di jodi 💍' : pct > 60 ? 'Bohat pyari jodi 💕' : pct > 40 ? 'Dosti se shuru karein 😊' : 'Hmm... mehnat karni paregi 😅';
    sendMention(c, ctx.from, mek, `💘 *LOVE METER*\n\n${tagOf(a)} ❤️ ${tagOf(b)}\n\n${bar(pct)} *${pct}%*\n\n${msg}`, [a, b]);
});

def('friendship', ['friendrate', 'dosti'], 'fun', 'Dosti kitni pakki hai: .friendship @user', '🤝', async (c, mek, m, ctx) => {
    const t = target(ctx);
    if (t === ctx.sender) return ctx.reply('🤝 Kisi dost ko mention karein: *.friendship @user*');
    const pct = dailyScore('f' + [num(ctx.sender), num(t)].sort().join('+'));
    sendMention(c, ctx.from, mek, `🤝 *FRIENDSHIP METER*\n\n${tagOf(ctx.sender)} 🫂 ${tagOf(t)}\n\n${bar(pct)} *${pct}%*\n\n${pct > 70 ? 'Jigri yaar! 🔥' : pct > 40 ? 'Achay dost 😊' : 'Abhi aur waqt saath guzarein 😄'}`, [ctx.sender, t]);
});

def('iq', ['iqtest', 'dimagh'], 'fun', 'Mazaq wala IQ test', '🧠', async (c, mek, m, ctx) => {
    const t = target(ctx);
    const iq = 60 + Math.round(dailyScore('iq' + num(t)) * 1.0);
    sendMention(c, ctx.from, mek, `🧠 *IQ TEST* (sirf mazaq ke liye)\n\n${tagOf(t)} ka IQ: *${iq}*\n${iq > 140 ? 'Einstein bhi hairan 🤯' : iq > 110 ? 'Bohat tez dimagh 💡' : iq > 85 ? 'Bilkul theek thaak 👍' : 'Chai pi kar dobara try karein ☕'}`, [t]);
});

def('vibe', ['vibecheck', 'mood'], 'fun', 'Aaj ka vibe check', '✨', async (c, mek, m, ctx) => {
    const t = target(ctx);
    const v = ['😎 Cool & calm', '🔥 Full fire', '🥰 Cute overload', '😴 Neend mein', '🤪 Thora pagal', '👑 Royal mood', '🌸 Soft & sweet', '⚡ Full energy', '🤔 Philosopher mode', '🍕 Bhook lagi hai'];
    sendMention(c, ctx.from, mek, `✨ *VIBE CHECK*\n\n${tagOf(t)} ka aaj ka vibe:\n*${v[dailyScore('v' + num(t)) % v.length]}*`, [t]);
});

def('rizz', ['rizzrate'], 'fun', 'Rizz kitna hai', '😏', async (c, mek, m, ctx) => {
    const t = target(ctx);
    const pct = dailyScore('rz' + num(t));
    sendMention(c, ctx.from, mek, `😏 *RIZZ METER*\n\n${tagOf(t)}\n${bar(pct)} *${pct}%*\n\n${pct > 75 ? 'Rizz ka badshah 👑' : pct > 45 ? 'Kaafi smooth 😎' : 'Rizz loading... ⏳'}`, [t]);
});

def('emojify', ['emojitext'], 'fun', 'Text ko emoji letters me', '🔠', async (c, mek, m, { q, reply }) => {
    if (!q) return reply('🔠 Usage: *.emojify hello*');
    const out = Array.from(q.toLowerCase()).map(ch => {
        if (/[a-z]/.test(ch)) return String.fromCodePoint(0x1F1E6 + ch.charCodeAt(0) - 97) + '\u200b';
        if (/[0-9]/.test(ch)) return ch + '\uFE0F\u20E3';
        if (ch === ' ') return '   ';
        return ch;
    }).join('');
    reply(out);
});

def('mock', ['spongebob'], 'fun', 'mOcKiNg TeXt', '🤪', async (c, mek, m, { q, reply, quoted }) => {
    const t = q || (quoted && (quoted.body || quoted.text)) || '';
    if (!t) return reply('🤪 Usage: *.mock text* ya kisi message par reply karein');
    let i = 0;
    reply(Array.from(t).map(ch => /[a-z]/i.test(ch) ? (i++ % 2 ? ch.toUpperCase() : ch.toLowerCase()) : ch).join(''));
});

def('clap', ['clapify'], 'fun', 'Har 👏 lafz 👏 ke 👏 beech', '👏', async (c, mek, m, { q, reply }) => {
    if (!q) return reply('👏 Usage: *.clap ye bohat zabardast hai*');
    reply(q.trim().split(/\s+/).join(' 👏 ') + ' 👏');
});

def('rev', ['reversetext', 'ulta'], 'fun', 'Text ulta karein', '🔄', async (c, mek, m, { q, reply, quoted }) => {
    const t = q || (quoted && (quoted.body || quoted.text)) || '';
    if (!t) return reply('🔄 Usage: *.rev hello*');
    reply(Array.from(t).reverse().join(''));
});

// ============================================================
// 🔤 TEXT TOOLS (13)
// ============================================================
const textArg = (ctx) => ctx.q || (ctx.quoted && (ctx.quoted.body || ctx.quoted.text)) || '';

def('upper', ['uppercase', 'caps'], 'text', 'TEXT KO CAPITAL', '🔠', async (c, mek, m, ctx) => {
    const t = textArg(ctx); if (!t) return ctx.reply('Usage: *.upper text*'); ctx.reply(t.toUpperCase());
});
def('lower', ['lowercase'], 'text', 'text ko small', '🔡', async (c, mek, m, ctx) => {
    const t = textArg(ctx); if (!t) return ctx.reply('Usage: *.lower TEXT*'); ctx.reply(t.toLowerCase());
});
def('title', ['titlecase'], 'text', 'Har Lafz Ka Pehla Harf Capital', '🔤', async (c, mek, m, ctx) => {
    const t = textArg(ctx); if (!t) return ctx.reply('Usage: *.title hello world*');
    ctx.reply(t.toLowerCase().replace(/\b\p{L}/gu, ch => ch.toUpperCase()));
});
def('wc', ['wordcount', 'charcount'], 'text', 'Lafz, harf aur lines ginein', '🧮', async (c, mek, m, ctx) => {
    const t = textArg(ctx); if (!t) return ctx.reply('Usage: *.wc text* ya message par reply');
    ctx.reply(`🧮 *Text Count*\n\n• Lafz: *${(t.trim().match(/\S+/g) || []).length}*\n• Harf: *${Array.from(t).length}*\n• Bina space: *${Array.from(t.replace(/\s/g, '')).length}*\n• Lines: *${t.split('\n').length}*`);
});
def('binary', ['tobinary'], 'text', 'Text → binary', '0️⃣', async (c, mek, m, ctx) => {
    const t = textArg(ctx); if (!t) return ctx.reply('Usage: *.binary hi*');
    ctx.reply(Array.from(Buffer.from(t, 'utf8')).map(b => b.toString(2).padStart(8, '0')).join(' '));
});
def('debinary', ['unbinary', 'frombinary'], 'text', 'Binary → text', '1️⃣', async (c, mek, m, ctx) => {
    const bits = (textArg(ctx).match(/[01]{8}/g) || []);
    if (!bits.length) return ctx.reply('Usage: *.debinary 01101000 01101001*');
    ctx.reply(Buffer.from(bits.map(b => parseInt(b, 2))).toString('utf8'));
});
const MORSE = { a: '.-', b: '-...', c: '-.-.', d: '-..', e: '.', f: '..-.', g: '--.', h: '....', i: '..', j: '.---', k: '-.-', l: '.-..', m: '--', n: '-.', o: '---', p: '.--.', q: '--.-', r: '.-.', s: '...', t: '-', u: '..-', v: '...-', w: '.--', x: '-..-', y: '-.--', z: '--..', 0: '-----', 1: '.----', 2: '..---', 3: '...--', 4: '....-', 5: '.....', 6: '-....', 7: '--...', 8: '---..', 9: '----.', '.': '.-.-.-', ',': '--..--', '?': '..--..', '!': '-.-.--', '@': '.--.-.', '/': '-..-.' };
const UNMORSE = Object.fromEntries(Object.entries(MORSE).map(([k, v]) => [v, k]));
def('morse', ['tomorse'], 'text', 'Text → Morse code', '📡', async (c, mek, m, ctx) => {
    const t = textArg(ctx); if (!t) return ctx.reply('Usage: *.morse sos*');
    ctx.reply(t.toLowerCase().split(' ').map(w => Array.from(w).map(ch => MORSE[ch] || '').filter(Boolean).join(' ')).join(' / '));
});
def('demorse', ['unmorse', 'frommorse'], 'text', 'Morse code → text', '📡', async (c, mek, m, ctx) => {
    const t = textArg(ctx); if (!t) return ctx.reply('Usage: *.demorse ... --- ...*');
    ctx.reply(t.trim().split(/\s*\/\s*|\s{3,}/).map(w => w.split(/\s+/).map(s => UNMORSE[s] || '').join('')).join(' ').toUpperCase() || '❌ Samajh nahi aaya');
});
def('base64', ['tobase64', 'b64'], 'text', 'Text → Base64', '🔐', async (c, mek, m, ctx) => {
    const t = textArg(ctx); if (!t) return ctx.reply('Usage: *.base64 hello*'); ctx.reply(Buffer.from(t, 'utf8').toString('base64'));
});
def('debase64', ['unbase64', 'fromb64'], 'text', 'Base64 → text', '🔓', async (c, mek, m, ctx) => {
    const t = textArg(ctx).trim(); if (!t) return ctx.reply('Usage: *.debase64 aGVsbG8=*');
    if (!/^[A-Za-z0-9+/=\s_-]+$/.test(t)) return ctx.reply('❌ Ye Base64 nahi lagta.');
    ctx.reply(Buffer.from(t, 'base64').toString('utf8') || '❌ Khaali nateeja');
});
def('rot13', ['caesar'], 'text', 'ROT13 secret text (dobara lagao to wapas)', '🔁', async (c, mek, m, ctx) => {
    const t = textArg(ctx); if (!t) return ctx.reply('Usage: *.rot13 hello*');
    ctx.reply(t.replace(/[a-z]/gi, ch => { const b = ch <= 'Z' ? 65 : 97; return String.fromCharCode((ch.charCodeAt(0) - b + 13) % 26 + b); }));
});
def('leet', ['1337', 'hacker-text'], 'text', 'T3xt k0 l33t m3', '💻', async (c, mek, m, ctx) => {
    const t = textArg(ctx); if (!t) return ctx.reply('Usage: *.leet professor*');
    const L = { a: '4', e: '3', i: '1', o: '0', s: '5', t: '7', g: '9', b: '8', l: '1' };
    ctx.reply(Array.from(t).map(ch => L[ch.toLowerCase()] || ch).join(''));
});
def('aesthetic', ['vapor', 'wide'], 'text', 'Ａｅｓｔｈｅｔｉｃ ｔｅｘｔ', '🌸', async (c, mek, m, ctx) => {
    const t = textArg(ctx); if (!t) return ctx.reply('Usage: *.aesthetic hello*');
    ctx.reply(Array.from(t).map(ch => { const k = ch.charCodeAt(0); return k >= 33 && k <= 126 ? String.fromCharCode(k + 0xFEE0) : ch === ' ' ? '　' : ch; }).join(''));
});
def('zalgo', ['glitchtext', 'creepy'], 'text', 'Z̷a̸l̵g̴o̶ creepy text', '👻', async (c, mek, m, ctx) => {
    const t = textArg(ctx); if (!t) return ctx.reply('Usage: *.zalgo hello*');
    const marks = Array.from({ length: 0x36F - 0x300 }, (_, i) => String.fromCharCode(0x300 + i));
    ctx.reply(Array.from(t.slice(0, 200)).map(ch => ch === ' ' ? ch : ch + Array.from({ length: randInt(2, 5) }, () => pick(marks)).join('')).join(''));
});

// ============================================================
// 🧰 TOOLS (15)
// ============================================================
function parseDate(s) {
    const m = String(s || '').trim().match(/^(\d{1,2})[\/\-.](\d{1,2})[\/\-.](\d{4})$/);
    if (m) { const d = new Date(Date.UTC(+m[3], +m[2] - 1, +m[1])); return isNaN(d) || d.getUTCDate() !== +m[1] ? null : d; }
    const iso = String(s || '').trim().match(/^(\d{4})-(\d{1,2})-(\d{1,2})$/);
    if (iso) { const d = new Date(Date.UTC(+iso[1], +iso[2] - 1, +iso[3])); return isNaN(d) ? null : d; }
    return null;
}
const todayUTC = () => { const n = new Date(); return new Date(Date.UTC(n.getFullYear(), n.getMonth(), n.getDate())); };

def('age', ['agecalc', 'umar'], 'tools', 'Umar nikaalein: .age 15/08/2000', '🎂', async (c, mek, m, { q, reply }) => {
    const d = parseDate(q); if (!d) return reply('🎂 Usage: *.age 15/08/2000* (din/mahina/saal)');
    const t = todayUTC(); if (d > t) return reply('❌ Ye tareekh abhi aayi hi nahi!');
    let y = t.getUTCFullYear() - d.getUTCFullYear(), mo = t.getUTCMonth() - d.getUTCMonth(), dd = t.getUTCDate() - d.getUTCDate();
    if (dd < 0) { mo--; dd += new Date(Date.UTC(t.getUTCFullYear(), t.getUTCMonth(), 0)).getUTCDate(); }
    if (mo < 0) { y--; mo += 12; }
    const days = Math.floor((t - d) / 864e5);
    let next = new Date(Date.UTC(t.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate())); if (next < t) next.setUTCFullYear(t.getUTCFullYear() + 1);
    const left = Math.round((next - t) / 864e5);
    reply(`🎂 *Age Calculator*\n\n• Umar: *${y} saal, ${mo} mahine, ${dd} din*\n• Kul din: *${days.toLocaleString()}*\n• Agli saalgirah: ${left === 0 ? '*AAJ! Happy Birthday 🎉*' : `*${left} din* baad`}`);
});

def('bmi', ['bmicalc'], 'tools', 'BMI: .bmi 70 175 (kg cm)', '⚖️', async (c, mek, m, { args, reply }) => {
    const w = parseFloat(args[0]), h = parseFloat(args[1]);
    if (!(w > 0) || !(h > 0)) return reply('⚖️ Usage: *.bmi 70 175* (wazan kg, qad cm)');
    const bmi = w / Math.pow(h / 100, 2);
    const cat = bmi < 18.5 ? 'Kam wazan' : bmi < 25 ? 'Normal ✅' : bmi < 30 ? 'Zyada wazan' : 'Bohat zyada wazan';
    reply(`⚖️ *BMI*\n\nWazan: ${w} kg | Qad: ${h} cm\nBMI: *${bmi.toFixed(1)}* — ${cat}\n\n_Ye sirf andaza hai, doctor ki salah behtar hai._`);
});

def('percent', ['percentage', 'pct'], 'tools', 'Percentage: .percent 450 500', '📊', async (c, mek, m, { args, reply }) => {
    const a = parseFloat(args[0]), b = parseFloat(args[1]);
    if (!isFinite(a) || !isFinite(b) || b === 0) return reply('📊 Usage: *.percent 450 500* (450, 500 ka kitna % hai)\nYa: *.percent 20% 1500*');
    if (/%$/.test(args[0])) return reply(`📊 ${a}% of ${b} = *${+(a * b / 100).toFixed(4)}*`);
    reply(`📊 ${a} / ${b} = *${+(a / b * 100).toFixed(2)}%*`);
});

def('rand', ['randomnumber', 'rng'], 'tools', 'Random number: .rand 1 100', '🎲', async (c, mek, m, { args, reply }) => {
    let a = parseInt(args[0], 10), b = parseInt(args[1], 10);
    if (!isFinite(a)) { a = 1; b = 100; } else if (!isFinite(b)) { b = a; a = 1; }
    if (a > b) [a, b] = [b, a];
    reply(`🎲 ${a} se ${b} ke beech: *${randInt(a, b)}*`);
});

def('genpass', ['password', 'passgen'], 'tools', 'Mazboot password banayein: .genpass 16', '🔑', async (c, mek, m, { args, reply }) => {
    const len = Math.min(64, Math.max(8, parseInt(args[0], 10) || 16));
    const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz23456789!@#$%&*?';
    const pw = Array.from(crypto.randomBytes(len)).map(b => chars[b % chars.length]).join('');
    reply(`🔑 *Naya password (${len})*\n\n\`${pw}\`\n\n_Kisi ko na batayein._`);
});

def('uuid', ['guid'], 'tools', 'Random UUID', '🆔', async (c, mek, m, { reply }) => reply(crypto.randomUUID()));

const ZONES = { pakistan: 'Asia/Karachi', pk: 'Asia/Karachi', india: 'Asia/Kolkata', dubai: 'Asia/Dubai', uae: 'Asia/Dubai', saudi: 'Asia/Riyadh', ksa: 'Asia/Riyadh', uk: 'Europe/London', london: 'Europe/London', usa: 'America/New_York', newyork: 'America/New_York', canada: 'America/Toronto', turkey: 'Europe/Istanbul', japan: 'Asia/Tokyo', china: 'Asia/Shanghai', australia: 'Australia/Sydney', qatar: 'Asia/Qatar', oman: 'Asia/Muscat', kuwait: 'Asia/Kuwait', bangladesh: 'Asia/Dhaka', malaysia: 'Asia/Kuala_Lumpur', germany: 'Europe/Berlin', italy: 'Europe/Rome', france: 'Europe/Paris' };
def('wtime', ['worldtime', 'timezone'], 'tools', 'Mulkon ka waqt: .wtime dubai', '🌍', async (c, mek, m, { q, reply }) => {
    const fmt = (tz) => new Date().toLocaleString('en-GB', { timeZone: tz, weekday: 'short', hour: '2-digit', minute: '2-digit', hour12: true, day: 'numeric', month: 'short' });
    const key = String(q || '').toLowerCase().replace(/\s+/g, '');
    if (key && ZONES[key]) return reply(`🌍 *${q}*: ${fmt(ZONES[key])}`);
    const list = ['pakistan', 'india', 'dubai', 'saudi', 'uk', 'usa', 'canada', 'turkey', 'malaysia', 'australia'];
    reply(`🌍 *World Time*\n\n${list.map(k => `• ${k[0].toUpperCase() + k.slice(1)}: ${fmt(ZONES[k])}`).join('\n')}\n\n_Ek mulk: .wtime dubai_`);
});

def('countdown', ['daysleft', 'dinbaqi'], 'tools', 'Kitne din baqi: .countdown 01/01/2027', '⏳', async (c, mek, m, { q, reply }) => {
    const d = parseDate(q); if (!d) return reply('⏳ Usage: *.countdown 01/01/2027*');
    const diff = Math.round((d - todayUTC()) / 864e5);
    reply(diff > 0 ? `⏳ *${diff} din* baqi hain (${Math.floor(diff / 7)} hafte ${diff % 7} din)` : diff === 0 ? '🎉 Wo din *AAJ* hai!' : `⌛ Ye din *${-diff} din* pehle guzar chuka.`);
});

const UNITS = {
    km: ['mi', 0.621371], mi: ['km', 1.609344], m: ['ft', 3.28084], ft: ['m', 0.3048], cm: ['inch', 0.393701], inch: ['cm', 2.54], in: ['cm', 2.54],
    kg: ['lb', 2.20462], lb: ['kg', 0.453592], g: ['oz', 0.035274], oz: ['g', 28.3495], l: ['gal', 0.264172], gal: ['l', 3.78541], ml: ['floz', 0.033814]
};
def('convert', ['unit', 'units'], 'tools', 'Unit convert: .convert 10 km / 30 c', '🔄', async (c, mek, m, { args, reply }) => {
    const v = parseFloat(args[0]); const u = String(args[1] || '').toLowerCase();
    if (!isFinite(v) || !u) return reply('🔄 Usage: *.convert 10 km*\nUnits: km mi m ft cm inch kg lb g oz l gal ml, c f (temperature)');
    if (u === 'c') return reply(`🌡️ ${v}°C = *${+(v * 9 / 5 + 32).toFixed(2)}°F*`);
    if (u === 'f') return reply(`🌡️ ${v}°F = *${+((v - 32) * 5 / 9).toFixed(2)}°C*`);
    const r = UNITS[u]; if (!r) return reply('❌ Ye unit nahi pata. Units: km mi m ft cm inch kg lb g oz l gal ml c f');
    reply(`🔄 ${v} ${u} = *${+(v * r[1]).toFixed(4)} ${r[0]}*`);
});

def('hijri', ['islamicdate', 'chand'], 'tools', 'Aaj ki Islami (Hijri) tareekh', '🌙', async (c, mek, m, { reply }) => {
    let h;
    try { h = new Intl.DateTimeFormat('en-u-ca-islamic-umalqura', { day: 'numeric', month: 'long', year: 'numeric', timeZone: 'Asia/Karachi' }).format(new Date()); }
    catch (e) { h = new Intl.DateTimeFormat('en-u-ca-islamic', { day: 'numeric', month: 'long', year: 'numeric' }).format(new Date()); }
    const g = new Date().toLocaleDateString('en-GB', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric', timeZone: 'Asia/Karachi' });
    reply(`🌙 *Islami Tareekh*\n\n${h}\n📅 ${g}\n\n_Hisaab se nikali gayi; chand dekhne se 1 din ka farq ho sakta hai._`);
});

const SIGNS = [['Capricorn ♑', 120], ['Aquarius ♒', 219], ['Pisces ♓', 320], ['Aries ♈', 420], ['Taurus ♉', 521], ['Gemini ♊', 621], ['Cancer ♋', 722], ['Leo ♌', 823], ['Virgo ♍', 923], ['Libra ♎', 1023], ['Scorpio ♏', 1122], ['Sagittarius ♐', 1222], ['Capricorn ♑', 1231]];
def('zodiac', ['starsign', 'burj'], 'tools', 'Burj (zodiac) nikaalein: .zodiac 15/08/2000', '♌', async (c, mek, m, { q, reply }) => {
    const d = parseDate(q); if (!d) return reply('♌ Usage: *.zodiac 15/08/2000*');
    const md = (d.getUTCMonth() + 1) * 100 + d.getUTCDate();
    reply(`✨ Aap ka burj: *${SIGNS.find(s => md <= s[1])[0]}*`);
});

def('emi', ['loan', 'installment'], 'tools', 'Qist (EMI): .emi 500000 12 24 (raqam, sood%, mahine)', '🏦', async (c, mek, m, { args, reply }) => {
    const P = parseFloat(args[0]), rate = parseFloat(args[1]), n = parseInt(args[2], 10);
    if (!(P > 0) || !(rate >= 0) || !(n > 0)) return reply('🏦 Usage: *.emi 500000 12 24*\n(raqam, saalana sood %, kitne mahine)');
    const r = rate / 1200;
    const emi = r === 0 ? P / n : P * r * Math.pow(1 + r, n) / (Math.pow(1 + r, n) - 1);
    reply(`🏦 *EMI Calculator*\n\n• Mahana qist: *${Math.round(emi).toLocaleString()}*\n• Kul adaigi: *${Math.round(emi * n).toLocaleString()}*\n• Kul sood: *${Math.round(emi * n - P).toLocaleString()}*`);
});

def('roman', ['romannum'], 'tools', 'Number ↔ Roman: .roman 2026 / .roman MMXXVI', '🏛️', async (c, mek, m, { q, reply }) => {
    const s = String(q || '').trim().toUpperCase(); if (!s) return reply('🏛️ Usage: *.roman 2026* ya *.roman MMXXVI*');
    const T = [[1000, 'M'], [900, 'CM'], [500, 'D'], [400, 'CD'], [100, 'C'], [90, 'XC'], [50, 'L'], [40, 'XL'], [10, 'X'], [9, 'IX'], [5, 'V'], [4, 'IV'], [1, 'I']];
    if (/^\d+$/.test(s)) {
        let n = +s; if (n < 1 || n > 3999) return reply('❌ 1 se 3999 tak');
        let out = ''; for (const [v, r] of T) while (n >= v) { out += r; n -= v; } return reply(`🏛️ ${s} = *${out}*`);
    }
    if (!/^[MDCLXVI]+$/.test(s)) return reply('❌ Ghalat Roman number');
    const V = { M: 1000, D: 500, C: 100, L: 50, X: 10, V: 5, I: 1 }; let n = 0;
    for (let i = 0; i < s.length; i++) n += V[s[i]] < (V[s[i + 1]] || 0) ? -V[s[i]] : V[s[i]];
    reply(`🏛️ ${s} = *${n}*`);
});

def('prime', ['isprime'], 'tools', 'Prime number check: .prime 97', '🔢', async (c, mek, m, { args, reply }) => {
    const n = parseInt(args[0], 10); if (!isFinite(n) || n < 0 || n > 1e12) return reply('🔢 Usage: *.prime 97*');
    let p = n > 1; for (let i = 2; p && i * i <= n; i++) if (n % i === 0) p = false;
    reply(p ? `✅ *${n}* prime number hai` : `❌ *${n}* prime nahi hai`);
});

def('table', ['pahara', 'multiplication'], 'tools', 'Pahara: .table 7', '✖️', async (c, mek, m, { args, reply }) => {
    const n = parseFloat(args[0]); if (!isFinite(n)) return reply('✖️ Usage: *.table 7*');
    reply(`✖️ *${n} ka pahara*\n\n${Array.from({ length: 10 }, (_, i) => `${n} × ${i + 1} = ${+(n * (i + 1)).toFixed(4)}`).join('\n')}`);
});

// ============================================================
// 👥 GROUP (6)
// ============================================================
def('poll', ['vote', 'createpoll'], 'group', 'Poll banayein: .poll Sawal | option1 | option2', '📊', async (c, mek, m, { q, from, reply }) => {
    const parts = String(q || '').split('|').map(x => x.trim()).filter(Boolean);
    if (parts.length < 3) return reply('📊 Usage: *.poll Aaj kya khayen? | Biryani | Pizza | Burger*');
    if (parts.length > 13) return reply('❌ Zyada se zyada 12 options');
    await c.sendMessage(from, { poll: { name: parts[0], values: parts.slice(1), selectableCount: 1 } }, { quoted: mek });
});

def('adminlist', ['admins', 'listadmins'], 'group', 'Group ke admins ki list', '🛡️', async (c, mek, m, ctx) => {
    if (!ctx.isGroup) return ctx.reply('❌ Sirf group me');
    const ad = (ctx.participants || []).filter(p => p.admin);
    if (!ad.length) return ctx.reply('Is group me koi admin nahi mila.');
    sendMention(c, ctx.from, mek, `🛡️ *${ctx.groupName || 'Group'} — Admins (${ad.length})*\n\n${ad.map((p, i) => `${i + 1}. ${tagOf(p.id)}${p.admin === 'superadmin' ? ' 👑' : ''}`).join('\n')}`, ad.map(p => p.id));
});

def('tagadmins', ['calladmins', 'admintag'], 'group', 'Sirf admins ko tag karein', '📣', async (c, mek, m, ctx) => {
    if (!ctx.isGroup) return ctx.reply('❌ Sirf group me');
    const ad = (ctx.participants || []).filter(p => p.admin);
    sendMention(c, ctx.from, mek, `📣 *Admins, tawajju farmayein!*\n${ctx.q ? '\n💬 ' + ctx.q + '\n' : ''}\n${ad.map(p => tagOf(p.id)).join(' ')}`, ad.map(p => p.id));
});

def('luckymember', ['randommember', 'luckydraw'], 'group', 'Group se ek lucky member', '🍀', async (c, mek, m, ctx) => {
    if (!ctx.isGroup) return ctx.reply('❌ Sirf group me');
    const list = (ctx.participants || []); if (!list.length) return ctx.reply('Members nahi mile');
    const w = pick(list);
    sendMention(c, ctx.from, mek, `🍀 *LUCKY DRAW*\n\nAaj ka lucky member hai... 🥁\n\n🎉 ${tagOf(w.id)} 🎉`, [w.id]);
});

const CC = { 92: 'Pakistan 🇵🇰', 91: 'India 🇮🇳', 971: 'UAE 🇦🇪', 966: 'Saudi 🇸🇦', 44: 'UK 🇬🇧', 1: 'USA/Canada 🇺🇸', 880: 'Bangladesh 🇧🇩', 974: 'Qatar 🇶🇦', 968: 'Oman 🇴🇲', 965: 'Kuwait 🇰🇼', 973: 'Bahrain 🇧🇭', 90: 'Turkey 🇹🇷', 60: 'Malaysia 🇲🇾', 62: 'Indonesia 🇮🇩', 93: 'Afghanistan 🇦🇫', 98: 'Iran 🇮🇷', 20: 'Egypt 🇪🇬', 27: 'South Africa 🇿🇦', 234: 'Nigeria 🇳🇬', 254: 'Kenya 🇰🇪', 49: 'Germany 🇩🇪', 39: 'Italy 🇮🇹', 33: 'France 🇫🇷', 61: 'Australia 🇦🇺', 94: 'Sri Lanka 🇱🇰', 977: 'Nepal 🇳🇵' };
def('countries', ['countrystats', 'mulk'], 'group', 'Members kis kis mulk se hain', '🌍', async (c, mek, m, ctx) => {
    if (!ctx.isGroup) return ctx.reply('❌ Sirf group me');
    const counts = {}; let hidden = 0;
    for (const p of ctx.participants || []) {
        const pn = [p.phoneNumber, p.jid, p.id].find(j => j && String(j).endsWith('@s.whatsapp.net'));
        if (!pn) { hidden++; continue; }
        const n = num(pn); const code = [3, 2, 1].map(l => n.slice(0, l)).find(k => CC[k]);
        const name = code ? CC[code] : 'Others 🌐'; counts[name] = (counts[name] || 0) + 1;
    }
    const rows = Object.entries(counts).sort((a, b) => b[1] - a[1]).map(([k, v]) => `• ${k}: *${v}*`);
    ctx.reply(`🌍 *Members by Country*\n\n${rows.join('\n') || '—'}${hidden ? `\n• Number chhupa hua (LID): *${hidden}*` : ''}\n\nKul: *${(ctx.participants || []).length}*`);
});

def('gcage', ['groupage', 'gcinfo2'], 'group', 'Group kab bana aur kitna purana hai', '📅', async (c, mek, m, ctx) => {
    if (!ctx.isGroup) return ctx.reply('❌ Sirf group me');
    const g = ctx.groupMetadata || {}; const created = g.creation ? new Date(g.creation * 1000) : null;
    const ad = (ctx.participants || []).filter(p => p.admin).length;
    const lines = [`📅 *${g.subject || ctx.groupName || 'Group'}*\n`];
    if (created) {
        const days = Math.floor((Date.now() - created) / 864e5);
        lines.push(`• Bana: *${created.toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' })}*`, `• Umar: *${Math.floor(days / 365)} saal ${Math.floor(days % 365 / 30)} mahine* (${days} din)`);
    }
    lines.push(`• Members: *${(ctx.participants || []).length}*`, `• Admins: *${ad}*`);
    if (g.owner) lines.push(`• Banane wala: ${tagOf(g.owner)}`);
    sendMention(c, ctx.from, mek, lines.join('\n'), [g.owner]);
});

// ============================================================
// 👑 OWNER (5)
// ============================================================
const fmtUp = (s) => { s = Math.floor(s); const d = Math.floor(s / 86400), h = Math.floor(s % 86400 / 3600), mi = Math.floor(s % 3600 / 60); return `${d ? d + 'd ' : ''}${h}h ${mi}m ${s % 60}s`; };
const mb = (b) => (b / 1048576).toFixed(1) + ' MB';

def('botstats', ['bstats', 'botinfo'], 'owner', 'Bot ki poori stats', '📈', async (c, mek, m, { reply }) => {
    const { commands } = require('../arslan');
    const names = new Set(commands.filter(x => x.pattern && x.on !== 'body').map(x => String(x.pattern).toLowerCase()));
    const mem = process.memoryUsage();
    const sessions = global.__p29Sockets ? global.__p29Sockets.size : '—';
    reply(`📈 *PROFESSOR²⁹ MD — Stats*\n\n• Commands: *${names.size}*\n• Connected numbers: *${sessions}*\n• Uptime: *${fmtUp(process.uptime())}*\n• RAM (bot): *${mb(mem.rss)}*\n• Node: *${process.version}*\n• Platform: *${os.platform()} ${os.arch()}*`);
});

def('sessions', ['connected', 'activesessions'], 'owner', 'Kitne numbers connected hain (sirf owner)', '🔗', async (c, mek, m, { isOwner, reply }) => {
    if (!isOwner) return reply('❌ Sirf owner ke liye');
    const s = global.__p29Sockets;
    if (!s) return reply('Session list abhi dastyab nahi.');
    const list = [...s.keys()];
    const masked = list.map((n, i) => `${i + 1}. +${String(n).slice(0, 4)}****${String(n).slice(-3)}`);
    reply(`🔗 *Connected Numbers: ${list.length}*\n\n${masked.join('\n') || '—'}`);
});

def('sysinfo', ['server', 'servers', 'system'], 'owner', 'Server ki maloomat', '🖥️', async (c, mek, m, { reply }) => {
    const total = os.totalmem(), free = os.freemem(), cpus = os.cpus() || [];
    const used = Math.round((total - free) / total * 100);
    reply(`🖥️ *Server Info*\n\n• CPU: *${cpus.length} core* — ${(cpus[0] && cpus[0].model || 'unknown').trim()}\n• RAM: *${mb(total - free)} / ${mb(total)}* (${used}%)\n${bar(used)}\n• Load: *${os.loadavg().map(x => x.toFixed(2)).join(', ')}*\n• Server uptime: *${fmtUp(os.uptime())}*\n• Bot uptime: *${fmtUp(process.uptime())}*`);
});

def('ownerhub', ['ownermenu', 'ownercmds'], 'owner', 'Owner ki saari commands', '👑', async (c, mek, m, { reply, prefix }) => {
    const { commands } = require('../arslan');
    const seen = new Set(); const list = [];
    for (const x of commands) { if (!x.pattern || x.on === 'body' || String(x.category).toLowerCase() !== 'owner') continue; const n = String(x.pattern).toLowerCase(); if (seen.has(n)) continue; seen.add(n); list.push(`• ${prefix || '.'}${n} — ${String(x.desc || '').slice(0, 50)}`); }
    reply(`👑 *OWNER HUB* (${list.length})\n\n${list.sort().join('\n')}`);
});

def('cleartmp', ['cleantmp', 'clearcache'], 'owner', 'Faltu temp files saaf karein', '🧹', async (c, mek, m, { isOwner, reply }) => {
    if (!isOwner) return reply('❌ Sirf owner ke liye');
    let count = 0, bytes = 0;
    for (const dir of [path.join(process.cwd(), 'tmp'), path.join(process.cwd(), 'temp')]) {
        if (!fs.existsSync(dir)) continue;
        for (const f of fs.readdirSync(dir)) {
            try { const p = path.join(dir, f); const st = fs.statSync(p); if (st.isFile()) { bytes += st.size; fs.unlinkSync(p); count++; } } catch (e) {}
        }
    }
    reply(`🧹 *${count}* files saaf (${mb(bytes)} khaali hua)`);
});

// ============================================================
// 🕌 ISLAMIC & URDU (7)
// ============================================================
const ASMA = ['Ar-Rahman — Bohat meharban', 'Ar-Raheem — Nihayat reham wala', 'Al-Malik — Badshah', 'Al-Quddus — Paak', 'As-Salam — Salamti wala', "Al-Mu'min — Aman dene wala", 'Al-Muhaymin — Nigehbaan', "Al-'Aziz — Zabardast", 'Al-Jabbar — Zor wala', 'Al-Mutakabbir — Bari shaan wala', 'Al-Khaliq — Paida karne wala', "Al-Bari' — Banane wala", 'Al-Musawwir — Surat dene wala', 'Al-Ghaffar — Bohat bakhshne wala', 'Al-Qahhar — Sab par ghalib', 'Al-Wahhab — Bohat dene wala', 'Ar-Razzaq — Rizq dene wala', 'Al-Fattah — Kholne wala', "Al-'Alim — Sab jaanne wala", 'Al-Qabid — Tangi karne wala', 'Al-Basit — Kushadgi dene wala', 'Al-Khafid — Past karne wala', "Ar-Rafi' — Buland karne wala", "Al-Mu'izz — Izzat dene wala", 'Al-Mudhill — Zillat dene wala', "As-Sami' — Sab sunne wala", 'Al-Basir — Sab dekhne wala', 'Al-Hakam — Faisla karne wala', "Al-'Adl — Insaaf wala", 'Al-Latif — Baareek been', 'Al-Khabir — Ba-khabar', 'Al-Halim — Burdbaar', "Al-'Azim — Azmat wala", 'Al-Ghafur — Bakhshne wala', 'Ash-Shakur — Qadardaan', "Al-'Aliyy — Buland", 'Al-Kabir — Bara', 'Al-Hafiz — Hifazat karne wala', 'Al-Muqit — Rozi dene wala', 'Al-Hasib — Hisaab lene wala', 'Al-Jalil — Bazurg', 'Al-Karim — Karam wala', 'Ar-Raqib — Nigraan', 'Al-Mujib — Dua qubool karne wala', "Al-Wasi' — Wus'at wala", 'Al-Hakim — Hikmat wala', 'Al-Wadud — Mohabbat karne wala', 'Al-Majeed — Buzurgi wala', "Al-Ba'ith — Uthane wala", 'Ash-Shahid — Gawah', 'Al-Haqq — Sach', 'Al-Wakil — Kaarsaaz', 'Al-Qawiyy — Taqatwar', 'Al-Matin — Mazboot', 'Al-Waliyy — Dost', 'Al-Hamid — Tareef ke laaiq', 'Al-Muhsi — Ginne wala', "Al-Mubdi' — Pehli baar paida karne wala", "Al-Mu'id — Dobara paida karne wala", 'Al-Muhyi — Zindagi dene wala', 'Al-Mumit — Maut dene wala', 'Al-Hayy — Hamesha zinda', 'Al-Qayyum — Qaim rakhne wala', 'Al-Wajid — Paane wala', 'Al-Majid — Shaan wala', 'Al-Wahid — Akela', 'Al-Ahad — Ek', 'As-Samad — Be-niyaz', 'Al-Qadir — Qudrat wala', 'Al-Muqtadir — Poori qudrat wala', 'Al-Muqaddim — Aage karne wala', "Al-Mu'akhkhir — Peeche karne wala", 'Al-Awwal — Sab se pehla', 'Al-Akhir — Sab se aakhri', 'Az-Zahir — Zaahir', 'Al-Batin — Posheeda', 'Al-Wali — Maalik', "Al-Muta'ali — Sab se buland", 'Al-Barr — Ehsaan karne wala', 'At-Tawwab — Tauba qubool karne wala', 'Al-Muntaqim — Badla lene wala', "Al-'Afuww — Maaf karne wala", "Ar-Ra'uf — Shafqat wala", 'Malik-ul-Mulk — Mulk ka maalik', 'Dhul-Jalali wal-Ikram — Azmat aur izzat wala', 'Al-Muqsit — Insaaf karne wala', "Al-Jami' — Jama karne wala", 'Al-Ghaniyy — Be-parwah', 'Al-Mughni — Ghani karne wala', "Al-Mani' — Rokne wala", 'Ad-Darr — Nuqsan pahunchane wala', "An-Nafi' — Nafa dene wala", 'An-Nur — Noor', 'Al-Hadi — Hidayat dene wala', "Al-Badi' — Bemisaal banane wala", 'Al-Baqi — Hamesha baqi', 'Al-Warith — Waris', 'Ar-Rashid — Rehnuma', 'As-Sabur — Bohat sabr wala'];

def('asmaulhusna', ['asma', '99names', 'allahnames'], 'islamic', 'Allah ke 99 naam (.asma 5 = ek naam)', '🕌', async (c, mek, m, { args, reply }) => {
    const n = parseInt(args[0], 10);
    if (n >= 1 && n <= 99) return reply(`🕌 *${n}.* ${ASMA[n - 1]}`);
    if (args[0] === 'all') return reply(`🕌 *Asma-ul-Husna*\n\n${ASMA.map((x, i) => `${i + 1}. ${x}`).join('\n')}`);
    const i = randInt(0, 98);
    reply(`🕌 *Asma-ul-Husna*\n\n*${i + 1}.* ${ASMA[i]}\n\n_Saare naam: .asma all | Koi ek: .asma 25_`);
});

const DUAS = {
    khana: ['Khane se pehle', 'بِسْمِ اللّٰهِ وَعَلٰى بَرَكَةِ اللّٰهِ', 'Bismillahi wa ala barakatillah', 'Allah ke naam se aur Allah ki barkat par.'],
    baad: ['Khane ke baad', 'اَلْحَمْدُ لِلّٰهِ الَّذِيْ اَطْعَمَنَا وَسَقَانَا وَجَعَلَنَا مُسْلِمِيْنَ', 'Alhamdulillahil-lazi at\'amana wa saqana wa ja\'alana muslimeen', 'Sab tareef Allah ke liye jis ne hamein khilaya, pilaya aur Musalman banaya.'],
    sona: ['Sone se pehle', 'بِاسْمِكَ اللّٰهُمَّ اَمُوْتُ وَاَحْيَا', 'Bismika Allahumma amutu wa ahya', 'Ae Allah! Tere naam se marta (sota) hoon aur jeeta (jaagta) hoon.'],
    ilm: ['Ilm ke liye', 'رَّبِّ زِدْنِيْ عِلْمًا', 'Rabbi zidni ilma', 'Ae mere Rab! Mere ilm mein izafa farma.'],
    ghar: ['Ghar se nikalte waqt', 'بِسْمِ اللّٰهِ تَوَكَّلْتُ عَلَى اللّٰهِ', 'Bismillahi tawakkaltu alallah', 'Allah ke naam se, maine Allah par bharosa kiya.'],
    duniya: ['Duniya aur aakhirat ki bhalai', 'رَبَّنَا آتِنَا فِي الدُّنْيَا حَسَنَةً وَّفِي الْآخِرَةِ حَسَنَةً وَّقِنَا عَذَابَ النَّارِ', 'Rabbana atina fid-dunya hasanatan wa fil-akhirati hasanatan wa qina azaban-nar', 'Ae hamare Rab! Hamein duniya mein bhi bhalai de aur aakhirat mein bhi, aur hamein aag ke azab se bacha.']
};
def('dua', ['duas', 'masnoon'], 'islamic', 'Masnoon duayein: .dua khana / sona / ilm', '🤲', async (c, mek, m, { args, reply }) => {
    const k = (args[0] || '').toLowerCase();
    const d = DUAS[k] || (k ? null : DUAS[pick(Object.keys(DUAS))]);
    if (!d) return reply(`🤲 Duayein: ${Object.keys(DUAS).map(x => '*' + x + '*').join(', ')}\nExample: *.dua sona*`);
    reply(`🤲 *${d[0]}*\n\n${d[1]}\n\n_${d[2]}_\n\n📖 ${d[3]}\n\n_Aur duayein: .dua ${Object.keys(DUAS).join(' / ')}_`);
});

def('kalma', ['kalima', 'kalimah'], 'islamic', 'Pehla aur doosra kalma', '☝️', async (c, mek, m, { reply }) => {
    reply(`☝️ *Pehla Kalma (Tayyab)*\nلَا إِلٰهَ إِلَّا اللّٰهُ مُحَمَّدٌ رَّسُوْلُ اللّٰهِ\n_La ilaha illallah, Muhammadur Rasulullah_\nAllah ke siwa koi ma'bood nahi, Muhammad ﷺ Allah ke Rasool hain.\n\n☝️ *Doosra Kalma (Shahadat)*\nأَشْهَدُ أَنْ لَّا إِلٰهَ إِلَّا اللّٰهُ وَحْدَهُ لَا شَرِيْكَ لَهُ وَأَشْهَدُ أَنَّ مُحَمَّدًا عَبْدُهُ وَرَسُوْلُهُ\n_Ash-hadu an la ilaha illallahu wahdahu la shareeka lahu, wa ash-hadu anna Muhammadan abduhu wa rasuluhu_\nMain gawahi deta hoon ke Allah ke siwa koi ma'bood nahi, wo akela hai, us ka koi shareek nahi, aur gawahi deta hoon ke Muhammad ﷺ us ke bande aur Rasool hain.`);
});

const tasbeeh = new Map();
def('tasbeeh', ['tasbih', 'zikr'], 'islamic', 'Digital tasbeeh: .tasbeeh / .tasbeeh reset', '📿', async (c, mek, m, { args, sender, reply }) => {
    if ((args[0] || '').toLowerCase() === 'reset') { tasbeeh.delete(sender); return reply('📿 Tasbeeh 0 se shuru'); }
    const n = (tasbeeh.get(sender) || 0) + 1; tasbeeh.set(sender, n);
    const zikr = n <= 33 ? 'SubhanAllah' : n <= 66 ? 'Alhamdulillah' : n <= 100 ? 'Allahu Akbar' : 'Astaghfirullah';
    reply(`📿 *${n}* — ${zikr}${n === 33 || n === 66 || n === 100 ? '\n\n✨ Mashallah! Ek daur mukammal' : ''}`);
});

def('jummah', ['jumma', 'jummamubarak'], 'islamic', 'Jummah Mubarak paigham', '🕌', async (c, mek, m, { reply }) => {
    reply(pick(['🕌 *Jummah Mubarak!*\nAllah aap ki har dua qubool farmaye aur aap ke ghar mein barkat de. 🤲', '🌙 *Jummah Mubarak!*\nAaj Surah Kahf parhna aur Durood Shareef zyada bhejna na bhoolein. 💚', '✨ *Jummah Mubarak!*\nAllah aap ko sehat, khushi aur sukoon ata farmaye. Ameen 🤲']));
});

def('goodmorning', ['gm', 'subahbakhair'], 'islamic', 'Pyara sa good morning paigham', '🌅', async (c, mek, m, { reply }) => {
    reply(pick(['🌅 *Subah Bakhair!*\nNaya din, nayi umeed. Muskura kar shuru karein ☀️', '☕ *Good Morning!*\nChai garam hai aur din aap ka intezar kar raha hai 🌸', '🌞 *Subah Bakhair!*\nAllah aap ka din asaan aur kamyab banaye 🤲', '🌼 *Good Morning!*\nAaj kisi ek insaan ko muskurane ki wajah zaroor banein 💛']));
});

def('urduquote', ['aqwal', 'qaul'], 'islamic', 'Achi baat / qaul (Roman Urdu)', '💭', async (c, mek, m, { reply }) => {
    reply(`💭 ${pick(['Waqt aur log dono badal jate hain, lekin achi niyat hamesha yaad rehti hai.', 'Jo log aap ki khamoshi nahi samajhte, wo aap ke alfaz bhi nahi samjhenge.', 'Mehnat itni khamoshi se karo ke kamyabi shor macha de.', 'Dil saaf rakho, Rab sab theek kar dega.', 'Har mushkil ke baad asaani hai, bas sabr ka daaman na chhoro.', 'Doosron ki izzat karna apni izzat karwane ka pehla qadam hai.', 'Kal ki fikr me aaj ko zaya na karo.', 'Muskurahat sab se sasta tohfa hai, magar sab se qeemti asar rakhta hai.', 'Rishte pyaar se bante hain, shart se nahi.', 'Jo cheez dil ko sukoon na de, us ke peeche bhagna chhor do.'])}`);
});
