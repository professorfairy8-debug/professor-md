// ============================================================
// PROFESSOR²⁹ MD — extra commands pack 3 (offline, no API)
// games, names, tools, Islamic countdowns
// ============================================================
const { cmd } = require('../arslan');
const crypto = require('crypto');

const pick = (a) => a[Math.floor(Math.random() * a.length)];
const shuffle = (a) => { a = [...a]; for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [a[i], a[j]] = [a[j], a[i]]; } return a; };
const READMORE = '\u200e'.repeat(4001);
const textArg = (ctx) => ctx.q || (ctx.quoted && (ctx.quoted.body || ctx.quoted.text)) || '';

function def(pattern, alias, category, desc, react, fn) {
    cmd({ pattern, alias, category, desc, react, filename: __filename }, async (conn, mek, m, ctx) => {
        try { await fn(conn, mek, m, ctx); }
        catch (e) { console.error(`[p29-extra3] ${pattern}:`, e.message); await ctx.reply(`❌ *${pattern}* me masla aa gaya: ${e.message}`); }
    });
}
function parseDate(s) {
    const m = String(s || '').trim().match(/^(\d{1,2})[\/\-.](\d{1,2})[\/\-.](\d{4})$/);
    if (!m) return null;
    const d = new Date(Date.UTC(+m[3], +m[2] - 1, +m[1]));
    return isNaN(d) || d.getUTCDate() !== +m[1] ? null : d;
}

// ============================================================
// 🎉 GAMES & FUN
// ============================================================
const SIGNS = { aries: '♈', taurus: '♉', gemini: '♊', cancer: '♋', leo: '♌', virgo: '♍', libra: '♎', scorpio: '♏', sagittarius: '♐', capricorn: '♑', aquarius: '♒', pisces: '♓' };
def('horoscope', ['rashifal', 'stars'], 'fun', 'Aaj ka horoscope (mazaq): .horoscope leo', '🔮', async (c, mek, m, { args, reply }) => {
    const s = (args[0] || '').toLowerCase();
    if (!SIGNS[s]) return reply(`🔮 Usage: *.horoscope leo*\nBurj: ${Object.keys(SIGNS).join(', ')}\n_Apna burj nahi pata? .zodiac 15/08/2000_`);
    const seed = crypto.createHash('md5').update(s + new Date().toISOString().slice(0, 10)).digest();
    const love = ['Dil ki baat keh dein 💌', 'Thora sabr, waqt achha aa raha hai 💕', 'Koi aap ko yaad kar raha hai 🥰', 'Purani narazgi khatam karne ka din 🤝'];
    const work = ['Mehnat ka phal milega 💼', 'Naya idea kaam aayega 💡', 'Aaj faisle soch samajh kar karein 🧠', 'Kisi ki madad se kaam banega 🤝'];
    const luck = ['🍀', '⭐', '🌙', '💎', '🔥', '🌸'];
    reply(`🔮 *${s[0].toUpperCase() + s.slice(1)} ${SIGNS[s]} — Aaj*\n\n💖 Pyaar: ${love[seed[0] % 4]}\n💼 Kaam: ${work[seed[1] % 4]}\n🎨 Lucky color: ${['Laal', 'Neela', 'Sabz', 'Sunehri', 'Safed', 'Gulabi'][seed[2] % 6]}\n🔢 Lucky number: ${seed[3] % 9 + 1}\n✨ Aaj ka nishan: ${luck[seed[4] % 6]}\n\n_Sirf mazaq ke liye 😊_`);
});

def('nickname', ['nick', 'laqab'], 'fun', 'Mazedaar nickname', '🏷️', async (c, mek, m, { reply, pushname, q }) => {
    const a = ['Shehzada', 'Chhota', 'Toofani', 'Sunehri', 'Shararti', 'Masoom', 'Jungli', 'Royal', 'Pyara', 'Bindaas'];
    const b = ['Sher', 'Chand', 'Baadshah', 'Panda', 'Titli', 'Chai-wala', 'Star', 'Dil-dar', 'Shahzada', 'Bulbul'];
    reply(`🏷️ *${q || pushname || 'Aap'}* ka naya naam:\n\n✨ *${pick(a)} ${pick(b)}* ✨`);
});

