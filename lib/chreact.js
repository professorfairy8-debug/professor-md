// ============================================
// lib/chreact.js — PROFESSOR²⁹ MD channel auto-react
//
// 1) Har connected bot number apne hi WhatsApp account se hamare channel
//    ki nayi posts par khud pyara sa react lagata hai (boot par bhi, aur
//    jab bhi nayi post aaye).
// 2) Agar CHREACT_API_KEY set ho (ya `.chreact key <KEY>` se), to har nayi
//    post ka link ammar-chreact-api ko bhi bhej diya jata hai — ek post sirf
//    EK dafa (saare connected numbers mil kar bhi ek hi call karte hain).
//
// Owner command (plugins/chreact.js):  .chreact on | off | status | key <KEY> | <post link> [emoji]
// ============================================
const axios = require('axios');
const config = require('../config');

let db = null;
try { db = require('./database'); } catch (e) { db = null; }

const CUTE_EMOJIS = (Array.isArray(config.CHANNEL_REACT_EMOJIS) && config.CHANNEL_REACT_EMOJIS.length)
    ? config.CHANNEL_REACT_EMOJIS
    : ['🌚', '👻', '💋', '🤭', '☺️', '💀', '👀', '🫂', '🥳', '🥰', '😍', '💖', '🩷', '💗', '💞', '🦋', '🌸', '✨', '🫶', '😘', '🤗', '💫', '🎀', '🧸', '🍓', '🌷'];

const pick = (arr) => arr[Math.floor(Math.random() * arr.length)];
const sleep = (ms) => new Promise(r => setTimeout(r, ms));

// ---------- settings (global, survive restarts through MongoDB) ----------
function getSetting(key, fallback) {
    try {
        const v = db && db.getGlobalSetting ? db.getGlobalSetting(key) : undefined;
        return v === undefined || v === null ? fallback : v;
    } catch (e) { return fallback; }
}
function setSetting(key, value) {
    try { if (db && db.setGlobalSetting) db.setGlobalSetting(key, value); } catch (e) {}
}

function isEnabled() {
    const v = getSetting('autoChReact', undefined);
    if (v === true || v === 'true') return true;
    if (v === false || v === 'false') return false;
    return true; // DEFAULT ON — sirf `.chreact off` se band hota hai
}
function setEnabled(on) { setSetting('autoChReact', !!on); }

function getApiKey() { return getSetting('chreactApiKey', '') || config.CHREACT_API_KEY || ''; }
function setApiKey(k) { setSetting('chreactApiKey', String(k || '').trim()); }

// ---------- channel helpers ----------
function inviteCodeFromLink(link) {
    const m = String(link || '').match(/whatsapp\.com\/channel\/([A-Za-z0-9_-]+)/i);
    return m ? m[1] : null;
}

function channelLink() { return String(config.CHANNEL_LINK || '').replace(/\/+$/, ''); }

function postLink(serverId) {
    const base = channelLink();
    return base && serverId ? `${base}/${serverId}` : null;
}

// Owner ka channel link -> newsletter JID (e.g. 1203630xxxx@newsletter).
// Ek dafa mil jaye to MongoDB global setting me yaad rakha jata hai, taake
// har restart par dobara WhatsApp se poochna na pare.
let resolving = null;
let lastFail = 0;
async function resolveChannelJid(conn) {
    if (config.CHANNEL_JID) return config.CHANNEL_JID;
    const code = inviteCodeFromLink(config.CHANNEL_LINK);
    if (!code) return null;

    const saved = getSetting(`channelJid:${code}`, null);
    if (saved) {
        config.CHANNEL_JID = saved;
        if (Array.isArray(config.CHANNEL_IDS) && !config.CHANNEL_IDS.includes(saved)) config.CHANNEL_IDS.push(saved);
        return saved;
    }
    if (!conn || typeof conn.newsletterMetadata !== 'function') return null;
    if (Date.now() - lastFail < 60000) return null; // fail hua tha, 1 min ruko
    if (resolving) return resolving;

    resolving = (async () => {
        try {
            const meta = await conn.newsletterMetadata('invite', code);
            const jid = meta && (meta.id || meta?.thread_metadata?.id);
            if (jid && String(jid).endsWith('@newsletter')) {
                config.CHANNEL_JID = jid;
                if (Array.isArray(config.CHANNEL_IDS) && !config.CHANNEL_IDS.includes(jid)) config.CHANNEL_IDS.push(jid);
                setSetting(`channelJid:${code}`, jid);
                console.log(`📢 Channel resolved: ${jid}`);
                return jid;
            }
            lastFail = Date.now();
            return null;
        } catch (e) {
            lastFail = Date.now();
            console.error('[Channel] resolve error:', e.message);
            return null;
        } finally {
            resolving = null;
        }
    })();
    return resolving;
}

