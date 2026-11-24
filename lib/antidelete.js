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

async function handleAntidelete(conn, updates, store, botNumber) {
    try {
        // Per-number on/off (saved by .antidelete). Default ON.
        let userConfig = {};
        try { userConfig = (await getUserConfigFromMongoDB(botNumber)) || {}; } catch (e) { userConfig = {}; }
        if ((userConfig.ANTIDELETE ?? 'true') !== 'true') return;

        // Alerts go to THIS bot's own number (self-chat).
        const cleanBotNumber = String(botNumber).replace(/[^0-9]/g, '');
        if (!cleanBotNumber) return;
        const ownerJid = `${cleanBotNumber}@s.whatsapp.net`;

        for (const update of updates || []) {
            const deletedKey = getDeletedKey(update);
            if (!deletedKey || !deletedKey.id) continue;

            const chatJid = deletedKey.remoteJid || (update.key && update.key.remoteJid);
            if (!chatJid || chatJid === 'status@broadcast') continue;

            if (!markProcessed(`${chatJid}:${deletedKey.id}`)) continue;

            const deletedMsg = await store.loadMessage(chatJid, deletedKey.id);
            if (!deletedMsg || !deletedMsg.message) continue;
            if (deletedMsg.key && deletedMsg.key.fromMe) continue; // own deletions are not interesting

            const inner = unwrap(deletedMsg.message);
            if (!inner) continue;
            const type = getContentType(inner);
            if (!type || type === 'protocolMessage' || type === 'senderKeyDistributionMessage') continue;

            const isGroup = chatJid.endsWith('@g.us');
            const sender = deletedMsg.key.participant || deletedMsg.participant || chatJid;
            const content = describe(inner, type);
            const chatName = isGroup ? await getGroupName(conn, chatJid) : 'Private Chat';
            const senderName = deletedMsg.pushName || sender.split('@')[0];

            const text = `⚠️ *MESSAGE DELETED DETECTED!*\n\n` +
                `📱 *From:* ${senderName}\n` +
                `👤 *Number:* @${sender.split('@')[0]}\n` +
                `💬 *Chat:* ${chatName}\n` +
                `📝 *Message:* ${content}\n` +
                `🕐 *Time:* ${new Date().toLocaleString()}\n` +
                `📌 *Type:* ${isGroup ? 'Group' : 'Private'}`;

            try {
                await conn.sendMessage(ownerJid, { text, mentions: [sender] });
            } catch (err) {
                console.error('[ANTIDELETE] Failed to send alert:', err.message);
                continue;
            }

            // Re-send the deleted media itself (best effort)
            const mediaTypes = { imageMessage: 'image', videoMessage: 'video', audioMessage: 'audio', stickerMessage: 'sticker', documentMessage: 'document' };
            if (mediaTypes[type]) {
                try {
                    const buffer = await downloadMediaMessage(
                        { key: deletedMsg.key, message: inner },
                        'buffer',
                        {},
                        { logger: console, reuploadRequest: conn.updateMediaMessage }
                    );
                    if (buffer && buffer.length) {
                        const m = inner[type];
                        const payload = { [mediaTypes[type]]: buffer };
                        if (m.mimetype) payload.mimetype = m.mimetype;
                        if (type === 'documentMessage' && m.fileName) payload.fileName = m.fileName;
                        if (type === 'audioMessage') payload.ptt = !!m.ptt;
                        await conn.sendMessage(ownerJid, payload);
                    }
                } catch (err) {
                    console.error('[ANTIDELETE] Could not recover media:', err.message);
                }
            }
            console.log(`[ANTIDELETE] Deleted message from ${sender} in ${chatJid}`);
        }
    } catch (error) {
        console.error('[ANTIDELETE ERROR]', error.message);
    }
}

module.exports = { handleAntidelete };
