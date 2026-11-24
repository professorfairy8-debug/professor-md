/**
 * Tiny text formatting helpers used by several commands.
 */
function box(title, body, footer) {
    const lines = [
        `╭━━━《 ${title} 》━━━┈⊷`,
        ...String(body ?? '').split('\n').map(l => `┃ ${l}`),
        '╰━━━━━━━━━━━━┈⊷'
    ];
    if (footer) lines.push(footer);
    return lines.join('\n');
}

function headerLine(title) {
    return `╭━━━〔 *${title}* 〕━━━┈⊷`;
}

function footerLine() {
    return '╰━━━━━━━━━━━━━━━┈⊷';
}

module.exports = { box, headerLine, footerLine };
