/**
 * Fancy Text Generator — OFFLINE (no API, is liye kabhi "API error" nahi aayega)
 * .fancy <text>        → saare styles
 * .fancy <number> <text> → sirf wo ek style (copy karne ke liye)
 */
const NORMAL = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';

// Map builder from a string of 62 chars (a-z, A-Z, 0-9); missing ones stay normal
function mk(name, lower, upper, digits) {
  const map = {};
  const L = Array.from(lower || ''), U = Array.from(upper || ''), D = Array.from(digits || '');
  for (let i = 0; i < 26; i++) {
    if (L[i]) map[NORMAL[i]] = L[i];
    if (U[i]) map[NORMAL[26 + i]] = U[i];
  }
  for (let i = 0; i < 10; i++) if (D[i]) map[NORMAL[52 + i]] = D[i];
  return { name, fn: (t) => Array.from(t).map(c => map[c] || c).join('') };
}
// Unicode math alphabets by code point offset
function block(name, upperStart, lowerStart, digitStart, exceptions = {}) {
  const cp = (start, i) => String.fromCodePoint(start + i);
  const lower = [], upper = [], digits = [];
  for (let i = 0; i < 26; i++) {
    lower.push(exceptions[NORMAL[i]] || cp(lowerStart, i));
    upper.push(exceptions[NORMAL[26 + i]] || cp(upperStart, i));
  }
  if (digitStart) for (let i = 0; i < 10; i++) digits.push(cp(digitStart, i));
  return mk(name, lower.join(''), upper.join(''), digits.join(''));
}
const wrap = (name, f) => ({ name, fn: f });
const combine = (mark) => (t) => Array.from(t).map(c => (c === ' ' ? c : c + mark)).join('');

