let handler = m => m;

handler.before = async function (m, { conn, isAdmin, isBotAdmin, isOwner, isROwner }) {
if (!m.isGroup) return !1;
let chat = global.db.data.chats[m.chat];
let bot = global.db.data.settings[conn.user.jid] || {};
    
if (isBotAdmin && chat.antifake && !isAdmin && !isOwner && !isROwner) {
const fkontak = {"key": { "participants": "0@s.whatsapp.net", "remoteJid": "status@broadcast", "fromMe": false, "id": "Halo" }, "message": { "contactMessage": { "vcard": `BEGIN:VCARD\nVERSION:3.0\nN:Sy;Bot;;;\nFN:y\nitem1.TEL;waid=${m.sender.split('@')[0]}:${m.sender.split('@')[0]}\nitem1.X-ABLabel:Ponsel\nEND:VCARD` } }, "participant": "0@s.whatsapp.net" };

const prefijosProhibidos = ['91', '92', '222', '93', '265', '61', '62', '966', '229', '40', '49', '20', '963', '967', '234', '210', '212'];

const senderNumber = m.sender.split('@')[0]; 
if (prefijosProhibidos.some(prefijo => senderNumber.startsWith(prefijo))) {
let texto = `*@${senderNumber}* 𝘌𝘯 𝘦𝘴𝘵𝘦 𝘨𝘳𝘶𝘱𝘰 𝘯𝘰 𝘦𝘴𝘵𝘢́ 𝘱𝘦𝘳𝘮𝘪𝘵𝘪𝘥𝘰 𝘦𝘭 𝘶𝘴𝘰 𝘥𝘦 𝘯𝘶́𝘮𝘦𝘳𝘰𝘴 𝘤𝘰𝘯 𝘱𝘳𝘦𝘧𝘪𝘫𝘰𝘴 𝘱𝘳𝘰𝘩𝘪𝘣𝘪𝘥𝘰𝘴, 𝘴𝘦𝘳𝘢́ 𝘦𝘹𝘱𝘶𝘭𝘴𝘢𝘥𝘰...`;

try {
await conn.reply(m.chat, texto, fkontak, m);
let response = await conn.groupParticipantsUpdate(m.chat, [m.sender], 'remove');
if (response[0].status === "404") return; 
} catch (error) {
console.error(`⚠️ Error al expulsar a ${senderNumber}:`, error);
}}}
return !0;
};

export default handler;
