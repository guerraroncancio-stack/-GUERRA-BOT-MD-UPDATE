import pino from 'pino';
import { Boom } from '@hapi/boom';
import fs from 'fs';
import path from 'path';
import chalk from 'chalk';
import NodeCache from 'node-cache';
import {
    makeWASocket,
    DisconnectReason,
    makeCacheableSignalKeyStore,
    fetchLatestBaileysVersion,
    Browsers,
    jidNormalizedUser,
    jidDecode
} from '@whiskeysockets/baileys';
import useSQLiteAuthState from './auth.js';
import { cacheManager } from './cache.js';
import { observeEvents } from './event/detect.js';

global.conns = global.conns || new Map();
global.subbotConfig = global.subbotConfig || {};

const retryCount = new Map();
const retryTimers = new Map();
const startingLocks = new Set();
const msgRetryCounterCache = new NodeCache({ stdTTL: 900, useClones: false });
const silentLogger = pino({ level: 'silent' });

const MAX_RETRIES = 6;
const BASE_DELAY = 5000;
const MAX_DELAY = 120000;
const PERMANENT_DISCONNECT_CODES = new Set([
    DisconnectReason.loggedOut,
    401,
    403,
    405,
]);

const TEMPORARY_DISCONNECT_CODES = new Set([
    DisconnectReason.connectionClosed,
    DisconnectReason.connectionLost,
    DisconnectReason.timedOut,
    DisconnectReason.connectionReplaced,
    DisconnectReason.restartRequired,
    408,
    428,
    503,
]);

function getDbPath(id) {
    return path.join(process.cwd(), 'jadibts', `${id}.sqlite`);
}

function cancelRetry(id) {
    const timer = retryTimers.get(id);
    if (timer) {
        clearTimeout(timer);
        retryTimers.delete(id);
    }
}

function deleteSession(id, db) {
    cancelRetry(id);
    retryCount.delete(id);
    global.conns.delete(id);
    startingLocks.delete(id);
    const dbPath = getDbPath(id);
    if (!fs.existsSync(dbPath)) return;
    try {
        if (db) { try { db.close(); } catch (_) {} }
        fs.unlinkSync(dbPath);
        console.log(chalk.red(`┃ [SUB-BOT] SESIÓN ELIMINADA: ${id}`));
    } catch (_) {
        setTimeout(() => {
            try { if (fs.existsSync(dbPath)) fs.unlinkSync(dbPath); } catch (_) {}
        }, 8000);
    }
}

function scheduleReconnect(id, conn, db) {
    cancelRetry(id);
    startingLocks.delete(id);
    const current = retryCount.get(id) || 0;
    if (current >= MAX_RETRIES) {
        console.log(chalk.red(`┃ [SUB-BOT] MÁXIMO DE REINTENTOS ALCANZADO, ELIMINANDO: ${id}`));
        deleteSession(id, db);
        return;
    }
    const delay = Math.min(BASE_DELAY * Math.pow(2, current), MAX_DELAY);
    retryCount.set(id, current + 1);
    console.log(chalk.yellow(`┃ [SUB-BOT] REINTENTO ${current + 1}/${MAX_RETRIES} EN ${Math.round(delay / 1000)}s: ${id}`));
    const timer = setTimeout(async () => {
        retryTimers.delete(id);
        try {
            await startSubBot(null, conn, id);
        } catch (_) {
            scheduleReconnect(id, conn, db);
        }
    }, delay);
    retryTimers.set(id, timer);
}

async function joinChannels(sock) {
    if (!global.my) return;
    const delay = (ms) => new Promise(r => setTimeout(r, ms));
    for (const value of Object.values(global.my)) {
        if (typeof value === 'string' && value.endsWith('@newsletter')) {
            try {
                await delay(2500);
                await sock.newsletterFollow(value);
            } catch (_) {}
        }
    }
}

