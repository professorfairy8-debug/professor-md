// ============================================
// .autostatus — status auto VIEW + auto LIKE (react) ek saath (per bot number)
//   .autostatus on | off | view on/off | like on/off | emoji ❤️,🔥 | status
// main.js → lib/system.js autoHandleStatus() inhi settings ko parhta hai.
// ============================================
const { cmd } = require('../arslan');
const { updateUserConfigInMongoDB } = require('../lib/database');

cmd({
    pattern: 'autostatus',
    alias: ['statusauto', 'autostory'],
    desc: 'Auto view + auto like statuses',
    category: 'settings',
    react: '👀',
    filename: __filename
}, async (conn, mek, m, { args, reply, isOwner, botNumber, config }) => {
    if (!isOwner) return reply('❌ Ye command sirf owner ke liye hai.');
    const num = String(botNumber || '').replace(/\D/g, '');
    const a = (args[0] || '').toLowerCase();
    const b = (args[1] || '').toLowerCase();
    const save = async (patch) => {
        Object.assign(config || {}, patch); // turant asar (cached config)
        await updateUserConfigInMongoDB(num, patch);
    };
    const on = (v) => (String(v) === 'true' ? '🟢 ON' : '🔴 OFF');

    if (a === 'on' || a === 'off') {
        const v = a === 'on' ? 'true' : 'false';
        await save({ AUTO_VIEW_STATUS: v, AUTO_LIKE_STATUS: v });
        return reply(`✅ Status auto-view + auto-like *${a.toUpperCase()}* ho gaya.`);
    }
    if ((a === 'view' || a === 'like') && (b === 'on' || b === 'off')) {
        const key = a === 'view' ? 'AUTO_VIEW_STATUS' : 'AUTO_LIKE_STATUS';
        await save({ [key]: b === 'on' ? 'true' : 'false' });
        return reply(`✅ Status auto-${a} *${b.toUpperCase()}* ho gaya.`);
    }
    if (a === 'emoji') {
        const list = args.slice(1).join(' ').split(/[,\s]+/).filter(Boolean);
        if (!list.length) return reply('❌ Usage: .autostatus emoji ❤️,🔥,😍');
        await save({ AUTO_LIKE_EMOJI: list });
        return reply(`✅ Status react emojis: ${list.join(' ')}`);
    }
    const c = config || {};
    return reply(
        `📊 *Auto Status*\n\n` +
        `• View: ${on(c.AUTO_VIEW_STATUS ?? 'true')}\n` +
        `• Like: ${on(c.AUTO_LIKE_STATUS ?? 'true')}\n` +
        `• Emojis: ${(Array.isArray(c.AUTO_LIKE_EMOJI) && c.AUTO_LIKE_EMOJI.length ? c.AUTO_LIKE_EMOJI : ['❤️']).join(' ')}\n\n` +
        `*Usage:*\n.autostatus on / off\n.autostatus view on/off\n.autostatus like on/off\n.autostatus emoji ❤️,🔥`
    );
});