const BOYS = [['Ahmed', 'Bohat tareef kiya gaya'], ['Ali', 'Buland, ala'], ['Hamza', 'Taqatwar'], ['Zain', 'Khoobsurti'], ['Ayaan', 'Allah ka tohfa'], ['Rayan', 'Jannat ka darwaza'], ['Hassan', 'Khoobsurat'], ['Arham', 'Reham wala'], ['Faris', 'Ghur-sawar, bahadur'], ['Saad', 'Khush-qismati'], ['Umar', 'Lambi zindagi'], ['Yusuf', 'Allah barhata hai'], ['Ibrahim', 'Paighambar ka naam'], ['Abdullah', 'Allah ka banda'], ['Danish', 'Ilm, aqal'], ['Shayan', 'Laiq, qabil']];
const GIRLS = [['Ayesha', 'Zinda, khush-haal'], ['Fatima', 'Paak daaman'], ['Zainab', 'Khushbudar phool'], ['Maryam', 'Hazrat Isa (AS) ki walida ka naam'], ['Hania', 'Khush'], ['Inaya', 'Inayat, khayal'], ['Zara', 'Shehzadi, khilta phool'], ['Mahnoor', 'Chand ki roshni'], ['Hira', 'Heera'], ['Sana', 'Tareef, chamak'], ['Eshal', 'Jannat ka phool'], ['Amna', 'Aman, hifazat'], ['Noor', 'Roshni'], ['Areeba', 'Aqalmand'], ['Hoorain', 'Jannat ki hoorain'], ['Alishba', 'Nek, khoobsurat']];
def('babyname', ['bachanaam', 'names'], 'fun', 'Islami naam + matlab: .babyname boy / girl', '👶', async (c, mek, m, { args, reply }) => {
    const g = (args[0] || '').toLowerCase();
    const list = /^(girl|larki|beti|g)$/.test(g) ? GIRLS : /^(boy|larka|beta|b)$/.test(g) ? BOYS : pick([BOYS, GIRLS]);
    const five = shuffle(list).slice(0, 5);
    reply(`👶 *${list === BOYS ? 'Larkon' : 'Larkiyon'} ke naam*\n\n${five.map(([n, mm]) => `• *${n}* — ${mm}`).join('\n')}\n\n_.babyname boy / .babyname girl_`);
});

const EMOJIQ = [['🦁👑', 'The Lion King'], ['🕷️🧑', 'Spider-Man'], ['❄️👸', 'Frozen'], ['⚡👓🧙', 'Harry Potter'], ['🚢🧊💔', 'Titanic'], ['🦖🏝️', 'Jurassic Park'], ['🏏🏆', 'Cricket World Cup'], ['☕🌅', 'Subah ki chai'], ['🍚🍗🌶️', 'Biryani'], ['🌧️🌈', 'Baarish ke baad dhanak'], ['🐼🥋', 'Kung Fu Panda'], ['👻🚫', 'Ghostbusters'], ['🌙⭐🕌', 'Eid'], ['🐟🔍', 'Finding Nemo']];
def('emojiquiz', ['emojigame', 'guessemoji'], 'fun', 'Emoji dekh kar pehchano', '🤔', async (c, mek, m, { reply }) => {
    const [e, a] = pick(EMOJIQ);
    reply(`🤔 *Emoji Quiz*\n\nYe kya hai?\n\n${e}\n\n_Jawab "Read more" me_ 👇${READMORE}\n✅ *${a}*`);
});

const WORDS = ['pakistan', 'biryani', 'cricket', 'whatsapp', 'professor', 'computer', 'mobile', 'dosti', 'khushi', 'samosa', 'barish', 'chandni', 'lahore', 'karachi', 'gulab'];
def('scramble', ['wordscramble', 'unscramble'], 'fun', 'Ulte harf seedhe karo', '🔀', async (c, mek, m, { reply }) => {
    const w = pick(WORDS); let s = w; let g = 0;
    while (s === w && g++ < 20) s = shuffle([...w]).join('');
    reply(`🔀 *Word Scramble*\n\nIn harfon se lafz banao:\n\n*${s.toUpperCase().split('').join(' ')}*\n\n_Jawab "Read more" me_ 👇${READMORE}\n✅ *${w.toUpperCase()}*`);
});

