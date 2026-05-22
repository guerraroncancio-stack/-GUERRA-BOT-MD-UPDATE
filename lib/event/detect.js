import { jidNormalizedUser } from '@whiskeysockets/baileys'
import { getRealJid } from '../identifier.js'

export async function observeEvents(conn) {
    if (!conn || !conn.user) return

    const botJid = jidNormalizedUser(conn.user.id)
    const mainBotJid = global.conn?.user?.id ? jidNormalizedUser(global.conn.user.id) : null
    const isMainBot = botJid === mainBotJid

    conn.ev.removeAllListeners('group-participants.update')

    if (conn._detectHandler) {
        conn.ev.off('messages.upsert', conn._detectHandler)
        conn._detectHandler = null
    }

    const allowedEvents = [21, 22, 23, 25, 26, 28, 29, 30, 32, 145, 171]

    conn.ev.on('group-participants.update', async (m) => {
        if (!m.chat?.endsWith('@g.us')) return
        const chat = await global.Chat.findOne({ id: m.chat })
        if (!chat || (!chat.welcome && !chat.detect)) return
        if (chat.antisub && !isMainBot) return

        const botSettings = global.subbotConfig?.[botJid]
        const checkModule = (mod) => (!botSettings?.modulos) ? true : botSettings.modulos[mod] !== false

        const updateCache = async () => {
            try {
                global.groupCache?.del?.(m.chat)
                const metadata = await conn.groupMetadata(m.chat)
                global.groupCache?.set?.(m.chat, metadata)
                return metadata
            } catch { return null }
        }

        const groupMetadata = global.groupCache?.get(m.chat) || await updateCache() || {}
        const groupName = groupMetadata.subject || 'Sistema'
        const memberCount = groupMetadata.participants?.length || '0'
        const dateCreated = groupMetadata.creation
            ? new Date(groupMetadata.creation * 1000).toLocaleDateString('es-ES')
            : 'Desconocida'

        for (let who of m.participants) {
            let whoTag = `@${who.split('@')[0]}`
            if (chat.welcome && checkModule('bienvenida') && m.action === 'add') {
                let txt = `╭──────────────┄\n│〉 ᴜꜱᴇʀ: ${whoTag}\n│〉 ɴᴏᴅᴇ: ${groupName}\n│〉 ꜱᴛᴀᴛᴜꜱ: ᴏɴʟɪɴᴇ\n┝──────────────┄\n┝➠  ᴅᴀᴛᴀ\n│ ɴᴏᴅᴏꜱ: [ ${memberCount} ]\n│ ᴄʀᴇᴀᴛᴇᴅ: ${dateCreated}\n╰─────────────┄\n`
                if (chat.customWelcome) txt += `\n➠ ${chat.customWelcome}`
                let thumb = 'https://cdn.dix.lat/me/1773637281084.jpg'
                try { thumb = await conn.profilePictureUrl(who, 'image') } catch {}
                await conn.sendMessage(m.chat, { image: { url: thumb }, caption: txt, mentions: [who] })
            }
        }
    })

    conn._detectHandler = async ({ messages }) => {
        const m = messages[0]
        if (!m || !m.messageStubType || !m.key.remoteJid?.endsWith('@g.us')) return

        const chat = await global.Chat.findOne({ id: m.key.remoteJid })
        if (!chat?.detect) return
        if (chat.antisub && !isMainBot) return

        const botSettings = global.subbotConfig?.[botJid]
        if (botSettings?.modulos?.deteccion === false) return

        const st = m.messageStubType
        if (!allowedEvents.includes(st)) return

        const updateCache = async () => {
            try {
                global.groupCache?.del?.(m.key.remoteJid)
                const metadata = await conn.groupMetadata(m.key.remoteJid)
                global.groupCache?.set?.(m.key.remoteJid, metadata)
            } catch {}
        }

        let authorRaw = m.participant || m.key.participant || m.key.remoteJid
        let author = jidNormalizedUser(await getRealJid(conn, authorRaw, m))
        const params = m.messageStubParameters || []

        let whoJid = params[0] || author
        try {
            if (params[0]?.startsWith('{')) {
                const parsed = JSON.parse(params[0])
                whoJid = parsed.phoneNumber || parsed.id || parsed.jid || author
            }
        } catch { whoJid = params[0] || author }

        let who = jidNormalizedUser(await getRealJid(conn, String(whoJid), m))
        let whoTag = `@${who.split('@')[0]}`
        let authorTag = `@${author.split('@')[0]}`

        let tipo = '', icon = '🛡️', mensaje = ''
        const mentions = [author, who]

        switch (st) {
            case 28: await updateCache(); tipo = 'sᴀʟɪᴅᴀ';      icon = '👞'; mensaje = `> ┃ ✎ ᴜsᴜᴀʀɪᴏ: ${whoTag}\n> ┃ ✎ ᴇʟɪᴍɪɴᴀᴅᴏ ᴘᴏʀ: ${authorTag}`; break
            case 32: await updateCache(); tipo = 'sᴀʟɪᴅᴀ';      icon = '👋'; mensaje = `> ┃ ✎ ᴜsᴜᴀʀɪᴏ: ${whoTag}\n> ┃ ✎ ᴀᴄᴄɪᴏɴ: sᴇ ʜᴀ ɪᴅᴏ ᴅᴇʟ ɢʀᴜᴘᴏ`; break
            case 29: await updateCache(); tipo = 'ᴀsᴄᴇɴsᴏ';     icon = '⚡'; mensaje = `> ┃ ✎ ᴜsᴜᴀʀɪᴏ: ${whoTag}\n> ┃ ✎ ᴇsᴛᴀᴅᴏ: ɴᴜᴇᴠᴏ ᴀᴅᴍɪɴ\n> ┃ ✎ ᴘᴏʀ: ${authorTag}`; break
            case 30: await updateCache(); tipo = 'ᴅᴇɢʀᴀᴅᴀᴄɪᴏɴ'; icon = '❌'; mensaje = `> ┃ ✎ ᴜsᴜᴀʀɪᴏ: ${whoTag}\n> ┃ ✎ ᴇsᴛᴀᴅᴏ: ʏᴀ ɴᴏ ᴇs ᴀᴅᴍɪɴ\n> ┃ ✎ ᴘᴏʀ: ${authorTag}`; break
            case 21: await updateCache(); tipo = 'ɴᴏᴍʙʀᴇ';      icon = '📝'; mensaje = `> ┃ ✎ ᴄᴀᴍʙɪᴏ: ɴᴜᴇᴠᴏ ᴛɪᴛᴜʟᴏ\n> ┃ ✎ ᴠᴀʟᴏʀ: ${params[0]}\n> ┃ ✎ ᴘᴏʀ: ${authorTag}`; break
            case 22: tipo = 'ɪᴄᴏɴᴏ';      icon = '🖼️'; mensaje = `> ┃ ✎ ᴄᴀᴍʙɪᴏ: ɪᴍᴀɢᴇɴ ᴀᴄᴛᴜᴀʟɪᴢᴀᴅᴀ\n> ┃ ✎ ᴘᴏʀ: ${authorTag}`; break
            case 23: tipo = 'ᴇɴʟᴀᴄᴇ';     icon = '🔗'; mensaje = `> ┃ ✎ ᴀᴄᴄɪᴏɴ: ᴇɴʟᴀᴄᴇ ʀᴇsᴛᴀʙʟᴇᴄɪᴅᴏ\n> ┃ ✎ ᴘᴏʀ: ${authorTag}`; break
            case 25: tipo = 'ᴀᴊᴜsᴛᴇs';    icon = '⚙️'; mensaje = `> ┃ ✎ ᴇᴅɪᴄɪᴏɴ ᴅᴇ ɪɴғᴏ: ${params[0] === 'on' ? 'sᴏʟᴏ ᴀᴅᴍɪɴs' : 'ᴛᴏᴅᴏs'}\n> ┃ ✎ ᴘᴏʀ: ${authorTag}`; break
            case 26: tipo = 'ᴄʜᴀᴛ';       icon = '💬'; mensaje = `> ┃ ✎ ᴇɴᴠɪᴏ ᴅᴇ ᴍsɢs: ${params[0] === 'on' ? 'sᴏʟᴏ ᴀᴅᴍɪɴs' : 'ᴛᴏᴅᴏs'}\n> ┃ ✎ ᴘᴏʀ: ${authorTag}`; break
            case 145: tipo = 'ᴀᴘʀᴏʙᴀᴄɪᴏɴ'; icon = '🛡️'; mensaje = `> ┃ ✎ ᴍᴏᴅᴏ ᴅᴇ ɪɴɢʀᴇsᴏ: ${params[0] === 'on' ? 'ᴀᴄᴛɪᴠᴀᴅᴏ' : 'ᴅᴇsᴀᴄᴛɪᴠᴀᴅᴏ'}\n> ┃ ✎ ᴘᴏʀ: ${authorTag}`; break
            case 171: tipo = 'ᴍɪᴇᴍʙʀᴏs';  icon = '👥'; mensaje = `> ┃ ✎ ᴘᴇʀᴍɪsᴏ ᴀñᴀᴅɪʀ: ${params[0] === 'all_member_add' ? 'ᴛᴏᴅᴏs' : 'sᴏʟᴏ ᴀᴅᴍɪɴs'}\n> ┃ ✎ ᴘᴏʀ: ${authorTag}`; break
        }

        if (!tipo || !mensaje || mensaje.includes('undefined')) return

        let thumb = 'https://cdn.dix.lat/me/1773637281084.jpg'
        try { thumb = await conn.profilePictureUrl(m.key.remoteJid, 'image') } catch {}

        await conn.sendMessage(m.key.remoteJid, {
            text: `> ┏━━━〔 ${tipo} 〕━━━┓\n${mensaje}\n> ┗━━━━━━━━━━━━━━━━━━┛`,
            contextInfo: {
                mentionedJid: mentions.filter(j => j?.includes('@')),
                externalAdReply: {
                    title: `ꜱɪꜱᴛᴇᴍᴀ: ${tipo}`,
                    body: `Evento detectado: ${icon}`,
                    mediaType: 1,
                    thumbnailUrl: thumb,
                    renderLargerThumbnail: false
                }
            }
        })
    }

    conn.ev.on('messages.upsert', conn._detectHandler)
}