function ourChannels() {
    const list = new Set();
    if (config.CHANNEL_JID) list.add(config.CHANNEL_JID);
    if (config.INTERNAL_CHANNEL_JID) list.add(config.INTERNAL_CHANNEL_JID);
    for (const j of (Array.isArray(config.CHANNEL_IDS) ? config.CHANNEL_IDS : [])) list.add(j);
    return list;
}

// ---------- reaction API (ammar-chreact-api) ----------
const apiDone = new Set();
function rememberApi(key) {
    if (apiDone.has(key)) return false;
    apiDone.add(key);
    if (apiDone.size > 1000) apiDone.delete(apiDone.values().next().value);
    return true;
}

async function callReactApi(link, emoji) {
    const apikey = getApiKey();
    if (!apikey) return { ok: false, error: 'API key set nahi hai (.chreact key <KEY>)' };
    const base = String(config.CHREACT_API_URL || 'https://ammar-chreact-api.vercel.app').replace(/\/+$/, '');
    try {
        const res = await axios.get(`${base}/api/wareact`, {
            params: { apikey, link, emoji: emoji || pick(CUTE_EMOJIS) },
            timeout: 45000,
            validateStatus: () => true
        });
        const data = res.data;
        const ok = res.status < 400 && !(data && (data.status === false || data.success === false));
        return { ok, status: res.status, data };
    } catch (e) {
        return { ok: false, error: e.message };
    }
}

// ---------- reacting from this bot's own account ----------
// Har channel apni reaction setting rakhta hai:
//   ALL   = koi bhi emoji      BASIC = sirf 👍 ❤️ 😂 😮 😢 🙏      NONE = reaction band
// Pehle ye check nahi hota tha — "BASIC" wale channel par 🩷 / 🦋 jaisa emoji
// WhatsApp chupke se rad kar deta tha aur react lagta hi nahi tha.
const BASIC_CUTE = ['❤️', '❤️', '❤️', '❤️', '👍', '🙏'];
const reactModeCache = new Map(); // jid -> { mode, at }
async function getReactMode(conn, jid) {
    const hit = reactModeCache.get(jid);
    if (hit && Date.now() - hit.at < 60 * 60 * 1000) return hit.mode;
    let mode = 'ALL';
    try {
        if (typeof conn.newsletterMetadata === 'function') {
            const meta = await Promise.race([
                conn.newsletterMetadata('jid', jid),
                new Promise((_, rej) => setTimeout(() => rej(new Error('timeout')), 15000))
            ]);
            const tm = (meta && (meta.thread_metadata || meta.threadMetadata)) || {};
            const v = tm.settings && tm.settings.reaction_codes && tm.settings.reaction_codes.value;
            if (v) mode = String(v).toUpperCase();
        }
    } catch (e) { /* unknown -> assume ALL, BASIC fallback below still protects */ }
    reactModeCache.set(jid, { mode, at: Date.now() });
    return mode;
}
function emojiFor(mode) {
    if (mode === 'NONE') return null;
    if (mode === 'BASIC') return pick(BASIC_CUTE);
    return pick(CUTE_EMOJIS);
}

// ek hi post par ek session baar baar react na kare (reconnect par bhi)
function alreadyDone(conn, jid, serverId) {
    const key = `${jid}:${serverId}`;
    conn.__chDone = conn.__chDone || new Set();
    if (conn.__chDone.has(key)) return true;
    conn.__chDone.add(key);
    if (conn.__chDone.size > 2000) conn.__chDone.delete(conn.__chDone.values().next().value);
    return false;
}

async function reactFromSocket(conn, jid, serverId, emoji) {
    try {
        if (typeof conn.newsletterReactMessage !== 'function') return false;
        if (!emoji && alreadyDone(conn, jid, serverId)) return false;
        const mode = await getReactMode(conn, jid);
        const e = emoji || emojiFor(mode);
        if (!e) return false; // channel ne reactions band kiye hue hain
        await conn.newsletterReactMessage(jid, String(serverId), e);
        return true;
    } catch (e) {
        // ghalat emoji ki wajah se fail ho to safe ❤️ se ek dafa aur
        try { await conn.newsletterReactMessage(jid, String(serverId), '❤️'); return true; } catch (e2) { return false; }
    }
}

