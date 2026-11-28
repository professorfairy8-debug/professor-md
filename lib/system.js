// ============================================
// lib/system.js — channel react + status helpers (clean, readable)
// The previous version of this file was a 169 KB obfuscated blob that
// required packages which don't exist in this project and could not be
// audited. It has been replaced with this plain implementation that
// exports the same names main.js imports.
// ============================================
const config = require('../config');

const CHANNEL_IDS = Array.isArray(config.CHANNEL_IDS) ? config.CHANNEL_IDS : [];
const REACT_EMOJIS = config.AUTO_CHANNEL_REACT_EMOJIS || ['❤️', '🔥', '👑', '💯', '😍', '💖', '✨'];

const pick = (arr) => arr[Math.floor(Math.random() * arr.length)];

async function reactToChannelPost(conn, channelJid, serverId, emoji) {
    try {
        if (typeof conn.newsletterReactMessage !== 'function') return false;
        await conn.newsletterReactMessage(channelJid, String(serverId), emoji || pick(REACT_EMOJIS));
        return true;
    } catch (e) {
        return false;
    }
}

async function autoReactChannel(conn, mek) {
    if (!mek?.key?.remoteJid?.endsWith('@newsletter')) return false;
    return reactToChannelPost(conn, mek.key.remoteJid, mek.newsletterServerId || mek.key.id);
}

/**
 * Handles one status@broadcast message using the per-number settings
 * (AUTO_VIEW_STATUS / AUTO_LIKE_STATUS / AUTO_STATUS_REPLY) with the
 * global config values as fallback.
 */
async function autoHandleStatus(conn, mek, userConfig = {}) {
    if (!mek?.key || mek.key.remoteJid !== 'status@broadcast') return;
    if (mek.key.fromMe) return;
    const participant = mek.key.participant;
    if (!participant) return;

    const flag = (userKey, globalKey) => {
        const v = userConfig[userKey];
        if (v === 'true' || v === 'false') return v === 'true';
        return String(config[globalKey]) === 'true';
    };

    if (flag('AUTO_VIEW_STATUS', 'AUTO_STATUS_SEEN')) {
        try { await conn.readMessages([mek.key]); } catch (e) {}
    }

    if (flag('AUTO_LIKE_STATUS', 'AUTO_STATUS_REACT')) {
        try {
            const emojis = (Array.isArray(userConfig.AUTO_LIKE_EMOJI) && userConfig.AUTO_LIKE_EMOJI.length)
                ? userConfig.AUTO_LIKE_EMOJI
                : (config.AUTO_STATUS_EMOJIS || ['❤️']);
            // Baileys v7: the poster can be a LID (123@lid) or a phone JID —
            // send the reaction to every form we know so it always arrives.
            const bare = (j) => j ? String(j).split(':')[0].split('@')[0] : '';
            const meIds = [conn.user?.id, conn.user?.lid, conn.authState?.creds?.me?.lid]
                .filter(Boolean).map(j => bare(j) + (String(j).includes('@lid') ? '@lid' : '@s.whatsapp.net'));
            const list = [...new Set([participant, mek.key.participantAlt, ...meIds].filter(Boolean))];
            await conn.sendMessage('status@broadcast', {
                react: { text: pick(emojis), key: mek.key }
            }, { statusJidList: list });
        } catch (e) {}
    }

    if (flag('AUTO_STATUS_REPLY', 'AUTO_STATUS_REPLY')) {
        try {
            let text = userConfig.AUTO_STATUS_MSG || config.AUTO_STATUS_MSG || 'Nice status! 💖';
            if (/black popkid/i.test(text)) text = 'Nice status! 💖';
            await conn.sendMessage(participant, { text }, { quoted: mek });
        } catch (e) {}
    }
}

// kept for backwards compatibility with old imports — no-op
async function arslanmd() { return true; }

module.exports = {
    arslanmd,
    autoReactChannel,
    autoHandleStatus,
    reactToChannelPost,
    CHANNEL_IDS,
    REACT_EMOJIS
};
