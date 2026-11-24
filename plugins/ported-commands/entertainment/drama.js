/**
 * .drama <name>  — find drama episodes (Pakistani / Indian / Turkish / Korean dubbed...)
 * Searches YouTube (official channels upload full episodes) and lists the
 * best matches with title, channel, duration and link.
 * Tip shown to user: send the link with .video to download short clips.
 */
const yts = require('yt-search');

function fmt(seconds) {
  const s = Number(seconds) || 0;
  const h = Math.floor(s / 3600), m = Math.floor((s % 3600) / 60), sec = s % 60;
  return h ? `${h}h ${m}m` : `${m}m ${String(sec).padStart(2, '0')}s`;
}

module.exports = {
  name: 'drama',
  aliases: ['dramas', 'dramasearch', 'episode'],
  category: 'entertainment',
  description: 'Search drama episodes (e.g. .drama Mere Humsafar episode 5)',
  usage: '.drama <drama name> [episode no]',

  async execute(sock, msg, args, extra) {
    const query = args.join(' ').trim();
    if (!query) {
      return extra.reply('🎭 *DRAMA SEARCH*\n\nUsage: *.drama <naam> [episode]*\nExample:\n• .drama Mere Humsafar episode 5\n• .drama Kurulus Osman urdu\n• .drama Ehd e Wafa ost');
    }

    await extra.react('🔎');
    const hasWord = /episode|ep\b|ep\d|last|ost|full|promo|urdu|hindi|dubbed|season/i.test(query);
    const search = await yts(hasWord ? `${query} drama` : `${query} drama full episode`);
    const videos = (search.videos || []).filter(v => v.seconds >= 60).slice(0, 8);

    if (!videos.length) {
      await extra.react('❌');
      return extra.reply('❌ Koi drama nahi mila. Spelling check kr ka dobara try karein.');
    }

    let text = `🎭 *DRAMA RESULTS*\n🔎 _${query}_\n━━━━━━━━━━━━━━━━━━\n\n`;
    videos.forEach((v, i) => {
      text += `*${i + 1}. ${v.title}*\n📺 ${v.author?.name || 'Unknown'}  •  ⏱️ ${fmt(v.seconds)}\n🔗 ${v.url}\n\n`;
    });
    text += `━━━━━━━━━━━━━━━━━━\n▶️ Watch: link YouTube ma kholein.\n📥 Chhoti clip (15 min tak) download: *.video <link>*\n🎵 OST/audio: *.play <naam>*`;

    await extra.reply(text);
    await extra.react('✅');
  },
};