// Called for every message upsert — only does something for OUR channel posts
async function onChannelMessage(conn, mek) {
    try {
        const jid = mek?.key?.remoteJid;
        if (!jid || !jid.endsWith('@newsletter')) return;
        if (!isEnabled()) return;
        if (!ourChannels().has(jid)) return;
        if (mek.message?.reactionMessage || mek.message?.protocolMessage) return;

        const serverId = mek.key.server_id || mek.newsletterServerId || mek.key.serverId;
        if (!serverId) return;

        await sleep(1000 + Math.floor(Math.random() * 4000)); // thora natural delay
        await reactFromSocket(conn, jid, serverId);

        // API boost: har post sirf ek dafa
        if (jid === config.CHANNEL_JID && getApiKey() && rememberApi(`${jid}:${serverId}`)) {
            const link = postLink(serverId);
            if (link) {
                const r = await callReactApi(link, emojiFor(await getReactMode(conn, jid)) || '❤️');
                console.log(`[ChReact] API ${r.ok ? '✅' : '❌'} ${link}${r.error ? ' — ' + r.error : ''}`);
            }
        }
    } catch (e) {
        console.error('[ChReact] error:', e.message);
    }
}

// Find server ids inside the raw IQ result of newsletterFetchMessages
function collectServerIds(node, out = []) {
    if (!node || typeof node !== 'object') return out;
    if (Array.isArray(node)) { node.forEach(n => collectServerIds(n, out)); return out; }
    if (node.tag === 'message' && node.attrs && (node.attrs.server_id || node.attrs.message_id)) {
        out.push(String(node.attrs.server_id || node.attrs.message_id));
    }
    if (Array.isArray(node.content)) node.content.forEach(n => collectServerIds(n, out));
    return out;
}

// On boot / connect: follow + live-subscribe EVERY managed channel (own channel
// + all channels added in the admin panel — no limit), then react to the
// latest posts of each one.
async function onConnect(conn, latest = 3) {
    try {
        let jid = null;
        for (let i = 0; i < 4 && !jid; i++) {           // connect ke foran baad WhatsApp kabhi busy hota hai
            if (i) { lastFail = 0; await sleep(20000); }
            jid = await resolveChannelJid(conn);
        }
        if (!jid) console.log('[ChReact] ⚠️ own channel JID nahi mila — CHANNEL_LINK check karein ya CHANNEL_JID Config Var dein');

        const list = [...ourChannels()];
        let reacted = 0;
        for (const ch of list) {
            try { if (typeof conn.newsletterFollow === 'function') await conn.newsletterFollow(ch); } catch (e) {}
            try { if (typeof conn.subscribeNewsletterUpdates === 'function') await conn.subscribeNewsletterUpdates(ch); } catch (e) {}
            if (!isEnabled() || typeof conn.newsletterFetchMessages !== 'function') { await sleep(800); continue; }
            try {
                const res = await conn.newsletterFetchMessages(ch, latest);
                const ids = [...new Set(collectServerIds(res))].slice(-latest);
                for (const id of ids) {
                    if (await reactFromSocket(conn, ch, id)) reacted++;
                    await sleep(1500 + Math.floor(Math.random() * 2000));
                }
            } catch (e) {}
            await sleep(1200);
        }
        console.log(`[ChReact] ✅ ${list.length} channel(s) subscribed, ${reacted} react(s) sent`);
    } catch (e) {
        console.error('[ChReact] connect error:', e.message);
    }
}

// Live updates expire after a few minutes — renew them for every managed channel
async function resubscribeAll(conn) {
    if (typeof conn.subscribeNewsletterUpdates !== 'function') return;
    for (const ch of ourChannels()) {
        try { await conn.subscribeNewsletterUpdates(ch); } catch (e) {}
        await sleep(400);
    }
}

module.exports = {
    CUTE_EMOJIS,
    isEnabled,
    setEnabled,
    getApiKey,
    setApiKey,
    resolveChannelJid,
    inviteCodeFromLink,
    callReactApi,
    onChannelMessage,
    onConnect,
    resubscribeAll,
    ourChannels,
    reactFromSocket,
    pick
};