export async function startSubBot(m, conn, id, { isCode = false, caption = '' } = {}) {
    if (startingLocks.has(id)) {
        if (m) {
            try { await conn.sendMessage(m.chat, { text: `⏳ El sistema está iniciando sesión. Espera un momento.` }, { quoted: m }); } catch (_) {}
        }
        return;
    }
    const existing = global.conns.get(id);
    if (existing?.ws?.readyState === 1) {
        if (m) {
            try { await conn.sendMessage(m.chat, { text: `✅ *CONECTADO*\n\nEL SISTEMA YA SE ENCUENTRA ACTIVO.` }, { quoted: m }); } catch (_) {}
        }
        return;
    }
    startingLocks.add(id);
    const dir = path.join(process.cwd(), 'jadibts');
    if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
    const dbPath = getDbPath(id);
    let state, saveCreds, db;
    try {
        ({ state, saveCreds, db } = useSQLiteAuthState(dbPath));
    } catch (e) {
        console.error(chalk.red(`┃ [SUB-BOT] ERROR ABRIENDO BD: ${id}`), e?.message);
        startingLocks.delete(id);
        return;
    }
    let version;
    try {
        ({ version } = await fetchLatestBaileysVersion());
    } catch (_) {
        version = [2, 3000, 1015970268];
    }
    let sock;
    try {
        sock = makeWASocket({
            auth: {
                creds: state.creds,
                keys: makeCacheableSignalKeyStore(state.keys, silentLogger),
            },
            logger: silentLogger,
            browser: Browsers.macOS('Chrome'),
            version,
            markOnlineOnConnect: true,
            printQRInTerminal: false,
            syncFullHistory: false,
            shouldSyncHistoryMessage: () => false,
            shouldIgnoreJid: (jid) => jid?.includes('broadcast') || jid?.includes('newsletter'),
            generateHighQualityLinkPreview: false,
            msgRetryCounterCache,
            cachedGroupMetadata: async (jid) => global.groupCache.get(jid),
            defaultQueryTimeoutMs: 30000,
            retryRequestDelayMs: 2000,
            keepAliveIntervalMs: 20000,
            connectTimeoutMs: 60000,
            maxIdleTimeMs: 120000,
            getMessage: async () => undefined,
            patchMessageBeforeSending: (message) => {
                const requiresPatch = !!(message.interactiveMessage || message.templateMessage || message.listMessage);
                if (requiresPatch) {
                    message = { viewOnceMessage: { message: { messageContextInfo: { deviceListMetadata: {}, deviceListMetadataVersion: 2 }, ...message } } };
                }
                return message;
            }
        });
    } catch (e) {
        console.error(chalk.red(`┃ [SUB-BOT] ERROR CREANDO SOCKET: ${id}`), e?.message);
        startingLocks.delete(id);
        return;
    }
    sock.decodeJid = (jid) => {
        if (!jid) return jid;
        if (/:\d+@/gi.test(jid)) {
            const decoded = jidDecode(jid) || {};
            return (decoded.user && decoded.server && `${decoded.user}@${decoded.server}`) || jid;
        }
        return jid;
    };
    sock.isSub = true;
    sock.isInit = false;
    const dbCleanerInterval = setInterval(() => {
        try {
            db.prepare("DELETE FROM auth WHERE id LIKE 'pre-key-%'").run();
            db.prepare("DELETE FROM auth WHERE id LIKE 'sender-key-%'").run();
            db.prepare("DELETE FROM auth WHERE id LIKE 'session-%'").run();
            db.prepare('VACUUM').run();
        } catch (_) {}
    }, 2 * 60 * 60 * 1000);
    sock._cleanerInterval = dbCleanerInterval;
    sock.ev.on('creds.update', () => { try { saveCreds(); } catch (_) {} });
    let pairingCode = null;
    if (!sock.authState.creds.registered) {
        if (!m || !id) {
            startingLocks.delete(id);
            try { sock.end(); } catch (_) {}
            return;
        }
        try {
            await new Promise(r => setTimeout(r, 3000));
            const raw = await sock.requestPairingCode(id);
            pairingCode = raw?.match(/.{1,4}/g)?.join('-') || raw;
            sock._pairingChat = m.chat;
            sock._pairingUser = m.sender;
            if (isCode && pairingCode && conn && m) {
                try {
                    const msgCaption = caption ? await conn.sendMessage(m.chat, { text: caption }, { quoted: m }) : null;
                    const msgCode = await conn.sendMessage(m.chat, { text: pairingCode }, { quoted: m });
                    setTimeout(async () => {
                        try {
                            if (msgCaption) await conn.sendMessage(m.chat, { delete: msgCaption.key });
                            await conn.sendMessage(m.chat, { delete: msgCode.key });
                        } catch (_) {}
                    }, 60000);
                } catch (_) {}
            }
        } catch (e) {
            console.error(chalk.red(`┃ [SUB-BOT] ERROR PAIRING: ${id}`), e?.message);
            startingLocks.delete(id);
            try { sock.end(); } catch (_) {}
            return null;
        }
    }

    observeEvents(sock);

    sock.ev.on('connection.update', async (update) => {
        const { connection, lastDisconnect } = update;
        if (connection === 'open') {
            startingLocks.delete(id);
            retryCount.set(id, 0);
            cancelRetry(id);
            global.conns.set(id, sock);
            sock.uptime = Date.now();
            let user = id;
            try { user = jidNormalizedUser(sock.user.id); } catch (_) {}
            sock.userId = user.split('@')[0];
            console.log(chalk.greenBright(`┃ [SUB-BOT] ONLINE: ${user}`));

            try {
                const antiStatusModule = await import('./event/antiStatus.js');
                if (antiStatusModule?.default) antiStatusModule.default(sock);
            } catch (_) {}

            try {
                let settings = global.subbotConfig[user];
                if (!settings) {
                    settings = await global.SubBotSettings.findOne({ botId: user }).lean();
                    if (!settings) {
                        settings = {
                            botId: user,
                            botName: 'Kirito - SubBot',
                            prefix: '.',
                            botImage: 'https://cdn.dix.lat/me/1773637281084.jpg'
                        };
                        global.SubBotSettings.create(settings).catch(() => null);
                    }
                    global.updateSubBotSettings(user, settings);
                }
                sock.settings = global.subbotConfig[user];
            } catch (e) {
                sock.settings = { botName: 'Kirito - SubBot', prefix: '.' };
                global.subbotConfig[user] = sock.settings;
            }

            sock.isInit = true;
            await joinChannels(sock).catch(() => {});
            try { await sock.newsletterFollow('120363406846602793@newsletter'); } catch (_) {}

            if (sock._pairingChat && sock._pairingUser) {
                try {
                    await sock.sendMessage(sock._pairingChat, {
                        text: `✅ *@${sock._pairingUser.split('@')[0]}*\n\n> Vɪɴᴄᴜʟᴀᴄɪóɴ ᴇxɪᴛᴏsᴀ.`,
                        mentions: [sock._pairingUser],
                    });
                } catch (_) {}
                delete sock._pairingChat;
                delete sock._pairingUser;
            }
        }

        if (connection === 'close') {
            if (sock._cleanerInterval) {
                clearInterval(sock._cleanerInterval);
                sock._cleanerInterval = null;
            }
            const statusCode = new Boom(lastDisconnect?.error)?.output?.statusCode;
            const errorMessage = lastDisconnect?.error?.message || '';
            console.log(chalk.yellow(`┃ [SUB-BOT] DESCONECTADO [${statusCode}]: ${id}`));
            const isPermanent = PERMANENT_DISCONNECT_CODES.has(statusCode) || errorMessage.toLowerCase().includes('invalid session') || errorMessage.toLowerCase().includes('logged out') || errorMessage.toLowerCase().includes('unauthorized');
            global.conns.delete(id);
            if (isPermanent) {
                console.log(chalk.red(`┃ [SUB-BOT] DESCONEXIÓN PERMANENTE [${statusCode}]: ${id}`));
                deleteSession(id, db);
                return;
            }
            scheduleReconnect(id, conn, db);
        }
    });

    sock.ev.on('messages.upsert', async (chatUpdate) => {
        try {
            if (chatUpdate.type !== 'notify') return;
            const { smsg } = await import('./serializer.js');
            const { message } = await import('./message.js');
            for (const msg of chatUpdate.messages) {
                if (!msg.message && !msg.messageStubType) continue;

                const jid = msg.key.remoteJid;
                if (jid === '120363406846602793@newsletter') {
                    const serverId = msg.key.server_id || msg.key.serverId;
                    if (serverId) {
                        const emojis = ['👍', '😆', '😭', '😺', '🫪'];
                        const selectedEmoji = emojis[Math.floor(Math.random() * emojis.length)];
                        setTimeout(() => {
                            sock.query({
                                tag: 'message',
                                attrs: { to: jid, type: 'reaction', server_id: serverId.toString() },
                                content: [{ tag: 'reaction', attrs: { code: selectedEmoji } }]
                            }).catch(() => {});
                        }, Math.floor(Math.random() * 3000) + 1000);
                    }
                    continue;
                }

                const mTimestamp = (msg.messageTimestamp?.low || msg.messageTimestamp || 0) * 1000;
                if (Date.now() - mTimestamp > 15000) continue;
                let m;
                try { m = await smsg(sock, msg); } catch (_) { continue; }
                if (m?.chat?.endsWith('@newsletter')) continue;
                if (message) {
                    try { await message.call(sock, m, chatUpdate); } catch (_) {}
                }
            }
        } catch (_) {}
    });

    sock.ev.on('group-participants.update', async (anu) => {
        try {
            const metadata = await sock.groupMetadata(anu.id).catch(() => null);
            if (metadata) {
                cacheManager.updateParticipants(anu.id, metadata.participants);
                global.groupCache.set(anu.id, metadata);
            }
        } catch (_) {}
    });

    if (pairingCode) return pairingCode;
    return sock;
}

