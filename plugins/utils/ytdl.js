/**
 * Shared YouTube downloader for .song / .play / .video
 *
 * Why this exists: direct ytdl-core is usually blocked on cloud hosts
 * (Heroku, Render...) with "Sign in to confirm you're not a bot", and the
 * old single backup API was a single point of failure. So now many free
 * providers are tried one after another, and ytdl-core is only the LAST
 * fallback. First provider that returns a downloadable file wins.
 */
const axios = require('axios');

const UA = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36';
const HTTP = { timeout: 45000, headers: { 'User-Agent': UA, Accept: 'application/json, text/plain, */*' } };
const MAX_BYTES = 95 * 1024 * 1024; // WhatsApp practical limit

// Find a download link in whatever shape a provider answers with.
function pickUrl(data, kind) {
    const keys = kind === 'audio'
        ? ['download_url', 'downloadURL', 'downloadUrl', 'download', 'mp3', 'audio', 'url', 'link']
        : ['download_url', 'downloadURL', 'downloadUrl', 'download', 'mp4', 'video', 'url', 'link'];
    const seen = new Set();
    function scan(o, depth) {
        if (!o || depth > 4 || seen.has(o)) return null;
        if (typeof o === 'string') return /^https?:\/\//i.test(o) ? o : null;
        if (typeof o !== 'object') return null;
        seen.add(o);
        for (const k of keys) {
            if (typeof o[k] === 'string' && /^https?:\/\//i.test(o[k])) return o[k];
        }
        for (const k of ['result', 'data', 'results', 'response']) {
            if (o[k]) { const r = scan(o[k], depth + 1); if (r) return r; }
        }
        for (const k of Object.keys(o)) {
            if (typeof o[k] === 'object') { const r = scan(o[k], depth + 1); if (r) return r; }
        }
        return null;
    }
    return scan(data, 0);
}
function pickTitle(data) {
    const t = data?.result?.title || data?.data?.title || data?.title || data?.result?.metadata?.title;
    return typeof t === 'string' ? t : null;
}

const enc = encodeURIComponent;
const PROVIDERS = {
    audio: [
        (u) => `https://eliteprotech-apis.zone.id/ytdown?url=${enc(u)}&format=mp3`,
        (u) => `https://api.yupra.my.id/api/downloader/ytmp3?url=${enc(u)}`,
        (u) => `https://okatsu-rolezapiiz.vercel.app/downloader/ytmp3?url=${enc(u)}`,
        (u) => `https://izumiiiii.vercel.app/download/ytmp3?url=${enc(u)}`,
        (u) => `https://api.princetechn.com/api/download/ytmp3?apikey=prince&url=${enc(u)}`,
        (u) => `https://api.giftedtech.co.ke/api/download/ytmp3?apikey=gifted&url=${enc(u)}`,
        (u) => `https://api.vreden.my.id/api/ytmp3?url=${enc(u)}`,
        (u) => `https://api.siputzx.my.id/api/d/ytmp3?url=${enc(u)}`,
        (u) => `https://backend1.tioo.eu.org/YouTube?url=${enc(u)}`,
    ],
    video: [
        (u) => `https://eliteprotech-apis.zone.id/ytdown?url=${enc(u)}&format=mp4`,
        (u) => `https://api.yupra.my.id/api/downloader/ytmp4?url=${enc(u)}`,
        (u) => `https://okatsu-rolezapiiz.vercel.app/downloader/ytmp4?url=${enc(u)}`,
        (u) => `https://api.princetechn.com/api/download/ytmp4?apikey=prince&url=${enc(u)}`,
        (u) => `https://api.giftedtech.co.ke/api/download/ytmp4?apikey=gifted&url=${enc(u)}`,
        (u) => `https://api.vreden.my.id/api/ytmp4?url=${enc(u)}`,
        (u) => `https://api.siputzx.my.id/api/d/ytmp4?url=${enc(u)}`,
        (u) => `https://backend1.tioo.eu.org/YouTube?url=${enc(u)}`,
    ],
};

async function fetchFile(url) {
    const res = await axios.get(url, {
        responseType: 'arraybuffer',
        timeout: 120000,
        maxContentLength: MAX_BYTES,
        maxBodyLength: MAX_BYTES,
        headers: { 'User-Agent': UA },
    });
    const buf = Buffer.from(res.data);
    if (!buf.length || buf.length < 2000) throw new Error('empty file');
    // some providers answer with a JSON/HTML error page and status 200
    const head = buf.slice(0, 15).toString('utf8').trim().toLowerCase();
    if (head.startsWith('{') || head.startsWith('<')) throw new Error('not a media file');
    return buf;
}

function streamToBuffer(stream) {
    return new Promise((resolve, reject) => {
        const chunks = []; let size = 0;
        stream.on('data', (c) => { size += c.length; if (size > MAX_BYTES) { stream.destroy(); return reject(new Error('file too large')); } chunks.push(c); });
        stream.on('end', () => resolve(Buffer.concat(chunks)));
        stream.on('error', reject);
    });
}

async function viaYtdlCore(url, kind) {
    const ytdl = require('@distube/ytdl-core');
    const info = await ytdl.getInfo(url);
    const dur = parseInt(info.videoDetails.lengthSeconds || '0', 10);
    if (dur > (kind === 'audio' ? 1200 : 600)) throw new Error('video too long');
    const stream = kind === 'audio'
        ? ytdl.downloadFromInfo(info, { quality: 'highestaudio', filter: 'audioonly' })
        : ytdl.downloadFromInfo(info, { quality: '18' });
    return { buffer: await streamToBuffer(stream), title: info.videoDetails.title };
}

/**
 * @param {string} url   YouTube url
 * @param {'audio'|'video'} kind
 * @returns {{buffer:Buffer,title:string|null,source:string}}
 */
async function downloadYoutube(url, kind = 'audio') {
    const errors = [];
    for (const build of PROVIDERS[kind]) {
        const apiUrl = build(url);
        const host = apiUrl.split('/')[2];
        try {
            const r = await axios.get(apiUrl, HTTP);
            let link = pickUrl(r.data, kind);
            // tioo backend uses {mp3, mp4}; pickUrl handles it, but prefer the right key
            if (host.includes('tioo') && r.data) link = kind === 'audio' ? (r.data.mp3 || r.data.mp4 || link) : (r.data.mp4 || link);
            if (!link) throw new Error('no link in response');
            const buffer = await fetchFile(link);
            return { buffer, title: pickTitle(r.data), source: host };
        } catch (e) {
            errors.push(`${host}: ${e.message}`);
        }
    }
    try {
        const r = await viaYtdlCore(url, kind);
        if (r.buffer && r.buffer.length) return { ...r, source: 'ytdl-core' };
    } catch (e) {
        errors.push(`ytdl-core: ${e.message}`);
    }
    const err = new Error('All download servers failed right now. Please try again in a minute.');
    err.details = errors;
    console.error('[ytdl] all providers failed:', errors.join(' | '));
    throw err;
}

module.exports = { downloadYoutube };
