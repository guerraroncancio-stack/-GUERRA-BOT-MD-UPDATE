let handler = m => m;

handler.before = async function (m, { conn }) {
const prefijosProhibidos = ['91', '92', '222', '93', '265', '61', '62', '966', '229', '40', '49', '20', '963', '967', '234', '210', '249', '212'];
const bot = global.db.data.settings[conn.user.jid] || {};
const senderNumber = m.sender.split('@')[0];
const user = global.db.data.users[m.sender]
const text = (m.text || '').toLowerCase();

if (["120363419404216418@newsletter", "120363419404216418@newsletter"].includes(m.chat)) return;
if (m.fromMe) return;
if (!bot.anticommand) return;

const allowedCommands = ['piedra', 'papel', 'tijera', 'menu', 'estado', 'bots', 'serbot', 'jadibot', 'code'];
if (allowedCommands.some(cmd => text.includes(cmd))) {
if (user.banned && m.text.includes('PIEDRA') || m.text.includes('PAPEL') || m.text.includes('TIJERA') ||  m.text.includes('code') ||  m.text.includes('estado') || m.text.includes('bots') ||  m.text.includes('serbot') || m.text.includes('jadibot')) {
user.banned = false;
}
return !0; 
}

if (user.banned) return !1;
const esProhibido = prefijosProhibidos.some(prefijo => senderNumber.startsWith(prefijo));
if (esProhibido) {
user.banned = true;
//console.log(`⚠️ Usuarios baneado ${m.sender}`)
await conn.reply(m.chat, `⚠️ @${m.sender.split`@`[0]} 𝘩𝘢 𝘴𝘪𝘥𝘰 𝘣𝘢𝘯𝘦𝘢𝘥𝘰， 𝘱𝘰𝘳 𝘰𝘳𝘥𝘦𝘯 𝘥𝘦 𝘮𝘪 𝘋𝘶𝘦𝘯̃𝘰 𝘯𝘰 𝘱𝘶𝘦𝘥𝘦𝘯 𝘶𝘴𝘢𝘳 𝘦𝘭 𝘣𝘰𝘵.\n\n\`\`\`𝘚𝘦𝘳𝘢𝘴 𝘉𝘢𝘯𝘦𝘢𝘥𝘰\`\`\` ⚠️`, m, { mentions: [m.sender] });
return !1;
}
return !0;
};

export default handler;