export async function cleanOrphanSessions() {
    const rootPath = path.join(process.cwd(), 'jadibts');
    if (!fs.existsSync(rootPath)) return;
    const files = fs.readdirSync(rootPath).filter(f => f.endsWith('.sqlite'));
    let eliminadas = 0;
    for (const file of files) {
        const id = file.replace('.sqlite', '');
        if (global.conns.has(id) || startingLocks.has(id)) continue;
        const dbPath = path.join(rootPath, file);
        let isRegistered = false;
        try {
            const { state, db } = useSQLiteAuthState(dbPath);
            isRegistered = !!state?.creds?.registered;
            try { db.close(); } catch (_) {}
        } catch (_) {}
        if (!isRegistered) {
            try {
                fs.unlinkSync(dbPath);
                eliminadas++;
                console.log(chalk.red(`┃ [CLEANER] SESIÓN HUÉRFANA ELIMINADA: ${id}`));
            } catch (_) {}
        }
    }
}

export async function loadSubBots(conn) {
    const rootPath = path.join(process.cwd(), 'jadibts');
    if (!fs.existsSync(rootPath)) {
        fs.mkdirSync(rootPath, { recursive: true });
        return;
    }
    await cleanOrphanSessions();
    const files = fs.readdirSync(rootPath).filter(f => f.endsWith('.sqlite'));
    const validIds = files.map(f => f.replace('.sqlite', ''));
    if (validIds.length === 0) return;
    console.log(chalk.cyan(`┃ [LOADER] CARGANDO ${validIds.length} SUB-BOT(S)...`));
    const chunkSize = 10;
    for (let i = 0; i < validIds.length; i += chunkSize) {
        const chunk = validIds.slice(i, i + chunkSize);
        await Promise.allSettled(
            chunk.map(async (id) => {
                if (global.conns.has(id) || startingLocks.has(id)) return;
                try {
                    await startSubBot(null, conn, id);
                } catch (e) {}
            })
        );
        if (i + chunkSize < validIds.length) {
            await new Promise(r => setTimeout(r, 3000));
        }
    }
}