/**
 * Song Downloader - .song / .play / .music / .yta
 * Uses plugins/utils/ytdl.js (many providers + ytdl-core fallback).
 */
const yts = require('yt-search');
const { downloadYoutube } = require('../../utils/ytdl');
const { toAudio } = require('../../utils/converter');

module.exports = {
  name: 'song',
  aliases: ['play', 'music', 'yta'],
  category: 'media',
  description: 'Download audio from YouTube',
  usage: '.song <song name or YouTube link>',

  async execute(sock, msg, args) {
    const chatId = msg.key.remoteJid;
    try {
      const text = args.join(' ').trim();
      if (!text) {
        return await sock.sendMessage(chatId, { text: 'Usage: .play <song name or YouTube link>' }, { quoted: msg });
      }

      let videoUrl = '';
      let title = '';
      let thumbnail = '';

      if (/youtube\.com|youtu\.be/i.test(text)) {
        videoUrl = text;
      } else {
        const search = await yts(text);
        if (!search || !search.videos || !search.videos.length) {
          return await sock.sendMessage(chatId, { text: '❌ No results found.' }, { quoted: msg });
        }
        const v = search.videos[0];
        videoUrl = v.url; title = v.title; thumbnail = v.thumbnail;
        if (v.seconds && v.seconds > 1200) {
          return await sock.sendMessage(chatId, { text: '❌ Ye gana bohat lamba ha (20 min se zyada). Koi chota choose karein.' }, { quoted: msg });
        }
      }

      if (thumbnail) {
        await sock.sendMessage(chatId, { image: { url: thumbnail }, caption: `🎵 *${title}*\n⏳ Downloading...` }, { quoted: msg }).catch(() => {});
      } else {
        await sock.sendMessage(chatId, { text: `⏳ Downloading *${title || 'your song'}*...` }, { quoted: msg });
      }

      const res = await downloadYoutube(videoUrl, 'audio');
      const finalTitle = res.title || title || 'song';

      let audioBuffer = res.buffer;
      try {
        const mp3 = await toAudio(res.buffer, 'mp4');
        if (mp3 && mp3.length > 0) audioBuffer = mp3;
      } catch (e) {
        console.error('[song] ffmpeg convert failed, sending original:', e.message);
      }

      await sock.sendMessage(chatId, {
        audio: audioBuffer,
        mimetype: 'audio/mpeg',
        fileName: `${finalTitle.replace(/[^\w\s-]/g, '').trim() || 'song'}.mp3`,
        ptt: false,
      }, { quoted: msg });
    } catch (err) {
      console.error('Song command error:', err.message);
      await sock.sendMessage(chatId, { text: `❌ Song download nahi ho saka: ${err.message}` }, { quoted: msg });
    }
  },
};
