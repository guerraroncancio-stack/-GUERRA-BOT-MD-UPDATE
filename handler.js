import { smsg } from './lib/simple.js'
import { format } from 'util' 
import { fileURLToPath } from 'url'
import path, { join } from 'path'
import { unwatchFile, watchFile } from 'fs'
import chalk from 'chalk'
import fetch from 'node-fetch'
import ws from 'ws';

/**
 * @type {import('@whiskeysockets/baileys')}
 */
const { proto } = (await import('@whiskeysockets/baileys')).default
const isNumber = x => typeof x === 'number' && !isNaN(x)
const delay = ms => isNumber(ms) && new Promise(resolve => setTimeout(function () {
clearTimeout(this)
resolve()
}, ms))
 
/**
 * Handle messages upsert
 * @param {import('@whiskeysockets/baileys').BaileysEventMap<unknown>['messages.upsert']} groupsUpdate 
 */
export async function handler(chatUpdate) {
this.msgqueque = this.msgqueque || [];
this.uptime = this.uptime || Date.now();
if (!chatUpdate) return
this.pushMessage(chatUpdate.messages).catch(console.error)
let m = chatUpdate.messages[chatUpdate.messages.length - 1]
if (!m) return
if (global.db.data == null)
await global.loadDatabase()
try {
m = smsg(this, m) || m
if (!m) return
m.exp = 0
m.limit = false
m.money = false        
try {
let user = global.db.data.users[m.sender]
if (typeof user !== 'object')
global.db.data.users[m.sender] = {}
if (user) {
if (!isNumber(user.exp)) user.exp = 0;
if (user.exp < 0) user.exp = 0; 
if (!isNumber(user.money)) user.money = 10;
if (user.money < 0) user.money = 0; 
if (!isNumber(user.limit)) user.limit = 8;
if (user.limit < 0) user.limit = 0; 
if (!('premium' in user)) user.premium = false;
if (!('registered' in user)) user.registered = false;
if (!user.registered) {
if (!('name' in user)) user.name = m.name;
if (!isNumber(user.age)) user.age = -1;
if (!isNumber(user.premiumDate)) user.premiumDate = -1;
if (!isNumber(user.regTime)) user.regTime = -1;
}
if (!isNumber(user.afk)) user.afk = -1;
if (!('autolevelup' in user)) user.autolevelup = true;
if (!('role' in user)) user.role = 'Novato';        
if (!isNumber(user.level)) user.level = 0;
if (!isNumber(user.antispam)) user.antispam = 0;
if (!isNumber(user.banco)) user.banco = 0        
if (!user.premium) user.premium = false;
if (!user.warnPv) user.warnPv = false
if (!user.premium) user.premiumTime = 0;
if (!user.marry) user.marry = 0;
if (!user.wait) user.wait = 0;
if (!user.lastmiming) user.lastmiming = 0;
if (!user.lastwork) user.lastwork = 0;
if (!user.lastcofre) user.lastcofre = 0;
if (!user.lastclaim) user.lastclaim = 0;
if (!user.messageSpam) user.messageSpam = 0;
if (!user.crime) user.crime = 0;
if (!user.lastrob) user.lastrob = 0;
if (!user.packname) user.packname = null
if (!user.author) user.author = null
if (!user.timeRy) user.timeRy = 0;
if (!user.timevot) user.timevot = 0;
if (!user.mensaje) user.mensaje = 0;
if (!user.rtrofi) user.rtrofi = 'Bronce';
} else
global.db.data.users[m.sender] = {
exp: 0,
money: 10,
limit: 8,
registered: false,     
premium: false,
regTime: -1,        
premiumTime: 0,     
role: 'Novato',     
autolevelup: true,       
banned: false,
afk: -1,
afkReason: '',
lastwork: 0,
messageSpam: 0,
lastclaim: 0,
level: 0,
wait: 0,
age: -1,             
marry: 0,
bank: 0,
BannedReason: '',
Banneduser: false,          
warnPv: false,
packname: null,
author: null,
banco: 0,
timeRy: 0,               
lastmiming: 0,
lastcofre: 0,
crime: 0,
lastrob: 0,
timevot: 0,
rtrofi: 'bronce',          
mensaje: 0,
}
let chat = global.db.data.chats[m.chat]
if (typeof chat !== 'object')
global.db.data.chats[m.chat] = {}
if (chat) {
if (!('sAutorespond' in chat)) chat.sAutorespond = '' 
if (!('isBanned' in chat)) chat.isBanned = false       
if (!('welcome' in chat)) chat.welcome = true        
if (!('detect' in chat)) chat.detect = true             
if (!('sWelcome' in chat)) chat.sWelcome = ''        
if (!('sBye' in chat)) chat.sBye = ''                    
if (!('sPromote' in chat)) chat.sPromote = ''         
if (!('sDemote' in chat)) chat.sDemote = '' 
if (!('delete' in chat)) chat.delete = false            
if (!('modohorny' in chat)) chat.modohorny = true   
if (!('stickers' in chat)) chat.stickers = false         
if (!('autosticker' in chat)) chat.autosticker = false   
if (!('audios' in chat)) chat.audios = false           
if (!('antiLink' in chat)) chat.antiLink = false     
if (!('antiLink2' in chat)) chat.antiLink2 = false
if (!('antiTiktok' in chat)) chat.antiTiktok = false
if (!('antiYoutube' in chat)) chat.antiYoutube = false
if (!('antiTelegram' in chat)) chat.antiTelegram = false
if (!('antiFacebook' in chat)) chat.antiFacebook = false
if (!('antiInstagram' in chat)) chat.antiInstagram = false
if (!('antiTwitter' in chat)) chat.antiTwitter = false
if (!('antiDiscord' in chat)) chat.antiDiscord = false
if (!('antiThreads' in chat)) chat.antiThreads = false
if (!('antiTwitch' in chat)) chat.antiTwitch = false
if (!('antifake' in chat)) chat.antifake = false
if (!('reaction' in chat)) chat.reaction = true       
if (!('modoadmin' in chat)) chat.modoadmin = false 
if (!('game' in chat)) chat.game = true
if (!('game2' in chat)) chat.game2 = false
if (!('simi' in chat)) chat.simi = false
if (!('antiTraba' in chat)) chat.antiTraba = true 
if (!('primaryBot' in chat)) chat.primaryBot = null
if (!('autorespond' in chat)) chat.autorespond = true 
if (!('autolevelup' in chat))  chat.autolevelup = true
if (!isNumber(chat.expired)) chat.expired = 0
if (!('horarioNsfw' in chat)) { 
chat.horarioNsfw = {
inicio: "00:00", 
fin: "23:59"
};
}
} else
global.db.data.chats[m.chat] = {
isBanned: false,
welcome: true,
detect: true,
sWelcome: '',
sBye: '',
sPromote: '',
sDemote: '', 
sAutorespond: '', 
delete: false,
modohorny: true,
stickers: false,
autosticker: false,
audios: false,
antiLink: false,
antiLink2: false,
antiTiktok: false,
antiYoutube: false,
antiTelegram: false,
antiFacebook: false,
antiInstagram: false,
antiTwitter: false,
antiDiscord: false,
antiThreads: false,
antiTwitch: false,
antifake: false,
reaction: true,
modoadmin: false,
antitoxic: false,
game: true, 
game2: false, 
simi: false,
primaryBot: null,
antiTraba: true,
autorespond: true, 
autolevelup: true,
expired: 0,
horarioNsfw: {
inicio: "00:00", 
fin: "23:59"
}
}
var settings = global.db.data.settings[this.user.jid]
if (typeof settings !== 'object') global.db.data.settings[this.user.jid] = {}
if (settings) {
if (!('self' in settings)) settings.self = false
if (!('autoread' in settings)) settings.autoread = false
if (!('autoread2' in settings)) settings.autoread2 = false
if (!('restrict' in settings)) settings.restrict = true
if (!('temporal' in settings)) settings.temporal = false
if (!('antiPrivate' in settings)) settings.antiPrivate = false
if (!('antiCall' in settings)) settings.antiCall = true
if (!('antiSpam' in settings)) settings.antiSpam = true 
if (!('modoia' in settings)) settings.modoia = false
if (!('anticommand' in settings)) settings.anticommand = false	
if (!('jadibotmd' in settings)) settings.jadibotmd = true
if (!('prefix' in settings)) settings.prefix = opts['prefix'] || '*/i!#$%+£¢€¥^°=¶∆×÷π√✓©®&.\\-.@';
if (!('status' in settings)) settings.status = 0
} else global.db.data.settings[this.user.jid] = {
self: false,
autoread: false,
autoread2: false,
restrict: true,
temporal: false,
antiPrivate: false,
antiCall: true,
antiSpam: true,
modoia: false, 
anticommand: false, 	
jadibotmd: true,
prefix: opts['prefix'] || '*/i!#$%+£¢€¥^°=¶∆×÷π√✓©®&.\\-.@',
status: 0
}} catch (e) {
console.error(e)
}

var settings = global.db.data.settings[this.user.jid]
const prefix = new RegExp('^[' + settings.prefix.replace(/[|\\{}()[\]^$+*.\-\^]/g, '\\$&') + ']');        
const isROwner = [conn.decodeJid(global.conn.user.id), ...global.owner.map(([number]) => number)].map(v => v.replace(/[^0-9]/g, '') + '@s.whatsapp.net').includes(m.sender)
const isOwner = isROwner || m.fromMe
const isMods = isOwner || global.mods.map(v => v.replace(/[^0-9]/g, '') + '@s.whatsapp.net').includes(m.sender)
//const isPrems = isROwner || global.prems.map(v => v.replace(/[^0-9]/g, '') + '@s.whatsapp.net').includes(m.sender)
const isPrems = isROwner || global.db.data.users[m.sender].premiumTime > 0

if (opts['queque'] && m.text && !(isMods || isPrems)) {
let queque = this.msgqueque, time = 1000 * 5
const previousID = queque[queque.length - 1]
queque.push(m.id || m.key.id)
setInterval(async function () {
if (queque.indexOf(previousID) === -1) clearInterval(this)
await delay(time)
}, time)
}

//if(m.id.startsWith('NJX-') || m.id.startsWith('BAE5') && m.id.length === 16 || m.id.startsWith('3EB0') && m.id.length === 12 || m.id.startsWith('3EB0') && (m.id.length === 20 || m.id.length === 22) || m.id.startsWith('B24E') && m.id.length === 20 || m.id.startsWith('FizzxyTheGreat-')) return
if(m.id.startsWith('NJX-') || m.id.startsWith('Lyru-') || m.id.startsWith('BAE5') && m.id.length === 16 || m.id.startsWith('3EB0') && m.id.length === 12 || m.id.startsWith('3EB0') && (m.id.length === 20 || m.id.length === 22) || m.id.startsWith('B24E') && m.id.length === 20 || m.id.startsWith('FizzxyTheGreat-')) return
if (opts['nyimak']) return
if (!isROwner && opts['self']) return 
if (opts['pconly'] && m.chat.endsWith('g.us')) return
if (opts['gconly'] && !m.chat.endsWith('g.us')) return
if (opts['swonly'] && m.chat !== 'status@broadcast') return
if (typeof m.text !== 'string')
m.text = ''

//if (m.isBaileys) return 	    
let _user = global.db.data && global.db.data.users && global.db.data.users[m.sender]	    
//m.exp += Math.ceil(Math.random() * 10)
let usedPrefix      
const groupMetadata = (m.isGroup ? ((conn.chats[m.chat] || {}).metadata || await this.groupMetadata(m.chat).catch(_ => null)) : {}) || {}
const participants = (m.isGroup ? groupMetadata.participants : []) || []
const user = (m.isGroup ? participants.find(u => conn.decodeJid(u.id) === m.sender) : {}) || {} // User Data
const bot = (m.isGroup ? participants.find(u => conn.decodeJid(u.id) == this.user.jid) : {}) || {} // Your Data
const isRAdmin = user?.admin == 'superadmin' || false
const isAdmin = isRAdmin || user?.admin == 'admin' || false // Is User Admin?
const isBotAdmin = bot?.admin || false // Are you Admin?
m.isWABusiness = global.conn.authState?.creds?.platform === 'smba' || global.conn.authState?.creds?.platform === 'smbi'
//m.isChannel = m.chat.includes('@newsletter') || m.sender.includes('@newsletter')

const ___dirname = path.join(path.dirname(fileURLToPath(import.meta.url)), './plugins')
for (let name in global.plugins) {
let plugin = global.plugins[name]
if (!plugin) continue
if (plugin.disabled) continue
const __filename = join(___dirname, name)
if (typeof plugin.all === 'function') {
try {
await plugin.all.call(this, m, { chatUpdate, __dirname: ___dirname, __filename })
} catch (e) {
// if (typeof e === 'string') continue
console.error(e)
/*for (let [jid] of global.owner.filter(([number, _, isDeveloper]) => isDeveloper && number)) {
let data = (await conn.onWhatsApp(jid))[0] || {}
if (data.exists)
m.reply(`*Plugin:* ${name}\n*Sender:* ${m.sender}\n*Chat:* ${m.chat}\n*Command:* ${m.text}\n\n${format(e)}.trim(), data.jid)
}*/
}}
if (!opts['restrict'])
if (plugin.tags && plugin.tags.includes('admin')) {
//global.dfail('restrict', m, this)
continue
}
const str2Regex = str => str.replace(/[|\\{}()[\]^$+*?.]/g, '\\$&');
            let _prefix = plugin.customPrefix ? plugin.customPrefix : this.prefix ? this.prefix : prefix; // Usamos prefix local
            let match = (_prefix instanceof RegExp ?
                [[_prefix.exec(m.text), _prefix]] :
                Array.isArray(_prefix) ?
                _prefix.map(p => {
                    let re = p instanceof RegExp ? p : new RegExp(str2Regex(p));
                    return [re.exec(m.text), re];
                }) :
                typeof _prefix === 'string' ?
                [[new RegExp(str2Regex(_prefix)).exec(m.text), new RegExp(str2Regex(_prefix))]] :
                [[[], new RegExp]]
            ).find(p => p[1]);
            if (typeof plugin.before === 'function') {
                if (await plugin.before.call(this, m, {
                    match,
                    conn: this,
                    participants,
                    groupMetadata,
                    user,
                    bot,
                    isROwner,
                    isOwner,
                    isRAdmin,
                    isAdmin,
                    isBotAdmin,
                    isPrems,
                    chatUpdate,
                    __dirname: ___dirname,
                    __filename
                })) continue;
            }
            if (typeof plugin !== 'function') continue;
            if ((usedPrefix = (match[0] || '')[0])) {
                let noPrefix = m.text.replace(usedPrefix, '');
                let [command, ...args] = noPrefix.trim().split` `.filter(v => v);
                args = args || [];
                let _args = noPrefix.trim().split` `.slice(1);
                let text = _args.join` `;
                command = (command || '').toLowerCase();
                let fail = plugin.fail || global.dfail;
                let isAccept = plugin.command instanceof RegExp ?
                    plugin.command.test(command) :
                    Array.isArray(plugin.command) ?
                    plugin.command.some(cmd => cmd instanceof RegExp ? cmd.test(command) : cmd === command) :
                    typeof plugin.command === 'string' ?
                    plugin.command === command :
                    false;

                if (!isAccept) continue;
                m.plugin = name;
if (m.chat in global.db.data.chats || m.sender in global.db.data.users) {
let chat = global.db.data.chats[m.chat]
let user = global.db.data.users[m.sender]
if (!['owner-unbanchat.js'].includes(name) && chat && chat.isBanned && !isROwner) return // Except this
if (name != 'owner-unbanchat.js' && name != 'owner-exec.js' && name != 'owner-exec2.js' && name != 'tool-delete.js' && chat?.isBanned && !isROwner) return 
if (m.text && user.banned && !isROwner) {
if (user.antispam > 2) return
m.reply(`⚠️ 𝘌𝘚𝘛𝘈𝘚 𝘉𝘈𝘕𝘌𝘈𝘋𝘖 ⚠️\n*• 𝘔𝘰𝘵𝘪𝘷𝘰:* ${user.messageSpam === 0 ? '𝘚𝘱𝘢𝘮' : user.messageSpam}\n*👉🏻 𝘗𝘶𝘦𝘥𝘦𝘴 𝘤𝘰𝘯𝘵𝘢𝘤𝘵𝘢𝘳 𝘢𝘭 𝘱𝘳𝘰𝘱𝘪𝘦𝘵𝘢𝘳𝘪＠ 𝘥𝘦𝘭 𝘉𝘰𝘵 𝘴𝘪 𝘤𝘳𝘦𝘦𝘴 𝘲𝘶𝘦 𝘴𝘦 𝘵𝘳𝘢𝘵𝘢 𝘥𝘦 𝘶𝘯 𝘦𝘳𝘳𝘰𝘳 𝘰 𝘱𝘢𝘳𝘢 𝘤𝘩𝘢𝘳𝘭𝘢𝘳 𝘴𝘰𝘣𝘳𝘦 𝘵𝘶 𝘥𝘦𝘴𝘣𝘢𝘯𝘦𝘰*

👉 ${ig}
👉 ${fb}`)
user.antispam++	
return
}

/*if (settings.antiPrivate && !m.isGroup && !m.fromMe) {
let user = global.db.data.users[m.sender] || {};
if (user.warnPv && !m.text.includes('code')) {
console.log(`[AntiPrivate]`);
return;
}

if (!user.warnPv) {
m.reply(`Hola esta prohibido usar los comando al privado del bot...\n\n> _*Para usar mi funciones unirte al  grupo oficial 👇*_\n${[nnn, nnnttt, nnnt].getRandom()}`); 
user.warnPv = true;
global.db.data.users[m.sender] = user;
return;
}}
*/

//Antispam2		
if (user.antispam2 && isROwner) return
let time = global.db.data.users[m.sender].spam + 3000
if (new Date - global.db.data.users[m.sender].spam < 3000) return console.log(`[ SPAM ]`) 
global.db.data.users[m.sender].spam = new Date * 1
}
                
const hl = _prefix;
const adminMode = global.db.data.chats[m.chat].modoadmin;
const lolibott = `${plugin.botAdmin || plugin.admin || plugin.group || plugin || noPrefix || hl || m.text.slice(0, 1) == hl || plugin.command}`;
if (adminMode && !isOwner && !isROwner && m.isGroup && !isAdmin && lolibott) return; 
if (plugin.rowner && plugin.owner && !(isROwner || isOwner)) { // Both Owner
fail('owner', m, this)
continue
}
if (plugin.rowner && !isROwner) { // Real Owner
fail('rowner', m, this)
continue
}
if (plugin.owner && !isOwner) { // Number Owner
fail('owner', m, this)
continue
}
if (plugin.mods && !isMods) { // Moderator
fail('mods', m, this)
continue
}
if (plugin.premium && !isPrems) { // Usuarios Premium
fail('premium', m, this)
continue
}
if (plugin.group && !m.isGroup) { // Group Only
fail('group', m, this)
continue
} else if (plugin.botAdmin && !isBotAdmin) { // You Admin
fail('botAdmin', m, this)
continue
} else if (plugin.admin && !isAdmin) { // User Admin
fail('admin', m, this)
continue
}
if (plugin.private && m.isGroup) { // Private Chat Only
fail('private', m, this)
continue
}
if (plugin.register == true && _user.registered == false) { // Butuh daftar?
fail('unreg', m, this)
continue
}
m.isCommand = true
/*let xp = 'exp' in plugin ? parseInt(plugin.exp) : 1 // Ganancia de XP por comando 
if (xp > 9000) m.reply('chirrido -_-') //
else
m.exp += xp*/
if (!isPrems && plugin.limit && global.db.data.users[m.sender].limit < plugin.limit * 1) {
m.reply(`*⚠ sᴜs ᴅɪᴀᴍᴀɴᴛᴇ 💎 sᴇ ʜᴀɴ ᴀɢᴏᴛᴀᴅᴏ ᴘᴜᴇᴅᴇ ᴄᴏᴍᴘʀᴀʀ ᴍᴀs ᴜsᴀɴᴅᴏ ᴇʟ ᴄᴏᴍᴀɴᴅᴏ:* #buy`)
//conn.sendMessage(m.chat, {text: `*⚠ 𝐒𝐮𝐬 𝐝𝐢𝐚𝐦𝐚𝐧𝐭𝐞 💎 𝐬𝐞 𝐡𝐚𝐧 𝐚𝐠𝐨𝐭𝐚𝐝𝐨 𝐩𝐮𝐞𝐝𝐞 𝐜𝐨𝐦𝐩𝐫𝐚𝐫 𝐦𝐚𝐬 𝐮𝐬𝐚𝐧𝐝𝐨 𝐞𝐥 𝐜𝐨𝐦𝐚𝐧𝐝𝐨:* #buy`, contextInfo: {externalAdReply : {mediaUrl: null, mediaType: 1, description: null, "title": wm, body: '', previewType: 0, "thumbnail": img.getRandom(), sourceUrl: [nna, nna2, md, yt, nnn, nnnt, nnnttt, tiktok].getRandom()}}}, { quoted: m })         
continue
}
if (plugin.level > _user.level) {
m.reply(`*⚠️ ɴᴇᴄᴇsɪᴛᴀ ᴇʟ ɴɪᴠᴇʟ ${plugin.level} ᴘᴀʀᴀ ᴘᴏᴅᴇʀ ᴜsᴀʀ ᴇsᴛᴇ ᴄᴏᴍᴀɴᴅᴏ, ᴛᴜ ɴɪᴠᴇʟ ᴀᴄᴛᴜᴀʟ ᴇs:* ${_user.level}`)
//conn.sendMessage(m.chat, {text: `*⚠️𝐍𝐞𝐜𝐞𝐬𝐢𝐭𝐚 𝐞𝐥 𝐧𝐢𝐯𝐞𝐥 ${plugin.level} 𝐩𝐚𝐫𝐚 𝐩𝐨𝐝𝐞𝐫 𝐮𝐬𝐚𝐫 𝐞𝐬𝐭𝐞 𝐜𝐨𝐦𝐚𝐧𝐝𝐨, 𝐓𝐮 𝐧𝐢𝐯𝐞𝐥 𝐚𝐜𝐭𝐮𝐚𝐥 𝐞𝐬:* ${_user.level}`, contextInfo: {externalAdReply : {mediaUrl: null, mediaType: 1, description: null, "title": wm, body: '', previewType: 0, "thumbnail": img.getRandom(), sourceUrl: [nna, nna2, md, yt, nnn, nnnt, nnnttt, tiktok].getRandom()}}}, { quoted: m })         
continue // Si no se ha alcanzado el nivel
}
let extra = {match, usedPrefix, noPrefix, _args, args, command, text, conn: this, participants, groupMetadata, user, bot, isROwner, isOwner, isRAdmin, isAdmin,  isBotAdmin, isPrems, chatUpdate, __dirname: ___dirname, __filename }
try {
await plugin.call(this, m, extra)
if (!isPrems)
m.limit = m.limit || plugin.limit || false
} catch (e) {
// Error occured
m.error = e
console.error(e)
if (e) {
let text = format(e) || 'Error desconocido';
for (let api in global.APIs) {
let key = global.APIs[api].key;
if (key) text = text.replace(new RegExp(key, 'g'), '#HIDDEN#');
}
m.reply(text);
}
/*if (e) {
let text = format(e)
for (let key of Object.values(global.APIs))
text = text.replace(new RegExp(key, 'g'), '#HIDDEN#')
m.reply(text)
}*/
} finally {
// m.reply(util.format(_user))
if (typeof plugin.after === 'function') {
try {
await plugin.after.call(this, m, extra)
} catch (e) {
console.error(e)
}}
if (m.limit) m.reply(`*${+m.limit}* ᴅɪᴀᴍᴀɴᴛᴇ 💎 ᴜsᴀᴅᴏs`)
if (m.money) m.reply(+m.money + ' ᴄᴏɪɴs ᴜsᴀᴅᴏs')
}
break
}}} catch (e) {
console.error(e)
} finally {
if (opts['queque'] && m.text) {
const quequeIndex = this.msgqueque.indexOf(m.id || m.key.id)
if (quequeIndex !== -1)
this.msgqueque.splice(quequeIndex, 1)
}
//console.log(global.db.data.users[m.sender])
let user, stats = global.db.data.stats
if (m) {
if (m.sender && (user = global.db.data.users[m.sender])) {
user.exp += m.exp
user.limit -= m.limit * 1
}

let stat
if (m.plugin) {
let now = +new Date
if (m.plugin in stats) {
stat = stats[m.plugin]
if (!isNumber(stat.total))
stat.total = 1
if (!isNumber(stat.success))
stat.success = m.error != null ? 0 : 1
if (!isNumber(stat.last))
stat.last = now
if (!isNumber(stat.lastSuccess))
stat.lastSuccess = m.error != null ? 0 : now
} else
stat = stats[m.plugin] = {
total: 1,
success: m.error != null ? 0 : 1,
last: now,
lastSuccess: m.error != null ? 0 : now
}
stat.total += 1
stat.last = now
if (m.error == null) {
stat.success += 1
stat.lastSuccess = now
}}}

try {
if (!opts['noprint']) await (await import(`./lib/print.js`)).default(m, this)
} catch (e) {
console.log(m, m.quoted, e)}
let settingsREAD = global.db.data.settings[this.user.jid] || {}  
if (opts['autoread']) await this.readMessages([m.key])
if (settingsREAD.autoread2) await this.readMessages([m.key])  
//if (settingsREAD.autoread2 == 'true') await this.readMessages([m.key])    
	    
if (!m.fromMem && m.text.match(/(@5492266466080|MeliodasBot|Botsito|Gata|Ultrabot|china|meliodas|bot|:v)/gi)) {
let emot = pickRandom(["😺", "😸", "😹", "😻", "😼", "😽", "🙀", "😿", "😾", "🤩", "😏", "😳", "🥵", "🤯", "😱", "😨", "🤫", "🥴", "🤧", "🤑", "🤠", "🤖", "🤝", "💪", "👑", "😚", "🐱", "🐈", "🐆", "🐅", "⚡️", "🌈", "☃️", "⛄️", "🌝", "🌛", "🌜", "🍓", "🍎", "🎈", "🪄", "❤️", "🧡", "💛", "💚", "💙", "💜", "🖤", "🤍", "💘", "💝", "💟", "🌝", "😎", "🔥", "🖕", "🐦"])
this.sendMessage(m.chat, { react: { text: emot, key: m.key }})}
function pickRandom(list) { return list[Math.floor(Math.random() * list.length)]}}}

