/**
 * Video Downloader - .video / .ytmp4 / .ytvideo
 * Uses plugins/utils/ytdl.js (many providers + ytdl-core fallback).
 */
const yts = require('yt-search');
const { downloadYoutube } = require('../../utils/ytdl');

module.exports = {
  name: 'video',
  aliases: ['ytmp4', 'ytvideo'],
  category: 'media',
  description: 'Download video from YouTube',
  usage: '.video <name or link>',

  async execute(sock, msg, args) {
    const chatId = msg.key.remoteJid;
    try {
      const query = args.join(' ').trim();
      if (!query) {
        return await sock.sendMessage(chatId, { text: 'Usage: .video <name or link>' }, { quoted: msg });
      }

      let videoUrl = '';
      let title = '';

      if (/youtube\.com|youtu\.be/i.test(query)) {
        videoUrl = query;
      } else {
        const { videos } = await yts(query);
        if (!videos || videos.length === 0) {
          return await sock.sendMessage(chatId, { text: '❌ No videos found!' }, { quoted: msg });
        }
        const v = videos[0];
        videoUrl = v.url; title = v.title;
        if (v.seconds && v.seconds > 900) {
          return await sock.sendMessage(chatId, { text: '❌ Video 15 min se lambi ha, WhatsApp ma nahi jayegi. Koi chhoti choose karein.' }, { quoted: msg });
        }
      }

      await sock.sendMessage(chatId, { text: `⏳ Downloading video${title ? ': *' + title + '*' : ''}...` }, { quoted: msg });

      const res = await downloadYoutube(videoUrl, 'video');
      const finalTitle = res.title || title || 'video';

      await sock.sendMessage(chatId, {
        video: res.buffer,
        mimetype: 'video/mp4',
        fileName: `${finalTitle.replace(/[^\w\s-]/g, '').trim() || 'video'}.mp4`,
        caption: `*${finalTitle}*\n\n> © ᑭᖇOᖴESSOᖇ ²⁹ ᗰᗪ🍷🚩`,
      }, { quoted: msg });
    } catch (error) {
      console.error('Video command error:', error.message);
      await sock.sendMessage(chatId, { text: `❌ Video download nahi ho saki: ${error.message}` }, { quoted: msg });
    }
  },
};
