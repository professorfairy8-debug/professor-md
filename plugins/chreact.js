// ============================================
// .chreact — PROFESSOR²⁹ MD channel auto-react control (owner only)
//   .chreact on | off | status
//   .chreact key <API_KEY>
//   .chreact <post link> [emoji]   → manual react via API
// ============================================
const { cmd } = require('../arslan');
const config = require('../config');
const ch = require('../lib/chreact');

cmd({
    pattern: 'chreact',
    alias: ['channelreact', 'autochreact'],
    desc: 'Channel auto-react on/off, API key, manual react',
    category: 'owner',
    react: '💖',
    filename: __filename
}, async (conn, mek, m, { args, reply, isOwner }) => {
    if (!isOwner) return reply('❌ Ye command sirf owner ke liye hai.');
    const sub = (args[0] || '').toLowerCase();

    if (sub === 'on' || sub === 'off') {
        ch.setEnabled(sub === 'on');
        if (sub === 'on') ch.onConnect(conn, 3).catch(() => {});
        return reply(`✅ Channel auto-react *${sub.toUpperCase()}* ho gaya.`);
    }

    if (sub === 'key') {
        const key = args.slice(1).join(' ').trim();
        if (!key) return reply('❌ Usage: .chreact key <API_KEY>');
        ch.setApiKey(key);
        return reply('✅ API key save ho gayi. Ab har nayi channel post par API se bhi reacts lagenge.');
    }

    if (sub.startsWith('http')) {
        const link = args[0];
        if (!/whatsapp\.com\/channel\//i.test(link)) return reply('❌ WhatsApp channel/post ka link dein.');
        const emoji = args[1] || ch.pick(ch.CUTE_EMOJIS);
        await reply(`⏳ React bheja ja raha hai ${emoji} ...`);
        const r = await ch.callReactApi(link, emoji);
        if (r.ok) return reply(`✅ React successfully bhej diya ${emoji}`);
        const why = r.error || (r.data && (r.data.message || r.data.error)) || `HTTP ${r.status}`;
        return reply(`❌ API ne react nahi lagaya.\n_${String(why).slice(0, 200)}_`);
    }

    const jid = await ch.resolveChannelJid(conn);
    return reply(
        `📊 *Channel Auto-React*\n\n` +
        `• Status: ${ch.isEnabled() ? '🟢 ON' : '🔴 OFF'}\n` +
        `• Channel: ${jid ? '✅ connected' : '❌ resolve nahi hua'}\n` +
        `• API key: ${ch.getApiKey() ? '✅ set' : '❌ set nahi'}\n` +
        `• Emojis: ${ch.CUTE_EMOJIS.join(' ')}\n\n` +
        `*Usage:*\n.chreact on / off\n.chreact key <KEY>\n.chreact <post link> ❤️`
    );
});