/**
 * Handle groups participants update
 * @param {import('@adiwajshing/baileys').BaileysEventMap<unknown>['group-participants.update']} groupsUpdate 
 */
let botStartTime = Date.now(); 
export async function participantsUpdate({ id, participants, action }) {
if (opts['self']) return;
if (this.isInit) return;
if (global.db.data == null) await loadDatabase();
let chat = global.db.data.chats[id] || {};
let text = '';
switch (action) {
case 'add':
if (chat.welcome) {
let groupMetadata = await this.groupMetadata(id) || (conn.chats[id] || {}).metadata;
for (let user of participants) {
let userJoinTime = Date.now(); 
if (userJoinTime < botStartTime) {
continue; 
}
let pp = './src/sinfoto.jpg';
try {
pp = await this.profilePictureUrl(user, 'image');
} catch (e) {
} finally {
let apii = await this.getFile(pp);
const botTt2 = groupMetadata.participants.find(u => this.decodeJid(u.id) == this.user.jid) || {};
const isBotAdminNn = botTt2?.admin === "admin" || false;
text = (action === 'add' ? (chat.sWelcome || this.welcome || conn.welcome || 'Welcome, @user!').replace('@subject', await this.getName(id)).replace('@desc', groupMetadata.desc?.toString() || '*ᴜɴ ɢʀᴜᴘᴏ ɢᴇɴɪᴀ😸*\n *sɪɴ ʀᴇɢʟᴀ 😉*') :
(chat.sBye || this.bye || conn.bye || 'Bye, @user!')).replace('@user', '@' + user.split('@')[0]);

if (chat.antifake && isBotAdminNn && action === 'add') {
const numerosPermitidos = ["212", "265", "92", "91", "90", "210", "60", "61", "62", "40", "48", "49", "93", "94", "98", "258"]; //PUEDES EDITAR LOS USUARIOS QUE SE ELIMINARÁN SI EMPIEZA POR CUALQUIER DE ESOS NÚMEROS	
if (numerosPermitidos.some(num => user.startsWith(num))) {
this.sendMessage(id, { text: `@${user.split("@")[0]} Nos numero fake no esta permitido el este grupo hasta la próxima...`, mentions: [user] }, { quoted: null });
let responseb = await this.groupParticipantsUpdate(id, [user], 'remove');
if (responseb[0].status === "404") return;
return;
}}
let username = this.getName(id);
let fkontak2 = { "key": { "participants": "0@s.whatsapp.net", "remoteJid": "status@broadcast", "fromMe": false, "id": "Halo" }, "message": { "contactMessage": { "vcard": `BEGIN:VCARD\nVERSION:3.0\nN:Sy;Bot;;;\nFN:y\nitem1.TEL;waid=${user.split('@')[0]}:${user.split('@')[0]}\nitem1.X-ABLabel:Ponsel\nEND:VCARD` } }, "participant": "0@s.whatsapp.net" };
let vn = 'https://qu.ax/cUYg.mp3';
let or = ['texto', 'audio'];
let media = or[Math.floor(Math.random() * 2)];
if (media === 'texto') {
this.sendMessage(id, {text: text, contextInfo: { forwardedNewsletterMessageInfo: { newsletterJid: '120363355261011910@newsletter', serverMessageId: '', newsletterName: 'seguirme bb 😘' },forwardingScore: 9999999, isForwarded: true, mentionedJid: [user], externalAdReply: { showAdAttribution: true, renderLargerThumbnail: true, thumbnail: apii.data, title: [wm, ' ' + wm + '😊', '🌟'].getRandom(), containsAutoReply: true, mediaType: 1, sourceUrl: [nna, nna2, nnntt, yt].getRandom()}}}, { quoted: fkontak2 });
}
if (media === 'audio') {
this.sendMessage(id, { audio: { url: vn }, contextInfo: { forwardedNewsletterMessageInfo: { newsletterJid: '120363355261011910@newsletter', serverMessageId: '', newsletterName: 'seguirme bb 😘' }, forwardingScore: 9999999, isForwarded: true, mentionedJid: [user], externalAdReply: { mediaType: 1, previewType: "PHOTO", thumbnail: apii.data, title: `乂 ＷＥＬＣＯＭＥ 乂`, body: [wm, ' ' + wm + '😊', '🌟'].getRandom(), showAdAttribution: true, renderLargerThumbnail: true, sourceUrl: [nna, nna2, nnntt, yt].getRandom()}}, ptt: true, mimetype: 'audio/mpeg', fileName: `error.mp3` }, { quoted: fkontak2 });
}}}}            
			    
break
case 'promote':
case 'daradmin':
case 'darpoder':
text = (chat.sPromote || this.spromote || conn.spromote || '@user ```is now Admin```')
case 'demote':
case 'quitarpoder':
case 'quitaradmin':
if (!text)
text = (chat.sDemote || this.sdemote || conn.sdemote || '@user ```is no longer Admin```')
text = text.replace('@user', '@' + participants[0].split('@')[0])
if (chat.detect)
//this.sendMessage(id, { text, mentions: this.parseMention(text) })
break
}}

