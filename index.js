/* =========================================
   ⚔️ GUERRA BOT MD — FINAL STABLE CORE
   Powered by Kevin Guerra
========================================= */

import './config.js'

import fs, {
    existsSync,
    mkdirSync,
    watch,
    promises as fsP
} from 'fs'

import path, {
    join,
    basename
} from 'path'

import readline from 'readline'

import chalk from 'chalk'
import pino from 'pino'
import cfonts from 'cfonts'
import mongoose from 'mongoose'
import NodeCache from 'node-cache'

import { Worker } from 'worker_threads'

import {
    makeWASocket,
    DisconnectReason,
    fetchLatestBaileysVersion,
    makeCacheableSignalKeyStore,
    Browsers
} from '@whiskeysockets/baileys'

import { Boom } from '@hapi/boom'

import {
    pathToFileURL
} from 'url'

import useSQLiteAuthState from './lib/auth.js'
import { database, User } from './lib/db.js'
import { smsg } from './lib/serializer.js'

/* =========================================
   ⚙️ BOT SETTINGS
========================================= */

global.BOT = {
    name: 'GUERRA BOT MD',
    owner: 'Kevin Guerra',
    version: '11.0.0',
    prefix: '.',
    mode: 'PUBLIC'
}

/* =========================================
   📦 DATABASE
========================================= */

const MONGO_URI =
'mongodb+srv://guerraroncancio_db_user:n5dYIEOo8T4iP2cd@cluster0.zkkz8qa.mongodb.net/bot?retryWrites=true&w=majority'

/* =========================================
   📁 CREATE FOLDERS
========================================= */

const folders = [
    './sessions',
    './tmp',
    './plugins',
    './lib'
]

for (const folder of folders) {

    if (!existsSync(folder)) {

        mkdirSync(folder, {
            recursive: true
        })

    }

}

/* =========================================
   🧠 GLOBALS
========================================= */

global.plugins = new Map()
global.aliases = new Map()

global.commandCache = new NodeCache({
    stdTTL: 60,
    checkperiod: 120,
    useClones: false
})

/* =========================================
   🔇 LOGGER
========================================= */

const logger = pino({
    level: 'silent'
})

/* =========================================
   🛡️ ERROR HANDLER
========================================= */

process.removeAllListeners('warning')

process.on('uncaughtException', (err) => {

    const msg = String(err)

    if (
        msg.includes('Connection Closed') ||
        msg.includes('Timed Out') ||
        msg.includes('Bad MAC') ||
        msg.includes('decrypt')
    ) return

    console.error(err)

})

process.on('unhandledRejection', (reason) => {

    const msg = String(reason)

    if (
        msg.includes('Connection Closed') ||
        msg.includes('Timed Out') ||
        msg.includes('Bad MAC') ||
        msg.includes('decrypt')
    ) return

    console.error(reason)

})

/* =========================================
   🎨 TERMINAL UI
========================================= */

console.clear()

cfonts.say('GUERRA BOT', {
    font: 'block',
    align: 'center',
    gradient: ['cyan', 'blue']
})

console.log(
chalk.cyanBright(`
╔══════════════════════════════════════╗
║           ⚔️ GUERRA BOT ⚔️           ║
╠══════════════════════════════════════╣
║ OWNER   : ${global.BOT.owner}
║ VERSION : ${global.BOT.version}
║ MODE    : ${global.BOT.mode}
║ PREFIX  : ${global.BOT.prefix}
╚══════════════════════════════════════╝
`)
)

/* =========================================
   ☁️ DATABASE
========================================= */

try {

    await database.connect(MONGO_URI)

    global.db = mongoose.connection.db
    global.User = User

    console.log(
chalk.greenBright(`
[ ✓ ] DATABASE CONNECTED
`)
    )

} catch (err) {

    console.log(
chalk.redBright(`
[ X ] DATABASE ERROR
`)
    )

    console.error(err)

}

/* =========================================
   📲 AUTH
========================================= */

const sessionFile =
'./sessions/main.sqlite'

const {
    state,
    saveCreds
} = useSQLiteAuthState(sessionFile)

/* =========================================
   🔥 BAILEYS VERSION
========================================= */

const {
    version
} = await fetchLatestBaileysVersion()

/* =========================================
   ⚡ CONNECTION OPTIONS
========================================= */

const msgRetryCounterCache =
new NodeCache()

const connectionOptions = {

    version,

    logger,

    printQRInTerminal: false,

    browser: Browsers.macOS('Chrome'),

    auth: {
        creds: state.creds,
        keys: makeCacheableSignalKeyStore(
            state.keys,
            logger
        )
    },

    markOnlineOnConnect: false,

    syncFullHistory: false,

    connectTimeoutMs: 60000,

    defaultQueryTimeoutMs: 60000,

    keepAliveIntervalMs: 15000,

    msgRetryCounterCache
}

/* =========================================
   🔄 RECONNECT CONTROL
========================================= */

let isStarting = false
let reconnectAttempts = 0
const MAX_RECONNECT = 10

/* =========================================
   📩 MESSAGE HANDLER
========================================= */

async function loadHandler() {

    try {

        const file =
        path.resolve('./lib/message.js')

        const module =
        await import(
            pathToFileURL(file).href +
            `?update=${Date.now()}`
        )

        global.messageHandler =
        module.message ||
        module.default?.message ||
        module.default

        console.log(
chalk.greenBright(`
[ ✓ ] MESSAGE HANDLER LOADED
`)
        )

    } catch (err) {

        console.error(err)

    }

}

