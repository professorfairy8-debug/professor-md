/**
 * .cartoon <name>      — list cartoon episodes (Urdu / Hindi dubbed etc.)
 * .cartoon <name> -d   — download the first result that is short enough
 *                        for WhatsApp (up to 15 minutes)
 */
const yts = require('yt-search');
const { downloadYoutube } = require('../../utils/ytdl');

function fmt(seconds) {
  const s = Number(seconds) || 0;
  const m = Math.floor(s / 60), sec = s % 60;
  return `${m}m ${String(sec).padStart(2, '0')}s`;
}

module.exports = {
  name: 'cartoon',
  aliases: ['cartoons', 'toon', 'kartoon'],
  category: 'entertainment',
  description: 'Search / download cartoon episodes (e.g. .cartoon Tom and Jerry -d)',
  usage: '.cartoon <name> [-d]',

  async execute(sock, msg, args, extra) {
    const wantDownload = args.some(a => a.toLowerCase() === '-d' || a.toLowerCase() === 'dl');
    const query = args.filter(a => a.toLowerCase() !== '-d' && a.toLowerCase() !== 'dl').join(' ').trim();

    if (!query) {
      return extra.reply('🧸 *CARTOON*\n\nUsage:\n• *.cartoon Tom and Jerry* — list\n• *.cartoon Doraemon urdu -d* — download\n• *.cartoon Motu Patlu hindi*');
    }

    await extra.react('🔎');
    const search = await yts(`${query} cartoon episode`);
    const all = (search.videos || []).filter(v => v.seconds >= 30);

    if (!all.length) {
      await extra.react('❌');
      return extra.reply('❌ Koi cartoon nahi mila. Spelling check kr ka dobara try karein.');
    }

    if (!wantDownload) {
      const videos = all.slice(0, 8);
      let text = `🧸 *CARTOON RESULTS*\n🔎 _${query}_\n━━━━━━━━━━━━━━━━━━\n\n`;
      videos.forEach((v, i) => {
        text += `*${i + 1}. ${v.title}*\n📺 ${v.author?.name || 'Unknown'}  •  ⏱️ ${fmt(v.seconds)}\n🔗 ${v.url}\n\n`;
      });
      text += `━━━━━━━━━━━━━━━━━━\n📥 Download: *.cartoon ${query} -d*\n(sirf 15 min tak ki episode WhatsApp ma bheji ja sakti ha)`;
      await extra.reply(text);
      return extra.react('✅');
    }

    const pick = all.find(v => v.seconds <= 900);
    if (!pick) {
      await extra.react('❌');
      return extra.reply('❌ Is naam ki sari episodes 15 min se lambi hain. Links ky liye *.cartoon ' + query + '* use karein.');
    }

    await extra.reply(`⏳ Downloading *${pick.title}* (${fmt(pick.seconds)})...`);
    const res = await downloadYoutube(pick.url, 'video');
    const title = res.title || pick.title;

    await sock.sendMessage(extra.from, {
      video: res.buffer,
      mimetype: 'video/mp4',
      fileName: `${title.replace(/[^\w\s-]/g, '').trim() || 'cartoon'}.mp4`,
      caption: `🧸 *${title}*\n\n> © ᑭᖇOᖴESSOᖇ ²⁹ ᗰᗪ🍷🚩`,
    }, { quoted: msg });
    await extra.react('✅');
  },
};
