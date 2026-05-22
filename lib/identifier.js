/*import { jidNormalizedUser } from '@whiskeysockets/baileys'

export async function getRealJid(conn, jid, m) {
    let target = jid || (m?.key?.participant || m?.key?.remoteJid || m?.participant || conn.user.id)

    if (!target.endsWith('@lid')) return jidNormalizedUser(target)

    const sender = m?.key?.participant || m?.key?.remoteJid || m?.participant
    
    if (target === sender) {
        if (m?.key?.remoteJidAlt && m.key.remoteJidAlt.includes('@s.whatsapp.net')) {
            return jidNormalizedUser(m.key.remoteJidAlt)
        }
        if (m?.key?.participantAlt && m.key.participantAlt.includes('@s.whatsapp.net')) {
            return jidNormalizedUser(m.key.participantAlt)
        }
    }

    const chatId = m?.key?.remoteJid || m?.chat
    if (chatId?.endsWith('@g.us')) {
        try {
            const metadata = global.groupCache instanceof Map ? global.groupCache.get(chatId) : null
            if (metadata) {
                const participant = (metadata.participants || []).find(p => p.id === target)
                if (participant?.phoneNumber) {
                    let number = participant.phoneNumber
                    return jidNormalizedUser(number.includes('@') ? number : `${number}@s.whatsapp.net`)
                }
            }
        } catch (e) {
            return jidNormalizedUser(target)
        }
    }
    
    return jidNormalizedUser(target)
}

export async function resolveMentions(conn, mentions, m) {
    if (!mentions || !mentions.length) return []
    return Promise.all(mentions.map(jid => getRealJid(conn, jid, m)))
}

export function cleanNumber(jid) {
    if (!jid) return ''
    return String(jid).replace(/@.*$/, '').replace(/\D/g, '')
}*/


//#versión de prueba

import { jidNormalizedUser } from '@whiskeysockets/baileys'

export async function getRealJid(conn, jid, m) {
    let target = jid || (m?.key?.participant || m?.key?.remoteJid || m?.participant || conn.user.id)

    if (target.endsWith('@s.whatsapp.net')) {
        return jidNormalizedUser(target)
    }

    if (target.endsWith('@lid')) {
        const sender = m?.key?.participant || m?.key?.remoteJid || m?.participant
        if (target === sender) {
            if (m?.key?.remoteJidAlt?.includes('@s.whatsapp.net')) return jidNormalizedUser(m.key.remoteJidAlt)
            if (m?.key?.participantAlt?.includes('@s.whatsapp.net')) return jidNormalizedUser(m.key.participantAlt)
        }

        const chatId = m?.key?.remoteJid || m?.chat
        if (chatId?.endsWith('@g.us')) {
            const metadata = global.groupCache?.get?.(chatId)
            if (metadata) {
                const participant = (metadata.participants || []).find(p => p.id === target)
                if (participant?.phoneNumber) {
                    let number = participant.phoneNumber
                    return jidNormalizedUser(number.includes('@') ? number : `${number}@s.whatsapp.net`)
                }
            }
        }
    }

    return jidNormalizedUser(target)
}

export async function resolveMentions(conn, mentions, m) {
    if (!mentions || !mentions.length) return []
    return Promise.all(mentions.map(jid => getRealJid(conn, jid, m)))
}

export function cleanNumber(jid) {
    if (!jid) return ''
    return String(jid).split('@')[0].replace(/\D/g, '')
}