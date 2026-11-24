// ============================================
// 🔗 ANTI-LINK - ᑭᖇOᖴESSOᖇ ²⁹ ᗰᗪ🍷🚩
// Auto delete links + Warn + Kick
// Settings are saved in the database, so they survive restarts.
// ============================================

const { cmd } = require('../arslan');
const config = require('../config');
const database = require('../lib/database');

// Domains that are always allowed (exact domain or its subdomains)
const ALLOWED_DOMAINS = [
    'wa.me',
    'youtube.com',
    'youtu.be',
    'instagram.com',
    'facebook.com',
    'twitter.com',
    'x.com',
    'tiktok.com',
    'github.com',
    'google.com'
];
// Always blocked even if the parent domain is allowed (group invite spam)
const BLOCKED_HOSTS = ['chat.whatsapp.com'];

const TLDS = 'com|net|org|info|io|me|co|xyz|site|online|link|app|dev|ly|gg|tv|pk|in|us|uk|ru|cc|top|club|shop|store|live|fun|icu|vip|ws|to|sh|biz|pw|tk|ml|ga|cf|gq|cn|de|fr|ir|id|bd|ae|sa|tr|win|bid|click|space|website|tech|page|cloud';
const LINK_REGEX = new RegExp(
    '(?:https?:\\/\\/|www\\.)[^\\s]+|\\b(?:[a-z0-9-]+\\.)+(?:' + TLDS + ')\\b(?:\\/[^\\s]*)?',
    'gi'
);

function hostOf(link) {
    let l = link.trim().replace(/[)\].,!?]+$/, '');
    if (!/^https?:\/\//i.test(l)) l = 'http://' + l;
    try { return new URL(l).hostname.toLowerCase().replace(/^www\./, ''); } catch { return ''; }
}

function isAllowedLink(link) {
    const host = hostOf(link);
    if (!host) return true; // couldn't parse -> not a real link
    if (BLOCKED_HOSTS.some(b => host === b || host.endsWith('.' + b))) return false;
    return ALLOWED_DOMAINS.some(d => host === d || host.endsWith('.' + d));
}

function extractLinks(text) {
    return [...new Set(text.match(LINK_REGEX) || [])];
}

function getBody(mek) {
    let msg = mek.message || {};
    if (msg.ephemeralMessage) msg = msg.ephemeralMessage.message || {};
    if (msg.viewOnceMessage) msg = msg.viewOnceMessage.message || {};
    if (msg.documentWithCaptionMessage) msg = msg.documentWithCaptionMessage.message || {};
    return msg.conversation ||
        msg.extendedTextMessage?.text ||
        msg.imageMessage?.caption ||
        msg.videoMessage?.caption ||
        msg.documentMessage?.caption ||
        '';
}

function getState(from) {
    const s = database.getGroupSettings(from);
    return { on: !!s.antilink, action: s.antilinkAction || 'warn' };
}

// ============================================
// 📌 MAIN COMMAND
// ============================================
cmd({
    pattern: "antilink",
    alias: ["al", "nolink", "linkfilter"],
    desc: "🔗 Anti-Link System for groups",
    category: "admin",
    react: "🔗",
    filename: __filename
}, async (conn, mek, m, { from, isGroup, isAdmins, isBotAdmins, isOwner, reply, args, prefix }) => {

    if (!isGroup) return reply("❌ This command only works in groups.");
    if (!isAdmins && !isOwner) return reply("❌ You need to be an admin to use this command.");

    const mode = (args[0] || '').toLowerCase();
    const actionType = (args[1] || 'warn').toLowerCase();

    if (mode !== 'on' && mode !== 'off') {
        const st = getState(from);
        return reply(`🔗 *Anti-Link System*

📌 *Status:* ${st.on ? '✅ ON' : '❌ OFF'}
⚡ *Action:* ${st.action.toUpperCase()}

📌 *Commands:*
• ${prefix}antilink on warn - Delete link + warn
• ${prefix}antilink on kick - Delete link + kick after ${config.maxWarnings || 3} warns
• ${prefix}antilink off - Disable system

💖 *Powered by ᑭᖇOᖴESSOᖇ ²⁹ ᗰᗪ🍷🚩*`);
    }

    if (mode === 'on') {
        if (!isBotAdmins) return reply("❌ Pehle mujhe group ka admin banayein, phir antilink on karein.");
        const action = ['warn', 'kick', 'delete'].includes(actionType) ? actionType : 'warn';
        database.updateGroupSettings(from, { antilink: true, antilinkAction: action });
        const actionMsg = { warn: '⚠️ Delete + Warn', delete: '🗑️ Delete only', kick: '👢 Delete + Kick after max warns' }[action];
        return reply(`✅ *Anti-Link Activated!*

📌 *Action:* ${actionMsg}
🔹 Links (except allowed domains) will be removed.
🔹 Admins and owner are never touched.

💖 Powered by ᑭᖇOᖴESSOᖇ ²⁹ ᗰᗪ🍷🚩`);
    }

    database.updateGroupSettings(from, { antilink: false });
    return reply(`❌ *Anti-Link Deactivated!*\n\n📌 Links will no longer be filtered.\n\n💖 Powered by ᑭᖇOᖴESSOᖇ ²⁹ ᗰᗪ🍷🚩`);
});

// ============================================
// 📌 ANTI-LINK HANDLER (runs on every message)
// ============================================
cmd({
    pattern: "antilink_handler",
    on: "body",
    filename: __filename
}, async (conn, mek, m, { from, isGroup, isBotAdmins, isAdmins, isOwner, sender, senderNumber }) => {
    try {
        if (!isGroup) return;
        if (mek.key.fromMe) return;
        const st = getState(from);
        if (!st.on) return;
        if (!isBotAdmins) return;
        if (isAdmins || isOwner) return;

        const body = getBody(mek);
        if (!body) return;

        const links = extractLinks(body);
        if (!links.length) return;
        if (!links.some(l => !isAllowedLink(l))) return;

        // delete the message
        try { await conn.sendMessage(from, { delete: mek.key }); }
        catch (e) { console.log('[AntiLink] Delete error:', e.message); }

        if (st.action === 'delete') return;

        const maxWarns = config.maxWarnings || 3;
        const warn = database.addWarning(from + '#antilink', sender, 'Link');

        await conn.sendMessage(from, {
            text: `🔗 *Link detected & removed!*\n\n⚠️ Sharing links is not allowed here.\n👤 User: @${senderNumber}\n📊 Warn: ${warn.count}/${maxWarns}\n\n💖 Powered by ᑭᖇOᖴESSOᖇ ²⁹ ᗰᗪ🍷🚩`,
            mentions: [sender]
        });

        if (st.action === 'kick' && warn.count >= maxWarns) {
            try {
                await conn.groupParticipantsUpdate(from, [sender], 'remove');
                database.clearWarnings(from + '#antilink', sender);
                await conn.sendMessage(from, {
                    text: `👢 *User kicked!*\n\n📌 Reason: Repeated links (${warn.count} warns)\n👤 User: @${senderNumber}`,
                    mentions: [sender]
                });
            } catch (e) {
                console.log('[AntiLink] Kick error:', e.message);
            }
        }
    } catch (e) {
        console.log('[AntiLink] handler error:', e.message);
    }
});

console.log('🔗 ᑭᖇOᖴESSOᖇ ²⁹ ᗰᗪ🍷🚩 - Anti-Link Plugin Loaded! 💖');