/** 
 * Actualización de grupos de control
 * Handle groups update
 * @param {import('@adiwajshing/baileys').BaileysEventMap<unknown>['groups.update']} groupsUpdate 
 */
export async function groupsUpdate(groupsUpdate) {
if (opts['self'])
return
for (const groupUpdate of groupsUpdate) {
const id = groupUpdate.id
if (!id) continue
let chats = global.db.data.chats[id], text = ''
if (!chats?.detect) continue
// if (groupUpdate.desc) text = (chats.sDesc || this.sDesc || conn.sDesc || '```Description has been changed to```\n@desc').replace('@desc', groupUpdate.desc)
//if (groupUpdate.subject) text = (chats.sSubject || this.sSubject || conn.sSubject || '```Subject has been changed to```\n@subject').replace('@subject', groupUpdate.subject)
//if (groupUpdate.icon) text = (chats.sIcon || this.sIcon || conn.sIcon || '```Icon has been changed to```').replace('@icon', groupUpdate.icon)
//if (groupUpdate.revoke) text = (chats.sRevoke || this.sRevoke || conn.sRevoke || '```Group link has been changed to```\n@revoke').replace('@revoke', groupUpdate.revoke)
if (!text) continue
await this.sendMessage(id, { text, mentions: this.parseMention(text) })
}}

