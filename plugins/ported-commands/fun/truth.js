/**
 * Truth - Get a random truth question from @bochilteam/scraper (translated to English)
 */

const { translate } = require('../../utils/translate');

let truthFn = null;
const getTruthFn = () => {
  if (truthFn) return truthFn;
  // Lazy-load to avoid side effects during command discovery/startup.
  const mod = require('@bochilteam/scraper');
  truthFn = mod.truth;
  return truthFn;
};

module.exports = {
    name: 'truth',
    aliases: [],
    category: 'fun',
    desc: 'Get a random truth question',
    usage: 'truth',
    execute: async (sock, msg, args, extra) => {
      try {
        const truth = getTruthFn();
        let question;
        try { question = await truth(); } catch (e) { question = null; }
        if (!question) {
          const fallback = [
            'Tumhara sab se bara dar kya hai?', 'Kabhi kisi se jhoot bola jis par baad mein afsos hua?',
            'Tumhara pehla crush kaun tha?', 'Sab se sharminda karne wala lamha kaun sa tha?',
            'Agar ek din ke liye invisible ho jao to kya karoge?', 'Tumhari sab se buri aadat kya hai?'
          ];
          return extra.reply(`🤔 *TRUTH*\n\n${fallback[Math.floor(Math.random() * fallback.length)]}`);
        }
        let text = question;
        try { text = (await translate(question, 'en')).text || question; } catch (e) {}
        await extra.reply(`🤔 *TRUTH*\n\n${text}`);
        
      } catch (error) {
        console.error('Truth Error:', error.message);
        await extra.reply('❌ Truth question abhi nahi mil saka, dobara try karein.');
      }
    }
  };
  
