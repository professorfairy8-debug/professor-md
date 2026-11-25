/**
 * Fancy Text Generator Plugin
 * Converts plain text into multiple fancy Unicode styles.
 * API: https://api.princetechn.com/api/tools/fancyv2?apikey=prince&text=<text>
 */

const axios = require('axios');

const USER_AGENTS = [
  'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
  'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.2 Safari/605.1.15',
  'Mozilla/5.0 (iPhone; CPU iPhone OS 17_2 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.2 Mobile/15E148 Safari/604.1',
  'Mozilla/5.0 (Linux; Android 13; SM-S918B) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Mobile Safari/537.36',
  'okhttp/4.9.3'
];

// Retry function with exponential backoff
async function fetchWithRetry(url, maxRetries = 3, timeout = 15000) {
  let lastError;
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      const userAgent = USER_AGENTS[(attempt - 1) % USER_AGENTS.length];
      const response = await axios.get(url, {
        timeout,
        headers: { 'User-Agent': userAgent }
      });
      return response;
    } catch (err) {
      lastError = err;
      if (attempt === maxRetries) break;
      const delay = Math.pow(2, attempt - 1) * 1000;
      await new Promise(resolve => setTimeout(resolve, delay));
    }
  }
  throw lastError;
}


// ---- Local fallback (used when the external API is down) ----
function mapRange(upper, lower, digits) {
  return (ch) => {
    const c = ch.codePointAt(0);
    if (c >= 65 && c <= 90 && upper) return String.fromCodePoint(upper + c - 65);
    if (c >= 97 && c <= 122 && lower) return String.fromCodePoint(lower + c - 97);
    if (c >= 48 && c <= 57 && digits) return String.fromCodePoint(digits + c - 48);
    return ch;
  };
}
function mapString(upperStr, lowerStr) {
  const U = [...upperStr], L = [...lowerStr];
  return (ch) => {
    const c = ch.charCodeAt(0);
    if (c >= 65 && c <= 90) return U[c - 65] || ch;
    if (c >= 97 && c <= 122) return L[c - 97] || ch;
    return ch;
  };
}
const LOCAL_STYLES = [
  ['Bold', mapRange(0x1D400, 0x1D41A, 0x1D7CE)],
  ['Italic', mapRange(0x1D434, 0x1D44E, 0)],
  ['Bold Italic', mapRange(0x1D468, 0x1D482, 0)],
  ['Script', mapRange(0x1D4D0, 0x1D4EA, 0)],
  ['Fraktur', mapRange(0x1D56C, 0x1D586, 0)],
  ['Double Struck', mapRange(0x1D538, 0x1D552, 0x1D7D8)],
  ['Sans Bold', mapRange(0x1D5D4, 0x1D5EE, 0x1D7EC)],
  ['Monospace', mapRange(0x1D670, 0x1D68A, 0x1D7F6)],
  ['Circled', mapRange(0x24B6, 0x24D0, 0)],
  ['Squared', mapRange(0x1F130, 0x1F130, 0)],
  ['Fullwidth', mapRange(0xFF21, 0xFF41, 0xFF10)],
  ['Small Caps', mapString('ABCDEFGHIJKLMNOPQRSTUVWXYZ', 'ᴀʙᴄᴅᴇꜰɢʜɪᴊᴋʟᴍɴᴏᴘǫʀsᴛᴜᴠᴡxʏᴢ')],
  ['Upside Down', null]
];
function localFancy(text) {
  const out = [];
  for (const [name, fn] of LOCAL_STYLES) {
    if (name === 'Upside Down') {
      const from = 'abcdefghijklmnopqrstuvwxyz', to = 'ɐqɔpǝɟƃɥᴉɾʞlɯuodbɹsʇnʌʍxʎz';
      const r = [...text.toLowerCase()].map(c => { const i = from.indexOf(c); return i >= 0 ? to[i] : c; }).reverse().join('');
      out.push({ name, result: r });
    } else {
      out.push({ name, result: [...text].map(fn).join('') });
    }
  }
  return out;
}

module.exports = {
  name: 'fancy',
  aliases: ['fancytext', 'style', 'fancyv2', 'textstyle'],
  category: 'utility',
  description: '✨ Convert text into 91+ fancy Unicode styles',
  usage: '.fancy <your text>',

  async execute(sock, msg, args, extra) {
    const { reply, react, from } = extra;

    try {
      if (!args.length) {
        return reply(
          '❌ Please provide text to fancy‑ify.\n\n' +
          'Example: `.fancy Hello World`'
        );
      }

      const text = args.join(' ');
      await react('✨');

      const statusMsg = await sock.sendMessage(from, { text: '⏳ Generating fancy styles...' }, { quoted: msg });
      const msgKey = statusMsg.key;

      const apiUrl = `https://api.princetechn.com/api/tools/fancyv2?apikey=prince&text=${encodeURIComponent(text)}`;

      let results;
      try {
        const response = await fetchWithRetry(apiUrl, 2, 8000);
        const data = response.data;
        if (data && data.success && Array.isArray(data.results) && data.results.length) results = data.results;
      } catch (err) { /* API down -> local fallback below */ }
      if (!results) results = localFancy(text);

      // Filter out styles that return the original text unchanged (optional, but keeps output clean)
      const filtered = results.filter(item => item.result !== text);

      if (filtered.length === 0) {
        await sock.sendMessage(from, {
          text: '❌ No fancy styles generated (API returned empty).',
          edit: msgKey
        });
        await react('❌');
        return;
      }

      // Build the result message
      let resultMessage = `✨ *Fancy Styles for:*\n_${text}_\n\n`;
      filtered.forEach((item, index) => {
        resultMessage += `${index + 1}. *${item.name}* : ${item.result}\n`;
      });
      resultMessage += `\n_Total: ${filtered.length} styles_`;

      // Split into chunks if too long (WhatsApp limit ~65k, but we'll chunk at 4000 for readability)
      const MAX_CHARS = 4000;
      if (resultMessage.length > MAX_CHARS) {
        const chunks = [];
        let currentChunk = '';
        const lines = resultMessage.split('\n');
        for (const line of lines) {
          if ((currentChunk + line + '\n').length > MAX_CHARS) {
            chunks.push(currentChunk);
            currentChunk = line + '\n';
          } else {
            currentChunk += line + '\n';
          }
        }
        if (currentChunk) chunks.push(currentChunk);

        // Send first chunk by editing the status message
        await sock.sendMessage(from, { text: chunks[0], edit: msgKey });
        // Send remaining chunks as new messages
        for (let i = 1; i < chunks.length; i++) {
          await sock.sendMessage(from, { text: chunks[i] }, { quoted: msg });
        }
      } else {
        // Edit the status message with the full result
        await sock.sendMessage(from, { text: resultMessage, edit: msgKey });
      }

      await react('✅');
    } catch (error) {
      console.error('Fancy command error:', error.message);
      await reply(`❌ Unexpected error: ${error.message}`);
      await react('❌');
    }
  }
};
