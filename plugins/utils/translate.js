// Shared translator for .urdu / .truth / anything else.
// 1) Google's public "gtx" endpoint (fast, no key)  2) @vitalets/google-translate-api as fallback
const axios = require('axios');

async function translate(text, to = 'en', from = 'auto') {
    text = String(text || '').trim();
    if (!text) throw new Error('Nothing to translate');
    try {
        const { data } = await axios.get('https://translate.googleapis.com/translate_a/single', {
            params: { client: 'gtx', sl: from, tl: to, dt: 't', q: text },
            timeout: 15000
        });
        const out = (data?.[0] || []).map(p => p?.[0] || '').join('');
        if (out) return { text: out, from: data?.[2] || from };
        throw new Error('empty response');
    } catch (e) {
        const lib = require('@vitalets/google-translate-api');
        const fn = typeof lib === 'function' ? lib : (lib.translate || lib.default);
        const res = await fn(text, { from, to });
        return { text: res.text, from: res.from?.language?.iso || res.raw?.src || from };
    }
}

module.exports = { translate };
