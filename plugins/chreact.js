const { cmd } = require('../arslan');
const chReact = require('../lib/chreact');

cmd({
    pattern: "chreact",
    react: "💖",
    alias: ["channelreact", "chr"],
    desc: "Channel auto-react: on | off | status | key <KEY> | <post link> [emoji]",
    category: "owner",
    filename: __filename
},
async (conn, mek, m, { args, isCreator, reply }) => {
    if (!isCreator) return reply("❌ Only the bot owner can use this command.");

    const sub = (args[0] || '').toLowerCase();

    if (!sub || sub === 'status') {
        return reply(
            `💖 *Channel Auto-React*\n\n` +
            `Status: ${chReact.isEnabled() ? 'ON ✅' : 'OFF ❌'}\n` +
            `API key: ${chReact.getApiKey() ? 'set ✅' : 'not set ❌'}\n\n` +
            `.chreact on | off\n.chreact key <KEY>\n.chreact <post link> [emoji]`
        );
    }
    if (sub === 'on' || sub === 'off') {
        chReact.setEnabled(sub === 'on');
        return reply(`💖 Channel auto-react ${sub === 'on' ? 'ON ✅' : 'OFF ❌'}`);
    }
    if (sub === 'key') {
        if (!args[1]) return reply('❌ Usage: .chreact key <API_KEY>');
        chReact.setApiKey(args[1]);
        return reply('✅ API key saved.');
    }

    const link = args.find(a => /whatsapp\.com\/channel\//i.test(a));
    if (!link) return reply('❌ Give a channel post link.\nExample: .chreact https://whatsapp.com/channel/XXXX/123 ❤️');
    const emoji = args.find(a => a !== link);

    const parts = link.split('/').filter(Boolean);
    const code = chReact.inviteCodeFromLink(link);
    const serverId = /^\d+$/.test(parts[parts.length - 1]) ? parts[parts.length - 1] : null;
    if (!code || !serverId) return reply('❌ Link must be a post link ending with the post number.');

    // 1) react from this bot's own account
    let ok = false;
    try {
        const meta = await conn.newsletterMetadata('invite', code);
        if (meta && meta.id) ok = await chReact.reactFromSocket(conn, meta.id, serverId, emoji);
    } catch (e) {}

    // 2) API boost (if key is set)
    let api = null;
    if (chReact.getApiKey()) api = await chReact.callReactApi(link, emoji || chReact.pick(chReact.CUTE_EMOJIS));

    return reply(
        `💖 *Channel React*\n` +
        `Bot account: ${ok ? '✅' : '❌'}\n` +
        `API: ${api ? (api.ok ? '✅' : '❌ ' + (api.error || api.status)) : 'skipped (no key)'}`
    );
});
