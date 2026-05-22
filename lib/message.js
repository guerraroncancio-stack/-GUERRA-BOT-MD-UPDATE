import { fileURLToPath, pathToFileURL } from 'url'
import path from 'path'
import { unwatchFile, watchFile } from 'fs'

import chalk from 'chalk'

import {
    jidNormalizedUser
} from '@whiskeysockets/baileys'

import { getRealJid } from './identifier.js'
import { cacheManager } from './cache.js'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

/* =========================================
   🧠 GLOBAL SAFE DEFAULTS
========================================= */

global.subbotConfig =
global.subbotConfig || {}

global.plugins =
global.plugins || new Map()

global.aliases =
global.aliases || new Map()

global.userCache =
global.userCache || new Map()

global.owner =
global.owner || []

/* =========================================
   🚀 MESSAGE HANDLER
========================================= */

export async function message(m, chatUpdate) {

    try {

        const conn = this

        if (!m) return
        if (!conn) return
        if (!conn.user) return

        this.uptime =
        this.uptime || Date.now()

        /* =========================================
           ⏱️ ANTI OLD MESSAGE
        ========================================= */

        const msgTime =
        (
            m.messageTimestamp?.low ||
            m.messageTimestamp ||
            0
        ) * 1000

        if (
            msgTime &&
            Date.now() - msgTime > 30000
        ) return

        /* =========================================
           🤖 BOT INFO
        ========================================= */

        const botJid =
        jidNormalizedUser(
            conn.user.id || ''
        )

        const mainBotJid =
        jidNormalizedUser(
            global.conn?.user?.id || ''
        )

        const isMainBot =
        botJid === mainBotJid

        /* =========================================
           ⚙️ SUBBOT SETTINGS
        ========================================= */

        if (
            !global.subbotConfig[botJid] &&
            !isMainBot &&
            global.SubBotSettings
        ) {

            try {

                const data =
                await global.SubBotSettings
                .findOne({
                    botId: botJid
                })
                .lean()

                if (data) {
                    global.subbotConfig[botJid] =
                    data
                }

            } catch {}

        }

        const botSettings =
        global.subbotConfig[botJid] || {

            prefix:
            isMainBot
            ? ['.', '#']
            : ['.'],

            botName:
            global.BOT?.name ||
            'GUERRA BOT MD',

            botImage:
            typeof global.img === 'function'
            ? global.img()
            : null

        }

        conn.settings =
        botSettings

        /* =========================================
           📩 MESSAGE INFO
        ========================================= */

        const chatJid =
        m.chat || ''

        const msgText =
        (
            m.text ||
            m.msg?.text ||
            m.msg?.caption ||
            ''
        ).trim()

        const prefixes =
        Array.isArray(
            conn.settings?.prefix
        )
        ? conn.settings.prefix
        : [conn.settings?.prefix || '.']

        const usedPrefix =
        prefixes.find(p =>
            msgText.startsWith(p)
        )

        /* =========================================
           👤 SENDER CHECK
        ========================================= */

        if (
            !m.sender ||
            typeof m.sender !== 'string'
        ) return

        if (
            !m.sender.endsWith('@s.whatsapp.net')
        ) return

        /* =========================================
           🆔 REAL JID
        ========================================= */

        let realSenderId =
        m.sender

        try {

            realSenderId =
            await getRealJid(
                conn,
                m.sender,
                m
            )

        } catch {}

        if (!realSenderId) {
            realSenderId = m.sender
        }

        const senderNumber =
        realSenderId
        .split('@')[0]
        .split(':')[0]

        const isROwner =
        Array.isArray(global.owner)
        ? global.owner.some(([num]) =>
            String(num)
            .replace(/\D/g, '') ===
            senderNumber
        )
        : false

        const botNumber =
        botJid
        .split('@')[0]
        .split(':')[0]

        const isSelf =
        senderNumber === botNumber

        /* =========================================
           🚫 IGNORE SYSTEM MESSAGES
        ========================================= */

        if (
            m.messageStubType &&
            m.isGroup
        ) return

        /* =========================================
           💬 CHAT DATA
        ========================================= */

        let chat = null
        let user = null

        try {

            if (
                m.isGroup &&
                global.Chat
            ) {

                chat =
                await global.Chat
                .findOne({
                    id: chatJid
                })
                .lean()

                if (!chat) {

                    chat =
                    await global.Chat.create({

                        id: chatJid,

                        isBanned: false,
                        welcome: true,
                        detect: true,

                        muto: false,
                        mutos: [],

                        antiLink: true,
                        modoadmin: false,

                        autoStickers: false,
                        antisub: false,

                        nsfw: false,
                        antiStatus: false

                    })

                }

            }

        } catch (err) {

            console.log(
                chalk.red(
                    '[ CHAT ERROR ]'
                ),
                err.message
            )

        }

        /* =========================================
           👤 USER DATA
        ========================================= */

        try {

            user =
            global.userCache.get(
                realSenderId
            )

            if (
                !user &&
                global.User &&
                (usedPrefix || m.isGroup)
            ) {

                user =
                await global.User
                .findOne({
                    id: realSenderId
                })
                .lean()

                if (
                    !user &&
                    usedPrefix
                ) {

                    user =
                    await global.User.create({

                        id: realSenderId,

                        name:
                        m.pushName || 'User',

                        exp: 0,
                        col: 10,

                        warnAntiLink: 0,

                        banned: false,

                        lastSeen:
                        new Date()

                    })

                }

                if (user) {

                    global.userCache.set(
                        realSenderId,
                        user
                    )

                }

            }

        } catch (err) {

            console.log(
                chalk.red(
                    '[ USER ERROR ]'
                ),
                err.message
            )

        }

        if (!user && !usedPrefix) return

        /* =========================================
           👥 GROUP DATA
        ========================================= */

        let participants = []
        let isAdmin = false
        let isBotAdmin = false

        if (
            m.isGroup &&
            cacheManager
        ) {

            try {

                const metadata =
                await cacheManager.get(
                    conn,
                    chatJid
                )

                participants =
                metadata?.participants || []

                isAdmin =
                cacheManager.getAdminStatus(
                    chatJid,
                    m.sender,
                    m.author
                )

                isBotAdmin =
                cacheManager.getAdminStatus(
                    chatJid,
                    conn.user.id,
                    conn.user.lid
                )

            } catch {}

        }

        /* =========================================
           🔇 MUTE SYSTEM
        ========================================= */

        if (
            m.isGroup &&
            chat &&
            !isROwner
        ) {

            const muted =
            chat.muto ||
            chat.mutos?.includes(
                realSenderId
            )

            if (
                muted &&
                isBotAdmin
            ) {

                await conn.sendMessage(
                    m.chat,
                    {
                        delete: m.key
                    }
                ).catch(() => null)

                return

            }

        }

        /* =========================================
           🚫 EMPTY MESSAGE
        ========================================= */

        if (
            !msgText &&
            !m.msg?.image &&
            !m.msg?.video &&
            !m.msg?.audio &&
            !m.msg?.sticker &&
            !m.msg?.document
        ) return

        /* =========================================
           🔌 PLUGIN BEFORE
        ========================================= */

        const plugins =
        Array.from(
            global.plugins.values()
        )

        for (const plugin of plugins) {

            if (
                typeof plugin?.before ===
                'function'
            ) {

                try {

                    const stop =
                    await plugin.before.call(
                        conn,
                        m,
                        {

                            conn,
                            chat,
                            user,

                            isAdmin,
                            isBotAdmin,
                            isROwner,
                            isSelf,

                            participants

                        }
                    )

                    if (stop) return

                } catch {}

            }

        }

        /* =========================================
           ❌ NO PREFIX
        ========================================= */

        if (!usedPrefix) return

        /* =========================================
           🚫 BANNED USER
        ========================================= */

        if (
            user?.banned &&
            !isROwner
        ) {

            await conn.sendMessage(
                m.chat,
                {
                    text:
                    `⚠️ ACCESO RESTRINGIDO`
                },
                {
                    quoted: m
                }
            ).catch(() => null)

            return

        }

        /* =========================================
           👑 ADMIN MODE
        ========================================= */

        if (
            m.isGroup &&
            chat?.modoadmin &&
            !isAdmin &&
            !isROwner
        ) return

        /* =========================================
           ⚡ COMMAND PARSER
        ========================================= */

        const noPrefix =
        msgText
        .slice(usedPrefix.length)
        .trim()

        const [
            commandName,
            ...args
        ] =
        noPrefix.split(/\s+/)

        const command =
        (
            commandName || ''
        ).toLowerCase()

        const text =
        args.join(' ').trim()

        /* =========================================
           🔎 FIND PLUGIN
        ========================================= */

        const pluginName =
        global.plugins.has(command)
        ? command
        : global.aliases.get(command)

        const plugin =
        global.plugins.get(pluginName)

        if (!plugin) return

        /* =========================================
           🔐 PERMISSIONS
        ========================================= */

        const perms = {

            rowner:
            isROwner,

            owner:
            isROwner,

            group:
            m.isGroup,

            private:
            !m.isGroup,

            admin:
            isAdmin,

            botAdmin:
            isBotAdmin,

            self:
            isSelf

        }

        for (const perm of [

            'rowner',
            'owner',
            'group',
            'private',
            'admin',
            'botAdmin',
            'self'

        ]) {

            if (
                plugin[perm] &&
                !perms[perm]
            ) {

                global.dfail(
                    perm,
                    m,
                    conn
                )

                return

            }

        }

        /* =========================================
           💎 COMMAND COST
        ========================================= */

        if (
            plugin.col &&
            !isROwner
        ) {

            const price =
            parseInt(plugin.col)

            if (
                (user.col || 0) <
                price
            ) {

                global.dfail(
                    'col',
                    m,
                    conn,
                    price
                )

                return

            }

            user.col -= price

        }

        /* =========================================
           📊 STATS
        ========================================= */

        try {

            if (global.Stats) {

                global.Stats
                .findOneAndUpdate(
                    {
                        command:
                        plugin.name ||
                        command
                    },
                    {
                        $inc: {
                            globalUsage: 1
                        }
                    },
                    {
                        upsert: true
                    }
                )
                .catch(() => null)

            }

        } catch {}

        /* =========================================
           👁️ READ MESSAGE
        ========================================= */

        await conn.readMessages(
            [m.key]
        ).catch(() => null)

        /* =========================================
           🚀 RUN COMMAND
        ========================================= */

        try {

            await plugin.run.call(
                conn,
                m,
                {

                    conn,

                    usedPrefix,
                    noPrefix,

                    args,
                    command,
                    text,

                    chat,
                    user,

                    isROwner,
                    isAdmin,
                    isBotAdmin,
                    isSelf,

                    participants,

                    settings:
                    conn.settings || {}

                }
            )

        } catch (err) {

            console.log(
                chalk.red(
                    `[ COMMAND ERROR ] ${command}`
                )
            )

            console.error(err)

        }

        /* =========================================
           💾 SAVE CACHE
        ========================================= */

        if (
            user &&
            global.userCache
        ) {

            global.userCache.set(
                realSenderId,
                user
            )

        }

    } catch (err) {

        console.log(
            chalk.red(
                '[ MESSAGE HANDLER ERROR ]'
            )
        )

        console.error(err)

    }

}

