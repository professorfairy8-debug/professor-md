// ============================================
// 🔌 PORTED COMMANDS COMPAT LOADER — ᑭᖇOᖴESSOᖇ ²⁹ ᗰᗪ🍷🚩
// Bridges "ProBoy-MD style" command files
// (module.exports = { name, execute(sock,msg,args,extra) })
// into this bot's native cmd() system.
//
// Drop new ported-style commands into:
//   plugins/ported-commands/<category>/<file>.js
// They will be auto-discovered and registered on boot.
// This loader file itself must stay directly inside plugins/.
// ============================================

const fs = require('fs');
const path = require('path');
const { cmd } = require('../arslan');
const config = require('../config');
const realDb = require('../lib/database');

const PORTED_DIR = path.join(__dirname, 'ported-commands');

// ---- best-effort in-memory DB shim (per boot, not persistent) ----
const memStore = new Map();
const dbShim = {
    get(key) { return memStore.get(key); },
    set(key, val) { memStore.set(key, val); return true; },
    has(key) { return memStore.has(key); },
    delete(key) { return memStore.delete(key); },
    // getGlobalSetting/setGlobalSetting were called by ~15 ported plugins
    // (.button, .autoreact, .autostatus, .ban/.unban, .setsudo/.removesudo,
    // .gccmd, .publish, first-message greeting, .autoreply) but this shim
    // never had them at all — every one of those commands has been
    // throwing "database.getGlobalSetting is not a function" since day
    // one. Wired through to the real, MongoDB-backed, persistent
    // implementation in lib/database.js instead of adding another
    // non-persistent stub — these are exactly the kind of settings
    // (ban lists, sudo lists, on/off toggles) that need to survive a
    // dyno restart, so the in-memory-only memStore above was never the
    // right place for them even before the crash.
    getGlobalSetting: realDb.getGlobalSetting,
    setGlobalSetting: realDb.setGlobalSetting,
};

// ---- adapt this bot's UPPER_SNAKE config to ProBoy's lowerCamel shape ----
// The real config values stay available too (extra.config.BOT_NAME etc.),
// because many ported commands read those UPPER_SNAKE keys directly.
const ownerList = () => [].concat(config.OWNER_NUMBER || []).map(n => String(n).replace(/[^0-9]/g, '')).filter(Boolean);
const adaptedConfig = new Proxy({
    get prefix() { return config.PREFIX; },
    get botName() { return config.BOT_NAME; },
    get ownerName() { return config.OWNER_NAME; },
    get ownerNumber() { return ownerList(); },
    get sudoNumbers() {
        const dyn = realDb.getGlobalSetting && realDb.getGlobalSetting('sudoUsers');
        return ownerList().concat(Array.isArray(dyn) ? dyn.map(x => String(x).split('@')[0]) : []);
    },
    sudoJids: [],
    get newsletterJid() { return config.CHANNEL_JID; },
    get version() { return config.version || require('../package.json').version; },
    get packname() { return config.packname || config.BOT_NAME; },
    get maxWarnings() { return config.maxWarnings || 3; },
    cidJsonUrl: '',
    updateZipUrl: '',
    statusSettings: {},
    antideleteSettings: {},
    get social() {
        return {
            channel: config.CHANNEL_LINK,
            whatsappChannel: config.CHANNEL_LINK,
            website: config.CHANNEL_LINK,
        };
    },
    messages: {},
}, {
    get(target, prop) {
        if (prop in target) return target[prop];
        return config[prop];
    }
});

function normalizeJid(jid) {
    if (!jid) return jid;
    return jid.split(':')[0];
}

function buildComparableIds(jid) {
    const norm = normalizeJid(jid);
    return [jid, norm, (norm || '').split('@')[0]];
}

function getMessageContent(mek) {
    const msg = mek?.message;
    if (!msg) return '';
    return msg.conversation
        || msg.extendedTextMessage?.text
        || msg.imageMessage?.caption
        || msg.videoMessage?.caption
        || '';
}

// Quoted message in the shape ported commands expect:
//   quoted.type / quoted.download()  AND  quoted.imageMessage / quoted.documentMessage
function buildQuoted(m) {
    const q = m && m.quoted;
    if (!q) return null;
    return q; // lib/msg.js already provides type, download(), text, sender and raw keys
}

