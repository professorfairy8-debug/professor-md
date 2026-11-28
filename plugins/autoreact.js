// ============================================
// .autoreact — aane wale messages par pyara sa react (per bot number)
//   .autoreact inbox  → sirf inbox (DM)   [DEFAULT]
//   .autoreact group  → sirf groups
//   .autoreact all    → har jagah (inbox + groups)
//   .autoreact off    → band
//   .autoreact set ❤️,🌹,✨ | reset | status
// Status par react: .autostatus like on/off
// Actual reacting happens in main.js (AUTO REACT block).
// ============================================
const { cmd } = require('../arslan');
const { updateUserConfigInMongoDB } = require('../lib/database');

const DEFAULT = '❤️,🩷,💖,💗,💕,🥰,😍,🌹,🌸,✨,💫,🦋,🤍,💜,😘,🫶,🌺,💝';
const MODES = { on: 'all', all: 'all', true: 'all', inbox: 'inbox', dm: 'inbox', private: 'inbox', group: 'group', groups: 'group', off: 'false', false: 'false' };
const LABEL = { all: '🟢 Har jagah (inbox + groups)', inbox: '🟢 Sirf inbox (DM)', group: '🟢 Sirf groups', false: '🔴 Band', true: '🟢 Har jagah (inbox + groups)' };

cmd({
    pattern: 'autoreact',
    alias: ['areact', 'autoreaction'],
    desc: 'Auto react: inbox / group / all / off',
    category: 'owner',
    react: '💖',
    filename: __filename
}, async (conn, mek, m, { args, reply, isOwner, botNumber, config }) => {
    if (!isOwner) return reply('❌ Ye command sirf owner ke liye hai.');
    const num = String(botNumber || '').replace(/\D/g, '');
    const sub = (args[0] || '').toLowerCase();
    const save = async (patch) => {
        Object.assign(config || {}, patch);          // turant asar
        await updateUserConfigInMongoDB(num, patch); // restart ke baad bhi yaad
    };

    if (MODES[sub]) {
        await save({ AUTO_REACT: MODES[sub] });
        return reply(`✅ Auto-react: *${LABEL[MODES[sub]]}*`);
    }
    if (sub === 'set') {
        const list = args.slice(1).join(' ').split(/[,\s]+/).filter(Boolean).join(',');
        if (!list) return reply('❌ Usage: .autoreact set ❤️,🌹,✨');
        await save({ AUTO_REACT_EMOJIS: list });
        return reply(`✅ Emojis set: ${list.split(',').join(' ')}`);
    }
    if (sub === 'reset') {
        await save({ AUTO_REACT_EMOJIS: '' });
        return reply(`✅ Default emojis wapas: ${DEFAULT.split(',').join(' ')}`);
    }
    const c = config || {};
    const mode = String(c.AUTO_REACT ?? 'inbox').toLowerCase();
    const st = (v) => (String(v ?? 'true') === 'true' ? '🟢 ON' : '🔴 OFF');
    return reply(
        `📊 *Auto-React*\n\n` +
        `• Messages: ${LABEL[mode] || LABEL.inbox}\n` +
        `• Status like: ${st(c.AUTO_LIKE_STATUS)}\n` +
        `• Status view: ${st(c.AUTO_VIEW_STATUS)}\n` +
        `• Emojis: ${(c.AUTO_REACT_EMOJIS || DEFAULT).split(',').join(' ')}\n\n` +
        `*Usage:*\n.autoreact inbox — sirf inbox\n.autoreact group — sirf groups\n.autoreact all — har jagah\n.autoreact off — band\n.autoreact set ❤️,🌹,✨\n.autostatus like on/off — status par react`
    );
});