/* =========================================
   ❌ FAIL MESSAGES
========================================= */

global.dfail = (
    type,
    m,
    conn,
    cost
) => {

    const messages = {

        rowner:
        '⚠️ Solo el creador puede usar este comando.',

        owner:
        '⚠️ Solo el creador puede usar este comando.',

        group:
        '⚠️ Este comando solo funciona en grupos.',

        private:
        '⚠️ Este comando solo funciona en privado.',

        admin:
        '⚠️ Solo administradores pueden usar esto.',

        botAdmin:
        '⚠️ Necesito ser administrador.',

        nsfw:
        '⚠️ NSFW está desactivado.',

        col:
        `⚠️ Necesitas ${cost} Col.`,

        self:
        '⚠️ Comando exclusivo del host.'

    }

    if (
        messages[type] &&
        m?.chat
    ) {

        conn.reply(
            m.chat,
            messages[type],
            m
        ).catch(() => null)

    }

}

/* =========================================
   🔄 AUTO RELOAD
========================================= */

watchFile(
    __filename,
    async () => {

        unwatchFile(__filename)

        console.log(
            chalk.yellowBright(
                `[ UPDATE ] ${path.basename(__filename)}`
            )
        )

        try {

            await import(
                `${pathToFileURL(__filename).href}?update=${Date.now()}`
            )

        } catch (err) {

            console.error(err)

        }

    }
)
