const config = require('../../../config');
const { translate } = require('../../utils/translate');

module.exports = {
    name: 'urdu',
    aliases: ['ur', 'tourdu'],
    category: 'utility',
    description: 'Kisi bhi message ka Urdu tarjuma (reply karein ya text likhein)',
    usage: `${config.PREFIX}urdu <text>  ya kisi message ko reply karke ${config.PREFIX}urdu`,

    async execute(sock, msg, args, extra) {
        try {
            const textToTranslate = (extra.quoted?.text || '').trim() || args.join(' ').trim();
            if (!textToTranslate) {
                return extra.reply(`⚠️ Kisi message ko reply karke *${extra.prefix}urdu* likhein, ya:\n*${extra.prefix}urdu Hello how are you*`);
            }
            await extra.react('⏳');
            const result = await translate(textToTranslate, 'ur');
            await extra.reply(`🌐 *URDU TRANSLATOR*\n\n*Original zabaan:* ${result.from || 'auto'}\n\n*Tarjuma:*\n${result.text}`);
            await extra.react('✅');
        } catch (error) {
            console.error('Urdu translate error:', error.message);
            await extra.reply('⚠️ Translation server abhi jawab nahi de raha, thori der baad try karein.');
        }
    }
};
