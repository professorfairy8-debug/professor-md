// lib/antidelete.js
const { getContentType, downloadMediaMessage } = require('@whiskeysockets/baileys');
const config = require('../config');
const { getUserConfigFromMongoDB } = require('./database');

// ── Duplicate-processing guard ──
// The same deletion can arrive twice (messages.update AND messages.upsert,
// or Baileys retries). Capped so it can't grow forever.
const processedDeletes = new Set();
const MAX_PROCESSED = 2000;
function markProcessed(id) {
    if (processedDeletes.has(id)) return false;
    processedDeletes.add(id);
    if (processedDeletes.size > MAX_PROCESSED) {
        processedDeletes.delete(processedDeletes.values().next().value);
    }
    return true;
}

const REVOKE_STUB = 1; // WAMessageStubType.REVOKE

// Pull the key of the deleted message out of any of the formats Baileys uses:
//  1) newer Baileys:  messages.update -> { key, update: { messageStubType: 1, message: null } }
//  2) older Baileys:  update.message.protocolMessage { type: 0, key }
//  3) messages.upsert carrying a protocolMessage (we wrap it as format 2 from main.js)
function getDeletedKey(update) {
    try {
        const u = update && update.update;
        if (!u) return null;
        const proto = u.message && u.message.protocolMessage;
        if (proto && (proto.type === 0 || proto.type === 'REVOKE') && proto.key) return proto.key;
        if (u.messageStubType === REVOKE_STUB || u.messageStubType === 'REVOKE') return update.key;
    } catch (e) { /* ignore */ }
    return null;
}

function unwrap(message) {
    let m = message;
    for (let i = 0; i < 4 && m; i++) {
        if (m.ephemeralMessage) m = m.ephemeralMessage.message;
        else if (m.viewOnceMessage) m = m.viewOnceMessage.message;
        else if (m.viewOnceMessageV2) m = m.viewOnceMessageV2.message;
        else if (m.viewOnceMessageV2Extension) m = m.viewOnceMessageV2Extension.message;
        else if (m.documentWithCaptionMessage) m = m.documentWithCaptionMessage.message;
        else break;
    }
    return m;
}

function describe(inner, type) {
    switch (type) {
        case 'conversation': return inner.conversation;
        case 'extendedTextMessage': return inner.extendedTextMessage.text;
        case 'imageMessage': return '🖼️ Image' + (inner.imageMessage.caption ? `\n📝 Caption: ${inner.imageMessage.caption}` : '');
        case 'videoMessage': return '🎥 Video' + (inner.videoMessage.caption ? `\n📝 Caption: ${inner.videoMessage.caption}` : '');
        case 'audioMessage': return inner.audioMessage.ptt ? '🎤 Voice note' : '🎵 Audio';
        case 'stickerMessage': return '🎨 Sticker';
        case 'documentMessage': return '📄 Document' + (inner.documentMessage.fileName ? `\n📁 File: ${inner.documentMessage.fileName}` : '');
        case 'locationMessage': return '📍 Location';
        case 'contactMessage': return '👤 Contact';
        case 'buttonsMessage': return '🔘 Buttons';
        case 'listMessage': return '📋 List';
        default: return '📨 Message';
    }
}

async function getGroupName(conn, jid) {
    try {
        const metadata = await conn.groupMetadata(jid);
        return metadata.subject || 'Unknown Group';
    } catch (e) {
        return 'Unknown Group';
    }
}

async function isAntideleteOn(botNumber) {
    try {
        const cfg = await Promise.race([
            getUserConfigFromMongoDB(String(botNumber)),
            new Promise(r => setTimeout(() => r(null), 4000))
        ]);
        const v = cfg && cfg.ANTIDELETE;
        if (v === 'false' || v === false) return false;
        return true; // default ON
    } catch (e) {
        return true;
    }
}

// Look the deleted message up in the store; LID/PN chat ids can differ, so
// fall back to searching every chat by message id.
async function findDeleted(store, chatJid, id) {
    try {
        const direct = await store.loadMessage(chatJid, id);
        if (direct) return direct;
    } catch (e) {}
    try {
        if (typeof store.loadMessageById === 'function') return await store.loadMessageById(id);
        for (const jid of Object.keys(store.messages || {})) {
            const hit = (store.messages[jid] || []).find(m => m.key && m.key.id === id);
            if (hit) return hit;
        }
    } catch (e) {}
    return null;
}