export async function callUpdate(callUpdate) {
let isAnticall = global.db.data.settings[this.user.jid].antiCall
if (!isAnticall) return
for (let nk of callUpdate) {
if (nk.isGroup == false) {
if (nk.status == "offer") {
let callmsg = await this.reply(nk.from, `ʜᴏʟᴀ *@${nk.from.split('@')[0]}*, ʟᴀs ${nk.isVideo ? 'videollamadas' : 'llamadas'} ɴᴏ ᴇsᴛᴀɴ ᴘᴇʀᴍɪᴛɪᴅᴀs, sᴇʀᴀs ʙʟᴏǫᴜᴇᴀᴅᴏ.\n\nsɪ ᴀᴄᴄɪᴅᴇɴᴛᴀʟᴍᴇɴᴛᴇ ʟʟᴀᴍᴀsᴛᴇ ᴘᴏɴɢᴀsᴇ ᴇɴ ᴄᴏɴᴛᴀᴄᴛᴏ ᴄᴏɴ ᴍɪ ᴄʀᴇᴀᴅᴏʀ ᴘᴀʀᴀ ǫᴜᴇ ᴛᴇ ᴅᴇsʙʟᴏǫᴜᴇᴇ!\n\nɢʀᴜᴘᴏ ᴀsɪsᴛᴇɴᴄɪᴀ ғᴀᴄᴇʙᴏᴏᴋ: ${fb}`, false, { mentions: [nk.from] })
let vcard = `BEGIN:VCARD\nVERSION:3.0\nN:;𝕮𝖍𝖎𝖓𝖆 𝕸𝖎𝖙𝖟𝖚𝖐𝖎 👑;;;\nFN:𝕮𝖍𝖎𝖓𝖆 𝕸𝖎𝖙𝖟𝖚𝖐𝖎 💋\nORG:𝕮𝖍𝖎𝖓𝖆 𝕸𝖎𝖙𝖟𝖚𝖐𝖎 💋\nTITLE:\nitem1.TEL;waid=85254109507:+852 5410 9507\nitem1.X-ABLabel:𝕮𝖍𝖎𝖓𝖆 𝕸𝖎𝖙𝖟𝖚𝖐𝖎 💋\nX-WA-BIZ-DESCRIPTION:[❗] ᴇsᴄʀɪʙɪ sᴏʟᴏ ᴘᴏʀ ᴄᴏsᴀs ᴅᴇʟ ʙᴏᴛ.\nX-WA-BIZ-NAME:𝕮𝖍𝖎𝖓𝖆 𝕸𝖎𝖙𝖟𝖚𝖐𝖎 💋\nEND:VCARD`
    await this.sendMessage(nk.from, { contacts: { displayName: '𝕮𝖍𝖎𝖓𝖆 𝕸𝖎𝖙𝖟𝖚𝖐𝖎 💋', contacts: [{ vcard }] }}, {quoted: callmsg})
await this.updateBlockStatus(nk.from, 'block')
}}}}

