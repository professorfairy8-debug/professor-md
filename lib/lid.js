// LID/PN helpers for plugins (Baileys v7 groups may use 123@lid ids)
function bare(j) { return String(j || '').split('@')[0].split(':')[0].replace(/\D/g, ''); }
function idsOf(p) { return [p?.id, p?.lid, p?.phoneNumber, p?.jid].map(bare).filter(Boolean); }
function botIds(sock) {
    return new Set([sock?.user?.id, sock?.user?.lid, sock?.authState?.creds?.me?.id, sock?.authState?.creds?.me?.lid].map(bare).filter(Boolean));
}
function isBotParticipant(sock, p) { const b = botIds(sock); return idsOf(p).some(x => b.has(x)); }
function isAdminP(p) { return p?.admin === 'admin' || p?.admin === 'superadmin'; }
function isBotAdmin(sock, participants) { return (participants || []).some(p => isAdminP(p) && isBotParticipant(sock, p)); }
function findParticipant(participants, jid) { const b = bare(jid); return (participants || []).find(p => idsOf(p).includes(b)) || null; }
module.exports = { bare, idsOf, botIds, isBotParticipant, isAdminP, isBotAdmin, findParticipant };
