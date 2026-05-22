import { jidNormalizedUser } from '@whiskeysockets/baileys';

class CacheManager {
    constructor() {

        if (!global.groupCache) global.groupCache = new Map();
        if (!global.cacheTimestamps) global.cacheTimestamps = new Map();

        this.cache = global.groupCache;
        this.timestamps = global.cacheTimestamps;

        this.ttl = 30 * 60 * 1000;

        this._initCleaner();
    }

    /* =========================
       CLEANER (SAFE SINGLE INSTANCE)
    ========================= */
    _initCleaner() {
        if (global.__cacheCleanerStarted) return;

        global.__cacheCleanerStarted = true;

        setInterval(() => {
            const now = Date.now();

            for (const [jid, last] of this.timestamps.entries()) {
                if (!last || now - last > this.ttl) {
                    this.cache.delete(jid);
                    this.timestamps.delete(jid);
                }
            }
        }, 5 * 60 * 1000);
    }

    /* =========================
       TOUCH (UNIFICA REFRESH)
    ========================= */
    _touch(jid) {
        if (!jid) return;
        this.timestamps.set(jid, Date.now());
    }

    /* =========================
       GET CACHE
    ========================= */
    async get(conn, jid, force = false) {
        if (!jid || !jid.endsWith('@g.us')) return {};

        if (!force && this.cache.has(jid)) {
            this._touch(jid);
            return this.cache.get(jid);
        }

        try {
            const data = await conn.groupMetadata(jid).catch(() => null);

            if (data?.id) {
                this.cache.set(jid, data);
                this._touch(jid);
                return data;
            }

            return this.cache.get(jid) || {};
        } catch {
            return this.cache.get(jid) || {};
        }
    }

    /* =========================
       UPDATE PARTICIPANTS
    ========================= */
    updateParticipants(jid, participants) {
        if (!jid || !participants) return;

        const data = this.cache.get(jid) || { id: jid };
        data.participants = participants;

        this.cache.set(jid, data);
        this._touch(jid);
    }

    /* =========================
       DELETE CACHE
    ========================= */
    delete(jid) {
        this.cache.delete(jid);
        this.timestamps.delete(jid);
    }

    /* =========================
       ADMIN CHECK (OPTIMIZED)
    ========================= */
    getAdminStatus(jid, userJid, authorJid = null) {
        const data = this.cache.get(jid);
        if (!data?.participants) return false;

        this._touch(jid);

        const normUser = jidNormalizedUser(userJid);
        const normAuthor = authorJid ? jidNormalizedUser(authorJid) : null;

        return data.participants.some(p => {
            const pid = jidNormalizedUser(p.id);
            const lid = p.lid ? jidNormalizedUser(p.lid) : null;

            return (
                pid === normUser ||
                (normAuthor && pid === normAuthor) ||
                (lid && lid === normUser)
            ) && (p.admin || p.isCommunityAdmin);
        });
    }
}

export const cacheManager = new CacheManager();