const STYLES = [
  block('Bold', 0x1D400, 0x1D41A, 0x1D7CE),
  block('Italic', 0x1D434, 0x1D44E, 0, { h: 'ℎ' }),
  block('Bold Italic', 0x1D468, 0x1D482),
  block('Script', 0x1D49C, 0x1D4B6, 0, { B: 'ℬ', E: 'ℰ', F: 'ℱ', H: 'ℋ', I: 'ℐ', L: 'ℒ', M: 'ℳ', R: 'ℛ', e: 'ℯ', g: 'ℊ', o: 'ℴ' }),
  block('Bold Script', 0x1D4D0, 0x1D4EA),
  block('Fraktur', 0x1D504, 0x1D51E, 0, { C: 'ℭ', H: 'ℌ', I: 'ℑ', R: 'ℜ', Z: 'ℨ' }),
  block('Bold Fraktur', 0x1D56C, 0x1D586),
  block('Double Struck', 0x1D538, 0x1D552, 0x1D7D8, { C: 'ℂ', H: 'ℍ', N: 'ℕ', P: 'ℙ', Q: 'ℚ', R: 'ℝ', Z: 'ℤ' }),
  block('Sans', 0x1D5A0, 0x1D5BA, 0x1D7E2),
  block('Sans Bold', 0x1D5D4, 0x1D5EE, 0x1D7EC),
  block('Sans Italic', 0x1D608, 0x1D622),
  block('Sans Bold Italic', 0x1D63C, 0x1D656),
  block('Monospace', 0x1D670, 0x1D68A, 0x1D7F6),
  mk('Small Caps', 'ᴀʙᴄᴅᴇꜰɢʜɪᴊᴋʟᴍɴᴏᴘǫʀꜱᴛᴜᴠᴡxʏᴢ', 'ᴀʙᴄᴅᴇꜰɢʜɪᴊᴋʟᴍɴᴏᴘǫʀꜱᴛᴜᴠᴡxʏᴢ'),
  mk('Bubble', 'ⓐⓑⓒⓓⓔⓕⓖⓗⓘⓙⓚⓛⓜⓝⓞⓟⓠⓡⓢⓣⓤⓥⓦⓧⓨⓩ', 'ⒶⒷⒸⒹⒺⒻⒼⒽⒾⒿⓀⓁⓂⓃⓄⓅⓆⓇⓈⓉⓊⓋⓌⓍⓎⓏ', '⓪①②③④⑤⑥⑦⑧⑨'),
  mk('Dark Bubble', '🅐🅑🅒🅓🅔🅕🅖🅗🅘🅙🅚🅛🅜🅝🅞🅟🅠🅡🅢🅣🅤🅥🅦🅧🅨🅩', '🅐🅑🅒🅓🅔🅕🅖🅗🅘🅙🅚🅛🅜🅝🅞🅟🅠🅡🅢🅣🅤🅥🅦🅧🅨🅩', '⓿❶❷❸❹❺❻❼❽❾'),
  mk('Squares', '🄰🄱🄲🄳🄴🄵🄶🄷🄸🄹🄺🄻🄼🄽🄾🄿🅀🅁🅂🅃🅄🅅🅆🅇🅈🅉', '🄰🄱🄲🄳🄴🄵🄶🄷🄸🄹🄺🄻🄼🄽🄾🄿🅀🅁🅂🅃🅄🅅🅆🅇🅈🅉'),
  mk('Dark Squares', '🅰🅱🅲🅳🅴🅵🅶🅷🅸🅹🅺🅻🅼🅽🅾🅿🆀🆁🆂🆃🆄🆅🆆🆇🆈🆉', '🅰🅱🅲🅳🅴🅵🅶🅷🅸🅹🅺🅻🅼🅽🅾🅿🆀🆁🆂🆃🆄🆅🆆🆇🆈🆉'),
  mk('Full Width', 'ａｂｃｄｅｆｇｈｉｊｋｌｍｎｏｐｑｒｓｔｕｖｗｘｙｚ', 'ＡＢＣＤＥＦＧＨＩＪＫＬＭＮＯＰＱＲＳＴＵＶＷＸＹＺ', '０１２３４５６７８９'),
  mk('Canadian', 'ᗩᗷᑕᗪEᖴGᕼIᒍKᒪᗰᑎOᑭᑫᖇᔕTᑌᐯᗯ᙭Yᘔ', 'ᗩᗷᑕᗪEᖴGᕼIᒍKᒪᗰᑎOᑭᑫᖇᔕTᑌᐯᗯ᙭Yᘔ'),
  mk('Greek', 'αвcdєfgнιנкℓмησρqяѕтυνωχуz', 'ΛBᄃDΣFGΉIJKᄂMПӨPQЯƧƬЦVЩXYZ'),
  mk('Currency', '₳฿₵ĐɆ₣₲ⱧłJ₭Ⱡ₥₦Ø₱QⱤ₴₮ɄV₩ӾɎⱫ', '₳฿₵ĐɆ₣₲ⱧłJ₭Ⱡ₥₦Ø₱QⱤ₴₮ɄV₩ӾɎⱫ'),
  mk('Tiny', 'ᵃᵇᶜᵈᵉᶠᵍʰⁱʲᵏˡᵐⁿᵒᵖqʳˢᵗᵘᵛʷˣʸᶻ', 'ᴬᴮᶜᴰᴱᶠᴳᴴᴵᴶᴷᴸᴹᴺᴼᴾQᴿˢᵀᵁⱽᵂˣʸᶻ', '⁰¹²³⁴⁵⁶⁷⁸⁹'),
  mk('Asian', '卂乃匚ᗪ乇千Ꮆ卄丨ﾌҜㄥ爪几ㄖ卩Ɋ尺丂ㄒㄩᐯ山乂ㄚ乙', '卂乃匚ᗪ乇千Ꮆ卄丨ﾌҜㄥ爪几ㄖ卩Ɋ尺丂ㄒㄩᐯ山乂ㄚ乙'),
  mk('Medieval', 'ɑɓƈɗҽƒɠɦɩʝƙʅɱɳσρզɾʂƭυʋɯxყȥ', 'ɑɓƈɗҽƒɠɦɩʝƙʅɱɳσρզɾʂƭυʋɯxყȥ'),
  mk('Cursive', 'ąცƈɖɛʄɠɧıʝƙƖɱŋơ℘զཞʂɬų۷ῳҳყʑ', 'ąცƈɖɛʄɠɧıʝƙƖɱŋơ℘զཞʂɬų۷ῳҳყʑ'),
  mk('Upside Down', 'ɐqɔpǝɟƃɥᴉɾʞlɯuodbɹsʇnʌʍxʎz', '∀qƆpƎℲפHIſʞ˥WNOԀQɹS┴∩ΛMX⅄Z'),
  wrap('Reversed', (t) => Array.from(t).reverse().join('')),
  wrap('Strike', combine('\u0336')),
  wrap('Underline', combine('\u0332')),
  wrap('Double Underline', combine('\u0333')),
  wrap('Slash', combine('\u0338')),
  wrap('Wavy', combine('\u0330')),
  wrap('Hearts', (t) => Array.from(t).map(c => (c === ' ' ? c : c + '♥')).join('')),
  wrap('Sparkles', (t) => `✨ ${t} ✨`),
  wrap('Spaced', (t) => Array.from(t).join(' ')),
  wrap('Brackets', (t) => Array.from(t).map(c => (c === ' ' ? c : `【${c}】`)).join('')),
  wrap('Royal', (t) => `꧁༺ ${t} ༻꧂`),
  wrap('Wings', (t) => `ıllıllı ${t} ıllıllı`),
  wrap('Stars', (t) => `★彡 ${t} 彡★`),
];

module.exports = {
  name: 'fancy',
  aliases: ['fancytext', 'style', 'fancyv2', 'textstyle'],
  category: 'utility',
  description: '✨ Text ko 40+ fancy styles me badlein (offline, no API)',
  usage: '.fancy <text>  |  .fancy <number> <text>',

  async execute(sock, msg, args, extra) {
    const { reply, react } = extra;
    if (!args.length) {
      return reply('❌ Text likhein.\n\nExample: `.fancy Professor`\nEk style: `.fancy 5 Professor`');
    }
    let pickNo = null;
    if (/^\d+$/.test(args[0]) && args.length > 1) pickNo = parseInt(args.shift(), 10);
    const text = args.join(' ').slice(0, 300);

    if (pickNo) {
      const st = STYLES[pickNo - 1];
      if (!st) return reply(`❌ Style number 1 se ${STYLES.length} tak hai.`);
      await react('✨');
      return reply(st.fn(text));
    }

    let out = `✨ *Fancy Styles:* _${text}_\n\n`;
    STYLES.forEach((st, i) => { out += `*${i + 1}.* ${st.fn(text)}\n`; });
    out += `\n_Ek style chahiye? .fancy <number> <text>_`;
    await react('✨');
    return reply(out);
  },
  STYLES,
};
