import { WAMessageStubType } from '@whiskeysockets/baileys'
import chalk from 'chalk'
import { watchFile } from 'fs'

const terminalImage = global.opts['img'] ? require('terminal-image') : ''
const urlRegex = (await import('url-regex-safe')).default({ strict: false })

export default async function (m, conn = { user: {} }) {
let _name = await conn.getName(m.sender)
let sender = '+' + m.sender.replace('@s.whatsapp.net', '') + (_name ? ' ~ ' + _name : '')
let chat = await conn.getName(m.chat)
let img
try {
if (global.opts['img'])
img = /sticker|image/gi.test(m.mtype) ? await terminalImage.buffer(await m.download()) : false
} catch (e) {
console.error(e)
}
let filesize = (m.msg ?
m.msg.vcard ?
m.msg.vcard.length :
m.msg.fileLength ?
m.msg.fileLength.low || m.msg.fileLength :
m.msg.axolotlSenderKeyDistributionMessage ?
m.msg.axolotlSenderKeyDistributionMessage.length :
m.text ?
m.text.length :
0
: m.text ? m.text.length : 0) || 0

let user = global.db.data.users[m.sender]
let chatName = chat ? (m.isGroup ? 'Grupo ~ ' + chat : 'Privado ~ ' + chat) : ''
let me = '+' + (conn.user?.jid || '').replace('@s.whatsapp.net', '')
const userName = conn.user.name || conn.user.verifiedName || "Desconocido"
if (m.sender === conn.user?.jid) return
const botRole = global.conn.user.jid === conn.user.jid ? 'PRINCIPAL' : 'SUB-BOT'
const eventType = m.messageStubType ? WAMessageStubType[m.messageStubType] : 'Ninguno'
const messageType = m.mtype ? m.mtype.replace(/message$/i, '').replace('audio', m.msg?.ptt ? 'PTT' : 'audio').replace(/^./, v => v.toUpperCase()) : 'Desconocido'
const dateText = new Date(m.messageTimestamp ? 1000 * (m.messageTimestamp.low || m.messageTimestamp) : Date.now()).toLocaleDateString('es-ES', { timeZone: 'America/Mexico_City', day: 'numeric', month: 'long', year: 'numeric' })
const unitIndex = filesize === 0 ? 0 : Math.floor(Math.log(filesize) / Math.log(1000))
const unitValue = filesize === 0 ? 0 : (filesize / 1000 ** unitIndex).toFixed(1)
const unitLabel = ['B', 'KB', 'MB', 'GB', 'TB'][unitIndex] || 'B'
const printPanel = [
    chalk.hex('#FF2E88').bold('╔═━━━ 〔 MELIODAS TRACE PANEL 〕━━━═╗'),
`${chalk.hex('#FF2E88').bold('║')} ${chalk.hex('#00F5D4').bold('BOT')} ${chalk.hex('#FEE440').bold('=>')} ${chalk.hex('#7BFF00').bold(me)} ${chalk.hex('#FFA62B').bold(userName)} ${chalk.hex('#4CC9F0').bold('[' + botRole + ']')}`,
`${chalk.hex('#FF2E88').bold('║')} ${chalk.hex('#00BBF9').bold('FECHA')} ${chalk.hex('#FEE440').bold('=>')} ${chalk.hex('#E0AAFF').bold(dateText)}`,
`${chalk.hex('#FF2E88').bold('║')} ${chalk.hex('#06D6A0').bold('EVENTO')} ${chalk.hex('#FEE440').bold('=>')} ${chalk.hex('#FF6B6B').bold(eventType)}`,
`${chalk.hex('#FF2E88').bold('║')} ${chalk.hex('#F15BB5').bold('PESO')} ${chalk.hex('#FEE440').bold('=>')} ${chalk.hex('#FFF275').bold(filesize + ' B')} ${chalk.hex('#00D9FF').bold('[' + unitValue + ' ' + unitLabel + ']')}`,
`${chalk.hex('#FF2E88').bold('║')} ${chalk.hex('#5BC0EB').bold('REMITENTE')} ${chalk.hex('#FEE440').bold('=>')} ${chalk.hex('#FF1493').bold(sender)}`,
`${chalk.hex('#FF2E88').bold('║')} ${chalk.hex('#9B5DE5').bold(m.isGroup ? 'CHAT GRUPAL' : 'CHAT PRIVADO')} ${chalk.hex('#FEE440').bold('=>')} ${chalk.hex('#00FF66').bold(chat)}`,
`${chalk.hex('#FF2E88').bold('║')} ${chalk.hex('#FFD166').bold('MENSAJE')} ${chalk.hex('#FEE440').bold('=>')} ${chalk.hex('#7C83FD').bold(messageType)}`,
chalk.hex('#FF2E88').bold('╚═━━━ 〔 LIVE MESSAGE FLOW 〕━━━═╝')
].join('\n')
console.log(printPanel)
if (img) console.log(img.trimEnd())
if (typeof m.text === 'string' && m.text) {
let log = m.text.replace(/\u200e+/g, '')
let mdRegex = /(?<=(?:^|[\s\n])\S?)(?:([*_~`])(?!`)(.+?)\1|```((?:.|[\n\r])+?)```|`([^`]+?)`)(?=\S?(?:[\s\n]|$))/g
let mdFormat = (depth = 4) => (_, type, text, monospace) => {
let types = {
'_': 'italic',
'*': 'bold',
'~': 'strikethrough',
'`': 'bgGray'
}
text = text || monospace
let formatted = !types[type] || depth < 1 ? text : chalk[types[type]](text.replace(/`/g, '').replace(mdRegex, mdFormat(depth - 1)))
return formatted
}
log = log.replace(mdRegex, mdFormat(4))
log = log.split('\n').map(line => {
if (line.trim().startsWith('>')) {
return chalk.bgGray.dim(line.replace(/^>/, '┃'))
} else if (/^([1-9]|[1-9][0-9])\./.test(line.trim())) {
return line.replace(/^(\d+)\./, (match, number) => {
const padding = number.length === 1 ? '  ' : ' '
return padding + number + '.'
})
} else if (/^[-*]\s/.test(line.trim())) {
return line.replace(/^[*-]/, '  •')
}
return line
}).join('\n')
if (log.length < 1024)
log = log.replace(urlRegex, (url, i, text) => {
let end = url.length + i
return i === 0 || end === text.length || (/^\s$/.test(text[end]) && /^\s$/.test(text[i - 1])) ? chalk.blueBright(url) : url
})
log = log.replace(mdRegex, mdFormat(4))
const testi = await m.mentionedJid
if (testi) {
for (let user of testi)
log = log.replace('@' + user.split`@`[0], chalk.blueBright('@' + await conn.getName(user)))
}
console.log(m.error != null ? chalk.red(log) : m.isCommand ? chalk.yellow(log) : log)
}
if (m.messageStubParameters) {
console.log(m.messageStubParameters.map(jid => {
jid = conn.decodeJid(jid)
let name = conn.getName(jid)
return chalk.gray('+' + jid.replace('@s.whatsapp.net', '') + (name ? ' ~' + name : ''))}).join(', '))
}
if (/document/i.test(m.mtype)) console.log(`🝮 ${m.msg.fileName || m.msg.displayName || 'Document'}`)
else if (/ContactsArray/i.test(m.mtype)) console.log(`᯼ ${' ' || ''}`)
else if (/contact/i.test(m.mtype)) console.log(`✎ ${m.msg.displayName || ''}`)
else if (/audio/i.test(m.mtype)) {
const duration = m.msg.seconds
console.log(`${m.msg.ptt ? '☄ (PTT ' : '𝄞 ('}AUDIO) ${Math.floor(duration / 60).toString().padStart(2, 0)}:${(duration % 60).toString().padStart(2, 0)}`)
}
console.log()
}
let file = global.__filename(import.meta.url)
watchFile(file, () => {
console.log(chalk.redBright("Update 'lib/print.js'"))
})