export async function deleteUpdate(message) {
try {
const { fromMe, id, participant } = message
if (fromMe) return 
let msg = this.serializeM(this.loadMessage(id))
let chat = global.db.data.chats[msg?.chat] || {}
if (!chat?.delete) return 
if (!msg) return 
if (!msg?.isGroup) return 
const antideleteMessage = `*[ ANTI ELIMINAR ]*\n\n@${participant.split`@`[0]} Elimino un mensaje\nEnviando el mensaje...\n\n*Para desactivar esta función escriba:*\n#disable delete`.trim();
await this.sendMessage(msg.chat, {text: antideleteMessage, mentions: [participant]}, {quoted: msg})
this.copyNForward(msg.chat, msg).catch(e => console.log(e, msg))
} catch (e) {
console.error(e)
}}

global.dfail = (type, m, conn, usedPrefix) => {
    let msg = {
        rowner: '⚠️ ¡𝘈𝘤𝘤𝘦𝘴𝘰 𝘳𝘦𝘴𝘵𝘳𝘪𝘯𝘨𝘪𝘥𝘰！  ！𝘓𝘰 𝘴𝘪𝘦𝘯𝘵𝘰！ 🔒',
        owner: '⚠️ ¡𝘊𝘰𝘮𝘢𝘯𝘥𝘰 𝘳𝘦𝘴𝘦𝘳𝘷𝘢𝘥𝘰! 𝘌𝘴𝘵𝘦 𝘤𝘰𝘮𝘢𝘯𝘥𝘰 𝘦𝘴 𝘴𝘰𝘭𝘰 𝘱𝘢𝘳𝘢 𝘮𝘪 𝘱𝘳𝘰𝘱𝘪𝘦𝘵𝘢𝘳𝘪𝘰 ¡𝘗𝘳𝘪𝘷𝘪𝘭𝘦𝘨𝘪𝘰𝘴 𝘦𝘹𝘤𝘭𝘶𝘴𝘪𝘷𝘰𝘴! 🔒',
        mods: '⚠️ 𝘌𝘴𝘵𝘦 𝘤𝘰𝘮𝘢𝘯𝘥𝘰 𝘴𝘰𝘭𝘰 𝘭𝘰 𝘱𝘶𝘦𝘥𝘰 𝘶𝘴𝘢𝘳 𝘺𝘰 ¡𝘗𝘳𝘪𝘷𝘪𝘭𝘦𝘨𝘪𝘰𝘴 𝘥𝘦 𝘮𝘰𝘥𝘦𝘳𝘢𝘥𝘰𝘳𝘦𝘴!',
        premium: '⚠️ 𝘌𝘴𝘵𝘦 𝘤𝘰𝘮𝘢𝘯𝘥𝘰 𝘦𝘴 𝘴𝘰𝘭𝘰 𝘱𝘢𝘳𝘢 𝘶𝘴𝘶𝘢𝘳𝘪𝘰𝘴 𝘗𝘳𝘦𝘮𝘪𝘶𝘮 (𝘝𝘐𝘗) ¡𝘚𝘦𝘳 𝘝𝘐𝘗 𝘵𝘪𝘦𝘯𝘦 𝘴𝘶𝘴 𝘣𝘦𝘯𝘦𝘧𝘪𝘤𝘪𝘰𝘴! 🌟',
        group: '⚠️ ¡𝘊𝘰𝘮𝘢𝘯𝘥𝘰 𝘱𝘢𝘳𝘢 𝘨𝘳𝘶𝘱𝘰! 𝘌𝘴𝘵𝘦 𝘤𝘰𝘮𝘢𝘯𝘥𝘰 𝘴𝘰𝘭𝘰 𝘧𝘶𝘯𝘤𝘪𝘰𝘯𝘢 𝘦𝘯 𝘨𝘳𝘶𝘱𝘰𝘴.',
        private: '⚠️ ¡𝘊𝘰𝘮𝘢𝘯𝘥𝘰 𝘴𝘰𝘭𝘰 𝘧𝘶𝘯𝘤𝘪𝘰𝘯𝘢 𝘦𝘭 𝘱𝘳𝘪𝘷𝘢𝘥𝘰! 𝘝𝘢𝘮𝘰𝘴 𝘢𝘭 𝘱𝘳𝘪𝘷𝘢𝘥𝘰, 𝘦𝘴𝘵𝘦 𝘤𝘰𝘮𝘢𝘯𝘥𝘰 𝘴𝘰𝘭𝘰 𝘧𝘶𝘯𝘤𝘪𝘰𝘯𝘢 𝘦𝘯 𝘦𝘭 𝘱𝘳𝘪𝘷𝘢𝘥𝘰 𝘥𝘦𝘭 𝘣𝘰𝘵',
        admin: '⚠️ ¡𝘕𝘦𝘤𝘦𝘴𝘪𝘵𝘢𝘴 𝘴𝘦𝘳 𝘢𝘥𝘮𝘪𝘯! 𝘚𝘰𝘭𝘰 𝘭𝘰𝘴 𝘢𝘥𝘮𝘪𝘯𝘴 𝘱𝘶𝘦𝘥𝘦𝘯 𝘶𝘴𝘢𝘳 𝘦𝘴𝘵𝘦 𝘤𝘰𝘮𝘢𝘯𝘥𝘰. ¡𝘕𝘦𝘤𝘦𝘴𝘪𝘵𝘰 𝘢 𝘭𝘰𝘴 𝘫𝘦𝘧𝘦𝘴 𝘢𝘲𝘶𝘪́! 🛡️',
        botAdmin: '⚠️ ¡𝘕𝘦𝘤𝘦𝘴𝘪𝘵𝘰 𝘱𝘦𝘳𝘮𝘪𝘴𝘰𝘴! 𝘱𝘳𝘪𝘮𝘦𝘳𝘰 𝘩𝘢𝘻𝘮𝘦 𝘢𝘥𝘮𝘪𝘯𝘴 𝘢𝘭 𝘉𝘰𝘵 𝘰𝘴𝘦𝘢 𝘢 𝘮𝘪 𝘱𝘢𝘳𝘢 𝘱𝘰𝘥𝘦𝘳 𝘶𝘴𝘢𝘳 𝘦𝘴𝘵𝘦 𝘤𝘰𝘮𝘢𝘯𝘥𝘰.',
        restrict: '[ 🔐 ] ¡𝘊𝘰𝘮𝘢𝘯𝘥𝘰 𝘥𝘦𝘴𝘢𝘤𝘵𝘪𝘷𝘢𝘥𝘰! 𝘌𝘴𝘵𝘦 𝘤𝘰𝘮𝘢𝘯𝘥𝘰 𝘦𝘴𝘵𝘢 𝘥𝘦𝘴𝘢𝘤𝘵𝘪𝘷𝘢𝘥𝘰 𝘱𝘰𝘳 𝘮𝘪 𝘫𝘦𝘧𝘦'
    }[type]
    if (msg) return conn.sendMessage(m.chat, {text: msg, contextInfo: { mentionedJid: null, forwardingScore: 1, isForwarded: true, forwardedNewsletterMessageInfo: { newsletterJid: '120363419404216418@newsletter', serverMessageId: '', newsletterName: '♑︎ 𝐌𝐄𝐋𝐈𝐎𝐃𝐀𝐒 - 𝐂𝐇𝐀𝐍𝐍𝐄𝐋 𝐎𝐅𝐈𝐂𝐈𝐀𝐋 ꨄ' }, externalAdReply : {mediaUrl: null, mediaType: 1, description: null, "title": `ℹ️𝐈𝐍𝐅𝐎 ℹ️`, body: wm, previewType: 0, "thumbnail": img.getRandom(), sourceUrl: [nna, nna2, md, ig, yt, nn, tiktok].getRandom()}}}, { quoted: m })
}

const file = global.__filename(import.meta.url, true);
watchFile(file, async () => {
unwatchFile(file)
console.log(chalk.redBright('Update \'handler.js\''));
//if (global.reloadHandler) console.log(await global.reloadHandler());
  
/*if (global.conns && global.conns.length > 0 ) {
const users = [...new Set([...global.conns.filter((conn) => conn.user && conn.ws.socket && conn.ws.socket.readyState !== ws.CLOSED).map((conn) => conn)])];
for (const userr of users) {
userr.subreloadHandler(false)
}}
*/  
}); 