async function handleAntidelete(conn, updates, store, botNumber) {
    try {
        const cleanBotNumber = String(botNumber || '').replace(/[^0-9]/g, '');
        if (!cleanBotNumber) return;
        if (!(await isAntideleteOn(cleanBotNumber))) return;

        // Alerts ALWAYS go to the bot number's own "You" chat (Message yourself)
        const selfJid = `${cleanBotNumber}@s.whatsapp.net`;

        for (const update of updates || []) {
            const deletedKey = getDeletedKey(update);
            if (!deletedKey || !deletedKey.id) continue;

            const chatJid = (update.key && update.key.remoteJid) || deletedKey.remoteJid;
            if (!chatJid || chatJid === 'status@broadcast' || chatJid.endsWith('@newsletter')) continue;

            if (!markProcessed(deletedKey.id)) continue;

            const deletedMsg = await findDeleted(store, chatJid, deletedKey.id);
            if (!deletedMsg || !deletedMsg.message) continue;
            if (deletedMsg.key && deletedMsg.key.fromMe) continue; // apne delete kiye hue skip

            const inner = unwrap(deletedMsg.message);
            if (!inner) continue;
            const type = getContentType(inner);
            if (!type || type === 'protocolMessage' || type === 'senderKeyDistributionMessage' || type === 'reactionMessage') continue;

            const isGroup = chatJid.endsWith('@g.us');
            const senderRaw = deletedMsg.key.participant || deletedMsg.participant || chatJid;
            const senderPn = [deletedMsg.key.participantAlt, deletedMsg.key.remoteJidAlt, senderRaw]
                .find(j => j && String(j).endsWith('@s.whatsapp.net')) || senderRaw;
            const senderNum = String(senderPn).split('@')[0].split(':')[0];
            const content = describe(inner, type);
            const chatName = isGroup ? await getGroupName(conn, chatJid) : 'Private Chat';
            const senderName = deletedMsg.pushName || senderNum;

            const text = `⚠️ *DELETED MESSAGE CAUGHT!*\n\n` +
                `👤 *From:* ${senderName}\n` +
                `📱 *Number:* @${senderNum}\n` +
                `💬 *Chat:* ${chatName}\n` +
                `📌 *Type:* ${isGroup ? 'Group' : 'Private'}\n` +
                `🕐 *Time:* ${new Date().toLocaleString('en-PK', { timeZone: 'Asia/Karachi' })}\n\n` +
                `📝 *Message:*\n${content}`;

            let sentTo = null;
            for (const target of [selfJid, conn.user && conn.user.lid ? String(conn.user.lid).split(':')[0].split('@')[0] + '@lid' : null].filter(Boolean)) {
                try {
                    await conn.sendMessage(target, { text, mentions: [senderPn] });
                    sentTo = target;
                    break;
                } catch (err) {
                    console.error(`[ANTIDELETE] Failed to send alert to ${target}:`, err.message);
                }
            }
            if (!sentTo) continue;

            // Re-send the deleted media itself (best effort)
            const mediaTypes = { imageMessage: 'image', videoMessage: 'video', audioMessage: 'audio', stickerMessage: 'sticker', documentMessage: 'document', ptvMessage: 'video' };
            if (mediaTypes[type]) {
                try {
                    const buffer = await downloadMediaMessage(
                        { key: deletedMsg.key, message: inner },
                        'buffer',
                        {},
                        { reuploadRequest: conn.updateMediaMessage }
                    );
                    if (buffer && buffer.length) {
                        const m = inner[type];
                        const payload = { [mediaTypes[type]]: buffer };
                        if (m.mimetype && type !== 'stickerMessage') payload.mimetype = m.mimetype;
                        if (type === 'documentMessage') payload.fileName = m.fileName || 'file';
                        if (type === 'audioMessage') payload.ptt = !!m.ptt;
                        if ((type === 'imageMessage' || type === 'videoMessage') ) payload.caption = `♻️ Deleted ${mediaTypes[type]} from @${senderNum}`;
                        if (payload.caption) payload.mentions = [senderPn];
                        await conn.sendMessage(sentTo, payload);
                    }
                } catch (err) {
                    console.error('[ANTIDELETE] Could not recover media:', err.message);
                }
            }
            console.log(`[ANTIDELETE] Deleted message from ${senderNum} in ${chatJid} → sent to You chat`);
        }
    } catch (error) {
        console.error('[ANTIDELETE ERROR]', error.message);
    }
}

module.exports = { handleAntidelete };