await loadHandler()

watch(
    path.resolve('./lib/message.js'),
    loadHandler
)

/* =========================================
   🔌 PLUGINS
========================================= */

async function readPlugins(folder) {

    const files =
    await fsP.readdir(folder)

    for (const filename of files) {

        const file =
        join(folder, filename)

        const stat =
        await fsP.stat(file)

        if (stat.isDirectory()) {

            await readPlugins(file)

        } else if (filename.endsWith('.js')) {

            try {

                const module =
                await import(
                    pathToFileURL(
                        path.resolve(file)
                    ).href +
                    `?update=${Date.now()}`
                )

                const plugin =
                module.default || module

                const name =
                plugin.name ||
                basename(filename, '.js')

                global.plugins.set(
                    name,
                    plugin
                )

            } catch (err) {

                console.log(
chalk.redBright(`
[ X ] ERROR LOADING PLUGIN:
${filename}
`)
                )

                console.error(err)

            }

        }

    }

}

await readPlugins('./plugins')

console.log(
chalk.magentaBright(`
╔══════════════════════════════════════╗
║         SYSTEM INITIALIZED          ║
╚══════════════════════════════════════╝
`)
)

/* =========================================
   🚀 START BOT
========================================= */

async function startBot() {

    if (isStarting) return

    isStarting = true

    try {

        global.conn =
        makeWASocket(connectionOptions)

        /* =========================================
           🔐 PAIR CODE
        ========================================= */

        if (!state.creds.registered) {

            const rl =
            readline.createInterface({
                input: process.stdin,
                output: process.stdout
            })

            const ask = (text) =>
            new Promise((resolve) =>
                rl.question(text, resolve)
            )

            console.log(
chalk.yellowBright(`
╔══════════════════════════════════════╗
║       WHATSAPP LINK REQUIRED        ║
╚══════════════════════════════════════╝
`)
            )

            let phoneNumber =
            await ask(
chalk.cyanBright(`
┃ ENTER YOUR NUMBER
┃ Example: 573001112233
┃ ➤ `)
            )

            phoneNumber =
            phoneNumber.replace(/\D/g, '')

            rl.close()

            const code =
            await global.conn.requestPairingCode(
                phoneNumber
            )

            console.log(
chalk.greenBright(`
╔══════════════════════════════════════╗
║         LINK CODE READY             ║
╠══════════════════════════════════════╣
║  ${code.match(/.{1,4}/g).join('-')}
╚══════════════════════════════════════╝
`)
            )

        }

        /* =========================================
           💾 SAVE CREDS
        ========================================= */

        global.conn.ev.on(
            'creds.update',
            saveCreds
        )

        /* =========================================
           💬 MESSAGE EVENT
        ========================================= */

        global.conn.ev.on(
            'messages.upsert',
            async (chatUpdate) => {

                try {

                    const msg =
                    chatUpdate.messages?.[0]

                    if (!msg?.message) return

                    const m =
                    await smsg(
                        global.conn,
                        msg
                    )

                    if (global.messageHandler) {

                        await global.messageHandler.call(
                            global.conn,
                            m,
                            chatUpdate
                        )

                    }

                } catch (err) {

                    if (
                        !String(err)
                        .includes('decrypt')
                    ) {

                        console.error(err)

                    }

                }

            }
        )

        /* =========================================
           📡 CONNECTION UPDATE
        ========================================= */

        global.conn.ev.on(
            'connection.update',
            async (update) => {

                const {
                    connection,
                    lastDisconnect
                } = update

                if (connection === 'connecting') {

                    console.log(
chalk.yellowBright(`
[ ⚡ ] CONNECTING...
`)
                    )

                }

                if (connection === 'open') {

                    reconnectAttempts = 0

                    console.log(
chalk.greenBright(`
╔══════════════════════════════════════╗
║        WHATSAPP CONNECTED           ║
╠══════════════════════════════════════╣
║ STATUS : ONLINE
╚══════════════════════════════════════╝
`)
                    )

                }

                if (connection === 'close') {

                    const reason =
                    new Boom(
                        lastDisconnect?.error
                    )?.output?.statusCode

                    console.log(
chalk.redBright(`
[ X ] CONNECTION CLOSED
`)
                    )

                    if (
                        reason ===
                        DisconnectReason.loggedOut
                    ) {

                        console.log(
chalk.redBright(`
╔══════════════════════════════════════╗
║         SESSION EXPIRED             ║
╠══════════════════════════════════════╣
║ DELETE:
║ ./sessions/main.sqlite
║
║ THEN RESTART BOT
╚══════════════════════════════════════╝
`)
                        )

                        process.exit(1)

                    }

                    if (
                        reconnectAttempts >=
                        MAX_RECONNECT
                    ) {

                        console.log(
chalk.redBright(`
[ X ] MAX RECONNECT LIMIT
`)
                        )

                        process.exit(1)

                    }

                    reconnectAttempts++

                    console.log(
chalk.yellowBright(`
[ ⚡ ] RECONNECTING...
`)
                    )

                    isStarting = false

                    setTimeout(async () => {

                        try {

                            await startBot()

                        } catch (err) {

                            console.error(err)

                        }

                    }, 5000)

                }

            }
        )

    } catch (err) {

        console.error(err)

    }

    isStarting = false

}

/* =========================================
   🧵 WORKERS
========================================= */

global.workerMedia =
new Worker(
    new URL(
        './lib/workers/mediaWorker.js',
        import.meta.url
    )
)

/* =========================================
   🚀 START
========================================= */

await startBot()