def('mathquiz', ['quickmath', 'hisab'], 'fun', 'Jaldi jawab do — math sawal', '➕', async (c, mek, m, { reply }) => {
    const op = pick(['+', '-', '×']); let a = Math.floor(Math.random() * 90) + 10, b = Math.floor(Math.random() * 90) + 10;
    if (op === '×') { a = Math.floor(Math.random() * 20) + 2; b = Math.floor(Math.random() * 20) + 2; }
    const ans = op === '+' ? a + b : op === '-' ? a - b : a * b;
    reply(`➕ *Math Quiz*\n\n*${a} ${op} ${b} = ?*\n\n_Jawab "Read more" me_ 👇${READMORE}\n✅ *${ans}*`);
});

const TOT = [['Chai', 'Coffee'], ['Biryani', 'Pizza'], ['Garmi', 'Sardi'], ['Pahar', 'Samandar'], ['Raat', 'Din'], ['Cricket', 'Football'], ['Kitab', 'Movie'], ['Billi', 'Kutta'], ['Mithai', 'Namkeen'], ['Call', 'Text'], ['Gaon', 'Sheher'], ['Barish', 'Dhoop']];
def('thisorthat', ['tot', 'yaye'], 'fun', 'Ye ya wo? Group game', '⚖️', async (c, mek, m, { reply }) => {
    const [a, b] = pick(TOT);
    reply(`⚖️ *This or That*\n\n🅰️ *${a}*\n      ya\n🅱️ *${b}*\n\nSab apna jawab likhein! 👇`);
});

const NHIE = ['Main ne kabhi exam ki raat padhai shuru nahi ki', 'Main ne kabhi ghalat number par lambi baat nahi ki', 'Main ne kabhi chupke se doosre ka khana nahi khaya', 'Main kabhi class me so nahi gaya', 'Main ne kabhi alarm band kar ke dobara nahi soya', 'Main ne kabhi kisi ka message "seen" kar ke ignore nahi kiya', 'Main ne kabhi barish me bhaag kar dance nahi kiya', 'Main ne kabhi apna phone haath me pakre dhoonda nahi'];
def('neverhaveiever', ['nhie', 'kabhinahi'], 'fun', 'Never Have I Ever group game', '🙈', async (c, mek, m, { reply }) => {
    reply(`🙈 *Never Have I Ever*\n\n"${pick(NHIE)}..."\n\nJis ne kiya hai wo 🙋 likhe!`);
});

const TT = ['Kachcha papad pakka papad, kachcha papad pakka papad', 'Chandu ke chacha ne Chandu ki chachi ko chandni chowk me chandi ke chamach se chatni chatai', 'Peter Piper picked a peck of pickled peppers', 'She sells sea shells by the sea shore', 'Kaccha kela pakka kela, pakka kela kaccha kela', 'Lal pila lal, pila lal pila'];
def('tonguetwister', ['twister', 'zubankhel'], 'fun', 'Tongue twister — tez tez bolo!', '👅', async (c, mek, m, { reply }) => reply(`👅 *Tongue Twister*\n\n_${pick(TT)}_\n\n3 dafa tez tez bol kar dikhao! 😂`));

// ============================================================
// 🧰 TOOLS
// ============================================================
def('hash', ['md5', 'sha256'], 'tools', 'Text ka hash: .hash hello', '#️⃣', async (c, mek, m, ctx) => {
    const t = textArg(ctx); if (!t) return ctx.reply('Usage: *.hash hello*');
    const h = (a) => crypto.createHash(a).update(t).digest('hex');
    ctx.reply(`#️⃣ *Hash*\n\nMD5:\n\`${h('md5')}\`\n\nSHA-1:\n\`${h('sha1')}\`\n\nSHA-256:\n\`${h('sha256')}\``);
});

const LOREM = 'lorem ipsum dolor sit amet consectetur adipiscing elit sed do eiusmod tempor incididunt ut labore et dolore magna aliqua ut enim ad minim veniam quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat'.split(' ');
def('lorem', ['loremipsum', 'dummytext'], 'tools', 'Dummy text: .lorem 50 (lafz)', '📄', async (c, mek, m, { args, reply }) => {
    const n = Math.min(500, Math.max(5, parseInt(args[0], 10) || 40));
    const w = Array.from({ length: n }, (_, i) => LOREM[i % LOREM.length]);
    w[0] = 'Lorem'; reply(w.join(' ') + '.');
});