function buildExtra(conn, mek, m, ctx) {
    const reply = ctx.reply;
    return {
        from: ctx.from,
        sender: ctx.sender,
        isGroup: ctx.isGroup,
        groupMetadata: ctx.groupMetadata || { participants: [] },
        participants: ctx.participants || [],
        isOwner: ctx.isOwner,
        isSudo: ctx.isOwner,
        isAdmin: ctx.isAdmins,
        isAdmins: ctx.isAdmins,
        isBotAdmin: ctx.isBotAdmins,
        isBotAdmins: ctx.isBotAdmins,
        isMod: ctx.isOwner,
        args: ctx.args || [],
        q: ctx.q || '',
        text: ctx.q || '',
        body: ctx.body || '',
        command: ctx.command,
        prefix: ctx.prefix || config.PREFIX,
        pushname: ctx.pushname,
        quoted: buildQuoted(m),
        mentions: (m && m.mentionedJid) || [],
        mentionedJid: (m && m.mentionedJid) || [],
        config: adaptedConfig,
        commands: require('../arslan').commands,
        database: dbShim,
        utils: {
            getMessageContent,
            normalizeJidWithLid: normalizeJid,
            normalizeJid,
            buildComparableIds,
        },
        reply: (t) => reply(t),
        react: (emoji) => conn.sendMessage(ctx.from, { react: { text: emoji, key: mek.key } }).catch(() => {}),
    };
}

// Registers one ported command file. Returns true if it was a valid command.
// Re-registering the same file first removes its old entries (hot reload).
function registerPortedFile(filePath, category) {
    unregisterPortedFile(filePath);
        delete require.cache[require.resolve(filePath)];
        const mod = require(filePath);
        if (!mod || !mod.name || typeof mod.execute !== 'function') {
            return false; // not a valid ported command file, skip quietly
        }

        cmd({
            pattern: mod.name,
            alias: mod.aliases || [],
            desc: mod.description || '',
            category: mod.category || category,
            filename: filePath,
        }, async (conn, mek, m, ctx) => {
            // Permission guards (best-effort translation)
            if (mod.ownerOnly && !ctx.isOwner) {
                return ctx.reply('❌ This command is for the owner only.');
            }
            if (mod.groupOnly && !ctx.isGroup) {
                return ctx.reply('❌ This command works in groups only.');
            }
            if (mod.privateOnly && ctx.isGroup) {
                return ctx.reply('❌ This command works in private chat only.');
            }
            if (mod.adminOnly && ctx.isGroup && !ctx.isAdmins && !ctx.isOwner) {
                return ctx.reply('❌ This command is for group admins only.');
            }
            if (mod.modOnly && !ctx.isOwner) {
                return ctx.reply('❌ This command is for mods/owner only.');
            }

            const extra = buildExtra(conn, mek, m, ctx);

            try {
                await mod.execute(conn, mek, ctx.args || [], extra);
            } catch (err) {
                console.error(`[Ported:${mod.name}] error:`, err.message);
                await ctx.reply(`❌ ${mod.name} error: ${err.message}`);
            }
        });

        // Auto-hooks: modules that export handleMessage (antispam, antibadword,
        // antibot, autoreply, firstmessage, gccmd) were never being called, so
        // their on/off commands changed a setting that nothing enforced.
        // quiz / numgame / giveaway use `onMessage` instead — same signature,
        // was never called before, so their answers were never checked.
        const hookFn = typeof mod.handleMessage === 'function' ? mod.handleMessage
            : (typeof mod.onMessage === 'function' ? mod.onMessage : null);
        if (hookFn) {
            cmd({
                pattern: `${mod.name}_autohook`,
                on: 'body',
                dontAddCommandList: true,
                filename: filePath,
            }, async (conn, mek, m, ctx) => {
                try {
                    await hookFn.call(mod, conn, mek, buildExtra(conn, mek, m, ctx));
                } catch (err) {
                    console.error(`[Ported:${mod.name}:hook] error:`, err.message);
                }
            });
        }

        return true;
}

// Removes every command/hook that came from this file (used by .uninstall / hot reload)
function unregisterPortedFile(filePath) {
    const list = require('../arslan').commands;
    for (let i = list.length - 1; i >= 0; i--) {
        if (list[i] && list[i].filename === filePath) list.splice(i, 1);
    }
}

function loadPortedCommands() {
    if (!fs.existsSync(PORTED_DIR)) return;

    const categories = fs.readdirSync(PORTED_DIR).filter(f =>
        fs.statSync(path.join(PORTED_DIR, f)).isDirectory()
    );

    let loaded = 0, failed = 0;

    for (const category of categories) {
        const catDir = path.join(PORTED_DIR, category);
        const files = fs.readdirSync(catDir).filter(f => f.endsWith('.js'));

        for (const file of files) {
            const filePath = path.join(catDir, file);
            try {
                if (registerPortedFile(filePath, category)) loaded++;
            } catch (e) {
                failed++;
                console.error(`[PortedLoader] Failed to load ${category}/${file}: ${e.message}`);
            }
        }
    }

    console.log(`[PortedLoader] ✅ Loaded ${loaded} ported commands (${failed} failed) from plugins/ported-commands/`);
}

loadPortedCommands();

module.exports = { loadPortedCommands, registerPortedFile, unregisterPortedFile };
