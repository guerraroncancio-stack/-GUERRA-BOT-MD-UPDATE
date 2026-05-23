const linkRegex = /(chat\.whatsapp\.com\/[0-9A-Za-z]{20,24})|(z?https:\/\/whatsapp\.com\/channel\/[0-9A-Za-z]{20,24})/i
const allowedLinks = ['https://whatsapp.com/channel/0029Vb64nWqLo4hb8cuxe23n']

export async function before(m, { conn, isAdmin, isBotAdmin, isROwner, participants }) {
if (!m.isGroup) return
if (!m || !m.text) return
const chat = global?.db?.data?.chats[m.chat]
const isGroupLink = linkRegex.test(m.text)
const isChannelLink = /whatsapp\.com\/channel\//i.test(m.text)
const hasAllowedLink = allowedLinks.some(link => m.text.includes(link))
if (hasAllowedLink) return
if ((isGroupLink || isChannelLink) && !isAdmin) {
if (isBotAdmin) {
const linkThisGroup = `https://chat.whatsapp.com/${await conn.groupInviteCode(m.chat)}`
if (isGroupLink && m.text.includes(linkThisGroup)) return !0
}
if (chat.antiLink && (isGroupLink || isChannelLink) && !isAdmin && !isROwner && isBotAdmin && m.key.participant !== conn.user.jid) {
const userName = global.db.data.users[m.key.participant].name || '𝗨𝘀𝘂𝗮𝗿𝗶𝗼'
const tipoEnlace = isChannelLink ? '𝗰𝗮𝗻𝗮𝗹 𝗱𝗲 𝗪𝗵𝗮𝘁𝘀𝗔𝗽𝗽' : '𝗴𝗿𝘂𝗽𝗼 𝗲𝘅𝘁𝗲𝗿𝗻𝗼'
await conn.sendMessage(m.chat, { delete: { remoteJid: m.chat, fromMe: false, id: m.key.id, participant: m.key.participant }})
await conn.reply(m.chat, `🚫 *𝗔𝗻𝘁𝗶-𝗟𝗶𝗻𝗸*  @${m.key.participant.split('@')[0]} 𝗳𝘂𝗲 𝗲𝘅𝗽𝘂𝗹𝘀𝗮𝗱𝗼 𝗽𝗼𝗿 𝗲𝗻𝘃𝗶𝗮𝗿 𝘂𝗻 𝗲𝗻𝗹𝗮𝗰𝗲 𝗱𝗲 ${tipoEnlace}.`, null, { ...rcanal, mentions: [m.key.participant] })
await conn.groupParticipantsUpdate(m.chat, [m.key.participant], 'remove')
}}}
