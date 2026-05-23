export async function before(m, { conn, isAdmin, isBotAdmin, isROwner }) {
if (m.isBaileys && m.fromMe) return !0
if (m.isGroup) return !1
if (!m.message) return !0
if (m.sender === conn.user?.jid) return
const txt = (m.text || '').toUpperCase()
if (txt.includes('PIEDRA') || txt.includes('PAPEL') || txt.includes('TIJERA') || txt.includes('CODE') || txt.includes('QR')) return !0
const bot = global.db.data.settings[conn.user.jid] || {}
if (m.chat === '120363419404216418@newsletter') return !0
if (bot.antiPrivate && !isROwner) {
await conn.updateBlockStatus(m.sender, 'block')
return !0
}
return !1
}
