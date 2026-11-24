// ============================================
// lib/msg.js — message serializer
// Adds the helpers that plugins rely on:
//   m.body / m.text, m.reply(), m.react(), m.download(), m.mentionedJid
//   m.quoted.{message, mtype, type, text, sender, key, id, download()}
// Also exposes the quoted media helpers to every quoted-message object,
// so `m.quoted.imageMessage` style checks keep working too.
// ============================================
const {
    getContentType,
    jidNormalizedUser,
    downloadContentFromMessage
} = require('@whiskeysockets/baileys');

const MEDIA_TYPES = {
    imageMessage: 'image',
    videoMessage: 'video',
    audioMessage: 'audio',
    stickerMessage: 'sticker',
    documentMessage: 'document',
    ptvMessage: 'video'
};

// Unwrap view-once / ephemeral / document-with-caption containers
function unwrapMessage(message) {
    let msg = message;
    for (let i = 0; i < 5 && msg; i++) {
        const inner =
            msg.ephemeralMessage?.message ||
            msg.viewOnceMessage?.message ||
            msg.viewOnceMessageV2?.message ||
            msg.viewOnceMessageV2Extension?.message ||
            msg.documentWithCaptionMessage?.message;
        if (!inner) break;
        msg = inner;
    }
    return msg;
}

function textOf(message, mtype) {
    if (!message || !mtype) return '';
    const c = message[mtype];
    if (typeof c === 'string') return c;
    return c?.text || c?.caption || c?.selectedDisplayText ||
        c?.singleSelectReply?.selectedRowId || c?.selectedButtonId ||
        c?.selectedId || c?.name || '';
}

async function downloadMedia(message) {
    const msg = unwrapMessage(message);
    const mtype = getContentType(msg);
    const content = msg?.[mtype];
    const kind = MEDIA_TYPES[mtype];
    if (!kind || !content) throw new Error('No downloadable media in this message');
    const stream = await downloadContentFromMessage(content, kind);
    const chunks = [];
    for await (const chunk of stream) chunks.push(chunk);
    return Buffer.concat(chunks);
}

const sms = (conn, m) => {
    if (!m) return m;

    if (m.key) {
        m.id = m.key.id;
        m.isBaileys = !!m.id && m.id.startsWith('BAE5') && m.id.length === 16;
        m.chat = m.key.remoteJid;
        m.fromMe = m.key.fromMe;
        m.isGroup = (m.chat || '').endsWith('@g.us');
        try {
            m.sender = jidNormalizedUser(m.fromMe ? conn.user.id : (m.participant || m.key.participant || m.chat));
        } catch (e) {
            m.sender = m.key.participant || m.chat;
        }
    }

    if (m.message) {
        const inner = unwrapMessage(m.message);
        m.mtype = getContentType(inner);
        m.msg = inner?.[m.mtype];

        m.body = textOf(inner, m.mtype) ||
            inner?.buttonsResponseMessage?.selectedButtonId ||
            inner?.listResponseMessage?.singleSelectReply?.selectedRowId || '';
        m.text = m.body;

        const ctxInfo = (m.msg && typeof m.msg === 'object') ? m.msg.contextInfo : null;
        m.mentionedJid = ctxInfo?.mentionedJid || [];

        m.download = () => downloadMedia(m.message);

        // ── QUOTED MESSAGE ──
        if (ctxInfo?.quotedMessage) {
            const qRaw = ctxInfo.quotedMessage;
            const qMsg = unwrapMessage(qRaw);
            const qType = getContentType(qMsg);
            const qSender = ctxInfo.participant || m.chat;
            let botId = '';
            try { botId = jidNormalizedUser(conn.user.id); } catch (e) {}
            const quoted = {
                // keep the raw content keys available (quoted.imageMessage etc.)
                ...qMsg,
                message: qMsg,
                mtype: qType,
                type: qType,
                msg: qMsg?.[qType],
                text: textOf(qMsg, qType),
                stanzaId: ctxInfo.stanzaId,
                id: ctxInfo.stanzaId,
                participant: qSender,
                sender: qSender,
                fromMe: !!botId && qSender === botId,
                key: {
                    remoteJid: m.chat,
                    fromMe: !!botId && qSender === botId,
                    id: ctxInfo.stanzaId,
                    participant: m.isGroup ? qSender : undefined
                },
                download: () => downloadMedia(qRaw)
            };
            quoted.body = quoted.text;
            m.quoted = quoted;
        } else {
            m.quoted = null;
        }

        m.reply = (text, chatId = m.chat, options = {}) =>
            conn.sendMessage(chatId, { text: String(text) }, { quoted: m, ...options });

        m.react = (emoji) =>
            conn.sendMessage(m.chat, { react: { text: emoji, key: m.key } }).catch(() => {});
    }
    return m;
};

module.exports = { sms, downloadMedia, unwrapMessage };