def('color', ['colour', 'hexcolor'], 'tools', 'Rang: .color #ff0055 / .color 255 0 85 / .color', '🎨', async (c, mek, m, { args, reply }) => {
    let r, g, b;
    const hx = (args[0] || '').replace('#', '');
    if (/^[0-9a-f]{6}$/i.test(hx)) { r = parseInt(hx.slice(0, 2), 16); g = parseInt(hx.slice(2, 4), 16); b = parseInt(hx.slice(4), 16); }
    else if (args.length >= 3 && args.slice(0, 3).every(x => /^\d+$/.test(x) && +x <= 255)) { [r, g, b] = args.slice(0, 3).map(Number); }
    else if (!args.length) { [r, g, b] = [0, 0, 0].map(() => Math.floor(Math.random() * 256)); }
    else return reply('🎨 Usage: *.color #ff0055* / *.color 255 0 85* / *.color* (random)');
    const hex = '#' + [r, g, b].map(x => x.toString(16).padStart(2, '0')).join('').toUpperCase();
    const mx = Math.max(r, g, b) / 255, mn = Math.min(r, g, b) / 255, l = (mx + mn) / 2;
    reply(`🎨 *Color*\n\n• HEX: *${hex}*\n• RGB: *${r}, ${g}, ${b}*\n• Roshni: *${Math.round(l * 100)}%* (${l > 0.5 ? 'halka' : 'gehra'} rang)`);
});

def('weekday', ['dayname', 'konsadin'], 'tools', 'Kis din tha: .weekday 15/08/2000', '📆', async (c, mek, m, { q, reply }) => {
    const d = parseDate(q); if (!d) return reply('📆 Usage: *.weekday 15/08/2000*');
    reply(`📆 ${q} ko *${d.toLocaleDateString('en-GB', { weekday: 'long', timeZone: 'UTC' })}* tha.`);
});

def('leapyear', ['leap'], 'tools', 'Leap year check: .leapyear 2028', '📅', async (c, mek, m, { args, reply }) => {
    const y = parseInt(args[0], 10) || new Date().getFullYear();
    const leap = (y % 4 === 0 && y % 100 !== 0) || y % 400 === 0;
    reply(leap ? `✅ *${y}* leap year hai (Feb me 29 din)` : `❌ *${y}* leap year nahi hai`);
});

def('discount', ['sale', 'offprice'], 'tools', 'Discount: .discount 2000 15 (qeemat, %)', '🏷️', async (c, mek, m, { args, reply }) => {
    const p = parseFloat(args[0]), d = parseFloat(args[1]);
    if (!(p > 0) || !(d >= 0 && d <= 100)) return reply('🏷️ Usage: *.discount 2000 15*\n(qeemat, discount %)');
    const save = p * d / 100;
    reply(`🏷️ *Discount*\n\nAsal qeemat: *${p.toLocaleString()}*\nDiscount: *${d}%* (−${+save.toFixed(2)})\nNayi qeemat: *${+(p - save).toFixed(2)}*`);
});

def('zakat', ['zakaat'], 'islamic', 'Zakat hisaab (2.5%): .zakat 500000', '💰', async (c, mek, m, { args, reply }) => {
    const a = parseFloat(String(args[0] || '').replace(/,/g, ''));
    if (!(a > 0)) return reply('💰 Usage: *.zakat 500000*\n(kul jama raqam jo ek saal se aap ke paas hai)');
    reply(`💰 *Zakat Hisaab*\n\nKul raqam: *${a.toLocaleString()}*\nZakat (2.5%): *${(a * 0.025).toLocaleString(undefined, { maximumFractionDigits: 2 })}*\n\n_Zakat tab farz hai jab raqam nisaab se zyada ho aur poora ek saal guzar jaye. Tafseel ke liye kisi aalim se poochein._`);
});

def('sortwords', ['sorttext', 'abc'], 'tools', 'Lafz/lines ko A-Z: .sortwords zebra apple mango', '🔤', async (c, mek, m, ctx) => {
    const t = textArg(ctx); if (!t) return ctx.reply('Usage: *.sortwords zebra apple mango* (ya har line par ek)');
    const items = t.includes('\n') ? t.split('\n').map(x => x.trim()).filter(Boolean) : t.split(/[\s,]+/).filter(Boolean);
    ctx.reply(`🔤 *A → Z*\n\n${items.sort((a, b) => a.localeCompare(b)).join('\n')}`);
});

