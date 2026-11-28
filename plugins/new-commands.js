const { cmd } = require('../arslan');

const FOOTER = '\n\n> *Powered by PROFESSOR²⁹ MD*';
const pick = a => a[Math.floor(Math.random() * a.length)];

cmd({ pattern: "dice", alias: ["roll"], react: "🎲", desc: "Roll a dice", category: "fun", use: ".dice", filename: __filename },
async (conn, mek, m, { reply }) => reply(`🎲 You rolled *${1 + Math.floor(Math.random() * 6)}*` + FOOTER));

cmd({ pattern: "flip", alias: ["coin"], react: "🪙", desc: "Flip a coin", category: "fun", use: ".flip", filename: __filename },
async (conn, mek, m, { reply }) => reply(`🪙 *${pick(['Heads', 'Tails'])}*` + FOOTER));

cmd({ pattern: "8ball", react: "🎱", desc: "Ask the magic 8-ball", category: "fun", use: ".8ball <question>", filename: __filename },
async (conn, mek, m, { reply, q }) => {
  if (!q) return reply("❌ Ask a question.\nExample: `.8ball will I win?`");
  const a = ["Yes", "No", "Maybe", "Definitely", "Ask again later", "Very doubtful", "Without a doubt", "Not today"];
  reply(`🎱 *${pick(a)}*` + FOOTER);
});

cmd({ pattern: "choose", alias: ["pick"], react: "🤔", desc: "Pick one option", category: "fun", use: ".choose a | b | c", filename: __filename },
async (conn, mek, m, { reply, q }) => {
  const opts = (q || '').split(/[|,]/).map(s => s.trim()).filter(Boolean);
  if (opts.length < 2) return reply("❌ Give at least 2 options.\nExample: `.choose tea | coffee`");
  reply(`🤔 I choose: *${pick(opts)}*` + FOOTER);
});

cmd({ pattern: "calc", alias: ["calculate"], react: "🧮", desc: "Calculator", category: "tools", use: ".calc 2+2*5", filename: __filename },
async (conn, mek, m, { reply, q }) => {
  const expr = (q || '').replace(/\s+/g, '');
  if (!expr) return reply("❌ Example: `.calc 12*(3+4)`");
  if (!/^[0-9+\-*/().%^]+$/.test(expr) || expr.length > 100) return reply("❌ Only numbers and + - * / % ( ) ^ are allowed.");
  try {
    const r = Function(`"use strict";return (${expr.replace(/\^/g, '**')})`)();
    if (typeof r !== 'number' || !isFinite(r)) return reply("❌ Invalid expression.");
    reply(`🧮 ${q.trim()} = *${r}*` + FOOTER);
  } catch { reply("❌ Invalid expression."); }
});

cmd({ pattern: "password", alias: ["genpass"], react: "🔐", desc: "Generate a strong password", category: "tools", use: ".password [length]", filename: __filename },
async (conn, mek, m, { reply, q }) => {
  const n = Math.min(Math.max(parseInt(q) || 16, 8), 64);
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz23456789!@#$%&*?';
  const bytes = require('crypto').randomBytes(n);
  let out = ''; for (let i = 0; i < n; i++) out += chars[bytes[i] % chars.length];
  reply(`🔐 \`${out}\`` + FOOTER);
});

cmd({ pattern: "joke", react: "😂", desc: "Random joke", category: "fun", use: ".joke", filename: __filename },
async (conn, mek, m, { reply }) => {
  const local = ["Why do programmers prefer dark mode? Because light attracts bugs.", "I told my computer I needed a break. It said no problem and went to sleep.", "Why did the phone wear glasses? It lost its contacts."];
  try {
    const axios = require('axios');
    const { data } = await axios.get('https://v2.jokeapi.dev/joke/Any?blacklistFlags=nsfw,religious,political,racist,sexist,explicit&type=single', { timeout: 8000 });
    return reply(`😂 ${data.joke || pick(local)}` + FOOTER);
  } catch { reply(`😂 ${pick(local)}` + FOOTER); }
});

cmd({ pattern: "fact", react: "🧠", desc: "Random fact", category: "fun", use: ".fact", filename: __filename },
async (conn, mek, m, { reply }) => {
  try {
    const axios = require('axios');
    const { data } = await axios.get('https://uselessfacts.jsph.pl/api/v2/facts/random?language=en', { timeout: 8000 });
    reply(`🧠 ${data.text}` + FOOTER);
  } catch { reply("❌ Couldn't fetch a fact right now, try again." + FOOTER); }
});