def('shuffle', ['mix', 'randomorder'], 'tools', 'List ko mix karein: .shuffle ali, sara, ahmed', '🔀', async (c, mek, m, ctx) => {
    const t = textArg(ctx); const items = t.split(/,|\n/).map(x => x.trim()).filter(Boolean);
    if (items.length < 2) return ctx.reply('Usage: *.shuffle ali, sara, ahmed* (comma se alag)');
    ctx.reply(`🔀 *Nayi tarteeb*\n\n${shuffle(items).map((x, i) => `${i + 1}. ${x}`).join('\n')}`);
});

def('timestamp', ['unix', 'epoch'], 'tools', 'Unix time: .timestamp / .timestamp 1700000000', '🕒', async (c, mek, m, { args, reply }) => {
    const n = parseInt(args[0], 10);
    if (isFinite(n)) { const d = new Date(n > 1e12 ? n : n * 1000); return reply(`🕒 ${n} = *${d.toLocaleString('en-GB', { timeZone: 'Asia/Karachi' })}* (PKT)`); }
    reply(`🕒 Abhi ka Unix time: *${Math.floor(Date.now() / 1000)}*`);
});

// ============================================================
// 🕌 ISLAMIC COUNTDOWNS (offline Hijri calendar)
// ============================================================
function hijriParts(d) {
    let fmt;
    try { fmt = new Intl.DateTimeFormat('en-u-ca-islamic-umalqura-nu-latn', { day: 'numeric', month: 'numeric', year: 'numeric', timeZone: 'UTC' }); }
    catch (e) { fmt = new Intl.DateTimeFormat('en-u-ca-islamic-nu-latn', { day: 'numeric', month: 'numeric', year: 'numeric', timeZone: 'UTC' }); }
    const p = {}; for (const x of fmt.formatToParts(d)) if (x.type !== 'literal') p[x.type] = parseInt(x.value, 10);
    return p; // {day, month, year}
}
function nextHijri(month, day) {
    const t = new Date(); const start = new Date(Date.UTC(t.getUTCFullYear(), t.getUTCMonth(), t.getUTCDate()));
    for (let i = 0; i < 400; i++) {
        const d = new Date(start.getTime() + i * 864e5); const h = hijriParts(d);
        if (h.month === month && h.day === day) return { date: d, days: i, year: h.year };
    }
    return null;
}
const showCount = (label, emoji, r) => r
    ? `${emoji} *${label} ${r.year} AH*\n\n📅 Andazan: *${r.date.toLocaleDateString('en-GB', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric', timeZone: 'UTC' })}*\n⏳ ${r.days === 0 ? '*AAJ!* 🎉' : `*${r.days} din* baqi`}\n\n_Hisaab se andaza; asal tareekh chand dekhne par hoti hai (1-2 din ka farq mumkin)._`
    : '❌ Tareekh nahi nikal saki';
def('ramadan', ['ramzan', 'roza'], 'islamic', 'Ramzan kitne din baad', '🌙', async (c, mek, m, { reply }) => reply(showCount('Ramzan', '🌙', nextHijri(9, 1))));
def('eid', ['eidulfitr', 'eidcountdown'], 'islamic', 'Eid ul Fitr aur Eid ul Adha countdown', '🕌', async (c, mek, m, { reply }) => {
    const f = nextHijri(10, 1), a = nextHijri(12, 10);
    reply(`${showCount('Eid ul Fitr', '🕌', f)}\n\n━━━━━━━━━━\n\n${showCount('Eid ul Adha', '🐑', a)}`);
});
const MONTHS = ['Muharram', 'Safar', 'Rabi ul Awwal', 'Rabi us Sani', 'Jumada al Ula', 'Jumada al Akhirah', 'Rajab', 'Shaban', 'Ramzan', 'Shawwal', 'Zul Qadah', 'Zul Hijjah'];
def('islamicmonths', ['hijrimonths', 'islamimahine'], 'islamic', 'Islami mahinon ke naam', '📿', async (c, mek, m, { reply }) => {
    const h = hijriParts(new Date());
    reply(`📿 *Islami Mahine*\n\n${MONTHS.map((n, i) => `${i + 1}. ${n}${h.month === i + 1 ? '  ⬅️ abhi' : ''}`).join('\n')}`);
});
